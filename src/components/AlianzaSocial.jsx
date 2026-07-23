import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PawPrint, Send, Smartphone } from 'lucide-react';
import CallToAction from '@/components/CallToAction';
import CauseImpactAccordion from '@/components/transmedia/CauseImpactAccordion';
import useMiniversoShare from '@/hooks/useMiniversoShare';
import useExternalPanels from '@/hooks/useExternalPanels';
import { toast } from '@/components/ui/use-toast';
import {
  CAUSE_ACCORDION,
  CAUSE_SITE_URL,
} from '@/components/transmedia/transmediaConstants';
import { supabase } from '@/lib/supabaseClient';

const noopAuth = () => true;
const IMAGE_PREVIEW_DATASET_KEY = 'gatoImagePreviewOpen';

const AlianzaSocial = () => {
  const sectionRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [openCauseIds, setOpenCauseIds] = useState(new Set());
  const [expandAllTrigger, setExpandAllTrigger] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches
  );
  const detailsRef = useRef(null);

  const { isCauseSiteOpen, handleOpenCauseSite, handleCloseCauseSite } = useExternalPanels({
    requireShowcaseAuth: noopAuth,
    toast,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handle = (e) => setIsMobileViewport(!e.matches);
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handle);
    else mq.addListener(handle);
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handle);
      else mq.removeListener(handle);
    };
  }, []);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return undefined;
    const handleToggle = () => {
      if (el.open && isMobileViewport) setExpandAllTrigger((t) => t + 1);
    };
    el.addEventListener('toggle', handleToggle);
    return () => el.removeEventListener('toggle', handleToggle);
  }, [isMobileViewport]);

  // Fade del audio de Silvestre cuando la sección entra al viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          window.dispatchEvent(new CustomEvent('gatoencerrado:fade-silvestre'));
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleOpenImagePreview = useCallback((payload) => {
    if (!payload?.src) return;
    setImagePreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
      label: payload.label ?? '',
    });
  }, []);

  const handleCloseImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  useEffect(() => {
    if (!imagePreview || typeof document === 'undefined') return undefined;

    const { documentElement, body } = document;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlScrollBehavior = documentElement.style.scrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;
    const previousBodyScrollBehavior = body.style.scrollBehavior;
    const previousOverscrollBehavior = documentElement.style.overscrollBehavior;

    documentElement.dataset[IMAGE_PREVIEW_DATASET_KEY] = 'true';
    documentElement.style.overflow = 'hidden';
    documentElement.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseImagePreview();
      }
    };
    const preventGesture = (event) => event.preventDefault();
    const preventMultiTouch = (event) => {
      if (event.touches?.length > 1) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchmove', preventMultiTouch, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchmove', preventMultiTouch);
      documentElement.style.scrollBehavior = 'auto';
      body.style.scrollBehavior = 'auto';
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousOverscrollBehavior;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      body.style.overflow = previousBodyOverflow;
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
        body.style.scrollBehavior = previousBodyScrollBehavior;
        delete documentElement.dataset[IMAGE_PREVIEW_DATASET_KEY];
      });
    };
  }, [handleCloseImagePreview, imagePreview]);

  const { handleShareImpactModel } = useMiniversoShare({ toast });

  const handleOpenInteractiveExperiencePlaceholder = useCallback(async () => {
    const base = 'https://app.gatoencerrado.org';
    // Abrir la ventana sincrónicamente (gesto directo del usuario) para no ser bloqueado en móvil
    const win = window.open(`${base}/?ref=sitioobra`, '_blank', 'noopener,noreferrer');
    // Intentar enriquecer con el token si hay sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && win && !win.closed) {
      win.location.replace(
        `${base}/?handoff=${encodeURIComponent(session.access_token)}&ref=sitioobra`
      );
    }
  }, []);

  return (
    <>
      <section ref={sectionRef} id="apoya" className="py-16 relative">
        <div className="section-divider mb-12" />
        {/* px-0 en móvil: edge-to-edge; sm:px-6 en adelante */}
        <div className="container mx-auto px-0 sm:px-6">
          <div className="grid items-start lg:grid-cols-[3fr_2fr] gap-0 sm:gap-10">

            {/* Columna izquierda: causa social */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.15 }}
              className="glass-effect rounded-none sm:rounded-2xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden mb-0 sm:mb-0"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-5 bg-no-repeat bg-center bg-[length:auto_100%] md:bg-[length:200%]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(5,5,10,0.85), rgba(5,5,10,0.85)), url(/assets/bg-logo.png)',
                  backgroundBlendMode: 'screen',
                  filter: 'grayscale(0.25)',
                }}
              />
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Impacto Social</p>
                  <button
                    type="button"
                    onClick={handleShareImpactModel}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200/90 hover:border-purple-300/40 hover:text-white transition"
                    aria-label="Compartir crecimiento compartido"
                  >
                    <Send size={14} className="text-purple-200" />
                  </button>
                </div>
                <h3 className="font-display text-3xl text-slate-100">
                  Déjanos una huella
                </h3>
                <div className="space-y-4 text-slate-300/80 leading-relaxed font-light">
                  <p>
                    <span className="font-semibold text-purple-200">Tu huella sostiene al universo #GatoEncerrado.</span>{' '}
                    Cada huella activada recorre tres tramos que operamos en alianza con <strong>Isabel Ayuda para la Vida, A.C.,</strong>{' '}
                    cuya confianza hizo posible el inicio de este proyecto.
                  </p>
                  <p className="text-lg font-medium text-white">Primero se sostiene la causa social, y cualquier excedente se destina a nueva obra: un modelo en cascada ✨</p>
                </div>
                <details ref={detailsRef} className="group rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <PawPrint size={18} className="text-emerald-200" />
                      <span className="text-[0.7rem] uppercase tracking-[0.26em] text-emerald-200/85">
                        Así funciona…
                      </span>
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-[0.18em] text-emerald-200/80 group-open:text-white">
                      <span className="group-open:hidden">Pulsar</span>
                      <span className="hidden group-open:inline">Cerrar</span>
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 pl-8">
                    <p className="text-sm leading-relaxed text-slate-200/95">
                      ✔️ 17 huellas completan un tramo de 102 sesiones de terapia al año.<br /><br />
                      ✔️ Desde la huella 18 inicia el siguiente tramo: talleres escolares con artistas.<br /><br />
                      ✔️ Tu huella es lo que pone en marcha este proyecto entre arte y comunidad.
                    </p>
                  </div>
                </details>

                <CauseImpactAccordion
                  items={CAUSE_ACCORDION}
                  onOpenImagePreview={handleOpenImagePreview}
                  onOpenChange={setOpenCauseIds}
                  expandAllTrigger={expandAllTrigger}
                />

                {openCauseIds.has('app-escolar') && (
                  <div className="relative overflow-hidden rounded-xl border border-emerald-200/35 bg-black/35 px-4 py-3.5 text-left">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.22),transparent_48%),radial-gradient(circle_at_82%_65%,rgba(45,212,191,0.16),transparent_35%)]" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/12 via-transparent to-cyan-300/10" />
                    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex items-center gap-3">
                        <img
                          src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/causa_social.png"
                          alt="Causa Social"
                          loading="lazy"
                          className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-base font-semibold text-slate-100">
                            ¿Quieres explorar la app "Qué es estar bien"?
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenInteractiveExperiencePlaceholder}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60 hover:bg-emerald-300/15 hover:text-white whitespace-nowrap"
                      >
                        <Smartphone size={15} />
                        Descárgala aquí
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-relaxed text-slate-300/85">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="w-full md:w-auto md:flex-shrink-0">
                      <img
                        src="/assets/isabel_banner.png"
                        alt="Isabel Ayuda para la Vida"
                        loading="lazy"
                        className="mx-auto h-14 w-auto object-contain md:mx-0 md:h-16"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">Sin costo para familias</p>
                      <p className="mt-1">
                        La asociación detecta y acompaña a tiempo a niños y jóvenes. <br/>
                        No hay costo obligatorio para las familias. Su causa se sostiene con apoyos institucionales, donaciones y activación de huellas.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCauseSite}
                        className="mt-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 hover:text-white transition"
                      >
                        Ver sitio de Isabel A.C. →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Columna derecha: CTA + cita */}
            <div className="space-y-0 sm:space-y-5">
              <motion.div
                id="cta"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                viewport={{ once: true, amount: 0.15 }}
                className="relative"
              >
                <div className="rounded-none sm:rounded-2xl overflow-hidden">
                  <CallToAction barsIntroDelayMs={900} />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                viewport={{ once: true, amount: 0.15 }}
                className="relative overflow-hidden rounded-none sm:rounded-2xl border-t sm:border border-white/10 bg-black/30 p-6 text-center shadow-[0_12px_36px_rgba(0,0,0,0.35)] md:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ opacity: 0.35, scale: 0.9 }}
                    animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-[88%] w-[88%] rounded-full bg-purple-600/25 blur-[90px] md:h-[72%] md:w-[72%]"
                  />
                </div>
                <div className="relative z-10">
                  <p className="text-base italic leading-relaxed text-slate-400 md:text-medium">
                    "Cada experiencia alimenta también una investigación sobre cómo las obras transforman a quienes las habitan —conocimiento que el proyecto devuelve, abierto, a la comunidad."
                  </p>
                  <div className="mt-4 text-sm text-slate-400">
                    <p className="font-semibold text-slate-200">Equipo 💜 #GatoEncerrado</p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Iframe Isabel Ayuda para la Vida */}
      <AnimatePresence>
        {isCauseSiteOpen ? (
          <motion.div
            key="cause-site-iframe"
            className="fixed inset-0 z-[175] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCauseSite}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Isabel Ayuda para la Vida"
              className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Causa social</p>
                  <h3 className="font-display text-2xl text-slate-100">Isabel Ayuda para la Vida</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {CAUSE_SITE_URL ? (
                    <a
                      href={CAUSE_SITE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseCauseSite}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[16/10] bg-black">
                {CAUSE_SITE_URL ? (
                  <iframe
                    src={CAUSE_SITE_URL}
                    title="Isabel Ayuda para la Vida"
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
                    No se pudo cargar el sitio.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Image preview portal */}
      {typeof document !== 'undefined' && imagePreview
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={imagePreview.title || 'Vista previa de imagen'}
              className={`fixed inset-0 z-[240] ${
                isMobileViewport
                  ? 'flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-black/95'
                  : 'flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none'
              }`}
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImagePreview} />
              <div
                className={
                  isMobileViewport
                    ? 'relative z-10 flex h-full w-full flex-col pt-[env(safe-area-inset-top)]'
                    : 'relative z-10 my-10 w-[calc(100vw-2rem)] max-w-3xl'
                }
              >
                <div className={isMobileViewport ? 'flex h-14 shrink-0 justify-end px-4 py-3' : 'flex justify-end mb-4'}>
                  <button
                    type="button"
                    onClick={handleCloseImagePreview}
                    className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm text-slate-300 backdrop-blur-md transition hover:border-white/30 hover:text-white"
                  >
                    Cerrar ✕
                  </button>
                </div>
                <div
                  className={
                    isMobileViewport
                      ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950/95'
                      : 'rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden'
                  }
                >
                  <div
                    className={
                      isMobileViewport
                        ? 'relative flex min-h-0 flex-1 items-center justify-center bg-black/70'
                        : 'relative w-full aspect-[4/3] bg-black/60'
                    }
                    style={isMobileViewport ? { touchAction: 'manipulation' } : undefined}
                  >
                    <img
                      src={imagePreview.src}
                      alt={imagePreview.title || 'Vista previa'}
                      className={
                        isMobileViewport
                          ? 'h-full w-full select-none object-contain'
                          : 'absolute inset-0 w-full h-full object-contain'
                      }
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  {(imagePreview.title || imagePreview.description) ? (
                    <div
                      className={
                        isMobileViewport
                          ? 'max-h-[30dvh] shrink-0 space-y-2 overflow-y-auto border-t border-white/10 bg-slate-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
                          : 'p-6 space-y-2'
                      }
                    >
                      {imagePreview.title ? (
                        <h4 className={isMobileViewport ? 'font-display text-xl text-slate-100' : 'font-display text-2xl text-slate-100'}>
                          {imagePreview.title}
                        </h4>
                      ) : null}
                      {imagePreview.description ? (
                        <p className={isMobileViewport ? 'text-xs leading-relaxed text-slate-300/80' : 'text-sm text-slate-300/80 leading-relaxed'}>
                          {imagePreview.description}
                        </p>
                      ) : null}
                      <p className="text-[10px] uppercase tracking-[0.34em] text-slate-500 sm:text-xs sm:tracking-[0.4em]">
                        {imagePreview.label || 'Ilustración de la novela'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default AlianzaSocial;
