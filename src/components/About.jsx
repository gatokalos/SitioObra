import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Film, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getTrailerPublicUrl } from '@/services/trailerService';

const aboutText = `#GatoEncerrado comienza donde otras historias terminan: con una ausencia.
Pero esta obra no desaparece del todo. 
Queda suspendida en gestos, en retazos de memoria, en las cosas que no se atreven a irse.
Esto no es solo un montaje escénico. Es una caja que se abre y deja salir fragmentos de emoción, cuerpo, misterio y eco. Un espacio donde lo que parece ficción revela lo que no supimos decir.
Tal vez tú también has sentido un gato encerrado en el pecho.`;

const About = () => {
  const [trailer, setTrailer] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);

  const handlePlaceholderClick = () => {
    toast({
      description: '🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀',
    });
  };

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
                El Espíritu de la Obra
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-8 font-light">
                En un mundo donde ya no distinguimos lo real de lo imaginado,
                #GatoEncerrado no ofrece certezas.
                Ofrece preguntas:
                ¿Qué es estar? ¿Qué es irse? ¿Qué queda cuando alguien se va?
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
                  onClick={handlePlaceholderClick}
                  className="border-slate-100/20 text-slate-200 hover:bg-slate-100/10 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  <Ticket size={20} />
                  Comprar Boletos
                </Button>
              </div>
              <Button
                variant="link"
                onClick={handlePlaceholderClick}
                className="text-purple-400 hover:text-purple-300 mt-4 flex items-center gap-2"
              >
                <Download size={16} />
                Descargar App
              </Button>
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
  );
};

export default About;
