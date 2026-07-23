import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

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

const GatokensRevealModal = ({
  open,
  onClose,
  isUmbral = false,
  onProvoca,
  onPlayScene,
  recommendedShowcaseId,
}) => {
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

  const handlePlayScene = useCallback(() => {
    if (!recommendedShowcaseId) return;
    dispatchRevealAck('gatokens-modal-scene');
    onClose?.();
    onPlayScene?.(recommendedShowcaseId);
  }, [dispatchRevealAck, onClose, onPlayScene, recommendedShowcaseId]);

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

          {isUmbral ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="gatokens-modal-title"
              variants={panelVariants}
              className="relative z-10 flex w-full max-w-md flex-col items-center px-5 py-10 text-center"
            >
              {/* Antes solo se podía cerrar tocando el fondo borroso o con
                  Escape — en móvil ninguno de los dos es obvio, y si este
                  modal reaparece tras haber usado ya el CTA, el usuario se
                  queda sin forma clara de salir. */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full blur-[72px]"
                style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.34) 0%, rgba(217,31,139,0.12) 48%, transparent 72%)' }}
              />

              <motion.button
                type="button"
                onClick={handleCoinClick}
                className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#04020f]"
                aria-label="Confirmar GATokens recibidos"
                title="Confirmar GATokens recibidos"
                whileTap={isRevealAcknowledged ? undefined : { scale: 0.96 }}
              >
                <motion.img
                  src={GATOKEN_COIN_SRC}
                  alt=""
                  className="h-28 w-28 sm:h-32 sm:w-32"
                  animate={coinPulseAnimate}
                  transition={coinPulseTransition}
                  draggable="false"
                />
              </motion.button>

              <h2
                id="gatokens-modal-title"
                className="relative mt-9 text-3xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-4xl"
              >
                La obra ya sabe<br />que estás aquí.
              </h2>

              <button
                type="button"
                onClick={handlePlayScene}
                disabled={!recommendedShowcaseId}
                className="
                  group relative mt-10 inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-3 overflow-hidden rounded-full
                  border border-violet-200/25 bg-white/[0.06] px-7 py-4 text-base font-semibold text-white
                  shadow-[0_16px_50px_rgba(109,40,217,0.28)] backdrop-blur-md
                  transition-all duration-300 hover:border-violet-200/45 hover:bg-white/[0.1]
                  hover:shadow-[0_18px_58px_rgba(139,92,246,0.4)] hover:scale-[1.015]
                  active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45
                "
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[#1f2f63]/55 via-[#6e30ab]/55 to-[#d91f8b]/55 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/20">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-px" focusable="false">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="relative">Esta escena es para ti</span>
              </button>
            </motion.div>
          ) : (
          /* panel normal de GATokens */
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
          </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GatokensRevealModal;
