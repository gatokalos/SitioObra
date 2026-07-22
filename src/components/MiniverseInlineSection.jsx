import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { safeSetItem } from '@/lib/safeStorage';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import {
  readMiniverseInlineOpenFromSession,
  writeMiniverseInlineOpenToSession,
} from '@/lib/heroActivation';

const MiniverseModal = React.lazy(() => import('@/components/MiniverseModal'));
const AlianzaSocial = React.lazy(() => import('@/components/AlianzaSocial'));

const PENDING_MINIVERSE_SELECTION_KEY = 'gatoencerrado:hero-inline-miniverse-selection';
const TAB_QUERY_PARAM = 'heroTab';

const resolveInitialTabFromQuery = (search = '') => {
  if (!search) return 'experiences';
  const params = new URLSearchParams(search);
  const rawTab = (params.get(TAB_QUERY_PARAM) || '').trim().toLowerCase();
  if (rawTab === 'waitlist' || rawTab === 'impulsar' || rawTab === 'activar') {
    return 'waitlist';
  }
  return 'experiences';
};

// "Antes de irte" — último espacio antes de Contacto, después de Team
// ("Créditos de la función"). No depende de sesión a propósito: el botón es
// de descubrimiento, no de autenticación. Alianza Social (antes solo para
// autenticados, como sección hermana en App.jsx) ahora vive DENTRO de este
// mismo despliegue — aparece junto con el contenido de miniversos cuando el
// usuario abre la sección, no como sección aparte.
const MiniverseInlineSection = () => {
  // Persistido en sessionStorage: sin esto, volver de un portal (/portal-*)
  // remonta esta sección con isOpen=false — el scroll aterriza en el lugar
  // correcto, pero el contenido (modal + Alianza Social) ya no está.
  const [isOpen, setIsOpen] = useState(readMiniverseInlineOpenFromSession);
  const location = useLocation();
  // Mismo breakpoint/lógica que usaba Hero.jsx para este mismo contenido
  // (MiniverseModal inline). Sin esto, en mobile se quedaba con el padding y
  // max-width de desktop (px-6 + max-w-[920px] en vez de px-4 + max-w-2xl),
  // empujando los copies ya pulidos a más renglones de los que tenían.
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  const initialTabId = useMemo(
    () => resolveInitialTabFromQuery(location.search),
    [location.search],
  );

  const handleSelectMiniverse = useCallback((formatId) => {
    if (typeof window === 'undefined' || !formatId) return;
    safeSetItem(PENDING_MINIVERSE_SELECTION_KEY, formatId);
    const emitSelection = () => {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:select-miniverse-format', { detail: { formatId } }),
      );
    };
    emitSelection();
    [120, 280, 560, 980].forEach((delay) => window.setTimeout(emitSelection, delay));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileViewport(event.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    writeMiniverseInlineOpenToSession();
  }, []);
  // No-op a propósito: MiniverseModal llama onClose() ANTES de hacer scroll
  // a #apoya (su propio botón "cómo dejar mi huella"/"cómo funciona"
  // internamente hace onClose()+scroll). Si onClose colapsara esta sección,
  // Alianza Social (montada solo con isOpen=true) desaparecería justo antes
  // de que el scroll intentara alcanzarla. No hace falta un "cerrar" aquí —
  // nadie pidió esa afordancia — así que simplemente no colapsamos.
  const handleModalClose = useCallback(() => {}, []);

  return (
    <>
      {/* pt/pb chicos a propósito: Team (arriba) y Contact (abajo) ya
          aportan py-24 cada una — sumarle otro py-24 aquí triplicaba el
          hueco entre secciones. El section-divider (mismo patrón que usan
          About/Blog/Team/Contact/etc. entre secciones) marca el corte con
          Créditos ahora que el título ya no lleva el tratamiento de
          text-gradient que antes lo distinguía visualmente. */}
      <section id="conoce-sistema" className="pt-2 pb-10 relative overflow-hidden">
        <div className="section-divider mb-8" />
        <div
          className={`container relative z-10 mx-auto ${
            isMobileViewport ? 'px-2' : 'px-4'
          }`}
        >
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: 'easeOut' }}
              className={`relative mx-auto w-full ${isMobileViewport ? 'max-w-2xl' : 'max-w-[920px]'}`}
            >

              <div className="relative z-10">
                <Suspense fallback={null}>
                  <MiniverseModal
                    open
                    onClose={handleModalClose}
                    initialTabId={initialTabId}
                    onSelectMiniverse={handleSelectMiniverse}
                    stayOpenOnSelect
                    displayMode="inline"
                  />
                </Suspense>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto"
            >
              <h3 className="font-display text-3xl font-medium text-slate-100 mb-6 text-center">
                ANTES DE IRTE
              </h3>
              <p className="text-slate-100/80 leading-relaxed mb-8 max-w-xl mx-auto font-light">
                Echa un vistazo a lo que hace posible todo esto: <br></br>
                cómo se expande el universo,<br></br>
                qué hay para habitar y de qué forma tu presencia lo impulsa.
              </p>
              <Button
                onClick={handleOpen}
                className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/40 transition mx-auto"
              >
                <Compass size={20} />
                Modelo de negocio
              </Button>
            </motion.div>
          )}
        </div>
      </section>
      {/* Hermana de #conoce-sistema, NO anidada dentro de su div con
          container/px-6 — Alianza Social trae su propio container mx-auto
          con px-0 en mobile (edge-to-edge a propósito); envolverla en mi
          contenedor le rompía ese ancho y la planitud del fondo. Sin imagen
          de fondo aquí, tal como se pidió. */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: 'easeOut', delay: 0.08 }}
        >
          <SectionErrorBoundary
            fallback={(
              <div className="container mx-auto px-6 py-16">
                <div className="glass-effect rounded-2xl p-8 text-center">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Alianza Social</p>
                </div>
              </div>
            )}
          >
            <Suspense fallback={null}>
              <AlianzaSocial />
            </Suspense>
          </SectionErrorBoundary>
        </motion.div>
      )}
    </>
  );
};

export default MiniverseInlineSection;
