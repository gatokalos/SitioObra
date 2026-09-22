import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

// Se ve UNA vez en la vida de la instalación, la primera vez que la app se
// abre desde la pantalla de inicio (Carlos, 21 sep 2026). Antes se probó
// darle a la PWA el Estado Cero completo y el costo era 6.5 segundos de
// ceremonia en cada apertura: un peaje. Esto dura lo que tarde un toque.
//
// El toque también es lo que deja sonar la música: el navegador no reproduce
// audio sin un gesto, y en la app instalada no había ninguno — la ambientación
// terminaba colgada del primer toque que cayera, un scroll o una vitrina. Por
// eso este overlay NO detiene la propagación del evento: el mismo toque que lo
// cierra llega a los listeners de Hero.jsx y levanta el sonido.
const PWA_WELCOME_SEEN_KEY = 'gatoencerrado:pwa-welcome-seen';

const isRunningAsInstalledPwa = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator?.standalone === true
  );
};

const PWAFirstLaunchWelcome = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isRunningAsInstalledPwa()) return;
    if (safeGetItem(PWA_WELCOME_SEEN_KEY)) return;
    setIsVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    safeSetItem(PWA_WELCOME_SEEN_KEY, String(Date.now()));
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;
    const handleKeyDown = () => dismiss();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, isVisible]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="pwa-first-launch-welcome"
          role="button"
          tabIndex={0}
          aria-label="Levantar el telón"
          onPointerDown={dismiss}
          className="fixed inset-0 z-[10050] flex flex-col items-center justify-center gap-4 bg-[#050507] px-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0.12 : 0.55, ease: 'easeOut' } }}
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.5, ease: 'easeOut' }}
        >
          <motion.p
            className="font-display text-lg font-light text-slate-100"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.7, delay: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
          >
            Gracias por instalar la obra.
          </motion.p>
          <motion.p
            className="text-[11px] font-light uppercase tracking-[0.28em] text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 1.1, delay: prefersReducedMotion ? 0 : 0.9, ease: 'easeOut' }}
          >
            Toca donde quieras para tomar tu lugar
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default PWAFirstLaunchWelcome;
