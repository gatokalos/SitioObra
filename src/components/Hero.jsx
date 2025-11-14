import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';

const Hero = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  const handleScrollToTransmedia = useCallback(() => {
    const transmediaSection = document.querySelector('#transmedia');
    transmediaSection?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleOpenReserve = useCallback(() => {
    setIsReserveOpen(true);
  }, []);

  const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  return (
    <>
      <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-900/80 via-transparent to-transparent blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-900/60 via-transparent to-transparent blur-3xl"></div>
          </div>
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity"
            alt="Textura de telón de teatro de terciopelo oscuro"
            src="/assets/bg-logo.png"
          />
        </div>

        {/* Contenido */}
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="font-display text-5xl md:text-7xl font-medium italic mb-6 text-gradient"
              style={{ textShadow: '0 0 20px rgba(233, 213, 255, 0.3)' }}
            >
              #GatoEncerrado
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-xl md:text-2xl text-slate-300/80 mb-12 leading-relaxed font-light"
            >
              Lo ves aquí, pero su voz también habita otras dimensiones.
            </motion.p>

            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={handleOpenReserve}
                className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow text-base"
              >
                <Ticket size={20} />
                Comprar boletos
              </Button>

              <Button
                variant="ghost"
                onClick={handleScrollToTransmedia}
                className="text-slate-300 hover:text-white hover:bg-white/5 px-8 py-3 rounded-full font-semibold flex items-center gap-2 text-base"
              >
                Unirse a la causa
                <ArrowDown size={20} />
              </Button>
            </motion.div>
          </motion.div>

          {/* Flechita animada abajo */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
          >
            <ArrowDown size={24} />
          </motion.div>
        </div>
      </section>

      <ReserveModal open={isReserveOpen} onClose={handleCloseReserve} initialInterest="preventa" />
    </>
  );
};

export default Hero;
