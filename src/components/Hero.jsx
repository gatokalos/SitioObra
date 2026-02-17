import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CoffeeIcon, ShoppingBag, SparkleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';
import isotipoGato from '@/assets/isotipo-gato.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { setBienvenidaReturnPath } from '@/lib/bienvenida';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const primaryCtaLabel = user ? 'Dejar mi huella' : 'Abrir Portales';

  const handleScrollToAbout = useCallback(() => {
    const aboutSection = document.querySelector('#about');
    aboutSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenReserve = useCallback(() => {
    setIsReserveOpen(true);
  }, []);

  const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  const handleOpenMiniverseList = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (!user) {
        document.documentElement.dataset.bienvenidaFade = 'true';
        setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
        window.setTimeout(() => {
          navigate('/bienvenida', { replace: true });
        }, 450);
        return;
      }
      window.dispatchEvent(new CustomEvent('gatoencerrado:open-miniverse-list'));
    }
  }, [location.hash, location.pathname, location.search, navigate, user]);

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
        
        {/* Contenido */}
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="hero-logo mx-auto mb-6 w-24 sm:w-28 md:w-32"
            >
              <img
                src={isotipoGato}
                alt="Isotipo de Gato Encerrado"
                className="hero-logo-img"
              />
            </motion.div>
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
    onClick={handleScrollToAbout}
    className="
      text-slate-200 underline underline-offset-4 decoration-slate-400/30
      hover:text-white hover:decoration-purple-400 transition
      font-normal
    "
  >
    Es un gato encerrado
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
    {primaryCtaLabel}
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-8 inline-flex h-9 w-9 items-center justify-center self-center sm:mt-14 sm:h-12 sm:w-12"
            aria-hidden="true"
          >
            <motion.svg
              width="28"
              height="28"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ y: [0, 3, 0], opacity: [0.66, 0.25, 0.66] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
              className="sm:h-[54px] sm:w-[54px]"
              style={{
                filter:
                  'drop-shadow(0 0 3px rgba(59,130,246,0.28)) drop-shadow(0 0 7px rgba(168,85,247,0.22))',
              }}
            >
              <defs>
                <linearGradient id="heroScrollChevronGradient" x1="3" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(227.67deg 51.68% 17.68%)" />
                  <stop offset="0.55" stopColor="hsl(290 60% 30%)" />
                  <stop offset="1" stopColor="hsl(339.21deg 100% 50.2%)" />
                </linearGradient>
              </defs>
              <path
                d="M7 9.5L17 15.5L27 9.5"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.46"
              />
              <path
                d="M7 16L17 22L27 16"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.62"
              />
              <path
                d="M7 22.5L17 28.5L27 22.5"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.52"
              />
            </motion.svg>
          </motion.div>

        </div>
      </section>

      <ReserveModal open={isReserveOpen} onClose={handleCloseReserve} initialInterest="preventa" />
      <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
    </>
  );
};

export default Hero;
