// La prueba del carril de las vitrinas (Carlos, 24 nov 2026). Se enciende con
// ?carril=1 y se apaga con ?carril=0; se recuerda en este navegador (no solo
// en la pestaña), para que siga encendida al abrir otra pestaña o al llegar
// por otro camino.
const CLAVE = 'gatoencerrado:carril';

export const leerCarril = () => {
  if (typeof window === 'undefined') return false;
  try {
    const marca = new URLSearchParams(window.location.search).get('carril');
    if (marca === '1') window.localStorage.setItem(CLAVE, '1');
    if (marca === '0') window.localStorage.removeItem(CLAVE);
    return window.localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
};
