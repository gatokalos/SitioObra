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

const noopAuth = () => true;

const AlianzaSocial = () => {
  const sectionRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);

  const { isCauseSiteOpen, handleOpenCauseSite, handleCloseCauseSite } = useExternalPanels({
    requireShowcaseAuth: noopAuth,
    toast,
  });

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

  const { handleShareImpactModel } = useMiniversoShare({ toast });

  const handleOpenInteractiveExperiencePlaceholder = useCallback(() => {
    toast({
      title: 'App Causa Social en beta',
      description: 'La app Causa Social todavía está en pruebas beta. Próximamente la verás aquí.',
    });
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
                  Déjanos tu huella
                </h3>
                <div className="space-y-4 text-slate-300/80 leading-relaxed font-light">
                  <p>
                    <span className="font-semibold text-purple-200">La taquilla sostiene a la obra de teatro. Tu huella sostiene a #GatoEncerrado.</span>{' '}
                    Cada huella activada se distribuye en tres frentes que operamos en alianza con <strong>Isabel Ayuda para la Vida, A.C.,</strong>{' '}
                    cuya confianza hizo posible el inicio de este proyecto.
                  </p>
                  <p className="text-lg font-medium text-white">Cualquier excedente se reinvierte en nuevas formas de la obra ✨</p>
                </div>
                <details className="group rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-5 py-4">
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
                />

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
                          Experiencia interactiva <span className="text-slate-400">|</span> ¿Qué es estar bien?
                        </p>
                        <p className="mt-1 text-sm text-slate-300/90">
                          La app Causa Social sigue en pruebas beta. Muy pronto podrás verla aquí.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenInteractiveExperiencePlaceholder}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60 hover:bg-emerald-300/15 hover:text-white whitespace-nowrap"
                    >
                      <Smartphone size={15} />
                      Próximamente
                    </button>
                  </div>
            
                </div>

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
                    "Cuando estas huellas florezcan, las nueve formas de la obra se expandirán, impulsadas por lo que la comunidad habite."
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
            <div className="fixed inset-0 z-[240] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImagePreview} />
              <div className="relative z-10 my-10 w-[calc(100vw-2rem)] max-w-3xl">
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={handleCloseImagePreview}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
                  <div className="relative w-full aspect-[4/3] bg-black/60">
                    <img
                      src={imagePreview.src}
                      alt={imagePreview.title || 'Vista previa'}
                      className="absolute inset-0 w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {(imagePreview.title || imagePreview.description) ? (
                    <div className="p-6 space-y-2">
                      {imagePreview.title ? (
                        <h4 className="font-display text-2xl text-slate-100">{imagePreview.title}</h4>
                      ) : null}
                      {imagePreview.description ? (
                        <p className="text-sm text-slate-300/80 leading-relaxed">{imagePreview.description}</p>
                      ) : null}
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
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
