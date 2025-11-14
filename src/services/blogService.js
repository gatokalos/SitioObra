import { supabase } from '@/lib/supabaseClient';

const TABLE_NAME = 'blog_posts';

const SAMPLE_POSTS = [
  {
    id: 'sample-1',
    slug: 'cartografia-emocional-gato-encerrado',
    title: 'Cartografía emocional de #GatoEncerrado',
    excerpt:
      'Un recorrido íntimo por los estados afectivos que atraviesa el universo de la obra y cómo se expanden más allá del escenario.',
    author: 'Equipo Dramaturgia',
    author_role: 'Residencia #GatoEncerrado',
    content:
      'Este es un texto de muestra para ilustrar la futura experiencia del blog. Muy pronto podrás leer aquí análisis curatoriales, entrevistas y reflexiones creadas por la comunidad de #GatoEncerrado. Si quieres contribuir, utiliza el formulario "Enviar Propuesta" dentro de la sección del blog.\n\nPor ahora, este contenido sirve para validar el diseño y la navegación. Actualizaremos esta entrada en cuanto estén listas las primeras publicaciones reales.',
    published_at: '2024-09-01T12:00:00Z',
    read_time_minutes: 4,
    tags: ['Ensayo', 'Proceso creativo'],
  },
  {
    id: 'sample-2',
    slug: 'practicas-transmedia-teatro',
    title: 'Prácticas transmedia aplicadas al teatro contemporáneo',
    excerpt:
      'Reflexionamos sobre cómo el universo narrativo de la obra dialoga con otras plataformas y formatos digitales.',
    author: 'Laboratorio Transmedia',
    author_role: 'Investigación de campo',
    content:
      'El blog de #GatoEncerrado abrirá la puerta a colaboraciones con investigadores, críticos y artistas. Este artículo placeholder es un recordatorio de que pronto compartiremos crónicas del montaje, estudios de caso y ensayos colaborativos.\n\nSi quieres recibir la publicación cuando salga, déjanos tu correo en el formulario de propuestas.',
    published_at: '2024-08-18T12:00:00Z',
    read_time_minutes: 6,
    tags: ['Transmedia', 'Investigación'],
  },
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
    const { data, error } = await supabase
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
        featured_image_url,
        is_published
      `
      )
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[blogService] Error al obtener posts:', error.message);
      return SAMPLE_POSTS;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return SAMPLE_POSTS;
    }

    const publishedPosts = data
      .filter((item) => item.is_published === true || item.is_published === null || typeof item.is_published === 'undefined')
      .map(mapDatabasePost);

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
    const { data, error } = await supabase
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
        featured_image_url,
        is_published
      `
      )
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[blogService] Error al obtener post por slug:', error.message);
      return null;
    }

    if (!data || data.is_published === false) {
      return null;
    }

    return mapDatabasePost(data);
  } catch (err) {
    console.error('[blogService] Excepción al buscar post por slug:', err);
    return null;
  }
}
