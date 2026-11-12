import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkle, Heart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import useScrambleText from '@/hooks/useScrambleText';
import {
  readMiniverseInlineOpenFromSession,
  writeMiniverseInlineOpenToSession,
} from '@/lib/heroActivation';

import {
  ALIANZA_PENDIENTE_KEY,
  ALIANZA_REVELADA_KEY,
  REVELAR_ALIANZA_EVENT,
  alianzaYaRevelada,
  regresoDeHuellaPendiente,
} from '@/lib/revelarAlianza';

const MiniverseModal = React.lazy(() => import('@/components/MiniverseModal'));
const AlianzaSocial = React.lazy(() => import('@/components/AlianzaSocial'));

const PENDING_MINIVERSE_SELECTION_KEY = 'gatoencerrado:hero-inline-miniverse-selection';
const TAB_QUERY_PARAM = 'heroTab';
const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const TITLE = 'Espera, no te vayas todavía...';

const readAvailableGat = () => {
  const parsed = Number.parseInt(safeGetItem(GAT_BALANCE_STORAGE_KEY) || '0', 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const ABRIR_IMPULSA_KEY = 'gatoencerrado:abrir-impulsa';

const resolveInitialTab = (search = '', availableGat = 0) => {
  const params = new URLSearchParams(search);
  const rawTab = (params.get(TAB_QUERY_PARAM) || '').trim().toLowerCase();
  if (rawTab === 'waitlist' || rawTab === 'impulsar' || rawTab === 'activar') {
    return 'waitlist';
  }
  if (rawTab === 'escaparate' || rawTab === 'expande') {
    return 'escaparate';
  }
  if (rawTab === 'experiences' || rawTab === 'habita') {
    return 'experiences';
  }
  // Sin GAT todavía se necesita el mapa conceptual; con recorrido previo,
  // la entrada natural es aquello que ya puede habitarse.
  return availableGat > 0 ? 'experiences' : 'escaparate';
};

// "Antes de irte" — último espacio antes de Salida, después de Team
// ("Créditos del estreno escénico"). No depende de sesión a propósito: el botón es
// de descubrimiento, no de autenticación. Alianza Social (antes solo para
// autenticados, como sección hermana en App.jsx) ahora vive DENTRO de este
// mismo despliegue — aparece junto con el contenido de miniversos cuando el
// usuario abre la sección, no como sección aparte.
const MiniverseInlineSection = () => {
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.8 });
  const titleDisplay = useScrambleText(TITLE, { active: isTitleInView, hashAccents: true });
  // Persistido en sessionStorage: sin esto, volver de un portal (/portal-*)
  // remonta esta sección con isOpen=false — el scroll aterriza en el lugar
  // correcto, pero el contenido (modal + Alianza Social) ya no está.
  const [isOpen, setIsOpen] = useState(readMiniverseInlineOpenFromSession);
  // En escritorio la alianza espera un gesto (src/lib/revelarAlianza.js).
  const [alianzaRevelada, setAlianzaRevelada] = useState(alianzaYaRevelada);
  const location = useLocation();
  const [initialTabId, setInitialTabId] = useState(() =>
    resolveInitialTab(location.search, readAvailableGat())
  );
  // Mismo breakpoint/lógica que usaba Hero.jsx para este mismo contenido
  // (MiniverseModal inline). Sin esto, en mobile se quedaba con el padding y
  // max-width de desktop (px-6 + max-w-[920px] en vez de px-4 + max-w-2xl),
  // empujando los copies ya pulidos a más renglones de los que tenían.
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  const handleSelectMiniverse = useCallback((formatId) => {
    if (typeof window === 'undefined' || !formatId) return;
    safeSetItem(PENDING_MINIVERSE_SELECTION_KEY, formatId);
    // "Antes de irte" es de descubrimiento, no de autenticación (ver comentario
    // arriba) — pero el destino real de select-miniverse-format es un listener
    // dentro de <Transmedia />, que App.jsx solo monta si canAccessTransmedia es
    // true. Sin esto, un usuario que nunca pasó por el bridge dispara el evento
    // al vacío: nadie lo escucha y no pasa nada. Se pide el desbloqueo aquí para
    // que Transmedia monte a tiempo de capturar uno de los reintentos de abajo.
    window.dispatchEvent(new CustomEvent('gatoencerrado:request-transmedia-unlock'));
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

  // La devolución de La Réplica ("Sostener con mi huella") llega aquí: revela
  // esta sección, la abre y elige Impulsa. Si la sección aún no estaba montada
  // cuando se pidió, la petición espera en sessionStorage y se atiende al montar.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const abrirImpulsa = () => {
      try { window.sessionStorage.removeItem(ABRIR_IMPULSA_KEY); } catch {}
      setInitialTabId('waitlist');
      setIsOpen(true);
      writeMiniverseInlineOpenToSession();
      window.setTimeout(() => {
        document.getElementById('conoce-sistema')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    };
    let pendiente = false;
    try { pendiente = window.sessionStorage.getItem(ABRIR_IMPULSA_KEY) === '1'; } catch {}
    if (pendiente) abrirImpulsa();
    window.addEventListener('gatoencerrado:abrir-impulsa', abrirImpulsa);
    return () => window.removeEventListener('gatoencerrado:abrir-impulsa', abrirImpulsa);
  }, []);

  // Revelar la alianza. En escritorio se MONTA con el gesto (no antes y
  // escondida): así sus animaciones de entrada —los bloques y las barras del
  // modelo— ocurren al revelarse, como cuando se abría la taquilla.
  // - «Dejar huella» manda gatoencerrado:open-huella-activation. Si la alianza
  //   aún no está montada, nadie lo escucha: se revela aquí y se reenvía el
  //   aviso cuando CallToAction ya existe, para que baje y siga su flujo.
  // - Las demás puertas mandan revelar-alianza con un destino (o lo dejan
  //   esperando en sessionStorage si la sección no estaba montada).
  // - El regreso tras iniciar sesión para dejar huella la revela al montar.
  // - Un enlace directo a #apoya o #cta también.
  const estadoAlianzaRef = useRef({ revelada: alianzaRevelada, movil: isMobileViewport });
  estadoAlianzaRef.current = { revelada: alianzaRevelada, movil: isMobileViewport };
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // Espera a que el destino exista y tenga caja (el bloque se carga aparte).
    const cuandoExista = (id, alLlegar) => {
      let intentos = 0;
      const probar = () => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().height > 0) { alLlegar(el); return; }
        intentos += 1;
        if (intentos < 50) window.setTimeout(probar, 100);
      };
      window.setTimeout(probar, 120);
    };
    const bajarA = (id) => cuandoExista(id, (el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    const revelar = (destino) => {
      try { window.sessionStorage.removeItem(ALIANZA_PENDIENTE_KEY); } catch {}
      setAlianzaRevelada(true);
      if (!destino) return;
      setIsOpen(true);
      writeMiniverseInlineOpenToSession();
      bajarA(destino);
    };
    let pendiente = null;
    try { pendiente = window.sessionStorage.getItem(ALIANZA_PENDIENTE_KEY); } catch {}
    if (pendiente) revelar(pendiente);
    if (regresoDeHuellaPendiente()) setAlianzaRevelada(true);
    const porEnlace = () => {
      const ancla = String(window.location.hash || '').split('?')[0];
      if (ancla !== '#apoya' && ancla !== '#cta') return;
      setAlianzaRevelada(true);
      bajarA(ancla.slice(1));
    };
    porEnlace();
    const alPedir = (event) => revelar(event?.detail?.destino ?? null);
    const alDejarHuella = () => {
      const { revelada, movil } = estadoAlianzaRef.current;
      if (revelada || movil) return; // CallToAction ya está montado y lo atiende
      setAlianzaRevelada(true);
      try { window.sessionStorage.setItem(ALIANZA_REVELADA_KEY, '1'); } catch {}
      // Baja aquí mismo (no depende de que CallToAction ya escuche) y luego
      // reenvía el aviso para que CallToAction siga su flujo.
      cuandoExista('cta', (el) => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('gatoencerrado:open-huella-activation'));
        }, 80);
      });
    };
    window.addEventListener(REVELAR_ALIANZA_EVENT, alPedir);
    window.addEventListener('gatoencerrado:open-huella-activation', alDejarHuella);
    window.addEventListener('hashchange', porEnlace);
    return () => {
      window.removeEventListener(REVELAR_ALIANZA_EVENT, alPedir);
      window.removeEventListener('gatoencerrado:open-huella-activation', alDejarHuella);
      window.removeEventListener('hashchange', porEnlace);
    };
  }, []);

  const handleOpen = useCallback(() => {
    setInitialTabId(resolveInitialTab(location.search, readAvailableGat()));
    setIsOpen(true);
    writeMiniverseInlineOpenToSession();
  }, [location.search]);
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
      <section id="conoce-sistema" className="pt-0 pb-10 relative overflow-hidden">
        <div className="miniverse-inline-threshold" aria-hidden="true">
          <span className="miniverse-inline-threshold__mark">
            <Heart size={26} strokeWidth={1.6} />
          </span>
        </div>
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
                    useDeviceDemo
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
              className="p-8 md:p-12 text-center max-w-3xl mx-auto"
            >
              <h3 ref={titleRef} aria-label={TITLE} className="relative font-display text-3xl font-medium text-slate-100 mb-6 text-center">
                <span aria-hidden="true" className="invisible">{TITLE}</span>
                <span aria-hidden="true" className="titulo-perlado absolute inset-0">{titleDisplay}</span>
              </h3>
              <p className="text-slate-100/80 leading-relaxed mb-8 max-w-xl mx-auto font-light">
                Echa un vistazo a lo que hace posible este universo: <br></br>
                cómo se expande, qué hay para habitar <br></br>y de qué forma tu presencia lo impulsa.
              </p>
              <Button
                onClick={handleOpen}
                className="white-glass-btn white-glass-btn--active ge-mobile-cta-width mx-auto flex items-center gap-2 px-6 py-3 font-semibold"
              >
                <Sparkle size={20} />
                Ir a la taquilla
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
      {/* En escritorio se monta con el gesto (ver arriba); en el teléfono,
          al abrir la sección, como siempre. */}
      {isOpen && (isMobileViewport || alianzaRevelada) && (
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
              <AlianzaSocial entradaLateral={!isMobileViewport} />
            </Suspense>
          </SectionErrorBoundary>
        </motion.div>
      )}
    </>
  );
};

export default MiniverseInlineSection;
