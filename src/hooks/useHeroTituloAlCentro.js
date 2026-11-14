import { useLayoutEffect } from 'react';

// GATOENCERRADO va al centro y a la mitad de la pantalla en todo momento, y la
// orbe y el subtítulo rotativo se acomodan arriba de él (Carlos, 14 nov 2026:
// «no podemos descuidar la simetría de la grilla invisible y el título sí
// tendrá que estar en el centro y a la mitad del viewport en todo momento»).
// El hero reparte su altura entre lo que hay arriba y abajo del título, y ese
// reparto cambia con cada pantalla: el título quedaba entre 17 y 79 px por
// debajo de la mitad. Aquí solo se mide dónde lo deja el reparto
// (`--hero-titulo-y0`, desde el borde superior de la página); la hoja de
// estilos hace el resto: lo lleva a la mitad (50svh) y mueve con él el
// subtítulo y la orbe. No se toca el reparto, así que la antesala y el [#] de
// activación se quedan donde estaban.
const medir = (hero) => {
  const titulo = hero.querySelector('.hero-title-stage');
  const bloque = hero.querySelector('.hero-title-viewport');
  if (!titulo || !bloque) return;
  const caja = titulo.getBoundingClientRect();
  if (!caja.height) return;
  // Lo que el bloque ya está desplazado no cuenta: se quiere el lugar de origen.
  let desplazado = 0;
  try {
    const transform = window.getComputedStyle(bloque).transform;
    if (transform && transform !== 'none') desplazado = new DOMMatrixReadOnly(transform).m42;
  } catch { /* sin matriz: se asume 0 */ }
  const y0 = caja.top + caja.height / 2 + window.scrollY - desplazado;
  hero.style.setProperty('--hero-titulo-y0', `${Math.round(y0 * 10) / 10}px`);
  hero.dataset.tituloMedido = '1';
};

export const useHeroTituloAlCentro = (clave) => {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let hero = null;
    let observador = null;
    let cuadro = 0;
    let espera = 0;
    const pedir = () => {
      if (cuadro) return;
      cuadro = window.requestAnimationFrame(() => { cuadro = 0; if (hero) medir(hero); });
    };
    const enganchar = () => {
      hero = document.getElementById('hero');
      if (!hero) return false;
      medir(hero);
      if (typeof ResizeObserver !== 'undefined') {
        observador = new ResizeObserver(pedir);
        observador.observe(hero);
        const bloque = hero.querySelector('.hero-title-viewport');
        if (bloque) observador.observe(bloque);
      }
      return true;
    };
    if (!enganchar()) {
      // El hero aún no está en la página (otra ruta, o carga diferida).
      let intentos = 0;
      espera = window.setInterval(() => {
        intentos += 1;
        if (enganchar() || intentos > 40) window.clearInterval(espera);
      }, 150);
    }
    window.addEventListener('resize', pedir);
    window.addEventListener('orientationchange', pedir);
    document.fonts?.ready?.then(pedir).catch(() => {});
    return () => {
      window.removeEventListener('resize', pedir);
      window.removeEventListener('orientationchange', pedir);
      if (espera) window.clearInterval(espera);
      if (cuadro) window.cancelAnimationFrame(cuadro);
      observador?.disconnect();
    };
  }, [clave]);
};
