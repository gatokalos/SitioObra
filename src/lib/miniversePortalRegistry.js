const PORTAL_STATUS = {
  READY: 'ready',
  OBSOLETE: 'obsolete',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
};

export const MINIVERSE_PORTAL_REGISTRY = [
  {
    id: 'escena-obra',
    label: 'Obra',
    priority: 1,
    formatId: 'miniversos',
    cardId: 'drama',
    route: '/portal-voz',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'lectura',
    label: 'Literatura',
    priority: 2,
    formatId: 'miniversoNovela',
    cardId: 'literatura',
    route: '/portal-literatura',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'artesanias',
    label: 'Artesanias',
    priority: 3,
    formatId: 'lataza',
    cardId: 'taza',
    route: '/portal-artesanias',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'cine',
    label: 'Cine',
    priority: 4,
    formatId: 'copycats',
    cardId: 'copycats',
    route: '/portal-cine',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'graficos',
    label: 'Graficos',
    priority: 5,
    formatId: 'miniversoGrafico',
    cardId: 'graficos',
    route: '/portal-graficos',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'sonoridades',
    label: 'Sonoridades',
    priority: 6,
    formatId: 'miniversoSonoro',
    cardId: 'sonoro',
    route: '/portal-sonoridades',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'movimiento',
    label: 'Movimiento',
    priority: 7,
    formatId: 'miniversoMovimiento',
    cardId: 'movimiento',
    route: '/portal-movimiento',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'apps',
    label: 'Apps',
    priority: 8,
    formatId: 'apps',
    cardId: 'apps',
    route: '/portal-juegos',
    status: PORTAL_STATUS.READY,
  },
  {
    id: 'oraculo',
    label: 'Oráculo',
    priority: 9,
    formatId: 'oraculo',
    cardId: 'oraculo',
    route: '/portal-oraculo',
    status: PORTAL_STATUS.READY,
  },
];

const byFormatId = new Map(
  MINIVERSE_PORTAL_REGISTRY
    .filter((entry) => entry.formatId)
    .map((entry) => [entry.formatId, entry]),
);

const byCardId = new Map(
  MINIVERSE_PORTAL_REGISTRY
    .filter((entry) => entry.cardId)
    .map((entry) => [entry.cardId, entry]),
);

export const getPortalRegistryEntry = ({ formatId = null, cardId = null } = {}) => {
  if (formatId && byFormatId.has(formatId)) {
    return byFormatId.get(formatId);
  }
  if (cardId && byCardId.has(cardId)) {
    return byCardId.get(cardId);
  }
  return null;
};

export const resolvePortalRoute = ({
  formatId = null,
  cardId = null,
  mobileOnly = false,
  isMobileViewport = false,
} = {}) => {
  if (mobileOnly && !isMobileViewport) {
    return null;
  }
  const entry = getPortalRegistryEntry({ formatId, cardId });
  if (!entry) {
    return null;
  }
  if (entry.status !== PORTAL_STATUS.READY) {
    return null;
  }
  return entry.route || null;
};

export const getPortalMigrationQueue = () =>
  [...MINIVERSE_PORTAL_REGISTRY].sort((a, b) => a.priority - b.priority);

export const portalRegistryStatus = PORTAL_STATUS;
