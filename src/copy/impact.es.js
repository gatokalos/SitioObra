// src/copy/impact.es.js
export const IMPACT_COPY = {
  heading: 'Cada suscripción abre un umbral: sostiene el universo y activa impacto real en la causa social.',
  labels: {
    subs: 'Suscriptores activos',
    sessions: (total, perSub=6) => `${total*perSub} sesiones (1 suscripción = ${perSub} sesiones)`,
    residencies: 'Residencias creativas',
    schools: 'Escuelas con app activa',
  },
  hints: {
    subs: 'Conteo en tiempo real de suscripciones activas en la plataforma.',
    sessions: 'Isabel Ayuda para la Vida, A.C. no cobra al usuario por sesión; se asignan sin costo cuando se detecta riesgo.',
    residencies: (missing, chunk=17) =>
      missing === 0
        ? `¡Meta alcanzada! Se abre una nueva residencia (≈ ${chunk} suscripciones por residencia).`
        : `Faltan ${missing} suscripciones para abrir la siguiente residencia (≈ ${chunk}/sub).`,
    schools: (missing, chunk=75) =>
      missing === 0
        ? `¡Meta alcanzada! Se activa la app en una nueva escuela (≈ ${chunk} suscripciones por escuela).`
        : `Faltan ${missing} suscripciones para la próxima escuela (≈ ${chunk}/sub).`,
  },
  footnote:
    'Isabel Ayuda para la Vida, A.C. no cobra al usuario por sesión. Las sesiones se asignan sin costo para las familias cuando se detecta riesgo, gracias a suscripciones, aportes simbólicos y apoyos institucionales.',
  cta: 'Quiero suscribirme',
  error: 'No pudimos cargar el impacto en este momento. Tu suscripción igual cuenta — intenta de nuevo en unos instantes.',
};