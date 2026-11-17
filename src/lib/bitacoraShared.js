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
  try { localStorage.removeItem('gatoencerrado:bitacora:canal'); } catch {}
  try { localStorage.removeItem('gatoencerrado:bitacora:aviso-pendiente'); } catch {}
};

// Fase 2 del regreso (3 nov 2026). Por dónde pidió el aviso (correo o whatsapp):
// la fila de la cabina lo dice en su estado completado, en cualquier forma.
const GLOBAL_CONSENT_CANAL_KEY = 'gatoencerrado:bitacora:canal';
export const readGlobalConsentCanal = () => {
  try { return localStorage.getItem(GLOBAL_CONSENT_CANAL_KEY) || null; } catch { return null; }
};
export const writeGlobalConsentCanal = (canal) => {
  try { localStorage.setItem(GLOBAL_CONSENT_CANAL_KEY, canal); } catch {}
};

// «Con mi correo» puede pedir iniciar sesión primero. Si la sesión llega por
// Google o Apple la página recarga, así que la intención se guarda aquí y se
// consume en cuanto vuelve a haber usuario.
const PENDING_AVISO_KEY = 'gatoencerrado:bitacora:aviso-pendiente';
export const readPendingAvisoCanal = () => {
  try { return localStorage.getItem(PENDING_AVISO_KEY) || null; } catch { return null; }
};
export const writePendingAvisoCanal = (canal) => {
  try { localStorage.setItem(PENDING_AVISO_KEY, canal); } catch {}
};
export const clearPendingAvisoCanal = () => {
  try { localStorage.removeItem(PENDING_AVISO_KEY); } catch {}
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

// ── El momento de una forma, con las palabras de la línea de la Memoria ──
// (Carlos, 17 nov 2026.) El botón de la vitrina decía «Entra en escena» durante
// la espera y con todo terminado, cuando la persona ya había entrado; el del
// recuadro «Lo que deja la duda» decía «Sigue donde quedaste →» en los tres
// momentos. Ahora los dos dicen el momento, con la palabra que la línea ya le
// da: esperando, «Entre bambalinas»; con la pregunta de vuelta, «Termina la
// escena» (Carlos, 15 nov 2026: «cuidar el arco narrativo de las vitrinas»);
// con todo terminado, «Tu memoria».
export const momentoDeLaForma = (portal) => {
  if (!portal) return null;
  const progreso = readResonanceProgress(portal);
  if (!progreso.l1Done) return null;
  if (progreso.bitacoraDone) return 'memoria';
  const regreso = progreso.record.bitacora_available_at;
  if (regreso && new Date(regreso).getTime() <= Date.now()) return 'regreso';
  return progreso.l3Done ? 'espera' : null;
};
export const ROTULO_DEL_MOMENTO = {
  espera: 'Entre bambalinas',
  regreso: 'Termina la escena',
  memoria: 'Tu memoria',
};

// Un dato suelto en el registro local de la forma, sin tocar lo demás.
export const patchResonanceRecord = (portal, patch) => {
  try {
    localStorage.setItem(
      `gatoencerrado:resonance:${portal}`,
      JSON.stringify({ ...readResonanceRecord(portal), ...patch }),
    );
  } catch { /* sin almacenamiento */ }
};
