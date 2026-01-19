import { ensureAnonId } from '@/lib/identity';
import { trackInteraction } from '@/services/trackService';

export async function recordArticleInteraction({
  post,
  action,
  liked,
  notify,
  shared,
  miniverse,
  mostViewedMiniverse,
  mostViewedMiniverseCount,
  interactionContext = 'blog_article_footer',
}) {
  if (!post?.id || !post?.slug) {
    return { success: false, error: new Error('Falta el identificador del artículo') };
  }

  const anonId = ensureAnonId();
  if (!anonId) {
    return { success: false, error: new Error('No se pudo generar un anon_id para la interacción.') };
  }

  const context = {
    source: 'blog',
    component: 'ArticleInteractionPanel',
    interaction_context: interactionContext,
  };

  const metadata = {
    post_id: post.id,
    post_slug: post.slug,
    post_title: post.title,
    author: post.author,
    tags: post.tags ?? [],
    published_at: post.published_at,
    liked: Boolean(liked),
    notify: Boolean(notify),
    shared: Boolean(shared),
    miniverse,
    most_viewed_miniverse: mostViewedMiniverse,
    most_viewed_miniverse_count: mostViewedMiniverseCount ?? null,
  };

  const actionType =
    action === 'like'
      ? 'article_like'
      : action === 'notify'
        ? 'article_notify'
        : 'article_share';

  return trackInteraction({
    action_type: actionType,
    anon_id: anonId,
    context,
    metadata,
  });
}
