-- Audience perspectives for "Provoca" section.
-- Exposes two RPC endpoints:
-- 1) submit_audience_perspective: create pending perspective
-- 2) get_audience_perspectives: list approved perspectives (latest first)

create table if not exists public.audience_perspectives (
  id bigint generated always as identity primary key,
  user_id uuid null references auth.users (id) on delete set null,
  quote text not null,
  author_name text not null,
  author_role text null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audience_perspectives_status_created_at
  on public.audience_perspectives (status, created_at desc);

create index if not exists idx_audience_perspectives_user_id
  on public.audience_perspectives (user_id, created_at desc);

alter table public.audience_perspectives enable row level security;

create or replace function public.submit_audience_perspective(
  p_quote text,
  p_author_name text,
  p_author_role text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_quote text := nullif(trim(coalesce(p_quote, '')), '');
  v_author_name text := nullif(trim(coalesce(p_author_name, '')), '');
  v_author_role text := nullif(trim(coalesce(p_author_role, '')), '');
  v_inserted_id bigint;
begin
  if v_quote is null then
    raise exception 'quote is required' using errcode = '22023';
  end if;

  if char_length(v_quote) < 10 then
    raise exception 'quote must be at least 10 characters' using errcode = '22023';
  end if;

  if v_author_name is null then
    raise exception 'author_name is required' using errcode = '22023';
  end if;

  insert into public.audience_perspectives (
    user_id,
    quote,
    author_name,
    author_role,
    status,
    metadata
  )
  values (
    v_user_id,
    v_quote,
    v_author_name,
    v_author_role,
    'pending',
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_inserted_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_inserted_id,
    'status', 'pending'
  );
end;
$$;

create or replace function public.get_audience_perspectives(p_limit int default 2)
returns table (
  id bigint,
  quote text,
  author_name text,
  author_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ap.id,
    ap.quote,
    ap.author_name,
    ap.author_role,
    ap.created_at
  from public.audience_perspectives ap
  where ap.status = 'approved'
  order by ap.created_at desc
  limit greatest(1, least(coalesce(p_limit, 2), 20));
$$;

revoke all on table public.audience_perspectives from public;
revoke all on table public.audience_perspectives from anon;
revoke all on table public.audience_perspectives from authenticated;

revoke all on function public.submit_audience_perspective(text, text, text, jsonb) from public;
revoke all on function public.get_audience_perspectives(int) from public;

grant execute on function public.submit_audience_perspective(text, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.get_audience_perspectives(int) to anon, authenticated, service_role;
