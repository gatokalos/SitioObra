import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

// Marca de paso por el Intermedio (bloque 7 del recorrido, 12 sep 2026).
//
// El sitio tiene programa de mano y se entra por donde se quiera: el Intermedio
// puede ser la primera o la única entrada de alguien. Quien lee artículos sobre
// salud mental antes de su primera intuición ya no responde "antes de saber
// algo más", y quien pasa por ahí durante la retención llega a En escena con
// estímulo. No se cierra ninguna puerta: se anota (Carlos: "basta con
// anotarse"). Se guarda la PRIMERA visita y no se sobreescribe; el backend la
// recibe tal cual en la primera intuición y en En escena, y el análisis la
// compara con las fechas de cada momento.
//
// Qué cuenta como pasar por el Intermedio: abrir el Camerino (el archivo y el
// Apuntador) o leer un artículo. La tarjeta "Hacemos una pausa…" por sí sola
// no: es el umbral, no el contenido.
const INTERMEDIO_VISTO_KEY = 'gatoencerrado:intermedio-visto-at';

export const markIntermedioVisto = () => {
  if (safeGetItem(INTERMEDIO_VISTO_KEY)) return;
  safeSetItem(INTERMEDIO_VISTO_KEY, new Date().toISOString());
};

export const readIntermedioVistoAt = () => {
  const v = safeGetItem(INTERMEDIO_VISTO_KEY);
  return typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null;
};
