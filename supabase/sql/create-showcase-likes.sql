create table if not exists public.showcase_likes (
  id uuid primary key default gen_random_uuid(),
  showcase_id text not null,
  user_id text,
  user_email text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists showcase_likes_showcase_idx on public.showcase_likes (showcase_id);
