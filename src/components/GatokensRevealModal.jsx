import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.22, ease: 'easeIn' } },
};

const GATOKENS_LS_KEY = 'gatoencerrado:gatokens-available';

const GATOKENS_REVEAL_PULSE_EVENT = 'gatoencerrado:gatokens-reveal-pulse';
const GATOKENS_REVEAL_ACK_EVENT = 'gatoencerrado:gatokens-reveal-ack';
const GATOKEN_COIN_SRC =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png';

const GatokensRevealModal = ({ open, onClose, isUmbral = false, onProvoca }) => {
  const [balance, setBalance] = useState(null);
  const [isRevealAcknowledged, setIsRevealAcknowledged] = useState(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setBalance(null);
      return;
    }
    setIsRevealAcknowledged(false);
    try {
      const raw = window.localStorage?.getItem(GATOKENS_LS_KEY);
      const parsed = Number.parseInt(raw, 10);
      setBalance(Number.isFinite(parsed) ? parsed : null);
    } catch {
      setBalance(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || balance == null || typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(GATOKENS_REVEAL_PULSE_EVENT, {
        detail: {
          balance,
          source: 'gatokens-reveal-modal',
        },
      })
    );
  }, [balance, open]);

  const dispatchRevealAck = useCallback((source) => {
    setIsRevealAcknowledged(true);
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(GATOKENS_REVEAL_ACK_EVENT, {
        detail: { source },
      })
    );
  }, []);

  const handleExplore = useCallback(() => {
    dispatchRevealAck('gatokens-modal-explore');
    onClose?.();
    navigate('/#about');
  }, [dispatchRevealAck, navigate, onClose]);

  const handleProvoca = useCallback(() => {
    dispatchRevealAck('gatokens-modal-provoca');
    onProvoca?.();
  }, [dispatchRevealAck, onProvoca]);

  const handleCoinClick = useCallback(() => {
    if (isRevealAcknowledged) return;
    dispatchRevealAck('gatokens-modal-coin');
  }, [dispatchRevealAck, isRevealAcknowledged]);

  const shouldPulseCoin = open && !isRevealAcknowledged && !prefersReducedMotion;
  const coinPulseAnimate = shouldPulseCoin
    ? {
        scale: [1, 1.12, 1],
        filter: [
          'drop-shadow(0 0 16px rgba(139,92,246,0.5))',
          'drop-shadow(0 0 30px rgba(251,191,36,0.68))',
          'drop-shadow(0 0 16px rgba(139,92,246,0.5))',
        ],
      }
    : {
        scale: 1,
        filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.45))',
      };
  const coinPulseTransition = shouldPulseCoin
    ? { duration: 1.25, repeat: Infinity, ease: 'easeInOut' }
    : { duration: 0.2, ease: 'easeOut' };

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

            {/* moneda pulsante */}
            <div className="mb-4 flex justify-center">
              <motion.button
                type="button"
                onClick={handleCoinClick}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d061f]"
                aria-label="Confirmar GATokens recibidos"
                title="Confirmar GATokens recibidos"
                whileTap={isRevealAcknowledged ? undefined : { scale: 0.96 }}
              >
                <motion.img
                  src={GATOKEN_COIN_SRC}
                  alt=""
                  className="h-14 w-14 sm:h-16 sm:w-16"
                  animate={coinPulseAnimate}
                  transition={coinPulseTransition}
                  draggable="false"
                />
              </motion.button>
            </div>

            {/* encabezado */}
            <p className="mb-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-violet-300/60">
              {isUmbral ? 'Pasillo umbral' : 'Sistema energético'}
            </p>
            <h2
              id="gatokens-modal-title"
              className="mb-5 text-center text-xl font-semibold leading-snug text-white"
            >
              {isUmbral ? <>Ya recorriste el umbral</> : <>Tu energía se convirtió<br />en GATokens</>}
            </h2>

            {/* balance */}
            {balance != null && (
              <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3">
                <span className="text-2xl font-bold tabular-nums text-violet-200">{balance.toLocaleString('es-MX')}</span>
                <span className="text-sm font-medium text-violet-300/70">GAT disponibles</span>
              </div>
            )}

            {/* descripción */}
            <p className="mb-7 text-center text-sm leading-relaxed text-slate-400/60">
              {isUmbral
                ? <>Tu respuesta puede convertirse en parte de{' '}<span className="text-violet-300/80">#GATOENCERRADO</span>.</>
                : <>Úsalos para desbloquear experiencias dentro del universo{' '}<span className="text-violet-300/80">#GATOENCERRADO</span>.</>
              }
            </p>

            {/* CTAs */}
            {isUmbral ? (
              <>
                <button
                  type="button"
                  onClick={handleProvoca}
                  className="
                    mb-3 w-full rounded-full
                    bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
                    px-6 py-3 text-sm font-semibold text-white
                    shadow-[0_8px_28px_rgba(139,92,246,0.38)]
                    transition-all duration-200
                    hover:shadow-[0_10px_36px_rgba(139,92,246,0.52)]
                    hover:scale-[1.02] active:scale-[0.98]
                  "
                >
                  ¿Te movió de más?
                </button>
                <button
                  type="button"
                  onClick={handleExplore}
                  className="w-full rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 border border-white/10 bg-white/5 text-slate-300/70 hover:text-slate-200"
                >
                  Explorar el sitio →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleExplore}
                  className="
                    w-full rounded-full
                    bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
                    px-6 py-3 text-sm font-semibold text-white
                    shadow-[0_8px_28px_rgba(139,92,246,0.38)]
                    transition-all duration-200
                    hover:shadow-[0_10px_36px_rgba(139,92,246,0.52)]
                    hover:scale-[1.02] active:scale-[0.98]
                  "
                >
                  Conocer la Obra
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GatokensRevealModal;
