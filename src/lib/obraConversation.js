export const OBRA_CONVERSATION_STARTERS = [
  '¿Qué sabe el cuerpo antes que la mente?',
  '¿Cómo expresa el cuerpo lo que no logramos decir?',
  '¿Qué emociones aparecen físicamente antes de comprenderlas?',
  '¿Dónde se queda lo que no logramos procesar?',
  '¿Qué recuerda el cuerpo aunque intentemos olvidarlo?',
  '¿Puede el cuerpo contar una historia por sí solo?',
  '¿Qué límites aparecen cuando el cuerpo ya no puede sostener algo?',
  '¿Qué revela el cansancio sobre nuestra experiencia emocional?',
];

export const SILVESTRE_TRIGGER_QUESTIONS = [
  '¿Qué ocurre cuando compartimos aquello que intentábamos ocultar?',
  '¿Cuándo una experiencia deja de sentirse individual?',
  '¿Qué cambia cuando alguien más reconoce nuestro miedo?',
  '¿Por qué algunas heridas pesan menos al ser compartidas?',
  '¿Qué parte de nosotros busca ser comprendida por otros?',
  '¿Cómo cambia una persona cuando descubre que no está sola?',
  '¿Qué transforma una experiencia íntima en algo colectivo?',
  '¿Qué significa reconocerse en la fragilidad ajena?',
];

const VERTIGO_MODE_QUESTIONS = [
  '¿Qué cambia cuando algo íntimo ocurre frente a otros?',
  '¿Qué parte de nosotras aparece cuando somos observadas?',
  '¿Cuándo una experiencia deja de ser privada?',
  '¿Qué se vuelve real cuando alguien más lo presencia?',
  '¿El escenario revela o transforma lo que sentimos?',
  '¿Qué significa habitar una emoción delante de otros?',
  '¿Hasta qué punto actuar también es confesarse?',
  '¿Puede una escena contener algo que en la vida cotidiana no cabe?',
];

const CONFUSION_LUCIDA_QUESTIONS = [
  '¿Escribir ayuda a entender o solo reorganiza el caos?',
  '¿Qué buscamos realmente cuando escribimos sobre nosotros?',
  '¿Las palabras cierran heridas o las mantienen abiertas?',
  '¿Qué cambia cuando una experiencia se convierte en relato?',
  '¿Hasta dónde puede llegar una persona intentando explicarse?',
  '¿La escritura aclara lo vivido o lo distorsiona?',
  '¿Qué cosas solo pueden existir al ser narradas?',
  '¿Hay experiencias que se vuelven más verdaderas al escribirlas?',
];

const SOSPECHA_DOCTORA_QUESTIONS = [
  '¿Qué sentimos al vernos convertidos en imagen?',
  '¿Cuánto de nosotros permanece en una representación?',
  '¿Por qué algunas imágenes se sienten más reales que los recuerdos?',
  '¿Qué revela una imagen que el lenguaje no alcanza?',
  '¿Qué ocurre cuando alguien más interpreta nuestra apariencia?',
  '¿Hasta dónde una imagen puede convertirse en espejo?',
  '¿La imagen captura identidad o la inventa?',
  '¿Qué parte de nosotros sobrevive en una representación visual?',
];

const NECESIDAD_ORDEN_QUESTIONS = [
'¿Por qué ciertos objetos logran acompañarnos?',
'¿Qué sostenemos cuando sostenemos un objeto significativo?',
'¿Puede un objeto contener una experiencia emocional?',
'¿Qué cosas depositamos en los objetos sin darnos cuenta?',
'¿Por qué algunas personas necesitan tocar algo para sentirse presentes?',
'¿Cuándo un objeto deja de ser solo un objeto?',
'¿Qué recuerdos necesitan una forma física?',
'¿Qué tipo de ausencia puede aliviar un objeto?',
];

const HUMOR_NEGRO_QUESTIONS = [
  '¿Qué cambia cuando una experiencia queda grabada?',
  '¿La cámara documenta o transforma lo que ocurre?',
  '¿Qué sentimos al observarnos desde afuera en movimiento?',
  '¿Qué tipo de verdad aparece frente a una cámara?',
  '¿Por qué algunas grabaciones incomodan más que los recuerdos?',
  '¿Puede una cámara registrar fragilidad sin convertirla en espectáculo?',
  '¿Qué permanece después de ser grabado?',
  '¿Qué significa verse fallar desde afuera?',
];

const CANSANCIO_MENTAL_QUESTIONS = [
  '¿Por qué ciertos sonidos permanecen dentro de nosotros?',
  '¿Qué recuerdos llegan primero como sonido?',
  '¿Puede una voz hacernos volver a un estado emocional?',
  '¿Qué escucha una persona cuando se queda sola consigo misma?',
  '¿Qué emociones aparecen antes de encontrar palabras?',
  '¿Qué tipo de memoria habita en los sonidos?',
  '¿Por qué algunos ecos duran más que las imágenes?',
  '¿Qué parte de nosotros responde al sonido sin explicarse?',
];

const ATRACCION_INCOMODA_QUESTIONS = [
  '¿Por qué algunas personas necesitan participar para comprender?',
  '¿Qué revela una elección dentro de una experiencia narrativa?',
  '¿Cuántas formas existen de atravesar una misma historia?',
  '¿Elegimos realmente cómo interactuar con una experiencia?',
  '¿Qué tipo de vínculo aparece cuando una obra responde?',
  '¿Puede el juego abrir preguntas que otros formatos no permiten?',
  '¿Qué caminos elegimos cuando nadie nos dice cuál es correcto?',
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
