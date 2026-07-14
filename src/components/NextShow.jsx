import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Coffee, BookOpen, DoorOpen, ShoppingBag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPortalLaunchState } from '@/lib/portalNavigation';

const ROTATING_SUPPORT_CTAS = [
  { label: 'Café', Icon: Coffee },
  { label: 'Charla', Icon: BookOpen },
  { label: 'Merch', Icon: ShoppingBag },
];

const SHOW_HISTORY = [
  {
    id: 'camafeo',
    label: 'Camafeo · May',
    title: 'Teatro Camafeo',
    dateLabel: 'Temporada · mayo 2025',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/cedes/camafeo_mayo.jpg',
    description: [
      'Aquí comenzó la temporada escénica de Es un gato encerrado.',
      'Camafeo fue el espacio que hizo posible el montaje, las primeras funciones abiertas y privadas, y el encuentro directo con el público.',
      'La obra tomó forma aquí.',
    ],
  },
  {
    id: 'cecut',
    label: 'CECUT · Dic',
    title: 'Centro Cultural Tijuana',
    dateLabel: 'Presentación · diciembre 2025',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/cedes/Cecut_diciembre.JPG',
    description: [
      'En diciembre, la obra tuvo una función especial en un momento inédito: por primera vez, en más de 25 años del CECUT, se presentó teatro durante la última semana del año.',
      'La obra cerró el 2025 en escena.',
      'La conversación sigue abierta.',
    ],
  },
];

const NextShow = () => {
  const [activeShowId, setActiveShowId] = useState('cecut');
  const [supportCtaIndex, setSupportCtaIndex] = useState(0);
  const [isSupportCtaHovered, setIsSupportCtaHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeShow = useMemo(
    () => SHOW_HISTORY.find((show) => show.id === activeShowId) ?? SHOW_HISTORY[0],
    [activeShowId]
  );
  const currentSupportCta = ROTATING_SUPPORT_CTAS[supportCtaIndex];

  useEffect(() => {
    const ROTATION_MS = 4000;
    if (isSupportCtaHovered) return undefined;

    const intervalId = window.setInterval(() => {
      setSupportCtaIndex((prev) => (prev + 1) % ROTATING_SUPPORT_CTAS.length);
    }, ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [isSupportCtaHovered]);

  const handleOpenReserve = useCallback(() => {
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'next-show-encuentros'),
    });
  }, [location, navigate]);

  // Caída del Telón: revela Obra Destacada + Créditos de la obra
  const handlePrimaryAction = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-obra-destacada'));
    window.setTimeout(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  return (
    <>
      <section id="next-show" className="py-24 relative min-h-[760px] md:min-h-[820px]">
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden min-h-[520px] md:min-h-[560px]"
          >
            <div className="relative z-10">
              <h3 className="font-display text-3xl font-medium text-slate-100 mb-6 text-center">
                La caída del telón
              </h3>
              <div className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light text-center space-y-4">
                <p><em>Hay historias que dejan de representarse para empezar a recordarse.</em></p>
                <p>Cada función desapareció la misma noche en que ocurrió. Este espacio conserva fragmentos de <strong>Es un gato encerrado</strong>: escenas, fotografías, videos y memorias de encuentro único entre quienes la crearon y quienes la presenciaron.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {SHOW_HISTORY.map((show) => (
                  <button
                    key={show.id}
                    type="button"
                    onClick={() => setActiveShowId(show.id)}
                    className={`ge-chip-filter ${
                      activeShowId === show.id
                        ? 'ge-chip-filter--active'
                        : 'ge-chip-filter--idle'
                    }`}
                  >
                    {show.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeShow.id}-image`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl bg-black/40">
                      <img
                        src={activeShow.image}
                        alt={activeShow.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        width={1200}
                        height={900}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeShow.id}-copy`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <h3 className="font-display text-2xl text-slate-100">{activeShow.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-300/80">
                      <Calendar size={18} className="text-purple-300" />
                      <span className="uppercase tracking-[0.25em]">{activeShow.dateLabel}</span>
                    </div>
                    <div className="text-base text-slate-300/80 leading-relaxed space-y-3">
                      {activeShow.description.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-10 flex flex-col gap-4 justify-center items-center">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={handlePrimaryAction}
                    className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/40 transition"
                  >
                    <DoorOpen size={20} />
                    Entra a ver
                  </Button>

                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleOpenReserve}
                    onMouseEnter={() => setIsSupportCtaHovered(true)}
                    onMouseLeave={() => setIsSupportCtaHovered(false)}
                    className="ge-chip-action ge-chip-action--secondary"
                  >
                    <span className="relative inline-flex items-center">
                      <span className="invisible inline-flex items-center gap-2" aria-hidden="true">
                        <currentSupportCta.Icon size={20} />
                        {currentSupportCta.label}
                      </span>
                      <AnimatePresence mode="sync" initial={false}>
                        <motion.span
                          key={currentSupportCta.label}
                          initial={{ opacity: 0, filter: 'blur(14px)' }}
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, filter: 'blur(14px)' }}
                          transition={{ duration: 0.6, ease: [0.2, 1, 0.2, 1] }}
                          className="absolute inset-0 inline-flex items-center gap-2"
                        >
                          <currentSupportCta.Icon size={20} />
                          {currentSupportCta.label}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </Button>

                </div>
              </div>
            </div>

            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default NextShow;
