-- Agrega columnas para clasificar contribuciones y saber si se notificará al autor.

alter table if exists public.blog_contributions
  add column if not exists topic text default 'obra_escenica',
  add column if not exists notify_on_publish boolean default false;

update public.blog_contributions
  set topic = 'obra_escenica'
  where topic is null or trim(topic) = '';

alter table if exists public.blog_contributions
  alter column topic set default 'obra_escenica',
  alter column topic set not null;

create index if not exists blog_contributions_topic_idx on public.blog_contributions (topic);
