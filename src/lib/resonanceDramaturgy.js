export const RESONANCE_SHARED_DRAMATURGY = {
  // D-42 (11 sep 2026): el clímax de la forma no está aquí, está en la
  // respuesta a los tres días. En el foco es el detonante: el autor entra a
  // cuadro y ya no hay vuelta atrás.
  phase3Eyebrow: 'El detonante',
  phase3Title: 'En el foco',
  appearanceCue: 'Antes del intermedio, el autor entra a cuadro.',
  phase3Description: 'Este recorrido ha concluido. Las respuestas registradas permiten estudiar cómo las experiencias narrativas son interpretadas, recordadas y resignificadas por distintas personas.',
  returnLead: 'Esto no termina aquí.',
  // "Llamado" convertía al protagonista en aspirante: las llamadas de teatro son
  // previas a la función (ahí está la Tercera llamada), y una después del clímax
  // se lee como casting. Contradecía además la regla canónica del regreso
  // diferido: la agencia es de lo que vuelve, no del usuario. El resto del copy
  // ya lo tenía bien — "una nueva pregunta volverá a buscarte" (Carlos, 10 sep 2026).
  // Encabeza las tres filas del stack, así que habla de las tres continuidades
  // —la pregunta que vuelve, la imagen que se lleva, el recorrido que sigue— y
  // no sólo del aviso por WhatsApp, como cuando era la tarjeta de un solo CTA
  // (Carlos, 18 sep 2026).
  returnBody: 'Dentro de unos días, una nueva pregunta volverá a buscarte. Puedes dejar que te encuentre, llevarte una imagen de lo que ocurrió aquí, y guardar tu recorrido para seguir en otra forma.',
  returnCta: 'Quiero que la pregunta vuelva →',
  // El aviso ya concedido no desaparece: se queda con el mismo gesto de
  // confirmación que el recuerdo entregado (Carlos, 18 sep 2026).
  returnDone: 'La pregunta volverá',
  returnDoneHint: 'Te buscará por WhatsApp cuando llegue el momento.',
  returnBackNow: 'La pregunta ya volvió',
  returnBackNowHint: 'Puedes entrar a escena.',
  souvenirCta: 'Prefiero llevarme un recuerdo',
  entranceCoda: 'Ya forma parte de tu obra.',
  // Línea de la retención. "Pausa" detenía; la retención sostiene.
  // Placeholder aprobado por Carlos (11 sep 2026), no copy final.
  closingLine: 'La obra sigue en ti.',
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
    // Modo gesto (Carlos, 11 oct 2026): sustituye a «Ya forma parte de tu obra».
    // Sin número y en futuro: la convocatoria ocurre al abrir el Marcador y el
    // modelo elige de tres a cinco párrafos.
    entranceDesc: 'Lo que escribiste va a convocar unos párrafos de una historia. Uno de ellos va a ser tuyo por un momento.',
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

// El emblema redondo de cada forma, el mismo del libreto holográfico. Sustituye
// a la moneda que giraba bajo «Habitar la forma»: el GAToken dejó de ser moneda
// (22 sep 2026) y la moneda como botón de entrada volvía a leerse como rally
// (Carlos, 11 oct 2026). Late, no gira.
const MERCH_BASE = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch';
export const PORTAL_EMBLEM_URL = {
  obra:        `${MERCH_BASE}/la_obra.png`,
  literatura:  `${MERCH_BASE}/literatura.png`,
  artesanias:  `${MERCH_BASE}/la_taza.png`,
  grafico:     `${MERCH_BASE}/los_graficos.png`,
  cine:        `${MERCH_BASE}/cortos.png`,
  sonoridades: `${MERCH_BASE}/sonoridades.png`,
  movimiento:  `${MERCH_BASE}/lasdiosas.png`,
  juegos:      `${MERCH_BASE}/juegos.png`,
  oraculo:     `${MERCH_BASE}/el_oraculo.png`,
};

// La costura entre el sitio y el dispositivo (Carlos, 11 oct 2026): la última
// frase que la persona lee en el sitio, en pasado, es la primera que ve en el
// dispositivo. Sale de la misma plantilla que la tarjeta; el dispositivo no
// tiene copia propia. Por ahora solo La escritura tiene modo gesto.
export const buildEscenaFrase = (portal, option) => {
  const o = typeof option === 'string' ? option.trim().replace(/[.!?]+$/, '') : '';
  if (!o) return null;
  const templates = {
    literatura: `Abriste la historia esperando encontrar ${o}.`,
  };
  return templates[portal] ?? null;
};

export const getResonanceDramaturgy = (portal) => ({
  ...(RESONANCE_DRAMATURGY_BY_PORTAL[portal] ?? RESONANCE_DRAMATURGY_BY_PORTAL.obra),
  ...RESONANCE_SHARED_DRAMATURGY,
});
