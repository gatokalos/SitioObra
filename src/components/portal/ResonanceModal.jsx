import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CuadernoHolografico from './CuadernoHolografico';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronDown, Download, Eye, FastForward, Flame, Lock, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { writePendingContinuation } from '@/lib/pendingContinuation';
import { createMiniverseSouvenirBlob, downloadBlob } from '@/lib/miniverseSouvenirCard';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { clearGlobalConsent, readGlobalConsent, writeGlobalConsent, readResonanceProgress } from '@/lib/bitacoraShared';
import FarewellVideoPanel from './FarewellVideoPanel';
import { RESONANCE_FAREWELL_VIDEO_ENABLED } from '@/components/transmedia/transmediaConstants';
import { readIntermedioVistoAt } from '@/lib/intermedio';
import { getResonanceDramaturgy } from '@/lib/resonanceDramaturgy';

export { readGlobalConsent, writeGlobalConsent };

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const CAT_CABINA_URL = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-cabina.webp';
// El plazo de la bitácora (72 h) vive sólo en el backend (routes/bitacora.js) y
// llega como `available_at` en la respuesta de /consent. Aquí no se calcula.

/* ─── Identidad visual por portal ─────────────────────────────────────── */

const PORTAL_GRADIENT = {
  obra:        'from-purple-400 via-fuchsia-500 to-rose-500',
  literatura:  'from-emerald-400 via-teal-500 to-cyan-500',
  artesanias:  'from-amber-400 via-orange-500 to-rose-500',
  grafico:     'from-fuchsia-400 via-purple-500 to-indigo-500',
  cine:        'from-rose-500 via-red-500 to-fuchsia-500',
  sonoridades: 'from-sky-400 via-cyan-500 to-indigo-500',
  movimiento:  'from-sky-400 via-emerald-500 to-cyan-500',
  juegos:      'from-amber-400 via-yellow-500 to-orange-500',
  oraculo:     'from-indigo-400 via-violet-500 to-purple-500',
};

const MERCH_BASE = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch';

const PORTAL_ICON_URL = {
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

// formatId (miniversePortalRegistry.js) -> clave corta de este archivo. No son
// intercambiables: Teatro es formatId 'miniversos' pero clave 'obra' (su ruta
// es /portal-voz), y Gráficos es 'miniversoGrafico' pero clave 'grafico', sin
// la "s" de su ruta /portal-graficos. Los otros siete sí coinciden con el
// segmento final de su ruta.
const FORMAT_ID_TO_PORTAL = {
  miniversos: 'obra',
  miniversoNovela: 'literatura',
  lataza: 'artesanias',
  copycats: 'cine',
  miniversoGrafico: 'grafico',
  miniversoSonoro: 'sonoridades',
  miniversoMovimiento: 'movimiento',
  apps: 'juegos',
  oraculo: 'oraculo',
};

const BASE = `${MERCH_BASE}/posters`;
const PORTAL_POSTER = {
  obra:        `${BASE}/poster_obra.png`,
  artesanias:  `${BASE}/poster_artesanias.png`,
  literatura:  `${BASE}/poster_literatura.png`,
  grafico:     `${BASE}/poster_graficos.png`,
  cine:        `${BASE}/cine.png`,
  sonoridades: `${BASE}/poster_sonoridades.png`,
  movimiento:  `${BASE}/poster_movimiento.png`,
  juegos:      `${BASE}/poster_juegos.png`,
  oraculo:     `${BASE}/poster_oraculo.png`,
};

const PORTAL_BLOOM = {
  obra:        ['rgba(192,132,252,0.65)', 'rgba(244,114,182,0.4)'],
  literatura:  ['rgba(52,211,153,0.65)',  'rgba(34,211,238,0.4)'],
  artesanias:  ['rgba(251,191,36,0.65)',  'rgba(244,114,182,0.4)'],
  grafico:     ['rgba(232,121,249,0.65)', 'rgba(99,102,241,0.4)'],
  cine:        ['rgba(244,63,94,0.65)',   'rgba(232,121,249,0.4)'],
  sonoridades: ['rgba(56,189,248,0.65)',  'rgba(99,102,241,0.4)'],
  movimiento:  ['rgba(56,189,248,0.65)',  'rgba(52,211,153,0.4)'],
  juegos:      ['rgba(251,191,36,0.65)',  'rgba(249,115,22,0.4)'],
  oraculo:     ['rgba(129,140,248,0.65)', 'rgba(168,85,247,0.4)'],
};

/* ─── Preguntas de Nivel 2 por portal ─────────────────────────────────── */

export const LEVEL2_QUESTIONS = {
  obra: {
    question: '¿Qué esperas encontrar cuando alguien se expone frente a otros?',
    preview: 'Antes de entrar en escena, ubica hacia quién diriges lo que estás por decir. Esa referencia nos ayudará a comprender desde dónde miras lo que viene.',
    options: [
      'verdad',
      'incomodidad',
      'consuelo',
      'preguntas',
      'algo roto',
      'tal vez nada',
    ],
  },
  literatura: {
    question: '¿Qué esperas encontrar cuando una historia se abre contigo?',
    preview: 'Antes de abrir la historia, reconoce qué esperas encontrar en ella. Esa expectativa será el punto desde el que comenzarás a leer.',
    options: [
      'una herida conocida',
      'una pregunta incómoda',
      'una forma de compañía',
      'algo que no sabía nombrar',
      'otra forma de mirar',
      'tal vez nada',
    ],
  },
  artesanias: {
    question: '¿Qué cosas te cuesta dejar ir aunque ya no tengan utilidad?',
    preview: 'Antes de acercarte a lo que alguien conserva, reconoce qué objetos siguen teniendo un lugar en ti aunque su utilidad haya terminado.',
    options: [
      'cartas o papeles',
      'ropa',
      'objetos hechos por alguien',
      'recuerdos pequeños',
      'cosas que me acompañaron mucho tiempo',
      'no suelo guardar cosas',
    ],
  },
  grafico: {
    question: '¿Qué imágenes sientes que te observan cuando vuelves a estar a solas?',
    preview: 'Antes de mirar de frente, reconoce qué clase de imagen suele quedarse observándote cuando todo lo demás se retira.',
    options: [
      'una mirada',
      'una escena extraña',
      'imágenes incompletas',
      'algo demasiado íntimo',
      'un detalle difícil de explicar',
      'no me suele pasar',
    ],
  },
  cine: {
    question: '¿Qué tipo de momentos te cuesta mirar de frente en una historia?',
    preview: 'Antes de que comience la escena, reconoce qué momentos suelen hacerte apartar la mirada. Esa será tu posición frente a lo que viene.',
    options: [
      'la vulnerabilidad',
      'la soledad',
      'los conflictos familiares',
      'alguien perdiéndose a sí mismo',
      'algo demasiado parecido a mi vida',
      'nada en particular',
    ],
  },
  sonoridades: {
    question: '¿Qué sonidos sientes que regresan cuando estás solo?',
    preview: 'Antes de escuchar, reconoce qué sonidos regresan cuando el ruido se apaga. Esa memoria afinará tu manera de entrar.',
    options: [
      'una voz conocida',
      'algo que escuché hace mucho',
      'silencio',
      'ruido cotidiano',
      'una frase',
      'no lo sé',
    ],
  },
  movimiento: {
    question: '¿Qué hace tu cuerpo cuando aún no entiendes lo que sientes?',
    preview: 'Antes de moverte, observa qué hace tu cuerpo cuando todavía no encuentras palabras. Esa reacción también es una forma de mirar.',
    options: [
      'se inmoviliza',
      'se acelera',
      'cambia la respiración',
      'busca salir de ahí',
      'se queda observando',
      'nunca me lo había preguntado',
    ],
  },
  juegos: {
    question: 'Cuando una experiencia te obliga a elegir, ¿qué sueles hacer primero?',
    preview: 'Antes de elegir, reconoce cuál suele ser tu primer impulso. Esa decisión inicial será la coordenada de tu recorrido.',
    options: [
      'seguir mi intuición',
      'evitar equivocarme',
      'explorar todo antes',
      'elegir rápido',
      'regresar sobre mis pasos',
      'no suelo pensar demasiado en eso',
    ],
  },
  oraculo: {
    question: '¿Qué haces cuando una pregunta sigue contigo más tiempo del esperado?',
    preview: 'Antes de formular otra pregunta, reconoce qué haces con aquellas que se quedan contigo. Esa disposición orientará la consulta.',
    options: [
      'darle vueltas en silencio',
      'escribirla',
      'evitarla',
      'hablarla con alguien',
      'convertirla en otra cosa',
      'dejarla pasar',
    ],
  },
};

/* ─── Acknowledgment por portal (tras responder Nivel 1) ─────────────── */

export const buildL1Acknowledgment = (portal, answer) => {
  if (!answer) return null;
  const a = answer.trim().replace(/[.!?]+$/, '');
  const objectAnswer = a
    .replace(/^lo extraño$/i, 'lo extrañas')
    .replace(/^la extraño$/i, 'la extrañas')
    .replace(/^los extraño$/i, 'los extrañas')
    .replace(/^las extraño$/i, 'las extrañas');
  const templates = {
    obra:        `Para ti, exponerse frente a otros empieza por ${a}.`,
    literatura:  `Una historia deja de ser ajena cuando te devuelve ${a}.`,
    artesanias:  `Un objeto deja de ser para ti solo un objeto cuando ${objectAnswer}.`,
    grafico:     `Una imagen deja de ser superficie cuando en ella reconoces ${a}.`,
    cine:        `Mirar una historia de frente también significa encontrarte con ${a}.`,
    sonoridades: `Un sonido permanece cuando vuelve a ti como ${a}.`,
    movimiento:  `Tu cuerpo empieza a responder antes que las palabras cuando ${a}.`,
    juegos:      `Una decisión cambia la historia cuando tu primer impulso es ${a}.`,
    oraculo:     `Una pregunta permanece contigo cuando decides ${a}.`,
  };
  return templates[portal] ?? null;
};

const ARTESANIAS_L2_ACKNOWLEDGMENTS = {
  'cartas o papeles': 'Las cartas y los papeles son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  ropa: 'La ropa es lo que más te cuesta dejar ir, aunque ya no tenga utilidad.',
  'objetos hechos por alguien': 'Los objetos hechos por alguien son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'recuerdos pequeños': 'Los recuerdos pequeños son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'cosas que me acompañaron mucho tiempo': 'Las cosas que te acompañaron durante mucho tiempo son lo que más te cuesta dejar ir, aunque ya no tengan utilidad.',
  'no suelo guardar cosas': 'Cuando algo pierde su utilidad, no sueles necesitar conservarlo.',
};

export const buildL2Acknowledgment = (portal, option) => {
  if (!option) return null;
  if (portal === 'artesanias') {
    return ARTESANIAS_L2_ACKNOWLEDGMENTS[option]
      ?? `Eso que reconoces en ${option} todavía ocupa un lugar en ti, aunque su utilidad haya terminado.`;
  }
  const o = option.trim().replace(/[.!?]+$/, '');
  const templates = {
    obra:        `Antes de entrar en escena, tu mirada busca ${o}.`,
    literatura:  `Abres la historia esperando encontrar ${o}.`,
    grafico:     `Cuando vuelves a estar a solas, lo que permanece ante tu mirada es ${o}.`,
    cine:        `En una historia, apartas la mirada cuando aparece ${o}.`,
    sonoridades: `Cuando el ruido se apaga, vuelve contigo ${o}.`,
    movimiento:  `Cuando aún no entiendes lo que sientes, tu cuerpo ${o}.`,
    juegos:      `Cuando una experiencia te obliga a elegir, primero decides ${o}.`,
    oraculo:     `Cuando una pregunta permanece contigo, eliges ${o}.`,
  };
  return templates[portal] ?? `Tu mirada se afina hacia ${o} antes de habitar la forma.`;
};

const persistBaseline = async (payload) => {
  const response = await fetch(`${OBRA_API_URL}/api/resonance/baseline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`baseline ${response.status}`);
  return response.json();
};

/* ─── Estructura de niveles ───────────────────────────────────────────── */

const LEVELS = [
  {
    num: 1,
    eyebrow: 'Antes de entrar',
    title: 'Primera intuición',
    desc: '✓ Respondiste antes de saber algo más. Eso tiene valor científico.',
    icon: Eye,
  },
  {
    num: 2,
    eyebrow: 'Calibración',
    title: 'Afina tu mirada',
    desc: 'Tu intuición y expectativas ya están ancladas. Lo que el artefacto despierte después de esto es oro puro.',
    icon: Flame,
  },
  {
    num: 3,
    eyebrow: 'Días después',
    title: 'En el foco',
    pendingDesc: 'La obra continúa fuera de escena. Vuelve en unos días para reconocer qué siguió resonando en ti.',
    icon: Sparkles,
  },
];

/* ─── localStorage helpers ────────────────────────────────────────────── */

// Cascada del clímax (Carlos, bloque 6 del recorrido comentado): cuando el
// video del autor termina, el resto del stack entra escalonado en vez de
// aparecer de golpe. El orden lo fija `custom`.
const PIEZA_DE_CASCADA = {
  oculto: { opacity: 0, y: 14 },
  visible: (orden = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: 0.12 + orden * 0.16 },
  }),
};

const lsKey = (portal) => `gatoencerrado:resonance:${portal}`;


const lsRead = (portal) => {
  try { return JSON.parse(localStorage.getItem(lsKey(portal))) ?? {}; }
  catch { return {}; }
};

const lsPatch = (portal, patch) => {
  try {
    localStorage.setItem(lsKey(portal), JSON.stringify({ ...lsRead(portal), ...patch }));
  } catch {}
};

/* ─── Componente ──────────────────────────────────────────────────────── */

const ResonanceModal = ({ open, onClose, question, portal, onOpenNarrative, onNavigateToRecommendation, onL2QuestionReady, isMobileViewport, onRequireLogin, startInHolografico = false, startInBitacora = false, bitacoraVentana = null }) => {
  const modalRef = useRef(null);
  const submitBtnRef = useRef(null);
  const { user, isDevAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ nombre: '', email: '', respuesta: '' });
  const [submitting, setSubmitting] = useState(false);
  // Consentimiento de investigación — Texto 1 de la ficha (§4): único punto
  // donde debe ser explícito en el tramo anónimo, porque es antes de que se
  // registre nada. Gatea el envío de la pregunta semilla.
  const [researchConsent, setResearchConsent] = useState(false);
  // Anónimo por defecto (20 sep 2026, pendiente 10). El nombre se pedía
  // obligatorio al lado de un aviso que promete anonimato: las dos cosas no
  // podían ser ciertas. Firmar pasa a ser un acto de quien quiere firmar.
  const [firmando, setFirmando] = useState(false);
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();

  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const bloom    = PORTAL_BLOOM[portal]    ?? PORTAL_BLOOM.obra;
  const poster   = PORTAL_POSTER[portal]   ?? PORTAL_POSTER.obra;
  const l2q      = LEVEL2_QUESTIONS[portal] ?? null;
  const dramaturgy = getResonanceDramaturgy(portal);
  const dashboardLevels = LEVELS.map((level) => {
    if (level.num === 2) {
      return { ...level, eyebrow: dramaturgy.phase2Eyebrow, title: dramaturgy.phase2Title };
    }
    if (level.num === 3) {
      return { ...level, eyebrow: dramaturgy.phase3Eyebrow, title: dramaturgy.phase3Title };
    }
    return level;
  });

  // Persistent state — lazy-init desde localStorage; si no hay, se verifica contra Supabase
  // readResonanceProgress (no lsRead crudo) para l1Done/l1ChipDone/checking/l3Step:
  // Bitácora → L3 → L2 → L1 es una escalera estricta, así que un registro con
  // bitacora_completed=true pero l1 vacío/perdido no debe mostrar el formulario
  // de L1 como si nada se hubiera contestado (Carlos, 2026-08-26).
  const [l1Done, setL1Done] = useState(() => readResonanceProgress(portal).l1Done);
  const [l1Acknowledgment, setL1Acknowledgment] = useState(() => {
    const saved = lsRead(portal);
    return saved.l1_acknowledgment ?? buildL1Acknowledgment(portal, saved.l1_answer);
  });
  // Chip de expectativa — se movió al pre-estímulo (H-LIT-2): se contesta en L1,
  // inmediatamente después del eco de la intuición y antes de abrir el artefacto.
  const [l2Selection, setL2Selection] = useState(() => lsRead(portal).l2_option ?? null);
  const [l2Acknowledgment, setL2Acknowledgment] = useState(() => {
    const saved = lsRead(portal);
    return saved.l2_acknowledgment ?? buildL2Acknowledgment(portal, saved.l2_option);
  });
  const [l1ChipDone, setL1ChipDone] = useState(() => readResonanceProgress(portal).l2Done);
  const [l2Submitting, setL2Submitting] = useState(false);
  const [dashboardActiveLevel, setDashboardActiveLevel] = useState(() => {
    const s = lsRead(portal);
    return [1, 2, 3].includes(s.dashboard_active_level) ? s.dashboard_active_level : 1;
  });
  // La fase activa ocupa siempre la primera posición, como en el prototipo
  // aprobado. Las demás conservan su orden canónico debajo.
  const orderedDashboardLevels = [...dashboardLevels].sort((a, b) => {
    if (a.num === dashboardActiveLevel) return -1;
    if (b.num === dashboardActiveLevel) return 1;
    return a.num - b.num;
  });
  const [calibrationQuestionOpen, setCalibrationQuestionOpen] = useState(() => {
    const s = lsRead(portal);
    return !!s.l2_calibration_open && !s.l2_narrative_opened;
  });
  const [checking, setChecking] = useState(() => !isDevAuth && !readResonanceProgress(portal).l1Done);

  // Nivel 2 — conversación post-experiencia
  const [l2NarrativeOpened, setL2NarrativeOpened] = useState(() => !!lsRead(portal).l2_narrative_opened);
  const [l2ConvDone, setL2ConvDone] = useState(() => !!lsRead(portal).l2_conv_done);
  const [convQuestion, setConvQuestion] = useState(() => lsRead(portal).l2_current_question ?? null);
  const [convTurn, setConvTurn] = useState(() => lsRead(portal).l2_current_turn ?? 0);
  const [convAnswer, setConvAnswer] = useState('');
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState(() => !!lsRead(portal).l2_conv_error);

  // Nivel 3 — recomendación del siguiente miniverso
  const [l3Loading, setL3Loading]       = useState(false);
  const [l3Rec, setL3Rec]               = useState(() => lsRead(portal).l3_recommendation ?? null);
  const [isSouvenirGenerating, setIsSouvenirGenerating] = useState(false);
  const [souvenirDeliveredAt, setSouvenirDeliveredAt] = useState(() => lsRead(portal).souvenir_delivered_at ?? null);

  // Bitácora individual — seguimiento diferido
  const { autoSubscribeIfPWA } = usePushSubscription();
  const [bitacoraConsented, setBitacoraConsented]     = useState(() => !!lsRead(portal).bitacora_consented || readGlobalConsent());
  const [bitacoraAvailableAt, setBitacoraAvailableAt] = useState(() => lsRead(portal).bitacora_available_at ?? null);
  const [bitacoraAvailabilityTick, setBitacoraAvailabilityTick] = useState(() => Date.now());
  const [bitacoraCompleted, setBitacoraCompleted]     = useState(() => !!lsRead(portal).bitacora_completed);
  const [showPhoneInput, setShowPhoneInput]           = useState(false);
  // Video corto de despedida — panel embebido (no pantalla completa) que
  // aparece en cuanto el recorrido se da por concluido, sin depender de si
  // dio o no su WhatsApp (Carlos, 2026-08-27: debe verse "aceptado o
  // declinado" por igual). L1/L2/L3 de este miniverso ya se contestaron sin
  // haberlo visto, así que no contamina la intuición de Fase 1. Ver
  // RESONANCE_FAREWELL_VIDEO_ENABLED en transmediaConstants.jsx.
  const [farewellVideoSeen, setFarewellVideoSeen]     = useState(() => !!lsRead(portal).farewell_video_seen);
  // El stack del clímax espera al video sólo cuando hay video que esperar. Con
  // la bandera apagada —producción, hasta que existan las nueve piezas— todo
  // se muestra como siempre, sin animación ni scroll.
  const stackClimaxRef = useRef(null);
  const revelarStack = !RESONANCE_FAREWELL_VIDEO_ENABLED || farewellVideoSeen;
  // Sólo hay cascada si el stack apareció DESPUÉS del video. Quien vuelve a
  // abrir la vitrina con el video ya visto lo encuentra puesto, sin repetirla.
  const [huboCascada, setHuboCascada] = useState(false);
  const [phoneInput, setPhoneInput]                   = useState('');
  // Después de responder En escena, la Memoria sustituye al Dashboard. Si la
  // ventana de 72 h ya venció, cualquier entrada abre directamente En escena,
  // incluso cuando la persona volvió por su cuenta.
  const [holograficoOpen, setHolograficoOpen]         = useState(() => startInHolografico || !!lsRead(portal).bitacora_completed);
  const [holograficoPoster, setHolograficoPoster]     = useState(portal);
  // La huella (D-34): se abre al terminar En escena, y desde la Memoria
  // cuando la persona quiera volver a verla, corregirla o retirarla (D-38).
  const [huellaOpen, setHuellaOpen]                   = useState(false);
  const activeBloom = holograficoOpen ? (PORTAL_BLOOM[holograficoPoster] ?? PORTAL_BLOOM.obra) : bloom;
  const [bitacoraOpen, setBitacoraOpen]               = useState(() => {
    const stored = lsRead(portal);
    const available = stored.bitacora_available_at
      ? new Date(stored.bitacora_available_at).getTime() <= Date.now()
      : false;
    return !stored.bitacora_completed && (startInBitacora || available);
  });
  const [bitacoraStep, setBitacoraStep]               = useState('p1');
  const [bitacoraP1, setBitacoraP1]                   = useState('');
  const [bitacoraAfirmativa, setBitacoraAfirmativa]   = useState(null);
  const [bitacoraP2, setBitacoraP2]                   = useState('');
  const [bitacoraP3, setBitacoraP3]                   = useState('');
  const [bitacoraSubmitting, setBitacoraSubmitting]   = useState(false);
  // La burbuja del gato se transforma en el campo de escritura (Carlos, 18 sep
  // 2026): mientras no se escribe, sostiene la pregunta; al tocarla, la pregunta
  // sube al lugar del preludio y el cuerpo se vuelve textarea. Así no hay un
  // formulario debajo de una ilustración: hay alguien preguntando.
  const [bitacoraEscribiendo, setBitacoraEscribiendo] = useState(false);

  // En móvil el modal se dibuja anclado a la pantalla, no dentro de la tarjeta.
  // La tarjeta que lo hospeda no tiene tope de alto ahí —su `max-h` sólo aplica
  // en escritorio—, así que su altura la decide el contenido que hay detrás: por
  // eso unas vistas cabían y otras se cortaban, como la Memoria holográfica.
  // Tiene que ser un portal y no un `position: fixed` a secas, porque el
  // contenedor de la vitrina lleva un `transform`, y un transform convierte a
  // cualquier hijo fijo en relativo a él.
  const [enPantallaChica, setEnPantallaChica] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(max-width: 1023px)');
    const alCambiar = (e) => setEnPantallaChica(e.matches);
    query.addEventListener('change', alCambiar);
    return () => query.removeEventListener('change', alCambiar);
  }, []);

  // Con el modal anclado a la pantalla, el fondo no debe seguir desplazándose
  // detrás: en un teléfono eso se siente como si la página se escapara.
  useEffect(() => {
    if (!open || !enPantallaChica || typeof document === 'undefined') return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [open, enPantallaChica]);

  const bitacoraAvailable = bitacoraAvailableAt
    ? new Date(bitacoraAvailableAt).getTime() <= bitacoraAvailabilityTick
    : false;

  useEffect(() => {
    if (!open || !bitacoraAvailableAt) return undefined;
    const remaining = new Date(bitacoraAvailableAt).getTime() - Date.now();
    if (remaining <= 0) {
      setBitacoraAvailabilityTick(Date.now());
      return undefined;
    }
    const timeoutId = window.setTimeout(
      () => setBitacoraAvailabilityTick(Date.now()),
      Math.min(remaining + 100, 2_147_000_000),
    );
    return () => window.clearTimeout(timeoutId);
  }, [open, bitacoraAvailableAt]);

  const [bitacoraP2Question, setBitacoraP2Question]         = useState(null);
  const [bitacoraP3Question, setBitacoraP3Question]         = useState(null);
  const [bitacoraQuestionLoading, setBitacoraQuestionLoading] = useState(false);

  // Una sola fuente para la pregunta en curso: la cabina (móvil) y la columna
  // de escritorio deben decir exactamente lo mismo.
  const preguntaDelPaso =
    bitacoraStep === 'compartir'
      ? 'Lo que escribiste puede acompañar a alguien que se lo esté preguntando. ¿Dejas que lo encuentre, sin tu nombre?'
      : bitacoraStep === 'p1'
      ? '¿Hay algo de esta experiencia que haya regresado por su cuenta?'
      : bitacoraStep === 'p2'
        ? (bitacoraQuestionLoading ? '…' : (bitacoraP2Question || 'Si volvió, ¿dónde te encontró?'))
        : (bitacoraQuestionLoading ? '…' : (bitacoraP3Question || '¿Hay algo que ahora veas de otra manera?'));

  // Verifica Supabase solo si localStorage no tiene l1 (respuestas pre-deploy)
  useEffect(() => {
    if (!open || !checking) return;
    // En la vista previa DEV, localStorage es la fuente de verdad. Así un
    // reinicio visual no vuelve a hidratar respuestas históricas de Supabase.
    if (isDevAuth) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    const verify = async () => {
      try {
        const { data } = await supabase
          .from('vitrana_resonances')
          .select('level, respuesta')
          .eq('anon_id', ensureAnonId())
          .eq('portal', portal)
          .in('level', [1, 2])
          .order('created_at', { ascending: true });
        if (cancelled) return;
        if (data?.length) {
          const l1Row = data.find((r) => r.level === 1);
          const l2Row = data.find((r) => r.level === 2);
          if (l1Row) {
            const acknowledgment = buildL1Acknowledgment(portal, l1Row.respuesta);
            lsPatch(portal, { l1: Date.now(), l1_answer: l1Row.respuesta ?? null, l1_acknowledgment: acknowledgment });
            setL1Acknowledgment(acknowledgment);
            setL1Done(true);
          }
          if (l2Row) {
            const acknowledgment = buildL2Acknowledgment(portal, l2Row.respuesta);
            lsPatch(portal, { l2_option: l2Row.respuesta, l2_acknowledgment: acknowledgment, l2_ts: Date.now() });
            setL2Selection(l2Row.respuesta);
            setL2Acknowledgment(acknowledgment);
            setL1ChipDone(true);
          }
        }
      } catch (_) {}
      if (!cancelled) setChecking(false);
    };
    verify();
    return () => { cancelled = true; };
  }, [open, checking, portal, isDevAuth]);

  useEffect(() => {
    if (!open) return;
    modalRef.current?.parentElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (user) {
      const name  = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
      const email = user.email ?? '';
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || name,
        email:  prev.email  || email,
      }));
    }
  }, [open, user]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* Nivel 1 — formulario */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const anonId = ensureAnonId();
    const fallbackAcknowledgment = buildL1Acknowledgment(portal, formData.respuesta);
    if (!isDevAuth) {
      try {
        await supabase.from('vitrana_resonances').insert({
          anon_id:   anonId,
          portal:    portal ?? null,
          question:  question ?? null,
          nombre:    formData.nombre.trim() || 'Anónimo',
          email:     formData.email,
          respuesta: formData.respuesta,
          level:     1,
        });
      } catch (_) {}

      // Persiste línea base en resonance_sessions (fire-and-forget)
      const bienvenidaAnonId = (() => { try { return localStorage.getItem('bienvenida_anon_id') || null; } catch { return null; } })();
      // Pendiente 3, cerrado por Carlos el 20 sep 2026: la firma NO viaja al
      // instrumento. Lo que se analiza es lo que la persona escribió; la unidad
      // de identidad es el anon_id, con puente al user_id cuando se autentica.
      // El nombre, si alguien decidió firmar, se queda en vitrana_resonances.
      persistBaseline({
          anon_id:             anonId,
          miniverso_id:        portal,
          intuicion_answer:    formData.respuesta,
          // Bloque 7 (12 sep 2026): si pasó por el Intermedio antes de
          // responder, se anota. No se le cierra la puerta a nadie.
          ...(readIntermedioVistoAt() ? { intermedio_visto_at: readIntermedioVistoAt() } : {}),
          // Pendiente 4 del registro (11 sep 2026): sin este campo la columna
          // user_id de resonance_sessions nunca se poblaba desde el sitio.
          ...(user?.id ? { user_id: user.id } : {}),
          ...(bienvenidaAnonId ? { bienvenida_anon_id: bienvenidaAnonId } : {}),
        })
        .then((data) => {
          const acknowledgment = data?.acknowledgment?.trim();
          if (!acknowledgment) return;
          setL1Acknowledgment(acknowledgment);
          lsPatch(portal, { l1_acknowledgment: acknowledgment });
        })
        .catch(() => {});
    }

    lsPatch(portal, {
      l1: Date.now(),
      l1_answer: formData.respuesta,
      l1_acknowledgment: fallbackAcknowledgment,
      dashboard_active_level: 1,
      l2_calibration_open: false,
    });
    setL1Acknowledgment(fallbackAcknowledgment);
    fireConfetti();
    setL1Done(true);
    setDashboardActiveLevel(1);
    setCalibrationQuestionOpen(false);
    setSubmitting(false);
  };

  const selectDashboardLevel = (levelNum) => {
    setDashboardActiveLevel(levelNum);
    lsPatch(portal, { dashboard_active_level: levelNum });
  };

  const handleOpenCalibrationQuestion = () => {
    setCalibrationQuestionOpen(true);
    lsPatch(portal, { l2_calibration_open: true, dashboard_active_level: 2 });
  };

  /* Experiencia narrativa — abre la experiencia y cierra el modal */
  const handleOpenNarrativeExperience = () => {
    lsPatch(portal, { l2_narrative_opened: true, l2_calibration_open: false, dashboard_active_level: 2 });
    setL2NarrativeOpened(true);
    setCalibrationQuestionOpen(false);
    onClose?.();
    onOpenNarrative?.();
  };

  /* Nivel 2 — turno de conversación con IA
     `context` solo se envía en el primer turno (auto-arranque): fragment_id/plano/
     initiator del párrafo leído en voz alta dentro del artefacto (Marcador
     Inteligente, Literatura) — ver resonance.js /l2-turn, se guardan una sola vez. */
  const callL2Turn = useCallback(async (respuesta = null, silent = false, context = null) => {
    setConvLoading(true);
    setConvError(false);
    lsPatch(portal, { l2_conv_error: false });
    if (isDevAuth) {
      if (silent || (respuesta != null && convTurn >= 2)) {
        lsPatch(portal, { l2_conv_done: true, l2_current_question: null, l2_current_turn: null, l2_conv_error: false });
        setL2ConvDone(true);
        setConvQuestion(null);
      } else {
        const nextTurn = respuesta == null ? 1 : convTurn + 1;
        const devQuestions = [
          '¿Qué cambió en tu primera impresión después de atravesar la experiencia?',
          '¿Qué imagen, sensación o pregunta sigue contigo ahora?',
        ];
        const nextQuestion = devQuestions[Math.min(nextTurn - 1, devQuestions.length - 1)];
        lsPatch(portal, { l2_current_question: nextQuestion, l2_current_turn: nextTurn, l2_conv_error: false });
        setConvQuestion(nextQuestion);
        setConvTurn(nextTurn);
        setConvAnswer('');
      }
      setConvLoading(false);
      onL2QuestionReady?.();
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${OBRA_API_URL}/api/resonance/l2-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id: ensureAnonId(),
          miniverso_id: portal,
          ...(user?.id ? { user_id: user.id } : {}),
          ...(respuesta != null ? { respuesta } : {}),
          ...(silent ? { silent: true } : {}),
          ...(context?.fragment_id ? { fragment_id: context.fragment_id } : {}),
          ...(context?.plano ? { plano: context.plano } : {}),
          ...(context?.initiator ? { initiator: context.initiator } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error('[ResonanceModal] l2-turn HTTP error:', res.status);
        setConvError(true);
        lsPatch(portal, { l2_conv_error: true });
        setConvLoading(false);
        clearTimeout(timeoutId);
        onL2QuestionReady?.();
        return;
      }
      const data = await res.json();
      if (data.done) {
        lsPatch(portal, { l2_conv_done: true, l2_current_question: null, l2_current_turn: null, l2_conv_error: false });
        setL2ConvDone(true);
        setConvQuestion(null);
      } else {
        lsPatch(portal, { l2_current_question: data.question, l2_current_turn: data.turn, l2_conv_error: false });
        setConvQuestion(data.question);
        setConvTurn(data.turn ?? 1);
        setConvAnswer('');
      }
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      console.error('[ResonanceModal] l2-turn error:', isTimeout ? 'timeout (8s)' : err);
      setConvError(true);
      lsPatch(portal, { l2_conv_error: true });
    } finally {
      clearTimeout(timeoutId);
      setConvLoading(false);
      onL2QuestionReady?.();
    }
  }, [portal, onL2QuestionReady, isDevAuth, convTurn]);

  // Auto-arranca la conversación cuando el modal abre después de completar la experiencia.
  // Si el artefacto dejó fragment_id/plano/initiator (Marcador Inteligente, Literatura),
  // el primer turno los lleva — es la única vez que se envían.
  useEffect(() => {
    if (!open) return;
    if (!l2NarrativeOpened || l2ConvDone || convQuestion !== null || convLoading || convError) return;
    const s = lsRead(portal);
    if (!s.experience_ts) return;
    const context = (s.l2_fragment_id || s.l2_plano || s.l2_initiator)
      ? { fragment_id: s.l2_fragment_id, plano: s.l2_plano, initiator: s.l2_initiator }
      : null;
    void callL2Turn(null, false, context);
  }, [open, l2NarrativeOpened, l2ConvDone, convQuestion, convLoading, convError, portal, callL2Turn]);

  /* Nivel 1 — chip de expectativa (pre-estímulo, inmediatamente después del eco) */
  const handleExpectativaSelect = async (option) => {
    if (l1ChipDone || l2Submitting) return;
    const fallbackAcknowledgment = buildL2Acknowledgment(portal, option);
    setL2Selection(option); // optimistic
    setL2Acknowledgment(fallbackAcknowledgment);
    setL1ChipDone(true);
    setL2Submitting(true);
    setCalibrationQuestionOpen(false);
    setDashboardActiveLevel(2);
    const anonId = ensureAnonId();
    lsPatch(portal, {
      l2_option: option,
      l2_acknowledgment: fallbackAcknowledgment,
      l2_ts: Date.now(),
      l2_calibration_open: false,
      dashboard_active_level: 2,
    });
    if (!isDevAuth) {
      try {
        await supabase.from('vitrana_resonances').insert({
          anon_id:   anonId,
          portal:    portal ?? null,
          question:  l2q?.question ?? null,
          respuesta: option,
          level:     2,
        });
      } catch (_) {}

      // Persiste la expectativa en el pre-estímulo (H-LIT-2): va a /baseline junto
      // con la intuición, no a /evidence — las dos declaraciones de L1 ocurren sin
      // nada en medio, antes de abrir el artefacto.
      persistBaseline({
          anon_id:              anonId,
          miniverso_id:         portal,
          expectativa_chip:     option,
          ...(readIntermedioVistoAt() ? { intermedio_visto_at: readIntermedioVistoAt() } : {}),
          expectativa_question: l2q?.question ?? null,
        })
        .then((data) => {
          const acknowledgment = data?.acknowledgment?.trim();
          if (!acknowledgment) return;
          setL2Acknowledgment(acknowledgment);
          lsPatch(portal, { l2_acknowledgment: acknowledgment });
        })
        .catch(() => {});
    }

    setL2Submitting(false);
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', respuesta: '' });
    onClose?.();
  };

  const handleDevResetJourney = () => {
    if (!import.meta.env.DEV) return;
    const confirmed = window.confirm(
      `¿Reiniciar desde cero el recorrido de ${portal}? Se borrará su progreso y el consentimiento de prueba guardados en este navegador.`,
    );
    if (!confirmed) return;
    try {
      localStorage.removeItem(lsKey(portal));
    } catch {}
    clearGlobalConsent();
    window.location.reload();
  };

  // Salta L1 + dispositivo narrativo + L2 y aterriza al inicio de L3,
  // antes del consentimiento, solo con localStorage (nada de Supabase). La escalera
  // l1Done/l2Done/l3Done de readResonanceProgress() en bitacoraShared.js
  // hace que con l2_conv_done baste para dar las tres primeras etapas por
  // completas. Limpiamos el consentimiento global para que el atajo sirva
  // también para revisar el clímax y su promesa narrativa.
  const handleDevSkipToL3 = () => {
    if (!import.meta.env.DEV) return;
    lsPatch(portal, {
      l1: Date.now(),
      l2_narrative_opened: true,
      l2_conv_done: true,
      bitacora_consented: undefined,
      bitacora_available_at: undefined,
      bitacora_completed: undefined,
      farewell_video_seen: undefined,
      farewell_video_seen_at: undefined,
      souvenir_delivered_at: undefined,
    });
    clearGlobalConsent();
    window.location.reload();
  };

  // El boleto testifica hacia dónde sigue el recorrido, no de dónde viene —
  // por eso usa el miniverso RECOMENDADO (l3Rec.recommended_format_id), no el
  // portal actual. Sin el recomendado resuelto, cae al actual como último
  // recurso en vez de romper la descarga.
  const recommendedSouvenirPortal =
    FORMAT_ID_TO_PORTAL[l3Rec?.recommended_format_id] ?? portal;

  const handleDownloadSouvenir = useCallback(async () => {
    // Se puede volver a pedir (20 sep 2026). El candado de una sola descarga
    // dejaba sin recuerdo a quien perdiera el archivo, y este objeto va a
    // llevar la llave para volver a lo suyo. El stack del clímax conserva su
    // propio "ya lo tienes"; aquí no hay por qué negarlo.
    if (isSouvenirGenerating || !l3Rec?.step3) return;
    setIsSouvenirGenerating(true);
    try {
      const blob = await createMiniverseSouvenirBlob({
        portal: recommendedSouvenirPortal,
        step3: l3Rec.step3,
        backgroundUrl: PORTAL_POSTER[recommendedSouvenirPortal],
      });
      const filename = `boleto-miniverso-${recommendedSouvenirPortal}.png`;
      // iOS Safari: Web Share API saves directly al álbum de fotos
      const file = new File([blob], filename, { type: 'image/png' });
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          const deliveredAt = new Date().toISOString();
          lsPatch(portal, { souvenir_delivered_at: deliveredAt });
          setSouvenirDeliveredAt(deliveredAt);
          return;
        } catch {}
      }
      downloadBlob(blob, filename);
      const deliveredAt = new Date().toISOString();
      lsPatch(portal, { souvenir_delivered_at: deliveredAt });
      setSouvenirDeliveredAt(deliveredAt);
    } catch (err) {
      console.error('[ResonanceModal] No se pudo generar el coleccionable:', err);
    } finally {
      setIsSouvenirGenerating(false);
    }
  }, [isSouvenirGenerating, souvenirDeliveredAt, l3Rec, portal, recommendedSouvenirPortal]);


  /* Bitácora — genera P2 o P3 dinámicamente según lo que ya respondió el usuario */
  const fetchNextBitacoraQuestion = useCallback(async (step, p1, p2 = null) => {
    setBitacoraQuestionLoading(true);
    if (isDevAuth) {
      const question = step === 'p2'
        ? '¿En qué momento notaste que esa resonancia seguía contigo?'
        : '¿Qué nombre le darías ahora a lo que permaneció?';
      if (step === 'p2') setBitacoraP2Question(question);
      else setBitacoraP3Question(question);
      setBitacoraQuestionLoading(false);
      return;
    }
    try {
      const res = await fetch(`${OBRA_API_URL}/api/bitacora/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, p1_response: p1, ...(p2 ? { p2_response: p2 } : {}) }),
      });
      const data = await res.json();
      if (data.ok && data.question) {
        if (step === 'p2') setBitacoraP2Question(data.question);
        else setBitacoraP3Question(data.question);
      }
    } catch (_) {}
    setBitacoraQuestionLoading(false);
  }, [isDevAuth]);

  /* Bitácora — registra consentimiento */
  const handleBitacoraConsent = useCallback(async (canal, phoneNumber) => {
    const anonId = ensureAnonId();
    const bienvenidaAnonId = (() => { try { return localStorage.getItem('bienvenida_anon_id') || null; } catch { return null; } })();
    if (isDevAuth) {
      // Sin servidor no hay plazo: queda consentida y no disponible hasta que
      // el atajo «[dev] simular regreso» la abra.
      lsPatch(portal, { bitacora_consented: true, bitacora_available_at: null });
      writeGlobalConsent();
      setBitacoraConsented(true);
      setBitacoraAvailableAt(null);
      return;
    }
    try {
      const res = await fetch(`${OBRA_API_URL}/api/bitacora/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id: anonId,
          miniverso_id: portal,
          canal,
          bienvenida_anon_id: bienvenidaAnonId,
          phone_number: phoneNumber ?? null,
          ...(user?.id ? { user_id: user.id } : {}),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        lsPatch(portal, { bitacora_consented: true, bitacora_available_at: data.available_at });
        writeGlobalConsent();
        setBitacoraConsented(true);
        setBitacoraAvailableAt(data.available_at);
      }
    } catch (_) {}
  }, [portal, isDevAuth, user?.id]);

  // Marca el video de despedida como visto — al arrancar la reproducción o
  // al saltarlo, cualquiera de los dos cuenta. Independiente de si dio o no
  // su WhatsApp: debe verse una sola vez sin importar esa decisión.
  const handleFarewellVideoSeen = useCallback(() => {
    lsPatch(portal, { farewell_video_seen: true, farewell_video_seen_at: new Date().toISOString() });
    setHuboCascada(true);
    setFarewellVideoSeen(true);
  }, [portal]);

  // Scroll automático, no chevron: lo que aparece llega donde están los ojos
  // (Carlos, bloque 6). Se espera a que la primera pieza haya entrado para no
  // perseguir un elemento que todavía se está animando.
  useEffect(() => {
    if (!huboCascada || !stackClimaxRef.current) return undefined;
    const id = window.setTimeout(() => {
      stackClimaxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 220);
    return () => window.clearTimeout(id);
  }, [huboCascada]);

  // Si el usuario está en la PWA instalada, suscribe push en silencio
  // en cuanto se completa el Nivel 3 (el momento en que aparece En el foco).
  useEffect(() => {
    const l3Done = Boolean(l3Rec?.step3) && !l3Rec?.error;
    if (isDevAuth || !l3Done || bitacoraConsented) return;
    const bienvenidaAnonId = (() => { try { return localStorage.getItem('bienvenida_anon_id') || null; } catch { return null; } })();
    autoSubscribeIfPWA({ anonId: ensureAnonId(), miniversoId: portal, bienvenidaAnonId });
  }, [l3Rec, bitacoraConsented, portal, autoSubscribeIfPWA, isDevAuth]);

  /* Bitácora — envía respuestas */
  const handleBitacoraSubmit = useCallback(async ({
    p1Response = bitacoraP1,
    p1Afirmativa = bitacoraAfirmativa,
  } = {}) => {
    setBitacoraSubmitting(true);
    const anonId = ensureAnonId();
    if (!isDevAuth) {
      try {
        await fetch(`${OBRA_API_URL}/api/bitacora/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anon_id:        anonId,
            // Bloque 7: la misma marca, leída ahora; contra baseline_at dice si
            // el paso por el Intermedio fue durante la retención.
            ...(readIntermedioVistoAt() ? { intermedio_visto_at: readIntermedioVistoAt() } : {}),
            // D-35: cuando se llega por el aviso (un enlace por persona), la
            // respuesta cubre toda la ventana y el servidor decide a qué formas
            // aplica. Sin ventana, sigue siendo por esta forma.
            ...(bitacoraVentana ? {} : { miniverso_id: portal }),
            ...(user?.id ? { user_id: user.id } : {}),
            p1_response:    p1Response,
            p1_afirmativa:  p1Afirmativa,
            p2_response:    bitacoraP2 || null,
            p3_response:    bitacoraP3 || null,
          }),
        });
      } catch (_) {}
    }
    const portalsDone = bitacoraVentana?.length ? [...new Set([...bitacoraVentana, portal])] : [portal];
    portalsDone.forEach((p) => lsPatch(p, { bitacora_completed: true, dashboard_active_level: 3 }));
    setBitacoraCompleted(true);
    setDashboardActiveLevel(3);
    setBitacoraEscribiendo(false);
    setBitacoraSubmitting(false);
    // D-37 §3.2 · el permiso de compartir vuelve a existir (20 sep 2026).
    // Perdió su casilla con el rediseño del 19 y, sin él, nadie podía
    // autorizar nada: la coda del apuntador sólo tenía voces del Laboratorio.
    // No vuelve como casilla de preferencias sino como la última pregunta del
    // acto, en la misma cabina que hizo las otras tres. Es el único momento en
    // que todo el mundo está y acaba de escribir lo que se va a compartir.
    setBitacoraStep('compartir');
  }, [portal, bitacoraP1, bitacoraAfirmativa, bitacoraP2, bitacoraP3, isDevAuth, user?.id, bitacoraVentana]);

  // El cierre que antes ocurría al guardar: vuelve primero a la Memoria, y la
  // huella queda disponible dentro de ese mapa para cuando ella quiera abrirla.
  const cerrarElActo = useCallback(() => {
    setBitacoraOpen(false);
    setHolograficoOpen(true);
    setHuellaOpen(false);
    setBitacoraStep('p1');
  }, []);

  // Las dos respuestas pasan por aquí: autorizar y no autorizar se guardan
  // igual, porque un "no" también es una decisión que hay que poder revocar.
  const responderCompartir = useCallback(async (autorizado) => {
    setBitacoraSubmitting(true);
    if (!isDevAuth) {
      try {
        await fetch(`${OBRA_API_URL}/api/huella/compartir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anon_id: ensureAnonId(),
            autorizado,
            ...(user?.id ? { user_id: user.id } : {}),
          }),
        });
      } catch (_) {}
    }
    setBitacoraSubmitting(false);
    cerrarElActo();
  }, [isDevAuth, user?.id, cerrarElActo]);

  // Avanzar desde P2 o P3: lo llama el botón dentro del campo y el de saltar.
  // Saltar no manda texto: no hay respuesta inventada (§1.5 del handoff).
  const avanzarDesdePregunta = useCallback(({ saltando = false } = {}) => {
    if (bitacoraStep === 'p2') {
      if (saltando) setBitacoraP2('');
      setBitacoraStep('p3');
      setBitacoraEscribiendo(false);
      void fetchNextBitacoraQuestion('p3', bitacoraP1, saltando ? '' : bitacoraP2);
      return;
    }
    if (saltando) setBitacoraP3('');
    void handleBitacoraSubmit();
  }, [bitacoraStep, bitacoraP1, bitacoraP2]);

  /* ── render ── */
  // Gatea la revelación ambiental del gato en la columna derecha (ver más
  // abajo) — ya no gatea ningún modal ni burbuja narrada, esa función la
  // absorbió el video del autor (Carlos, 2026-08-27).
  const l3Active = dashboardActiveLevel === 3 && !!l3Rec && !l3Rec.error && !l3Rec.all_complete;

  /* Nivel 3 — fetch recomendación */
  const fetchL3Recommendation = useCallback(async () => {
    // Caché legacy (formato viejo con .message pero sin .step1) → refetch
    if (l3Rec && !l3Rec.step1 && !l3Rec.all_complete && !l3Rec.error) {
      lsPatch(portal, { l3_recommendation: undefined });
      setL3Rec(null);
    }
    if ((l3Rec && l3Rec.step1) || l3Rec?.error || l3Loading) return;
    setL3Loading(true);
    if (isDevAuth) {
      const devRecommendation = {
        step1: 'Tu recorrido de prueba ya tiene suficiente información para continuar.',
        step2: 'La siguiente forma puede ayudarte a contrastar lo que apareció aquí.',
        step3: 'Vista previa completada. Este resultado solo existe en tu navegador.',
        forma: 'otro miniverso',
        recommended_format_id: 'literatura',
      };
      setL3Rec(devRecommendation);
      lsPatch(portal, { l3_recommendation: devRecommendation });
      setL3Loading(false);
      return;
    }
    try {
      const completedIds = Object.keys(PORTAL_GRADIENT)
        .filter((p) => p !== portal && !!lsRead(p).l2_conv_done);
      const res = await fetch(`${OBRA_API_URL}/api/resonance/recommend-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id:       ensureAnonId(),
          miniverso_id:  portal,
          completed_ids: completedIds,
          ...(user?.id ? { user_id: user.id } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setL3Rec(data);
      lsPatch(portal, { l3_recommendation: data });
      // D-35: completar esta forma desplazó la ventana del regreso (si ya
      // había consentimiento). El plazo lo manda el servidor; aquí no se calcula.
      if (data?.bitacora_available_at) {
        lsPatch(portal, { bitacora_available_at: data.bitacora_available_at });
        setBitacoraAvailableAt(data.bitacora_available_at);
      }
    } catch (_) {
      setL3Rec({ error: true });
    } finally {
      setL3Loading(false);
    }
  }, [l3Rec, l3Loading, portal, isDevAuth, user?.id]);


  const handleBackToDashboard = () => {
    onClose?.();
    navigate('/#transmedia', { replace: true });
  };

  const handleGoldenHashtag = () => {
    onClose?.();
    if (!user) {
      onRequireLogin?.();
      return;
    }
    navigate('/#transmedia');
  };

  // Sin llamador desde que se quitó el CTA "Explorar {forma}" (dinámica de
  // recomendación algorítmica, obsoleta — Carlos, 2026-08-27). Se deja sin
  // borrar por si el reemplazo de orden canónico la reutiliza.
  const handleNavigateToRecommendation = () => {
    if (!l3Rec?.recommended_format_id) return;
    if (!user) {
      writePendingContinuation({
        source: 'l3-next-act',
        showcaseId: l3Rec.recommended_format_id,
        forma: l3Rec.forma,
        presentation: 'narrative-video',
      });
      onClose?.();
      onRequireLogin?.();
      return;
    }
    onClose?.();
    if (onNavigateToRecommendation) {
      onNavigateToRecommendation(l3Rec.recommended_format_id);
      return;
    }
    const portalRoute = resolvePortalRoute({ formatId: l3Rec.recommended_format_id });
    if (portalRoute) {
      navigate(portalRoute, {
        state: createPortalLaunchState(location, 'l3-recommendation', {
          showcaseId: l3Rec.recommended_format_id,
        }),
      });
    }
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="resonance-modal-title"
          className={`z-50 flex flex-col overflow-hidden lg:absolute lg:inset-0 lg:flex-row lg:rounded-[2.5rem] ${
            enPantallaChica ? 'fixed inset-0' : 'absolute inset-0 rounded-[2.5rem]'
          }`}
          style={enPantallaChica ? { height: '100dvh' } : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Bloom background */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 160% 45% at 50% -5%, ${activeBloom[0]}, ${activeBloom[1]} 40%, transparent 65%), rgb(5,3,9)`,
            }}
          />

          {confettiBursts.map((burst) => (
            <ConfettiBurst key={burst.id} x={burst.x} y={burst.y} />
          ))}

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-base text-slate-300 backdrop-blur-md transition hover:border-white/35 hover:text-white"
            aria-label="Cerrar"
          >
            <Check size={18} />
          </button>

          {import.meta.env.DEV && (
            <div className="absolute left-4 top-4 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDevResetJourney}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-amber-300/35 bg-black/55 px-3 text-[0.62rem] uppercase tracking-[0.14em] text-amber-100/90 backdrop-blur-md transition hover:border-amber-300/60 hover:bg-black/70"
                aria-label={`Reiniciar recorrido de ${portal}`}
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">DEV · Reiniciar</span>
              </button>
              <button
                type="button"
                onClick={handleDevSkipToL3}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-300/35 bg-black/55 px-3 text-[0.62rem] uppercase tracking-[0.14em] text-cyan-100/90 backdrop-blur-md transition hover:border-cyan-300/60 hover:bg-black/70"
                aria-label={`Saltar L1, dispositivo y L2 en ${portal}`}
              >
                <FastForward size={14} />
                <span className="hidden sm:inline">DEV · Saltar a L3</span>
              </button>
            </div>
          )}

          {/* ── Columna izquierda ── */}
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {/* Poster en mobile (fondo con fade) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden transition-opacity duration-500"
              style={{
                backgroundImage: `url(${poster})`,
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
                opacity: (l2NarrativeOpened && convQuestion !== null && !l2ConvDone) ? 0.1 : 0.5,
              }}
            />
            {/* Desktop conserva dos columnas: el póster vive detrás del
                formulario izquierdo, con el mismo oscurecimiento progresivo
                que protege la lectura en móvil. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden lg:block transition-opacity duration-500"
              style={{
                backgroundImage: `url(${holograficoOpen ? (PORTAL_POSTER[holograficoPoster] ?? poster) : poster})`,
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
                opacity: (l2NarrativeOpened && convQuestion !== null && !l2ConvDone) ? 0.08 : 0.42,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden"
              style={{ background: 'linear-gradient(180deg, rgba(5,3,9,0.28) 0%, rgba(5,3,9,0.60) 45%, rgba(5,3,9,0.92) 100%)' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden lg:block"
              style={{ background: 'linear-gradient(180deg, rgba(5,3,9,0.34) 0%, rgba(5,3,9,0.76) 43%, rgba(5,3,9,0.98) 100%)' }}
            />

            <div className="relative z-10 h-full overflow-y-auto">
              <AnimatePresence mode="wait">
                {checking ? (
                  /* ── Verificando respuestas anteriores ── */
                  <motion.div
                    key="checking"
                    className="flex h-full items-center justify-center px-8 py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
                      <p className="text-xs uppercase tracking-[0.25em] text-white/30">Cargando tu progreso</p>
                    </div>
                  </motion.div>
                ) : l1Done && l2NarrativeOpened && !l2ConvDone && convQuestion !== null ? (
                  /* ── Nivel 2: conversación post-experiencia ── */
                  <motion.div
                    key="l2-conversation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div aria-hidden="true" className="h-16 sm:h-24 lg:hidden" />

                    {/* Desktop: pregunta prominente */}
                    <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14">
                      <p className="mb-3 text-[0.62rem] uppercase tracking-[0.32em] text-white/50">
                        Nivel 2 · Contacto con la experiencia
                      </p>
                      {convLoading && !convQuestion ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
                          <p className="text-sm text-slate-400/70">Procesando tu experiencia…</p>
                        </div>
                      ) : (
                        <p
                          className="font-display leading-snug question-voice"
                          style={{ fontSize: 'clamp(1.3rem, 2.3vw, 2.1rem)' }}
                        >
                          {convQuestion}
                        </p>
                      )}
                    </div>

                    <div
                      aria-hidden="true"
                      className="hidden lg:block mx-8 mb-5 h-px question-divider-voice"
                    />

                    <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-10 lg:px-10">
                      <div className="space-y-3">
                        {/* Mobile: pregunta */}
                        <div className="lg:hidden">
                          <div className="space-y-2">
                            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70">
                              {convTurn > 0 ? `Turno ${convTurn}` : 'Nivel 2'}
                            </div>
                            {convLoading && !convQuestion ? (
                              <div className="flex items-center gap-2 py-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
                                <p className="text-sm text-slate-400/70">Procesando…</p>
                              </div>
                            ) : (
                              <h3 className="font-display text-2xl leading-tight tracking-tight question-voice">
                                {convQuestion}
                              </h3>
                            )}
                          </div>
                        </div>

                        {convError ? (
                          <div className="space-y-3 text-center">
                            <p className="text-xs text-slate-400/80">
                              No pudimos conectar con el servidor. Intenta de nuevo.
                            </p>
                            <button
                              type="button"
                              onClick={() => { lsPatch(portal, { l2_conv_error: false }); void callL2Turn(); }}
                              className="relative w-full rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 transition hover:bg-purple-500/20"
                            >
                              Reintentar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                lsPatch(portal, { l2_narrative_opened: false });
                                setL2NarrativeOpened(false);
                              }}
                              className="w-full py-1 text-center text-xs text-slate-500/70 transition hover:text-slate-300/70"
                            >
                              Volver al dashboard →
                            </button>
                          </div>
                        ) : convQuestion ? (
                          <>
                            <textarea
                              value={convAnswer}
                              onChange={(e) => setConvAnswer(e.target.value)}
                              rows={4}
                              disabled={convLoading}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder="Escribe lo que puedas, aunque sea poco…"
                            />
                            <button
                              type="button"
                              disabled={convLoading || !convAnswer.trim()}
                              onClick={() => void callL2Turn(convAnswer.trim())}
                              className="relative w-full rounded-full border border-purple-400/80 bg-purple-600/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-white backdrop-blur-sm shadow-[0_8px_32px_rgba(67,56,202,0.5)] transition hover:bg-purple-500/45 disabled:opacity-40"
                            >
                              {convLoading ? 'Procesando…' : 'Continuar'}
                            </button>
                            <button
                              type="button"
                              disabled={convLoading}
                              onClick={() => void callL2Turn(null, true)}
                              className="w-full py-1.5 text-center text-xs text-slate-400/80 transition hover:text-slate-200 disabled:opacity-40"
                            >
                              Nada de esto se movió esta vez. Continuar →
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : holograficoOpen ? (
                  /* ── Memoria holográfica: lo que queda después de En escena ── */
                  <motion.div
                    key="holografico"
                    className="h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CuadernoHolografico
                      portal={portal}
                      onDownloadSouvenir={l3Rec?.step3 ? handleDownloadSouvenir : null}
                      souvenirGenerando={isSouvenirGenerating}
                      isMobileViewport={isMobileViewport}
                      readOnly={bitacoraCompleted}
                      onStartBitacora={() => { setHolograficoOpen(false); setBitacoraOpen(true); }}
                      huellaOpen={huellaOpen}
                      onHuellaOpenChange={setHuellaOpen}
                      recommendedFormatId={l3Rec?.recommended_format_id ?? null}
                      onNavigate={(showcaseId) => { setHolograficoOpen(false); handleClose(); onNavigateToRecommendation?.(showcaseId); }}
                      onGoToSite={(hash) => { setHuellaOpen(false); handleClose(); navigate(hash ? { pathname: '/', hash } : '/'); }}
                      onPosterChange={setHolograficoPoster}
                      onRequireLogin={onRequireLogin}
                    />
                  </motion.div>
                ) : bitacoraOpen ? (
                  /* ── Bitácora individual: preguntas diferidas ── */
                  <motion.div
                    key="bitacora-questions"
                    className="h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* En móvil esta vista se dibuja aparte, en su propia capa
                        anclada al viewport (ver el final del componente). Aquí
                        queda la versión de escritorio. */}
                    <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14">
                      <p className="mb-3 text-[0.62rem] uppercase tracking-[0.32em] text-white/50">
                        En escena
                      </p>
                      <p
                        className="font-display leading-snug question-voice"
                        style={{ fontSize: 'clamp(1.3rem, 2.3vw, 2.1rem)' }}
                      >
                        {preguntaDelPaso}
                      </p>
                    </div>

                    <div aria-hidden="true" className="hidden lg:block mx-8 mb-5 h-px question-divider-voice" />

                    <div className="hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:block lg:pb-10 lg:px-10">
                      <div className="space-y-3">

                        {/* Etiqueta de paso — sobrevive para pantallas angostas de
                            escritorio; en móvil la sustituyó la cabina. */}
                        <div className="lg:hidden space-y-2">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70">
                            En escena
                          </div>
                          <h3 className="font-display text-2xl leading-tight tracking-tight question-voice">
                            {bitacoraStep === 'p1' && '¿Hay algo de esta experiencia que haya regresado por su cuenta? Una imagen, una frase, una sensación.'}
                            {bitacoraStep === 'p2' && (bitacoraQuestionLoading ? '…' : (bitacoraP2Question || 'Si volvió, ¿dónde te encontró? ¿Qué estabas haciendo o con quién estabas?'))}
                            {bitacoraStep === 'p3' && (bitacoraQuestionLoading ? '…' : (bitacoraP3Question || 'Después de esta experiencia, ¿hay algo que ahora veas de otra manera? También puede ser que nada haya cambiado.'))}
                            {bitacoraStep === 'compartir' && preguntaDelPaso}
                          </h3>
                        </div>

                        {/* P1 */}
                        {bitacoraStep === 'p1' && (
                          <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const response = 'Sí, regresó algo';
                                  setBitacoraP1(response);
                                  setBitacoraAfirmativa(true);
                                  setBitacoraStep('p2');
                                  void fetchNextBitacoraQuestion('p2', response);
                                }}
                                className="flex-1 rounded-full border border-amber-400/50 bg-amber-900/20 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-100/90 transition hover:bg-amber-900/35 disabled:opacity-40"
                              >
                                Sí, regresó algo
                              </button>
                              <button
                                type="button"
                                disabled={bitacoraSubmitting}
                                onClick={() => {
                                  // §1.5: «no» es respuesta completa. No se manda texto
                                  // inventado; p1_afirmativa=false es el dato.
                                  setBitacoraP1('');
                                  setBitacoraAfirmativa(false);
                                  void handleBitacoraSubmit({ p1Response: null, p1Afirmativa: false });
                                }}
                                className="flex-1 rounded-full border border-white/15 bg-black/30 px-4 py-2.5 text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-40"
                              >
                                Todavía no
                              </button>
                          </div>
                        )}

                        {/* P2 */}
                        {bitacoraStep === 'p2' && (
                          <>
                            <textarea
                              value={bitacoraP2}
                              onChange={(e) => setBitacoraP2(e.target.value)}
                              rows={4}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder="¿Qué estabas haciendo o con quién estabas?"
                            />
                            <button
                              type="button"
                              disabled={!bitacoraP2.trim()}
                              onClick={() => { setBitacoraStep('p3'); void fetchNextBitacoraQuestion('p3', bitacoraP1, bitacoraP2); }}
                              className="w-full rounded-full border border-purple-400/80 bg-purple-600/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-purple-500/45 disabled:opacity-40"
                            >
                              Continuar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setBitacoraStep('p3'); void fetchNextBitacoraQuestion('p3', bitacoraP1, bitacoraP2); }}
                              className="w-full py-1.5 text-center text-xs text-slate-400/80 transition hover:text-slate-200"
                            >
                              Prefiero no decir dónde. Continuar →
                            </button>
                          </>
                        )}

                        {/* P3 */}
                        {bitacoraStep === 'p3' && (
                          <>
                            <textarea
                              value={bitacoraP3}
                              onChange={(e) => setBitacoraP3(e.target.value)}
                              rows={4}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder="También puede ser que nada haya cambiado…"
                            />
                            <button
                              type="button"
                              disabled={!bitacoraP3.trim() || bitacoraSubmitting}
                              onClick={() => void handleBitacoraSubmit()}
                              className="w-full rounded-full border border-purple-400/80 bg-purple-600/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-purple-500/45 disabled:opacity-40"
                            >
                              {bitacoraSubmitting ? 'Guardando…' : 'Guardar mis apuntes'}
                            </button>
                            <button
                              type="button"
                              disabled={bitacoraSubmitting}
                              onClick={() => void handleBitacoraSubmit()}
                              className="w-full py-1.5 text-center text-xs text-slate-400/80 transition hover:text-slate-200 disabled:opacity-40"
                            >
                              Nada cambió esta vez. Cerrar →
                            </button>
                          </>
                        )}

                        {/* El permiso de compartir (D-37 §3.2) */}
                        {bitacoraStep === 'compartir' && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              disabled={bitacoraSubmitting}
                              onClick={() => void responderCompartir(true)}
                              className="w-full rounded-full border border-purple-400/80 bg-purple-600/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-purple-50 transition hover:bg-purple-600/45 disabled:opacity-50"
                            >
                              Que lo encuentre
                            </button>
                            <button
                              type="button"
                              disabled={bitacoraSubmitting}
                              onClick={() => void responderCompartir(false)}
                              className="w-full rounded-full border border-white/15 px-4 py-2.5 text-[0.7rem] text-slate-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                            >
                              Prefiero que no
                            </button>
                            <p className="pt-1 text-[0.66rem] leading-relaxed text-slate-400/80">
                              Sin tu nombre, y sólo lo que escribiste. Si algún día retiras lo que dejaste, esto se retira contigo.
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  </motion.div>
                ) : l1Done ? (
                  /* ── Dashboard de viaje ── */
                  <motion.div
                    key="dashboard"
                    className="flex flex-col gap-5 px-6 pb-8 pt-10 lg:px-8 lg:pt-10"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Título accesible del diálogo — el copy visual ya vive
                        fusionado dentro de la tarjeta activa de cada nivel,
                        no duplicado aquí arriba (Carlos, 2026-08-27). */}
                    <h2 id="resonance-modal-title" className="sr-only">
                      Resonancia Colectiva — {dashboardLevels.find((lvl) => lvl.num === dashboardActiveLevel)?.title}
                    </h2>

                    {/* Niveles */}
                    <div className="relative flex flex-col gap-0">

                      {orderedDashboardLevels.map((level, i) => {
                        const Icon = level.icon;
                        const isL1 = level.num === 1;
                        const isL2 = level.num === 2;
                        const isL3 = level.num === 3;
                        // l3RecSeen: la recomendación ya fue recibida → congela el acordeón y muestra coleccionable
                        // bitacoraCompleted: el usuario cerró la bitácora → pone el círculo en verde
                        const l3RecSeen    = isL3 && Boolean(l3Rec?.step3) && !l3Rec?.error;
                        const isCompleted  = isL1 || (isL2 && (l1ChipDone || l2ConvDone)) || (isL3 && bitacoraCompleted);
                        const isAvailable  = (isL2 && !l1ChipDone) || (isL3 && l2ConvDone && !bitacoraCompleted);
                        const isSelected   = dashboardActiveLevel === level.num;
                        const levelIsOpen  = isSelected && (
                          isL1 ||
                          isL2 ||
                          (isL3 && l2ConvDone)
                        );
                        const canSelect    = isL1 || isL2 || (isL3 && l2ConvDone);
                        const handleSelect = () => {
                          if (!canSelect) return;
                          selectDashboardLevel(level.num);
                          if (isL2 && !l1ChipDone && !l2NarrativeOpened) {
                            handleOpenCalibrationQuestion();
                            return;
                          }
                          if (isL3 && !l3RecSeen && !bitacoraCompleted) fetchL3Recommendation();
                        };

                        return (
                          <motion.div
                            key={level.num}
                            layout
                            className="flex items-start py-2"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              layout: { type: 'spring', stiffness: 300, damping: 30 },
                              opacity: { delay: 0.08 + i * 0.06, duration: 0.25 },
                              x: { delay: 0.08 + i * 0.06, duration: 0.25 },
                            }}
                          >
                            {/* Card con acordeón */}
                            <div
                              role={canSelect ? 'button' : undefined}
                              tabIndex={canSelect ? 0 : undefined}
                              onClick={canSelect ? handleSelect : undefined}
                              onKeyDown={canSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(); } } : undefined}
                              className={`relative grid min-w-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-2xl border px-4 py-4 pb-7 transition-colors lg:grid-cols-[4.5rem_minmax(0,1fr)_auto] lg:gap-x-4 ${canSelect ? 'cursor-pointer' : ''} ${
                              /* La escena activa ya no se anuncia con una etiqueta en la
                                 esquina: la lleva el bloque entero (Carlos, 18 sep 2026).
                                 Está contenida, no señalada. */
                              isAvailable
                                ? 'border-sky-400/50 bg-sky-500/[0.07] shadow-[0_0_28px_rgba(56,189,248,0.18)]'
                                : isSelected
                                ? 'border-purple-300/45 bg-black/60 shadow-[0_0_20px_rgba(168,85,247,0.10)]'
                                : isCompleted
                                ? 'border-white/20 bg-black/55'
                                : 'border-white/[0.08] bg-black/35'
                            }`}>
                              {/* La pastilla ya no anuncia el estado —eso lo hace el bloque—,
                                  así que baja a la esquina y pierde el latido, que se fue al
                                  icono. Se queda para nombrar lo que se ve. */}
                              {isAvailable && (
                                <span className="pointer-events-none absolute bottom-2 right-3 text-[0.52rem] uppercase tracking-[0.16em] text-sky-200/70">
                                  Escena activa
                                </span>
                              )}

                              {/* Fila cabecera — siempre visible */}
                              <div className="contents">
                                {/* Ícono */}
                                {/* El icono es lo que late. Antes latía el puntito de la
                                    pastilla, que además era lo único que decía "aquí vas":
                                    ahora el pulso está en lo que representa la fase. */}
                                <div className={`row-span-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full lg:h-[4.5rem] lg:w-[4.5rem] ${
                                  isAvailable ? 'animate-pulse ' : ''
                                }${
                                  isCompleted
                                    ? `bg-gradient-to-br ${gradient} shadow-[0_0_10px_rgba(0,0,0,0.25)]`
                                    : isAvailable
                                      ? 'border border-sky-300/50 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                                      : 'border border-white/8 bg-black/25'
                                  }`}>
                                  {isCompleted || isAvailable
                                    ? <Icon className="h-6 w-6 text-white lg:h-8 lg:w-8" />
                                    : <Lock className="h-5 w-5 text-white/20 lg:h-7 lg:w-7" />
                                  }
                                </div>

                                {/* Texto */}
                                <div className="flex min-h-14 min-w-0 flex-1 items-center self-center lg:min-h-[4.5rem]">
                                  <div className="min-w-0 space-y-1">
                                    <p className={`text-[0.56rem] uppercase tracking-[0.18em] ${
                                      isCompleted || isAvailable ? 'text-slate-400/70' : 'text-white/20'
                                    }`}>
                                      {level.eyebrow}
                                    </p>
                                    <p className={`font-display text-base leading-tight ${
                                      isCompleted || isAvailable ? 'text-white' : 'text-white/30'
                                    }`}>
                                      {level.title}
                                    </p>
                                    {isL1 && (
                                      <p className="text-xs leading-relaxed text-slate-300/75">
                                        {level.desc.replace(/^✓\s*/, '')}
                                      </p>
                                    )}
                                    {/* La descripción es el anzuelo de la fase cerrada. Al
                                        abrirla estorba: la pregunta, que va abajo y en grande,
                                        dice lo mismo mejor (Carlos, 18 sep 2026). */}
                                    {isL2 && !l1ChipDone && !levelIsOpen && (
                                      <p className="text-xs leading-relaxed text-slate-300/75">
                                        {l2q?.preview}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Badge + chevron */}
                                <div className={`${isAvailable ? 'flex' : 'hidden lg:flex'} col-start-2 row-start-2 shrink-0 items-center gap-1.5 self-start lg:col-start-3 lg:row-start-1 lg:self-center`}>
                                  {isAvailable ? (
                                    <ChevronDown
                                      size={13}
                                      className="text-white/30"
                                    />
                                  ) : !isCompleted ? (
                                    <Lock size={11} className="text-white/[0.18]" />
                                  ) : null}
                                </div>
                              </div>

                              {/* Cuerpo colapsable */}
                              <AnimatePresence initial={false}>
                                {levelIsOpen && (
                                  <motion.div
                                    key="body"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="col-span-full overflow-hidden lg:col-start-2 lg:col-end-[-1]"
                                  >
                                    <div className="space-y-3 pt-1 lg:pt-0">
                                      {isL1 && (
                                        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-slate-200/90">
                                          {l1Acknowledgment || 'Tu primera intuición quedó registrada.'}
                                        </p>
                                      )}

                                      {isL2 && !l1ChipDone && l2q && (
                                        <div className="space-y-3 pt-1">
                                          <p className="font-display text-2xl leading-snug question-voice lg:text-[1.75rem]">
                                            {l2q.question}
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {l2q.options.map((opt) => (
                                              <button
                                                key={opt}
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  void handleExpectativaSelect(opt);
                                                }}
                                                disabled={l2Submitting}
                                                className={`rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-default ${
                                                  l2Selection === opt
                                                    ? 'border-amber-300/80 bg-amber-500/25 text-amber-50 shadow-[0_0_14px_rgba(251,191,36,0.22)]'
                                                    : 'border-amber-400/30 bg-amber-900/20 text-amber-100/90 hover:border-amber-400/55 hover:bg-amber-900/35 hover:text-amber-50 disabled:opacity-40'
                                                }`}
                                              >
                                                {opt}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {isL2 && l2Selection && (
                                        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-slate-200/90">
                                          {l2Acknowledgment || buildL2Acknowledgment(portal, l2Selection)}
                                        </p>
                                      )}

                                      {isL2 && l1ChipDone && !l2NarrativeOpened && onOpenNarrative && (
                                        <motion.div
                                          className="flex flex-col items-center px-2 pb-1 pt-2 text-center"
                                          initial={{ opacity: 0, scale: 0.97, y: 8 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          transition={{ type: 'spring', stiffness: 210, damping: 22 }}
                                        >
                                          <p className="font-display text-lg uppercase leading-tight tracking-[0.1em] text-amber-100">
                                            {dramaturgy.form} entra en escena
                                          </p>
                                          <p className="mt-1 text-xs leading-relaxed text-slate-300/75">
                                            {dramaturgy.entranceCoda}
                                          </p>
                                          <motion.button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleOpenNarrativeExperience();
                                            }}
                                            className="flex w-full flex-col items-center gap-3 pt-4 transition active:scale-[0.98]"
                                            whileHover={{ scale: 1.015 }}
                                          >
                                            <img
                                              src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png"
                                              alt="GAToken"
                                              className="h-24 w-24 animate-[spin_8s_linear_0s_infinite_reverse] drop-shadow-[0_0_22px_rgba(251,191,36,0.6)] lg:h-32 lg:w-32"
                                            />
                                            <span className="text-sm font-semibold tracking-wide text-amber-200">
                                              Habitar la forma
                                            </span>
                                          </motion.button>
                                        </motion.div>
                                      )}

                                      {isL3 && (
                                        <div className="space-y-3">

                                          {/* Cargando */}
                                          {l3Loading && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400/80">
                                              <Sparkles size={11} className="animate-pulse text-purple-400/70" />
                                              <span>Leyendo tu recorrido…</span>
                                            </div>
                                          )}

                                          {/* Cierre — el video del autor absorbe la narración que antes
                                              daban los pasos 1/2 del gato (Carlos, 2026-08-27: simplificar,
                                              sin pasos intermedios). */}
                                          {l3RecSeen && !l3Rec.all_complete && (
                                            <>
                                              {/* Clímax: el autor entra a cuadro. El recuerdo vive pegado a
                                                  la despedida, no después del cierre académico — son un
                                                  mismo momento (Carlos, 2026-08-27, congruencia). */}
                                              {RESONANCE_FAREWELL_VIDEO_ENABLED && (
                                                <FarewellVideoPanel
                                                  portal={portal}
                                                  onSeen={handleFarewellVideoSeen}
                                                  mediaAspectClassName="aspect-square"
                                                  caption="El autor toma la palabra"
                                                  unavailableLabel="El autor toma la palabra"
                                                  intro={dramaturgy.appearanceCue}
                                                  showUnavailablePlaceholder={import.meta.env.DEV}
                                                />
                                              )}

                                              {/* Cascada del clímax (Carlos, bloque 6 + mockup del 18 sep): mientras el
                                                  video corre, nada compite con él. Al terminar —o al saltarlo— entra la
                                                  cabecera de la retención y debajo el stack, escalonados, y el scroll los
                                                  lleva a donde están los ojos. Con la bandera del video apagada
                                                  (producción, hasta que existan las nueve piezas) se muestra todo de una
                                                  vez, como siempre. */}
                                              {revelarStack && (
                                                <motion.div
                                                  ref={stackClimaxRef}
                                                  className="space-y-3"
                                                  initial={huboCascada ? "oculto" : false}
                                                  animate="visible"
                                                >
                                                  {/* La retención encabeza lo que sigue, no lo contiene: es la marca de
                                                      cierre del detonante y el anuncio de la espera. D-42 se sostiene —la
                                                      espera no ofrece nada— porque lo que hay debajo cierra En el foco, no
                                                      ocupa los tres días. */}
                                                  <motion.div variants={PIEZA_DE_CASCADA} custom={0}>
                                                    <div className="px-2 pb-1 pt-4 text-center">
                                                      <div className="flex items-center gap-3" aria-hidden="true">
                                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
                                                        <span className="h-1 w-1 rotate-45 bg-purple-200/50" />
                                                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
                                                      </div>
                                                      <p className="mt-4 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-purple-200/65">
                                                        Entre bambalinas
                                                      </p>
                                                      {/* Placeholder aprobado (11 sep 2026), no copy final — y ahora carga
                                                          más peso que antes, como título. */}
                                                      <p className="mt-1 font-display text-xl tracking-[0.14em] text-white">
                                                        {dramaturgy.closingLine}
                                                      </p>
                                                      <p className="mx-auto mt-2 max-w-sm text-[0.7rem] leading-relaxed text-slate-400/80">
                                                          {dramaturgy.returnBody}
                                                      </p>
                                                    </div>
                                                  </motion.div>

                                                  <div className="cabina-antesala-stack">
                                                  {/* El aviso es la primera fila del stack, con la misma caja que las otras
                                                      dos. El atril es provisional, hasta que exista el icono definitivo. */}
                                                  {!bitacoraCompleted && (
                                                    <motion.div variants={PIEZA_DE_CASCADA} custom={1} className="cabina-antesala-stack__fila space-y-2">
                                                      {/* Mismo gesto que "Recuerdo entregado": la fila no se va,
                                                          cambia de estado (Carlos, 18 sep 2026). */}
                                                      {bitacoraConsented ? (
                                                        <div className="cabina-antesala-opcion cabina-antesala-opcion--completa">
                                                          <span className="cabina-antesala-opcion__mirilla cabina-antesala-opcion__mirilla--completa">
                                                            <Check size={18} aria-hidden="true" />
                                                          </span>
                                                          <span className="cabina-antesala-opcion__texto">
                                                            <span className="cabina-antesala-opcion__titulo cabina-antesala-opcion__titulo--completa">
                                                              {bitacoraAvailable ? dramaturgy.returnBackNow : dramaturgy.returnDone}
                                                            </span>
                                                            <span className="cabina-antesala-opcion__detalle">
                                                              {bitacoraAvailable ? dramaturgy.returnBackNowHint : dramaturgy.returnDoneHint}
                                                            </span>
                                                          </span>
                                                        </div>
                                                      ) : !showPhoneInput ? (
                                                        <button
                                                          type="button"
                                                          onClick={() => setShowPhoneInput(true)}
                                                          className="cabina-antesala-opcion cabina-antesala-opcion--regreso"
                                                        >
                                                          {/* El # dorado: dejar el número no es un depósito, es la promesa de que
                                                              algo vuelve. La talega —con los # adentro— se fue a la fila de
                                                              seguir otra forma, que es donde se siguen revelando (Carlos, 18 sep). */}
                                                          <span className="cabina-antesala-opcion__mirilla">
                                                            <img
                                                              src="/assets/laObraDorada.png"
                                                              alt=""
                                                              aria-hidden="true"
                                                              className="cabina-antesala-opcion__imagen object-contain"
                                                            />
                                                          </span>
                                                          <span className="cabina-antesala-opcion__titulo">
                                                            {dramaturgy.returnCta}
                                                          </span>
                                                        </button>
                                                      ) : (
                                                        <div className="cabina-antesala-form space-y-2">
                                                          <p className="cabina-antesala-form__pregunta">
                                                            ¿A qué número te enviamos el aviso?
                                                          </p>
                                                          <div className="flex gap-2">
                                                            <input
                                                              type="tel"
                                                              value={phoneInput}
                                                              onChange={(e) => setPhoneInput(e.target.value)}
                                                              placeholder="+52 55 0000 0000"
                                                              className="cabina-antesala-form__input min-w-0 flex-1"
                                                            />
                                                            <button
                                                              type="button"
                                                              onClick={() => void handleBitacoraConsent('whatsapp', phoneInput.trim())}
                                                              disabled={phoneInput.trim().length < 8}
                                                              className="cabina-antesala-form__confirmar shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                              Confirmar →
                                                            </button>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </motion.div>
                                                  )}

                                                  <motion.div variants={PIEZA_DE_CASCADA} custom={2} className="cabina-antesala-stack__fila">
                                                <button
                                                  type="button"
                                                  onClick={handleDownloadSouvenir}
                                                  disabled={isSouvenirGenerating || Boolean(souvenirDeliveredAt)}
                                                  className="cabina-antesala-opcion cabina-antesala-opcion--recuerdo disabled:cursor-default disabled:opacity-75"
                                                >
                                                  {souvenirDeliveredAt ? (
                                                    <span className="cabina-antesala-opcion__mirilla cabina-antesala-opcion__mirilla--completa">
                                                      <Check size={18} aria-hidden="true" />
                                                    </span>
                                                  ) : PORTAL_ICON_URL[recommendedSouvenirPortal] ? (
                                                    <span className="cabina-antesala-opcion__mirilla">
                                                      <img
                                                        src={PORTAL_ICON_URL[recommendedSouvenirPortal]}
                                                        alt=""
                                                        aria-hidden="true"
                                                        className="cabina-antesala-opcion__imagen cabina-antesala-opcion__imagen--portal object-cover"
                                                      />
                                                    </span>
                                                  ) : null}
                                                  <span className="cabina-antesala-opcion__texto">
                                                    <span className={`cabina-antesala-opcion__titulo${souvenirDeliveredAt ? ' cabina-antesala-opcion__titulo--completa' : ''}`}>
                                                      {isSouvenirGenerating
                                                        ? 'Preparando el recuerdo…'
                                                        : souvenirDeliveredAt
                                                          ? 'Recuerdo entregado'
                                                          : dramaturgy.souvenirCta}
                                                    </span>
                                                    {souvenirDeliveredAt && (
                                                      <span className="cabina-antesala-opcion__detalle">
                                                        Busca la imagen en tus descargas.
                                                      </span>
                                                    )}
                                                  </span>
                                                </button>
                                                  </motion.div>

                                                  <motion.div variants={PIEZA_DE_CASCADA} custom={3} className="cabina-antesala-stack__fila">
                                                {(!user || import.meta.env.DEV) && (
                                                  <button
                                                    type="button"
                                                    onClick={() => onRequireLogin?.()}
                                                    className="cabina-antesala-opcion cabina-antesala-opcion--continuar"
                                                  >
                                                    <span className="cabina-antesala-opcion__mirilla">
                                                      <img
                                                        src="/assets/logoapp.png"
                                                        alt=""
                                                        aria-hidden="true"
                                                        className="cabina-antesala-opcion__imagen object-contain"
                                                      />
                                                    </span>
                                                    <span className="cabina-antesala-opcion__titulo">
                                                      Inicia sesión y sigue otra forma
                                                    </span>
                                                  </button>
                                                )}
                                                  </motion.div>
                                                  </div>

                                                  {!bitacoraCompleted && (
                                                    <div className="space-y-2 px-1">
                                                  {import.meta.env.DEV && !bitacoraConsented && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        lsPatch(portal, { bitacora_consented: true, bitacora_available_at: null });
                                                        writeGlobalConsent();
                                                        setBitacoraConsented(true);
                                                        setBitacoraAvailableAt(null);
                                                      }}
                                                      className="text-[10px] text-slate-500/60 underline underline-offset-2 hover:text-slate-400/80"
                                                    >
                                                      [dev] bypass envío de número
                                                    </button>
                                                  )}

                                                  {import.meta.env.DEV && bitacoraConsented && !bitacoraAvailable && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const now = new Date().toISOString();
                                                        lsPatch(portal, { bitacora_available_at: now });
                                                        setBitacoraAvailableAt(now);
                                                        setBitacoraAvailabilityTick(Date.now());
                                                      }}
                                                      className="text-[10px] text-slate-500/60 underline underline-offset-2 hover:text-slate-400/80"
                                                    >
                                                      [dev] simular regreso después de 72 h
                                                    </button>
                                                  )}
                                                    </div>
                                                  )}
                                                </motion.div>
                                              )}
                                            </>
                                          )}

                                          {/* Seguimiento longitudinal — solo después de la ventana diferida */}
                                          {!bitacoraCompleted && bitacoraConsented && bitacoraAvailable && (
                                            <button
                                              type="button"
                                              onClick={() => { setBitacoraStep('p1'); setBitacoraOpen(true); }}
                                              className="w-full rounded-full border border-amber-400/60 bg-amber-900/25 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-900/40"
                                            >
                                              En escena →
                                            </button>
                                          )}

                                          {/* Aquí hubo "Ir al camerino →" durante la espera (Carlos,
                                              2026-08-27). Retirado por D-42 (11 sep 2026): la retención
                                              está vacía. */}

                                          {/* Bitácora — completada */}
                                          {bitacoraCompleted && (
                                            <div className="flex flex-col items-center pt-1 text-center">
                                              <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-xs">
                                                <Check size={12} className="shrink-0 text-emerald-400/70" />
                                                <span className="italic">Registro completo</span>
                                              </div>

                                              <motion.button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setHolograficoPoster(portal);
                                                  setHolograficoOpen(true);
                                                }}
                                                className="flex w-full flex-col items-center gap-3 pt-4 transition active:scale-[0.98]"
                                                whileHover={{ scale: 1.015 }}
                                              >
                                                <img
                                                  src="/assets/header-logo.png"
                                                  alt="Emblema de #GatoEncerrado"
                                                  className="h-24 w-24 object-contain drop-shadow-[0_0_24px_rgba(168,85,247,0.45)] lg:h-28 lg:w-28"
                                                />
                                                <span className="text-sm font-semibold tracking-wide text-purple-200">
                                                  Abrir mi memoria
                                                </span>
                                              </motion.button>
                                            </div>
                                          )}

                                          {/* Dev reset — siempre visible cuando hay rec */}
                                          {import.meta.env.DEV && l3Rec && !l3Rec.error && !l3Rec.all_complete && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                lsPatch(portal, {
                                                  l3_recommendation: undefined,
                                                  bitacora_consented: undefined,
                                                  bitacora_available_at: undefined,
                                                  bitacora_completed: undefined,
                                                  farewell_video_seen: undefined,
                                                  farewell_video_seen_at: undefined,
                                                  souvenir_delivered_at: undefined,
                                                });
                                                clearGlobalConsent();
                                                setL3Rec(null);
                                                setBitacoraConsented(false);
                                                setBitacoraAvailableAt(null);
                                                setBitacoraAvailabilityTick(Date.now());
                                                setBitacoraCompleted(false);
                                                setFarewellVideoSeen(false);
                                                setShowPhoneInput(false);
                                                setPhoneInput('');
                                                setSouvenirDeliveredAt(null);
                                              }}
                                              className="text-[10px] text-slate-500/60 underline underline-offset-2 hover:text-slate-400/80"
                                            >
                                              [dev] reset recomendación
                                            </button>
                                          )}

                                          {/* Completó todo */}
                                          {!l3Loading && l3Rec?.all_complete && (
                                            <p className="text-xs leading-relaxed text-slate-300/70 italic">
                                              Has recorrido todas las formas. El universo está completo.
                                            </p>
                                          )}

                                          {/* Error */}
                                          {!l3Loading && l3Rec?.error && (
                                            <p className="text-xs leading-relaxed text-slate-400/60 italic">
                                              No pudimos leer tu recorrido ahora. Vuelve pronto.
                                            </p>
                                          )}

                                          {/* Sin rec aún */}
                                          {!l3Loading && !l3Rec && (
                                            <p className="text-xs leading-relaxed text-slate-400/60 italic">
                                              {level.pendingDesc}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      {isL2 && l2ConvDone && (
                                        <div className="flex items-center gap-2 text-sm text-slate-300 lg:text-xs">
                                          <Check size={12} className="shrink-0 text-emerald-400/70" />
                                          <span className="italic">Conversación completada</span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Footer privacidad */}
                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5">
                      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-300/80" />
                      <p className="text-xs leading-relaxed text-slate-300/80">
                        {/* La línea del procesamiento externo la decidió Carlos el 8 sep
                            2026 (handoff §3.1): el aviso anterior no cubría que lo escrito
                            sale del sitio para poder devolverse. Sin nombrar tecnología ni
                            proveedores, según la regla de copy del proyecto. */}
                        Lo que escribes se procesa fuera de este sitio para poder devolvértelo.
                        Es anónimo y se usa solo con fines de investigación.{' '}
                        <span className="text-purple-300/90">Gracias por ser parte de este experimento colectivo.</span>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Formulario Nivel 1 ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Spacer mobile (poster visible arriba) */}
                    <div aria-hidden="true" className="h-32 sm:h-40 lg:hidden" />

                    {/* Desktop: pregunta prominente */}
                    {question ? (
                      <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14 space-y-3">
                        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                          Resonancia Colectiva
                        </div>
                        <p
                          className="font-display leading-snug question-voice"
                          style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.4rem)' }}
                        >
                          {question}
                        </p>
                      </div>
                    ) : (
                      <div aria-hidden="true" className="hidden lg:block lg:h-14" />
                    )}

                    <div
                      aria-hidden="true"
                      className="hidden lg:block mx-8 mb-5 h-px question-divider-voice"
                    />

                    {/* Campos */}
                    <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-10 lg:px-10">
                      <div className="w-full space-y-3">
                        <div className="space-y-0.5 lg:hidden">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                            Resonancia Colectiva
                          </div>
                          <h3
                            id="resonance-modal-title"
                            className="font-display text-3xl leading-tight tracking-tight question-voice"
                          >
                            {question ?? 'Formas de habitar'}
                          </h3>
                        </div>

                        <form
                          onSubmit={handleSubmit}
                          className="space-y-2.5"
                        >
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-200">Cómo firmas</label>
                            {firmando || formData.nombre.trim() ? (
                              <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                autoFocus={firmando}
                                className="form-surface w-full px-3 py-2 text-sm"
                                placeholder="Tu nombre o seudónimo"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                <span className="text-sm text-slate-300">Anónimo</span>
                                <button
                                  type="button"
                                  onClick={() => setFirmando(true)}
                                  className="shrink-0 text-[0.7rem] text-purple-200/85 underline underline-offset-4 transition hover:text-white"
                                >
                                  Firmar con mi nombre o seudónimo
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-200">Tu intuición</label>
                            <textarea
                              name="respuesta"
                              value={formData.respuesta}
                              onChange={handleChange}
                              required
                              rows={4}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder=""
                            />
                          </div>
                          <label className="flex items-start gap-2 pt-1 text-[0.7rem] leading-relaxed text-slate-300/90">
                            <input
                              type="checkbox"
                              checked={researchConsent}
                              onChange={(e) => setResearchConsent(e.target.checked)}
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/30 bg-transparent accent-purple-500"
                            />
                            <span>
                              Tus respuestas forman parte de una investigación doctoral sobre cómo se interpretan y se recuerdan las experiencias narrativas. Se guardan sin tu nombre —salvo que decidas firmarlas— y puedes detenerte cuando quieras. Lo que escribes se procesa fuera de este sitio para poder devolvértelo. La investigación la realiza Carlos A. Pérez H. en el marco del doctorado en ICONOS.
                              <br />
                              Entiendo y acepto participar.
                            </span>
                          </label>
                          <button
                            ref={submitBtnRef}
                            type="submit"
                            disabled={submitting || !researchConsent}
                            className="relative w-full rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50"
                          >
                            {submitting ? 'Enviando…' : 'Enviar'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Columna derecha: gato de la cabina — solo desktop ── */}
          <div className="hidden lg:block lg:w-[42%] shrink-0 relative overflow-hidden bg-[rgb(5,3,9)]">
            {/* El recuerdo, otra vez al alcance (Carlos, 20 sep 2026). Sólo se
                podía descargar dentro de la cascada del clímax y una única vez;
                quien no lo tomara ahí se quedaba sin él para siempre. Aquí, al
                pie de la cabina y con el mismo zócalo del stack, está siempre
                que la Memoria esté abierta. */}
            {holograficoOpen && l3Rec?.step3 ? (
              <div className="absolute inset-x-5 bottom-5 z-20">
                <button
                  type="button"
                  onClick={() => void handleDownloadSouvenir()}
                  disabled={isSouvenirGenerating}
                  className="cabina-antesala-opcion cabina-antesala-opcion--recuerdo"
                >
                  <span className="cabina-antesala-opcion__mirilla">
                    <Download size={17} aria-hidden="true" />
                  </span>
                  <span className="cabina-antesala-opcion__texto">
                    <span className="cabina-antesala-opcion__titulo">
                      {isSouvenirGenerating ? 'Preparando tu recuerdo…' : 'Llevarme el recuerdo'}
                    </span>
                    <span className="cabina-antesala-opcion__detalle">
                      Tu consigna y la fecha en que la pregunta vuelve
                    </span>
                  </span>
                </button>
              </div>
            ) : null}
            {/* La misma presencia permanece en escena: misteriosa antes de L3
                y revelada cuando el usuario alcanza el tercer nivel. */}
            <img
              src={CAT_CABINA_URL}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top transition-all duration-1000"
              style={{
                opacity: l3Active ? 1 : 0.26,
                filter: l3Active
                  ? 'brightness(1) saturate(1) contrast(1)'
                  : 'brightness(0.48) saturate(0.65) contrast(1.08)',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                background: 'radial-gradient(circle at 50% 32%, rgba(82,62,118,0.12), rgba(5,3,9,0.74) 68%, rgba(5,3,9,0.92) 100%)',
                opacity: l3Active ? 0.08 : 0.4,
              }}
            />
            {/* Campo de estrellas CSS: una capa liviana con screen que deja
                respirar los negros y acompaña la revelación de L3. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-1000"
              style={{ opacity: l3Active ? 0.96 : 0.72 }}
            >
              <div
                className="star-pulse absolute inset-0"
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-24"
              style={{ background: 'linear-gradient(to right, rgb(5,3,9), transparent)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {enPantallaChica && typeof document !== 'undefined'
        ? createPortal(modal, document.body)
        : modal}
      {/* ── La cabina, en capa propia ───────────────────────────────────────
          Las preguntas del regreso no caben en la tarjeta: en móvil la tarjeta
          no tiene tope de alto —su `max-h` sólo aplica en escritorio—, así que
          crece con su contenido y la pantalla deja de ser la medida. Ninguna
          altura calculada adentro puede arreglar eso.
          Por eso esta vista se dibuja aparte, anclada al viewport: mide
          exactamente la pantalla, sin adivinar el modelo de teléfono. Es lo
          que daba la ruta separada de la versión anterior, pero sin cambiar de
          ruta: no se pierde el estado ni se recarga nada (Carlos, 18 sep 2026). */}
      {open && bitacoraOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[300] overscroll-contain bg-[rgb(5,3,9)] lg:hidden"
              style={{ height: '100dvh' }}
              role="dialog"
              aria-modal="true"
            >
        {/* ── Móvil: la cabina ──
            El gato al fondo y la pregunta en su burbuja. Antes esto
            era un formulario sobre un póster: tres preguntas sin
            nadie que las hiciera. La burbuja, su pico y su flotación
            ya existían en index.css, portadas de la Bienvenida y sin
            usar desde entonces (Carlos, 18 sep 2026). */}
        <div className="relative flex h-full flex-col overflow-hidden pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))]">
          <img
            src={CAT_CABINA_URL}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-[6rem] inset-x-0 h-[calc(100%+12rem)] w-full object-cover object-top"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(5,3,9,0.55) 0%, rgba(5,3,9,0.12) 38%, rgba(5,3,9,0.88) 100%)' }}
          />

          <div className={`cabina-bubble cabina-bubble--en-flujo relative z-10 mt-3 shrink-0 ${
            bitacoraEscribiendo ? 'cabina-bubble--escribiendo' : ''
          }`}>
            {bitacoraEscribiendo ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={bitacoraStep === 'p2' ? bitacoraP2 : bitacoraP3}
                  onChange={(e) => (bitacoraStep === 'p2' ? setBitacoraP2 : setBitacoraP3)(e.target.value)}
                  rows={4}
                  placeholder={bitacoraStep === 'p2' ? '¿Qué estabas haciendo o con quién estabas?' : 'También puede ser que nada haya cambiado…'}
                  className="w-full resize-none border-0 bg-transparent p-0 text-[0.95rem] leading-relaxed text-[#1b1d22] outline-none placeholder:text-[#1b1d22]/45"
                />
                {/* El avance vive dentro del campo: con el teclado abierto, lo de
                    abajo de la pantalla queda tapado (Carlos, 18 sep 2026). */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={bitacoraSubmitting || !(bitacoraStep === 'p2' ? bitacoraP2 : bitacoraP3).trim()}
                    onClick={() => avanzarDesdePregunta()}
                    className="cabina-escritura-accion"
                  >
                    {bitacoraStep === 'p2' ? 'Continuar' : 'Terminar'}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="cabina-bubble__preludio">La cabina te escucha</p>
                <p className="cabina-bubble__texto">{preguntaDelPaso}</p>
              </>
            )}
          </div>

          {/* El gato ocupa lo que sobre entre la burbuja y las
              respuestas: así manda el alto real y no un porcentaje. */}
          <div aria-hidden="true" className="min-h-0 flex-1" />

          {/* Donde estaba el chevron: aquí se responde. */}
          <div className="cabina-respuestas-zona relative z-10 mx-auto w-[min(340px,88vw)] shrink-0 space-y-2">
            {bitacoraStep === 'compartir' ? (
              <>
                <div className="cabina-respuesta-panel" role="group" aria-label="¿Dejas que otros lo encuentren?">
                  <button
                    type="button"
                    disabled={bitacoraSubmitting}
                    onClick={() => void responderCompartir(true)}
                    className="cabina-respuesta-clave cabina-respuesta-clave--afirmativa"
                  >
                    <span className="cabina-respuesta-clave__sigilo" aria-hidden="true" />
                    <span>Que lo encuentre</span>
                  </button>
                  <button
                    type="button"
                    disabled={bitacoraSubmitting}
                    onClick={() => void responderCompartir(false)}
                    className="cabina-respuesta-clave cabina-respuesta-clave--silencio"
                  >
                    <span className="cabina-respuesta-clave__sigilo" aria-hidden="true" />
                    <span>Prefiero que no</span>
                  </button>
                </div>
                <p className="px-1 text-center text-[0.62rem] leading-relaxed text-white/55">
                  Sin tu nombre, y sólo lo que escribiste. Si algún día retiras lo que dejaste, esto se retira contigo.
                </p>
              </>
            ) : bitacoraStep === 'p1' ? (
              <div className="cabina-respuesta-panel" role="group" aria-label="¿Regresó algo de esta experiencia?">
                <button
                  type="button"
                  onClick={() => {
                    const response = 'Sí, regresó algo';
                    setBitacoraP1(response);
                    setBitacoraAfirmativa(true);
                    setBitacoraStep('p2');
                    setBitacoraEscribiendo(false);
                    void fetchNextBitacoraQuestion('p2', response);
                  }}
                  className="cabina-respuesta-clave cabina-respuesta-clave--afirmativa"
                >
                  <span className="cabina-respuesta-clave__sigilo" aria-hidden="true" />
                  <span>Algo regresó</span>
                </button>
                <button
                  type="button"
                  disabled={bitacoraSubmitting}
                  onClick={() => {
                    setBitacoraP1('');
                    setBitacoraAfirmativa(false);
                    void handleBitacoraSubmit({ p1Response: null, p1Afirmativa: false });
                  }}
                  className="cabina-respuesta-clave cabina-respuesta-clave--silencio"
                >
                  <span className="cabina-respuesta-clave__sigilo" aria-hidden="true" />
                  <span>Aún no</span>
                </button>
              </div>
            ) : !bitacoraEscribiendo ? (
              /* Responder y saltar, juntos desde el principio: antes había que
                 tocar "Responder" para enterarse de que se podía no responder,
                 y eso obligaba a confirmar dos veces (Carlos, 18 sep 2026). */
              <>
                <div className="cabina-respuesta-panel cabina-respuesta-panel--una">
                  <button
                    type="button"
                    onClick={() => setBitacoraEscribiendo(true)}
                    className="cabina-respuesta-clave cabina-respuesta-clave--afirmativa"
                  >
                    <span className="cabina-respuesta-clave__sigilo" aria-hidden="true" />
                    <span>Responder</span>
                  </button>
                </div>
                <button
                  type="button"
                  disabled={bitacoraSubmitting}
                  onClick={() => avanzarDesdePregunta({ saltando: true })}
                  className="cabina-respuesta-salida"
                >
                  {bitacoraStep === 'p2' ? 'Prefiero no decir dónde' : 'Nada de esto se movió esta vez'}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14">
          <p className="mb-3 text-[0.62rem] uppercase tracking-[0.32em] text-white/50">
            En escena
          </p>
          <p
            className="font-display leading-snug question-voice"
            style={{ fontSize: 'clamp(1.3rem, 2.3vw, 2.1rem)' }}
          >
            {preguntaDelPaso}
          </p>
        </div>

        <div aria-hidden="true" className="hidden lg:block mx-8 mb-5 h-px question-divider-voice" />
              {/* Los controles de la tarjeta quedan debajo de esta capa, así que
                  la cabina lleva los suyos. */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-slate-200 backdrop-blur-md transition hover:border-white/35 hover:text-white"
              >
                <X size={18} />
              </button>

              {import.meta.env.DEV && (
                <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDevResetJourney}
                    aria-label={`Reiniciar recorrido de ${portal}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-amber-300/35 bg-black/55 px-3 text-[0.62rem] uppercase tracking-[0.14em] text-amber-100/90 backdrop-blur-md"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDevSkipToL3}
                    aria-label={`Saltar a L3 en ${portal}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-300/35 bg-black/55 px-3 text-[0.62rem] uppercase tracking-[0.14em] text-cyan-100/90 backdrop-blur-md"
                  >
                    <FastForward size={14} />
                  </button>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}

    </>
  );
};

export default ResonanceModal;
