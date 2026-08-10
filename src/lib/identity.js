import { supabase } from '@/lib/supabaseClient';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const STORAGE_KEY = 'gx_anon_id';

// Override en memoria (no localStorage) para deep-links de Bitácora diferida:
// el anon_id del link (?t=...) puede no coincidir con el de este navegador —
// forzarlo a localStorage pisaría la identidad real de quien abre el link en
// su propio dispositivo. Vive solo mientras dure la pestaña.
let anonIdOverride = null;

export function setAnonIdOverride(id) {
  anonIdOverride = typeof id === 'string' && id.trim() ? id.trim() : null;
}

function canUseLocalStorage() {
  return typeof window !== 'undefined';
}

function createAnonId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getAnonId() {
  if (anonIdOverride) return anonIdOverride;
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return safeGetItem(STORAGE_KEY);
  } catch (error) {
    console.warn('gx_anon_id read failed', error);
    return null;
  }
}

export function ensureAnonId() {
  if (anonIdOverride) return anonIdOverride;
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const existing = safeGetItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextId = createAnonId();
    safeSetItem(STORAGE_KEY, nextId);
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
    // RPC en vez de upsert directo a la tabla: PostgREST hace el upsert como
    // INSERT ... ON CONFLICT DO UPDATE, y eso exige bajo RLS poder ver la
    // fila en conflicto — exponer SELECT filtraría IP/user-agent de
    // cualquier visitante a quien tenga la anon key (pública). La función
    // corre con privilegios elevados y la tabla queda sin acceso directo.
    const { error } = await supabase.rpc('touch_anon_session', {
      p_anon_id: anonId,
      p_user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent ?? null,
    });

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
