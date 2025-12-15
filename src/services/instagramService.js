import { supabasePublic } from '@/lib/supabaseClient';

const BUCKET_NAME = 'galeria de gatoencerrado';
const IMAGE_FILE_REGEX = /\.(jpe?g|png|webp|avif|gif)$/i;
const STORAGE_LISTING_FLAG = import.meta.env?.VITE_ENABLE_STORAGE_LISTING;
const STORAGE_LISTING_ENABLED =
  STORAGE_LISTING_FLAG === undefined || STORAGE_LISTING_FLAG === 'true';

const formatAltText = (filename = '') => {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '');
  return withoutExtension.replace(/[-_]+/g, ' ').trim() || 'Recuerdo #GatoEncerrado';
};

export async function getInstagramPostsFromBucket() {
  if (!STORAGE_LISTING_ENABLED) {
    return [];
  }

  try {
    const { data, error } = await supabasePublic.storage.from(BUCKET_NAME).list('', {
      limit: 200,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    });

    if (error) {
      console.error('[Instagram] Error al listar imágenes:', error.message);
      return [];
    }

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const imageFiles = data.filter((file) => IMAGE_FILE_REGEX.test(file.name));

    const posts = imageFiles
      .map((file) => {
        const { data: publicData } = supabasePublic.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);

        if (!publicData?.publicUrl) {
          return null;
        }

        const alt =
          file.metadata?.description ||
          file.metadata?.title ||
          file.metadata?.name ||
          formatAltText(file.name);

        return {
          id: file.id ?? file.name,
          imgSrc: publicData.publicUrl,
          alt,
          filename: file.name,
        };
      })
      .filter(Boolean);

    return posts;
  } catch (err) {
    console.error('[Instagram] Excepción al obtener imágenes del bucket:', err);
    return [];
  }
}
