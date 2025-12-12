import { ensureAnonId } from '@/lib/identity';
import { trackInteraction } from '@/services/trackService';

export async function recordShowcaseLike({ showcaseId, user }) {
  if (!showcaseId) {
    return { success: false, error: new Error('Falta el identificador del showcase') };
  }

  const anonId = ensureAnonId();
  if (!anonId) {
    return { success: false, error: new Error('No se pudo generar un anon_id para la interacción.') };
  }

  const metadata = {
    showcase_id: showcaseId,
    recorded_at: new Date().toISOString(),
    user_email: user?.email ?? null,
  };

  return trackInteraction({
    action_type: 'showcase_like',
    anon_id: anonId,
    context: {
      source: 'transmedia',
      component: 'ShowcaseReaction',
    },
    metadata,
  });
}
