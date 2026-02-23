const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const isLoopbackHost = (hostname = '') => LOOPBACK_HOSTS.has(hostname.toLowerCase());

export const sanitizeExternalHttpUrl = (value, options = {}) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  // Relative paths and non-http schemes are resolved by the browser/app as-is.
  if (!/^https?:\/\//i.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    if (!isLoopbackHost(parsed.hostname)) {
      return parsed.toString();
    }

    // Keep localhost URLs while the app itself is running on loopback.
    if (typeof window !== 'undefined') {
      const { hostname } = window.location;
      if (isLoopbackHost(hostname)) {
        return parsed.toString();
      }
    }

    if (options?.fallbackToNull !== false) {
      return null;
    }

    return raw;
  } catch {
    return raw;
  }
};
