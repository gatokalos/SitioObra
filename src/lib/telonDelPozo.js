// El telón del pozo hacia La Réplica (Carlos, 26 nov 2026: «cuando llegue al
// fondo del pozo, ahí ya se presente por primera vez la ceja, el copy y la
// descripción de la réplica […] se va a desaparecer el gato neo del fondo del
// pozo y vamos a ver otra vez el sitio ya con la ficha de la réplica»).
//
// Es DOM suelto, fuera de React: tiene que sobrevivir a que se cierren la
// cabina, el vestíbulo y la ficha mientras el sitio baja a #provoca.
//   1. Cubre la pantalla con el fondo del pozo (el gato de neón) y lo apaga.
//   2. Compone al centro una copia de la cabecera de La Réplica (la misma del
//      sitio: ceja, título y descripción).
//   3. Cuando el sitio ya está en #provoca, lleva la copia al lugar de la
//      cabecera de verdad, retira el fondo y se va: queda el sitio.

const esperar = (ms) => new Promise((r) => window.setTimeout(r, ms));

const quieta = async (leer, { minimo = 700, maximo = 4000 } = {}) => {
  const inicio = performance.now();
  let previa = null;
  let iguales = 0;
  while (performance.now() - inicio < maximo) {
    await new Promise((r) => window.requestAnimationFrame(r));
    const r = leer();
    if (r && previa && Math.abs(r.top - previa.top) < 0.5) iguales += 1; else iguales = 0;
    previa = r;
    if (iguales >= 6 && performance.now() - inicio >= minimo) return r;
  }
  return previa;
};

const CABECERA = '#provoca .provoca-stage-intro';

// Espera a que aparezca un nodo (llegando por el enlace del aviso, el sitio
// todavía no está montado cuando baja el telón).
const aparecer = async (buscar, maximo = 9000) => {
  const inicio = performance.now();
  while (performance.now() - inicio < maximo) {
    const nodo = buscar();
    if (nodo && nodo.getBoundingClientRect().width > 0) return nodo;
    await new Promise((r) => window.requestAnimationFrame(r));
  }
  return null;
};

// Carlos, 27 nov 2026: la cabecera ya no se compone al centro para luego
// viajar a su lugar («tiene un movimiento inclinado… ¿por qué tiene que
// aparecer en medio y no mejor aparece donde ya tiene su lugar fijo?»). Ahora
// aparece donde va a quedarse: el sitio baja a #provoca bajo el telón, se
// espera a que la cabecera esté quieta y la copia nace encima, en su sitio.
export function bajarElTelonHaciaLaReplica({ fondo, encuadre = 'center' }) {
  if (typeof document === 'undefined') return;
  const telon = document.createElement('div');
  telon.className = 'telon-del-pozo';
  telon.setAttribute('aria-hidden', 'true');
  telon.innerHTML = `<div class="telon-del-pozo__noche"><div class="telon-del-pozo__gato" style="background-image:url('${fondo}');background-position:${encuadre}"></div></div>`;
  document.body.appendChild(telon);

  // La copia de la cabecera, exactamente sobre la de verdad.
  const componer = (original, caja) => {
    const copia = original.cloneNode(true);
    // Sin los estilos sueltos que trae del sitio (las entradas animadas).
    copia.removeAttribute('style');
    copia.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
    copia.removeAttribute('id');
    copia.classList.add('telon-del-pozo__cabecera');
    copia.style.width = `${caja.width}px`;
    copia.style.left = `${caja.left}px`;
    copia.style.top = `${caja.top}px`;
    telon.appendChild(copia);
    return copia;
  };

  const run = async () => {
    // Mientras el gato se va, el sitio baja a #provoca (desde el enlace del
    // aviso, la cabecera aparece cuando el sitio monta debajo).
    await esperar(2600);
    const original = document.querySelector(CABECERA) ?? await aparecer(() => document.querySelector(CABECERA));
    if (!original) {
      telon.classList.add('telon-del-pozo--fuera');
      await esperar(1300);
      telon.remove();
      return;
    }
    // La de verdad no se ve mientras la copia está encima: así no hay dos.
    original.style.visibility = 'hidden';
    const caja = await quieta(() => original.getBoundingClientRect());
    const copia = componer(original, caja ?? original.getBoundingClientRect());
    // Llega en su lugar (1.1 s) y se deja leer.
    await esperar(1100 + 2200);
    original.style.visibility = '';
    copia.remove();
    telon.classList.add('telon-del-pozo--fuera');
    await esperar(1300);
    telon.remove();
  };
  run();
}
