import React from 'react';
import { createPortal } from 'react-dom';
import AutoficcionPreview from '@/components/novela/AutoficcionPreview';

const AutoficcionPreviewOverlay = ({ open, onClose }) => {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-auto overscroll-none bg-black/80 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button
          type="button"
          onClick={onClose}
          className="text-slate-300 hover:text-white mb-6"
        >
          Cerrar ✕
        </button>

        <AutoficcionPreview />
      </div>
    </div>,
    document.body,
  );
};

export default AutoficcionPreviewOverlay;
