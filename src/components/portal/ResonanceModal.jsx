import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame, PawPrint, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';

const PORTAL_GRADIENT = {
  obra:         'from-purple-400 via-fuchsia-500 to-rose-500',
  literatura:   'from-emerald-400 via-teal-500 to-cyan-500',
  artesanias:   'from-amber-400 via-orange-500 to-rose-500',
  grafico:      'from-fuchsia-400 via-purple-500 to-indigo-500',
  cine:         'from-rose-500 via-red-500 to-fuchsia-500',
  sonoridades:  'from-sky-400 via-cyan-500 to-indigo-500',
  movimiento:   'from-sky-400 via-emerald-500 to-cyan-500',
  juegos:       'from-amber-400 via-yellow-500 to-orange-500',
  oraculo:      'from-indigo-400 via-violet-500 to-purple-500',
};

const PORTAL_BLOOM = {
  obra:         ['rgba(192,132,252,0.65)', 'rgba(244,114,182,0.4)'],
  literatura:   ['rgba(52,211,153,0.65)',  'rgba(34,211,238,0.4)'],
  artesanias:   ['rgba(251,191,36,0.65)',  'rgba(244,114,182,0.4)'],
  grafico:      ['rgba(232,121,249,0.65)', 'rgba(99,102,241,0.4)'],
  cine:         ['rgba(244,63,94,0.65)',   'rgba(232,121,249,0.4)'],
  sonoridades:  ['rgba(56,189,248,0.65)',  'rgba(99,102,241,0.4)'],
  movimiento:   ['rgba(56,189,248,0.65)',  'rgba(52,211,153,0.4)'],
  juegos:       ['rgba(251,191,36,0.65)',  'rgba(249,115,22,0.4)'],
  oraculo:      ['rgba(129,140,248,0.65)', 'rgba(168,85,247,0.4)'],
};

const LEVELS = [
  {
    num: 1,
    eyebrow: 'Antes de entrar',
    title: 'Primera intuición',
    desc: 'Respondiste antes de saber. Eso tiene valor científico.',
    pendingDesc: '¿Qué crees que sientes antes de ver esto?',
    icon: Eye,
  },
  {
    num: 2,
    eyebrow: 'Después de la experiencia',
    title: 'Resonancia activa',
    desc: 'La experiencia te movió algo. Aquí quedó registrado.',
    pendingDesc: 'Vuelve después de explorar el miniverso.',
    icon: Flame,
  },
  {
    num: 3,
    eyebrow: 'Días después',
    title: 'Huella real',
    desc: 'Algo de esto siguió contigo fuera de la pantalla.',
    pendingDesc: 'Vuelve en unos días. Queremos saber si algo cambió.',
    icon: PawPrint,
  },
];

const ResonanceModal = ({ open, onClose, question, portal }) => {
  const modalRef = useRef(null);
  const submitBtnRef = useRef(null);
  const { user } = useAuth();
  const [formData, setFormData] = useState({ nombre: '', email: '', respuesta: '' });
  const [status, setStatus] = useState('idle');
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();

  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const bloom = PORTAL_BLOOM[portal] ?? PORTAL_BLOOM.obra;

  useEffect(() => {
    if (!open) return;
    modalRef.current?.parentElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (user) {
      const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
      const email = user.email ?? '';
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || name,
        email: prev.email || email,
      }));
    }
  }, [open, user]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id: ensureAnonId(),
        portal: portal ?? null,
        question: question ?? null,
        nombre: formData.nombre,
        email: formData.email,
        respuesta: formData.respuesta,
      });
    } catch (_) {}
    fireConfetti();
    setStatus('success');
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', respuesta: '' });
    setStatus('idle');
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="resonance-modal-title"
          className="absolute inset-0 z-50 rounded-[2.5rem] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Fondo bloom con identidad del miniverso */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 160% 55% at 50% -5%, ${bloom[0]}, ${bloom[1]} 45%, transparent 70%), linear-gradient(180deg, rgba(7,4,13,0.15) 0%, rgba(7,4,11,0.94) 52%, rgb(5,3,9) 100%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 backdrop-blur-[80px]"
            style={{ background: 'rgba(5,3,9,0.45)' }}
          />

          {/* Confetti */}
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

          <div className="relative z-10 h-full overflow-y-auto">
            {status === 'success' ? (
              /* ── Dashboard de viaje ── */
              <motion.div
                className="flex flex-col gap-5 px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-12"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
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
                  {/* Línea punteada conectora */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[1.6rem] top-10 h-[calc(100%-5rem)] w-px border-l-2 border-dashed border-white/15"
                  />

                  {LEVELS.map((level, i) => {
                    const Icon = level.icon;
                    const isCompleted = i === 0;
                    const isLocked = i === 2;

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
                            : 'border-2 border-white/20 bg-black/40 text-white/40'
                        }`}>
                          {level.num}
                        </div>

                        {/* Card */}
                        <div className={`flex flex-1 flex-col gap-2.5 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3 ${
                          isCompleted ? 'border-white/15 bg-white/5' : 'border-white/8 bg-white/[0.03]'
                        }`}>
                          {/* Fila superior: icono + texto */}
                          <div className="flex items-start gap-3 sm:flex-1 sm:min-w-0">
                            <div className={`mt-0.5 shrink-0 rounded-xl p-2 ${
                              isCompleted ? `bg-gradient-to-br ${gradient} bg-opacity-20` : 'bg-white/5'
                            }`}>
                              <Icon size={18} className={isCompleted ? 'text-white' : 'text-white/30'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/70">
                                {level.eyebrow}
                              </p>
                              <p className={`font-display text-base leading-tight ${isCompleted ? 'text-white' : 'text-white/50'}`}>
                                {level.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-400/60">
                                {isCompleted ? level.desc : level.pendingDesc}
                              </p>
                            </div>
                          </div>

                          {/* Estado — fila propia en mobile, columna en desktop */}
                          <div className="flex justify-end sm:justify-start sm:shrink-0">
                            {isCompleted ? (
                              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.25em] text-emerald-300">
                                Completado
                              </span>
                            ) : isLocked ? (
                              <span className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/25">
                                <Lock size={12} />
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-400/30 bg-amber-500/8 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.25em] text-amber-300/70">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400/60" />
                  <p className="text-xs leading-relaxed text-slate-400/60">
                    Tu información es anónima y se usa solo con fines de investigación.{' '}
                    <span className="text-purple-300/70">Gracias por ser parte de este experimento colectivo.</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ── Formulario ── */
              <div className="lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
                <div className="lg:flex-1 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-6">
                  <div aria-hidden="true" className="h-32 sm:h-40 lg:hidden" />
                  {question ? (
                    <p
                      className="hidden lg:block font-display text-center leading-snug text-amber-300/90 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]"
                      style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.4rem)' }}
                    >
                      {question}
                    </p>
                  ) : null}
                </div>

                <div aria-hidden="true" className="hidden lg:block mx-8 mb-4 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />

                <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-6 lg:px-8">
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

                    <form onSubmit={handleSubmit} className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
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
                        disabled={status === 'submitting'}
                        className="relative w-full rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50 lg:col-span-2"
                      >
                        {status === 'submitting' ? 'Enviando…' : 'Enviar'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResonanceModal;
