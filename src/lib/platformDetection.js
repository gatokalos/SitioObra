export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return true;

  // iPadOS Safari envía un user-agent de Mac de escritorio por defecto
  // (y iPhone/iPad también lo hacen con "Solicitar sitio de escritorio"
  // activado) — sin esto, esos casos caen falsamente a las instrucciones
  // de Android/Chrome, que en iOS son imposibles de seguir.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

// Safari en iOS vs. cualquier otro navegador en iOS. Importa para las
// instrucciones de instalación: Safari, en su disposición compacta, esconde
// Compartir detrás del menú ⋯, mientras que Chrome lo deja a la vista en la
// barra de arriba. Los dos usan el mismo motor, así que la única señal es el
// token propio que cada navegador agrega al user-agent.
export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  if (!isAppleTouchDevice()) return false;
  return !/crios|edgios|fxios|opios/i.test(navigator.userAgent || '');
}
