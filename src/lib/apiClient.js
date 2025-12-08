// src/lib/apiClient.js
export const API_BASE = import.meta.env.VITE_API_URL || 'https://api.gatoencerrado.ai';

export async function apiFetch(path, opts = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}
