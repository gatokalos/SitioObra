import { useState, useRef, useCallback } from 'react';

// Variable dedicada para el backend Express (puerto 5050).
// No usa VITE_API_URL para no interferir con las Supabase Edge Functions.
const RAW_API_URL = (import.meta.env.VITE_SEARCH_API_URL ?? import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/**
 * Hook de búsqueda inteligente RAG para GatoEncerrado.
 *
 * Conecta con el endpoint POST /search del search-api (Express + Claude).
 * Recibe la respuesta vía Server-Sent Events (SSE) y expone el texto
 * a medida que Claude lo genera.
 *
 * @returns {object} { query, setQuery, answer, sources, status, search, reset }
 *
 * status: 'idle' | 'searching' | 'streaming' | 'done' | 'error'
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Permite cancelar una búsqueda en curso
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setAnswer('');
    setSources([]);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const search = useCallback(async (rawQuery) => {
    const q = (rawQuery ?? query).trim();
    if (!q || q.length < 2) return;
    if (!RAW_API_URL) {
      console.warn('[useSearch] VITE_API_URL no está definido.');
      setStatus('error');
      setErrorMessage('La API de búsqueda no está configurada.');
      return;
    }

    // Cancelar búsqueda anterior si existe
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnswer('');
    setSources([]);
    setErrorMessage('');
    setStatus('searching');

    try {
      const res = await fetch(`${RAW_API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }

      setStatus('streaming');

      // Leer el stream SSE manualmente con ReadableStream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Los eventos SSE terminan en '\n\n'
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // el último fragmento puede estar incompleto

        for (const part of parts) {
          const line = part.trim();
          if (!line || line.startsWith(':')) continue; // heartbeat / comentario

          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
          let event;
          try {
            event = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (event.type === 'delta') {
            setAnswer((prev) => prev + event.text);
          } else if (event.type === 'done') {
            setSources(event.sources ?? []);
            setStatus('done');
          } else if (event.type === 'error') {
            setErrorMessage(event.message ?? 'Error desconocido.');
            setStatus('error');
          }
        }
      }

      // Si el stream terminó sin evento 'done' (edge case)
      if (status !== 'error') {
        setStatus((prev) => (prev === 'streaming' ? 'done' : prev));
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // cancelación intencional
      console.error('[useSearch] Error:', err);
      setErrorMessage(err.message ?? 'Error al conectar con la API de búsqueda.');
      setStatus('error');
    }
  }, [query, status]);

  return {
    query,
    setQuery,
    answer,
    sources,
    status,
    errorMessage,
    search,
    reset,
    isLoading: status === 'searching' || status === 'streaming',
  };
}
