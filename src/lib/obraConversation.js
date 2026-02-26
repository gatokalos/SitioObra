export const OBRA_CONVERSATION_STARTERS = [
  '¿Qué parte de la obra te gusta más?',
];

export const SILVESTRE_TRIGGER_QUESTIONS = [
  '¿Y si Silvestre está angustiado por el mundo?',
];

const VERTIGO_MODE_QUESTIONS = [
  '¿Qué implica existir como obra y no como persona?',
  '¿Desde cuándo existes… y cuándo dejas de existir?',
  'Dime... ¿eres el texto, los cuerpos en el escenario… o algo que ocurre entre ambos?',
  '¿Y si tú no eres conciente de la obra sino un personaje más?',
  '¿Qué significa que existas tanto en el escenario como en nuestra mente?',
  '¿Una obra necesita ser entendida… o solo necesita ser vista?',
  '¿Qué parte de ti fue escrita sin que te dieras cuenta?',
  'Si la obra se repite en mi cabeza, ¿quién está insistiendo, tú o yo?',
];

const CONFUSION_LUCIDA_QUESTIONS = [
  '¿Los otros personajes son personas reales… o son partes de Silvestre?',
  '¿Por qué nunca queda claro qué le pasa realmente a Silvestre?',
  '¿Por qué la obra se me queda dando vueltas incluso después de que termina?',
  '¿Por qué la obra no cierra todo como uno esperaría?',
  'Hubo una parte que me incomodó… pero no sé explicar por qué.',
  '¿Está bien no entenderla?',
];

const SOSPECHA_DOCTORA_QUESTIONS = [
  '¿La Doctora sí entiende a Silvestre… o solo parece que sí?',
  '¿La Doctora lo está ayudando… o lo está administrando?',
  '¿Ayuda de verdad o quiere mantener todo bajo control?',
  '¿Por qué siento que la Doctora cuida algo más que al paciente?',
  '¿Qué oculta la calma de la Doctora?',
];

const NECESIDAD_ORDEN_QUESTIONS = [
  '¿La obra habla de ansiedad y depresión?',
  'La escena de las marcianas me sacó de onda.',
  '¿Silvestre quiere entender lo que le pasa… o solo quiere dejar de sentirse así?',
  '¿Qué significa el título de la obra?',
  'Explícame en simple: ¿qué quiso dejar abierto la obra?',
];

const HUMOR_NEGRO_QUESTIONS = [
  '¿La obra te abraza… o te cobra peaje emocional?',
  '¿Silvestre está mal… o solo es el único sincero del cuarto?',
  '¿La Doctora receta calma… o entrenamiento para sobrevivir al caos?',
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
