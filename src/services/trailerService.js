import { supabase } from '../lib/supabaseClient.js';

const BUCKET_NAME = 'trailers';
const DEFAULT_BASENAME = 'trailerlanding';
const VIDEO_REGEX = /\.(mp4|mov|webm|mkv|m4v)$/i;

const normalizeBaseName = (value = '') => value.toLowerCase().replace(/\.[^/.]+$/, '');

const guessMimeType = (filename = '') => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'mkv':
      return 'video/x-matroska';
    case 'm4v':
      return 'video/x-m4v';
    case 'mp4':
    default:
      return 'video/mp4';
  }
};

const FALLBACK_FILE_NAME = 'trailerlanding.mp4';
const FALLBACK_FILE_NAME_MOBILE = 'trailer_landing.mp4';

export const TRAILER_FALLBACK_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/trailer_landing.mp4';
export const TRAILER_FALLBACK_URL_MOBILE =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/trailer_landing_v.mp4';

const FALLBACKS = {
  trailerlanding: {
    url: TRAILER_FALLBACK_URL,
    name: FALLBACK_FILE_NAME,
    mimeType: guessMimeType(FALLBACK_FILE_NAME),
  },
  trailer_landing: {
    url: TRAILER_FALLBACK_URL_MOBILE,
    name: FALLBACK_FILE_NAME_MOBILE,
    mimeType: guessMimeType(FALLBACK_FILE_NAME_MOBILE),
  },
};

const getFallbackFor = (preferredName = DEFAULT_BASENAME) => {
  const key = normalizeBaseName(preferredName) || DEFAULT_BASENAME;
  const fallback = FALLBACKS[key] || FALLBACKS[DEFAULT_BASENAME];
  return { ...fallback };
};

const listFilesRecursively = async (path = '') => {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const files = [];

  for (const item of data) {
    const fullPath = path ? `${path}/${item.name}` : item.name;

    // folders in Supabase storage do not have metadata by default
    if (!item.metadata) {
      const nestedFiles = await listFilesRecursively(fullPath);
      files.push(...nestedFiles);
      continue;
    }

    files.push({ ...item, fullPath });
  }

  return files;
};

export async function getTrailerPublicUrl(preferredName = DEFAULT_BASENAME) {
  const normalizedPreferred = normalizeBaseName(preferredName) || DEFAULT_BASENAME;
  const fallback = getFallbackFor(normalizedPreferred);

  try {
    let files;

    try {
      files = await listFilesRecursively('');
    } catch (listError) {
      console.error('Error al listar trailers:', listError.message);
      return { ...fallback };
    }

    if (!Array.isArray(files) || files.length === 0) {
      return { ...fallback };
    }

    const normalized = normalizedPreferred;

    let file = files.find((item) => {
      const name = item.fullPath.toLowerCase();
      return (
        normalized &&
        (name === normalized ||
          name.endsWith(`/${normalized}`) ||
          name.includes(`/${normalized}.`) ||
          name === `${normalized}.mp4` ||
          name.startsWith(`${normalized}.`))
      );
    });

    if (!file && normalized) {
      file = files.find((item) => item.fullPath.toLowerCase().includes(normalized));
    }

    if (!file) {
      return { ...fallback };
    }

    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.fullPath);
    const mimeType = file.metadata?.mimetype || guessMimeType(file.fullPath);

    if (!publicData?.publicUrl) {
      return { ...fallback, name: file.fullPath, mimeType };
    }

    return {
      url: publicData.publicUrl,
      name: file.fullPath,
      mimeType,
    };
  } catch (err) {
    console.error('Excepción al obtener el tráiler:', err);
    return { ...fallback };
  }
}
