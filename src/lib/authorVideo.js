// Videos caseros del autor, uno por miniverso — despedida tras cerrar L3, no
// video-puente antes del artefacto (ese es narrativeVideo.js, otra cosa).
// Convención de carpeta: Carlos deja los archivos en public/videos/autor/ con
// el nombre exacto del portal y no hace falta tocar este archivo — solo
// activar VITE_RESONANCE_FAREWELL_VIDEO=true cuando estén todos listos.
const AUTHOR_VIDEO_DIR = '/videos/autor';

export const AUTHOR_VIDEO_GENERAL_URL = `${AUTHOR_VIDEO_DIR}/general.mp4`;

export const resolveAuthorVideoUrl = (portal) =>
  portal ? `${AUTHOR_VIDEO_DIR}/${portal}.mp4` : AUTHOR_VIDEO_GENERAL_URL;
