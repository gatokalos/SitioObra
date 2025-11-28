import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Package, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';
import bgLogo from '@/assets/bg-logo.png';

const Hero = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

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

  const handleOpenTicket = useCallback(() => {
    setIsTicketModalOpen(true);
  }, []);

  const handleCloseTicket = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);

  return (
    <>
      <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
        
        {/* Fondo */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-pink-900/50 via-transparent to-transparent blur-4xl"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-purple-700/60 via-transparent to-transparent blur-3xl"></div>
          </div>
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity pointer-events-none"
            style={{ filter: 'contrast(25%) brightness(95%)' }}
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
  className="text-xl md:text-2xl text-slate-300/80 mb-12 leading-relaxed font-light flex flex-col items-center gap-1"
>
  El espacio transmedia donde late la obra
  <button
    onClick={() =>
      document.querySelector('#about')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
    className="
      text-slate-200 underline underline-offset-4 decoration-slate-400/50
      hover:text-white hover:decoration-purple-400 transition
      font-normal flex items-center gap-1
    "
  >
    Es un gato encerrado
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 opacity-80"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
</motion.p>


            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-col gap-4 justify-center items-center"
            >
          <div className="flex flex-col gap-4 justify-center items-center">

  {/* CTA PRINCIPAL */}
  <Button
    onClick={handleOpenTicket}
    className="
      px-8 py-4 rounded-full font-semibold
      flex items-center gap-2 text-white
      bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500
      shadow-[0_8px_32px_rgba(255,90,120,0.45)]
      hover:shadow-[0_12px_42px_rgba(255,90,120,0.55)]
      hover:scale-[1.03]
      transition-all duration-300 ease-out
      text-base tracking-wide
    "
  >
    <Ticket size={22} className="drop-shadow-md" />
    Comprar boleto
  </Button>

  {/* CTA SECUNDARIO — APARTAR MERCH */}
  <Button
    variant="outline"
    onClick={() => handleOpenReserve('preventa')}
    className="
      px-8 py-4 rounded-full font-semibold
      flex items-center gap-2
      backdrop-blur-xl 
      bg-white/5
      border border-purple-300/30
      text-purple-200
      hover:bg-purple-950/30
      hover:border-purple-300/60
      hover:shadow-[0_6px_24px_rgba(150,80,255,0.25)]
      hover:scale-[1.02]
      transition-all duration-300 ease-out
      text-base tracking-wide
    "
  >
    <Package size={20} className="text-purple-200/90 drop-shadow-sm" />
    Apartar merch
  </Button>
   {/* Microtexto */}
    <p className="text-xs text-slate-400/70 leading-tight">
      Paquetes disponibles solo el día del evento.
    </p>

</div>


     
            </motion.div>
          </motion.div>

     
        </div>
      </section>

      <ReserveModal open={isReserveOpen} onClose={handleCloseReserve} initialInterest="preventa" />
      <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
    </>
  );
};

export default Hero;
