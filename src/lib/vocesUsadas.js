// Voces del vestíbulo que esta persona ya usó (Carlos, 11 nov 2026: «la pregunta
// usada se descarta»). Viven en este navegador y nada más: no viajan al servidor
// ni cambian el vestíbulo de nadie. Si el navegador no deja guardar, todo sigue
// funcionando; solo se pierde el descarte al recargar.
const CLAVE = 'gato.vestibulo.voces-usadas';
const MAXIMO = 200;

export function leerVocesUsadas() {
  try {
    const crudo = JSON.parse(window.localStorage.getItem(CLAVE) || '[]');
    return new Set(Array.isArray(crudo) ? crudo.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function marcarVozUsada(id) {
  if (!id) return;
  try {
    const usadas = leerVocesUsadas();
    usadas.add(id);
    window.localStorage.setItem(CLAVE, JSON.stringify([...usadas].slice(-MAXIMO)));
  } catch {
    // Sin almacenamiento: el descarte dura lo que dure la página.
  }
}
