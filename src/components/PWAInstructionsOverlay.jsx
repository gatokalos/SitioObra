import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const PWAInstructionsOverlay = ({
  isOpen,
  onClose,
  eyebrow = 'Descarga #GatoEncerrado',
  subtitle = 'Sigue las instrucciones sin salir del sitio.',
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black/82 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Instrucciones para instalar #GatoEncerrado como app"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/92 px-4 py-3 text-slate-100">
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar instrucciones"
          >
            <X size={18} />
          </button>
        </div>
        <iframe
          title="Instrucciones para instalar #GatoEncerrado como app"
          src="/pwa-instructions.html"
          className="min-h-0 flex-1 border-0 bg-slate-950"
        />
      </div>
    </div>,
    document.body
  );
};

export default PWAInstructionsOverlay;
