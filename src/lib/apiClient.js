import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';

const RAW_API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';
export const API_BASE = sanitizeExternalHttpUrl(RAW_API_BASE);

let warnedInvalidApiBase = false;

export async function apiFetch(path, opts = {}) {
  if (!API_BASE) {
    if (!warnedInvalidApiBase) {
      warnedInvalidApiBase = true;
      console.warn('[apiClient] VITE_API_URL no es alcanzable desde este origen, se omite la petición.');
    }
    throw new Error('API_BASE_UNREACHABLE');
  }

  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(anon ? {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      } : {}),
      ...(opts.headers || {}),
    },
  });
}
