import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.22, ease: 'easeIn' } },
};

const GATOKENS_LS_KEY = 'gatoencerrado:gatokens-available';

const GatokensRevealModal = ({ open, onClose }) => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage?.getItem(GATOKENS_LS_KEY);
      const parsed = Number.parseInt(raw, 10);
      setBalance(Number.isFinite(parsed) ? parsed : null);
    } catch {
      setBalance(null);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-center justify-center px-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#04020f]/88 backdrop-blur-[18px]"
            variants={backdropVariants}
            aria-hidden="true"
            onClick={onClose}
          />

          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gatokens-modal-title"
            variants={panelVariants}
            className="
              relative z-10 w-full max-w-sm
              rounded-[28px] border border-violet-400/20
              bg-gradient-to-b from-[#120826]/90 via-[#0d061f]/90 to-[#070312]/90
              px-7 py-8 shadow-[0_32px_80px_rgba(0,0,0,0.75)]
              backdrop-blur-[24px]
            "
          >
            {/* glow decorativo */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-40 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)' }}
            />

            {/* encabezado */}
            <p className="mb-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-violet-300/60">
              Sistema energético
            </p>
            <h2
              id="gatokens-modal-title"
              className="mb-5 text-center text-xl font-semibold leading-snug text-white"
            >
              Tu energía se convirtió<br />en GATokens
            </h2>

            {/* balance */}
            {balance != null && (
              <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/8 px-4 py-3">
                <span className="text-2xl font-bold tabular-nums text-violet-200">{balance.toLocaleString('es-MX')}</span>
                <span className="text-sm font-medium text-violet-300/70">GAT disponibles</span>
              </div>
            )}

            {/* descripción */}
            <p className="mb-2 text-center text-sm leading-relaxed text-slate-300/80">
              Los GATokens son la moneda de energía de la obra. Cada vez que interactúas con el sitio —
              exploras, compartes o reaccionas — acumulas más.
            </p>
            <p className="mb-7 text-center text-sm leading-relaxed text-slate-400/60">
              Úsalos para desbloquear experiencias dentro del universo de{' '}
              <span className="text-violet-300/80">#GATOENCERRADO</span>.
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={onClose}
              className="
                w-full rounded-full
                bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
                px-6 py-3 text-sm font-semibold text-white
                shadow-[0_8px_28px_rgba(139,92,246,0.38)]
                transition-all duration-200
                hover:shadow-[0_10px_36px_rgba(139,92,246,0.52)]
                hover:scale-[1.02]
                active:scale-[0.98]
              "
            >
              Explorar el sitio →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GatokensRevealModal;
