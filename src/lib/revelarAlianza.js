// La alianza (Impacto social + Modelo anual por tramos, AlianzaSocial.jsx) vive
// dentro de «Antes de irte». En escritorio espera escondida hasta un gesto
// (Carlos, 12 nov 2026): «Dejar huella» la revela con su animación de entrada,
// en vez de recorrer unos pocos píxeles hacia algo que ya estaba a la vista. En
// el teléfono se ve desde que se abre la sección, como siempre.
//
// Las puertas vivas pasan por aquí para no llegar a un hueco: «Dejar huella» y
// «En alianza con:» (panel de Impulsa), «Ver cómo funciona todo esto» (Acto
// final), el regreso tras iniciar sesión para dejar huella y el enlace /#apoya.
// Una vez revelada, se queda así el resto de la visita.
export const REVELAR_ALIANZA_EVENT = 'gatoencerrado:revelar-alianza';
export const ALIANZA_REVELADA_KEY = 'gatoencerrado:alianza-revelada-session';
// Si la sección aún no estaba montada cuando se pidió, el destino espera aquí y
// se atiende al montar (como «abrir-impulsa»).
export const ALIANZA_PENDIENTE_KEY = 'gatoencerrado:alianza-pendiente';

const leer = (clave) => {
  try { return window.sessionStorage.getItem(clave); } catch { return null; }
};
const escribir = (clave, valor) => {
  try { window.sessionStorage.setItem(clave, valor); } catch {}
};

export const alianzaYaRevelada = () => typeof window !== 'undefined' && leer(ALIANZA_REVELADA_KEY) === '1';

// Revela sin moverse: quien llama hace su propio desplazamiento después.
export const revelarAlianza = () => {
  if (typeof window === 'undefined') return;
  escribir(ALIANZA_REVELADA_KEY, '1');
  window.dispatchEvent(new CustomEvent(REVELAR_ALIANZA_EVENT, { detail: { destino: null } }));
};

// Abre «Antes de irte» si hace falta, revela la alianza y baja a `destino`
// ('apoya' o 'cta').
export const irALaAlianza = (destino = 'apoya') => {
  if (typeof window === 'undefined') return;
  escribir(ALIANZA_REVELADA_KEY, '1');
  escribir(ALIANZA_PENDIENTE_KEY, destino);
  window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-before-leaving'));
  window.dispatchEvent(new CustomEvent(REVELAR_ALIANZA_EVENT, { detail: { destino } }));
};
