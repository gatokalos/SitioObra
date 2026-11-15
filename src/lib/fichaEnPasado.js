// En la ficha, el bloque «Al entrar en escena…» se lee después de haber
// entrado: por eso ahí va en pasado y con otro título (Carlos, 15 nov 2026:
// «ese bloque es leído después de haber entrado en escena […] no nomás es
// cambiar el pasado, también el título»). La misma lista, en presente, se queda
// en el panel de la constelación, donde invita a pasar a otra forma.
//
// Título: «Tú en escena…», tomado de la captura que mandó Carlos. Las tres
// frases las propuso Claude y Carlos las aprobó («el tono de las frases se
// queda»). Solo aparecen cuando el registro dice que la persona leyó en voz
// alta (gesto enunciado o parcial); si no, el bloque sigue anunciando.
//
// Por ahora solo La escritura: las otras ocho no tienen gesto todavía, así que
// no hay nada hecho que contar.
import { readResonanceRecord } from '@/lib/bitacoraShared';

const EN_PASADO = {
  literatura: {
    title: 'TÚ EN ESCENA…',
    notes: [
      '🎙️ Prestaste tu voz: leíste en voz alta cuando la escena te lo pidió.',
      '🔒 Nada se grabó. Tu voz abrió el paso y se quedó contigo.',
      '✍️ El texto no estaba escrito de antemano: lo convocaron tus palabras.',
    ],
    boton: 'Ver la obra destacada',
  },
};

export const fichaEnPasado = (portal) => {
  const forma = EN_PASADO[portal];
  if (!forma) return null;
  const gesto = readResonanceRecord(portal).gesto_resultado;
  if (gesto !== 'enunciado' && gesto !== 'parcial') return null;
  return forma;
};
