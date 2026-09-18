// Videos caseros del autor, uno por miniverso — despedida tras cerrar L3, no
// video-puente antes del artefacto (ese es narrativeVideo.js, otra cosa).
// Convención de carpeta: Carlos deja los archivos en public/videos/autor/ con
// el nombre exacto del portal y no hace falta tocar este archivo — solo
// activar VITE_RESONANCE_FAREWELL_VIDEO=true cuando estén todos listos.
const AUTHOR_VIDEO_DIR = '/videos/autor';

export const AUTHOR_VIDEO_GENERAL_URL = `${AUTHOR_VIDEO_DIR}/general.mp4`;

export const resolveAuthorVideoUrl = (portal) =>
  portal ? `${AUTHOR_VIDEO_DIR}/${portal}.mp4` : AUTHOR_VIDEO_GENERAL_URL;

// ─── Relleno para recorrer el flujo completo ───────────────────────────────
// Mientras no existan las piezas reales, el panel se ocultaba entero y el
// clímax quedaba invisible: no había manera de recorrer el flujo de punta a
// punta para tomar decisiones sobre él. Este video de siete segundos ocupa
// ese lugar y se comporta igual que el real.
//
// Es el mismo archivo que el repositorio `bienvenida` usa como relleno, así
// que vive en el bucket público `oraculo` y no pesa en este repositorio.
//
// Se enciende con VITE_AUTHOR_VIDEO_PLACEHOLDER=true y está APAGADO por
// omisión: en producción, si las piezas no están, el panel debe seguir
// ocultándose. Un video de prueba con el rótulo "El autor toma la palabra"
// sería exactamente la clase de cosa que este proyecto no hace.
export const AUTHOR_VIDEO_PLACEHOLDER_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/Dummy_tutorial_7seg.mp4';

export const AUTHOR_VIDEO_PLACEHOLDER_ENABLED =
  import.meta.env?.VITE_AUTHOR_VIDEO_PLACEHOLDER === 'true';
