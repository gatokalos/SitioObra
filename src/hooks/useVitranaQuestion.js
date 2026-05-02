import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Pregunta base por portal — fuente: "Nueve intentos de no romperse"
const PREGUNTA_MADRE = {
  obra:        '¿Qué significa habitar una emoción delante de otros?',
  literatura:  '¿Qué cambia cuando una experiencia se convierte en relato?',
  artesanias:  '¿Cuándo un objeto deja de ser solo un objeto?',
  grafico:     '¿Qué ocurre cuando alguien más interpreta nuestra apariencia?',
  cine:        '¿Qué significa verse fallar desde afuera?',
  sonoridades: '¿Por qué algunos sonidos duran más que las imágenes?',
  movimiento:  '¿Qué sabe el cuerpo antes que la mente?',
  juegos:      '¿Qué cambia cuando una historia depende de nuestras decisiones?',
  oraculo:     '¿Cuándo una experiencia deja de sentirse individual?',
};

async function fetchOraculoContext(anonId) {
  if (!anonId) return {};
  const { data } = await supabase
    .from('miniverso_oraculo_interactions')
    .select('metadata')
    .eq('anon_id', anonId)
    .eq('interaction_type', 'reflection_submit')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.metadata ?? {};
}

async function fetchPortalsVisited(anonId) {
  if (!anonId) return [];
  const { data } = await supabase
    .from('miniverso_portal_entries')
    .select('portal')
    .eq('anon_id', anonId);
  return [...new Set((data ?? []).map((r) => r.portal))];
}

/**
 * Devuelve la pregunta de apertura para el bloque "Voces de la comunidad".
 *
 * - Sin contexto de Oráculo → pregunta madre (sin llamada a la API).
 * - Con contexto de Oráculo → pregunta madre personalizada vía API.
 *
 * @param {string} portal - nombre canónico del portal (ej. 'grafico')
 * @returns {{ question: string|null, loading: boolean }}
 */
export function useVitranaQuestion(portal) {
  const preguntaMadre = PREGUNTA_MADRE[portal] ?? null;
  const [question, setQuestion] = useState(preguntaMadre);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!portal || !preguntaMadre || fetchedRef.current) return;

    const cacheKey = `vitrana_q_${portal}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setQuestion(cached);
      return;
    }

    fetchedRef.current = true;

    (async () => {
      try {
        const anonId = ensureAnonId();
        const [oraculoCtx, portalsVisited] = await Promise.all([
          fetchOraculoContext(anonId),
          fetchPortalsVisited(anonId),
        ]);

        // Sin contexto del Oráculo → pregunta madre como está, sin coste de API
        if (!oraculoCtx.pasillo && !oraculoCtx.goal) return;

        setLoading(true);
        const res = await fetch(`${API_BASE}/api/gato/vitrina-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portal,
            preguntaMadre,
            pasillo:        oraculoCtx.pasillo ?? null,
            goal:           oraculoCtx.goal    ?? null,
            portalsVisited,
          }),
        });

        if (!res.ok) return;
        const { question: q } = await res.json();
        if (q) {
          sessionStorage.setItem(cacheKey, q);
          setQuestion(q);
        }
      } catch (e) {
        console.warn('[useVitranaQuestion]', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [portal, preguntaMadre]);

  return { question, loading };
}
