import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { MINIVERSE_PORTAL_REGISTRY } from '@/lib/miniversePortalRegistry';

// Nombre canónico en DB por label del registry (fuente de verdad: miniversePortalRegistry)
const PORTAL_LABEL_TO_DB = {
  'Obra':         'obra',
  'Literatura':   'literatura',
  'Artesanias':   'artesanias',
  'Cine':         'cine',
  'Graficos':     'grafico',
  'Sonoridades':  'sonoridades',
  'Movimiento':   'movimiento',
  'Apps':         'juegos',
  'Oráculo':      'oraculo',
};

// Derivado del registry — no hay que mantenerlo a mano
const FORMAT_ID_TO_PORTAL = Object.fromEntries(
  MINIVERSE_PORTAL_REGISTRY
    .map((entry) => [entry.formatId, PORTAL_LABEL_TO_DB[entry.label]])
    .filter(([, portal]) => portal)
);

const VALID_PORTALS = new Set(Object.values(FORMAT_ID_TO_PORTAL));

function insertPortalEntry(portal, user) {
  const anonId = ensureAnonId();
  supabase
    .from('miniverso_portal_entries')
    .insert({
      portal,
      anon_id: anonId ?? null,
      user_id: user?.id ?? null,
      metadata: { recorded_at: new Date().toISOString() },
    })
    .then(({ error }) => {
      if (error) console.warn('[portalTracking]', portal, error.message);
    });
}

/**
 * Tracking para portales móvil (Portal*.jsx monta como página).
 * @param {string} portal - nombre canónico del portal
 * @param {object} [user] - objeto user de useAuth()
 */
export function trackPortalOpen(portal, user = null) {
  if (!VALID_PORTALS.has(portal)) {
    console.warn('[portalTracking] portal desconocido:', portal);
    return;
  }
  insertPortalEntry(portal, user);
}

/**
 * Tracking para vitrinas desktop (openMiniverseById en Transmedia).
 * Recibe el formatId interno y lo normaliza al nombre canónico.
 * @param {string} formatId - id interno del showcase (ej. 'miniversoNovela')
 * @param {object} [user]   - objeto user de useAuth()
 */
export function trackVitranaOpen(formatId, user = null) {
  const portal = FORMAT_ID_TO_PORTAL[formatId];
  if (!portal) return; // formatId sin mapeo (ej. apps, juegos) — se ignora
  insertPortalEntry(portal, user);
}
