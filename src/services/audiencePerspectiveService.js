import { supabase, supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const MIN_LIMIT = 1;
const MAX_LIMIT = 20;

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
