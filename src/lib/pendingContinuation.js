import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

export const PENDING_CONTINUATION_STORAGE_KEY = 'gatoencerrado:pending-continuation:v1';
export const LEGACY_PENDING_VITRANA_STORAGE_KEY = 'gatoencerrado:pending-vitrana-id';

const normalizeContinuation = (value) => {
  if (!value || typeof value !== 'object') return null;
  const showcaseId = typeof value.showcaseId === 'string' ? value.showcaseId.trim() : '';
  if (!showcaseId) return null;
  return {
    source: typeof value.source === 'string' && value.source ? value.source : 'unknown',
    showcaseId,
    forma: typeof value.forma === 'string' && value.forma.trim() ? value.forma.trim() : null,
    presentation: value.presentation === 'narrative-video' ? value.presentation : 'narrative-video',
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
  };
};

export const writePendingContinuation = (continuation) => {
  const normalized = normalizeContinuation(continuation);
  if (!normalized) return null;
  safeSetItem(PENDING_CONTINUATION_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const readPendingContinuation = () => {
  const raw = safeGetItem(PENDING_CONTINUATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeContinuation(JSON.parse(raw));
  } catch {
    safeRemoveItem(PENDING_CONTINUATION_STORAGE_KEY);
    return null;
  }
};

export const consumePendingContinuation = () => {
  const continuation = readPendingContinuation();
  if (continuation) {
    safeRemoveItem(PENDING_CONTINUATION_STORAGE_KEY);
    safeRemoveItem(LEGACY_PENDING_VITRANA_STORAGE_KEY);
    return continuation;
  }

  // Compatibilidad con intenciones creadas antes de introducir el contrato
  // contextual. Se consume una sola vez, igual que la versión nueva.
  const legacyShowcaseId = safeGetItem(LEGACY_PENDING_VITRANA_STORAGE_KEY);
  if (!legacyShowcaseId) return null;
  safeRemoveItem(LEGACY_PENDING_VITRANA_STORAGE_KEY);
  return normalizeContinuation({
    source: 'legacy-vitrana-login',
    showcaseId: legacyShowcaseId,
    presentation: 'narrative-video',
  });
};
