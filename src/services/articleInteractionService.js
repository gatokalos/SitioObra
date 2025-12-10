import { supabase } from '@/lib/supabaseClient';
import { getAnonId } from '@/lib/identity';
import { track } from '@/services/trackService';

export async function recordArticleInteraction({
  post,
  action,
  liked,
  notify,
  miniverse,
  mostViewedMiniverse,
  mostViewedMiniverseCount,
  interactionContext = 'blog_article_footer',
}) {
  if (!post?.id || !post?.slug) {
    return { success: false, error: new Error('Falta el identificador del artículo') };
  }

  const anonId = getAnonId();
  const metadata = {
    author: post.author,
    tags: post.tags ?? [],
    published_at: post.published_at,
    ...(anonId ? { anon_id: anonId } : {}),
  };

  const payload = {
    post_id: post.id,
    post_slug: post.slug,
    post_title: post.title,
    action,
    liked: Boolean(liked),
    notify: Boolean(notify),
    miniverse,
    most_viewed_miniverse: mostViewedMiniverse,
    most_viewed_miniverse_count: mostViewedMiniverseCount ?? null,
    interaction_context: interactionContext,
    metadata,
  };

  const { error } = await supabase.from('blog_article_interactions').insert(payload);

  const { error: trackError } = await track('article_interaction', {
    post_id: post.id,
    post_slug: post.slug,
    action,
    miniverse: miniverse ?? null,
    metadata,
  });

  if (trackError) {
    console.error('articleInteractionService track error', trackError);
  }

  return { success: !error, error };
}
