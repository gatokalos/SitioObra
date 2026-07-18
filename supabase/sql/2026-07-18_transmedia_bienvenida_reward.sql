-- Allow the Bienvenida/Umbral reward to be recorded in the GAToken ledger.
-- The frontend only accepts this event after the embedded experience confirms
-- both journey-started and cabina-reached.

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
    or v_event_key like 'resonance:l3-reward:%'
    or v_event_key like 'bienvenida_reward:%'
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

revoke all on function public.register_transmedia_credit_event(text, integer, text, text, jsonb, boolean) from public;
grant execute on function public.register_transmedia_credit_event(text, integer, text, text, jsonb, boolean) to anon, authenticated, service_role;
