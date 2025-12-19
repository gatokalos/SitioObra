import { ensureAnonId } from '@/lib/identity';
import { trackInteraction } from '@/services/trackService';

export async function recordGalleryLike({ post, index }) {
  if (!post?.id && !post?.filename && !post?.imgSrc) {
    return { success: false, error: new Error('Falta el identificador del recuerdo.') };
  }

  const anonId = ensureAnonId();
  if (!anonId) {
    return { success: false, error: new Error('No se pudo generar un anon_id para la interacción.') };
  }

  const metadata = {
    post_id: post.id ?? null,
    post_filename: post.filename ?? null,
    post_src: post.imgSrc ?? null,
    post_alt: post.alt ?? null,
    post_index: typeof index === 'number' ? index : null,
    recorded_at: new Date().toISOString(),
  };

  return trackInteraction({
    action_type: 'gallery_like',
    anon_id: anonId,
    context: {
      source: 'instagram',
      component: 'GalleryModal',
    },
    metadata,
  });
}
