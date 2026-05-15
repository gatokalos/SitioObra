import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame, PawPrint, Lock, ShieldCheck, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';

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
    question: '¿Qué parte de Silvestre reconociste sin querer en ti?',
    options: [
      'una contradicción',
      'una forma de esconderme',
      'una necesidad de ser visto',
      'una incomodidad familiar',
      'una sensación de vacío',
      'no reconocí nada',
    ],
  },
  literatura: {
    question: '¿Qué frase te quedaste cargando — o qué preferiste no retener?',
    options: [
      'una frase sobre pérdida',
      'algo que me incomodó',
      'algo que sentí demasiado cercano',
      'una imagen que regresó después',
      'no se me quedó nada',
    ],
  },
  artesanias: {
    question: '¿Qué objeto apareció en tu mente mientras recorrías este miniverso?',
    options: [
      'algo roto',
      'algo cotidiano',
      'algo que parecía recuerdo',
      'algo que no entendí',
      'ninguno',
    ],
  },
  grafico: {
    question: '¿Qué imagen te quedaste mirando más tiempo del que planeabas?',
    options: [
      'un rostro',
      'una textura',
      'un color',
      'un vacío',
      'un detalle pequeño',
      'ninguna',
    ],
  },
  cine: {
    question: '¿Qué escena evitaste ver de frente — o no pudiste dejar de mirar?',
    options: [
      'una mirada',
      'un silencio',
      'una discusión',
      'algo demasiado íntimo',
      'algo que me recordó otra cosa',
      'ninguna',
    ],
  },
  sonoridades: {
    question: '¿Hubo algún sonido que siguiera contigo después de cerrar la experiencia?',
    options: [
      'una voz',
      'silencio',
      'respiración',
      'ruido ambiental',
      'música',
      'no lo sé',
      'otro',
    ],
  },
  movimiento: {
    question: '¿Qué hizo tu cuerpo que no le pediste?',
    options: [
      'respiré distinto',
      'me tensé',
      'me moví sin pensarlo',
      'me quedé inmóvil',
      'sentí incomodidad',
      'no noté nada',
    ],
  },
  juegos: {
    question: '¿Qué camino elegiste — y cuál evitaste?',
    options: [
      'evitar algo',
      'regresar',
      'seguir explorando',
      'cerrar rápido',
      'elegir por intuición',
      'no sentí que estuviera eligiendo',
    ],
  },
  oraculo: {
    question: '¿Qué terminaste diciéndole al oráculo sin haberlo planeado?',
    options: [
      'algo que no había dicho antes',
      'una duda',
      'un recuerdo',
      'algo incómodo',
      'una contradicción',
      'no apareció nada',
    ],
  },
};

/* ─── Estructura de niveles ───────────────────────────────────────────── */

const LEVELS = [
  {
    num: 1,
    eyebrow: 'Antes de entrar',
    title: 'Primera intuición',
    desc: 'Respondiste antes de saber. Eso tiene valor científico.',
    icon: Eye,
  },
  {
    num: 2,
    eyebrow: 'Después de la experiencia',
    title: 'Resonancia activa',
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

const ResonanceModal = ({ open, onClose, question, portal, onOpenNarrative, narrativeCTALabel }) => {
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
  // checking = true mientras consultamos Supabase para respuestas anteriores al deploy de localStorage
  const [checking, setChecking] = useState(() => !lsRead(portal).l1);

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
            lsPatch(portal, { l1: Date.now() });
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
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id:   ensureAnonId(),
        portal:    portal ?? null,
        question:  question ?? null,
        nombre:    formData.nombre,
        email:     formData.email,
        respuesta: formData.respuesta,
        level:     1,
      });
    } catch (_) {}
    lsPatch(portal, { l1: Date.now() });
    fireConfetti();
    setL1Done(true);
    setSubmitting(false);
  };

  /* Experiencia narrativa — abre la experiencia y cierra el modal */
  const handleOpenNarrativeExperience = () => {
    onClose?.();
    onOpenNarrative?.();
  };

  /* Nivel 2 — opciones */
  const handleLevel2Select = async (option) => {
    if (l2Selection || l2Submitting) return;
    setL2Selection(option); // optimistic
    setL2Submitting(true);
    lsPatch(portal, { l2_option: option, l2_ts: Date.now() });
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id:   ensureAnonId(),
        portal:    portal ?? null,
        question:  l2q?.question ?? null,
        respuesta: option,
        level:     2,
      });
    } catch (_) {}
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
            ✕
          </button>

          {/* ── Columna izquierda ── */}
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {/* Poster en mobile (fondo con fade) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden"
              style={{ backgroundImage: `url(${poster})`, backgroundPosition: 'center top', backgroundSize: 'cover' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden"
              style={{ background: 'linear-gradient(180deg, rgba(7,4,13,0.25) 0%, rgba(7,4,11,0.88) 45%, rgb(5,3,9) 100%)' }}
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
                      <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                        Laboratorio
                      </div>
                      <h2 className="font-display text-3xl text-white lg:text-4xl">
                        Tu viaje personal
                      </h2>
                      <p className="text-sm leading-relaxed text-slate-300/75">
                        Cada etapa aporta datos valiosos para comprender cómo habitamos las emociones delante de otros.
                      </p>
                    </div>

                    {/* Niveles */}
                    <div className="relative flex flex-col gap-0">
                      <div
                        aria-hidden="true"
                        className="absolute left-[1.6rem] top-10 h-[calc(100%-5rem)] w-px border-l-2 border-dashed border-white/15"
                      />

                      {LEVELS.map((level, i) => {
                        const Icon = level.icon;

                        const isL1 = i === 0; // siempre completado al estar en dashboard
                        const isL2 = i === 1;
                        const isL3 = i === 2;

                        const isCompleted = isL1 || (isL2 && !!l2Selection);
                        const isAvailable = isL2 && !l2Selection;

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
                                  ? `border-2 border-white/30 bg-white/5 text-white/70`
                                  : 'border-2 border-white/20 bg-black/40 text-white/40'
                            }`}>
                              {level.num}
                            </div>

                            {/* Card */}
                            <div className={`flex flex-1 flex-col gap-2.5 rounded-2xl border px-4 py-3.5 ${
                              isCompleted
                                ? 'border-white/15 bg-white/5'
                                : isAvailable
                                  ? 'border-white/12 bg-white/[0.04]'
                                  : 'border-white/8 bg-white/[0.03]'
                            }`}>
                              {/* Fila: icono + texto + badge */}
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${
                                  isCompleted
                                    ? `bg-gradient-to-br ${gradient} bg-opacity-20`
                                    : isAvailable
                                      ? 'bg-white/8'
                                      : 'bg-white/5'
                                }`}>
                                  <Icon size={18} className={isCompleted || isAvailable ? 'text-white' : 'text-white/30'} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/70">
                                    {level.eyebrow}
                                  </p>
                                  <p className={`font-display text-base leading-tight ${isCompleted || isAvailable ? 'text-white' : 'text-white/50'}`}>
                                    {level.title}
                                  </p>
                                  {isL1 && (
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400/60">
                                      {level.desc}
                                    </p>
                                  )}
                                  {isL3 && (
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400/60">
                                      {level.pendingDesc}
                                    </p>
                                  )}
                                </div>

                                {/* Badge de estado */}
                                <div className="shrink-0">
                                  {isCompleted ? (
                                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.25em] text-emerald-300">
                                      Completado
                                    </span>
                                  ) : isAvailable ? (
                                    <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.25em] text-sky-300/80">
                                      Disponible
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/25">
                                      <Lock size={12} />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Nivel 2: pregunta + opciones */}
                              {isL2 && l2q && !l2Selection && (
                                <div className="space-y-2 pt-1">
                                  <p className="text-xs leading-relaxed text-slate-300/80">
                                    {l2q.question}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {l2q.options.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleLevel2Select(opt)}
                                        disabled={l2Submitting}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300/75 transition hover:border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Nivel 2: opción seleccionada */}
                              {isL2 && l2Selection && (
                                <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-400/70">
                                  <Check size={12} className="shrink-0 text-emerald-400/70" />
                                  <span className="italic">{l2Selection}</span>
                                  {/* TODO: textarea con pregunta de IA */}
                                </div>
                              )}

                              {/* Nivel 2: botón ámbar de experiencia — recompensa por contestar Nivel 1 */}
                              {isL2 && onOpenNarrative && (
                                <motion.button
                                  type="button"
                                  onClick={handleOpenNarrativeExperience}
                                  className="mt-1 w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-3 text-sm font-semibold tracking-wide text-amber-200 transition hover:bg-amber-500/20"
                                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.45 }}
                                  whileHover={{ boxShadow: '0 8px_40px_rgba(251,191,36,0.25)' }}
                                >
                                  {narrativeCTALabel ?? 'Abrir experiencia narrativa'}
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Footer privacidad */}
                    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400/60" />
                      <p className="text-xs leading-relaxed text-slate-400/60">
                        Tu información es anónima y se usa solo con fines de investigación.{' '}
                        <span className="text-purple-300/70">Gracias por ser parte de este experimento colectivo.</span>
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
                      <div className="hidden lg:block lg:px-10 lg:pb-5 lg:pt-14">
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
                        <div className="space-y-0.5">
                          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                            Laboratorio
                          </div>
                          <h3
                            id="resonance-modal-title"
                            className="font-display leading-tight tracking-tight text-white"
                            style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)' }}
                          >
                            Resonancia colectiva
                          </h3>
                        </div>

                        <form
                          onSubmit={handleSubmit}
                          className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0"
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
                            <label className="text-xs font-medium text-slate-200">Correo electrónico</label>
                            <input
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="form-surface w-full px-3 py-2 text-sm"
                              placeholder="nombre@correo.com"
                            />
                          </div>
                          <div className="space-y-1 lg:col-span-2">
                            <label className="text-xs font-medium text-slate-200">Tu intuición</label>
                            <textarea
                              name="respuesta"
                              value={formData.respuesta}
                              onChange={handleChange}
                              required
                              rows={2}
                              className="form-surface w-full resize-none px-3 py-2 text-sm"
                              placeholder={question ?? '¿Qué te resuena?'}
                            />
                          </div>
                          <button
                            ref={submitBtnRef}
                            type="submit"
                            disabled={submitting}
                            className="relative w-full rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50 lg:col-span-2"
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
              className="h-full w-full object-cover object-top"
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
