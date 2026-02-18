
export const IMPACT_COPY = {
  heading:
    'Cada huella que se activa mantiene viva la obra y sostiene acompañamiento real a través de Isabel Ayuda para la Vida, A.C. El arte impulsa la vida — y la vida devuelve su energía al arte.',
  labels: {
    subs: 'Huella activa',
    sessions: (total, perSub = 6) => `${total * perSub} sesiones (1 huella = ${perSub} sesiones)`,
    residencies: 'Residencias creativas',
    schools: 'Escuelas con app activa',
  },
  hints: {
    subs: 'Conteo en tiempo real de huellas activas en la plataforma.',
    sessions:
      'Cada huella activa hasta 6 sesiones de acompañamiento emocional sin costo para jóvenes en riesgo.',
    residencies: (missing, chunk = 17) =>
      missing === 0
        ? `¡Meta alcanzada! Se abre una nueva residencia (≈ ${chunk} huellas por residencia).`
        : `Faltan ${missing} huellas para abrir la siguiente residencia (≈ ${chunk}/huella).`,
    schools: (missing, chunk = 75) =>
      missing === 0
        ? `¡Meta alcanzada! Se activa la app social en una nueva escuela (≈ ${chunk} huellas por escuela).`
        : `Faltan ${missing} huellas para la próxima escuela (≈ ${chunk}/huella).`,
  },
  
  footnote:
    'Cuando el acompañamiento florece, los excedentes se reinvierten en nuevas obras, juegos y experiencias dentro del universo #GatoEncerrado. Así, el ciclo entre arte y vida nunca se detiene.',
  cta: 'Quiero aportar con mi huella',
  notify: {
    label: 'Quiero recibir noticias sobre el impacto y las nuevas obras',
    hint: 'Inicia sesión para activar el seguimiento',
  },
  
  error:
    'No pudimos cargar el impacto en este momento. Tu huella igual cuenta — intenta de nuevo en unos instantes.',
};

