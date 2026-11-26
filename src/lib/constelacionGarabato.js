// Una figura nueva en cada clic (Carlos, 18 nov 2026): «que el usuario haga
// clic en todas las esferitas viendo que se esmeró un programador en que
// siempre hubieran diferentes maneras de hacer las conexiones, porque también
// habla de eso el proyecto: diferente manera de conectar todas las piezas […]
// que cada figura sea como un garabato».
//
// Con cada clic, a partir de una semilla:
//   1. siembra las ocho esferas en el marco, lejos unas de otras y fuera del
//      ancla, del botón de cerrar y (en local) de los botones de ensayo;
//   2. decide en qué orden las conecta: un lazo limpio, un lazo con un cruce
//      (como una letra) o un lazo con rizos entre esfera y esfera;
//   3. traza el hilo por ese orden, curvo y siempre cerrado: vuelve a la
//      elegida, que sigue en su ancla, abajo a la derecha.
// La misma semilla da siempre la misma figura; otra semilla, otra figura.
// Las formas conservan el orden del catálogo a lo largo del hilo.
//
// Devuelve medidas en pixeles del marco: { ancla, lugares[8], hilo, estilo },
// o null si en ese marco no caben (entonces se usa la figura de siempre).

const AIRE_ENTRE_ESFERAS = 12;
const ESQUINA = 50;   // la del botón de cerrar, arriba a la derecha

// Generador de números con semilla (mulberry32).
const conSemilla = (semilla) => {
  let a = (Math.imul(semilla | 0, 2654435761) ^ 0x9e3779b9) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const n1 = (n) => n.toFixed(1);

// 1. Sembrar: cada esfera toma, de varios lugares al azar, el más alejado de
// las ya puestas. Así llenan el marco sin amontonarse, distinto cada vez.
const sembrar = (W, H, ancla, d, cuantas, izquierda, azar, hueco = null) => {
  const cabe = (x, y, puestas) => {
    if (x - d / 2 < 0 || y - d / 2 < 0 || x + d / 2 > W || y + d / 2 > H) return false;
    // El hueco del bloque morado, en el cuaderno del vestíbulo sideral: ahí
    // no se siembra nada (las esferas quedarían escondidas detrás).
    if (hueco && x + d / 2 > hueco.x0 && x - d / 2 < hueco.x1 && y + d / 2 > hueco.y0 && y - d / 2 < hueco.y1) return false;
    if (x + d / 2 > W - ESQUINA && y - d / 2 < ESQUINA) return false;
    if (izquierda > 0 && x - d / 2 < izquierda && y - d / 2 < ESQUINA) return false;
    if (distancia({ x, y }, ancla) < (ancla.d + d) / 2 + AIRE_ENTRE_ESFERAS) return false;
    return puestas.every((p) => distancia({ x, y }, p) >= d + AIRE_ENTRE_ESFERAS);
  };
  const puestas = [];
  for (let i = 0; i < cuantas; i += 1) {
    let mejor = null;
    let holgura = -1;
    for (let k = 0; k < 90; k += 1) {
      const x = d / 2 + azar() * (W - d);
      const y = d / 2 + azar() * (H - d);
      if (!cabe(x, y, puestas)) continue;
      const cerca = Math.min(distancia({ x, y }, ancla) - ancla.d / 2, ...puestas.map((p) => distancia({ x, y }, p)));
      if (cerca > holgura) {
        holgura = cerca;
        mejor = { x, y };
      }
    }
    if (!mejor) return null;
    puestas.push(mejor);
  }
  return puestas;
};

const largoDelLazo = (pts, orden) => orden.reduce((t, i, j) => t + distancia(pts[i], pts[orden[(j + 1) % orden.length]]), 0);

// 2. El orden: del ancla a la más cercana, con algo de azar, y después se
// deshacen los cruces (2-opt) para que el lazo base salga limpio.
const lazoLimpio = (pts, azar) => {
  const orden = [0];
  const quedan = new Set(pts.map((_, i) => i).slice(1));
  while (quedan.size) {
    const u = pts[orden[orden.length - 1]];
    const cercanas = [...quedan].sort((i, j) => distancia(u, pts[i]) - distancia(u, pts[j]));
    const elegida = cercanas.length > 1 && azar() < 0.35 ? cercanas[1] : cercanas[0];
    orden.push(elegida);
    quedan.delete(elegida);
  }
  let mejoro = true;
  while (mejoro) {
    mejoro = false;
    for (let i = 1; i < orden.length - 1; i += 1) {
      for (let j = i + 1; j < orden.length; j += 1) {
        const a = pts[orden[i - 1]];
        const b = pts[orden[i]];
        const c = pts[orden[j]];
        const e = pts[orden[(j + 1) % orden.length]];
        if (distancia(a, c) + distancia(b, e) < distancia(a, b) + distancia(c, e) - 0.5) {
          orden.splice(i, j - i + 1, ...orden.slice(i, j + 1).reverse());
          mejoro = true;
        }
      }
    }
  }
  return orden;
};

// Un cruce: se intercambian dos esferas del recorrido, siempre que el lazo no
// crezca demasiado; queda como un ocho o una letra.
const conUnCruce = (pts, orden, azar) => {
  const base = largoDelLazo(pts, orden);
  for (let intento = 0; intento < 24; intento += 1) {
    const i = 1 + Math.floor(azar() * (orden.length - 1));
    const j = 1 + Math.floor(azar() * (orden.length - 1));
    if (Math.abs(i - j) < 2) continue;
    const otro = [...orden];
    [otro[i], otro[j]] = [otro[j], otro[i]];
    if (largoDelLazo(pts, otro) < base * 1.28) return otro;
  }
  return orden;
};

// Un rizo entre dos esferas: el hilo avanza, da una vuelta y sigue, como una
// ele manuscrita. Solo en tramos con aire para que no pase bajo las esferas.
const rizoEntre = (a, b, d, azar) => {
  const largo = distancia(a, b);
  // Chicos parecían nudos: el rizo va de 16 a 34 px, o no va.
  const radio = Math.min(34, ((largo - d) / 2) * 0.62);
  if (radio < 16) return [];
  const t = { x: (b.x - a.x) / largo, y: (b.y - a.y) / largo };
  const lado = azar() < 0.5 ? 1 : -1;
  const n = { x: -t.y * lado, y: t.x * lado };
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const punto = (adelante, arriba) => ({ x: m.x + t.x * radio * adelante + n.x * radio * arriba, y: m.y + t.y * radio * adelante + n.y * radio * arriba });
  return [punto(0.45, 0.15), punto(0, 1.45), punto(-0.45, 0.15)];
};

// 3. El trazo: una curva suave y cerrada por todos los puntos.
const curvaCerrada = (puntos, tension, W, H) => {
  const p = puntos.map(({ x, y }) => ({ x: Math.min(W + 4, Math.max(-4, x)), y: Math.min(H + 4, Math.max(-4, y)) }));
  const k = p.length;
  let d = `M${n1(p[0].x)},${n1(p[0].y)}`;
  for (let i = 0; i < k; i += 1) {
    const p0 = p[(i - 1 + k) % k];
    const p1 = p[i];
    const p2 = p[(i + 1) % k];
    const p3 = p[(i + 2) % k];
    d += ` C${n1(p1.x + (p2.x - p0.x) * tension)},${n1(p1.y + (p2.y - p0.y) * tension)} ${n1(p2.x - (p3.x - p1.x) * tension)},${n1(p2.y - (p3.y - p1.y) * tension)} ${n1(p2.x)},${n1(p2.y)}`;
  }
  return d;
};

export const ESTILOS_DE_GARABATO = ['lazo', 'cruce', 'rizos', 'cruce y rizo'];

// `hueco` (opcional): un rectángulo en pixeles donde no va ninguna esfera.
// `anclaEn` (opcional): dónde va la elegida, si no es la esquina de abajo.
export const trazarGarabato = (W, H, semilla, { D, d, cuantas = 8, izquierda = 0, hueco = null, anclaEn = null }) => {
  if (!(W > 0) || !(H > 0)) return null;
  const azar = conSemilla(semilla);
  const ancla = anclaEn ? { x: anclaEn.x, y: anclaEn.y, d: D } : { x: W - D / 2 - 4, y: H - D / 2 - 4, d: D };

  let diametro = d;
  let puestas = null;
  for (let achique = 0; achique < 5 && !puestas; achique += 1) {
    for (let intento = 0; intento < 30 && !puestas; intento += 1) puestas = sembrar(W, H, ancla, diametro, cuantas, izquierda, azar, hueco);
    if (!puestas) diametro = Math.round(diametro * 0.94);
  }
  if (!puestas) return null;

  const pts = [ancla, ...puestas];
  const estilo = ESTILOS_DE_GARABATO[Math.floor(azar() * ESTILOS_DE_GARABATO.length)];
  let orden = lazoLimpio(pts, azar);
  if (estilo === 'cruce' || estilo === 'cruce y rizo') orden = conUnCruce(pts, orden, azar);

  // Los puntos por donde pasa el hilo, con los rizos metidos en uno o dos de
  // los tramos más largos.
  const tramos = orden.map((i, j) => ({ j, largo: distancia(pts[i], pts[orden[(j + 1) % orden.length]]) }));
  const conRizo = new Set();
  if (estilo === 'rizos' || estilo === 'cruce y rizo') {
    const largos = [...tramos].sort((a, b) => b.largo - a.largo).slice(0, 4);
    const cuantosRizos = estilo === 'rizos' ? 2 : 1;
    while (conRizo.size < cuantosRizos && largos.length) conRizo.add(largos.splice(Math.floor(azar() * largos.length), 1)[0].j);
  }
  const recorrido = [];
  orden.forEach((i, j) => {
    recorrido.push(pts[i]);
    if (conRizo.has(j)) recorrido.push(...rizoEntre(pts[i], pts[orden[(j + 1) % orden.length]], diametro, azar));
  });

  // Más tensión, más curva: el garabato no hace rectas largas.
  const tension = 0.21 + azar() * 0.09;
  return {
    ancla,
    lugares: orden.slice(1).map((i) => ({ ...pts[i], d: diametro })),
    hilo: curvaCerrada(recorrido, tension, W, H),
    estilo,
  };
};
