import { useEffect } from 'react';

// Las escenas de transición en escritorio (Tercera llamada y «Hacemos una
// pausa…», las que llevan .desktop-viewport-scene) se alinean con el hero
// (Carlos, 23 nov 2026):
// 1. Su emblema cae a la altura de la orbe del hero al llegar desde el
//    Programa de mano. Hero.jsx publica esa altura en --eje-de-la-orbe.
// 2. El botón es un ancla: queda a la misma altura en las dos escenas, así
//    sus tarjetas miden lo mismo y el halo violeta late en el mismo lugar.
//    Manda la más larga. Desde el 24 nov 2026, solo en teléfono y tableta:
//    en escritorio cada botón va en su lugar natural (Carlos: «se ve muy
//    forzada la simetría»); index.css aplica el ancla solo bajo 1024 px.
// 2b. El título de cada escena no sube de la línea del título del hero
//    (--eje-del-titulo): entre el emblema y el título se abre el aire que
//    haga falta (Carlos, 23 nov 2026: «no pueden quedar más arriba que la
//    línea del título del hero»).
// 3. A la escena más corta le sobra aire: un tercio entre el título y el
//    texto, dos tercios antes del botón («prefiero que haya más aire abajo
//    que arriba»). El emblema y el título no se separan.
// Aquí solo se mide; index.css aplica las medidas bajo
// html[data-transiciones-al-eje].
// Desde el 23 nov 2026 vale en todas las pantallas donde el hero publica el
// eje (teléfono y tableta incluidos; el teléfono acostado no lo publica y se
// queda como antes). En teléfonos chicos el botón solo hace de ancla si
// todavía cabe en la pantalla al llegar; si no, cada escena conserva el suyo.

// Distancia del borde de arriba de la sección al centro del emblema, sin el
// relleno de arriba ni transformaciones (la tarjeta entra subiendo 30 px).
const centroDelEmblema = (seccion, emblema) => {
  let y = emblema.offsetHeight / 2;
  let nodo = emblema;
  while (nodo && nodo !== seccion) {
    y += nodo.offsetTop;
    nodo = nodo.offsetParent;
  }
  return nodo === seccion ? y : null;
};

const acomodar = () => {
  const raiz = document.documentElement;
  const secciones = [...document.querySelectorAll('.desktop-viewport-scene')];
  const eje = Number.parseFloat(raiz.style.getPropertyValue('--eje-de-la-orbe'));
  const ejeDelTitulo = Number.parseFloat(raiz.style.getPropertyValue('--eje-del-titulo'));
  const activo = Number.isFinite(eje) && secciones.length > 0;

  // Se mide siempre desde el estado natural; quitar y volver a poner ocurre
  // en el mismo cuadro, sin pintarse en medio.
  for (const seccion of secciones) {
    seccion.style.removeProperty('--transicion-arriba');
    seccion.style.removeProperty('--transicion-titulo-aire');
    const contenido = seccion.querySelector('.narrative-transition-content');
    contenido?.style.removeProperty('--transicion-alto');
    contenido?.style.removeProperty('--transicion-sobra');
  }
  if (!activo) {
    delete raiz.dataset.transicionesAlEje;
    return;
  }
  raiz.dataset.transicionesAlEje = '1';

  const margenDeLlegada = Number.parseFloat(window.getComputedStyle(raiz).scrollPaddingTop) || 0;
  const medidas = [];
  for (const seccion of secciones) {
    const contenido = seccion.querySelector('.narrative-transition-content');
    const emblema = seccion.querySelector('.narrative-section-logo');
    const ancla = contenido?.querySelector(':scope > .narrative-transition-cta');
    if (!contenido || !emblema || !ancla) continue;
    const rellenoActual = Number.parseFloat(window.getComputedStyle(seccion).paddingTop) || 0;
    const centro = centroDelEmblema(seccion, emblema);
    if (centro === null) continue;
    seccion.style.setProperty(
      '--transicion-arriba',
      `${Math.max(16, eje - margenDeLlegada - (centro - rellenoActual)).toFixed(1)}px`
    );
    // Al llegar, el centro del emblema está en el eje: ¿dónde caen las letras
    // del título? (las mayúsculas de Vox Round, 0.75 de la letra, al centro
    // de su renglón)
    const titulo = contenido.querySelector('.narrative-transition-title');
    if (titulo && Number.isFinite(ejeDelTitulo)) {
      const marcaAntes = emblema.getBoundingClientRect();
      const cajaTitulo = titulo.getBoundingClientRect();
      const estilo = window.getComputedStyle(titulo);
      const letra = Number.parseFloat(estilo.fontSize) || 0;
      const renglon = Number.parseFloat(estilo.lineHeight) || letra * 1.2;
      const letrasAlLlegar = eje + (cajaTitulo.top + (renglon - 0.75 * letra) / 2) - (marcaAntes.top + marcaAntes.height / 2);
      const faltan = ejeDelTitulo - letrasAlLlegar;
      if (faltan > 0) seccion.style.setProperty('--transicion-titulo-aire', `${faltan.toFixed(1)}px`);
    }
    const caja = contenido.getBoundingClientRect();
    const boton = ancla.getBoundingClientRect();
    const marca = emblema.getBoundingClientRect();
    medidas.push({
      contenido,
      hasta: boton.bottom - caja.top,
      cola: caja.bottom - boton.bottom,
      // del centro del emblema al pie del botón: al llegar, el emblema está en el eje
      bajoElEje: boton.bottom - (marca.top + marca.height / 2),
    });
  }
  if (medidas.length === 0) return;
  const comun = Math.max(...medidas.map((m) => m.hasta));
  const pieDelAncla = eje + Math.max(...medidas.map((m) => m.bajoElEje));
  if (pieDelAncla > window.innerHeight - 16) return;
  for (const m of medidas) {
    m.contenido.style.setProperty('--transicion-alto', `${(comun + m.cola).toFixed(1)}px`);
    m.contenido.style.setProperty('--transicion-sobra', `${(comun - m.hasta).toFixed(1)}px`);
  }
};

export const useTransicionesAlEje = (clave) => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let cuadro = 0;
    const pedir = () => {
      if (cuadro) return;
      cuadro = window.requestAnimationFrame(() => { cuadro = 0; acomodar(); });
    };
    // Lo que cambia la medida: el tamaño de cada pieza (no el del contenido,
    // que crece con lo que aquí se le pone) y las piezas que entran o salen
    // (la nota de «¿Reestrenamos el primer acto?»). El hero publica
    // --eje-de-la-orbe en el estilo de <html>.
    const piezas = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(pedir) : null;
    const hijos = typeof MutationObserver !== 'undefined' ? new MutationObserver(pedir) : null;
    hijos?.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    // Las escenas se montan tarde (al encender la escena, o al cambiar de
    // ruta): se vigila la página y se engancha cada vez que cambian.
    let conocidas = [];
    let revision = 0;
    const revisar = () => {
      if (revision) return;
      revision = window.requestAnimationFrame(() => {
        revision = 0;
        const secciones = [...document.querySelectorAll('.desktop-viewport-scene')];
        if (secciones.length === conocidas.length && secciones.every((sec, i) => sec === conocidas[i])) return;
        conocidas = secciones;
        piezas?.disconnect();
        hijos?.disconnect();
        hijos?.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        for (const seccion of secciones) {
          const contenido = seccion.querySelector('.narrative-transition-content');
          if (!contenido) continue;
          [...contenido.children].forEach((hijo) => piezas?.observe(hijo));
          hijos?.observe(contenido, { childList: true });
        }
        pedir();
      });
    };
    const pagina = typeof MutationObserver !== 'undefined' ? new MutationObserver(revisar) : null;
    pagina?.observe(document.body, { childList: true, subtree: true });
    revisar();
    window.addEventListener('resize', pedir);
    document.fonts?.ready?.then(pedir).catch(() => {});
    return () => {
      window.cancelAnimationFrame(cuadro);
      window.cancelAnimationFrame(revision);
      window.removeEventListener('resize', pedir);
      piezas?.disconnect();
      hijos?.disconnect();
      pagina?.disconnect();
      delete document.documentElement.dataset.transicionesAlEje;
    };
  }, [clave]);
};
