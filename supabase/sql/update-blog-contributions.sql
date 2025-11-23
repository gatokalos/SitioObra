-- Agrega columnas para clasificar contribuciones y capturar interacciones ligeras.

create extension if not exists "pgcrypto";

alter table if exists public.blog_contributions
  add column if not exists topic text default 'obra_escenica',
  add column if not exists notify_on_publish boolean default false,
  add column if not exists most_viewed_miniverse text,
  add column if not exists most_viewed_miniverse_count integer default 0,
  add column if not exists article_like boolean default false,
  add column if not exists notify_followup boolean default false,
  add column if not exists interaction_context text default 'public_site';

update public.blog_contributions
  set topic = 'obra_escenica'
  where topic is null or trim(topic) = '';

alter table if exists public.blog_contributions
  alter column topic set default 'obra_escenica',
  alter column topic set not null;

create index if not exists blog_contributions_topic_idx on public.blog_contributions (topic);

create table if not exists public.blog_article_interactions (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  post_slug text not null,
  post_title text,
  action text not null check (action in ('like', 'notify')),
  liked boolean default false,
  notify boolean default false,
  miniverse text,
  most_viewed_miniverse text,
  most_viewed_miniverse_count integer,
  interaction_context text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists blog_article_interactions_slug_idx on public.blog_article_interactions (post_slug);
