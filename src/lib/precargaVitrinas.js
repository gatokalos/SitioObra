// Las vitrinas se descargan por detrás (Carlos, 24 nov 2026): mientras la
// persona lee la cinta y mira la escena, el navegador va trayendo las nueve
// imágenes, primero la de su forma recomendada, una por una y en los ratos
// libres, para no competir con lo que se está viendo. Al llegar al segundo
// acto ya están. Módulo ligero (sin React ni los íconos de las vitrinas): lo
// llama el Hero desde la fase cero y Transmedia al montar; la segunda llamada
// no repite nada.
const VITRINAS = {
  miniversos: 'poster_obra',
  lataza: 'poster_artesanias',
  miniversoNovela: 'poster_literatura',
  miniversoGrafico: 'poster_graficos',
  copycats: 'cine',
  miniversoSonoro: 'poster_sonoridades',
  miniversoMovimiento: 'poster_movimiento',
  apps: 'poster_juegos',
  oraculo: 'poster_oraculo',
};
const RECOMENDADA_KEY = 'gatoencerrado:oraculo-recommended-showcase';
const pedidas = new Set();
let enMarcha = false;

const cuandoHayaUnRato = (fn, demora) => {
  window.setTimeout(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
    else fn();
  }, demora);
};

export const precargarVitrinas = ({ demora = 0 } = {}) => {
  if (typeof window === 'undefined' || enMarcha) return;
  // Sin gastar datos de quien los pidió ahorrar.
  if (navigator.connection?.saveData) return;
  enMarcha = true;
  let recomendada = null;
  try { recomendada = window.localStorage.getItem(RECOMENDADA_KEY); } catch { /* sin almacenamiento */ }
  const orden = Object.keys(VITRINAS).sort((a, b) => (b === recomendada) - (a === recomendada));
  const siguiente = () => {
    const id = orden.find((x) => !pedidas.has(x));
    if (!id) return;
    pedidas.add(id);
    const img = new Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) img.fetchPriority = 'low';
    const seguir = () => cuandoHayaUnRato(siguiente, 120);
    img.onload = seguir;
    img.onerror = seguir;
    img.src = `/assets/vitrinas/${VITRINAS[id]}.webp`;
  };
  cuandoHayaUnRato(siguiente, demora);
};
