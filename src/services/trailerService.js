import { supabase } from '../lib/supabaseClient.js';

const BUCKET_NAME = 'trailers';
const DEFAULT_BASENAME = 'trailer';
const VIDEO_REGEX = /\.(mp4|mov|webm|mkv|m4v)$/i;

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
  try {
    let files;

    try {
      files = await listFilesRecursively('');
    } catch (listError) {
      console.error('Error al listar trailers:', listError.message);
      return null;
    }

    if (!Array.isArray(files) || files.length === 0) {
      return null;
    }

    const normalized = preferredName?.toLowerCase();

    let file = files.find((item) => {
      const name = item.fullPath.toLowerCase();
      return normalized && (name === normalized || name.endsWith(`/${normalized}`) || name.includes(`/${normalized}.`) || name === `${normalized}.mp4` || name.startsWith(`${normalized}.`));
    });

    if (!file) {
      file = files.find((item) => VIDEO_REGEX.test(item.fullPath));
    }

    if (!file) {
      return null;
    }

    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.fullPath);

    if (!publicData?.publicUrl) {
      return null;
    }

    return {
      url: publicData.publicUrl,
      name: file.fullPath,
      mimeType: file.metadata?.mimetype || guessMimeType(file.fullPath),
    };
  } catch (err) {
    console.error('Excepción al obtener el tráiler:', err);
    return null;
  }
}
