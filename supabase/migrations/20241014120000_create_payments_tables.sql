create table if not exists payments_pending (
  id serial primary key,
  user_id uuid not null,
  stripe_session_id text not null,
  price_id text not null,
  created_at timestamptz default now()
);

alter table payments_pending enable row level security;

create policy "Allow service role inserts on payments_pending"
  on payments_pending
  for insert
  with check (auth.role() = 'service_role');

create table if not exists payments_confirmed (
  id serial primary key,
  user_id uuid not null,
  stripe_session_id text not null,
  price_id text not null,
  status text default 'completed',
  created_at timestamptz default now()
);

alter table payments_confirmed enable row level security;

create policy "Allow service role inserts on payments_confirmed"
  on payments_confirmed
  for insert
  with check (auth.role() = 'service_role');
