import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import bgLogo from '@/assets/bg-logo.png';

const Hero = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  const handleScrollToAbout = useCallback(() => {
    const aboutSection = document.querySelector('#about');
    aboutSection?.scrollIntoView({ behavior: 'smooth' });
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
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-violet-900/90 via-transparent to-transparent blur-4xl"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-pink-600/40 via-transparent to-transparent blur-3xl"></div>
          </div>
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity pointer-events-none"
            style={{ filter: 'contrast(20%) brightness(105%)' }}
            alt="Textura de telón de teatro de terciopelo oscuro"
            src={bgLogo}
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
              className="flex flex-col gap-4 justify-center items-center"
            >
              <Button
                onClick={() => handleOpenReserve('preventa')}
                className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/40 transition"
              >
                <Ticket size={20} />
                Compra tu boleto
              </Button>

              <Button
                variant="ghost"
                onClick={handleScrollToAbout}
                className="text-slate-300 hover:text-white hover:bg-white/5 px-8 py-3 rounded-full font-semibold flex items-center gap-2 text-base"
              >
                Conoce la Obra
              </Button>
            </motion.div>
          </motion.div>

          {/* Flechita animada abajo */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-50 left-1/2 -translate-x-1/2 text-slate-500"
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
