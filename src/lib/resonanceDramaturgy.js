export const RESONANCE_SHARED_DRAMATURGY = {
  phase3Eyebrow: 'Clímax del segundo acto',
  phase3Title: 'En el foco',
  appearanceCue: 'Antes del intermedio, el autor entra a cuadro.',
  phase3Description: 'Este recorrido ha concluido. Las respuestas registradas permiten estudiar cómo las experiencias narrativas son interpretadas, recordadas y resignificadas por distintas personas.',
  returnLead: 'Esto no termina aquí.',
  // "Llamado" convertía al protagonista en aspirante: las llamadas de teatro son
  // previas a la función (ahí está la Tercera llamada), y una después del clímax
  // se lee como casting. Contradecía además la regla canónica del regreso
  // diferido: la agencia es de lo que vuelve, no del usuario. El resto del copy
  // ya lo tenía bien — "una nueva pregunta volverá a buscarte" (Carlos, 10 sep 2026).
  returnBody: 'Dentro de unos días, una nueva pregunta volverá a buscarte. Si quieres que te encuentre, danos permiso para enviarte un único aviso por WhatsApp.',
  returnCta: 'Quiero que la pregunta vuelva →',
  souvenirCta: 'Quiero recordar este acto',
  entranceCoda: 'Ya forma parte de tu obra.',
  closingLine: 'Has llegado hasta aquí. La obra queda en pausa.',
};

export const RESONANCE_DRAMATURGY_BY_PORTAL = {
  obra: {
    label: 'Dramaturgia',
    form: 'El drama',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Ubica desde dónde miras',
  },
  literatura: {
    label: 'Literatura',
    form: 'La escritura',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Reconoce lo que buscas',
  },
  artesanias: {
    label: 'Artesanías',
    form: 'El objeto',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Reconoce lo que conservas',
  },
  grafico: {
    label: 'Gráficos',
    form: 'La imagen',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Afina tu mirada',
  },
  cine: {
    label: 'Cine',
    form: 'La proyección',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Sostén la mirada',
  },
  sonoridades: {
    label: 'Sonoridades',
    form: 'La vibración',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Afina el oído',
  },
  movimiento: {
    label: 'Movimiento',
    form: 'El cuerpo',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Escucha tu cuerpo',
  },
  juegos: {
    label: 'Juegos',
    form: 'El riesgo',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Reconoce tu impulso',
  },
  oraculo: {
    label: 'Oráculo',
    form: 'La pregunta',
    phase2Eyebrow: 'Preparación de escena',
    phase2Title: 'Sostén la pregunta',
  },
};

export const getResonanceDramaturgy = (portal) => ({
  ...(RESONANCE_DRAMATURGY_BY_PORTAL[portal] ?? RESONANCE_DRAMATURGY_BY_PORTAL.obra),
  ...RESONANCE_SHARED_DRAMATURGY,
});
