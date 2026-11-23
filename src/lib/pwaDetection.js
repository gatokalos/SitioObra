export function isInstalledPWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// La app instalada en escritorio abría en una ventana chica, como de teléfono
// (Carlos, 22 nov 2026). El manifiesto no puede fijar el tamaño de la
// ventana: la primera vez que se abre en una pantalla con mouse, se le pide
// que ocupe toda la pantalla. Chrome y Edge lo permiten; Safari puede
// ignorarlo, y entonces basta con agrandarla una vez a mano (el navegador
// recuerda el tamaño). Solo una vez, para respetar el tamaño que la persona
// elija después.
const VENTANA_AGRANDADA_KEY = 'gatoencerrado:pwa-ventana-agrandada';

export function agrandarLaVentanaDeLaApp() {
  if (typeof window === 'undefined' || !isInstalledPWA()) return;
  // Solo escritorio: mouse y una pantalla de escritorio (la ventana puede
  // ser chica, la pantalla no).
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if ((window.screen?.availWidth ?? 0) < 1024) return;
  try {
    if (window.localStorage.getItem(VENTANA_AGRANDADA_KEY) === '1') return;
    window.localStorage.setItem(VENTANA_AGRANDADA_KEY, '1');
  } catch {
    return;
  }
  try {
    const ancho = window.screen.availWidth;
    const alto = window.screen.availHeight;
    if (window.outerWidth >= ancho - 8 && window.outerHeight >= alto - 8) return;
    window.moveTo(window.screen.availLeft ?? 0, window.screen.availTop ?? 0);
    window.resizeTo(ancho, alto);
  } catch {
    // El navegador no lo permite: se queda como está.
  }
}
