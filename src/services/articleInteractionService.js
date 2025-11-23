import { supabase } from '@/lib/supabaseClient';

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
    metadata: {
      author: post.author,
      tags: post.tags ?? [],
      published_at: post.published_at,
    },
  };

  const { error } = await supabase.from('blog_article_interactions').insert(payload);

  return { success: !error, error };
}
