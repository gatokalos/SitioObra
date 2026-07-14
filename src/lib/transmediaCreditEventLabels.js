// Traduce las claves internas del ledger de GATokens (transmedia_credit_events)
// a nombres de vitrina/miniverso legibles para el visitante, y resuelve un
// showcaseId navegable (#transmedia?focus={showcaseId}, mismo patrón que
// TRANSMEDIA_SECONDARY_ITEMS en Header.jsx) para que el tooltip pueda ser un
// atajo real de regreso, no solo texto informativo.
//
// El ledger usa DOS sistemas de identificadores según quién escribió el evento:
//   - claves de PORTAL ('cine', 'literatura', 'artesanias', 'grafico',
//     'sonoridades', 'movimiento', 'juegos', 'oraculo', 'obra') — usadas por
//     flip:nota-autoral:{portal}, resonance:l3-reward:{portal} y
//     resonance:evidence:{portal}.
//   - ids de SHOWCASE ('copycats', 'miniversoNovela', 'lataza',
//     'miniversoGrafico', 'miniversos', 'miniversoSonoro',
//     'miniversoMovimiento', 'apps', 'oraculo') — usados por
//     showcase_boost:{showcaseId}, graphic_unlock/sonoro_unlock/etc., y por
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

const PORTAL_KEY_TO_SHOWCASE_ID = {
  obra: 'miniversos',
  literatura: 'miniversoNovela',
  artesanias: 'lataza',
  grafico: 'miniversoGrafico',
  cine: 'copycats',
  sonoridades: 'miniversoSonoro',
  movimiento: 'miniversoMovimiento',
  juegos: 'apps',
  oraculo: 'oraculo',
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
const EXACT_EVENT_KEY = {
  'showcase_boost:copycats_full_unlock': 'copycats',
  'showcase_boost:novela_fragment_unlock': 'miniversoNovela',
  'showcase_boost:obra_voice_turn': 'miniversos',
  sonoro_unlock: 'miniversoSonoro',
  graphic_unlock: 'miniversoGrafico',
  novela_question: 'miniversoNovela',
  taza_activation: 'lataza',
};

export const portalKeyTitle = (portalKey) => PORTAL_KEY_TITLES[portalKey] || null;
export const showcaseIdTitle = (showcaseId) => SHOWCASE_ID_TITLES[showcaseId] || null;
export const portalKeyToShowcaseId = (portalKey) => PORTAL_KEY_TO_SHOWCASE_ID[portalKey] || null;

// { title, showcaseId } — showcaseId listo para usarse en un link
// #transmedia?focus={showcaseId}; null cuando el evento no apunta a una
// vitrina concreta (ej. insignia de explorador).
export const describeTransmediaCreditEvent = (event) => {
  const eventKey = typeof event?.eventKey === 'string' ? event.eventKey : '';
  const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};

  if (EXACT_EVENT_KEY[eventKey]) {
    const showcaseId = EXACT_EVENT_KEY[eventKey];
    return { title: showcaseIdTitle(showcaseId), showcaseId };
  }

  if (eventKey.startsWith('showcase_boost:')) {
    const showcaseId = metadata.showcaseId || eventKey.replace('showcase_boost:', '');
    return { title: showcaseIdTitle(showcaseId) || 'Un miniverso', showcaseId: showcaseIdTitle(showcaseId) ? showcaseId : null };
  }
  if (eventKey.startsWith('flip:nota-autoral:')) {
    const portalKey = eventKey.replace('flip:nota-autoral:', '');
    const showcaseId = portalKeyToShowcaseId(portalKey);
    return { title: portalKeyTitle(portalKey) || 'Un miniverso', showcaseId };
  }
  if (eventKey.startsWith('resonance:l3-reward:')) {
    const portalKey = metadata.portal || eventKey.replace('resonance:l3-reward:', '');
    const showcaseId = portalKeyToShowcaseId(portalKey);
    return { title: portalKeyTitle(portalKey) || 'Un miniverso', showcaseId };
  }
  if (eventKey.startsWith('resonance:evidence:')) {
    const portalKey = metadata.miniverso_id || eventKey.replace('resonance:evidence:', '');
    const showcaseId = portalKeyToShowcaseId(portalKey);
    return { title: portalKeyTitle(portalKey) || 'Un miniverso', showcaseId };
  }
  if (eventKey.startsWith('bienvenida_reward:')) {
    return { title: 'La bienvenida', showcaseId: null };
  }
  if (eventKey === 'explorer_badge_reward_subscriber' || eventKey === 'explorer_badge_reward_guest') {
    return { title: 'Insignia de explorador', showcaseId: null };
  }
  return { title: 'Un miniverso', showcaseId: null };
};

// La recomendación "gasta tus GAT aquí después": el metadata.recommended del
// resonance:l3-reward:% más reciente (ya viviste algo y el sistema sugiere el
// siguiente paso). Devuelve null si nunca se completó un L3.
export const findLatestRecommendedPortal = (events = []) => {
  for (const event of events) {
    const eventKey = typeof event?.eventKey === 'string' ? event.eventKey : '';
    if (!eventKey.startsWith('resonance:l3-reward:')) continue;
    const recommendedPortalKey = event?.metadata?.recommended;
    if (typeof recommendedPortalKey === 'string' && recommendedPortalKey) {
      const title = portalKeyTitle(recommendedPortalKey);
      const showcaseId = portalKeyToShowcaseId(recommendedPortalKey);
      if (title && showcaseId) return { title, showcaseId };
    }
  }
  return null;
};

// "¿Dónde tengo GAT gastados/en curso ahora mismo?" — el evento más reciente
// de CUALQUIER tipo que resuelva a una vitrina concreta. A diferencia de
// findLatestRecommendedPortal (que solo mira L3 completados), esto cubre el
// caso normal: alguien que desbloqueó o dejó evidencia en un miniverso y
// quiere un atajo para volver a terminarlo.
export const findLatestSpendTarget = (events = []) => {
  for (const event of events) {
    const { title, showcaseId } = describeTransmediaCreditEvent(event);
    if (showcaseId && title) return { title, showcaseId };
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
