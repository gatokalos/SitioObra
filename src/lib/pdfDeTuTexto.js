// «Llevármelo» (Carlos aceptó las dos salidas el 19 nov 2026): el texto se va
// como PDF, porque una imagen sirve para un párrafo y no para dos cuartillas.
// Se arma aquí, sin librerías: un PDF de texto con las fuentes que todo lector
// de PDF ya trae (Helvetica), en codificación WinAnsi para que pasen los
// acentos, la ñ, ¿ ¡ « » y las comillas tipográficas. Varias páginas si hace
// falta. No guarda nada: el archivo es de ella.

// Anchos de Helvetica (milésimas del cuerpo), de su archivo de métricas, para
// partir los renglones donde caben.
const ANCHOS = {
  ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584,
  ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722,
  O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, '[': 278,
  '\\': 278, ']': 278, '^': 469, _: 556, '`': 333, a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556,
  i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500,
  w: 722, x: 500, y: 500, z: 500, '{': 334, '|': 260, '}': 334, '~': 584,
  '¿': 611, '¡': 333, '«': 556, '»': 556, '“': 333, '”': 333, '‘': 222, '’': 222, '—': 1000, '–': 556, '…': 1000,
};
const sinAcento = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '');
const anchoDe = (c) => ANCHOS[c] ?? ANCHOS[sinAcento(c)] ?? 556;
const anchoDelTexto = (t, cuerpo, factor = 1) => [...t].reduce((s, c) => s + anchoDe(c), 0) * cuerpo * factor / 1000;

// WinAnsi: Latin-1 en casi todo; las comillas tipográficas, la raya y los
// puntos suspensivos tienen su lugar propio.
const WIN_ANSI = { '“': 0x93, '”': 0x94, '‘': 0x91, '’': 0x92, '—': 0x97, '–': 0x96, '…': 0x85, '€': 0x80 };
const aByte = (c) => {
  if (WIN_ANSI[c]) return WIN_ANSI[c];
  const n = c.charCodeAt(0);
  return n < 256 ? n : 0x3f; // lo que no cabe en WinAnsi sale como «?»
};
const cadenaPdf = (t) => `(${[...t].map((c) => {
  const b = aByte(c);
  if (c === '(' || c === ')' || c === '\\') return `\\${c}`;
  return String.fromCharCode(b);
}).join('')})`;

function partirEnRenglones(texto, cuerpo, ancho, factor = 1) {
  const renglones = [];
  String(texto).replace(/\r/g, '').split('\n').forEach((parrafo) => {
    if (!parrafo.trim()) { renglones.push(''); return; }
    let actual = '';
    parrafo.split(/\s+/).filter(Boolean).forEach((palabra) => {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (anchoDelTexto(prueba, cuerpo, factor) <= ancho || !actual) actual = prueba;
      else { renglones.push(actual); actual = palabra; }
    });
    if (actual) renglones.push(actual);
  });
  return renglones;
}

export function pdfDeTuTexto({ titulo = '', texto = '', pie = '' }) {
  const ANCHO = 595; const ALTO = 842; const MARGEN = 64;
  const util = ANCHO - MARGEN * 2;
  const CUERPO = 11.5; const INTERLINEA = 18;
  const CUERPO_TITULO = 20; const INTERLINEA_TITULO = 26;

  // Cada página es una lista de órdenes de dibujo.
  const paginas = [[]];
  let y = ALTO - MARGEN;
  const nuevaPagina = () => { paginas.push([]); y = ALTO - MARGEN; };
  const escribe = (fuente, cuerpo, linea) => {
    paginas[paginas.length - 1].push(`BT /${fuente} ${cuerpo} Tf 1 0 0 1 ${MARGEN} ${y.toFixed(2)} Tm ${cadenaPdf(linea)} Tj ET`);
  };

  if (titulo.trim()) {
    partirEnRenglones(titulo.trim(), CUERPO_TITULO, util, 1.06).forEach((linea) => {
      escribe('F2', CUERPO_TITULO, linea);
      y -= INTERLINEA_TITULO;
    });
    y -= 12;
  }
  partirEnRenglones(texto.trim(), CUERPO, util).forEach((linea) => {
    if (y < MARGEN + 40) nuevaPagina();
    if (linea) escribe('F1', CUERPO, linea);
    y -= INTERLINEA;
  });
  // El pie en cada página, abajo.
  paginas.forEach((ordenes) => {
    ordenes.push(`0.45 g BT /F3 8.5 Tf 1 0 0 1 ${MARGEN} ${MARGEN - 24} Tm ${cadenaPdf(pie)} Tj ET 0 g`);
  });

  // Objetos: 1 catálogo, 2 páginas, 3-5 fuentes, y por página: la página y su contenido.
  const objetos = [];
  const fuente = (base) => `<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>`;
  objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objetos[3] = fuente('Helvetica');
  objetos[4] = fuente('Helvetica-Bold');
  objetos[5] = fuente('Helvetica-Oblique');
  const kids = [];
  paginas.forEach((ordenes, i) => {
    const nPagina = 6 + i * 2;
    const nContenido = nPagina + 1;
    kids.push(`${nPagina} 0 R`);
    const flujo = ordenes.join('\n');
    objetos[nPagina] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${nContenido} 0 R >>`;
    objetos[nContenido] = `<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`;
  });
  objetos[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;

  let salida = '%PDF-1.4\n%âãÏÓ\n';
  const posiciones = [];
  for (let n = 1; n < objetos.length; n += 1) {
    posiciones[n] = salida.length;
    salida += `${n} 0 obj\n${objetos[n]}\nendobj\n`;
  }
  const inicioXref = salida.length;
  salida += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (let n = 1; n < objetos.length; n += 1) salida += `${String(posiciones[n]).padStart(10, '0')} 00000 n \n`;
  salida += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

  // Cada carácter de «salida» ya es un byte (0–255).
  const bytes = new Uint8Array(salida.length);
  for (let i = 0; i < salida.length; i += 1) bytes[i] = salida.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

// En el teléfono, el menú de compartir del aparato; si no se puede, se
// descarga. Devuelve cómo salió: 'compartido', 'descargado' o 'cancelado'.
// En el teléfono, la hoja de compartir; si no, una descarga. Sirve también para
// la tarjeta de la microliteratura (PNG).
export async function llevarseElArchivo(blob, nombre, tipo) {
  try {
    const archivo = new File([blob], nombre, { type: tipo });
    const esTelefono = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;
    if (esTelefono && navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: 'Tu texto' });
      return 'compartido';
    }
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelado';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'descargado';
}

export function llevarseElPdf(blob, nombre = 'tu-texto-gatoencerrado.pdf') {
  return llevarseElArchivo(blob, nombre, 'application/pdf');
}
