import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import ResonanceModal from '@/components/portal/ResonanceModal';

// La Memoria por sí sola (Carlos, 24 nov 2026). «Hilar mi memoria», en el
// bloque de bambalinas de la tarjeta, abre la Memoria con la constelación en
// su propia capa, sin pasar por la ficha: antes se abría la ficha y, encima,
// el método, así que la ficha se alcanzaba a ver primero. De aquí, «Explorar
// miniverso» lleva a la ficha; la palomita regresa a la galería.
// En escritorio va en un marco del tamaño de la ficha; en teléfono la ventana
// del método ya ocupa toda la pantalla (se ancla sola al body, por debajo de
// 1024), así que ahí no lleva marco: el marco la tapaba.
const PANTALLA_CHICA = '(max-width: 1023px)';
const esPantallaChica = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia(PANTALLA_CHICA).matches;
export default function MemoriaSola({
  portal,
  question,
  isMobileViewport,
  onCerrar,
  onExplorar,
  onNavigateToRecommendation,
  onRequireLogin,
}) {
  const [chica, setChica] = useState(esPantallaChica);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia(PANTALLA_CHICA);
    const alCambiar = (e) => setChica(e.matches);
    query.addEventListener('change', alCambiar);
    return () => query.removeEventListener('change', alCambiar);
  }, []);
  if (typeof document === 'undefined') return null;
  const modal = (
    <ResonanceModal
      open
      portal={portal}
      question={question}
      startInHolografico
      isMobileViewport={isMobileViewport}
      onClose={onCerrar}
      onExplorarMiniverso={onExplorar}
      onNavigateToRecommendation={onNavigateToRecommendation}
      onBeforeNavigate={onCerrar}
      onRequireLogin={onRequireLogin}
    />
  );
  if (chica) return modal;
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[140] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-memoria-sola
    >
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/95 via-slate-950/90 to-black/95" />
      <div className="relative z-10 h-[88vh] w-[calc(100vw-2.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-white/15 shadow-[0_35px_120px_rgba(0,0,0,0.65)]">
        {modal}
      </div>
    </motion.div>,
    document.body,
  );
}
