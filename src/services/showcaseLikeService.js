import { ensureAnonId } from '@/lib/identity';
import { supabase, supabasePublic } from '@/lib/supabaseClient';
import { trackInteraction } from '@/services/trackService';

const MINIVERSO_LIKE_TARGETS = {
  miniversos: {
    table: 'miniverso_obra_interactions',
    buildPayload: ({ userId, anonId }) => ({
      interaction_type: 'pulse_like',
      liked: true,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  copycats: {
    table: 'miniverso_cine_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      asset_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  lataza: {
    table: 'miniverso_artesanias_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      cta_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  miniversoNovela: {
    table: 'miniverso_literatura_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      entry_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  miniversoSonoro: {
    table: 'miniverso_sonoridades_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      selection_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  miniversoGrafico: {
    table: 'miniverso_grafico_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      asset_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  miniversoMovimiento: {
    table: 'miniverso_movimiento_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      action_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
  oraculo: {
    table: 'miniverso_oraculo_interactions',
    buildPayload: ({ userId, anonId, metadata }) => ({
      interaction_type: 'pulse_like',
      reflection_id: null,
      metadata,
      user_id: userId,
      anon_id: anonId,
    }),
  },
};

const SHOWCASE_LIKE_IDS = [
  'miniversos',
  'lataza',
  'miniversoNovela',
  'miniversoGrafico',
  'copycats',
  'miniversoSonoro',
  'miniversoMovimiento',
  'apps',
  'oraculo',
];

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

  const interactionResult = await trackInteraction({
    action_type: 'showcase_like',
    anon_id: anonId,
    context: {
      source: 'transmedia',
      component: 'ShowcaseReaction',
    },
    metadata,
  });

  const miniversoTarget = MINIVERSO_LIKE_TARGETS[showcaseId];
  let miniversoResult = { success: true, error: null };
  if (miniversoTarget) {
    try {
      const payload = miniversoTarget.buildPayload({
        userId: user?.id ?? null,
        anonId,
        metadata,
      });
      const { error } = await supabase.from(miniversoTarget.table).insert(payload);
      if (error) {
        console.error('[ShowcaseReaction] Miniverso insert error:', error);
        miniversoResult = { success: false, error };
      }
    } catch (error) {
      console.error('[ShowcaseReaction] Miniverso insert failed:', error);
      miniversoResult = { success: false, error };
    }
  }

  if (!interactionResult.success && interactionResult.error) {
    console.error('[ShowcaseReaction] Interaction insert error:', interactionResult.error);
  }

  return {
    success: interactionResult.success || miniversoResult.success,
    error: interactionResult.error || miniversoResult.error,
  };
}

export async function getShowcaseLikeCount(showcaseId) {
  if (!showcaseId) {
    return { success: false, error: new Error('Falta el identificador del showcase'), count: 0 };
  }

  const { count, error } = await supabasePublic
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('action_type', 'showcase_like')
    .eq('metadata->>showcase_id', showcaseId);

  if (error) {
    return { success: false, error, count: 0 };
  }

  return { success: true, error: null, count: count ?? 0 };
}

export async function getTopShowcaseLikes(limit = 3) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(9, Number(limit))) : 3;
  const settled = await Promise.all(
    SHOWCASE_LIKE_IDS.map(async (showcaseId) => {
      const { count } = await getShowcaseLikeCount(showcaseId);
      return { showcaseId, count: count ?? 0 };
    })
  );

  const top = settled
    .sort((a, b) => (b.count - a.count) || a.showcaseId.localeCompare(b.showcaseId))
    .slice(0, safeLimit);

  return { success: true, error: null, data: top };
}
