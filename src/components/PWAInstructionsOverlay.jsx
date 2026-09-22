import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Share, Plus, Check, MoreVertical, MoreHorizontal, Download, ArrowDown } from 'lucide-react';
import { isAppleTouchDevice, isIosSafari } from '@/lib/platformDetection';

// Safari y Chrome comparten motor en iOS pero no interfaz, y el paso 1 es
// justo donde difieren: Safari, en su disposición compacta, no muestra un
// botón Compartir — está dentro del menú ⋯ (verificado en capturas, 9 sep
// 2026). Chrome en iOS sí lo expone en la barra de arriba.
//
// COPY PROVISIONAL (no es de Carlos). El paso 1 de Safari está redactado para
// cubrir sus DOS disposiciones —barra clásica, donde Compartir sí se ve, y
// compacta, donde vive en ⋯— porque ese ajuste es del usuario y no se puede
// detectar desde JS. Si se prefiere nombrar solo el ⋯, es una línea.
const STEPS_IOS_SAFARI = [
  { Icon: MoreHorizontal, label: '1. Toca Compartir, o el menú ⋯' },
  { Icon: Plus, label: '2. Selecciona "Añadir a pantalla de inicio"' },
  { Icon: Check, label: '3. Toca "Añadir"' },
  { Icon: null, label: '4. Listo, un universo en tu bolsillo' },
];

const STEPS_IOS_OTHER = [
  { Icon: Share, label: '1. Toca Compartir, arriba a la derecha' },
  { Icon: Plus, label: '2. Selecciona "Añadir a pantalla de inicio"' },
  { Icon: Check, label: '3. Toca "Añadir"' },
  { Icon: null, label: '4. Listo, un universo en tu bolsillo' },
];

const STEPS_ANDROID = [
  { Icon: MoreVertical, label: '1. Toca el menú ⋮ de Chrome' },
  { Icon: Download, label: '2. "Instalar app" o "Agregar a inicio"' },
  { Icon: Check, label: '3. Confirma en el diálogo' },
  { Icon: null, label: '4. Listo, un universo en tu bolsillo' },
];

const STAR_COUNT = 18;

const PWAInstructionsOverlay = ({
  isOpen,
  onClose,
  eyebrow = '',
  subtitle = '',
}) => {
  const [isIOS, setIsIOS] = useState(true);
  const [isSafari, setIsSafari] = useState(true);
  // Alto REAL visible, no el del viewport ideal. En iOS `vh` mide la ventana
  // con la barra del navegador oculta, así que en pantallas chicas el sheet
  // se dimensionaba contra un alto que el usuario no tiene y se cortaba por
  // arriba (Carlos, capturas del 9 sep 2026). visualViewport sí descuenta la
  // barra de direcciones y la de herramientas.
  const [visibleHeight, setVisibleHeight] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsIOS(isAppleTouchDevice());
    setIsSafari(isIosSafari());
  }, []);

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

  // Estable mientras el sheet está abierto — sin esto, las estrellas
  // se rebarajarían en cada re-render.
  const stars = useMemo(
    () => Array.from({ length: STAR_COUNT }).map((_, index) => ({
      id: index,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 4.5,
    })),
    [],
  );

  if (!isOpen || typeof document === 'undefined') return null;

  const steps = isIOS
    ? (isSafari ? STEPS_IOS_SAFARI : STEPS_IOS_OTHER)
    : STEPS_ANDROID;

  // Mientras no se haya medido, `1vh` deja el comportamiento anterior en pie.
  const sheetStyle = {
    '--pwa-vh': visibleHeight ? `${visibleHeight / 100}px` : '1vh',
    maxHeight: 'calc(60 * var(--pwa-vh))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
  };

  // Sheet parcial, no pantalla completa: se detiene bien arriba del # 3D del
  // Hero (que sigue en su lugar) para que quede claro que las instrucciones
  // son SOBRE ese hashtag, no un modal aparte que lo tapa. Sin fondo propio
  // a propósito: el starfield del Hero se ve directamente detrás del
  // contenido, no hay una capa/tarjeta separada encima.
  //
  // max-height (no height fija): el contenido ya no vive en un <iframe> con
  // tamaño por defecto del navegador — es JSX normal, así que el sheet se
  // ajusta a lo que el contenido realmente necesita (compacto en pantallas
  // grandes) y solo se topa con el límite en las pantallas más chicas, donde
  // el scroll interno entra como respaldo.
  return createPortal(
    <>
      <div
        className="fixed inset-x-0 top-0 z-[10000] mx-auto flex w-full max-w-md flex-col overflow-hidden"
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Instrucciones para instalar #GatoEncerrado como app"
      >
        <div className="min-h-10 px-4 py-3 text-center text-slate-100">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            {eyebrow}
          </p>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {stars.map((star) => (
            <span
              key={star.id}
              className="pwa-instructions-star"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animationDelay: `${star.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Tamaños en clamp(min, N×--pwa-vh, max): escalan con el alto de
            pantalla REALMENTE disponible (no con el ancho — la restricción
            siempre fue vertical, por el # de abajo), así en pantallas grandes
            el contenido crece y llena el aire, y en las chicas se queda en el
            mínimo ya verificado como seguro. Antes eran `vh` a secas y en iOS
            eso mide la ventana sin la barra del navegador: en pantallas
            chicas el sheet se pasaba de largo y se cortaba. */}
        <div className="relative z-10 mx-auto flex w-[clamp(320px,calc(40*var(--pwa-vh)),380px)] flex-col items-center px-5 pb-4 pt-3">
          {steps.map((step, index) => (
            <React.Fragment key={step.label}>
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -18, filter: 'blur(5px)' }
                }
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: prefersReducedMotion ? 0.16 : 0.52,
                  delay: prefersReducedMotion ? 0 : index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col items-center gap-[clamp(5px,calc(0.85*var(--pwa-vh)),8px)] text-center"
              >
                <div className="flex h-[clamp(34px,calc(5.4*var(--pwa-vh)),52px)] w-[clamp(34px,calc(5.4*var(--pwa-vh)),52px)] shrink-0 items-center justify-center rounded-[clamp(10px,calc(1.1*var(--pwa-vh)),15px)] border-[1.25px] border-white/65 text-slate-100">
                  {step.Icon ? (
                    <step.Icon
                      strokeWidth={1.5}
                      className="h-[clamp(17px,calc(2.7*var(--pwa-vh)),26px)] w-[clamp(17px,calc(2.7*var(--pwa-vh)),26px)]"
                    />
                  ) : (
                    <img
                      src="/assets/icon-180.png?v=20260827"
                      alt="Ícono de #GatoEncerrado"
                      className="h-full w-full rounded-[clamp(9px,calc(1*var(--pwa-vh)),13px)] object-cover"
                    />
                  )}
                </div>
                <p className="text-[clamp(0.78rem,calc(2*var(--pwa-vh)),1.15rem)] leading-tight text-slate-100">{step.label}</p>
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.28,
                    delay: prefersReducedMotion ? 0 : index * 0.12 + 0.28,
                    ease: 'easeOut',
                  }}
                >
                  <ArrowDown
                    strokeWidth={1.5}
                    className="my-[clamp(3px,calc(0.5*var(--pwa-vh)),6px)] h-[clamp(12px,calc(1.9*var(--pwa-vh)),18px)] w-[clamp(12px,calc(1.9*var(--pwa-vh)),18px)] text-white/45"
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      </div>

      {/* Cierre editorial bajo el hashtag, sobre el mismo eje que los pasos. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[10000] mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4 text-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        {/* Aviso suave, como las tarjetas de antes de que empiece la película
            («se recomienda el uso de audífonos»): llega solo, después de los
            pasos, en letra chica y con aire, y se queda. */}
        <motion.p
          className="text-[11px] font-light uppercase leading-relaxed tracking-[0.28em] text-slate-300/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: prefersReducedMotion ? 0.16 : 2.4,
            delay: prefersReducedMotion ? 0 : steps.length * 0.12 + 1.6,
            ease: 'easeOut',
          }}
        >
          {subtitle}
        </motion.p>
      {/* La × era el único acceso a la obra y mentía sobre lo que hace: no
          cancela nada, levanta el telón. Aquí el aviso de arriba pregunta y
          esto responde —una respuesta, no un descarte (Carlos, 21 sep 2026). */}
      <button
        type="button"
        onClick={onClose}
        className="pointer-events-auto mt-1 inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2 text-[0.72rem] font-light text-slate-300 underline decoration-slate-500/50 underline-offset-[6px] transition hover:text-white hover:decoration-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Quizá más tarde: continuar a la obra sin instalar la app"
      >
        Quizá más tarde
      </button>
      </div>
    </>,
    document.body
  );
};

export default PWAInstructionsOverlay;
