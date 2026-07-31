---
layout: ../layouts/AboutLayout.astro
title: "About Me"
---

## Who I Am

I am **Jameel Ahmad**, a **full-stack developer** based in Gujranwala, Punjab, Pakistan. I am currently a **Freelance Full-Stack Developer at [Innovorus](https://www.innovorus.com/)** (Apr 2025 – present), where I own full-stack development end to end — architecture, backend, database, and deployment — for client web projects at a small studio, working alongside a designer partner who handles client acquisition and UI design.

I hold a **Bachelor of Computer Science** from **GIFT University** (2021–2025) with a **CGPA of 3.8/4.0**.

## Contact

- **Email:** [jameel@jnzlab.io](mailto:jameel@jnzlab.io)
- **Phone:** +92 349 7660082
- **Location:** Gujranwala, Punjab, Pakistan
- **Website:** [jnzlab.io](https://jnzlab.io/)
- **LinkedIn:** [linkedin.com/in/jnzlab](https://linkedin.com/in/jnzlab)
- **GitHub:** [github.com/jnzlab](https://github.com/jnzlab)

## Education

**Bachelor of Computer Science**, GIFT University — 2021–2025

CGPA: **3.8/4.0**

## Experience

### Freelance Full-Stack Developer — [Innovorus](https://www.innovorus.com/)

*Remote · Sialkot, Punjab · Apr 2025 – Present*

- Own full-stack development end to end for client web projects at a small studio — architecture, backend, database, and deployment.
- Work alongside a designer partner who handles client acquisition and UI design.

## Projects

### [LucidHire](https://lucidhire.io) — AI-Powered Candidate Screening Platform

Architected and deployed an AI candidate-screening platform on **Vercel** using **Next.js 16**, **Drizzle ORM** on **Neon Postgres** with **pgvector**, and **Google Gemini** via the **Vercel AI SDK** for structured data extraction and semantic search. Built a hybrid ranking pipeline combining HNSW-indexed vector similarity search (768-dim embeddings) with LLM re-ranking, narrowing the candidate pool to a top-20 shortlist before scoring, and a 6-stage async CV processing pipeline with **Trigger.dev** streaming real-time status via **Server-Sent Events**. Implemented multi-tenant architecture with **Clerk** auth, org-scoped RBAC, and plan-based usage enforcement.

### [Pouch Parlour](https://pouchparlour.com) — E-Commerce Storefront for Phone Covers & Keychains

Built and deployed a full-stack e-commerce platform on **Cloudflare Workers** (via **OpenNext**) with **Next.js 16**, **Drizzle ORM** on **Cloudflare D1**, and **Cloudflare R2** for image storage. Designed a guest-first checkout flow with post-signup account linking that backfills guest orders to a Clerk account by matching normalized email, and snapshot-based order records that keep order history immutable after catalog edits. Built an admin dashboard with real-time analytics, low-stock alerts, and full CRUD for products, brands, and orders, gated by Clerk-based role middleware. Offloaded image processing to a dedicated Cloudflare Worker using **Photon (Rust/WASM)** for resizing and dual JPEG/WebP encoding, connected via a **Service Binding**, cutting a sample 3.9 MB upload to ~314 KB (~92% smaller) while capping the longest side at 2000px with Lanczos3 resampling.

### [easy-ytdlp](https://www.npmjs.com/package/@jnzlab/easy-ytdlp) — CLI Tool for Simplified Media Downloads

Built and published a **TypeScript** CLI tool that wraps yt-dlp with an interactive, plain-English question flow, removing the need to memorize CLI flags or install Python. Designed a pure-function flag-building layer that deterministically translates user answers into yt-dlp arguments, shared by both the interactive wizard and a non-interactive flag-driven mode, plus a self-contained binary distribution system that auto-downloads the correct platform binary from GitHub Releases with atomic file replacement. Solved YouTube's JavaScript-challenge (EJS) blocking by building a Node runtime discovery layer that scans nvm installations, and engineered a progress bar that correctly handles YouTube's multi-fragment DASH streams without freezing. Published and maintained on npm.

### [Hafiz Chaska Point](https://hafizchaskapoint.vercel.app) — Live Shop-Status Microsite (Production)

Built and deployed a live-status site for a local business, letting customers check in real time whether the shop is open. Designed a two-layer status system: Server Components render status via a 5-second revalidating cache for flash-free SSR, while the client polls with **SWR** for near-real-time updates, with optimistic UI in the admin panel and automatic rollback on failed requests. Implemented a PIN-based admin authorization system using constant-time comparison and IP rate limiting, and **Web Push** notifications (VAPID) with automatic cleanup of dead subscriptions.

## Skills

| Area | Technologies |
|------|--------------|
| **Languages & Frameworks** | TypeScript, Next.js (App Router, Server Components, Server Actions), React, Node.js |
| **Frontend** | Tailwind CSS, shadcn/ui, SWR |
| **Backend & Data** | Drizzle ORM, REST API routes, PostgreSQL (Neon, pgvector), Cloudflare D1, Upstash Redis |
| **Auth** | Clerk (RBAC) |
| **AI Integration** | Vercel AI SDK, Google Gemini API |
| **Cloud & Infrastructure** | Vercel, Cloudflare Workers (OpenNext), Cloudflare R2, Service Bindings, Trigger.dev |
| **Tools** | Git, GitHub, Figma, Notion |

## Open Source

- **Neon** — [PR #3099](https://github.com/neondatabase/website/pull/3099), [PR #3100](https://github.com/neondatabase/website/pull/3100) (both merged): fixed a function name inconsistency in the Clerk+Neon auth integration docs and a broken import path causing runtime errors.

- **Clerk** — [PR #2434](https://github.com/clerk/clerk-docs/pull/2434): documented Clerk's username validation rules for diagnosing silent `422` errors during user creation via the Backend SDK; guidance later incorporated into official docs ([PR #2603](https://github.com/clerk/clerk-docs/pull/2603)).

- **Appwrite** — [PR #1472](https://github.com/appwrite/website/pull/1472) (merged): documentation fix merged into the Appwrite website.

---

*Open to opportunities where I can ship impactful full-stack products and keep growing — especially in AI-augmented workflows and developer tooling.*
