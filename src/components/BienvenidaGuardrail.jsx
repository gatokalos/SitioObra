import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Sparkles } from 'lucide-react';
import { ORACULO_URL } from '@/components/transmedia/transmediaConstants';

const BIENVENIDA_COMPLETED_KEY = 'gatoencerrado:bienvenida-completed';

// Extraído de MiniverseModal.jsx (guardrail "habitar-guardrail-overlay" +
// "miniverse-bienvenida-iframe") para reutilizarlo como gate de la Tercera
// Llamada en otros puntos del sitio (ej. responder resonancia colectiva).
// Al completar, solo marca hasBienvenida y cierra — no encadena ningún otro
// paso; quien lo use decide qué hacer después si el usuario vuelve a intentar
// la acción original.
const BienvenidaGuardrail = ({
  open,
  onClose,
  onCompleted,
  title = 'Primero, vive la bienvenida',
  description = 'Los miniversos se abren cuando ya has cruzado la puerta de entrada al universo. La bienvenida es ese primer umbral.',
}) => {
  const [isIframeOpen, setIsIframeOpen] = useState(false);

  useEffect(() => {
    if (!open) setIsIframeOpen(false);
  }, [open]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'bienvenida:gatokens-update') {
        const value = event.data?.gatokens;
        if (typeof value === 'number' && value > 0) {
          try { localStorage.setItem(BIENVENIDA_COMPLETED_KEY, '1'); } catch {}
          setIsIframeOpen(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gatoencerrado:tercera-llamada-completed'));
          }
          onCompleted?.();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onCompleted]);

  const handleDevSkip = useCallback(() => {
    try { localStorage.setItem(BIENVENIDA_COMPLETED_KEY, '1'); } catch {}
    onCompleted?.();
  }, [onCompleted]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && !isIframeOpen ? (
          <motion.div
            key="bienvenida-guardrail-overlay"
            className="fixed inset-0 z-[179] flex items-center justify-center"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(5,7,20,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
          >
            <div
              className="flex flex-col items-center gap-6 px-8 text-center max-w-xs sm:max-w-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 shadow-[0_0_28px_rgba(139,92,246,0.3)]">
                <DoorOpen size={26} className="text-violet-300" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl text-slate-100 sm:text-2xl leading-tight">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300/80">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIframeOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-violet-400/50 bg-violet-500/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.25)] transition hover:bg-violet-500/25 hover:border-violet-300/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <Sparkles size={16} />
                Vivir la bienvenida
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition"
              >
                Ahora no
              </button>
              {import.meta.env?.DEV ? (
                <button
                  type="button"
                  onClick={handleDevSkip}
                  className="text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-2"
                >
                  [DEV] Simular bienvenida completada
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isIframeOpen ? (
          <motion.div
            key="bienvenida-guardrail-iframe"
            className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIframeOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Bienvenida al universo"
              className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Primer umbral</p>
                  <h3 className="font-display text-2xl text-slate-100">La bienvenida</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIframeOpen(false)}
                  className="text-slate-300 hover:text-white transition"
                >
                  Cerrar ✕
                </button>
              </div>
              <div className="h-[72vh] bg-black">
                {ORACULO_URL ? (
                  <iframe
                    title="Bienvenida al universo"
                    src={ORACULO_URL}
                    className="h-full w-full"
                    style={{ border: 'none' }}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; magnetometer; microphone; camera"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    URL de bienvenida no configurada.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default BienvenidaGuardrail;
