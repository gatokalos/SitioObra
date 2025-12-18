const API_URL = import.meta.env.VITE_API_URL;
const TABLE_NAME = 'blog_posts';

const SAMPLE_POSTS = [];

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
    if (!API_URL) {
      console.warn('[blogService] VITE_API_URL no está definido, se devuelven muestras.');
      return SAMPLE_POSTS;
    }

    const res = await fetch(`${API_URL}/blog-posts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[blogService] Error HTTP al obtener posts:', res.status);
      return SAMPLE_POSTS;
    }

    const payload = await res.json().catch(() => []);
    if (!Array.isArray(payload) || payload.length === 0) {
      return SAMPLE_POSTS;
    }

    const publishedPosts = payload.map(mapDatabasePost);

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
    if (!API_URL) {
      console.warn('[blogService] VITE_API_URL no está definido, no se puede obtener el post.');
      return null;
    }

    const res = await fetch(`${API_URL}/blog-posts/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[blogService] Error HTTP al obtener post:', res.status);
      return null;
    }

    const payload = await res.json().catch(() => null);
    if (!payload) {
      return null;
    }

    return mapDatabasePost(payload);
  } catch (err) {
    console.error('[blogService] Excepción al buscar post por slug:', err);
    return null;
  }
}
