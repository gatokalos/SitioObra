import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Share, Plus, Check, MoreVertical, Download, ArrowDown } from 'lucide-react';

const STEPS_IOS = [
  { Icon: Share, label: '1. Toca el botón Compartir' },
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

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

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

  const steps = isIOS ? STEPS_IOS : STEPS_ANDROID;

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
    <div
      className="fixed inset-x-0 top-0 z-[10000] mx-auto flex max-h-[60vh] w-full max-w-md flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Instrucciones para instalar #GatoEncerrado como app"
    >
      <div className="flex items-center justify-between px-4 py-3 text-slate-100">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            {eyebrow}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar instrucciones"
        >
          <X size={18} />
        </button>
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

        {/* Tamaños en clamp(min, Nvh, max): escalan con el alto de pantalla
            disponible (no con el ancho — la restricción real siempre fue
            vertical, por el # de abajo), así en pantallas grandes el
            contenido crece y llena el aire en vez de quedar chico con mucho
            espacio vacío, y en las chicas se queda en el mínimo ya
            verificado como seguro. */}
        <div className="relative z-10 mx-auto flex w-[clamp(320px,40vh,380px)] flex-col items-center px-5 pb-4 pt-3">
          {steps.map((step, index) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-[clamp(5px,0.85vh,8px)] text-center">
                <div className="flex h-[clamp(34px,5.4vh,52px)] w-[clamp(34px,5.4vh,52px)] shrink-0 items-center justify-center rounded-[clamp(10px,1.1vh,15px)] border-[1.25px] border-white/65 text-slate-100">
                  {step.Icon ? (
                    <step.Icon
                      strokeWidth={1.5}
                      className="h-[clamp(17px,2.7vh,26px)] w-[clamp(17px,2.7vh,26px)]"
                    />
                  ) : (
                    <img
                      src="/assets/icon-180.png"
                      alt="Ícono de #GatoEncerrado"
                      className="h-full w-full rounded-[clamp(9px,1vh,13px)] object-cover"
                    />
                  )}
                </div>
                <p className="text-[clamp(0.78rem,2vh,1.15rem)] leading-tight text-slate-100">{step.label}</p>
              </div>
              {index < steps.length - 1 && (
                <ArrowDown
                  strokeWidth={1.5}
                  className="my-[clamp(3px,0.5vh,6px)] h-[clamp(12px,1.9vh,18px)] w-[clamp(12px,1.9vh,18px)] text-white/45"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PWAInstructionsOverlay;
