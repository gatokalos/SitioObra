import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Coffee, CoffeeIcon, Globe, Globe2, MapPin, MapPinIcon, ShoppingBag, SparkleIcon, Users, Users2, Users2Icon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';
import bgLogo from '@/assets/bg-logo.png';
import isotipoGato from '@/assets/isotipo-gato.png';

const Hero = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [primaryCtaWidth, setPrimaryCtaWidth] = useState(null);
  const primaryCtaRef = useRef(null);

  const rotatingCtas = [
    { label: 'Café', Icon: CoffeeIcon },
    { label: 'Club', Icon: BookOpen },
    { label: 'Merch', Icon: ShoppingBag },
  ];
  const currentCta = rotatingCtas[ctaIndex];
  const targetWidth = primaryCtaWidth ?? undefined;

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

  const handleOpenMiniverseList = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gatoencerrado:open-miniverse-list'));
    }
  }, []);

  const handleCloseTicket = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);

  useEffect(() => {
    const ROTATION_MS = 4000;
    if (isCtaHovered) return undefined;

    const intervalId = window.setInterval(() => {
      setCtaIndex((prev) => (prev + 1) % rotatingCtas.length);
    }, ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [isCtaHovered, rotatingCtas.length]);

  useLayoutEffect(() => {
    const el = primaryCtaRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      setPrimaryCtaWidth(Math.ceil(el.getBoundingClientRect().width));
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
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
            className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-pin-light pointer-events-none"
            style={{ filter: 'contrast(15%) brightness(75%)' }}
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
            <motion.img
              src={isotipoGato}
              alt="Isotipo de Gato Encerrado"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="mx-auto mb-6 w-24 sm:w-28 md:w-32 drop-shadow-[0_12px_45px_rgba(233,213,255,0.35)]"
            />
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium mb-6 text-center w-full break-words"
              style={{ textShadow: '0 0 35px rgba(255, 223, 255, 0.45)' }}
            >
              <span>#GATOENCERRADO</span>
            </motion.h1>

            <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1.5, delay: 0.5 }}
  className="text-xl md:text-2xl text-slate-300/80 mb-12 leading-relaxed font-light flex flex-col items-center gap-1"
>
  El universo transmedial de la obra
  <button
    onClick={() =>
      document.querySelector('#about')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
    className="
      text-slate-200 underline underline-offset-4 decoration-slate-400/30
      hover:text-white hover:decoration-purple-400 transition
      font-normal flex items-center gap-1
    "
  >
    
    Es un gato encerrado
    <svg
  xmlns="http://www.w3.org/2000/svg"
  className="h-4 w-4 opacity-80 animate-[pulse-soft_2.4s_ease-in-out_infinite]"
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
    ref={primaryCtaRef}
    onClick={handleOpenMiniverseList}
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
    <SparkleIcon size={22} className="drop-shadow-md" />
    Abrir Portales
  </Button>

  {/* CTA SECUNDARIO — CAFÉ */}
  <Button
    asChild
    variant="outline"
    onClick={() => handleOpenReserve('preventa')}
    onMouseEnter={() => setIsCtaHovered(true)}
    onMouseLeave={() => setIsCtaHovered(false)}
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
    <motion.button
      type="button"
      animate={targetWidth ? { width: targetWidth } : undefined}
      transition={{ width: { duration: 3, ease: [0.2, 1, 0.2, 1] } }}
      className="inline-flex items-center justify-center"
    >
      <span className="relative inline-flex items-center">
        <span className="invisible inline-flex items-center gap-2" aria-hidden="true">
          <currentCta.Icon size={20} className="text-purple-200/90 drop-shadow-sm" />
          {currentCta.label}
        </span>
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={currentCta.label}
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(14px)' }}
            transition={{ duration: 3, ease: [0.2, 1, 0.2, 1] }}
            className="absolute inset-0 inline-flex items-center gap-2"
          >
            <currentCta.Icon size={20} className="text-purple-200/90 drop-shadow-sm" />
            {currentCta.label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  </Button>
   {/* Microtexto */}
    <p className="text-xs italic text-slate-400/70 leading-tight">
  Aquí empieza la conversación
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
