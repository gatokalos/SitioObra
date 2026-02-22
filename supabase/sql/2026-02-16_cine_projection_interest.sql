-- Registro de interés para la proyección de cine (CopyCats + Quirón).
-- Crea:
-- 1) Tabla de interés de proyección
-- 2) RPC para registrar/actualizar interés por usuario

create table if not exists public.cine_projection_interest (
  id bigint generated always as identity primary key,
  user_id uuid null references auth.users(id) on delete set null,
  showcase_id text not null default 'copycats',
  source text not null default 'transmedia_cine',
  email text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_cine_projection_interest_user_showcase
  on public.cine_projection_interest (user_id, showcase_id);

create index if not exists idx_cine_projection_interest_created_at
  on public.cine_projection_interest (created_at desc);

alter table public.cine_projection_interest enable row level security;

create or replace function public.register_cine_projection_interest(
  p_showcase_id text default 'copycats',
  p_source text default 'transmedia_cine',
  p_email text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_showcase_id text := coalesce(nullif(trim(coalesce(p_showcase_id, '')), ''), 'copycats');
  v_source text := coalesce(nullif(trim(coalesce(p_source, '')), ''), 'transmedia_cine');
  v_email text := nullif(trim(coalesce(p_email, '')), '');
begin
  if v_user_id is not null then
    insert into public.cine_projection_interest (
      user_id,
      showcase_id,
      source,
      email,
      metadata
    )
    values (
      v_user_id,
      v_showcase_id,
      v_source,
      v_email,
      coalesce(p_metadata, '{}'::jsonb)
    )
    on conflict (user_id, showcase_id)
    do update
      set source = excluded.source,
          email = coalesce(excluded.email, public.cine_projection_interest.email),
          metadata = coalesce(public.cine_projection_interest.metadata, '{}'::jsonb) || coalesce(excluded.metadata, '{}'::jsonb),
          updated_at = now();
  else
    insert into public.cine_projection_interest (
      user_id,
      showcase_id,
      source,
      email,
      metadata
    )
    values (
      null,
      v_showcase_id,
      v_source,
      v_email,
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'showcase_id', v_showcase_id,
    'source', v_source
  );
end;
$$;

revoke all on table public.cine_projection_interest from public;
revoke all on function public.register_cine_projection_interest(text, text, text, jsonb) from public;

grant execute on function public.register_cine_projection_interest(text, text, text, jsonb)
  to anon, authenticated, service_role;
