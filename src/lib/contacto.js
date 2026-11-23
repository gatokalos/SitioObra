// La hoja de contacto («Salida · ¿Tienes curiosidad gatuna?») ya no está
// siempre a la vista (Carlos, 23 nov 2026: el recorrido corto). Se abre con
// el botón «Contacto» del pie de página, con el enlace «Salida» del Programa
// de mano (#contact) y desde los lugares que mandan a proponer un texto (el
// Camerino, las fichas de las formas, los portales). Igual que la obra
// fundacional, se recuerda durante la sesión.
export const CONTACTO_EVENTO = 'gatoencerrado:reveal-contacto';
const CONTACTO_SESION = 'gatoencerrado:contacto-revealed-session';

export const leerContactoAbierto = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(CONTACTO_SESION) === '1';
  } catch {
    return false;
  }
};

export const recordarContactoAbierto = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CONTACTO_SESION, '1');
  } catch {
    // sin sesión: se abre igual
  }
};

// Abre la hoja y baja a ella cuando ya está montada.
export const abrirContacto = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONTACTO_EVENTO));
  let intentos = 0;
  const bajar = () => {
    const hoja = document.getElementById('contact');
    if (hoja) {
      hoja.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    intentos += 1;
    if (intentos < 25) window.setTimeout(bajar, 100);
  };
  window.setTimeout(bajar, 120);
};
