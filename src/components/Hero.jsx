import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CoffeeIcon, Gamepad2, HeartHandshake, ShoppingBag, SparkleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReserveModal from '@/components/ReserveModal';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';
import isotipoGato from '@/assets/isotipo-gato.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { setBienvenidaReturnPath } from '@/lib/bienvenida';

const HERO_LOGGED_IN_AUDIO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/A2_Melody_MSTR.wav';
const HERO_LOGGED_IN_AUDIO_VOLUME = 0.35;

const Hero = () => {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [primaryCtaWidth, setPrimaryCtaWidth] = useState(null);
  const [activeLoggedInCtaIndex, setActiveLoggedInCtaIndex] = useState(0);
  const [loggedInSweepPoint, setLoggedInSweepPoint] = useState({ x: 0, y: 0 });
  const primaryCtaRef = useRef(null);
  const loggedInCtaTrackRef = useRef(null);
  const loggedInCtaRefs = useRef([]);
  const sweepDirectionRef = useRef(1);
  const heroSectionRef = useRef(null);
  const heroAudioRef = useRef(null);
  const audioGestureUnlockRef = useRef(false);

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

  const scrollToSection = useCallback((sectionId) => {
    const section = document.querySelector(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleScrollToAbout = useCallback(() => {
    scrollToSection('#about');
  }, [scrollToSection]);

  const handleOpenReserve = useCallback(() => {
    setIsReserveOpen(true);
  }, []);

  const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  const handleOpenMiniverseList = useCallback((tabId = null, contextLabel = null) => {
    if (typeof window !== 'undefined') {
      if (!user) {
        document.documentElement.dataset.bienvenidaFade = 'true';
        setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
        window.setTimeout(() => {
          navigate('/bienvenida', { replace: true });
        }, 450);
        return;
      }
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:open-miniverse-list', {
          detail: {
            tabId: typeof tabId === 'string' ? tabId : null,
            contextLabel: typeof contextLabel === 'string' ? contextLabel : null,
          },
        })
      );
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

  useEffect(() => {
    if (!user) return undefined;
    sweepDirectionRef.current = 1;
    const intervalId = window.setInterval(() => {
      setActiveLoggedInCtaIndex((prev) => {
        if (prev >= 2) sweepDirectionRef.current = -1;
        if (prev <= 0) sweepDirectionRef.current = 1;
        return prev + sweepDirectionRef.current;
      });
    }, 4400);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const updateLoggedInSweepPoint = useCallback((index) => {
    const track = loggedInCtaTrackRef.current;
    const target = loggedInCtaRefs.current[index];
    if (!track || !target) return;
    const trackRect = track.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setLoggedInSweepPoint({
      x: targetRect.left - trackRect.left + targetRect.width / 2,
      y: targetRect.top - trackRect.top + targetRect.height / 2,
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    updateLoggedInSweepPoint(activeLoggedInCtaIndex);
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => updateLoggedInSweepPoint(activeLoggedInCtaIndex));
    if (loggedInCtaTrackRef.current) observer.observe(loggedInCtaTrackRef.current);
    loggedInCtaRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [activeLoggedInCtaIndex, updateLoggedInSweepPoint, user]);

  const loggedInCtaClass = useCallback(
    () =>
      `
      relative z-10 isolate overflow-hidden w-auto min-w-[10rem] px-7 py-3.5 rounded-full font-semibold
      flex items-center justify-center gap-2 border transition-all duration-300 ease-out
      text-slate-100 bg-[#04081f]/80 border-violet-400/35
      shadow-[0_8px_26px_rgba(56,20,110,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]
      hover:border-violet-300/55 hover:shadow-[0_10px_32px_rgba(86,34,168,0.38)]
    `,
    []
  );

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

  useEffect(() => {
    const audio = heroAudioRef.current;
    if (!audio || !user) return undefined;

    let rafId = 0;
    let mounted = true;

    const attemptPlay = async () => {
      if (!mounted) return;
      try {
        await audio.play();
        audioGestureUnlockRef.current = true;
      } catch {
        audioGestureUnlockRef.current = false;
      }
    };

    const updateAudioByScroll = () => {
      const hero = heroSectionRef.current;
      if (!hero || !audio) return;
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(rect.height * 0.9, 1);
      const progress = Math.min(Math.max((-rect.top) / travel, 0), 1);
      const targetVolume = HERO_LOGGED_IN_AUDIO_VOLUME * (1 - progress);
      audio.volume = targetVolume;

      if (targetVolume <= 0.01) {
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }

      if (audio.paused) {
        void attemptPlay();
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateAudioByScroll);
    };

    const onFirstInteraction = () => {
      if (audioGestureUnlockRef.current) return;
      void attemptPlay();
    };

    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = HERO_LOGGED_IN_AUDIO_VOLUME;

    void attemptPlay();
    updateAudioByScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = HERO_LOGGED_IN_AUDIO_VOLUME;
    };
  }, [user]);

  return (
    <>
      <section
        id="hero"
        ref={heroSectionRef}
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
      >
        
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

            {!user && (
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
            )}


            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-col gap-4 justify-center items-center"
            >
              {!user ? (
                <div className="flex flex-col gap-4 justify-center items-center">

                  {/* CTA PRINCIPAL */}
                  <Button
                    ref={primaryCtaRef}
                    onClick={() => handleOpenMiniverseList(null, 'Explora los miniversos')}
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
              ) : (
                <div
                  ref={loggedInCtaTrackRef}
                  className="relative flex w-full max-w-2xl flex-col items-center justify-center gap-4 md:flex-row md:gap-3"
                >
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-0 h-14 w-44 md:h-16 md:w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.26)_0%,rgba(244,114,182,0.18)_44%,rgba(168,85,247,0.06)_74%,rgba(0,0,0,0)_100%)] blur-[14px]"
                    animate={{ left: loggedInSweepPoint.x, top: loggedInSweepPoint.y, opacity: [0.5, 0.72, 0.5] }}
                    transition={{
                      left: { type: 'spring', stiffness: 92, damping: 28, mass: 0.95 },
                      top: { type: 'spring', stiffness: 92, damping: 28, mass: 0.95 },
                      opacity: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-0 h-2.5 w-11 md:h-3 md:w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-300/40 blur-[8px]"
                    animate={{ left: loggedInSweepPoint.x, top: loggedInSweepPoint.y, opacity: [0.35, 0.6, 0.35] }}
                    transition={{
                      left: { type: 'spring', stiffness: 120, damping: 30, mass: 0.8 },
                      top: { type: 'spring', stiffness: 120, damping: 30, mass: 0.8 },
                      opacity: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  />
                  <Button
                    ref={(node) => {
                      loggedInCtaRefs.current[0] = node;
                    }}
                    type="button"
                    onClick={() => handleOpenMiniverseList('escaparate', 'Entender')}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500 transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 0 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 0 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(255,154,158,0.32) 0%, rgba(244,114,182,0.2) 48%, rgba(0,0,0,0) 100%)',
                      }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 0 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <SparkleIcon
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 0 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Entender
                    </span>
                  </Button>
                  <Button
                    ref={(node) => {
                      loggedInCtaRefs.current[1] = node;
                    }}
                    type="button"
                    onClick={() => handleOpenMiniverseList('experiences', 'Decidir')}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500 transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 1 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 1 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(255,154,158,0.32) 0%, rgba(244,114,182,0.2) 48%, rgba(0,0,0,0) 100%)',
                      }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 1 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <Gamepad2
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 1 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Decidir
                    </span>
                  </Button>
                  <Button
                    ref={(node) => {
                      loggedInCtaRefs.current[2] = node;
                    }}
                    type="button"
                    onClick={() => handleOpenMiniverseList('waitlist', 'Sostener')}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500 transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 2 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 2 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(255,154,158,0.32) 0%, rgba(244,114,182,0.2) 48%, rgba(0,0,0,0) 100%)',
                      }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 2 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <HeartHandshake
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 2 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Sostener
                    </span>
                  </Button>
                </div>
              )}


     
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="relative mt-8 inline-flex h-12 w-12 items-center justify-center self-center sm:mt-14 sm:h-12 sm:w-12"
            aria-hidden="true"
          >
            <motion.svg
              width="36"
              height="36"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ y: [0, 3, 0], opacity: [0.72, 0.3, 0.72] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
              className="h-10 w-10 sm:h-[54px] sm:w-[54px]"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3)) drop-shadow(0 0 10px rgba(189,189,189,0.26))',
              }}
            >
              <defs>
                <linearGradient id="heroScrollChevronGradient" x1="3" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2d2d2d" />
                  <stop offset="0.55" stopColor="#bdbdbd" />
                  <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <path
                d="M7 9.5L17 15.5L27 9.5"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.58"
              />
              <path
                d="M7 16L17 22L27 16"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.74"
              />
              <path
                d="M7 22.5L17 28.5L27 22.5"
                stroke="url(#heroScrollChevronGradient)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.66"
              />
            </motion.svg>
          </motion.div>

        </div>
      </section>
      {user ? (
        <audio
          ref={heroAudioRef}
          src={HERO_LOGGED_IN_AUDIO_URL}
          playsInline
          aria-hidden="true"
          className="hidden"
        />
      ) : null}

      <ReserveModal open={isReserveOpen} onClose={handleCloseReserve} initialInterest="preventa" />
      <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
    </>
  );
};

export default Hero;
