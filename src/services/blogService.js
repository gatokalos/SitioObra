import { supabasePublic } from '@/lib/supabaseClient';

const TABLE_NAME = 'blog_posts';

const SAMPLE_POSTS = [

];

const generateFallbackId = () => `post-${Math.random().toString(36).slice(2, 10)}`;

const mapDatabasePost = (post) => ({
  id: post.id ?? post.slug ?? generateFallbackId(),
  slug: post.slug ?? `post-${post.id ?? generateFallbackId()}`,
  title: post.title ?? 'Entrada sin título',
  excerpt: post.excerpt ?? post.summary ?? '',
  author: post.author ?? post.byline ?? 'Autoría pendiente',
  author_role: post.author_role ?? post.role ?? '',
  content: post.content ?? post.body ?? '',
  published_at: post.published_at ?? post.publish_date ?? null,
  read_time_minutes: post.read_time_minutes ?? post.read_time ?? null,
  tags: post.tags ?? [],
  featured_image_url: post.featured_image_url ?? post.cover_image ?? null,
});

export async function fetchPublishedBlogPosts() {
  try {
    const { data, error } = await supabasePublic
      .from(TABLE_NAME)
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        author,
        author_role,
        content,
        published_at,
        read_time_minutes,
        tags,
        featured_image_url
      `
      )
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[blogService] Error al obtener posts:', error.message);
      return SAMPLE_POSTS;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return SAMPLE_POSTS;
    }

    const publishedPosts = data.map(mapDatabasePost);

    const supplementalSamples = SAMPLE_POSTS
      .filter((sample) => !publishedPosts.some((post) => post.slug === sample.slug))
      .map(mapDatabasePost);

    return [...publishedPosts, ...supplementalSamples];
  } catch (err) {
    console.error('[blogService] Excepción al obtener posts:', err);
    return SAMPLE_POSTS;
  }
}

export async function fetchBlogPostBySlug(slug) {
  if (!slug) {
    return null;
  }

  try {
    const { data, error } = await supabasePublic
      .from(TABLE_NAME)
      .select(
        `
        id,
        slug,
        title,
        excerpt,
        author,
        author_role,
        content,
        published_at,
        read_time_minutes,
        tags,
        featured_image_url
      `
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('[blogService] Error al obtener post por slug:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapDatabasePost(data);
  } catch (err) {
    console.error('[blogService] Excepción al buscar post por slug:', err);
    return null;
  }
}
