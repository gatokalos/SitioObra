// La constelación acomodada por regla (Carlos, 18 nov 2026). Una figura
// dibujada solo le queda bien a una proporción de pantalla; en teléfonos
// chicos se veía pequeña. Carlos: «que al hacer clic en una esfera esa esfera
// se haga grande y las demás se reacomoden alrededor», y que «cada vez […] se
// pudieran hacer figuras diferentes». Aquí se invierte el orden: primero las
// esferas, lo más grandes que quepan en el marco que haya; después el hilo,
// trazado por donde quedaron.
//
// La elegida va en su ancla, abajo a la derecha. Las otras ocho se reparten en
// ondas —arcos con centro en la elegida— hasta llenar el marco. El hilo sale
// de la elegida, recorre las ondas en vaivén y, desde la última esfera, vuelve
// a la elegida por fuera, bajando por la izquierda y corriendo por abajo: el
// lazo queda cerrado, como en la figura de escritorio (Carlos, 18 nov 2026,
// con un trazo sobre la captura: «no está cerrando el loop […] que sea
// deliberado y no por accidente»). El arco tenue que salía del marco por
// arriba se quitó. `variante` elige otro reparto de esferas entre las ondas,
// así que con cada clic la figura cambia.
//
// Devuelve medidas en pixeles del marco: { ancla, lugares[8], hilo, cierre }.

const HUECO = 9;            // aire entre ondas y entre esferas, antes de achicarlas
const AIRE = 0.74;          // las esferas se dibujan más chicas que su casilla, para que el hilo se vea
const DEDO = 40;            // ninguna esfera baja de aquí, aunque el marco sea mínimo
// La esquina de arriba a la derecha es del botón de cerrar: ahí no cae ninguna esfera.
const ESQUINA_DEL_CIERRE = 50;
const GRADOS = Math.PI / 180;

const enOnda = (cx, cy, r, grados) => ({ x: cx + r * Math.cos(grados * GRADOS), y: cy + r * Math.sin(grados * GRADOS) });

// Las ondas que caben con casillas de diámetro d: de cada una, el tramo de
// arco que queda dentro del marco y cuántas casillas le caben.
const ondasPara = (W, H, cx, cy, D, d, izquierda) => {
  const ondas = [];
  for (let k = 0; k < 14; k += 1) {
    const r = D / 2 + HUECO + d / 2 + k * (d + HUECO);
    let ini = null;
    let fin = null;
    for (let a = 180; a <= 270; a += 0.5) {
      const p = enOnda(cx, cy, r, a);
      const bajoElCierre = p.x + d / 2 > W - ESQUINA_DEL_CIERRE && p.y - d / 2 < ESQUINA_DEL_CIERRE;
      const bajoLaIzquierda = izquierda > 0 && p.x - d / 2 < izquierda && p.y - d / 2 < ESQUINA_DEL_CIERRE;
      if (p.x >= d / 2 && p.y >= d / 2 && !bajoElCierre && !bajoLaIzquierda) {
        if (ini === null) ini = a;
        fin = a;
      }
    }
    if (ini === null) break;
    const largo = (fin - ini) * GRADOS * r;
    ondas.push({ r, ini, fin, largo, cupo: Math.floor(largo / (d + HUECO)) + 1 });
  }
  return ondas;
};

const n1 = (n) => n.toFixed(1);

// `izquierda`: ancho reservado arriba a la izquierda (en local, los dos
// botones de ensayo; en el sitio publicado no existen y vale 0).
export const acomodarEnOndas = (W, H, variante = 0, cuantas = 8, izquierda = 0) => {
  if (!(W > 0) || !(H > 0)) return null;
  const D = Math.round(Math.min(0.36 * Math.min(W, H), 150));
  const cx = W - D / 2 - 4;
  const cy = H - D / 2 - 4;

  let d = Math.round(Math.min(W, H) * 0.4);
  let ondas = ondasPara(W, H, cx, cy, D, d, izquierda);
  while (d > 24 && ondas.reduce((s, o) => s + o.cupo, 0) < cuantas) {
    d -= 1;
    ondas = ondasPara(W, H, cx, cy, D, d, izquierda);
  }
  // Ni tan chicas que no se puedan tocar, ni tan grandes que compitan con la elegida.
  const diametro = Math.max(DEDO, Math.min(Math.round(d * AIRE), Math.round(D * 0.62)));
  // Las esferas se dibujan más chicas que su casilla: a lo largo de cada onda
  // caben más de las que se calcularon con la casilla. Ese cupo holgado es el
  // que deja repartirlas de varias maneras.
  ondas = ondas.map((o) => ({ ...o, cupo: Math.max(o.cupo, Math.floor(o.largo / (diametro + HUECO * 1.6)) + 1) }));

  // Los repartos posibles de las esferas entre las ondas, sin huecos entre la
  // primera onda usada y la más lejana, que siempre lleva al menos una (ahí
  // pasa el borde del lazo). Se ordenan por parejos —cada onda tan llena como
  // las demás, según lo que le cabe— y cada clic toma uno de los tres mejores.
  const repartos = [];
  const probar = (k, faltan, actual) => {
    if (k < 0) {
      if (faltan === 0) repartos.push([...actual]);
      return;
    }
    const maximo = Math.min(ondas[k].cupo, faltan);
    for (let n = maximo; n >= 0; n -= 1) {
      actual[k] = n;
      probar(k - 1, faltan - n, actual);
    }
    actual[k] = 0;
  };
  probar(ondas.length - 1, cuantas, ondas.map(() => 0));
  const sinHuecos = (r) => {
    const primera = r.findIndex((n) => n > 0);
    return r[r.length - 1] > 0 && r.slice(primera).every((n) => n > 0);
  };
  const cupoTotal = ondas.reduce((t, o) => t + o.cupo, 0);
  const desparejo = (r) => r.reduce((t, n, k) => (n > 0 ? t + (n / ondas[k].cupo - cuantas / cupoTotal) ** 2 : t), 0);
  const mejores = repartos.filter(sinHuecos).sort((x, y) => desparejo(x) - desparejo(y)).slice(0, 3);
  const porOnda = mejores.length ? mejores[variante % mejores.length] : ondas.map((o) => o.cupo);

  // El vaivén se cuenta desde la última onda, que siempre termina del lado
  // izquierdo: de ahí sale el cierre del lazo.
  const conEsferas = ondas.map((o, k) => ({ ...o, n: porOnda[k] })).filter((o) => o.n > 0);
  const usadas = conEsferas.map((o, j) => {
    const grados = Array.from({ length: o.n }, (_, i) => (o.n === 1 ? (o.ini + o.fin) / 2 : o.ini + ((o.fin - o.ini) * i) / (o.n - 1)));
    const alReves = (conEsferas.length - 1 - j) % 2 === 0;
    if (alReves) grados.reverse();
    return { ...o, grados, alReves };
  });

  const lugares = usadas.flatMap((o) => o.grados.map((a) => ({ ...enOnda(cx, cy, o.r, a), d: diametro })));

  // El hilo: sale de la elegida, recorre cada onda por su arco y pasa a la
  // siguiente con una curva que sigue la dirección que traía. Los quiebres
  // quedan debajo de las esferas.
  let hilo = `M${n1(cx)},${n1(cy)}`;
  let previo = null;
  usadas.forEach((o) => {
    const inicio = enOnda(cx, cy, o.r, o.grados[0]);
    const final = enOnda(cx, cy, o.r, o.grados[o.grados.length - 1]);
    const sentido = o.alReves ? -1 : 1;   // +1: el ángulo crece (como las manecillas)
    const tangente = (a) => ({ x: -Math.sin(a * GRADOS) * sentido, y: Math.cos(a * GRADOS) * sentido });
    if (!previo) {
      hilo += ` L${n1(inicio.x)},${n1(inicio.y)}`;
    } else {
      const largo = Math.hypot(inicio.x - previo.punto.x, inicio.y - previo.punto.y) / 2.4;
      const t0 = previo.tangente;
      const t1 = tangente(o.grados[0]);
      hilo += ` C${n1(previo.punto.x + t0.x * largo)},${n1(previo.punto.y + t0.y * largo)} ${n1(inicio.x - t1.x * largo)},${n1(inicio.y - t1.y * largo)} ${n1(inicio.x)},${n1(inicio.y)}`;
    }
    if (o.grados.length > 1) hilo += ` A${n1(o.r)},${n1(o.r)} 0 0 ${o.alReves ? 0 : 1} ${n1(final.x)},${n1(final.y)}`;
    previo = { punto: final, tangente: tangente(o.grados[o.grados.length - 1]) };
  });

  // El cierre: de la última esfera baja por fuera, a la izquierda, dobla la
  // esquina y corre por abajo hasta la elegida. Va un poco fuera del marco,
  // en su margen, para pasar por fuera de las esferas.
  let cierre = null;
  if (previo) {
    const fuera = -6;
    const abajo = H + 6;
    const { punto, tangente } = previo;
    const hacia = (largo) => `${n1(punto.x + tangente.x * largo)},${n1(punto.y + tangente.y * largo)}`;
    const llegada = `${n1(cx - D * 0.8)},${n1(abajo)} ${n1(cx)},${n1(cy)}`;
    if (punto.y < H - 90) {
      const esquina = H - 50;
      cierre = `M${n1(punto.x)},${n1(punto.y)} C${hacia(Math.min(60, (esquina - punto.y) / 2))} ${n1(fuera)},${n1(esquina - (esquina - punto.y) * 0.4)} ${n1(fuera)},${n1(esquina)}`
        + ` C${n1(fuera)},${n1(abajo + 4)} ${llegada}`;
    } else {
      cierre = `M${n1(punto.x)},${n1(punto.y)} C${hacia(40)} ${llegada}`;
    }
  }

  return { ancla: { x: cx, y: cy, d: D }, lugares, hilo, cierre, ondas: usadas.map((o) => o.n) };
};
