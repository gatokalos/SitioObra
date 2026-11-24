import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Las temporadas de la obra de teatro (antes en Caída del telón). Desde el
// 23 nov 2026 cierran el archivo que abre «Visitar archivo» en El aplauso,
// después de los créditos y la galería. No despliega nada: se ve ahí mismo.
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
    ],
  },
];

const TemporadasEscenicas = () => {
  const [activeShowId, setActiveShowId] = useState('cecut');
  // Quien llega hasta aquí recorrió el archivo completo: la taquilla («Antes
  // de irte») aparece sola debajo, sin mover la pantalla, para que no tenga
  // que volver a subir a El aplauso (Carlos, 23 nov 2026).
  const tarjetaRef = useRef(null);
  useEffect(() => {
    const tarjeta = tarjetaRef.current;
    if (!tarjeta || typeof IntersectionObserver === 'undefined') return undefined;
    // Cuenta solo si la tarjeta se queda a la vista casi un segundo: al
    // abrir Créditos o Galería la página pasa por encima de ella de camino.
    let espera = 0;
    const observador = new IntersectionObserver((entradas) => {
      const aLaVista = entradas.some((e) => e.isIntersecting);
      window.clearTimeout(espera);
      if (!aLaVista) return;
      espera = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-before-leaving'));
        observador.disconnect();
      }, 900);
    }, { threshold: 0.5 });
    observador.observe(tarjeta);
    return () => {
      window.clearTimeout(espera);
      observador.disconnect();
    };
  }, []);
  const activeShow = useMemo(
    () => SHOW_HISTORY.find((show) => show.id === activeShowId) ?? SHOW_HISTORY[0],
    [activeShowId]
  );

  // Gemela de la tarjeta del video («Sentirse menos solxs», About.jsx), a
  // pedido de Carlos (23 nov 2026): la misma rejilla, la foto del alto del
  // video (h-96) y las temporadas como sus dos botones, en el mismo lugar.
  return (
    <section id="temporadas" className="relative pb-24">
    <div className="container mx-auto px-6">
    <motion.div
      ref={tarjetaRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="glass-effect relative overflow-hidden rounded-2xl p-8 md:p-12"
    >
      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeShow.id}-image`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="order-2 md:order-1 w-full overflow-hidden rounded-xl shadow-2xl shadow-black/50"
          >
            <img
              src={activeShow.image}
              alt={activeShow.title}
              className="h-96 w-full object-cover"
              width={1200}
              height={900}
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </AnimatePresence>

        <div className="order-1 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeShow.id}-copy`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <h3 className="font-display mb-3 text-3xl font-medium text-slate-100">{activeShow.title}</h3>
              <div className="mb-5 flex items-center gap-3 text-sm text-slate-300/80">
                <Calendar size={18} className="text-purple-300" />
                <span className="uppercase tracking-[0.25em]">{activeShow.dateLabel}</span>
              </div>
              <div className="mb-8 space-y-3 text-slate-50/50 leading-relaxed font-light">
                {activeShow.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex flex-col lg:flex-row gap-4">
            {SHOW_HISTORY.map((show) => (
              <Button
                key={show.id}
                type="button"
                variant="outline"
                onClick={() => setActiveShowId(show.id)}
                aria-pressed={activeShowId === show.id}
                className={`ge-chip-action ${
                  activeShowId === show.id ? 'ge-chip-action--primary' : 'ge-chip-action--secondary'
                }`}
              >
                {show.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="absolute -top-20 -left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
      <div aria-hidden="true" className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
    </motion.div>
    </div>
    </section>
  );
};

export default TemporadasEscenicas;
