-- Analytics for Miniverse "home screen" interactions in MiniverseModal.
-- Creates:
-- 1) Event log table
-- 2) RPC endpoint to track events
-- 3) RPC endpoint to fetch top clicked apps
-- 4) Views for first-click and KPI reporting

create table if not exists public.miniverse_home_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('app_click', 'home_share', 'open_transmedia')),
  app_id text null,
  anon_id text null,
  source text not null default 'miniverse_modal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_miniverse_home_events_type_created_at
  on public.miniverse_home_events (event_type, created_at desc);

create index if not exists idx_miniverse_home_events_app_id
  on public.miniverse_home_events (app_id);

create index if not exists idx_miniverse_home_events_anon_created_at
  on public.miniverse_home_events (anon_id, created_at);

alter table public.miniverse_home_events enable row level security;

create or replace function public.track_miniverse_home_event(
  p_event_type text,
  p_app_id text default null,
  p_anon_id text default null,
  p_source text default 'miniverse_modal',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_type text := trim(coalesce(p_event_type, ''));
  v_app_id text := nullif(trim(coalesce(p_app_id, '')), '');
begin
  if v_event_type not in ('app_click', 'home_share', 'open_transmedia') then
    raise exception 'Invalid event_type: %', v_event_type using errcode = '22023';
  end if;

  if v_event_type = 'app_click' and v_app_id is null then
    raise exception 'app_id is required for app_click' using errcode = '22023';
  end if;

  insert into public.miniverse_home_events (
    event_type,
    app_id,
    anon_id,
    source,
    metadata
  )
  values (
    v_event_type,
    v_app_id,
    nullif(trim(coalesce(p_anon_id, '')), ''),
    coalesce(nullif(trim(coalesce(p_source, '')), ''), 'miniverse_modal'),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.get_miniverse_home_top_apps(p_limit int default 3)
returns table (app_id text, clicks bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.app_id, count(*)::bigint as clicks
  from public.miniverse_home_events e
  where e.event_type = 'app_click'
    and e.app_id is not null
  group by e.app_id
  order by clicks desc, e.app_id asc
  limit greatest(1, least(coalesce(p_limit, 3), 9));
$$;

create or replace view public.miniverse_home_first_clicks as
select
  e.anon_id,
  min(e.created_at) as first_click_at,
  (array_agg(e.app_id order by e.created_at asc))[1] as first_app_id
from public.miniverse_home_events e
where e.event_type = 'app_click'
  and e.anon_id is not null
  and e.app_id is not null
group by e.anon_id;

create or replace view public.miniverse_home_app_click_counts as
select
  e.app_id,
  count(*)::bigint as clicks
from public.miniverse_home_events e
where e.event_type = 'app_click'
  and e.app_id is not null
group by e.app_id
order by clicks desc, e.app_id asc;

create or replace view public.miniverse_home_kpis as
select
  count(*) filter (where e.event_type = 'home_share')::bigint as home_share_count,
  count(*) filter (where e.event_type = 'open_transmedia')::bigint as dock_open_transmedia_count,
  count(*) filter (where e.event_type = 'app_click')::bigint as app_click_count,
  count(distinct e.anon_id) filter (where e.event_type = 'app_click' and e.anon_id is not null)::bigint as unique_anon_clickers
from public.miniverse_home_events e;

revoke all on function public.track_miniverse_home_event(text, text, text, text, jsonb) from public;
revoke all on function public.get_miniverse_home_top_apps(int) from public;

grant execute on function public.track_miniverse_home_event(text, text, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.get_miniverse_home_top_apps(int) to anon, authenticated, service_role;
