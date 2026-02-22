-- Transmedia credit ledger
-- Persists spend/reward state by authenticated user and/or anon_id to prevent refresh bypass.

create table if not exists public.transmedia_credit_events (
  id bigint generated always as identity primary key,
  user_id uuid null references auth.users (id) on delete cascade,
  anon_id text null,
  event_key text not null,
  amount integer not null default 0,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint transmedia_credit_events_identity_check
    check (user_id is not null or (anon_id is not null and length(trim(anon_id)) > 0)),
  constraint transmedia_credit_events_idempotency_key_unique unique (idempotency_key)
);

create index if not exists idx_transmedia_credit_events_user_id
  on public.transmedia_credit_events (user_id, created_at desc);

create index if not exists idx_transmedia_credit_events_anon_id
  on public.transmedia_credit_events (anon_id, created_at desc);

create index if not exists idx_transmedia_credit_events_event_key
  on public.transmedia_credit_events (event_key);

create or replace function public.get_transmedia_credit_state(p_anon_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_anon_id text := nullif(trim(coalesce(p_anon_id, '')), '');
  v_available_tokens integer := 150;
  v_sonoro_spent boolean := false;
  v_graphic_spent boolean := false;
  v_novela_questions integer := 0;
  v_taza_activations integer := 0;
  v_showcase_boosts jsonb := '{}'::jsonb;
begin
  if v_user_id is null and v_anon_id is null then
    return jsonb_build_object(
      'available_tokens', 150,
      'sonoro_spent', false,
      'graphic_spent', false,
      'novela_questions', 0,
      'taza_activations', 0,
      'showcase_boosts', '{}'::jsonb
    );
  end if;

  with identity_events as (
    select e.*
    from public.transmedia_credit_events e
    where
      (v_user_id is not null and e.user_id = v_user_id)
      or (v_anon_id is not null and e.anon_id = v_anon_id)
  ),
  boosts as (
    select distinct replace(event_key, 'showcase_boost:', '') as showcase_id
    from identity_events
    where event_key like 'showcase_boost:%'
  )
  select
    greatest(0, 150 + coalesce(sum(e.amount), 0))::integer as available_tokens,
    bool_or(e.event_key = 'sonoro_unlock') as sonoro_spent,
    bool_or(e.event_key = 'graphic_unlock') as graphic_spent,
    count(*) filter (where e.event_key = 'novela_question')::integer as novela_questions,
    count(*) filter (where e.event_key = 'taza_activation')::integer as taza_activations,
    coalesce((select jsonb_object_agg(b.showcase_id, true) from boosts b), '{}'::jsonb) as showcase_boosts
  into
    v_available_tokens,
    v_sonoro_spent,
    v_graphic_spent,
    v_novela_questions,
    v_taza_activations,
    v_showcase_boosts
  from identity_events e;

  return jsonb_build_object(
    'available_tokens', coalesce(v_available_tokens, 150),
    'sonoro_spent', coalesce(v_sonoro_spent, false),
    'graphic_spent', coalesce(v_graphic_spent, false),
    'novela_questions', coalesce(v_novela_questions, 0),
    'taza_activations', coalesce(v_taza_activations, 0),
    'showcase_boosts', coalesce(v_showcase_boosts, '{}'::jsonb)
  );
end;
$$;

create or replace function public.register_transmedia_credit_event(
  p_event_key text,
  p_amount integer default 0,
  p_idempotency_key text default null,
  p_anon_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_once_per_identity boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_anon_id text := nullif(trim(coalesce(p_anon_id, '')), '');
  v_event_key text := nullif(trim(coalesce(p_event_key, '')), '');
  v_idempotency_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_duplicate boolean := false;
  v_inserted_id bigint := null;
  v_state jsonb := '{}'::jsonb;
begin
  if v_event_key is null then
    raise exception 'event_key is required' using errcode = '22023';
  end if;

  if not (
    v_event_key in (
      'sonoro_unlock',
      'graphic_unlock',
      'novela_question',
      'taza_activation',
      'explorer_badge_reward_subscriber',
      'explorer_badge_reward_guest'
    )
    or v_event_key like 'showcase_boost:%'
  ) then
    raise exception 'Unsupported event_key: %', v_event_key using errcode = '22023';
  end if;

  if v_user_id is null and v_anon_id is null then
    raise exception 'identity is required (auth user or anon_id)' using errcode = '22023';
  end if;

  if v_idempotency_key is null then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  if p_once_per_identity then
    if exists (
      select 1
      from public.transmedia_credit_events e
      where e.event_key = v_event_key
        and (
          (v_user_id is not null and e.user_id = v_user_id)
          or (v_anon_id is not null and e.anon_id = v_anon_id)
        )
    ) then
      v_duplicate := true;
      v_state := public.get_transmedia_credit_state(v_anon_id);
      return jsonb_build_object('ok', true, 'duplicate', true, 'state', v_state);
    end if;
  end if;

  insert into public.transmedia_credit_events (
    user_id,
    anon_id,
    event_key,
    amount,
    idempotency_key,
    metadata
  )
  values (
    v_user_id,
    v_anon_id,
    v_event_key,
    coalesce(p_amount, 0),
    v_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (idempotency_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    v_duplicate := true;
  end if;

  v_state := public.get_transmedia_credit_state(v_anon_id);

  return jsonb_build_object(
    'ok', true,
    'duplicate', v_duplicate,
    'state', v_state
  );
end;
$$;

revoke all on table public.transmedia_credit_events from public;
revoke all on table public.transmedia_credit_events from anon;
revoke all on table public.transmedia_credit_events from authenticated;

revoke all on function public.get_transmedia_credit_state(text) from public;
revoke all on function public.register_transmedia_credit_event(text, integer, text, text, jsonb, boolean) from public;

grant execute on function public.get_transmedia_credit_state(text) to anon, authenticated, service_role;
grant execute on function public.register_transmedia_credit_event(text, integer, text, text, jsonb, boolean) to anon, authenticated, service_role;

