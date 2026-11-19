// Lo que la persona deja en el acto final, recordado en este navegador
// (Carlos, 19 nov 2026: «después de la primera réplica, la interfaz del acto
// final va a cambiar… se adapta»). Propuesta en
// docs/propuesta-juntar-en-el-acto-final-18nov2026.md.
//
// - Sus réplicas: de qué forma salió cada una (o «Desde el acto final», si la
//   escribió en frío), la palabra de la obra, la fecha y el id con que quedó
//   en el servidor. Con la primera, el acto final cambia.
// - Un borrador por forma: el que el gato propone en la Memoria se guarda con
//   el nombre de su forma. Antes había uno solo y el de una segunda forma
//   pisaba al de la primera.
// - Su texto: lo que arma con sus réplicas en el otro lado de la ficha.
//
// Además se pregunta al servidor (get_mis_replicas, migración del 19 nov):
// sin cuenta, lo que se publicó desde este navegador —también antes de que
// existiera este registro—; con cuenta, lo de todos sus aparatos. «Tu texto»
// se guarda en la cuenta (textos_armados). Si el servidor no contesta, queda
// lo del navegador.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { CATALOG } from '@/lib/bitacoraShared';

export const MIS_REPLICAS_KEY = 'gatoencerrado:mis-replicas';
export const BORRADORES_POR_FORMA_KEY = 'gatoencerrado:provoca-drafts';
export const TU_TEXTO_KEY = 'gatoencerrado:tu-texto';
const EVENTO = 'gatoencerrado:mis-replicas';

const leerJson = (clave, vacio) => {
  try {
    const crudo = window.localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) ?? vacio : vacio;
  } catch {
    return vacio;
  }
};
const escribirJson = (clave, valor) => {
  try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
};
const avisar = () => {
  try { window.dispatchEvent(new CustomEvent(EVENTO)); } catch { /* sin ventana */ }
};

export function leerMisReplicas() {
  const lista = leerJson(MIS_REPLICAS_KEY, []);
  return Array.isArray(lista) ? lista.filter((r) => r && typeof r.texto === 'string' && r.texto.trim()) : [];
}

export function anotarMiReplica({ portal = null, texto, termino = null, perspectiveId = null, nombre = null }) {
  const limpio = typeof texto === 'string' ? texto.trim() : '';
  if (!limpio) return;
  const lista = leerMisReplicas();
  lista.push({
    id: perspectiveId || `local-${Date.now()}`,
    portal: portal || null,
    texto: limpio,
    termino: termino || null,
    fecha: new Date().toISOString(),
    perspectiveId: perspectiveId || null,
    nombre: nombre || null,
  });
  escribirJson(MIS_REPLICAS_KEY, lista);
  quitarBorradorDeForma(portal);
  avisar();
}

// ── Un borrador por forma ───────────────────────────────────────────────────
export function guardarBorradorDeForma(portal, borrador) {
  if (!portal || !borrador?.quote) return;
  const mapa = leerJson(BORRADORES_POR_FORMA_KEY, {});
  mapa[portal] = { ...borrador, portal, updatedAt: new Date().toISOString() };
  escribirJson(BORRADORES_POR_FORMA_KEY, mapa);
}

export function quitarBorradorDeForma(portal) {
  if (!portal) return;
  const mapa = leerJson(BORRADORES_POR_FORMA_KEY, {});
  if (!(portal in mapa)) return;
  delete mapa[portal];
  escribirJson(BORRADORES_POR_FORMA_KEY, mapa);
}

// El borrador más reciente de una forma que todavía no tiene réplica.
export function siguienteBorradorPendiente(replicas = leerMisReplicas()) {
  const mapa = leerJson(BORRADORES_POR_FORMA_KEY, {});
  const contestadas = new Set(replicas.map((r) => r.portal).filter(Boolean));
  return Object.values(mapa)
    .filter((b) => b?.quote && b.portal && !contestadas.has(b.portal))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] ?? null;
}

// ── Su texto ────────────────────────────────────────────────────────────────
export function leerTuTexto() {
  const guardado = leerJson(TU_TEXTO_KEY, null);
  return guardado && typeof guardado.texto === 'string' ? guardado : null;
}

export function guardarTuTexto(texto, fuentes = []) {
  escribirJson(TU_TEXTO_KEY, { texto, fuentes, updatedAt: new Date().toISOString() });
}

export function anotarTuTextoCompartido(perspectiveId) {
  const guardado = leerTuTexto();
  if (!guardado) return;
  escribirJson(TU_TEXTO_KEY, { ...guardado, compartidoAt: new Date().toISOString(), perspectiveId: perspectiveId || null });
}

// ── Lo del servidor ─────────────────────────────────────────────────────────
const FORMAS = new Set(CATALOG.map((f) => f.key));
const normal = (t) => String(t || '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

export async function traerMisReplicasDelServidor() {
  try {
    const { data, error } = await supabase.rpc('get_mis_replicas', { p_anon_id: ensureAnonId() ?? null, p_limit: 60 });
    if (error || !Array.isArray(data)) return null;
    return data
      .filter((r) => typeof r?.quote === 'string' && r.quote.trim())
      .map((r) => ({
        id: `srv-${r.id}`,
        portal: FORMAS.has(r.miniverso_id) ? r.miniverso_id : null,
        texto: r.quote.trim().replace(/^[“"]|[”"]$/g, ''),
        termino: r.termino || null,
        fecha: r.created_at,
        perspectiveId: r.id != null ? String(r.id) : null,
        nombre: r.author_name || null,
        estado: r.status || null,
      }));
  } catch {
    return null;
  }
}

// Lo del servidor manda; lo del navegador que el servidor no tenga se queda.
export function juntarReplicas(locales, delServidor) {
  if (!delServidor) return locales;
  const textos = new Set(delServidor.map((r) => normal(r.texto)));
  const ids = new Set(delServidor.map((r) => r.perspectiveId).filter(Boolean));
  const soloAqui = locales.filter((r) => !(r.perspectiveId && ids.has(String(r.perspectiveId))) && !textos.has(normal(r.texto)));
  return [...delServidor, ...soloAqui].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

export async function traerTuTextoDelServidor() {
  try {
    const { data, error } = await supabase.from('textos_armados').select('texto, fuentes, compartido_at, perspective_id, updated_at').maybeSingle();
    if (error || !data) return null;
    return { texto: data.texto ?? '', fuentes: data.fuentes ?? [], compartidoAt: data.compartido_at, perspectiveId: data.perspective_id, updatedAt: data.updated_at };
  } catch {
    return null;
  }
}

export async function guardarTuTextoEnElServidor(userId, texto, fuentes = [], extra = {}) {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('textos_armados').upsert({
      user_id: userId,
      texto,
      fuentes,
      updated_at: new Date().toISOString(),
      ...extra,
    });
    return !error;
  } catch {
    return false;
  }
}

export function useMisReplicas(userId = null) {
  const [locales, setLocales] = useState(() => (typeof window === 'undefined' ? [] : leerMisReplicas()));
  const [delServidor, setDelServidor] = useState(null);
  useEffect(() => {
    const releer = () => setLocales(leerMisReplicas());
    const alCambiarOtraPestana = (e) => { if (e.key === MIS_REPLICAS_KEY) releer(); };
    window.addEventListener(EVENTO, releer);
    window.addEventListener('storage', alCambiarOtraPestana);
    return () => {
      window.removeEventListener(EVENTO, releer);
      window.removeEventListener('storage', alCambiarOtraPestana);
    };
  }, []);
  // Se vuelve a preguntar al cambiar de cuenta y cuando se anota una réplica.
  useEffect(() => {
    let vigente = true;
    void traerMisReplicasDelServidor().then((lista) => { if (vigente) setDelServidor(lista); });
    return () => { vigente = false; };
  }, [userId, locales.length]);
  return useMemo(() => juntarReplicas(locales, delServidor), [locales, delServidor]);
}

// «18 nov», como en el resto del sitio.
export function fechaCorta(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}
