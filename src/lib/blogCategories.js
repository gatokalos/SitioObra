const normalize = (value) => (value || '').toString().trim().toLowerCase();

export const BLOG_CATEGORY_ORDER = ['curaduria', 'expansiones', 'backstage'];

export const BLOG_CATEGORY_CONFIG = {
  curaduria: {
    id: 'curaduria',
    label: 'Curaduría Reflexiva',
    summary:
      'Perspectivas interdisciplinarias escritas por el equipo curatorial y colaboradores invitados.',
    ctaLabel: 'Entrar en Curaduría',
    readingTime: 'Tiempo variable',
    keywords: ['curaduria', 'curatorial', 'critica', 'ensayo', 'analisis', 'reflexiva'],
  },
  expansiones: {
    id: 'expansiones',
    label: 'Expansiones Narrativas',
    summary:
      'Lo que la obra despierta en cada quien: bitácoras, microficciones y relatos colectivos que expanden este espacio transmedia.',
    ctaLabel: 'Explorar relatos',
    readingTime: 'Tiempo variable',
    keywords: ['miniverso', 'transmedia', 'ficcion', 'comunidad', 'microficcion', 'expansion'],
  },
  backstage: {
    id: 'backstage',
    label: 'Detrás de Cámaras',
    summary:
      'Noticias, avances y crónicas del proceso creativo: apps, novela, ensayo técnico, producción y archivos del montaje.',
    ctaLabel: 'Ver proceso',
    readingTime: 'Tiempo variable',
    keywords: ['backstage', 'proceso', 'produccion', 'apps', 'novela', 'noticias', 'detras'],
  },
};

export const MINIVERSE_POST_SLUGS = ['carta-a-copycats', 'taza-que-habla'];

const DEFAULT_CATEGORY = BLOG_CATEGORY_ORDER[0];

export const deriveBlogCategory = (post) => {
  if (!post) {
    return DEFAULT_CATEGORY;
  }

  const explicitCategory = normalize(post.category);
  if (explicitCategory && BLOG_CATEGORY_ORDER.includes(explicitCategory)) {
    return explicitCategory;
  }

  const slug = normalize(post.slug);
  if (slug && MINIVERSE_POST_SLUGS.includes(slug)) {
    return 'expansiones';
  }

  const tags = Array.isArray(post.tags)
    ? post.tags
        .map((tag) => normalize(tag))
        .filter(Boolean)
    : [];

  for (const key of BLOG_CATEGORY_ORDER) {
    const keywords = BLOG_CATEGORY_CONFIG[key].keywords;
    if (tags.some((tag) => keywords.includes(tag))) {
      return key;
    }
  }

  return DEFAULT_CATEGORY;
};

export const isMiniversePost = (post) => deriveBlogCategory(post) === 'expansiones';
