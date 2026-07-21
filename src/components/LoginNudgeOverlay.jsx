import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Extraído de About.jsx (overlay post-envío de Provoca) para reutilizarlo
// donde se necesite pedir login sin bloquear la lectura/exploración previa —
// ej. el gate de "Intuye tu respuesta" en los portales de miniverso.
const LoginNudgeOverlay = ({
  open,
  onClose,
  onLogin,
  title = '¿Te gustaría iniciar sesión en el sitio?',
  description = 'Tu voz ya forma parte del espacio. Con tu sesión iniciada, podrás seguir el diálogo y recibir avisos cuando publiquemos nuevas respuestas y funciones.',
  dismissLabel = 'Ahora no',
  confirmLabel = 'Iniciar sesión',
  titleId = 'login-nudge-title',
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="login-nudge-overlay"
          className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#071514]/95 p-5 sm:p-6 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
            initial={{ scale: 0.96, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="mt-5 space-y-3">
              <h3 id={titleId} className="font-display text-2xl text-slate-50">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-200/90">{description}</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                {dismissLabel}
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500/95 to-teal-500/95 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_26px_rgba(16,185,129,0.35)] transition hover:from-emerald-400 hover:to-teal-400"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

export default LoginNudgeOverlay;
