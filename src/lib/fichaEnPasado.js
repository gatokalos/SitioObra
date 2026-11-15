// El renglón que, en la ficha, liga el gesto ya hecho con la obra destacada
// (Carlos, 15 nov 2026: «un copy con CTA que haga saber que ese gesto fue
// inspirado en la obra destacada y que ese botón haga un scroll»). Solo aparece
// con el gesto registrado, y por ahora solo en La escritura.
//
// Aquí vivió unas horas, el 15 nov 2026, una versión del bloque «Al entrar en
// escena…» en pasado («Entraste en escena», «Leíste en voz alta…», «Nada se
// grabó…»). Carlos la retiró: «muy técnico y terrible». Lo que pide es otra
// cosa: frases que reconozcan lo que la persona ya hizo, con el mismo tono de
// las que acompañan la intuición y la preparación («Respondiste antes de saber
// algo más…»). Queda por escribir, con su visto bueno.
import { readResonanceRecord } from '@/lib/bitacoraShared';

const OBRA_DEL_GESTO = {
  literatura: { texto: 'El gesto que hiciste viene de esta obra.', boton: 'Ver la obra destacada' },
};

export const fichaEnPasado = (portal) => {
  const obra = OBRA_DEL_GESTO[portal];
  if (!obra) return null;
  const gesto = readResonanceRecord(portal).gesto_resultado;
  if (!['enunciado', 'parcial', 'declinado'].includes(gesto)) return null;
  return { obra, gesto };
};
