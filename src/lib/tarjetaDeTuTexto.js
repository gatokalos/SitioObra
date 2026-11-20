// La tarjeta de «Tu texto» (Carlos, 20 nov 2026): «la tarjeta está padre para
// compartir en redes, pero solo en caso de microliteratura… El diario íntimo no
// cabe en un cuadro. Por eso le descargaría un PDF. Pero en caso de la
// microliteratura, podríamos regalarle la tarjeta». Y sobre las esferas: dan
// «identidad a la tarjeta» y «sentido de pertenencia»: «ya tengo 2 esferas,
// pero ella ya las 9». El diseño final se verá durante la maestría.
//
// Se dibuja aquí, en el navegador de la persona: nada sale a un servidor. Una
// imagen vertical de 1080 × 1350 (redes y mensajería) con el estilo del acto
// final: el tigre de fondo, las nueve esferas (encendidas las de sus formas),
// el género, el título, el texto y, abajo, el nombre con que firmó sus
// réplicas y el sitio.

import { CATALOG } from '@/lib/bitacoraShared';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';

// Microliteratura = lo que cabe en la tarjeta con letra legible. Es un
// parámetro inicial, como las 72 h: si cambia, cambia aquí.
export const TARJETA_MAX_CARACTERES = 400;
export const esMicroliteratura = (texto) => {
  const t = String(texto ?? '').trim();
  return t.length > 0 && t.length <= TARJETA_MAX_CARACTERES;
};

const ANCHO = 1080;
const ALTO = 1350;
const MARGEN = 96;
const UTIL = ANCHO - MARGEN * 2;
const FONDO = '#07060b';
const LETRA = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
const TITULAR = '"Vox Round", "Inter", system-ui, sans-serif';

function cargarImagen(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Corta un texto en renglones que caben en `ancho`. Respeta los párrafos: un
// renglón vacío (null) los separa.
function renglones(ctx, texto, ancho) {
  const salida = [];
  const parrafos = String(texto ?? '').replace(/\r\n/g, '\n').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  parrafos.forEach((parrafo, i) => {
    if (i > 0) salida.push(null);
    let linea = '';
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width <= ancho || !linea) {
        linea = prueba;
      } else {
        salida.push(linea);
        linea = palabra;
      }
    }
    if (linea) salida.push(linea);
  });
  return salida;
}

function conEspaciado(ctx, valor) {
  try { ctx.letterSpacing = valor; } catch { /* navegadores sin letterSpacing */ }
}

export async function tarjetaDeTuTexto({ titulo = '', genero = null, texto = '', nombre = null, formas = [] }) {
  try { await document.fonts?.load(`italic 600 64px ${TITULAR}`); } catch { /* sin la fuente, la de respaldo */ }
  const encendidas = new Set(formas);
  const [tigre, ...emblemas] = await Promise.all([
    cargarImagen('/assets/replica-tiger-desktop.png'),
    ...CATALOG.map((f) => cargarImagen(PORTAL_EMBLEM_URL[f.key])),
  ]);

  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');

  // Fondo: el tigre arriba a la derecha, que se apaga hacia abajo.
  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  if (tigre) {
    const alto = 760;
    const ancho = (tigre.width / tigre.height) * alto;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(tigre, ANCHO - ancho, 0, ancho, alto);
    ctx.globalAlpha = 1;
  }
  const velo = ctx.createLinearGradient(0, 0, 0, ALTO);
  velo.addColorStop(0, 'rgba(7,6,11,0.25)');
  velo.addColorStop(0.3, 'rgba(7,6,11,0.55)');
  velo.addColorStop(0.62, FONDO);
  velo.addColorStop(1, FONDO);
  ctx.fillStyle = velo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // #GatoEncerrado y las nueve esferas.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(226,232,240,0.78)';
  ctx.font = `500 22px ${LETRA}`;
  conEspaciado(ctx, '7px');
  ctx.fillText('#GATOENCERRADO', MARGEN, 118);
  conEspaciado(ctx, '0px');

  const diametro = 72;
  const hueco = (UTIL - diametro * CATALOG.length) / (CATALOG.length - 1);
  const yEsferas = 156;
  CATALOG.forEach((forma, i) => {
    const x = MARGEN + i * (diametro + hueco);
    const cx = x + diametro / 2;
    const cy = yEsferas + diametro / 2;
    const suya = encendidas.has(forma.key);
    // Las apagadas son círculos oscuros con el emblema apenas visible, como en
    // el sitio; el fondo no se transparenta.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, diametro / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#050409';
    ctx.fill();
    ctx.clip();
    if (emblemas[i]) {
      ctx.globalAlpha = suya ? 1 : 0.3;
      if (!suya) ctx.filter = 'grayscale(1)';
      ctx.drawImage(emblemas[i], x - diametro * 0.02, yEsferas - diametro * 0.02, diametro * 1.04, diametro * 1.04);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (!suya) {
      ctx.beginPath();
      ctx.arc(cx, cy, diametro / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (suya) {
      ctx.beginPath();
      ctx.arc(cx, cy, diametro / 2 + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.32)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  });

  let y = 330;

  // El género, en su píldora.
  if (genero) {
    ctx.font = `500 20px ${LETRA}`;
    conEspaciado(ctx, '4px');
    const etiqueta = genero.toUpperCase();
    const ancho = ctx.measureText(etiqueta).width + 44;
    ctx.beginPath();
    ctx.roundRect?.(MARGEN, y - 30, ancho, 44, 22);
    ctx.strokeStyle = 'rgba(216,180,254,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(233,213,255,0.94)';
    ctx.fillText(etiqueta, MARGEN + 22, y);
    conEspaciado(ctx, '0px');
    y += 50;
  }

  // El título.
  if (titulo.trim()) {
    ctx.font = `italic 600 64px ${TITULAR}`;
    ctx.fillStyle = '#ffffff';
    const lineasTitulo = renglones(ctx, titulo.trim(), UTIL).filter(Boolean).slice(0, 3);
    lineasTitulo.forEach((l) => { y += 70; ctx.fillText(l, MARGEN, y); });
    y += 40;
    const raya = ctx.createLinearGradient(MARGEN, 0, MARGEN + UTIL, 0);
    raya.addColorStop(0, 'rgba(192,132,252,0.6)');
    raya.addColorStop(1, 'rgba(192,132,252,0)');
    ctx.fillStyle = raya;
    ctx.fillRect(MARGEN, y, UTIL, 1.5);
    y += 30;
  }

  // El texto: la letra más grande que quepa antes del pie.
  const techoDelPie = ALTO - 170;
  // Entre más corto, más grande: la microliteratura llena la tarjeta.
  let tam = 54;
  let lineas = [];
  for (; tam >= 26; tam -= 2) {
    ctx.font = `400 ${tam}px ${LETRA}`;
    lineas = renglones(ctx, texto, UTIL);
    const alto = lineas.reduce((a, l) => a + (l === null ? tam * 0.75 : tam * 1.5), 0);
    if (y + alto <= techoDelPie) break;
  }
  ctx.fillStyle = '#eeeaf3';
  ctx.shadowColor = FONDO;
  ctx.shadowBlur = 14;
  for (const l of lineas) {
    if (l === null) { y += tam * 0.75; continue; }
    y += tam * 1.5;
    if (y > techoDelPie + tam) break;
    ctx.fillText(l, MARGEN, y);
  }
  ctx.shadowBlur = 0;

  // El pie: su nombre (el que puso al firmar sus réplicas) y el sitio.
  const yPie = ALTO - 84;
  if (nombre) {
    ctx.font = `600 30px ${LETRA}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nombre.slice(0, 40), MARGEN, yPie);
  }
  ctx.font = `400 23px ${LETRA}`;
  ctx.fillStyle = 'rgba(203,213,225,0.78)';
  ctx.textAlign = 'right';
  ctx.fillText('universo.gatoencerrado.org', ANCHO - MARGEN, yPie);
  ctx.textAlign = 'left';

  return new Promise((resolve) => lienzo.toBlob((b) => resolve(b), 'image/png'));
}
