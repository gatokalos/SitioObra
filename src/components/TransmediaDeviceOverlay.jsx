import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Demo de un "dispositivo transmedia" real, en su propio dominio (ej.
// juegos.miniversos.ai) — pantalla completa, como VideoNarrativeAutoplay,
// porque es una experiencia externa completa, no un aviso ni un sheet.
const TransmediaDeviceOverlay = ({ url, onClose }) => {
  // Sin esto, el scroll táctil dentro del iframe (el usuario explorando la
  // demo) se filtra al documento de atrás en iOS — al cerrar, el sitio
  // aparecía scrolleado a un punto random, lejos de donde estaba Habita.
  // Mismo patrón (clase, no position:fixed) que ya se probó en Hero.jsx para
  // Estado Cero — ese ya descartó position:fixed por romper otros clics.
  useEffect(() => {
    if (typeof document === 'undefined' || !url) return undefined;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [url]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {url ? (
        <motion.div
          className="fixed inset-0 z-[900] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Dispositivo transmedia"
        >
          <iframe
            title="Dispositivo transmedia"
            src={url}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; clipboard-write"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default TransmediaDeviceOverlay;
