// Datos y utilidades compartidas entre ResonanceModal, CuadernoHolografico y
// Header (atajo del tooltip de GAT) — separado en un módulo ligero, sin
// dependencias de React/framer-motion, para que importarlo desde Header.jsx
// (que carga en cada página) no arrastre esos componentes pesados al bundle
// principal y rompa su code-splitting.

export const CATALOG = [
  { key: 'obra',        name: 'Obra Escénica', form: 'El drama',       eyebrow: 'TEATRO · DRAMATURGIA',      showcase: 'miniversos',          color: 'text-purple-300',  q: '¿Qué significa para ti habitar una emoción delante de otros?',          cta: 'Sigue la obra' },
  { key: 'literatura',  name: 'Literatura',    form: 'La escritura',   eyebrow: 'NOVELA · AUTOFICCIÓN',      showcase: 'miniversoNovela',     color: 'text-emerald-300', q: '¿Qué cambia en ti cuando una experiencia personal se convierte en relato?', cta: 'Sigue la literatura' },
  { key: 'artesanias',  name: 'Artesanías',    form: 'El objeto',      eyebrow: 'OFICIO · ARTESANÍA',        showcase: 'lataza',              color: 'text-amber-300',   q: '¿Cuándo un objeto deja de ser para ti solo un objeto?',                  cta: 'Sigue las artesanías' },
  { key: 'grafico',     name: 'Gráficos',      form: 'La imagen',      eyebrow: 'CÓMIC · ILUSTRACIÓN',       showcase: 'miniversoGrafico',    color: 'text-fuchsia-300', q: '¿Qué te ocurre cuando alguien más interpreta tu apariencia?',            cta: 'Sigue los gráficos' },
  { key: 'cine',        name: 'Cine',          form: 'La proyección',  eyebrow: 'CINE · AUDIOVISUAL',        showcase: 'copycats',            color: 'text-rose-300',    q: '¿Qué descubres de ti al verte fallar desde afuera?',                      cta: 'Sigue el cine' },
  { key: 'sonoridades', name: 'Sonoridades',   form: 'La vibración',   eyebrow: 'MÚSICA · PAISAJE SONORO',   showcase: 'miniversoSonoro',     color: 'text-sky-300',     q: '¿Qué sigue sonando en ti cuando ya no queda nada que mirar?',                  cta: 'Sigue las sonoridades' },
  { key: 'movimiento',  name: 'Movimiento',    form: 'El cuerpo',      eyebrow: 'DANZA · MOVIMIENTO',        showcase: 'miniversoMovimiento', color: 'text-cyan-300',    q: '¿Qué sabe tu cuerpo antes de que el pensamiento alcance a nombrarlo?',                   cta: 'Sigue el movimiento' },
  { key: 'juegos',      name: 'Juegos',        form: 'El riesgo',      eyebrow: 'JUEGO · NARRATIVA',         showcase: 'apps',                color: 'text-yellow-300',  q: '¿Qué cambia en ti cuando una decisión tuya cambia el rumbo de una historia?',      cta: 'Sigue el riesgo' },
  { key: 'oraculo',     name: 'Oráculo',       form: 'La pregunta',    eyebrow: 'ORÁCULO · DIVINACIÓN',      showcase: 'oraculo',             color: 'text-indigo-300',  q: '¿Cuándo reconoces en otros una experiencia que creías solo tuya?',                   cta: 'Sigue el oráculo' },
];

const GLOBAL_CONSENT_KEY = 'gatoencerrado:bitacora:consented';

export const readGlobalConsent = () => {
  try { return !!JSON.parse(localStorage.getItem(GLOBAL_CONSENT_KEY)); } catch { return false; }
};

export const writeGlobalConsent = () => {
  try { localStorage.setItem(GLOBAL_CONSENT_KEY, 'true'); } catch {}
};

export const clearGlobalConsent = () => {
  try { localStorage.removeItem(GLOBAL_CONSENT_KEY); } catch {}
};

export const readResonanceRecord = (portal) => {
  try {
    return JSON.parse(localStorage.getItem(`gatoencerrado:resonance:${portal}`)) ?? {};
  } catch {
    return {};
  }
};

// Bitácora → L3 → L2 → L1 es una escalera estricta en el flujo real: no se
// llega a una etapa sin haber pasado por las anteriores. Antes cada pantalla
// (Transmedia.jsx, los 9 Portal*.jsx, CuadernoHolografico.jsx, ResonanceModal.jsx)
// leía su propio campo del registro por separado (l1, l2_option,
// l3_recommendation, bitacora_completed) sin esa garantía — así que un
// registro real con bitacora_completed=true pero l1 vacío/perdido mostraba
// "sin empezar" en una pantalla y "terminado" en otra para el mismo
// miniverso. Esta función es la única fuente de "¿en qué etapa va?": una
// etapa avanzada siempre implica las anteriores, sin importar qué campo
// puntual falte en el registro (Carlos, 2026-08-26).
export const readResonanceProgress = (portal) => {
  const record = readResonanceRecord(portal);
  const bitacoraDone = !!record.bitacora_completed;
  const l3Done = bitacoraDone || !!record.l3_recommendation?.step3;
  // l2_option (modo de opción rápida) y l2_conv_done (modo conversacional) son
  // dos formas distintas de completar L2 — cualquiera de las dos cuenta.
  const l2Done = l3Done || !!record.l2_option || !!record.l2_conv_done;
  const l1Done = l2Done || !!record.l1;
  return {
    record,
    l1Done,
    l2Done,
    l2Answer: record.l2_option ?? null,
    l3Done,
    l3Recommendation: record.l3_recommendation ?? null,
    l3Step3: record.l3_recommendation?.step3 ?? null,
    l3RecommendedPortal: record.l3_recommendation?.recommended_portal ?? null,
    l3RecommendedForma: record.l3_recommendation?.forma ?? null,
    bitacoraDone,
    experienceDone: !!record.experience_ts,
  };
};
