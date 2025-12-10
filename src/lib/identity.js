import { supabase } from '@/lib/supabaseClient';

const STORAGE_KEY = 'gx_anon_id';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createAnonId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getAnonId() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('gx_anon_id read failed', error);
    return null;
  }
}

export function ensureAnonId() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextId = createAnonId();
    window.localStorage.setItem(STORAGE_KEY, nextId);
    return nextId;
  } catch (error) {
    console.warn('gx_anon_id storage unavailable', error);
    return null;
  }
}

export async function touchAnonSession() {
  const anonId = ensureAnonId();
  if (!anonId) {
    return { success: false, error: null };
  }

  try {
    const { error } = await supabase
      .from('anon_sessions')
      .upsert(
        {
          anon_id: anonId,
          last_seen_at: new Date().toISOString(),
          user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent ?? null,
        },
        { onConflict: 'anon_id' },
      );

    if (error) {
      console.error('touchAnonSession upsert failed', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('touchAnonSession error', error);
    return { success: false, error };
  }
}

export async function getUnifiedIdentity() {
  const anon_id = getAnonId();
  return {
    anon_id,
    people_id: null,
  };
}
