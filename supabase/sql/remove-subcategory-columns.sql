-- Quita los marcadores de subcategoría que no se deben usar.

alter table if exists public.blog_contributions
  drop column if exists subcategory,
  drop column if exists subcategory_detail;

alter table if exists public.blog_article_interactions
  drop column if exists subcategory,
  drop column if exists subcategory_detail;
