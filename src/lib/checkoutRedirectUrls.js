export const CANONICAL_SITE_ORIGIN = 'https://universogatoencerrado.com';

const LEGACY_SITE_HOSTS = new Set([
  'esungatoencerrado.com',
  'www.esungatoencerrado.com',
  'estungatoencerrado.com',
  'www.estungatoencerrado.com',
]);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function isLocalUrl(url) {
  return url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname.toLowerCase());
}

function isCurrentLocationLocal() {
  if (typeof window === 'undefined') return false;

  try {
    return isLocalUrl(new URL(window.location.href));
  } catch {
    return false;
  }
}

function toCanonicalOrigin(url) {
  const canonical = new URL(CANONICAL_SITE_ORIGIN);
  url.protocol = canonical.protocol;
  url.hostname = canonical.hostname;
  url.port = canonical.port;
  return url;
}

export function normalizeSiteRedirectUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  try {
    const base = typeof window !== 'undefined' ? window.location.href : CANONICAL_SITE_ORIGIN;
    const url = new URL(value.trim(), base);
    const normalizedHost = url.hostname.toLowerCase();

    if (isLocalUrl(url)) {
      return (isCurrentLocationLocal() ? url : toCanonicalOrigin(url)).toString();
    }

    if (LEGACY_SITE_HOSTS.has(normalizedHost)) {
      return toCanonicalOrigin(url).toString();
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

export function resolveSiteOrigin() {
  if (typeof window === 'undefined') {
    return CANONICAL_SITE_ORIGIN;
  }

  const normalizedUrl = normalizeSiteRedirectUrl(window.location.href);
  if (!normalizedUrl) return CANONICAL_SITE_ORIGIN;

  try {
    return new URL(normalizedUrl).origin;
  } catch {
    return CANONICAL_SITE_ORIGIN;
  }
}

export function buildCurrentSiteRedirectUrl({ includeSearch = true, includeHash = true } = {}) {
  if (typeof window === 'undefined') return CANONICAL_SITE_ORIGIN;

  const { pathname, search, hash } = window.location;
  const cleanHash = hash && !hash.includes('access_token') && !hash.includes('refresh_token')
    ? hash
    : '';
  return normalizeSiteRedirectUrl(
    `${pathname}${includeSearch ? search : ''}${includeHash ? cleanHash : ''}`
  );
}

function joinOriginPath(origin, path) {
  if (!path) return origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildCheckoutRedirectUrls({
  successPath = '/gracias?session_id={CHECKOUT_SESSION_ID}',
  cancelPath = '/cancelado',
} = {}) {
  const origin = resolveSiteOrigin();

  return {
    success_url: joinOriginPath(origin, successPath),
    cancel_url: joinOriginPath(origin, cancelPath),
  };
}
