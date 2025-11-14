-- Agrega columnas para clasificar contribuciones y saber si se notificará al autor.

alter table if exists public.blog_contributions
  add column if not exists topic text default 'la_obra',
  add column if not exists notify_on_publish boolean default false;

create index if not exists blog_contributions_topic_idx on public.blog_contributions (topic);
