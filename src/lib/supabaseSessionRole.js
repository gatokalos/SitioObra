let hasWarnedUnsupportedClientRole = false;

function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null;
  const segments = token.split('.');
  if (segments.length < 2 || typeof atob !== 'function') return null;

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return JSON.parse(atob(normalized + padding));
  } catch {
    return null;
  }
}

export function getSupabaseSessionRole(session) {
  const decodedRole = decodeJwtPayload(session?.access_token)?.role;
  if (typeof decodedRole === 'string' && decodedRole.trim()) {
    return decodedRole.trim();
  }

  const userRole = session?.user?.role;
  if (typeof userRole === 'string' && userRole.trim()) {
    return userRole.trim();
  }

  return null;
}

export function canQuerySubscriptionTableFromClient(session) {
  const role = getSupabaseSessionRole(session);
  return role == null || role === 'authenticated';
}

export function warnUnsupportedClientRole(session, contextLabel) {
  const role = getSupabaseSessionRole(session);
  if (!role || role === 'authenticated' || hasWarnedUnsupportedClientRole) return;

  hasWarnedUnsupportedClientRole = true;
  console.warn(
    `[supabase] Skipping client-side subscription query in ${contextLabel}: session role "${role}" is not supported for PostgREST browser reads.`
  );
}
