export const OBRA_CONVERSATION_STARTERS = [
  '¿Qué parte de mi te gusta más?',
];

export const SILVESTRE_TRIGGER_QUESTIONS = [
  '¿Y si estoy angustiado por el mundo?',
];

const VERTIGO_MODE_QUESTIONS = [
  'Si nadie te ve… ¿sigues ahí?',
  '¿Naciste cuando te escribieron… o cuando te vimos?',
  'Dime... ¿Eres lo que está escrito… o lo que pasa?',
  'Tú no estás aqui, solo existes en el escenario.',
  'Mirar una obra es más que suficiente',
  '¿Quién no suelta a quién?',
];

const CONFUSION_LUCIDA_QUESTIONS = [
  'Siento que todos viven dentro de mi cabeza.',
  'Algo en mí se fragmenta.',
  'No sé exactamente qué me pasa… pero lo veo en todo.',
  'No sé dónde tengo la cabeza.',
  'Necesitaba compañía.',
  'No entendí… pero algo se me movió.',
];

const SOSPECHA_DOCTORA_QUESTIONS = [
  'No sé si me estás escuchando… o evaluando.',
  'Cuando me miras así, siento que ya decidiste.',
  '¿Me estás escuchando… o ya estás escribiendo lo que soy?',
  'No me creo del todo la calma de la gente.',
  '¿De quién me estoy protegiendo realmente?',
];

const NECESIDAD_ORDEN_QUESTIONS = [
  'Me desespera no saber qué me pasa',
  'Quisiera ponerle nombre a lo que me pasa.',
  'No saber me desarma.',
  'Si soy un gato encerrado… ¿dónde está la ventana?',
  'Si no me entiendo, ¿sigo siendo yo?',
  'Si le pongo nombre a lo que siento… ¿se queda quieto?',
];

const HUMOR_NEGRO_QUESTIONS = [
  '¿Me estás cuidando… o me estás cobrando?',
  '¿Estoy mal… o soy el único que lo está diciendo como es?',
  'No estoy calmado… me estoy entrenando para aguantar.',
  '¿Esto era terapia o un simulacro elegante de derrumbe?',
  '¿Es triste… o brutalmente honesta?',
];

const CANSANCIO_MENTAL_QUESTIONS = [
  'Idea: no me cabe nada más hoy. Acción: dame un paso pequeño. Pregunta: ¿qué sí puedo sostener?',
  'Idea: me quedé atorado después de verla. Acción: aterrízame en una frase útil. Pregunta: ¿qué hago primero?',
  'Idea: sigo con ruido mental. Acción: ordéname esto en algo simple. Pregunta: ¿qué suelto hoy?',
  'Idea: me pegó fuerte la historia. Acción: una forma breve de cuidarme. Pregunta: ¿cómo cierro el día?',
  'Idea: no quiero analizar todo. Acción: algo mínimo para hoy. Pregunta: ¿qué me toca ahora?',
];

const ATRACCION_INCOMODA_QUESTIONS = [
  'No te entendí… pero aquí estoy, pensando en ti.',
  'Hay algo de la Doctora que me irrita.',
  '¿Se puede vivir sin estar explicándolo todo?',
  'Me empujaste a algo que no quería mirar.',
  'Salí enojado. Y no sé con quién.',
  'Me cansó que nadie pueda detener la mente.',
];

export const PORTAL_VOZ_MODE_QUESTIONS = {
  'confusion-lucida': CONFUSION_LUCIDA_QUESTIONS,
  'sospecha-doctora': SOSPECHA_DOCTORA_QUESTIONS,
  'necesidad-orden': NECESIDAD_ORDEN_QUESTIONS,
  'humor-negro': HUMOR_NEGRO_QUESTIONS,
  'cansancio-mental': CANSANCIO_MENTAL_QUESTIONS,
  'atraccion-incomoda': ATRACCION_INCOMODA_QUESTIONS,
  vertigo: VERTIGO_MODE_QUESTIONS,

  // Compatibilidad con IDs legacy mientras se propaga el cambio de perfiles.
  'lectura-profunda': CONFUSION_LUCIDA_QUESTIONS,
  artista: ATRACCION_INCOMODA_QUESTIONS,
  rabia: ATRACCION_INCOMODA_QUESTIONS,
  'claro-directo': NECESIDAD_ORDEN_QUESTIONS,
  tiktoker: HUMOR_NEGRO_QUESTIONS,
  'util-hoy': CANSANCIO_MENTAL_QUESTIONS,
  poeta: VERTIGO_MODE_QUESTIONS,
  filósofo: VERTIGO_MODE_QUESTIONS,
  filosofo: VERTIGO_MODE_QUESTIONS,
};
