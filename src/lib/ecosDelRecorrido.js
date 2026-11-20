// Los ecos del recorrido: la frase que devuelve a la persona lo que escribió en
// su primera intuición y lo que eligió en el segundo paso. Vivían en
// ResonanceModal.jsx; se mudaron aquí el 17 nov 2026 para que el recuadro «Lo
// que deja la duda» (VitranaQuestionReveal.jsx) pueda usarlos sin importar el
// modal entero. ResonanceModal.jsx los sigue exportando con el mismo nombre.

/* ─── Acknowledgment por portal (tras responder Nivel 1) ─────────────── */

// Las intuiciones largas no llevan espejo (Carlos, 13 nov 2026). La plantilla
// es una sola oración y la regla del 25 sep 2026 pide la respuesta completa,
// sin resumir: una respuesta de varias oraciones no cabe, y pegada entera se
// leía mal. Elegir una de sus oraciones sería interpretar; eso se deja para la
// Réplica. Aquí el eco solo dice que quedó registrada. «Larga» es más de una
// oración (un cierre seguido de más texto) o más de 200 caracteres.
export const ECO_SIN_ESPEJO = 'Tu primera intuición quedó registrada.';
export const esIntuicionLarga = (answer) => {
  const a = (answer ?? '').trim().replace(/[.!?…]+$/, '');
  return a.length > 200 || /[.!?…;\n]\s*\S/.test(a);
};

export const buildL1Acknowledgment = (portal, answer) => {
  if (!answer) return null;
  if (esIntuicionLarga(answer)) return ECO_SIN_ESPEJO;
  const a = answer.trim().replace(/[.!?]+$/, '');
  const objectAnswer = a
    .replace(/^lo extraño$/i, 'lo extrañas')
    .replace(/^la extraño$/i, 'la extrañas')
    .replace(/^los extraño$/i, 'los extrañas')
    .replace(/^las extraño$/i, 'las extrañas');
  // Cada plantilla repite su pregunta madre y termina con las palabras de la
  // persona (Carlos, 20 nov 2026: «Me sirven esas nueve frases, por ahora»).
  // Las anteriores eran de preguntas que ya no están. Copia en la servidora:
  // lib/ecoIntuicion.js (PLANTILLAS_ECO); si cambian aquí, cambian allá.
  const templates = {
    obra:        `Para ti, habitar una emoción delante de otros significa ${a}.`,
    literatura:  `Cuando una experiencia personal se convierte en relato, en ti cambia ${a}.`,
    artesanias:  `Un objeto deja de ser para ti solo un objeto cuando ${objectAnswer}.`,
    grafico:     `Cuando alguien más interpreta tu apariencia, te ocurre ${a}.`,
    cine:        `Al verte fallar desde afuera, descubres ${a}.`,
    sonoridades: `Cuando ya no queda nada que mirar, en ti sigue sonando ${a}.`,
    movimiento:  `Antes de que el pensamiento alcance a nombrarlo, tu cuerpo sabe ${a}.`,
    juegos:      `Cuando una decisión tuya cambia el rumbo de una historia, en ti cambia ${a}.`,
    oraculo:     `Reconoces en otros una experiencia que creías solo tuya cuando ${a}.`,
  };
  return templates[portal] ?? null;
};

const ARTESANIAS_L2_ACKNOWLEDGMENTS = {
  'cartas o papeles': 'Las cartas y los papeles son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  ropa: 'La ropa es lo que más te cuesta dejar ir, aunque ya no tenga utilidad.',
  'objetos hechos por alguien': 'Los objetos hechos por alguien son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'recuerdos pequeños': 'Los recuerdos pequeños son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'cosas que me acompañaron mucho tiempo': 'Las cosas que te acompañaron durante mucho tiempo son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'no suelo guardar cosas': 'Cuando algo pierde su utilidad, no sueles necesitar conservarlo.',
};

export const buildL2Acknowledgment = (portal, option) => {
  if (!option) return null;
  if (portal === 'artesanias') {
    return ARTESANIAS_L2_ACKNOWLEDGMENTS[option]
      ?? `Eso que reconoces en ${option} todavía ocupa un lugar en ti, aunque su utilidad haya terminado.`;
  }
  const o = option.trim().replace(/[.!?]+$/, '');
  const templates = {
    obra:        `Antes de entrar en escena, tu mirada busca ${o}.`,
    literatura:  `Abres la historia esperando encontrar ${o}.`,
    grafico:     `Cuando vuelves a estar a solas, lo que permanece ante tu mirada es ${o}.`,
    cine:        `En una historia, apartas la mirada cuando aparece ${o}.`,
    sonoridades: `Cuando el ruido se apaga, vuelve contigo ${o}.`,
    movimiento:  `Cuando aún no entiendes lo que sientes, tu cuerpo ${o}.`,
    juegos:      `Cuando una experiencia te obliga a elegir, primero decides ${o}.`,
    oraculo:     `Cuando una pregunta permanece contigo, eliges ${o}.`,
  };
  return templates[portal] ?? `Tu mirada se afina hacia ${o} antes de habitar la forma.`;
};
