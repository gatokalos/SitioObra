// La pantallita de la cabina, encendiéndose y apagándose (Carlos, 24 nov
// 2026): el panel «Protagonista» (la caja «Hola» de la barra en escritorio y
// la franja del Programa de mano en teléfono) se enciende como una tele de
// bulbos —un punto de luz, una línea, un destello y se abre— y se apaga al
// revés —la imagen se aplasta en una línea, la línea en un punto y el punto
// se va—. Con un sonidito genérico, muy bajo, que se calla si la persona
// apagó el audio del sitio. Sin movimiento si el sistema pide reducirlo.
import { getHeroAmbientState, readHeroAudioEnabledPreference } from '@/lib/heroAmbientAudio';

const reduceMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

const ponerLuz = (el) => {
  if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const luz = document.createElement('span');
  luz.setAttribute('aria-hidden', 'true');
  Object.assign(luz.style, {
    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
    background: '#d8f4ff', boxShadow: '0 0 14px 5px rgba(125,196,214,.85)',
    pointerEvents: 'none', zIndex: '5',
  });
  el.appendChild(luz);
  return luz;
};

// ── El sonido: un clic suave y un zumbido que sube (al encender) o baja (al
// apagar). Sintetizado, sin archivos. ─────────────────────────────────────
let contexto = null;
const sonidoPermitido = () => {
  if (readHeroAudioEnabledPreference() === false) return false;
  try { if (getHeroAmbientState()?.isMuted) return false; } catch { /* sin estado */ }
  return true;
};
const sonar = (encendiendo) => {
  if (typeof window === 'undefined' || !sonidoPermitido()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    contexto = contexto ?? new Ctx();
    if (contexto.state === 'suspended') contexto.resume();
    const t = contexto.currentTime;
    const salida = contexto.createGain();
    salida.gain.value = 0.05;
    salida.connect(contexto.destination);
    // el clic
    const largo = Math.floor(contexto.sampleRate * 0.025);
    const buffer = contexto.createBuffer(1, largo, contexto.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < largo; i += 1) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo) ** 3;
    const clic = contexto.createBufferSource();
    clic.buffer = buffer;
    clic.connect(salida);
    clic.start(t);
    // el zumbido de la pantalla
    const tono = contexto.createOscillator();
    const volumen = contexto.createGain();
    tono.type = 'sine';
    const dur = encendiendo ? 0.55 : 0.4;
    tono.frequency.setValueAtTime(encendiendo ? 900 : 4200, t);
    tono.frequency.exponentialRampToValueAtTime(encendiendo ? 4200 : 600, t + dur);
    volumen.gain.setValueAtTime(0.0001, t);
    volumen.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    volumen.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    tono.connect(volumen);
    volumen.connect(salida);
    tono.start(t);
    tono.stop(t + dur + 0.05);
  } catch {
    // sin audio: la pantallita se enciende igual
  }
};

export const encenderPantallita = (el, { demora = 0, conSonido = true } = {}) => {
  if (!el || typeof el.animate !== 'function') return;
  if (conSonido) window.setTimeout(() => sonar(true), demora);
  if (reduceMovimiento()) return;
  const luz = ponerLuz(el);
  const curva = 'cubic-bezier(.2,.8,.2,1)';
  el.animate([
    { clipPath: 'inset(50% 50% 50% 50% round 10px)', filter: 'brightness(2.4) saturate(.4)' },
    { clipPath: 'inset(calc(50% - 1px) 0 calc(50% - 1px) 0 round 10px)', filter: 'brightness(2.4) saturate(.4)', offset: 0.35 },
    { clipPath: 'inset(0 0 0 0 round 10px)', filter: 'brightness(1.5) saturate(.8)', offset: 0.75 },
    { clipPath: 'inset(0 0 0 0 round 10px)', filter: 'none' },
  ], { duration: 900, delay: demora, fill: 'backwards', easing: curva });
  const animacion = luz.animate([
    { width: '6px', height: '6px', borderRadius: '50%', opacity: 1 },
    { width: '100%', height: '2px', borderRadius: '0', opacity: 1, offset: 0.35 },
    { width: '100%', height: '100%', borderRadius: '0', opacity: 0 },
  ], { duration: 900, delay: demora, fill: 'both', easing: curva });
  animacion.onfinish = () => luz.remove();
  animacion.oncancel = () => luz.remove();
};

// Devuelve una promesa que se cumple al terminar de apagarse.
export const apagarPantallita = (el, { conSonido = true } = {}) => new Promise((listo) => {
  if (!el || typeof el.animate !== 'function' || reduceMovimiento()) { listo(); return; }
  if (conSonido) sonar(false);
  const luz = ponerLuz(el);
  const curva = 'cubic-bezier(.6,0,.4,1)';
  el.animate([
    { clipPath: 'inset(0 0 0 0 round 10px)', filter: 'none' },
    { clipPath: 'inset(calc(50% - 1px) 0 calc(50% - 1px) 0 round 10px)', filter: 'brightness(2.6) saturate(.3)', offset: 0.5 },
    { clipPath: 'inset(calc(50% - 1px) 50% calc(50% - 1px) 50% round 10px)', filter: 'brightness(2.6) saturate(.3)' },
  ], { duration: 550, easing: curva, fill: 'forwards' });
  const animacion = luz.animate([
    { width: '100%', height: '100%', borderRadius: '0', opacity: 0 },
    { width: '100%', height: '2px', borderRadius: '0', opacity: 1, offset: 0.5 },
    { width: '6px', height: '6px', borderRadius: '50%', opacity: 1, offset: 0.85 },
    { width: '2px', height: '2px', borderRadius: '50%', opacity: 0 },
  ], { duration: 550, easing: curva, fill: 'forwards' });
  animacion.onfinish = () => listo();
  animacion.oncancel = () => listo();
});
