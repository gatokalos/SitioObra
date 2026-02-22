-- Security hardening for audience perspectives:
-- 1) honeypot support
-- 2) rate limit by identity (auth user or anon_id)
-- 3) stronger backend validation

alter table public.audience_perspectives
  add column if not exists anon_id text null;

create index if not exists idx_audience_perspectives_anon_id
  on public.audience_perspectives (anon_id, created_at desc);

drop function if exists public.submit_audience_perspective(text, text, text, jsonb);

create or replace function public.submit_audience_perspective(
  p_quote text,
  p_author_name text,
  p_author_role text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_honeypot text default null
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
  v_honeypot text := nullif(trim(coalesce(p_honeypot, '')), '');
  v_anon_id text := nullif(trim(coalesce(coalesce(p_metadata, '{}'::jsonb)->>'anon_id', '')), '');
  v_inserted_id bigint;
  v_recent_count integer := 0;
  v_last_submission timestamptz := null;
  v_has_duplicate boolean := false;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb) - 'honeypot' - 'hp' - 'website';
begin
  -- Silent drop for basic bots that fill hidden fields.
  if v_honeypot is not null then
    return jsonb_build_object('ok', true, 'accepted', false, 'status', 'ignored');
  end if;

  if v_quote is null then
    raise exception 'quote is required' using errcode = '22023';
  end if;
  if char_length(v_quote) < 10 or char_length(v_quote) > 900 then
    raise exception 'quote length must be between 10 and 900' using errcode = '22023';
  end if;
  if v_quote ~* '(https?://|www\.)' then
    raise exception 'links are not allowed in quote' using errcode = '22023';
  end if;

  if v_author_name is null then
    raise exception 'author_name is required' using errcode = '22023';
  end if;
  if char_length(v_author_name) < 2 or char_length(v_author_name) > 80 then
    raise exception 'author_name length must be between 2 and 80' using errcode = '22023';
  end if;

  if v_author_role is not null and char_length(v_author_role) > 120 then
    raise exception 'author_role max length is 120' using errcode = '22023';
  end if;

  if v_user_id is null and v_anon_id is null then
    raise exception 'identity is required for anonymous submissions' using errcode = '22023';
  end if;

  select
    count(*)::int,
    max(created_at)
  into
    v_recent_count,
    v_last_submission
  from public.audience_perspectives ap
  where ap.created_at >= now() - interval '10 minutes'
    and (
      (v_user_id is not null and ap.user_id = v_user_id)
      or (v_anon_id is not null and ap.anon_id = v_anon_id)
    );

  if coalesce(v_recent_count, 0) >= 5 then
    raise exception 'rate limit exceeded: max 5 submissions per 10 minutes' using errcode = '42901';
  end if;

  if v_last_submission is not null and v_last_submission > now() - interval '25 seconds' then
    raise exception 'please wait before sending another perspective' using errcode = '42901';
  end if;

  select exists (
    select 1
    from public.audience_perspectives ap
    where ap.created_at >= now() - interval '24 hours'
      and lower(ap.quote) = lower(v_quote)
      and (
        (v_user_id is not null and ap.user_id = v_user_id)
        or (v_anon_id is not null and ap.anon_id = v_anon_id)
      )
  )
  into v_has_duplicate;

  if v_has_duplicate then
    raise exception 'duplicate perspective detected' using errcode = '23505';
  end if;

  if v_anon_id is not null then
    v_metadata := v_metadata || jsonb_build_object('anon_id', v_anon_id);
  end if;

  insert into public.audience_perspectives (
    user_id,
    anon_id,
    quote,
    author_name,
    author_role,
    status,
    metadata
  )
  values (
    v_user_id,
    v_anon_id,
    v_quote,
    v_author_name,
    v_author_role,
    'pending',
    v_metadata
  )
  returning id into v_inserted_id;

  return jsonb_build_object(
    'ok', true,
    'accepted', true,
    'id', v_inserted_id,
    'status', 'pending'
  );
end;
$$;

revoke all on function public.submit_audience_perspective(text, text, text, jsonb, text) from public;
grant execute on function public.submit_audience_perspective(text, text, text, jsonb, text) to anon, authenticated, service_role;
