import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Flame } from 'lucide-react';

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

const VitranaQuestionReveal = ({
  question,
  onAnswer,
  buttonLabel = 'Intuye tu respuesta',
  label = 'Resonancia Colectiva',
  autoReveal = false,
  portal = null,
  l2Done = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(autoReveal);
  const portalGradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';

  // Sincroniza si autoReveal llega tarde (p.ej. tras verificar Supabase)
  useEffect(() => {
    if (autoReveal) setIsRevealed(true);
  }, [autoReveal]);

  const reveal = () => setIsRevealed(true);

  return (
    <div className="flex flex-col gap-5">
      {label ? <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{label}</p> : null}

      {/* Wrapper para los badges flotantes */}
      <div className="relative">
        {(autoReveal || l2Done) && (
          <div className="absolute -top-5 right-2 z-10 flex items-center gap-1.5">
            {autoReveal && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                title="Nivel 1 completado"
              >
                <Eye size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
            {l2Done && (
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${portalGradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
                initial={{ opacity: 0, scale: 0.55, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.22 }}
                title="Nivel 2 completado"
              >
                <Flame size={20} className="text-white drop-shadow-sm" />
              </motion.div>
            )}
          </div>
        )}

        <div
          className="form-surface relative overflow-hidden px-6 py-8 cursor-pointer"
          onMouseEnter={reveal}
          onClick={reveal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') reveal(); }}
          aria-label="Revelar pregunta de resonancia"
        >
          <motion.div
            animate={{ filter: isRevealed ? 'blur(0px)' : 'blur(10px)' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            {question ? (
              <p className="text-slate-800 text-base leading-relaxed italic text-center font-light select-none">
                {question}
              </p>
            ) : (
              <p className="text-slate-400/60 text-sm text-center py-2 select-none">···</p>
            )}
          </motion.div>

          {!isRevealed && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="vitrana-sweep-beam" />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: autoReveal ? 0.1 : 0.5 }}
          >
            <motion.button
              type="button"
              className="w-full rounded-full border border-purple-500/70 text-purple-100 hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2.5"
              initial={{ boxShadow: '0 0 0px rgba(139,92,246,0)' }}
              animate={{ boxShadow: [
                '0 0 0px rgba(139,92,246,0)',
                '0 0 32px rgba(139,92,246,0.55)',
                '0 15px 45px rgba(67,56,202,0.45)',
              ]}}
              transition={{ duration: 1.1, delay: autoReveal ? 0.35 : 0.75, ease: 'easeOut' }}
              onClick={onAnswer}
            >
              {buttonLabel}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VitranaQuestionReveal;
