import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VitranaQuestionReveal = ({
  question,
  onAnswer,
  buttonLabel = 'Intuye tu respuesta',
  label = 'Resonancia Colectiva',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const reveal = () => setIsRevealed(true);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{label}</p>

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

      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.5 }}
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
              transition={{ duration: 1.1, delay: 0.75, ease: 'easeOut' }}
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
