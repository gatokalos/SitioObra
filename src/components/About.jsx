import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Ticket, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getTrailerPublicUrl } from '@/services/trailerService';
import ReserveModal from '@/components/ReserveModal';

const aboutText = `Es un gato encerrado existe como obra y como universo transmedial: es, al mismo tiempo, un relato íntimo en un escenario y una constelación de la mente y del dolor humano en múltiples lenguajes artísticos. Esta obra es el corazón que hace pulsar aquellas preguntas que no están aquí para contestarse, sino para sentirlas en compañía. En pocas palabras, cuando la obra está latente, el universo #GatoEncerrado continúa latiendo en otras narrativas. Un recordatorio de que el corazón nunca se encierra del todo.`;

const testimonials = [
  {
    quote:
      '“Salir de la función fue como despertar con nuevos recuerdos. La obra me obligó a conversar con mis propias ausencias.”',
    author: 'Maru Solano',
    role: 'Espectadora / Tijuana',
  },
  {
    quote:
      '“#GatoEncerrado nos recuerda que el teatro puede ser también archivo emocional y dispositivo de memoria.”',
    author: 'Dr. Leonel Ceballos',
    role: 'Crítico invitado',
  },
];

const About = () => {
  const [trailer, setTrailer] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveIntent, setReserveIntent] = useState('preventa');

  const handleOpenReserve = useCallback((intent) => {
    setReserveIntent(intent);
    setIsReserveOpen(true);
  }, []);

  const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  const handleScrollToTexts = useCallback(() => {
    const section = document.querySelector('#textos-blog');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleWatchTrailer = useCallback(async () => {
    if (isTrailerLoading) {
      return;
    }

    if (trailer?.url) {
      setIsTrailerOpen(true);
      return;
    }

    try {
      setIsTrailerLoading(true);
      const trailerData = await getTrailerPublicUrl('trailer');

      if (trailerData?.url) {
        setTrailer(trailerData);
        setIsTrailerOpen(true);
      } else {
        toast({ description: 'El tráiler aún no está disponible. Intenta más tarde.' });
      }
    } catch (err) {
      console.error('Error al obtener el tráiler:', err);
      toast({ description: 'No se pudo cargar el tráiler. Inténtalo de nuevo más tarde.' });
    } finally {
      setIsTrailerLoading(false);
    }
  }, [isTrailerLoading, trailer]);

  const handleCloseTrailer = useCallback(() => {
    setIsTrailerOpen(false);
    const video = document.getElementById('gato-encerrado-trailer');
    if (video && typeof video.pause === 'function') {
      video.pause();
    }
  }, []);

  return (
    <>
    <section id="about" className="py-24 relative">
      <div className="section-divider mb-24"></div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            Sobre la Obra
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light whitespace-pre-line">
            {aboutText}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="glass-effect rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <img
                className="w-full h-96 object-cover rounded-xl shadow-2xl shadow-black/50"
                alt="Escena de la obra #GatoEncerrado, luz tenue y misteriosa"
                src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/DSC02497.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" aria-hidden="true" />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="font-display text-3xl font-medium text-slate-100 mb-6">
                La Mente de Silvestre
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-8 font-light">
                Silvestre vive en <strong>Es un gato encerrado</strong>. Este es el <i>rincón onírico</i> donde enfrenta sus desdoblamientos y dilemas existenciales. Aquí, lo real y lo imaginario ya no compiten. Y tú —espectador, visitante, cómplice— puedes entrar sin tocar la puerta, porque quizás… tú también tienes un gato encerrado en el pecho.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleWatchTrailer}
                  disabled={isTrailerLoading}
                  className="bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow"
                >
                  <Film size={20} />
                  {isTrailerLoading ? 'Cargando…' : 'Ver Tráiler'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenReserve('preventa')}
                  className="border-slate-100/20 text-slate-200 hover:bg-slate-100/10 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  <Ticket size={20} />
                  Comprar Boletos
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mt-16 glass-effect rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-center">
            <div>
              <p className="uppercase tracking-[0.35em] text-xs text-slate-400/80 mb-4">Perspectivas del público</p>
              <h3 className="font-display text-3xl text-slate-100 mb-6 italic">
                ¿Qué provoca La Obra?
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-6 font-light">
                Reunimos testimonios, críticas y preguntas abiertas que continúan la conversación. Haz scroll hacia
                Textos y Blog para leer más y compartir tu propia mirada.
              </p>
              <Button
                variant="outline"
                onClick={handleScrollToTexts}
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20"
              >
                Aquí puedes leer y compartir tu perspectiva sobre La Obra
              </Button>
            </div>
            <div className="space-y-6">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                  <Quote className="text-purple-300 mb-4" size={28} />
                  <p className="text-slate-200 italic leading-relaxed mb-4">{item.quote}</p>
                  <div className="text-sm text-slate-400">
                    <p className="text-slate-200 font-semibold">{item.author}</p>
                    <p>{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isTrailerOpen && trailer?.url && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              onClick={handleCloseTrailer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-slate-200 uppercase tracking-[0.35em] text-xs">
                <span>Tráiler #GatoEncerrado</span>
                <button
                  onClick={handleCloseTrailer}
                  className="text-slate-300 hover:text-white transition"
                  aria-label="Cerrar tráiler"
                >
                  ✕
                </button>
              </div>
              <div className="relative aspect-video bg-black">
                <video
                  id="gato-encerrado-trailer"
                  key={trailer.url}
                  src={trailer.url}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>

      <ReserveModal
        open={isReserveOpen}
        onClose={handleCloseReserve}
        initialInterest={reserveIntent}
      />
    </>
  );
};

export default About;
