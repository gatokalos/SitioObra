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
  { key: 'cine',        name: 'Cine',          form: 'La proyección',  eyebrow: 'CINE · AUDIOVISUAL',        showcase: 'copycats',            color: 'text-rose-300',    q: '¿Qué significa para ti verte fallar desde afuera?',                      cta: 'Sigue el cine' },
  { key: 'sonoridades', name: 'Sonoridades',   form: 'La vibración',   eyebrow: 'MÚSICA · PAISAJE SONORO',   showcase: 'miniversoSonoro',     color: 'text-sky-300',     q: '¿Por qué algunos sonidos duran más que las imágenes?',                  cta: 'Sigue las sonoridades' },
  { key: 'movimiento',  name: 'Movimiento',    form: 'El cuerpo',      eyebrow: 'DANZA · MOVIMIENTO',        showcase: 'miniversoMovimiento', color: 'text-cyan-300',    q: '¿Qué cosas sabe tu cuerpo antes que tu pensamiento?',                   cta: 'Sigue el movimiento' },
  { key: 'juegos',      name: 'Juegos',        form: 'El riesgo',      eyebrow: 'JUEGO · NARRATIVA',         showcase: 'apps',                color: 'text-yellow-300',  q: '¿Qué cambia en ti cuando una historia depende de las decisiones de otros?',      cta: 'Sigue el riesgo' },
  { key: 'oraculo',     name: 'Oráculo',       form: 'La pregunta',    eyebrow: 'ORÁCULO · DIVINACIÓN',      showcase: 'oraculo',             color: 'text-indigo-300',  q: '¿Cuándo una experiencia deja de sentirse individual?',                   cta: 'Sigue el oráculo' },
];

const GLOBAL_CONSENT_KEY = 'gatoencerrado:bitacora:consented';

export const readGlobalConsent = () => {
  try { return !!JSON.parse(localStorage.getItem(GLOBAL_CONSENT_KEY)); } catch { return false; }
};

export const writeGlobalConsent = () => {
  try { localStorage.setItem(GLOBAL_CONSENT_KEY, 'true'); } catch {}
};
