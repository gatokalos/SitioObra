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
