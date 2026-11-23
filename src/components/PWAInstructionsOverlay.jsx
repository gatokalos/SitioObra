import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Share, Plus, Check, MoreVertical, Download, ArrowDown } from 'lucide-react';

const SYMBOLS = { menu: MoreVertical, download: Download, share: Share, plus: Plus, check: Check };

// La primera instrucción (en amarillo) espera a que se alcance a leer «Esta
// obra se disfruta más como app instalada.» (Carlos, 22 nov 2026). Las
// siguientes salen al tocar el [#], como siempre.
const PRIMERA_INSTRUCCION_MS = 2600;

const PWAInstructionsOverlay = ({
  isOpen,
  onClose,
  subtitle,
  steps,
  currentStep,
  anchorRef,
}) => {
  const [visibleHeight, setVisibleHeight] = useState(null);
  const prefersReducedMotion = useReducedMotion();
  const [primeraInstruccionLista, setPrimeraInstruccionLista] = useState(false);
  const guideRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      setPrimeraInstruccionLista(false);
      return undefined;
    }
    const timerId = window.setTimeout(
      () => setPrimeraInstruccionLista(true),
      prefersReducedMotion ? 0 : PRIMERA_INSTRUCCION_MS,
    );
    return () => window.clearTimeout(timerId);
  }, [isOpen, prefersReducedMotion]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return undefined;
    const readVisibleHeight = () => {
      setVisibleHeight(window.visualViewport?.height ?? window.innerHeight);
    };
    readVisibleHeight();
    window.visualViewport?.addEventListener('resize', readVisibleHeight);
    window.addEventListener('resize', readVisibleHeight);
    return () => {
      window.visualViewport?.removeEventListener('resize', readVisibleHeight);
      window.removeEventListener('resize', readVisibleHeight);
    };
  }, [isOpen]);

  // En teléfono (Carlos, 23 nov 2026, con su maqueta): los pasos quedan al
  // centro entre el letrero y el [#], y la instrucción en amarillo baja bajo
  // el [#]. Aquí solo se mide; index.css usa las medidas en (max-width: 639px).
  useLayoutEffect(() => {
    if (!isOpen || typeof window === 'undefined') return undefined;
    const medir = () => {
      const guia = guideRef.current;
      const ranura = anchorRef?.current?.parentElement;
      const titulo = document.getElementById('pwa-install-title');
      const pasos = guia?.querySelector('.pwa-install-sequence');
      if (!guia || !ranura || !titulo || !pasos) return;
      const abajoDelLetrero = titulo.getBoundingClientRect().bottom;
      const arribaDelHash = ranura.getBoundingClientRect().top - 4;
      const aire = Math.max(8, (arribaDelHash - abajoDelLetrero - pasos.offsetHeight) / 2);
      guia.style.setProperty('--pwa-guia-aire', `${aire.toFixed(1)}px`);
      guia.style.setProperty('--pwa-hash-alto', `${ranura.offsetHeight}px`);
    };
    medir();
    // El letrero entra subiendo 8 px en medio segundo: se mide otra vez.
    const timerId = window.setTimeout(medir, 650);
    return () => window.clearTimeout(timerId);
  }, [isOpen, visibleHeight, anchorRef]);

  if (!isOpen || typeof document === 'undefined') return null;

  const viewportStyle = { '--pwa-vh': visibleHeight ? `${visibleHeight / 100}px` : '1svh' };
  // Si toca el [#] antes de que salga la primera, la del paso siguiente sale ya.
  const instruction = primeraInstruccionLista || currentStep > 1
    ? steps[currentStep - 1]?.text
    : null;

  return (
    <>
      {createPortal(
        <>
          {/* El # sigue siendo el control fuera del portal. Una región permite
              alcanzarlo también con lector de pantalla, sin bloquear el foco. */}
          <section
            className="pwa-install-introduction"
            style={viewportStyle}
            aria-labelledby="pwa-install-title"
          >
            <motion.h2
              id="pwa-install-title"
              className="font-display pwa-install-title"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.5 }}
            >
              {subtitle}
            </motion.h2>
          </section>
          {currentStep >= steps.length && (
            <motion.div
              className="pwa-install-footer"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.35 }}
            >
              <button
                type="button"
                onClick={onClose}
                className="pointer-events-auto inline-flex items-center justify-center rounded-full px-5 py-2 text-[0.72rem] font-light text-slate-300 underline decoration-slate-500/50 underline-offset-[6px] transition hover:text-white hover:decoration-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label="Quizá más tarde: continuar a la obra sin instalar la app"
              >
                Quizá más tarde
              </button>
            </motion.div>
          )}
        </>,
        document.body,
      )}
      {anchorRef.current && createPortal(
        <div ref={guideRef} className="pwa-install-guide" style={viewportStyle}>
          <ol className="pwa-install-sequence" aria-hidden="true">
            {steps.map((step, index) => {
              const Icon = SYMBOLS[step.symbol];
              const reached = currentStep > index;
              const current = currentStep === index + 1;
              const final = index === steps.length - 1;
              return (
                <motion.li
                  key={step.symbol}
                  className={`pwa-install-step${reached ? ' pwa-install-step--reached' : ''}${current ? ' pwa-install-step--current' : ''}${final && reached ? ' pwa-install-step--final' : ''}`}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.12 : 0.35, delay: prefersReducedMotion ? 0 : index * 0.08 }}
                >
                  <span className="pwa-install-symbol">
                    <span className="header-hashtag-mark">[</span>
                    {Icon ? <Icon strokeWidth={1.5} className="pwa-install-symbol__icon" /> : (
                      <svg viewBox="0 0 180 180" className="pwa-install-symbol__universe">
                        <defs>
                          <mask id="pwa-install-universe-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180" style={{ maskType: 'luminance' }}>
                            <image href="/assets/icon-180.png?v=20260827" width="180" height="180" />
                          </mask>
                        </defs>
                        <rect width="180" height="180" fill="currentColor" mask="url(#pwa-install-universe-mask)" />
                      </svg>
                    )}
                    <span className="header-hashtag-mark">]</span>
                  </span>
                  {!final && <ArrowDown strokeWidth={1} className="pwa-install-arrow" />}
                </motion.li>
              );
            })}
          </ol>
          <div id="pwa-install-current-step" className="pwa-install-copy-slot" aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait" initial={false}>
              {instruction && (
                <motion.span
                  key={currentStep}
                  className="hero-pwa-hash-whisper"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    // La primera entra despacio; todas se van rápido.
                    transition: { duration: prefersReducedMotion ? 0.1 : currentStep === 1 ? 0.6 : 0.2 },
                  }}
                  exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0.1 : 0.2 } }}
                >
                  {instruction}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>,
        anchorRef.current,
      )}
    </>
  );
};

export default PWAInstructionsOverlay;
