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

export function bajarElTelonHaciaLaReplica({ fondo }) {
  if (typeof document === 'undefined') return;
  const original = document.querySelector('#provoca .provoca-stage-intro');
  const telon = document.createElement('div');
  telon.className = 'telon-del-pozo';
  telon.setAttribute('aria-hidden', 'true');
  telon.innerHTML = `<div class="telon-del-pozo__noche"><div class="telon-del-pozo__gato" style="background-image:url('${fondo}')"></div></div>`;
  document.body.appendChild(telon);

  let copia = null;
  if (original) {
    const caja = original.getBoundingClientRect();
    copia = original.cloneNode(true);
    // Sin los estilos sueltos que trae del sitio (las entradas animadas).
    copia.removeAttribute('style');
    copia.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
    copia.classList.add('telon-del-pozo__cabecera');
    copia.style.width = `${caja.width}px`;
    copia.style.left = `${(window.innerWidth - caja.width) / 2}px`;
    copia.style.top = '0px';
    telon.appendChild(copia);
    // Centrada en la pantalla, con su propio alto.
    const alto = copia.getBoundingClientRect().height;
    copia.style.top = `${Math.max(24, (window.innerHeight - alto) / 2)}px`;
  }

  const run = async () => {
    // El gato se va y la cabecera llega (CSS, al montar).
    await esperar(2600);
    if (!copia || !original) {
      telon.classList.add('telon-del-pozo--fuera');
      await esperar(1300);
      telon.remove();
      return;
    }
    // La de verdad no se ve hasta que la copia llega: así no hay dos.
    original.style.visibility = 'hidden';
    const real = await quieta(() => original.getBoundingClientRect());
    copia.style.animation = 'none';
    copia.style.opacity = '1';
    const llevar = (destino, segundos) => {
      const actual = copia.getBoundingClientRect();
      const previo = new DOMMatrixReadOnly(getComputedStyle(copia).transform === 'none' ? undefined : getComputedStyle(copia).transform);
      copia.style.transition = `transform ${segundos}s cubic-bezier(0.65, 0, 0.25, 1)`;
      copia.style.transform = `translate(${previo.m41 + destino.left - actual.left}px, ${previo.m42 + destino.top - actual.top}px)`;
    };
    if (real) llevar(real, 1);
    await esperar(1050);
    // Por si el sitio se acomodó mientras tanto, el último ajuste.
    const final = original.getBoundingClientRect();
    llevar(final, 0.2);
    await esperar(220);
    original.style.visibility = '';
    copia.remove();
    telon.classList.add('telon-del-pozo--fuera');
    await esperar(1300);
    telon.remove();
  };
  run();
}
