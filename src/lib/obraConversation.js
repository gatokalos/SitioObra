export const OBRA_CONVERSATION_STARTERS = [
  '¿Qué parte de mi no te gusta?',
];

export const SILVESTRE_TRIGGER_QUESTIONS = [
  'Ya no quiero resolver nada. Solo ayúdame a quedarme un momento.',
];

const VERTIGO_MODE_QUESTIONS = [
  'Ya no veo caras conocidas.',
  'Esto definitivamente no es real, pero tampoco es un sueño',
  '…cada vez que alguien me ve a los ojos empiezo a sentir un vacío insoportable…',
  '…ya no sé si tratar de llenarlo o dejarlo tal y como está…',
  '…estoy en el mundo como relleno. ¡Qué patético!',
  '…aunque me tenga solo a mí, necesito pensar en algo para entretenerme ¡Y ya me exasperé!',
  'Estoy harto, ¡me urge descansar de mí mismo!',
];

const CONFUSION_LUCIDA_QUESTIONS = [
  '[Me siento] con un dolor muy fuerte detrás de mis clavículas… como si las tuviera encajadas a mis pulmones.',
  'Te percibo algo molesta. ¿Por qué no decirlo así?',
  'Vamos [dilo]: “me siento molesta”, “estoy enojada”',
  '…sí estoy molesta, pero no enojada, estoy desesperada.',
  'Resulta que… mi ex no me deja visitar a Lucky',
];

const SOSPECHA_DOCTORA_QUESTIONS = [
  'Estoy en un lugar donde tengo que tomar asiento y esperar mi turno.',
  'En la mano tengo un papelito, un boleto —acaba con 37, aunque no siempre—',
  'Solo sé que tengo que esperar… esperar a que me llamen o algo así.',
  '[El "37"] sueña algo muy distinto en contraste a la noche anterior. ¡Sueña a lo bestia!',
  '…en el fondo, su historia es siempre la misma. Aunque diferente, no sé si me explico.',
];

const NECESIDAD_ORDEN_QUESTIONS = [
  'Falta explayarme… Estoy como en un banco y están llamando a uno por uno por altavoz.',
  'Después de ahí no sé qué tanto sucede, pero cuando es mi turno de pasar a ventanilla, algo pasa…',
  '…se me olvida en cuanto abro el ojo. Eso sí, hace que me hierva la sangre de rabia.',
  '…hay veces que [esa rabia] me dura todo el día.',
  'De hecho, ella, que no soy yo pero sí soy, también está esperando, o sea… Está encinta.',
  'Háblame de esa joven, ¿te recuerda a alguien en particular?',
  'Número once mil ciento treinta y siete, pase a ventanilla por favor.',
];

const HUMOR_NEGRO_QUESTIONS = [
  'Moriré… Lo demás, me importa un bledo.',
  '¿Estoy mal… o soy el único que no se queda callado?',
  'No estoy calmado… me estoy entrenando para aguantar.',
  '¿Esto era terapia o un simulacro elegante de colapso?',
  '¿Mi naturalez es triste… o brutalmente honesta?',
];

const CANSANCIO_MENTAL_QUESTIONS = [
  '¿Estás segura de que quieres meter a alguien más a la conversación?',
  'Tú, que eres siempre bueno y todo lo ve, dinos: ¿De qué lado masca la iguana?',
  'Me han contagiando de su locura ¡par de dos! Mejor me voy, ¡a mi nube, adiós!',
  '[Te lo advertí], ¡por eso no me gusta meter amigos imaginarios a nuestras charlas!',
  'Mejor invoquemos a aquella quien nunca tuvo favoritismos…',
  '¿Abuelita…? Soy yo… tu nieto, ¿estás ahí?',
];

const ATRACCION_INCOMODA_QUESTIONS = [
  'No hay un tú ni un yo; a menudo no se sabrá quién le habla a quién y eso está muy bien…',
  'Yo no quiero hablar solo para mí (…) ¡yo sí quiero que la gente me escuche!',
  '…si [realmente] quieres observar al observador (…) primero hay que borrar la división imaginaria entre ser y no ser…',
  '¡Argh, lo hiciste de nuevo, mi reina! (…) acabé hablando para quién sabe quién… otra vez. ',
  'Es hora de que te tomes más en serio, cabrón.',
  ];

export const PORTAL_VOZ_MODE_QUESTIONS = {
  'confusion-lucida': CONFUSION_LUCIDA_QUESTIONS,
  'sospecha-doctora': SOSPECHA_DOCTORA_QUESTIONS,
  'necesidad-orden': NECESIDAD_ORDEN_QUESTIONS,
  'humor-negro': HUMOR_NEGRO_QUESTIONS,
  'cansancio-mental': CANSANCIO_MENTAL_QUESTIONS,
  'atraccion-incomoda': ATRACCION_INCOMODA_QUESTIONS,
  vertigo: VERTIGO_MODE_QUESTIONS,

  // Compatibilidad con IDs legacy mientras se propaga el cambio de emociones.
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
