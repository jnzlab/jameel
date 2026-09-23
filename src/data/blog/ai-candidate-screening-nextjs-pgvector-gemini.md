---
title: AI Candidate Screening with Next.js, pgvector and Gemini
author: Jameel Ahmad
pubDatetime: 2026-09-23T00:00:00Z
slug: ai-candidate-screening-nextjs-pgvector-gemini
featured: false
draft: true
tags:
  - nextjs
  - ai
  - pgvector
  - postgresql
  - clerk
  - typescript
description: How I built LucidHire's AI candidate screening pipeline with Next.js, pgvector HNSW search, Gemini re-ranking, Trigger.dev jobs and Clerk multi-tenancy.
---

<!-- TODO(author): Review every section before publishing. Code blocks are simplified sketches written for this post, not copied from the LucidHire repo; swap in real snippets if you prefer. -->

I have been building [LucidHire](https://lucidhire.io), an AI candidate screening platform. A recruiter uploads a batch of CVs, describes the role, and gets back a ranked shortlist instead of a pile of PDFs. This post is a build log of how it works under the hood: how CVs become structured data, how search narrows hundreds of candidates down to a shortlist, and how the whole thing stays fast and multi-tenant.

<!-- TODO(author): Add a hero image (e.g. ../../assets/images/lucidhire-architecture.png) and an ogImage in the frontmatter. -->

The stack:

- **Next.js 16** on **Vercel**
- **Drizzle ORM** on **Neon Postgres** with the **pgvector** extension
- **Google Gemini** through the **Vercel AI SDK** for structured extraction and embeddings
- **Trigger.dev** for background jobs, with status streamed to the browser over **Server-Sent Events**
- **Clerk** for auth, organizations and roles
- **Polar** for subscriptions

## Table of contents

## The Problem With "Just Ask the LLM"

The naive version of AI screening is to paste every CV and the job description into one prompt and ask the model to rank them. That breaks down quickly:

- It doesn't scale. Every extra CV makes the prompt bigger, slower and more expensive.
- It isn't repeatable. Ranking a hundred candidates in one shot gives the model a lot of room to be inconsistent.
- It throws away structure. A CV has a name, skills, years of experience and past roles. If you keep that as structured data you can filter and query it like any other table.

So LucidHire splits the job in two. Cheap, deterministic **vector search** does the wide first pass over the whole candidate pool. The expensive **LLM** only sees a short list and does the careful scoring.

## Architecture at a Glance

```text
CV upload
   │
   ▼
Trigger.dev pipeline (6 stages) ──► status events ──► SSE ──► recruiter's browser
   │
   ▼
Neon Postgres
  ├─ structured candidate profile (Drizzle tables)
  └─ 768-dim embedding (pgvector, HNSW index)

Job description
   │
   ▼
embed ──► HNSW vector search ──► top 20 ──► Gemini re-ranking ──► scored shortlist
```

Everything is scoped to a Clerk organization, so one recruiting team never sees another team's candidates.

## Step 1: Turning CVs Into Structured Data

A CV is unstructured text. The first real job is to turn it into a typed profile. The Vercel AI SDK makes this pleasant because you can hand Gemini a Zod schema and get back an object that already matches it.

A simplified sketch of the idea:

```ts
// Simplified sketch, not the production code
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const CandidateProfile = z.object({
  fullName: z.string(),
  email: z.string().email().optional(),
  skills: z.array(z.string()),
  yearsOfExperience: z.number().optional(),
  roles: z.array(
    z.object({ title: z.string(), company: z.string(), summary: z.string() })
  ),
});

export async function extractProfile(cvText: string) {
  const { object } = await generateObject({
    model: google("gemini-model-id"), // TODO(author): real model id
    schema: CandidateProfile,
    prompt: `Extract the candidate profile from this CV:\n\n${cvText}`,
  });
  return object;
}
```

<!-- TODO(author): Which Gemini model(s) do you use for extraction vs. re-ranking? Any lessons about schema design, e.g. fields you had to make optional? -->

## Step 2: Embeddings and pgvector

Once a CV is structured, LucidHire also stores a **768-dimensional embedding** of it in Postgres using pgvector. The same happens for the job description at search time, so "find candidates like this role" becomes "find the nearest vectors".

With Drizzle, the vector column and its index live right next to the rest of the schema. Simplified:

```ts
// Simplified sketch, not the production schema
import { index, pgTable, text, uuid, vector } from "drizzle-orm/pg-core";

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    fullName: text("full_name").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (t) => [
    index("candidates_embedding_hnsw").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops")
    ),
  ]
);
```

### Why HNSW

pgvector can do an exact scan, comparing the query against every row. That is fine for a few hundred vectors and gets slow after that. An **HNSW** (Hierarchical Navigable Small World) index builds a layered graph of vectors so a query can hop towards its nearest neighbours instead of visiting every row. You trade a little recall for a large speed-up, and for a *first pass* that is exactly the right trade: the LLM gets the final say anyway.

<!-- TODO(author): Any HNSW tuning (m, ef_construction, ef_search) or distance metric choices worth mentioning? -->

## Step 3: Hybrid Ranking, Vector Search Then LLM Re-Ranking

This is the heart of the system. Ranking happens in two stages:

1. **Vector search** narrows the organization's whole candidate pool to a **top-20 shortlist** by cosine similarity to the job description.
2. **Gemini re-ranks** only those 20, reading the structured profiles against the role and producing a score and reasoning for each.

A simplified sketch of stage one with Drizzle:

```ts
// Simplified sketch, not the production query
import { and, asc, cosineDistance, eq } from "drizzle-orm";

export async function shortlist(orgId: string, jobEmbedding: number[]) {
  return db
    .select({ id: candidates.id, fullName: candidates.fullName })
    .from(candidates)
    .where(eq(candidates.orgId, orgId))
    .orderBy(asc(cosineDistance(candidates.embedding, jobEmbedding)))
    .limit(20);
}
```

Note that `orgId` is part of the query itself. Tenant scoping is not something to remember later in the UI layer; it belongs in the query that touches the data.

Stage two then passes those 20 profiles to Gemini with a structured output schema (score, strengths, gaps), again using `generateObject`.

The split keeps LLM cost bounded: no matter how many CVs an organization uploads, the re-ranking step only ever sees 20 candidates.

<!-- TODO(author): Why 20? How do you prompt the re-ranker (one call for all 20, or one per candidate)? Any examples of the vector search and LLM disagreeing in useful ways? -->

## Step 4: A 6-Stage Background Pipeline With Trigger.dev

Parsing a CV, extracting structure, embedding it and scoring it takes far longer than an HTTP request should. So CV processing runs as an **async 6-stage pipeline on Trigger.dev**, outside the request/response cycle.

<!-- TODO(author): List the six stages by name, e.g. upload → text extraction → ... , and what each one does. -->

1. TODO(author): stage 1
2. TODO(author): stage 2
3. TODO(author): stage 3
4. TODO(author): stage 4
5. TODO(author): stage 5
6. TODO(author): stage 6

Running each stage as its own step means a failure in, say, the LLM call doesn't throw away the work that came before it, and retries only repeat the step that failed.

## Step 5: Streaming Progress With Server-Sent Events

A recruiter who uploads 50 CVs shouldn't stare at a spinner. LucidHire streams each CV's pipeline status to the browser in real time using **Server-Sent Events**.

SSE is a good fit here: updates only flow one way (server to browser), it runs over plain HTTP, and the browser's `EventSource` reconnects on its own. A simplified route handler looks like this:

```ts
// Simplified sketch, not the production route
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

      const unsubscribe = subscribeToPipelineStatus(send); // app-specific
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

<!-- TODO(author): How does status get from the Trigger.dev tasks to the SSE route (DB polling, Trigger.dev realtime, something else)? Anything that bit you on Vercel with long-lived responses? -->

## Step 6: Multi-Tenancy With Clerk Organizations

LucidHire is multi-tenant: each recruiting team is a **Clerk organization**, and everything (candidates, jobs, usage) belongs to an org. On top of that sit two more layers:

- **Org-scoped RBAC.** Clerk roles decide what a member can do inside their organization.
- **Plan-based usage enforcement.** What an organization can do depends on its subscription plan, which is billed through Polar.

A simplified guard for a route handler:

```ts
// Simplified sketch, not the production code
import { auth } from "@clerk/nextjs/server";

export async function requireOrgRole(role: string) {
  const { userId, orgId, has } = await auth();
  if (!userId || !orgId) throw new Response("Unauthorized", { status: 401 });
  if (!has({ role })) throw new Response("Forbidden", { status: 403 });
  return { userId, orgId };
}
```

<!-- TODO(author): Which roles exist, and what limits does each plan enforce (and where: API route, pipeline, both)? -->

If you are using Clerk and want to test all of this end to end, I wrote up [how I got TestSprite past Clerk auth](/posts/testsprite-nextjs-clerk-auth/), and the Polar side produced its own story: [a silent HTTP 500 in our Polar checkout route](/posts/testsprite-polar-checkout-bug/).

## What I Would Tell Someone Building This

- **Use the LLM last, not first.** Cheap retrieval over everything, expensive reasoning over a few.
- **Store structure, not just text.** Structured extraction up front makes every later step easier.
- **Put tenant scoping in the query.** Don't rely on the UI to hide other organizations' data.
- **Move slow work off the request.** Background jobs plus SSE give users feedback without long-hanging requests.

<!-- TODO(author): Add one or two real lessons or surprises from building LucidHire. -->

If you want an AI feature like this built into your own Next.js product, [I take on freelance work](/hire/).
