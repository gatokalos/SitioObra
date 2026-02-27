export const OBRA_CONVERSATION_STARTERS = [
  '¿Qué parte de mi no te gusta?',
];

export const SILVESTRE_TRIGGER_QUESTIONS = [
  'Ya no quiero resolver nada. Solo ayúdame a quedarme un momento.',
];

const VERTIGO_MODE_QUESTIONS = [
  'En estos momentos no veo caras conocidas',
  'Esto definitivamente no es real, pero tampoco es un sueño',
  'Estoy en un lugar donde tengo que tomar asiento y esperar mi turno',
  'Antes de morir… yo estoy seguro que…',
  'Esto no puede ser… Es que esto no puede ser…',
  'La muerte no era sueño… pero tampoco tragedia… era otra cosa...',
];

const CONFUSION_LUCIDA_QUESTIONS = [
  'Algo pasa; algo que se me olvida en cuanto abro el ojo',
  'No lo sé, no lo sé… pero algo sí pasó',
  '¿Esto fue lo que soñé… o es un recuerdo…?',
  'Siento que ya estuve aquí… pero no sé cuándo',
  'Sé que soñé muchísimo pero se me olvidó todo en cuanto abrí el ojo',
];

const SOSPECHA_DOCTORA_QUESTIONS = [
  'No sé si me estás escuchando… o evaluando.',
  '¿Usted sabe por qué se dice buscarle ‘tres pies’ al gato…?',
  'Estás pensando qué decirme mientras me escuchas, ¿verdad?',
  'No me creo del todo la calma de la gente.',
  'Descríbeme brevemente a las personas que ves en tu sueño.',
];

const NECESIDAD_ORDEN_QUESTIONS = [
  'No le busques tres pies al gato si ya sabes que tiene cuatro.',
  '¿Esto fue lo que soñé o es solo un recuerdo…?',
  'Dime qué es esto. Sin metáforas.',
  'No saber me desarma.',
  'Soy un gato encerrado y quiero abrir las ventanas.',
  'Si no me entiendo, ¿sigo siendo yo?',
  'Si le pongo nombre a lo que siento… ¿se quedará quieto?',
];

const HUMOR_NEGRO_QUESTIONS = [
  'Moriré… Lo demás, me importa un bledo.',
  '¿Estoy mal… o soy el único que no se queda callado?',
  'No estoy calmado… me estoy entrenando para aguantar.',
  '¿Esto era terapia o un simulacro elegante de colapso?',
  '¿Mi naturalez es triste… o brutalmente honesta?',
];

const CANSANCIO_MENTAL_QUESTIONS = [
  'Eso si, hace que me hierva la sangre de rabia.',
  '¡Ah, qué animales estos pensamientos! Se corretean sin punto de quiebre.',
  'Zumbando en mis sesos, siempre muy hambrientos.',
  '¡Eso fue lo que me dejó este hueco en la cabeza!',
  'Me pegó fuerte. ¿Cómo cierro el día?',
  '¿Y ahora quñe hacemos con el tiempo que nos queda?',
];

const ATRACCION_INCOMODA_QUESTIONS = [
  '¿Estaré sola con mis pensamientos, escuchándolos en voz alta durante toda la eternidad?',
  'Ahorita no te preocupes por el tiempo…',
  'Sigue respirando profundo y no te me duermas.',
  'Todo es en cámara lenta y tengo “aquí” al rostro de mi enamorada.',
  '¿Y si esa risa tierna… es para manipularme?',
  'Gracias por prestarme tu voz cuando yo ya no sabía cómo hablar.',
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
