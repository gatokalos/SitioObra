import { supabase, supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { trackInteraction } from '@/services/trackService';

const MIN_LIMIT = 1;
const MAX_LIMIT = 20;
const AUDIENCE_PERSPECTIVE_LIKE_ACTION = 'audience_perspective_like';

const clampLimit = (value, fallback = 2) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.trunc(value)));
};

const normalizeServiceError = (error, fallbackMessage) => {
  if (error && typeof error === 'object' && typeof error.message === 'string') {
    return error;
  }
  return { message: fallbackMessage, cause: error ?? null };
};

export async function fetchApprovedAudiencePerspectives(limit = 2) {
  try {
    const safeLimit = clampLimit(limit, 2);
    const { data, error } = await supabasePublic.rpc('get_audience_perspectives', {
      p_limit: safeLimit,
    });
    return { data: data ?? [], error: error ?? null };
  } catch (error) {
    return {
      data: [],
      error: normalizeServiceError(error, 'No pudimos cargar las perspectivas del público.'),
    };
  }
}

export async function submitAudiencePerspective({
  quote,
  authorName,
  authorRole = null,
  metadata = {},
  honeypot = '',
}) {
  try {
    const anonId = ensureAnonId();
    const mergedMetadata = {
      ...metadata,
      ...(anonId ? { anon_id: anonId } : {}),
    };

    const { data, error } = await supabase.rpc('submit_audience_perspective', {
      p_quote: quote,
      p_author_name: authorName,
      p_author_role: authorRole,
      p_metadata: mergedMetadata,
      p_honeypot: honeypot,
    });
    return { data, error: error ?? null };
  } catch (error) {
    return {
      data: null,
      error: normalizeServiceError(error, 'No pudimos enviar tu perspectiva.'),
    };
  }
}

export async function recordAudiencePerspectiveLike({ perspectiveId, user }) {
  const resolvedPerspectiveId = String(perspectiveId || '').trim();
  if (!resolvedPerspectiveId) {
    return { success: false, error: new Error('Falta el identificador de la perspectiva.') };
  }

  const anonId = ensureAnonId();
  if (!anonId) {
    return { success: false, error: new Error('No se pudo generar un anon_id para registrar el pulso.') };
  }

  return trackInteraction({
    action_type: AUDIENCE_PERSPECTIVE_LIKE_ACTION,
    anon_id: anonId,
    context: {
      source: 'provoca_section',
      component: 'AudiencePerspectivePulse',
    },
    metadata: {
      perspective_id: resolvedPerspectiveId,
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      recorded_at: new Date().toISOString(),
    },
  });
}

export async function getAudiencePerspectiveLikeCount(perspectiveId) {
  const resolvedPerspectiveId = String(perspectiveId || '').trim();
  if (!resolvedPerspectiveId) {
    return { success: false, error: new Error('Falta el identificador de la perspectiva.'), count: 0 };
  }

  const { count, error } = await supabasePublic
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('action_type', AUDIENCE_PERSPECTIVE_LIKE_ACTION)
    .eq('metadata->>perspective_id', resolvedPerspectiveId);

  if (error) {
    return { success: false, error, count: 0 };
  }

  return { success: true, error: null, count: count ?? 0 };
}

export async function getAudiencePerspectiveLikeCounts(perspectiveIds = []) {
  const ids = Array.from(
    new Set(
      (Array.isArray(perspectiveIds) ? perspectiveIds : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    )
  );

  if (!ids.length) {
    return { success: true, error: null, countsById: {} };
  }

  const settled = await Promise.all(
    ids.map(async (id) => {
      const { count, error } = await getAudiencePerspectiveLikeCount(id);
      return { id, count: count ?? 0, error: error ?? null };
    })
  );

  const firstError = settled.find((entry) => entry.error)?.error ?? null;
  const countsById = settled.reduce((acc, entry) => {
    acc[entry.id] = entry.count;
    return acc;
  }, {});

  return {
    success: !firstError,
    error: firstError,
    countsById,
  };
}
