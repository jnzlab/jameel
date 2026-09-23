-- Contact form messages and per-post feedback submitted from jnzlab.io.
--
-- The site's server writes with the publishable (anon) key, so access is locked down to
-- INSERT only: anonymous clients can add rows but never read, update, or delete them.
-- Read submissions in the Supabase dashboard (or with a secret key).
-- Length limits live in CHECK constraints so the database enforces them even if the
-- server-side validation is bypassed.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 10 and 5000),
  -- page the visitor submitted from, e.g. /contact
  source_path text check (char_length(source_path) <= 300)
);

create table public.post_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  post_slug text not null check (char_length(post_slug) between 1 and 200),
  helpful boolean not null,
  comment text check (char_length(comment) <= 2000),
  email text check (char_length(email) between 3 and 254)
);

create index post_feedback_post_slug_idx on public.post_feedback (post_slug, created_at desc);

alter table public.contact_messages enable row level security;
alter table public.post_feedback enable row level security;

-- Start from zero privileges, then grant exactly INSERT to the anon role.
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.post_feedback from anon, authenticated;
grant insert on table public.contact_messages to anon;
grant insert on table public.post_feedback to anon;

create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon
  with check (true);

create policy "Anyone can submit post feedback"
  on public.post_feedback
  for insert
  to anon
  with check (true);
