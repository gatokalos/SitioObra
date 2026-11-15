// La ficha habla en pasado de lo que la persona ya hizo (Carlos, 15 nov 2026:
// «aquí el usuario va a ver lo que ya hizo, en tiempo pasado. Como un logro.
// No lo que APENAS va a hacer […] es una sutileza que refuerza el gesto»).
//
// El bloque «Al entrar en escena…» anuncia; con el gesto ya registrado, cuenta.
// Solo dice lo que el registro dice: quien leyó en voz alta lee «Leíste»; quien
// leyó a medias o prefirió no leer, lee eso (D-69 distingue siempre enunciado,
// parcial y declinado). Sin gesto registrado, el bloque sigue anunciando.
//
// Por ahora solo La escritura: es la única forma cuyo gesto está definido. Las
// demás entran cuando Carlos tenga los suyos (cronograma aparte).
import { readResonanceRecord } from '@/lib/bitacoraShared';

const EN_PASADO = {
  literatura: {
    title: 'ENTRASTE EN ESCENA',
    porGesto: {
      enunciado: [
        '🎙️ Leíste en voz alta — tu voz hizo avanzar la escena.',
        '🔒 Nada se grabó — tu voz se detectó para avanzar; no se guardó ni se transcribió.',
      ],
      parcial: [
        '🎙️ Leíste en voz alta, a medias — tu voz alcanzó a mover la escena.',
        '🔒 Nada se grabó — tu voz se detectó para avanzar; no se guardó ni se transcribió.',
      ],
      declinado: [
        '🎙️ Preferiste no leer en voz alta — la escena quedó así.',
        '🔒 Nada se grabó ni se transcribió.',
      ],
    },
    siempre: ['✍️ El material no fue fijo — lo convocaron tus propias palabras.'],
    obra: { texto: 'El gesto que hiciste viene de esta obra.', boton: 'Ver la obra destacada' },
  },
};

export const fichaEnPasado = (portal) => {
  const forma = EN_PASADO[portal];
  if (!forma) return null;
  const gesto = readResonanceRecord(portal).gesto_resultado;
  const lineas = forma.porGesto[gesto];
  if (!lineas) return null;
  return { title: forma.title, notes: [...lineas, ...forma.siempre], obra: forma.obra, gesto };
};
