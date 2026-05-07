import React from 'react';
import { createPortal } from 'react-dom';

const APP_URL = 'https://literatura.miniversos.ai';

const LiteraturaAppOverlay = ({ open, onClose }) => {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="mb-4 self-center text-slate-300 hover:text-white text-sm"
      >
        Cerrar ✕
      </button>

      <div className="w-full max-w-sm flex-1 sm:flex-none sm:aspect-[9/16] sm:max-h-[88dvh] overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/10">
        <iframe
          src={APP_URL}
          title="Separador inteligente · Literatura"
          className="w-full h-full"
          allow="microphone; camera"
          loading="lazy"
        />
      </div>
    </div>,
    document.body,
  );
};

export default LiteraturaAppOverlay;
