export const BIENVENIDA_APP_TO_SHOWCASE = {
  // Canonical appIds from Bienvenida
  'miniverso-obra': 'miniversos',
  'miniverso-artesanias': 'lataza',
  'miniverso-cine': 'copycats',
  'miniverso-graficos': 'miniversoGrafico',
  'miniverso-novela': 'miniversoNovela',
  'miniverso-sonoro': 'miniversoSonoro',
  'miniverso-movimiento': 'miniversoMovimiento',
  'miniverso-oraculo': 'oraculo',
  'miniverso-juegos': 'apps',

  // Historical aliases
  apps: 'apps',
  juegos: 'apps',
  juego: 'apps',
  app: 'apps',
  'app-juegos': 'apps',
  'miniverso-juegos': 'apps',
  'miniverso-apps': 'apps',
  oraculo: 'oraculo',
  oracle: 'oraculo',
  'app-oraculo': 'oraculo',
  'miniverso-oraculo': 'oraculo',
  novela: 'miniversoNovela',
  literatura: 'miniversoNovela',
  letras: 'miniversoNovela',
  'app-literatura': 'miniversoNovela',
  'miniverso-literatura': 'miniversoNovela',
  'miniverso-novela': 'miniversoNovela',
  grafico: 'miniversoGrafico',
  graficos: 'miniversoGrafico',
  grafica: 'miniversoGrafico',
  visual: 'miniversoGrafico',
  'app-grafico': 'miniversoGrafico',
  'miniverso-grafico': 'miniversoGrafico',
  'miniverso-graficos': 'miniversoGrafico',
  sonoro: 'miniversoSonoro',
  audio: 'miniversoSonoro',
  musica: 'miniversoSonoro',
  'app-sonoro': 'miniversoSonoro',
  'miniverso-sonoro': 'miniversoSonoro',
  'miniverso-sonoridades': 'miniversoSonoro',
  movimiento: 'miniversoMovimiento',
  danza: 'miniversoMovimiento',
  ruta: 'miniversoMovimiento',
  'app-movimiento': 'miniversoMovimiento',
  'miniverso-movimiento': 'miniversoMovimiento',
  artesanias: 'lataza',
  artesania: 'lataza',
  taza: 'lataza',
  merch: 'lataza',
  'la-taza': 'lataza',
  'miniverso-artesanias': 'lataza',
  cine: 'copycats',
  video: 'copycats',
  copycats: 'copycats',
  quiron: 'copycats',
  'app-cine': 'copycats',
  miniversos: 'miniversos',
  obra: 'miniversos',
  teatro: 'miniversos',
  tragedia: 'miniversos',
  escenario: 'miniversos',
  'app-obra': 'miniversos',
  'miniverso-obra': 'miniversos',
};

export const HASH_TO_SHOWCASE = {
  transmedia: null,
  obra: 'miniversos',
  miniversos: 'miniversos',
  oraculo: 'oraculo',
  apps: 'apps',
  juegos: 'apps',
  artesanias: 'lataza',
  taza: 'lataza',
  cine: 'copycats',
  copycats: 'copycats',
  novela: 'miniversoNovela',
  literatura: 'miniversoNovela',
  graficos: 'miniversoGrafico',
  grafico: 'miniversoGrafico',
  sonoro: 'miniversoSonoro',
  movimiento: 'miniversoMovimiento',
};

export const normalizeBridgeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const extractRecommendedAppId = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const raw =
    payload.appId ?? payload.app_id ?? payload.recommended_app ?? payload.recommendedApp ?? payload.id;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw !== 'object') return null;
  return raw.id ?? raw.app_id ?? raw.recommended_app ?? raw.slug ?? null;
};

export const resolveShowcaseFromAppId = (appId, showcaseDefinitions = null) => {
  if (!appId || typeof appId !== 'string') return null;
  const normalized = normalizeBridgeKey(appId);
  if (!normalized) return null;
  if (showcaseDefinitions && showcaseDefinitions[normalized]) return normalized;
  if (BIENVENIDA_APP_TO_SHOWCASE[normalized]) return BIENVENIDA_APP_TO_SHOWCASE[normalized];
  const strippedPrefix = normalized.replace(/^(app|miniverso|vitrina)-/, '');
  if (showcaseDefinitions && showcaseDefinitions[strippedPrefix]) return strippedPrefix;
  if (BIENVENIDA_APP_TO_SHOWCASE[strippedPrefix]) return BIENVENIDA_APP_TO_SHOWCASE[strippedPrefix];
  return null;
};

export const resolveShowcaseFromHash = (hashValue, showcaseDefinitions = null) => {
  const normalizedHash = normalizeBridgeKey(String(hashValue || '').replace(/^#/, ''));
  if (!normalizedHash) return null;
  if (showcaseDefinitions && showcaseDefinitions[normalizedHash]) return normalizedHash;
  if (HASH_TO_SHOWCASE[normalizedHash] !== undefined) return HASH_TO_SHOWCASE[normalizedHash];
  if (BIENVENIDA_APP_TO_SHOWCASE[normalizedHash]) return BIENVENIDA_APP_TO_SHOWCASE[normalizedHash];
  const strippedPrefix = normalizedHash.replace(/^(app|miniverso|vitrina)-/, '');
  if (showcaseDefinitions && showcaseDefinitions[strippedPrefix]) return strippedPrefix;
  if (HASH_TO_SHOWCASE[strippedPrefix] !== undefined) return HASH_TO_SHOWCASE[strippedPrefix];
  if (BIENVENIDA_APP_TO_SHOWCASE[strippedPrefix]) return BIENVENIDA_APP_TO_SHOWCASE[strippedPrefix];
  return null;
};
