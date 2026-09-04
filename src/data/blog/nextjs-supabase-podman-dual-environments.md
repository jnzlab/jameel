---
title: Full-Stack Next.js with Isolated Supabase Environments Using Podman
author: Jameel Ahmad
pubDatetime: 2026-09-04T14:05:00+05:00
slug: nextjs-supabase-podman-dual-environments
featured: true
draft: false
tags:
  - nextjs
  - supabase
  - podman
  - linux
  - postgresql
description: A complete guide to setting up identical local and remote Supabase environments in Next.js using rootless Podman, automated migrations, and zero-risk DB workflows for AI agents.
ogImage: ../../assets/images/nextjs-supabase-podman-dual-environments.png
---

Connecting a local Next.js development server directly to a cloud production database is an accident waiting to happen. One unvetted mutation, a test script that drops a table, or an autonomous AI coding agent hallucinating a destructive `TRUNCATE` query can instantly corrupt your live data.

![Illustration of a Next.js app connecting to a local Podman container and a remote Supabase cloud database](../../assets/images/nextjs-supabase-podman-dual-environments.png)

The ideal architecture separates your environments completely: a rootless, high-performance local database running on your machine with Podman, paired with an exact remote mirror on Supabase Cloud. With separate `.env.development` and `.env.production` files, you can iterate locally with zero network latency, experiment without fear, and deploy schema changes with confidence.

## Table of contents

## Why Dual Isolated Environments Matter

Before touching code, let's establish why this workflow is superior to sharing a hosted staging database:

1. **Total Isolation & Blast Radius Control:** Breaking your local database has zero effect on production. You can drop tables, flood the schema with fake users, or test messy transactions with complete peace of mind.
2. **Deterministic Parity (The Mirror Effect):** Because both environments run PostgreSQL under the exact same Supabase migration and seed pipeline, any query or feature that functions on your local machine is guaranteed to work in production.
3. **The AI Coding Agent Playground:** Modern development frequently incorporates autonomous coding agents (like Cursor, Claude Code, or Codex). Giving an AI tool direct credentials to a remote database introduces network latency and extreme operational risk. With a local Podman instance, agents get sub-millisecond query execution over `localhost` with zero risk of destroying production data.

## Setting Up Podman for Supabase on Fedora

Fedora ships with Podman as its native, daemonless container engine. Because the Supabase CLI is built to communicate with Docker's API socket by default, we configure Podman's rootless Docker-compatible socket.

### 1. Install Podman and the Docker CLI Wrapper

```bash
sudo dnf install -y podman podman-docker
```

### 2. Enable the Rootless Socket

Start the user-level systemd socket listener:

```bash
systemctl --user enable --now podman.socket
```

### 3. Export DOCKER_HOST in Your Shell

Add the socket path to your `~/.bashrc` so development tools can automatically locate Podman:

```bash
echo 'export DOCKER_HOST="unix://${XDG_RUNTIME_DIR:-/run/user/$UID}/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc
```

Verify that the socket is responding:

```bash
curl -s --unix-socket "$XDG_RUNTIME_DIR/podman/podman.sock" http://d/v1.41/version | grep -o '"Version":[^,]*'
```

## Bootstrapping the Next.js Project

Create a new Next.js application using `pnpm` and install the required Supabase client libraries:

```bash
# Create Next.js project
pnpm create next-app@latest nextjs-supabase-dual --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd nextjs-supabase-dual

# Install Supabase dependencies
pnpm add @supabase/supabase-js @supabase/ssr

# Install the Supabase CLI as a dev dependency
pnpm add -D supabase
```

Initialize Supabase in your project root:

```bash
pnpm supabase init
```

This creates a `./supabase` directory containing your project's `config.toml`, seed definitions, and migrations folder.

## Starting the Local Supabase Stack

Fire up the local containerized stack:

```bash
pnpm supabase start
```

Podman will pull and run the necessary containers (Postgres, GoTrue Auth, PostgREST, Kong, and Studio). Once finished, you will receive your local credentials in your terminal:

```text
API URL: [http://127.0.0.1:54321](http://127.0.0.1:54321)
GraphQL URL: [http://127.0.0.1:54321/graphql/v1](http://127.0.0.1:54321/graphql/v1)
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: [http://127.0.0.1:54323](http://127.0.0.1:54323)
Inbucket URL: [http://127.0.0.1:54324](http://127.0.0.1:54324)
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

You can view the Supabase Studio dashboard locally in your browser at `http://127.0.0.1:54323`.

## Configuring Dual Environments

Next.js automatically loads `.env.development` when running `pnpm dev`, and `.env.production` during `pnpm build` and `pnpm start`.

### 1. Create `.env.development`

Populate this file with your local Podman credentials:

```env
# Local Podman Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[http://127.0.0.1:54321](http://127.0.0.1:54321)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_start
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 2. Create `.env.production`

Populate this file with your hosted Supabase Cloud project credentials:

```env
# Hosted Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<your-project-ref>.supabase.co:5432/postgres
```

Make sure `.env.development` and `.env.production` are listed in your `.gitignore` to prevent leaking production secrets.

## Creating the `users` Schema Migration

Rather than manually creating tables in the browser UI, we use version-controlled SQL migrations.

Generate a new migration file:

```bash
pnpm supabase migration new create_users_table
```

This creates an empty SQL file inside `supabase/migrations/`. Open it and add the definition for your public `users` table:

```sql
-- supabase/migrations/<timestamp>_create_users_table.sql

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Allow read access to authenticated/anon users
create policy "Allow public read access" 
  on public.users 
  for select 
  using (true);
```

## Adding Seed Data

Supabase uses `supabase/seed.sql` to populate baseline data. Open `supabase/seed.sql` and add realistic test records:

```sql
-- supabase/seed.sql

insert into public.users (id, full_name, email, role)
values 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ada Lovelace', 'ada@example.com', 'admin'),
  ('b1ffcd88-8d1a-4fe7-aa5c-5cc8ae271b22', 'Alan Turing', 'alan@example.com', 'member'),
  ('c2eedf77-7e2b-4ed6-994b-4bb7bd160c33', 'Margaret Hamilton', 'margaret@example.com', 'member')
on conflict (email) do nothing;
```

## Linking the Remote Hosted Supabase Project

To enable remote deployments, link your local repository with your Supabase Cloud project:

### 1. Authenticate with Supabase

```bash
pnpm supabase login
```

### 2. Link the Project Reference

Retrieve your Reference ID from your project settings on [supabase.com](https://supabase.com):

```bash
pnpm supabase link --project-ref <your-remote-project-ref>
```

## Automating Migrations and Seeding via `package.json`

To provide single-command convenience for both you and your AI coding agents, wire up custom scripts in `package.json`:

```json
{
  "name": "nextjs-supabase-dual",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migrate:local": "supabase db reset",
    "db:seed:local": "supabase db execute --file ./supabase/seed.sql",
    "db:migrate:remote": "supabase db push",
    "db:seed:remote": "supabase db execute --file ./supabase/seed.sql"
  }
}
```

### What do these commands do?

* **`pnpm run db:migrate:local`**: Runs `supabase db reset`, which drops the local database, reapplies all migrations in order, and automatically executes `supabase/seed.sql`.
* **`pnpm run db:seed:local`**: Runs `supabase db execute` with the `--file` flag against the local container to re-insert test records without wiping the schema.
* **`pnpm run db:migrate:remote`**: Executes `supabase db push`, deploying any unapplied migrations directly to your linked Supabase Cloud instance.
* **`pnpm run db:seed:remote`**: Runs `supabase db execute --file ./supabase/seed.sql` directly against the linked remote database to populate baseline staging or production records.

## Creating the Next.js Client Helper

Create a unified client instantiation file at `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Whenever you run `pnpm dev`, Next.js injects the local Podman configuration from `.env.development`. When deployed on Vercel or running a production build (`pnpm build && pnpm start`), it transparently connects to your hosted database using `.env.production`.

## Testing the Full Workflow

1. Apply your migrations and seed the local Podman database:
   ```bash
   pnpm run db:migrate:local
   ```
2. Open `http://127.0.0.1:54323` to view the seeded `users` table in your local Studio.
3. Push the schema to your remote Supabase cloud project:
   ```bash
   pnpm run db:migrate:remote
   ```
4. Seed your remote project:
   ```bash
   pnpm run db:seed:remote
   ```

Now you have a development workflow with zero cloud dependencies, full offline capability, complete isolation from production, and an environment safe for AI coding agents to run wild.
