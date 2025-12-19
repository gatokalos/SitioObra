import { ensureAnonId } from '@/lib/identity';
import { supabasePublic } from '@/lib/supabaseClient';
import { trackInteraction } from '@/services/trackService';

const resolveGalleryKey = (post) => {
  if (post?.id) return { key: 'post_id', value: String(post.id) };
  if (post?.filename) return { key: 'post_filename', value: String(post.filename) };
  if (post?.imgSrc) return { key: 'post_src', value: String(post.imgSrc) };
  return null;
};

export async function recordGalleryLike({ post, index }) {
  const key = resolveGalleryKey(post);
  if (!key) {
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

export async function getGalleryLikeCount(post) {
  const key = resolveGalleryKey(post);
  if (!key) {
    return { success: false, error: new Error('Falta el identificador del recuerdo.'), count: 0 };
  }

  const { count, error } = await supabasePublic
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('action_type', 'gallery_like')
    .eq(`metadata->>${key.key}`, key.value);

  if (error) {
    return { success: false, error, count: 0 };
  }

  return { success: true, error: null, count: count ?? 0 };
}
