import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame, PawPrint, Lock, ShieldCheck, Check, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import {
  registerTransmediaCreditEvent,
  createTransmediaIdempotencyKey,
} from '@/services/transmediaCreditsService';
import { OBRA_VOICE_MIN_GAT } from '@/components/transmedia/transmediaConstants';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

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

const BASE = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters';
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
    question: '¿Qué imágenes sientes que todavía te observan cuando vuelves a estar a solas?',
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
    desc: '✓ Respondiste antes de saber. Eso tiene valor científico.',
    icon: Eye,
  },
  {
    num: 2,
    eyebrow: 'Experiencia narrativa',
    title: 'Artefacto transmedia',
    icon: Flame,
  },
  {
    num: 3,
    eyebrow: 'Días después',
    title: 'Huella real',
    pendingDesc: 'Vuelve en unos días. Queremos saber si algo cambió.',
    icon: PawPrint,
  },
];

/* ─── localStorage helpers ────────────────────────────────────────────── */

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

const ResonanceModal = ({ open, onClose, question, portal, onOpenNarrative }) => {
  const modalRef = useRef(null);
  const submitBtnRef = useRef(null);
  const { user } = useAuth();
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
  const [gatRewarded, setGatRewarded] = useState(() => !!lsRead(portal).gat_ts);
  const [checking, setChecking] = useState(() => !lsRead(portal).l1);

  // Nivel 2 — conversación post-experiencia
  const [l2NarrativeOpened, setL2NarrativeOpened] = useState(() => !!lsRead(portal).l2_narrative_opened);
  const [l2ConvDone, setL2ConvDone] = useState(() => !!lsRead(portal).l2_conv_done);
  const [convQuestion, setConvQuestion] = useState(() => lsRead(portal).l2_current_question ?? null);
  const [convTurn, setConvTurn] = useState(() => lsRead(portal).l2_current_turn ?? 0);
  const [convAnswer, setConvAnswer] = useState('');
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState(false);

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
    fetch(`${OBRA_API_URL}/api/resonance/baseline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon_id:          anonId,
        miniverso_id:     portal,
        intuicion_answer: formData.respuesta,
      }),
    }).catch(() => {});

    // Otorga GAT si aún no se han concedido para este portal
    if (!lsRead(portal).gat_ts) {
      try {
        const { state, duplicate } = await registerTransmediaCreditEvent({
          eventKey:       `resonance:intuicion:${portal}`,
          amount:         OBRA_VOICE_MIN_GAT,
          oncePerIdentity: true,
          idempotencyKey: createTransmediaIdempotencyKey(`resonance:${portal}`),
        });
        if (!duplicate && state && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:external-credit-event', { detail: { state } })
          );
          lsPatch(portal, { gat_ts: Date.now() });
          setGatRewarded(true);
        }
      } catch (_) {}
    }

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
      });
      if (!res.ok) {
        console.error('[ResonanceModal] l2-turn HTTP error:', res.status);
        setConvError(true);
        setConvLoading(false);
        return;
      }
      const data = await res.json();
      if (data.done) {
        lsPatch(portal, { l2_conv_done: true, l2_current_question: null, l2_current_turn: null });
        setL2ConvDone(true);
        setConvQuestion(null);
      } else {
        lsPatch(portal, { l2_current_question: data.question, l2_current_turn: data.turn });
        setConvQuestion(data.question);
        setConvTurn(data.turn ?? 1);
        setConvAnswer('');
      }
    } catch (err) {
      console.error('[ResonanceModal] l2-turn error:', err);
      setConvError(true);
    }
    setConvLoading(false);
  }, [portal]);

  // Auto-arranca la conversación cuando el modal abre después de completar la experiencia
  useEffect(() => {
    if (!open) return;
    if (!l2NarrativeOpened || l2ConvDone || convQuestion !== null || convLoading) return;
    if (!lsRead(portal).experience_ts) return;
    void callL2Turn();
  }, [open, l2NarrativeOpened, l2ConvDone, convQuestion, convLoading, portal, callL2Turn]);

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

  /* ── render ── */
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
              background: `radial-gradient(ellipse 160% 45% at 50% -5%, ${bloom[0]}, ${bloom[1]} 40%, transparent 65%), rgb(5,3,9)`,
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
                              onClick={() => void callL2Turn()}
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
                          Laboratorio
                        </div>
                        {gatRewarded && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-cyan-200/90"
                          >
                            <Sparkles size={10} className="text-cyan-300" />
                            +{OBRA_VOICE_MIN_GAT} GAT
                          </motion.div>
                        )}
                      </div>
                      {/* Título + descripción — se ocultan en móvil cuando el acordeón L2 está abierto */}
                      <h2
                        id="resonance-modal-title"
                        className={`font-display text-3xl text-white lg:text-4xl ${!l2ConvDone && l2q && !l2Selection && l2Open ? 'hidden lg:block' : ''}`}
                      >
                        Tu viaje personal
                      </h2>
                      <p className={`text-sm leading-relaxed text-slate-200/90 ${!l2ConvDone && l2q && !l2Selection && l2Open ? 'hidden lg:block' : ''}`}>
                        Cada etapa aporta datos valiosos para comprender cómo habitamos las emociones delante de otros.
                      </p>

                      {/* Pregunta L2 + chips — móvil, solo cuando el acordeón está abierto */}
                      {!l2ConvDone && l2q && !l2Selection && l2Open && (
                        <>
                          <h2 className="font-display text-2xl leading-snug text-amber-300 lg:hidden">
                            {l2q.question}
                          </h2>
                          <div className="lg:hidden flex flex-wrap gap-1.5 pt-1">
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
                        const isCompleted = isL1 || (isL2 && l2ConvDone);
                        const isAvailable = isL2 && !l2ConvDone;
                        const isOpen = isCompleted || (isAvailable && l2Open);
                        const canToggle = isAvailable;

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
                                onClick={canToggle ? () => setL2Open((v) => !v) : undefined}
                                onKeyDown={canToggle ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setL2Open((v) => !v); } } : undefined}
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
                                      <span className="rounded-full border border-sky-400/30 bg-sky-900/50 px-1.5 py-0.5 text-[0.52rem] uppercase tracking-[0.1em] text-sky-200 leading-none">
                                        Activo
                                      </span>
                                      <ChevronDown
                                        size={13}
                                        className={`text-white/30 transition-transform duration-200 ${l2Open ? 'rotate-180' : ''}`}
                                      />
                                    </>
                                  ) : !isCompleted ? (
                                    <Lock size={11} className="text-white/[0.18]" />
                                  ) : null}
                                </div>
                              </div>

                              {/* Cuerpo colapsable */}
                              <AnimatePresence initial={false}>
                                {isOpen && (
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
                                        <p className="text-xs leading-relaxed text-slate-300/90">{level.pendingDesc}</p>
                                      )}
                                      {isL2 && l2ConvDone && (
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                          <Check size={12} className="shrink-0 text-emerald-400/70" />
                                          <span className="italic">Conversación completada</span>
                                        </div>
                                      )}
                                      {isL2 && !l2ConvDone && l2q && !l2Selection && (
                                        <div className="space-y-2">
                                          {/* Hint móvil — el acordeón no repite los chips del header */}
                                          <p className="lg:hidden text-xs leading-relaxed text-slate-400/80">
                                            Elige una opción arriba para continuar hacia la experiencia narrativa.
                                          </p>
                                          {/* Desktop: pregunta + chips */}
                                          <div className="hidden lg:block space-y-2">
                                            <p className="font-display text-sm leading-snug text-amber-300/90">
                                              {l2q.question}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
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
                                          </div>
                                        </div>
                                      )}
                                      {isL2 && !l2ConvDone && l2Selection && (
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                          <Check size={12} className="shrink-0 text-emerald-400/70" />
                                          <span className="italic">{l2Selection}</span>
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
                                            {l2NarrativeOpened ? 'Gastar mi energía' : 'Usar mi energía'}
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
                          Laboratorio
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
                            Laboratorio
                          </div>
                          <h3
                            id="resonance-modal-title"
                            className="font-display text-3xl leading-tight tracking-tight text-amber-300"
                          >
                            {question ?? 'Resonancia colectiva'}
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
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-top transition-opacity duration-500"
              style={{
                mixBlendMode: 'plus-lighter',
                opacity: (l2NarrativeOpened && convQuestion !== null && !l2ConvDone) ? 0.5 : 1,
              }}
            />
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
