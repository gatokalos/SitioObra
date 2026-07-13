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
