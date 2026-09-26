// Pregunta base por portal — fuente: "Nueve intentos de no romperse"
export const PREGUNTA_MADRE = {
  obra:        '¿Qué significa para ti habitar una emoción delante de otros?',
  literatura:  '¿Qué cambia en ti cuando una experiencia personal se convierte en relato?',
  artesanias:  '¿Cuándo un objeto deja de ser para ti solo un objeto?',
  grafico:     '¿Qué te ocurre cuando alguien más interpreta tu apariencia?',
  cine:        '¿Qué descubres de ti al verte fallar desde afuera?',
  sonoridades: '¿Qué sigue sonando en ti cuando ya no queda nada que mirar?',
  movimiento:  '¿Qué sabe tu cuerpo antes de que el pensamiento alcance a nombrarlo?',
  juegos:      '¿Qué cambia en ti cuando una decisión tuya cambia el rumbo de una historia?',
  oraculo:     '¿Cuándo reconoces en otros una experiencia que creías solo tuya?',
};

/**
 * La pregunta del movimiento 1 de cada forma: la pregunta madre, literal.
 *
 * D-67 (Carlos, 25 sep 2026): se apaga la personalización. Hasta hoy, si la
 * persona había pasado por el Oráculo, este hook pedía a
 * /api/gato/vitrina-question una variante reescrita por IA para acercarla a su
 * recorrido. El movimiento 1 es declarar sin nada delante (D-66), la variante le
 * ponía delante ese recorrido, y cada persona podía contestar una pregunta
 * distinta, sin revisión externa (D-21, D-23). Nunca se disparó en producción
 * (0 de 70). Ahora todas las personas contestan la misma pregunta, entren por la
 * vitrina o por el portal. Se conserva la forma de lo que devuelve para no tocar
 * a los nueve portales que lo usan.
 *
 * @param {string} portal - nombre canónico del portal (ej. 'grafico')
 * @returns {{ question: string|null, loading: boolean }}
 */
export function useVitranaQuestion(portal) {
  return { question: PREGUNTA_MADRE[portal] ?? null, loading: false };
}
