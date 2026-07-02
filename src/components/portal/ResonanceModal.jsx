import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import CuadernoHolografico from './CuadernoHolografico';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Flame, PawPrint, Lock, ShieldCheck, Check, ChevronDown, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { createMiniverseSouvenirBlob, downloadBlob } from '@/lib/miniverseSouvenirCard';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const CAT_CABINA_URL = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-cabina.webp';

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
  const a = answer.trim();
  const templates = {
    obra:        `¿Esperas encontrar ${a}, cuando alguien se expone frente a otros?`,
    literatura:  `¿Esperas que una historia abierta te dé ${a}?`,
    artesanias:  `¿Te cuesta dejar ir ${a}?`,
    grafico:     `¿Las imágenes de ${a} todavía te observan cuando estás a solas?`,
    cine:        `¿Te cuesta mirar ${a} de frente en una historia?`,
    sonoridades: `¿El sonido que regresa contigo es ${a}?`,
    movimiento:  `¿Tu cuerpo busca ${a} cuando aún no entiendes lo que sientes?`,
    juegos:      `¿Lo primero que haces al elegir es ${a}?`,
    oraculo:     `¿Cuando una pregunta se queda contigo, la ${a}?`,
  };
  return templates[portal] ?? null;
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
    title: 'Cuaderno holográfico',
    pendingDesc: 'Vuelve en unos días. Queremos saber si algo resonó en ti.',
    icon: PawPrint,
  },
];

/* ─── localStorage helpers ────────────────────────────────────────────── */

const lsKey = (portal) => `gatoencerrado:resonance:${portal}`;

const GLOBAL_CONSENT_KEY = 'gatoencerrado:bitacora:consented';
const readGlobalConsent  = () => { try { return !!JSON.parse(localStorage.getItem(GLOBAL_CONSENT_KEY)); } catch { return false; } };
const writeGlobalConsent = () => { try { localStorage.setItem(GLOBAL_CONSENT_KEY, 'true'); } catch {} };

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

const ResonanceModal = ({ open, onClose, question, portal, onOpenNarrative, onNavigateToRecommendation, onL2QuestionReady, isMobileViewport }) => {
  const modalRef = useRef(null);
  const submitBtnRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ nombre: '', email: '', respuesta: '' });
  const [submitting, setSubmitting] = useState(false);
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();

  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const bloom    = PORTAL_BLOOM[portal]    ?? PORTAL_BLOOM.obra;
  const poster   = PORTAL_POSTER[portal]   ?? PORTAL_POSTER.obra;
  const l2q      = LEVEL2_QUESTIONS[portal] ?? null;

  // Persistent state — lazy-init desde localStorage; si no hay, se verifica contra Supabase
  const [l1Done, setL1Done] = useState(() => !!lsRead(portal).l1);
  const [l2Selection, setL2Selection] = useState(() => lsRead(portal).l2_option ?? null);
  const [l2Submitting, setL2Submitting] = useState(false);
  const [l2Open, setL2Open] = useState(() => {
    const s = lsRead(portal);
    return !!s.l2_option && !s.l2_conv_done;
  });
  const [checking, setChecking] = useState(() => !lsRead(portal).l1);

  // Nivel 2 — conversación post-experiencia
  const [l2NarrativeOpened, setL2NarrativeOpened] = useState(() => !!lsRead(portal).l2_narrative_opened);
  const [l2ConvDone, setL2ConvDone] = useState(() => !!lsRead(portal).l2_conv_done);
  const [convQuestion, setConvQuestion] = useState(() => lsRead(portal).l2_current_question ?? null);
  const [convTurn, setConvTurn] = useState(() => lsRead(portal).l2_current_turn ?? 0);
  const [convAnswer, setConvAnswer] = useState('');
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState(() => !!lsRead(portal).l2_conv_error);

  // Nivel 3 — recomendación del siguiente miniverso
  const [l3Open, setL3Open]             = useState(false);
  const [l3Loading, setL3Loading]       = useState(false);
  const [l3Rec, setL3Rec]               = useState(() => lsRead(portal).l3_recommendation ?? null);
  const [l3Step, setL3Step]             = useState(() => !!lsRead(portal).l3_recommendation?.step3 ? 4 : 1);
  const [l3BubbleClosed, setL3BubbleClosed] = useState(false);
  const [isSouvenirGenerating, setIsSouvenirGenerating] = useState(false);

  // Bitácora individual — seguimiento diferido
  const [bitacoraConsented, setBitacoraConsented]     = useState(() => !!lsRead(portal).bitacora_consented || readGlobalConsent());
  const [bitacoraAvailableAt, setBitacoraAvailableAt] = useState(() => lsRead(portal).bitacora_available_at ?? null);
  const [bitacoraCompleted, setBitacoraCompleted]     = useState(() => !!lsRead(portal).bitacora_completed);
  const [showPhoneInput, setShowPhoneInput]           = useState(false);
  const [phoneInput, setPhoneInput]                   = useState('');
  const [holograficoOpen, setHolograficoOpen]         = useState(false);
  const [holograficoPoster, setHolograficoPoster]     = useState(portal);
  const activeBloom = holograficoOpen ? (PORTAL_BLOOM[holograficoPoster] ?? PORTAL_BLOOM.obra) : bloom;
  const [bitacoraOpen, setBitacoraOpen]               = useState(false);
  const [bitacoraStep, setBitacoraStep]               = useState('p1');
  const [bitacoraP1, setBitacoraP1]                   = useState('');
  const [bitacoraAfirmativa, setBitacoraAfirmativa]   = useState(null);
  const [bitacoraIntensidad, setBitacoraIntensidad]   = useState(null);
  const [bitacoraP2, setBitacoraP2]                   = useState('');
  const [bitacoraP3, setBitacoraP3]                   = useState('');
  const [bitacoraSubmitting, setBitacoraSubmitting]   = useState(false);

  const bitacoraAvailable = bitacoraAvailableAt
    ? new Date(bitacoraAvailableAt) <= new Date()
    : false;

  const [bitacoraP2Question, setBitacoraP2Question]         = useState(null);
  const [bitacoraP3Question, setBitacoraP3Question]         = useState(null);
  const [bitacoraQuestionLoading, setBitacoraQuestionLoading] = useState(false);

  // Verifica Supabase solo si localStorage no tiene l1 (respuestas pre-deploy)
  useEffect(() => {
    if (!open || !checking) return;
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
            lsPatch(portal, { l1: Date.now(), l1_answer: l1Row.respuesta ?? null });
            setL1Done(true);
          }
          if (l2Row) {
            lsPatch(portal, { l2_option: l2Row.respuesta, l2_ts: Date.now() });
            setL2Selection(l2Row.respuesta);
          }
        }
      } catch (_) {}
      if (!cancelled) setChecking(false);
    };
    verify();
    return () => { cancelled = true; };
  }, [open, checking, portal]);

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
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id:   anonId,
        portal:    portal ?? null,
        question:  question ?? null,
        nombre:    formData.nombre,
        email:     formData.email,
        respuesta: formData.respuesta,
        level:     1,
      });
    } catch (_) {}

    // Persiste línea base en resonance_sessions (fire-and-forget)
    const bienvenidaAnonId = (() => { try { return localStorage.getItem('bienvenida_anon_id') || null; } catch { return null; } })();
    fetch(`${OBRA_API_URL}/api/resonance/baseline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon_id:             anonId,
        miniverso_id:        portal,
        intuicion_answer:    formData.respuesta,
        ...(bienvenidaAnonId ? { bienvenida_anon_id: bienvenidaAnonId } : {}),
      }),
    }).catch(() => {});

    lsPatch(portal, { l1: Date.now(), l1_answer: formData.respuesta });
    fireConfetti();
    setL1Done(true);
    setSubmitting(false);
  };

  /* Experiencia narrativa — abre la experiencia y cierra el modal */
  const handleOpenNarrativeExperience = () => {
    lsPatch(portal, { l2_narrative_opened: true });
    setL2NarrativeOpened(true);
    onClose?.();
    onOpenNarrative?.();
  };

  /* Nivel 2 — turno de conversación con IA */
  const callL2Turn = useCallback(async (respuesta = null, silent = false) => {
    setConvLoading(true);
    setConvError(false);
    lsPatch(portal, { l2_conv_error: false });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${OBRA_API_URL}/api/resonance/l2-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id: ensureAnonId(),
          miniverso_id: portal,
          ...(respuesta != null ? { respuesta } : {}),
          ...(silent ? { silent: true } : {}),
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
  }, [portal, onL2QuestionReady]);

  // Auto-arranca la conversación cuando el modal abre después de completar la experiencia
  useEffect(() => {
    if (!open) return;
    if (!l2NarrativeOpened || l2ConvDone || convQuestion !== null || convLoading || convError) return;
    if (!lsRead(portal).experience_ts) return;
    void callL2Turn();
  }, [open, l2NarrativeOpened, l2ConvDone, convQuestion, convLoading, convError, portal, callL2Turn]);

  /* Nivel 2 — opciones */
  const handleLevel2Select = async (option) => {
    if (l2Selection || l2Submitting) return;
    setL2Selection(option); // optimistic
    setL2Submitting(true);
    const anonId = ensureAnonId();
    lsPatch(portal, { l2_option: option, l2_ts: Date.now() });
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id:   anonId,
        portal:    portal ?? null,
        question:  l2q?.question ?? null,
        respuesta: option,
        level:     2,
      });
    } catch (_) {}

    // Persiste evidencia post-experiencia (fire-and-forget)
    fetch(`${OBRA_API_URL}/api/resonance/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon_id:         anonId,
        miniverso_id:    portal,
        cambio_response: option,
      }),
    }).catch(() => {});

    setL2Submitting(false);
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', respuesta: '' });
    onClose?.();
  };

  const handleDownloadSouvenir = useCallback(async () => {
    if (isSouvenirGenerating || !l3Rec?.step3) return;
    setIsSouvenirGenerating(true);
    try {
      const blob = await createMiniverseSouvenirBlob({
        portal,
        step3: l3Rec.step3,
        backgroundUrl: PORTAL_POSTER[portal],
      });
      const filename = `boleto-miniverso-${portal}.png`;
      // iOS Safari: Web Share API saves directly al álbum de fotos
      const file = new File([blob], filename, { type: 'image/png' });
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch {}
      }
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('[ResonanceModal] No se pudo generar el coleccionable:', err);
    } finally {
      setIsSouvenirGenerating(false);
    }
  }, [isSouvenirGenerating, l3Rec, portal]);


  /* Bitácora — genera P2 o P3 dinámicamente según lo que ya respondió el usuario */
  const fetchNextBitacoraQuestion = useCallback(async (step, p1, p2 = null) => {
    setBitacoraQuestionLoading(true);
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
  }, []);

  /* Bitácora — registra consentimiento */
  const handleBitacoraConsent = useCallback(async (canal, phoneNumber) => {
    const anonId = ensureAnonId();
    const bienvenidaAnonId = (() => { try { return localStorage.getItem('bienvenida_anon_id') || null; } catch { return null; } })();
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
  }, [portal]);

  /* Bitácora — envía respuestas */
  const handleBitacoraSubmit = useCallback(async () => {
    setBitacoraSubmitting(true);
    const anonId = ensureAnonId();
    try {
      await fetch(`${OBRA_API_URL}/api/bitacora/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id:        anonId,
          miniverso_id:   portal,
          p1_response:    bitacoraP1,
          p1_afirmativa:  bitacoraAfirmativa,
          intensidad:     bitacoraIntensidad,
          p2_response:    bitacoraP2 || null,
          p3_response:    bitacoraP3 || null,
        }),
      });
    } catch (_) {}
    lsPatch(portal, { bitacora_completed: true });
    setBitacoraCompleted(true);
    setBitacoraOpen(false);
    setBitacoraStep('p1');
    setBitacoraSubmitting(false);
  }, [portal, bitacoraP1, bitacoraAfirmativa, bitacoraIntensidad, bitacoraP2, bitacoraP3]);

  /* ── render ── */
  const l3Active = l3Open && !!l3Rec && !l3Rec.error && !l3Rec.all_complete;

  const l3ConsentBubbleText = bitacoraConsented
    ? 'El Cuaderno holográfico ahora lleva registro de tu narrativa personal. Lo que decidas hacer después también se sumará.'
    : 'Hay un Cuaderno holográfico que abre después de cada recorrido. Las preguntas van acumulando lo que dejas en cada universo. ¿Puedo avisarte cuando sea el momento de volver?';

  const l3BubbleText = l3Rec
    ? (l3Step === 1 ? l3Rec.step1
       : l3Step === 2 ? l3Rec.step2
       : l3Step === 3 ? l3ConsentBubbleText
       : (l3Rec.step3 ?? l3Rec.message))
    : null;

  /* Nivel 3 — fetch recomendación */
  const fetchL3Recommendation = useCallback(async () => {
    // Caché legacy (formato viejo con .message pero sin .step1) → refetch
    if (l3Rec && !l3Rec.step1 && !l3Rec.all_complete && !l3Rec.error) {
      lsPatch(portal, { l3_recommendation: undefined });
      setL3Rec(null);
    }
    if ((l3Rec && l3Rec.step1) || l3Rec?.error || l3Loading) return;
    setL3Loading(true);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setL3Rec(data);
      lsPatch(portal, { l3_recommendation: data });
    } catch (_) {
      setL3Rec({ error: true });
    } finally {
      setL3Loading(false);
    }
  }, [l3Rec, l3Loading, portal]);

  const handleL3Toggle = () => {
    const opening = !l3Open;
    setL3Open(opening);
    if (opening) {
      setL3Step(1);
      if (!l3Rec || !l3Rec.step1) fetchL3Recommendation();
    }
  };

  const handleBackToDashboard = () => {
    onClose?.();
    navigate('/#transmedia', { replace: true });
  };

  const handleNavigateToRecommendation = () => {
    if (!l3Rec?.recommended_format_id) return;
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="resonance-modal-title"
          className="absolute inset-0 z-50 overflow-hidden rounded-[2.5rem] flex flex-col lg:flex-row"
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
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden"
              style={{ background: 'linear-gradient(180deg, rgba(5,3,9,0.28) 0%, rgba(5,3,9,0.60) 45%, rgba(5,3,9,0.92) 100%)' }}
            />

            {/* ── L3 cat overlay — mobile only, portal a document.body ── */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
              <AnimatePresence>
                {l3Active && !l3BubbleClosed && (
                  <motion.div
                    className="fixed inset-0 z-[490] lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <img
                      src={CAT_CABINA_URL}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover object-top"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(5,3,9,0.10) 0%, rgba(5,3,9,0.35) 100%)' }}
                    />
                    <div className="cabina-bubble">
                      <p className="cabina-bubble__preludio">El laboratorio te habla</p>
                      {(l3Loading && !l3BubbleText) ? (
                        <div className="flex items-center justify-center gap-1.5 py-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="cabina-bubble__texto">{l3BubbleText}</p>
                      )}
                      {l3Step === 4 && l3BubbleText && (
                        <button
                          type="button"
                          className="cabina-bubble__cta"
                          onClick={handleNavigateToRecommendation}
                        >
                          Explorar {l3Rec.forma}
                        </button>
                      )}
                    </div>
                    {l3Step < 3 ? (
                      <button
                        type="button"
                        className="cabina-siguiente-flotante"
                        onClick={() => { if (l3BubbleText) setL3Step(l3Step + 1); }}
                        aria-label="Siguiente"
                        disabled={!l3BubbleText}
                        style={!l3BubbleText ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                      >
                        <ChevronRight size={20} />
                      </button>
                    ) : l3Step === 3 ? (
                      <div className="cabina-consent-area">
                        <button
                          type="button"
                          className="cabina-consent-area__primary"
                          onClick={() => setL3Step(4)}
                        >
                          Sí, continuemos →
                        </button>
                        <button
                          type="button"
                          className="cabina-consent-area__secondary"
                          onClick={() => setL3Step(4)}
                        >
                          Quizás más tarde
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDownloadSouvenir}
                        disabled={isSouvenirGenerating}
                        style={{
                          position: 'absolute',
                          bottom: '18%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'none',
                          border: 'none',
                          cursor: isSouvenirGenerating ? 'wait' : 'pointer',
                          opacity: isSouvenirGenerating ? 0.6 : 1,
                        }}
                      >
                        {PORTAL_ICON_URL[portal] && (
                          <img
                            src={PORTAL_ICON_URL[portal]}
                            alt={portal}
                            style={{ width: '4rem', height: '4rem', borderRadius: '1rem', objectFit: 'cover', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}
                          />
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(251,191,36,0.9)', letterSpacing: '0.05em' }}>
                          {isSouvenirGenerating ? 'Generando…' : 'Agregar recordatorio'}
                        </span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

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
                          className="font-display leading-snug text-amber-300/90 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]"
                          style={{ fontSize: 'clamp(1.3rem, 2.3vw, 2.1rem)' }}
                        >
                          {convQuestion}
                        </p>
                      )}
                    </div>

                    <div
                      aria-hidden="true"
                      className="hidden lg:block mx-8 mb-5 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
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
                              <h3 className="font-display text-2xl leading-tight tracking-tight text-amber-300">
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
                  /* ── Cuaderno holográfico ── */
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
                      isMobileViewport={isMobileViewport}
                      onStartBitacora={() => { setHolograficoOpen(false); setBitacoraOpen(true); }}
                      onNavigate={(showcaseId) => { setHolograficoOpen(false); handleClose(); onNavigateToRecommendation?.(showcaseId); }}
                      onPosterChange={setHolograficoPoster}
                    />
                  </motion.div>
                ) : bitacoraOpen ? (
                  /* ── Bitácora individual: preguntas diferidas ── */
                  <motion.div
                    key="bitacora-questions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div aria-hidden="true" className="h-16 sm:h-24 lg:hidden" />

                    <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14">
                      <p className="mb-3 text-[0.62rem] uppercase tracking-[0.32em] text-white/50">
                        Cuaderno holográfico
                      </p>
                      <p
                        className="font-display leading-snug text-amber-300/90 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]"
                        style={{ fontSize: 'clamp(1.3rem, 2.3vw, 2.1rem)' }}
                      >
                        {bitacoraStep === 'p1' && '¿Hay algo de esta experiencia que haya regresado por su cuenta?'}
                        {bitacoraStep === 'scale' && '¿Con qué fuerza sigue ahí?'}
                        {bitacoraStep === 'p2' && (bitacoraQuestionLoading ? '…' : (bitacoraP2Question || 'Si volvió, ¿dónde te encontró?'))}
                        {bitacoraStep === 'p3' && (bitacoraQuestionLoading ? '…' : (bitacoraP3Question || '¿Hay algo que ahora veas de otra manera?'))}
                      </p>
                    </div>

                    <div aria-hidden="true" className="hidden lg:block mx-8 mb-5 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />

                    <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-10 lg:px-10">
                      <div className="space-y-3">

                        {/* Mobile: etiqueta de paso */}
                        <div className="lg:hidden space-y-2">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70">
                            Cuaderno holográfico
                          </div>
                          <h3 className="font-display text-2xl leading-tight tracking-tight text-amber-300">
                            {bitacoraStep === 'p1' && '¿Hay algo de esta experiencia que haya regresado por su cuenta? Una imagen, una frase, una sensación.'}
                            {bitacoraStep === 'scale' && '¿Con qué fuerza sigue ahí?'}
                            {bitacoraStep === 'p2' && (bitacoraQuestionLoading ? '…' : (bitacoraP2Question || 'Si volvió, ¿dónde te encontró? ¿Qué estabas haciendo o con quién estabas?'))}
                            {bitacoraStep === 'p3' && (bitacoraQuestionLoading ? '…' : (bitacoraP3Question || 'Después de esta experiencia, ¿hay algo que ahora veas de otra manera? También puede ser que nada haya cambiado.'))}
                          </h3>
                        </div>

                        {/* P1 */}
                        {bitacoraStep === 'p1' && (
                          <>
                            <textarea
                              value={bitacoraP1}
                              onChange={(e) => setBitacoraP1(e.target.value)}
                              rows={4}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder="Una imagen, una frase, una sensación…"
                            />
                            <p className="text-xs text-slate-400/70">¿Regresó algo?</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={!bitacoraP1.trim()}
                                onClick={() => { setBitacoraAfirmativa(true); setBitacoraStep('scale'); void fetchNextBitacoraQuestion('p2', bitacoraP1); }}
                                className="flex-1 rounded-full border border-amber-400/50 bg-amber-900/20 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-100/90 transition hover:bg-amber-900/35 disabled:opacity-40"
                              >
                                Sí, regresó algo
                              </button>
                              <button
                                type="button"
                                disabled={!bitacoraP1.trim() || bitacoraSubmitting}
                                onClick={() => { setBitacoraAfirmativa(false); void handleBitacoraSubmit(); }}
                                className="flex-1 rounded-full border border-white/15 bg-black/30 px-4 py-2.5 text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-40"
                              >
                                Todavía no
                              </button>
                            </div>
                          </>
                        )}

                        {/* Escala */}
                        {bitacoraStep === 'scale' && (
                          <>
                            <div className="flex items-end justify-between gap-1 pt-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => { setBitacoraIntensidad(n); setBitacoraStep('p2'); }}
                                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition ${
                                    bitacoraIntensidad === n
                                      ? 'border-amber-400/60 bg-amber-900/30 text-amber-200'
                                      : 'border-white/10 bg-black/30 text-slate-300/70 hover:border-white/20 hover:bg-black/45'
                                  }`}
                                >
                                  <span className="text-base font-semibold">{n}</span>
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-between text-[0.6rem] text-slate-500/80 px-1">
                              <span>Apenas un roce</span>
                              <span>No me ha soltado</span>
                            </div>
                          </>
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
                              {bitacoraSubmitting ? 'Guardando…' : 'Cerrar la bitácora'}
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

                      </div>
                    </div>
                  </motion.div>
                ) : l1Done ? (
                  /* ── Dashboard de viaje ── */
                  <motion.div
                    key="dashboard"
                    className="flex flex-col gap-5 px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-10"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Header */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                          Laboratorio #GatoEncerrado
                        </div>
                      </div>
                      {/* Título + descripción — se ocultan en móvil cuando el acordeón L2 está abierto */}
                      <h2
                        id="resonance-modal-title"
                        className={`font-display text-3xl text-white lg:text-4xl ${!l2ConvDone && l2q && !l2Selection && l2Open ? 'hidden' : ''}`}
                      >
                        Tu resonancia
                      </h2>
                      <p className={`text-sm leading-relaxed text-slate-200/90 ${!l2ConvDone && l2q && !l2Selection && l2Open ? 'hidden' : ''}`}>
                        Cada etapa aporta datos valiosos para comprender cómo habitamos las emociones delante de otros.
                      </p>

                      {/* Pregunta L2 + chips — móvil, solo cuando el acordeón está abierto */}
                      {!l2ConvDone && l2q && !l2Selection && l2Open && (
                        <>
                          <h2 className="font-display text-2xl leading-snug text-amber-300">
                            {l2q.question}
                          </h2>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {l2q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleLevel2Select(opt)}
                                disabled={l2Submitting}
                                className="rounded-full border border-amber-400/30 bg-amber-900/20 px-3 py-1 text-xs text-amber-100/90 transition hover:border-amber-400/55 hover:bg-amber-900/35 hover:text-amber-50 disabled:opacity-40"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Niveles */}
                    <div className="relative flex flex-col gap-0">
                      <div
                        aria-hidden="true"
                        className="absolute left-[1.6rem] top-10 h-[calc(100%-5rem)] w-px border-l-2 border-dashed border-white/15"
                      />

                      {LEVELS.map((level, i) => {
                        const Icon = level.icon;
                        const isL1 = i === 0;
                        const isL2 = i === 1;
                        const isL3 = i === 2;
                        // l3RecSeen: la recomendación ya fue recibida → congela el acordeón y muestra coleccionable
                        // bitacoraCompleted: el usuario cerró la bitácora → pone el círculo en verde
                        const l3RecSeen    = isL3 && Boolean(l3Rec?.step3) && !l3Rec?.error;
                        const isCompleted  = isL1 || (isL2 && l2ConvDone) || (isL3 && bitacoraCompleted);
                        const isAvailable  = (isL2 && !l2ConvDone) || (isL3 && l2ConvDone && !bitacoraCompleted);
                        const levelIsOpen  = isCompleted || (isL2 && !l2ConvDone && l2Open) || (isL3 && l2ConvDone && (l3Open || l3RecSeen));
                        const canToggle    = (isL2 && !l2ConvDone) || (isL3 && l2ConvDone && !l3RecSeen && !bitacoraCompleted);
                        const handleToggle = isL3 ? handleL3Toggle : () => setL2Open((v) => !v);

                        return (
                          <motion.div
                            key={level.num}
                            className="flex items-start gap-4 py-3"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
                          >
                            {/* Número */}
                            <div className={`relative z-10 flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                              isCompleted
                                ? `bg-gradient-to-br ${gradient} text-white shadow-[0_0_18px_rgba(0,0,0,0.4)]`
                                : isAvailable
                                  ? 'border-2 border-white/30 bg-black/55 text-white/70'
                                  : 'border-2 border-white/20 bg-black/40 text-white/40'
                            }`}>
                              {level.num}
                            </div>

                            {/* Card con acordeón */}
                            <div className={`flex min-w-0 flex-1 flex-col rounded-2xl border transition-colors ${
                              isCompleted
                                ? 'border-white/20 bg-black/55'
                                : isAvailable
                                  ? 'border-white/15 bg-black/50'
                                  : 'border-white/[0.08] bg-black/35'
                            }`}>
                              {/* Fila cabecera — siempre visible */}
                              <div
                                role={canToggle ? 'button' : undefined}
                                tabIndex={canToggle ? 0 : undefined}
                                className={`flex items-center gap-3 px-4 py-3 ${canToggle ? 'cursor-pointer select-none' : ''}`}
                                onClick={canToggle ? handleToggle : undefined}
                                onKeyDown={canToggle ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } } : undefined}
                              >
                                {/* Ícono */}
                                <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full ${
                                  isCompleted
                                    ? `bg-gradient-to-br ${gradient} shadow-[0_0_10px_rgba(0,0,0,0.25)]`
                                    : isAvailable
                                      ? 'border border-white/25 bg-black/40'
                                      : 'border border-white/8 bg-black/25'
                                }`}>
                                  {isCompleted || isAvailable
                                    ? <Icon size={13} className="text-white" />
                                    : <Lock size={11} className="text-white/20" />
                                  }
                                </div>

                                {/* Texto */}
                                <div className="min-w-0 flex-1">
                                  <p className={`truncate text-[0.57rem] uppercase tracking-[0.1em] leading-none mb-0.5 ${
                                    isCompleted ? 'text-slate-300/85' : 'text-slate-400/70'
                                  }`}>
                                    {level.eyebrow}
                                  </p>
                                  <p className={`font-display text-sm leading-tight ${
                                    isCompleted || isAvailable ? 'text-white' : 'text-white/30'
                                  }`}>
                                    {level.title}
                                  </p>
                                </div>

                                {/* Badge + chevron */}
                                <div className="shrink-0 flex items-center gap-1.5">
                                  {isAvailable ? (
                                    <>
                                      <span className="relative inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-500/20 px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.1em] text-sky-100 leading-none shadow-[0_0_10px_rgba(56,189,248,0.35)]">
                                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                                          <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-300" />
                                        </span>
                                        Activo
                                      </span>
                                      <ChevronDown
                                        size={13}
                                        className={`text-white/30 transition-transform duration-200 ${levelIsOpen ? 'rotate-180' : ''}`}
                                      />
                                    </>
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
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 space-y-3">
                                      {isL1 && (
                                        <p className="text-xs leading-relaxed text-slate-300/90">{level.desc}</p>
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

                                          {/* Pasos — ocultos en desktop cuando el gato los muestra en el panel */}
                                          {/* Paso 1 — Orientación */}
                                          {!l3Loading && l3Rec && !l3Rec.error && !l3Rec.all_complete && l3Step === 1 && !l3Active && (
                                            <>
                                              <p className="text-xs leading-relaxed text-slate-300/90">
                                                {l3Rec.step1}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => setL3Step(2)}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-600/40 bg-slate-800/30 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-700/40"
                                              >
                                                Siguiente <ArrowRight size={11} />
                                              </button>
                                            </>
                                          )}

                                          {/* Paso 2 — Impacto */}
                                          {!l3Loading && l3Rec && !l3Rec.error && !l3Rec.all_complete && l3Step === 2 && !l3Active && (
                                            <>
                                              <p className="text-xs leading-relaxed text-slate-300/90">
                                                {l3Rec.step2}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => setL3Step(3)}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-600/40 bg-slate-800/30 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-700/40"
                                              >
                                                Siguiente <ArrowRight size={11} />
                                              </button>
                                            </>
                                          )}

                                          {/* Paso 3 — Coleccionable (muestra después de que el usuario pasa por la cabina) */}
                                          {l3RecSeen && (l3Step >= 4 || l3BubbleClosed) && !l3Rec.all_complete && (
                                            <>
                                              <p className="text-xs leading-relaxed text-slate-300/90">
                                                Este recorrido ha concluido.
                                              </p>
                                              <p className="text-xs leading-relaxed text-slate-400/80">
                                                Las respuestas registradas permiten estudiar cómo las experiencias narrativas son interpretadas, recordadas y resignificadas por distintas personas.
                                              </p>

                                              {/* Consentimiento WhatsApp — aparece si aún no ha dado número */}
                                              {!bitacoraCompleted && !bitacoraConsented && (
                                                <div className="space-y-2">
                                                  {!showPhoneInput ? (
                                                    <>
                                                      <p className="text-xs leading-relaxed text-slate-400/80">
                                                        Tu Cuaderno holográfico estará disponible en breve. ¿Te avisamos por WhatsApp?
                                                      </p>
                                                      <button
                                                        type="button"
                                                        onClick={() => setShowPhoneInput(true)}
                                                        className="w-full rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs text-slate-200 transition hover:bg-black/50"
                                                      >
                                                        Avísame por WhatsApp →
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <p className="text-xs leading-relaxed text-slate-400/80">
                                                        ¿A qué número te enviamos el aviso?
                                                      </p>
                                                      <div className="flex gap-2">
                                                        <input
                                                          type="tel"
                                                          value={phoneInput}
                                                          onChange={(e) => setPhoneInput(e.target.value)}
                                                          placeholder="+52 55 0000 0000"
                                                          className="min-w-0 flex-1 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-white/40"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() => void handleBitacoraConsent('whatsapp', phoneInput.trim())}
                                                          disabled={phoneInput.trim().length < 8}
                                                          className="shrink-0 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs text-slate-200 transition hover:bg-black/50 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                          Enviar →
                                                        </button>
                                                      </div>
                                                    </>
                                                  )}
                                                  {import.meta.env.DEV && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const now = new Date().toISOString();
                                                        lsPatch(portal, { bitacora_consented: true, bitacora_available_at: now });
                                                        writeGlobalConsent();
                                                        setBitacoraConsented(true);
                                                        setBitacoraAvailableAt(now);
                                                      }}
                                                      className="text-[10px] text-slate-500/60 underline underline-offset-2 hover:text-slate-400/80"
                                                    >
                                                      [dev] bypass envío de número
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {/* Cuaderno holográfico — disponible tras dar consent */}
                                          {!bitacoraCompleted && bitacoraConsented && (
                                            <button
                                              type="button"
                                              onClick={() => { setHolograficoOpen(true); setHolograficoPoster(portal); }}
                                              className="w-full rounded-full border border-amber-400/60 bg-amber-900/25 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-900/40"
                                            >
                                              Abrir cuaderno →
                                            </button>
                                          )}

                                          {/* Bitácora — completada */}
                                          {bitacoraCompleted && (
                                            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                                              <Check size={12} className="shrink-0 text-emerald-400/70" />
                                              <span className="italic">Registro completo</span>
                                            </div>
                                          )}

                                          {/* Dev reset — siempre visible cuando hay rec */}
                                          {import.meta.env.DEV && l3Rec && !l3Rec.error && !l3Rec.all_complete && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                lsPatch(portal, { l3_recommendation: undefined, bitacora_consented: undefined, bitacora_available_at: undefined });
                                                setL3Rec(null);
                                                setL3Step(1);
                                                setL3Open(false);
                                                setBitacoraConsented(false);
                                                setBitacoraAvailableAt(null);
                                                setShowPhoneInput(false);
                                                setPhoneInput('');
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
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                          <Check size={12} className="shrink-0 text-emerald-400/70" />
                                          <span className="italic">Conversación completada</span>
                                        </div>
                                      )}
                                      {isL2 && !l2ConvDone && l2q && !l2Selection && (
                                        <p className="text-xs leading-relaxed text-slate-400/80">
                                          Elige una opción arriba para continuar hacia la experiencia narrativa.
                                        </p>
                                      )}
                                      {isL2 && !l2ConvDone && l2Selection && (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <Check size={12} className="shrink-0 text-emerald-400/70" />
                                            <span className="italic">{l2Selection}</span>
                                          </div>
                                          <p className="text-xs leading-relaxed text-slate-400/80">
                                            {l2q?.l2Desc ?? level.desc}
                                          </p>
                                        </div>
                                      )}
                                      {isL2 && !l2ConvDone && l2Selection && onOpenNarrative && (
                                        <motion.button
                                          type="button"
                                          onClick={handleOpenNarrativeExperience}
                                          className="w-full flex flex-col items-center gap-3 py-2 transition active:scale-[0.98]"
                                          initial={{ opacity: 0, scale: 0.92, y: 8 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.2 }}
                                        >
                                          <img
                                            src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png"
                                            alt="GAToken"
                                            className="h-20 w-20 lg:h-32 lg:w-32 animate-[spin_8s_linear_0s_infinite_reverse] drop-shadow-[0_0_22px_rgba(251,191,36,0.6)]"
                                          />
                                          <span className="text-sm font-semibold tracking-wide text-amber-200">
                                            {l2NarrativeOpened ? 'Activar Artefacto' : 'Activar Artefacto'}
                                          </span>
                                        </motion.button>
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
                        Tu información es anónima y se usa solo con fines de investigación.{' '}
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
                          Laboratorio #GatoEncerrado
                        </div>
                        <p
                          className="font-display leading-snug text-amber-300/90 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]"
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
                      className="hidden lg:block mx-8 mb-5 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
                    />

                    {/* Campos */}
                    <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-10 lg:px-10">
                      <div className="w-full space-y-3">
                        <div className="space-y-0.5 lg:hidden">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                            Laboratorio #GatoEncerrado
                          </div>
                          <h3
                            id="resonance-modal-title"
                            className="font-display text-3xl leading-tight tracking-tight text-amber-300"
                          >
                            {question ?? 'Formas de habitar'}
                          </h3>
                        </div>

                        <form
                          onSubmit={handleSubmit}
                          className="space-y-2.5"
                        >
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-200">Tu nombre</label>
                            <input
                              name="nombre"
                              value={formData.nombre}
                              onChange={handleChange}
                              required
                              className="form-surface w-full px-3 py-2 text-sm"
                              placeholder="¿Cómo te llamas?"
                            />
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
                          <button
                            ref={submitBtnRef}
                            type="submit"
                            disabled={submitting}
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

          {/* ── Columna derecha: poster — solo desktop ── */}
          <div className="hidden lg:block lg:w-[42%] shrink-0 relative overflow-hidden">
            {/* Poster — cambia al portal seleccionado en el holográfico */}
            <img
              src={holograficoOpen ? (PORTAL_POSTER[holograficoPoster] ?? poster) : poster}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-top transition-all duration-500"
              style={{
                mixBlendMode: 'plus-lighter',
                opacity: holograficoOpen ? 1 : l3Active ? 0 : (l2NarrativeOpened && convQuestion !== null && !l2ConvDone) ? 0.5 : 1,
              }}
            />
            {/* Gato de la cabina — aparece cuando L3 está activo */}
            <img
              src={CAT_CABINA_URL}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
              style={{ opacity: l3Active ? 1 : 0 }}
            />
            {/* Burbuja desktop */}
            <AnimatePresence>
              {l3Active && !l3BubbleClosed && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="cabina-bubble" style={{ pointerEvents: 'auto' }}>
                    <p className="cabina-bubble__preludio">El laboratorio te habla</p>
                    <p className="cabina-bubble__texto">{l3BubbleText}</p>
                    {l3Step === 4 && (
                      <button type="button" className="cabina-bubble__cta" onClick={handleNavigateToRecommendation}>
                        Explorar {l3Rec.forma}
                      </button>
                    )}
                  </div>
                  {l3Step < 3 && (
                    <div className="cabina-consent-desktop-area" style={{ pointerEvents: 'auto' }}>
                      <button
                        type="button"
                        className="cabina-bubble__siguiente"
                        onClick={() => setL3Step(l3Step + 1)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                  {l3Step === 3 && (
                    <div className="cabina-consent-desktop-area" style={{ pointerEvents: 'auto' }}>
                      <button
                        type="button"
                        className="cabina-consent-area__primary"
                        onClick={() => setL3Step(4)}
                        style={{ width: '100%' }}
                      >
                        Sí, continuemos →
                      </button>
                      <button
                        type="button"
                        className="cabina-consent-area__secondary"
                        onClick={() => setL3Step(4)}
                        style={{ width: '100%' }}
                      >
                        Quizás más tarde
                      </button>
                    </div>
                  )}
                  {l3Step === 4 && (
                    <div className="cabina-consent-desktop-area" style={{ pointerEvents: 'auto' }}>
                      <button
                        type="button"
                        onClick={handleDownloadSouvenir}
                        disabled={isSouvenirGenerating}
                        style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: isSouvenirGenerating ? 'wait' : 'pointer', opacity: isSouvenirGenerating ? 0.6 : 1 }}
                      >
                        {PORTAL_ICON_URL[portal] && (
                          <img
                            src={PORTAL_ICON_URL[portal]}
                            alt={portal}
                            style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', objectFit: 'cover', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}
                          />
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(251,191,36,0.9)', letterSpacing: '0.05em' }}>
                          {isSouvenirGenerating ? 'Generando…' : 'Agregar recordatorio'}
                        </span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
};

export default ResonanceModal;
