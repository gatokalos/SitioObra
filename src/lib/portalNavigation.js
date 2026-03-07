const DEFAULT_HOME_RETURN_URL = '/?heroTab=experiences#hero';

const normalizeLocationPath = (locationLike) => {
  const pathname = typeof locationLike?.pathname === 'string' ? locationLike.pathname : '/';
  const search = typeof locationLike?.search === 'string' ? locationLike.search : '';
  // Intentionally ignore hash to avoid accidental anchor jumps (e.g. #contact)
  // when returning from mobile portals. We restore exact viewport using scrollY.
  return `${pathname}${search}` || '/';
};

export const createPortalLaunchState = (locationLike, source = 'unknown', extras = {}) => {
  const returnUrl = normalizeLocationPath(locationLike);
  const scrollY =
    typeof window === 'undefined' ? 0 : Math.max(0, Number(window.scrollY || window.pageYOffset || 0));
  const returnShowcaseId =
    typeof extras?.showcaseId === 'string' && extras.showcaseId.trim() ? extras.showcaseId.trim() : null;

  return {
    portalLaunchSource: source,
    portalLaunchToken: `${Date.now()}-${Math.round(scrollY)}`,
    portalReturnUrl: returnUrl,
    portalReturnScrollY: scrollY,
    portalReturnShowcaseId: returnShowcaseId,
  };
};

export const resolvePortalReturnTarget = (locationState, fallbackUrl = DEFAULT_HOME_RETURN_URL) => {
  const rawReturnUrl = typeof locationState?.portalReturnUrl === 'string' ? locationState.portalReturnUrl : '';
  const portalReturnUrl =
    rawReturnUrl.trim() && !rawReturnUrl.startsWith('/portal-') ? rawReturnUrl : fallbackUrl;

  const rawScrollY = Number(locationState?.portalReturnScrollY);
  const portalReturnScrollY = Number.isFinite(rawScrollY) ? Math.max(0, rawScrollY) : null;
  const portalReturnShowcaseId =
    typeof locationState?.portalReturnShowcaseId === 'string' && locationState.portalReturnShowcaseId.trim()
      ? locationState.portalReturnShowcaseId.trim()
      : null;

  const restoreToken =
    typeof locationState?.portalLaunchToken === 'string' && locationState.portalLaunchToken.trim()
      ? locationState.portalLaunchToken
      : `${Date.now()}`;

  return {
    portalReturnUrl,
    portalReturnScrollY,
    portalReturnShowcaseId,
    restoreToken,
  };
};
