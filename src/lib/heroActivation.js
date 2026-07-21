// Fuente única para "¿ya se activó la escena del Hero?", leída por Hero.jsx,
// Header.jsx y HeroBackground (App.jsx) — los tres viven dentro de la ruta "/"
// y se desmontan/remontan al navegar a otra ruta y volver. sessionStorage (no
// localStorage): se resetea en una visita nueva, pero sobrevive mientras
// navegas dentro de la misma pestaña.
export const HERO_ACTIVATED_SESSION_KEY = 'gatoencerrado:hero-activated-session';

export const readHeroActivatedFromSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(HERO_ACTIVATED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeHeroActivatedToSession = (isActivated) => {
  if (typeof window === 'undefined') return;
  try {
    if (isActivated) {
      window.sessionStorage.setItem(HERO_ACTIVATED_SESSION_KEY, '1');
    } else {
      window.sessionStorage.removeItem(HERO_ACTIVATED_SESSION_KEY);
    }
  } catch {
    // ignore
  }
};

// "¿Ya usó el usuario el botón # del Hero para abrir el índice?" — mientras esto
// sea falso, el toggle # del Header se mantiene oculto: solo debe haber un #
// clicable en pantalla a la vez (el que "transmigró" al fondo del Hero).
export const HERO_INDEX_CUE_USED_SESSION_KEY = 'gatoencerrado:hero-index-cue-used-session';

export const readIndexCueUsedFromSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(HERO_INDEX_CUE_USED_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
};

export const writeIndexCueUsedToSession = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(HERO_INDEX_CUE_USED_SESSION_KEY, 'true');
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — se ignora
  }
};

// "¿Ya se reveló Obra Destacada + Créditos + Venta a la salida?" (CTA de
// Archivo Escénico). Mismo problema que isHeroActivated: App.jsx vive en la
// ruta "/" y se desmonta al navegar a un portal (/portal-*) y volver — sin
// esto, el bloque entero se "colapsa" (vuelve a su estado inicial oculto) en
// cada ida y vuelta a un portal, aunque el usuario ya lo había revelado.
export const OBRA_DESTACADA_REVEALED_SESSION_KEY = 'gatoencerrado:obra-destacada-revealed-session';

export const readObraDestacadaRevealedFromSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(OBRA_DESTACADA_REVEALED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeObraDestacadaRevealedToSession = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(OBRA_DESTACADA_REVEALED_SESSION_KEY, '1');
  } catch {
    // ignore
  }
};
