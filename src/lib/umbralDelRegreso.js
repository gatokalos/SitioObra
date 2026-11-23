// El umbral del regreso (Carlos, 21 nov 2026). Quien vuelve al sitio con algo
// pendiente no entra directo a la escena: la cinta de la portada dice su
// momento y, al pulsar el gato, lo lleva a esa parte. Abajo queda «Explorar el
// universo», pequeño, para quien solo quiere pasear. Recupera el principio del
// vestíbulo («reconocía al usuario y ponía lo principal en primera plana») sin
// meter más texto: la cinta cambia su primera mitad y nada más.
//
// Las frases son de Carlos (VoBo del 21 nov). Sin nada pendiente —también
// mientras la pregunta todavía no vuelve— se entra como siempre.
//
// Módulo ligero, sin React ni Supabase: lo leen el Hero, el Header y App al
// montar, antes de decidir si la escena arranca encendida.

import { CATALOG, momentoDeLaForma, readResonanceProgress } from './bitacoraShared.js';
import { safeGetItem } from './safeStorage.js';

export const FRASE_DEL_UMBRAL = {
  volvio: 'Si algo volvió a ti, pulsa el gato.',
  'te-escucha': 'La obra también te escucha…',
  'queda-escena': 'Aún queda escena…',
};

// Una sola por visita: la que va primero aquí gana.
const PRIORIDAD = ['volvio', 'te-escucha', 'queda-escena'];

// Mismas claves que lib/misReplicas.js y transmediaConstants.jsx; se leen aquí
// directo para no arrastrar esos módulos a la portada.
const MIS_REPLICAS_KEY = 'gatoencerrado:mis-replicas';
const RECOMENDADA_KEY = 'gatoencerrado:oraculo-recommended-showcase';
const PASE_KEY = 'gatoencerrado:bienvenida-completed';

const yaLeContesto = (portal) => {
  try {
    const lista = JSON.parse(window.localStorage.getItem(MIS_REPLICAS_KEY) ?? '[]');
    return Array.isArray(lista) && lista.some((r) => r?.portal === portal && String(r?.texto ?? '').trim());
  } catch {
    return false;
  }
};

const fecha = (valor) => {
  const t = typeof valor === 'number' ? valor : new Date(valor ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

const momentoDe = (forma) => {
  const momento = momentoDeLaForma(forma.key);
  const { record, l1Done } = readResonanceProgress(forma.key);
  if (momento === 'regreso') return { momento: 'volvio', cuando: fecha(record.bitacora_available_at) };
  if (momento === 'memoria') {
    if (yaLeContesto(forma.key)) return null;
    return { momento: 'te-escucha', cuando: fecha(record.bitacora_completed_at), alActoFinal: Boolean(record.ultima_pregunta_abierta) };
  }
  // Contestó la pregunta de la tarjeta y la escena no ha terminado.
  if (!momento && l1Done) return { momento: 'queda-escena', cuando: Math.max(fecha(record.l2_ts), fecha(record.l1)) };
  // Esperando a que la pregunta vuelva: nada que tomar.
  return null;
};

// { momento, frase, formatId, portal, destino: 'tarjeta' | 'acto-final' } o null.
export const leerElMomentoDelUmbral = () => {
  if (typeof window === 'undefined') return null;
  const candidatos = CATALOG
    .map((forma) => {
      const m = momentoDe(forma);
      return m ? { ...m, forma } : null;
    })
    .filter(Boolean);
  // Con el pase del primer acto y la tarjeta recomendada sin empezar: la
  // escena también espera.
  if (candidatos.length === 0 && safeGetItem(PASE_KEY) === '1') {
    const recomendada = CATALOG.find((f) => f.showcase === safeGetItem(RECOMENDADA_KEY));
    if (recomendada && !readResonanceProgress(recomendada.key).l1Done) {
      candidatos.push({ momento: 'queda-escena', cuando: 0, forma: recomendada });
    }
  }
  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => (
    PRIORIDAD.indexOf(a.momento) - PRIORIDAD.indexOf(b.momento) || b.cuando - a.cuando
  ));
  const elegido = candidatos[0];
  return {
    momento: elegido.momento,
    frase: FRASE_DEL_UMBRAL[elegido.momento],
    formatId: elegido.forma.showcase,
    portal: elegido.forma.key,
    // Si ya pasó al acto final y no escribió, se le lleva ahí, a La Réplica.
    destino: elegido.alActoFinal ? 'acto-final' : 'tarjeta',
  };
};

// ── Del gato a la parte pendiente ───────────────────────────────────────────
// El Hero deja dicho a dónde va y avisa; Transmedia lo toma al oírlo o, si
// todavía no había montado, al montar.
export const UMBRAL_EVENTO = 'gatoencerrado:umbral-cruzado';
const UMBRAL_DESTINO_KEY = 'gatoencerrado:umbral-destino-session';

export const pedirElMomento = (umbral) => {
  if (!umbral) return;
  try { window.sessionStorage.setItem(UMBRAL_DESTINO_KEY, JSON.stringify(umbral)); } catch { /* sin almacenamiento */ }
  try { window.dispatchEvent(new CustomEvent(UMBRAL_EVENTO)); } catch { /* sin ventana */ }
};

export const tomarElMomento = () => {
  try {
    const crudo = window.sessionStorage.getItem(UMBRAL_DESTINO_KEY);
    if (!crudo) return null;
    window.sessionStorage.removeItem(UMBRAL_DESTINO_KEY);
    return JSON.parse(crudo);
  } catch {
    return null;
  }
};
