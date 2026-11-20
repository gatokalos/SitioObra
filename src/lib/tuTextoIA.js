// La IA de #GatoEncerrado en «Tu texto» (Carlos, 19 nov 2026: «el botón de
// pasarlo por la IA de gato encerrado… El efecto wow… De cómo los va a unir,
// cómo va a sugerir»). El servidor lee solo las réplicas que se le mandan y
// devuelve un título, un género y un texto; lleva la cuenta de las versiones
// (tres por persona) y no guarda nada del contenido (D-76).
//
// Aquí también se anota el gesto, sin contenido: que juntó sus réplicas, que se
// llevó el texto, que lo propuso para el blog (D-76, punto 2). Si la tabla
// todavía no existe, no pasa nada: el gesto se pierde y la pantalla sigue.

import { supabase } from '@/lib/supabaseClient';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

async function tokenDeLaSesion() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

// Respuesta: { ok, titulo, genero, texto, version, limite } o { ok: false,
// agotadas, usadas, limite } o { ok: false, error }.
// `anteriores`: las versiones de la IA que ya vio, [{ genero, titulo }], para que
// la siguiente no repita ninguna.
export async function hilarConLaIA({ replicas, anteriores = [], signal }) {
  // Sin sesión el servidor contesta 401; se manda igual para que el ensayo
  // local (?devAuth) pueda simular la respuesta.
  const token = await tokenDeLaSesion();
  try {
    const res = await fetch(`${OBRA_API_URL}/api/tu-texto/hilar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ replicas, ...(anteriores.length ? { anteriores } : {}) }),
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!data) return { ok: false, error: `http-${res.status}` };
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') return { ok: false, error: 'cancelado' };
    return { ok: false, error: 'red' };
  }
}

export async function versionesDeLaIA() {
  const token = await tokenDeLaSesion();
  try {
    const res = await fetch(`${OBRA_API_URL}/api/tu-texto/versiones`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await res.json().catch(() => null);
    return data?.ok ? { usadas: Number(data.usadas) || 0, limite: Number(data.limite) || 3 } : null;
  } catch {
    return null;
  }
}

export async function anotarGestoDeTuTexto(userId, gesto, { conIA = false, version = null, formas = [], nReplicas = null } = {}) {
  if (!userId || !gesto) return;
  try {
    await supabase.from('tu_texto_gestos').insert({
      user_id: userId,
      gesto,
      con_ia: Boolean(conIA),
      version,
      formas,
      n_replicas: nReplicas,
    });
  } catch {
    /* sin tabla o sin red: el gesto se pierde */
  }
}

// «Proponerlo para el blog»: llega a la misma bandeja que las propuestas de la
// Salida (blog_contributions). Carlos lo lee y decide si se publica, con el
// nombre que ella dejó. Esto sí entra al corpus: lo compartió (D-76, punto 1).
export async function proponerParaElBlog({ nombre, correo, titulo, texto, meta = {} }) {
  try {
    const { error } = await supabase.from('blog_contributions').insert({
      name: nombre,
      email: correo,
      proposal: titulo ? `${titulo}\n\n${texto}` : texto,
      topic: 'texto_armado',
      link: null,
      meta: { route: 'tu-texto', ...meta },
    });
    return !error;
  } catch {
    return false;
  }
}
