const normalize = (value) => (value || '').toString().trim().toLowerCase();

export const BLOG_CATEGORY_ORDER = ['curaduria', 'expansiones', 'backstage'];

export const BLOG_CATEGORY_CONFIG = {
  curaduria: {
    id: 'curaduria',
    label: 'Curaduría Reflexiva',
    summary:
      'Textos críticos y análisis profundos sobre la obra y su universo, escritos por investigadores, curadoras y voces especializadas.',
    keywords: ['curaduria', 'curatorial', 'critica', 'ensayo', 'analisis', 'reflexiva'],
  },
  expansiones: {
    id: 'expansiones',
    label: 'Expansiones Narrativas',
    summary:
      'Microficciones, comunidad y relatos que acompañan lo que la obra despierta en cada quien: cartas, diarios, audios y relatos colectivos que expanden este espacio transmedia.',
    keywords: ['miniverso', 'transmedia', 'ficcion', 'comunidad', 'microficcion', 'expansion'],
  },
  backstage: {
    id: 'backstage',
    label: 'Detrás de Cámaras',
    summary:
      'Noticias, avances y bitácoras del proceso creativo: apps, novela, ensayo técnico, producción y archivos del montaje.',
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
