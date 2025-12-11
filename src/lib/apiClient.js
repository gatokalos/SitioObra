export const API_BASE = import.meta.env.VITE_API_URL;

export async function apiFetch(path, opts = {}) {
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