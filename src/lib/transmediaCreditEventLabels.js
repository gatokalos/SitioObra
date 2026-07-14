// Traduce las claves internas del ledger de GATokens (transmedia_credit_events)
// a nombres de vitrina/miniverso legibles para el visitante.
//
// El ledger usa DOS sistemas de identificadores distintos según quién escribió
// el evento:
//   - claves de PORTAL ('cine', 'literatura', 'artesanias', 'grafico',
//     'sonoridades', 'movimiento', 'juegos', 'oraculo', 'obra') — usadas por
//     flip:nota-autoral:{portal} y resonance:l3-reward:{portal}.
//   - ids de SHOWCASE ('copycats', 'miniversoNovela', 'lataza',
//     'miniversoGrafico', 'miniversos', 'miniversoSonoro',
//     'miniversoMovimiento', 'apps', 'oraculo') — usados por
//     showcase_boost:{showcaseId} (useExplorerBadge.js) y por
//     resolveShowcaseFromAppId/showcaseDefinitions (recomendación del Oráculo).
// No se importan de transmediaConstants.jsx para no arrastrar ese archivo
// (imágenes, iconos, copy largo) solo para leer un título.

const PORTAL_KEY_TITLES = {
  obra: 'Teatro',
  literatura: 'Literatura',
  artesanias: 'Artesanías',
  grafico: 'Gráficos',
  cine: 'Cine',
  sonoridades: 'Sonoridades',
  movimiento: 'Movimiento',
  juegos: 'Juegos',
  oraculo: 'Oráculo',
};

const SHOWCASE_ID_TITLES = {
  miniversos: 'Teatro',
  lataza: 'Artesanías',
  miniversoNovela: 'Literatura',
  miniversoGrafico: 'Gráficos',
  copycats: 'Cine',
  miniversoSonoro: 'Sonoridades',
  miniversoMovimiento: 'Movimiento',
  apps: 'Juegos',
  oraculo: 'Oráculo',
};

// event_key exactos con sufijos que no son un id limpio (no se pueden derivar
// por prefijo) — se listan tal cual aparecen en el código que los dispara.
const EXACT_EVENT_KEY_TITLES = {
  'showcase_boost:copycats_full_unlock': 'Cine',
  'showcase_boost:novela_fragment_unlock': 'Literatura',
  'showcase_boost:obra_voice_turn': 'Teatro',
  sonoro_unlock: 'Sonoridades',
  graphic_unlock: 'Gráficos',
  novela_question: 'Literatura',
  taza_activation: 'Artesanías',
  explorer_badge_reward_subscriber: 'Insignia de explorador',
  explorer_badge_reward_guest: 'Insignia de explorador',
};

export const portalKeyTitle = (portalKey) => PORTAL_KEY_TITLES[portalKey] || null;
export const showcaseIdTitle = (showcaseId) => SHOWCASE_ID_TITLES[showcaseId] || null;

// { title, portalKey } — portalKey solo cuando el evento apunta a un portal
// concreto y navegable (útil para armar un CTA más adelante).
export const describeTransmediaCreditEvent = (event) => {
  const eventKey = typeof event?.eventKey === 'string' ? event.eventKey : '';
  const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};

  if (EXACT_EVENT_KEY_TITLES[eventKey]) {
    return { title: EXACT_EVENT_KEY_TITLES[eventKey], portalKey: null };
  }

  if (eventKey.startsWith('showcase_boost:')) {
    const suffix = metadata.showcaseId || eventKey.replace('showcase_boost:', '');
    return { title: showcaseIdTitle(suffix) || 'Un miniverso', portalKey: null };
  }
  if (eventKey.startsWith('flip:nota-autoral:')) {
    const portalKey = eventKey.replace('flip:nota-autoral:', '');
    return { title: portalKeyTitle(portalKey) || 'Un miniverso', portalKey };
  }
  if (eventKey.startsWith('resonance:l3-reward:')) {
    const portalKey = metadata.portal || eventKey.replace('resonance:l3-reward:', '');
    return { title: portalKeyTitle(portalKey) || 'Un miniverso', portalKey };
  }
  if (eventKey.startsWith('bienvenida_reward:')) {
    return { title: 'La bienvenida', portalKey: null };
  }
  return { title: 'Un miniverso', portalKey: null };
};

// Recorre el historial (ya viene ordenado created_at desc) y devuelve la
// recomendación "gasta tus GAT aquí después" más reciente: el
// metadata.recommended del último resonance:l3-reward:% con esa pista.
export const findLatestRecommendedPortal = (events = []) => {
  for (const event of events) {
    const eventKey = typeof event?.eventKey === 'string' ? event.eventKey : '';
    if (!eventKey.startsWith('resonance:l3-reward:')) continue;
    const recommendedPortalKey = event?.metadata?.recommended;
    if (typeof recommendedPortalKey === 'string' && recommendedPortalKey) {
      const title = portalKeyTitle(recommendedPortalKey);
      if (title) return { portalKey: recommendedPortalKey, title };
    }
  }
  return null;
};

// Copia durable de la recomendación del Oráculo (ver Hero.jsx) — un showcaseId,
// no una clave de portal.
const ORACULO_RECOMMENDED_SHOWCASE_STORAGE_KEY = 'gatoencerrado:oraculo-recommended-showcase';

export const readOraculoRecommendedShowcase = () => {
  if (typeof window === 'undefined') return null;
  try {
    const showcaseId = window.localStorage.getItem(ORACULO_RECOMMENDED_SHOWCASE_STORAGE_KEY);
    if (!showcaseId) return null;
    const title = showcaseIdTitle(showcaseId);
    return title ? { showcaseId, title } : null;
  } catch {
    return null;
  }
};
