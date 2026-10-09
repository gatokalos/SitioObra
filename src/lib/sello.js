// lib/sello.js — El sello lo da el gesto, no la ventana (D-69, 9 oct 2026).
//
// Una forma queda sellada en el pasaporte (D-49) cuando su artefacto anuncia
// que el gesto terminó, y solo entonces. Cerrar la ventana no sella. El
// registro del servidor es el sello; el del navegador (experience_ts en
// gatoencerrado:resonance:<forma>) es su espejo, para que el pasaporte funcione
// sin conexión. Si el servidor no responde, el gesto se guarda y se reintenta
// en la siguiente visita.
//
// Contrato, igual para las nueve formas: un solo mensaje al terminar el gesto
// con la forma, el resultado (cumplido / enunciado / declinado / parcial), el
// detalle propio de la forma y la hora.
import { ensureAnonId } from '@/lib/identity';
import { readResonanceRecord } from '@/lib/bitacoraShared';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const PENDIENTES_KEY = 'gatoencerrado:sellos-pendientes';
const RESULTADOS = new Set(['cumplido', 'enunciado', 'declinado', 'parcial']);

const recordKey = (portal) => `gatoencerrado:resonance:${portal}`;
const texto = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Normaliza lo que anuncia un artefacto. Devuelve null si no es un gesto válido. */
export const normalizarGesto = (data = {}) => {
  const resultado = RESULTADOS.has(data.resultado) ? data.resultado : null;
  if (!resultado) return null;
  return {
    resultado,
    fragment_id: texto(data.fragment_id),
    plano: texto(data.plano),
    match_id: texto(data.match_id),
    duration_ms: Number.isFinite(data.duration_ms) ? Math.max(0, Math.trunc(data.duration_ms)) : null,
    ts: Number.isFinite(data.ts) ? data.ts : Date.now(),
  };
};

/** El espejo local del sello: experience_ts y el gesto, sin borrar lo que ya había. */
export const sellarLocal = (portal, gesto) => {
  try {
    const existing = readResonanceRecord(portal);
    localStorage.setItem(recordKey(portal), JSON.stringify({
      ...existing,
      experience_ts: existing.experience_ts ?? gesto.ts,
      gesto_resultado: gesto.resultado,
      gesto_ts: gesto.ts,
      ...(gesto.fragment_id ? { l2_fragment_id: gesto.fragment_id } : {}),
      ...(gesto.plano ? { l2_plano: gesto.plano } : {}),
    }));
  } catch { /* sin almacenamiento local: el servidor sigue siendo el sello */ }
};

const enviar = async (portal, gesto) => {
  const anonId = ensureAnonId();
  if (!anonId) throw new Error('sin anon_id');
  const res = await fetch(`${OBRA_API_URL}/api/resonance/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anon_id: anonId, miniverso_id: portal, gesto }),
  });
  if (!res.ok) throw new Error(`evidence ${res.status}`);
};

const leerPendientes = () => {
  try {
    const v = JSON.parse(localStorage.getItem(PENDIENTES_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const escribirPendientes = (lista) => {
  try {
    if (lista.length) localStorage.setItem(PENDIENTES_KEY, JSON.stringify(lista));
    else localStorage.removeItem(PENDIENTES_KEY);
  } catch { /* ignore */ }
};

/**
 * Sella la forma con el gesto que el artefacto anunció: espejo local ahora,
 * servidor ahora o en la siguiente visita. Devuelve el gesto normalizado.
 */
export const sellarForma = async (portal, gestoCrudo) => {
  const gesto = normalizarGesto(gestoCrudo);
  if (!gesto) return null;
  sellarLocal(portal, gesto);
  try {
    await enviar(portal, gesto);
  } catch (err) {
    console.warn('[sello] el servidor no recibió el gesto; se reintenta en la siguiente visita:', err?.message);
    const otros = leerPendientes().filter((p) => !(p.portal === portal && p.gesto?.ts === gesto.ts));
    escribirPendientes([...otros, { portal, gesto }]);
  }
  return gesto;
};

/** Manda al servidor los sellos que quedaron pendientes por falta de conexión. */
export const reintentarSellosPendientes = async () => {
  const pendientes = leerPendientes();
  if (!pendientes.length) return;
  const quedan = [];
  for (const p of pendientes) {
    try {
      await enviar(p.portal, p.gesto);
    } catch {
      quedan.push(p);
    }
  }
  escribirPendientes(quedan);
};
