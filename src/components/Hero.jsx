import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CoffeeIcon, DramaIcon, TicketIcon, HeartHandshake, ShoppingBag, SparkleIcon, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';
import MiniverseModal from '@/components/MiniverseModal';
import isotipoGatoWebp from '@/assets/isotipo-gato.webp';
const HashtagButton3D = React.lazy(() => import('@/components/HashtagButton3D'));
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { setBienvenidaReturnPath } from '@/lib/bienvenida';
import {
  getHeroAmbientAudio,
  getHeroAmbientState,
  subscribeHeroAmbient,
  readHeroAudioEnabledPreference,
  writeHeroAudioEnabledPreference,
  pauseHeroAmbient,
} from '@/lib/heroAmbientAudio';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { safeSetItem } from '@/lib/safeStorage';

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;
const HERO_LOGGED_IN_AUDIO_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.m4a`;
const HERO_LOGGED_IN_AUDIO_FALLBACK_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.wav`;
const HERO_LOGGED_IN_AUDIO_VOLUME = 0.35;
const HERO_AUDIO_MIN_AUDIBLE_VOLUME = 0.015;
const HERO_AUDIO_PLAY_RETRY_MS = 2500;
const HERO_AUDIO_IDLE_RETRY_MS = 6000;
const HERO_TAB_QUERY_PARAM = 'heroTab';
const HERO_LOGGED_IN_ACTIVE_GRADIENT_CLASS =
  'bg-gradient-to-r from-[#1f2f63] via-[#6e30ab] to-[#d91f8b]';
const HERO_LOGGED_IN_ACTIVE_GLOW =
  'radial-gradient(circle at center, rgba(110,48,171,0.36) 0%, rgba(217,31,139,0.24) 52%, rgba(0,0,0,0) 100%)';
const HERO_LOGGED_IN_SWEEP_GLOW =
  'radial-gradient(circle,rgba(31,47,99,0.3)_0%,rgba(110,48,171,0.22)_44%,rgba(217,31,139,0.1)_74%,rgba(0,0,0,0)_100%)';
const HERO_PENDING_MINIVERSE_SELECTION_KEY = 'gatoencerrado:hero-inline-miniverse-selection';
const HERO_ROTATING_SUBTITLES = [
  'La obra que ocurre en tu mente',
  'Un viaje inmersivo para sentir, pensar y recordar',
  'Una historia que cambia cuando la miras',
  'Teatro que no termina cuando sales de la sala',
  'Una experiencia escénica que se queda contigo',
  ' ',
];
const HERO_GHOST_SUBTITLES = [
  'Tal vez la obra ya empezó en ti',
  'Y si observas bien… la obra te observa a ti',
];
const HERO_ROTATING_SUBTITLE_PLACEHOLDER =
  'Teatro que no termina cuando sales de la sala';

const resolveHeroInlineTabFromQuery = (search = '') => {
  if (!search) return 'escaparate';
  const params = new URLSearchParams(search);
  const rawTab = (params.get(HERO_TAB_QUERY_PARAM) || '').trim().toLowerCase();

  if (rawTab === 'experiences' || rawTab === 'habitar' || rawTab === 'habita') {
    return 'experiences';
  }
  if (rawTab === 'waitlist' || rawTab === 'impulsar' || rawTab === 'activar') {
    return 'waitlist';
  }
  return 'escaparate';
};

const Hero = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [heroSubtitleIndex, setHeroSubtitleIndex] = useState(0);
  const [heroGhostSubtitle, setHeroGhostSubtitle] = useState(null);
  const [isHeroHintVisible, setIsHeroHintVisible] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [primaryCtaWidth, setPrimaryCtaWidth] = useState(null);
  const [activeLoggedInCtaIndex, setActiveLoggedInCtaIndex] = useState(0);
  const [loggedInSweepPoint] = useState({ x: 0, y: 0 });
  const primaryCtaRef = useRef(null);
  const loggedInCtaTrackRef = useRef(null);
  const loggedInCtaRefs = useRef([]);
  const heroSectionRef = useRef(null);
  const heroAudioMutedRef = useRef(false);
  const audioGestureUnlockRef = useRef(false);
  const lastHeroAudioPlayAttemptRef = useRef(0);
  const [isHeroAudioReady, setIsHeroAudioReady] = useState(false);
  const [isHeroAudioMuted, setIsHeroAudioMuted] = useState(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);
  const [isHeroInViewport, setIsHeroInViewport] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  const rotatingCtas = [
    { label: 'Café', Icon: CoffeeIcon },
    { label: 'Charla', Icon: BookOpen },
    { label: 'Merch', Icon: ShoppingBag },
  ];
  const currentCta = rotatingCtas[ctaIndex];
  const currentHeroSubtitle = heroGhostSubtitle ?? HERO_ROTATING_SUBTITLES[heroSubtitleIndex];
  const targetWidth = primaryCtaWidth ?? undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const mobileInitialTabId = useMemo(
    () => resolveHeroInlineTabFromQuery(location.search),
    [location.search]
  );
  const primaryCtaLabel = user ? 'Dejar mi huella' : 'Toma un boleto';


  const getTargetVolumeByHeroPosition = useCallback(() => {
    const hero = heroSectionRef.current;
    if (!hero) return 0;
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(rect.height * 0.9, 1);
    const progress = Math.min(Math.max((-rect.top) / travel, 0), 1);
    return HERO_LOGGED_IN_AUDIO_VOLUME * (1 - progress);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const section = document.querySelector(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleScrollToAbout = useCallback(() => {
    scrollToSection('#about');
  }, [scrollToSection]);

  const handleOpenSupportHub = useCallback(() => {
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'hero-encuentros'),
    });
  }, [location, navigate]);

  const handleOpenMiniverseList = useCallback((tabId = null, contextLabel = null) => {
    if (typeof window !== 'undefined') {
      if (!user) {
        document.documentElement.dataset.bienvenidaFade = 'true';
        setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
        pauseHeroAmbient();
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

  const handleLoggedInHeroAction = useCallback(
    (tabId, contextLabel, index) => {
      if (Number.isFinite(index)) {
        setActiveLoggedInCtaIndex(index);
      }
      handleOpenMiniverseList(tabId, contextLabel);
    },
    [handleOpenMiniverseList]
  );

  const handleMobileInlineMiniverseSelect = useCallback(
    (formatId) => {
      if (typeof window === 'undefined' || !formatId) return;
      const emitSelection = () => {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:select-miniverse-format', {
            detail: { formatId },
          }),
        );
      };

      if (isMobileViewport) {
        scrollToSection('#transmedia');
        window.setTimeout(emitSelection, 420);
        return;
      }

      // Desktop inline: conserva al usuario en Hero y reusa vitrina original.
      // Persistimos la intención por si Transmedia aún no monta cuando se hace clic.
      safeSetItem(HERO_PENDING_MINIVERSE_SELECTION_KEY, formatId);
      emitSelection();
      [120, 280, 560, 980].forEach((delay) => {
        window.setTimeout(emitSelection, delay);
      });
    },
    [isMobileViewport, scrollToSection]
  );

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
    if (user) return undefined;
    const ROTATION_MS = 4400;
    const GHOST_PROBABILITY = 0.11;
    const intervalId = window.setInterval(() => {
      if (Math.random() < GHOST_PROBABILITY) {
        const idx = Math.floor(Math.random() * HERO_GHOST_SUBTITLES.length);
        setHeroGhostSubtitle(HERO_GHOST_SUBTITLES[idx]);
      } else {
        setHeroGhostSubtitle(null);
        setHeroSubtitleIndex((prev) => (prev + 1) % HERO_ROTATING_SUBTITLES.length);
      }
    }, ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [user]);


  const loggedInCtaClass = useCallback(
    () =>
      `
      relative z-10 isolate overflow-hidden flex-1 min-w-0 h-14 px-7 rounded-full font-semibold
      flex items-center justify-center gap-2 border transition-all duration-300 ease-out
      text-slate-100 bg-[#04081f]/80 border-violet-400/35 backdrop-blur-md
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
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (user) {
      setIsHeroHintVisible(false);
      return undefined;
    }

    const syncHintWithScrollPosition = () => {
      setIsHeroHintVisible(window.scrollY > 8);
    };

    syncHintWithScrollPosition();
    window.addEventListener('scroll', syncHintWithScrollPosition, { passive: true });
    return () => window.removeEventListener('scroll', syncHintWithScrollPosition);
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileViewport(event.matches);
    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') {
      setIsHeroInViewport(true);
      return undefined;
    }
    const section = heroSectionRef.current;
    if (!section) return undefined;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsHeroInViewport(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    heroAudioMutedRef.current = isHeroAudioMuted;
  }, [isHeroAudioMuted]);

  useEffect(() => {
    const preferredEnabled = readHeroAudioEnabledPreference();
    const defaultMuted = user ? isMobileViewport : true;
    const nextMuted = preferredEnabled == null ? defaultMuted : !preferredEnabled;
    if (preferredEnabled == null) {
      writeHeroAudioEnabledPreference(!nextMuted);
    }
    heroAudioMutedRef.current = nextMuted;
    setIsHeroAudioMuted(nextMuted);
    setIsHeroAudioReady(false);
    setIsHeroAudioPlaying(false);

    const audio = getHeroAmbientAudio();
    if (audio) {
      audio.volume = nextMuted ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
      if (nextMuted && !audio.paused) {
        audio.pause();
      } else if (!nextMuted && audio.paused) {
        void audio.play().catch(() => {});
      }
    }
    return undefined;
  }, [isMobileViewport, user]);

  // Sincroniza heroAudioMutedRef con el estado compartido de la lib
  // para que el idle-retry no intente reproducir audio muteado desde Header
  useEffect(() => {
    return subscribeHeroAmbient(() => {
      const { isMuted } = getHeroAmbientState();
      heroAudioMutedRef.current = isMuted;
      setIsHeroAudioMuted(isMuted);
    });
  }, []);

  useEffect(() => {
    const audio = getHeroAmbientAudio();
    if (!audio) {
      setIsHeroAudioPlaying(false);
      return undefined;
    }

    let rafId = 0;
    let idleRetryId = 0;
    let mounted = true;
    let shouldResumeAfterVisibility = false;
    let fallbackApplied = false;
    let requiresInteractionAfterBackground = false;
    let isShowcaseForeground =
      typeof document !== 'undefined' &&
      (document.documentElement.dataset.gatoShowcaseOpen === 'true' ||
        document.documentElement.dataset.miniverseOpen === 'true');
    let isExternalAmbientHold =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.gatoHeroAmbientHold === 'true';

    audioGestureUnlockRef.current = false;
    lastHeroAudioPlayAttemptRef.current = 0;

    const isShowcaseForegroundActive = () => {
      if (isHeroInViewport) return false;
      const showcaseOpen =
        isShowcaseForeground ||
        (typeof document !== 'undefined' &&
          (document.documentElement.dataset.gatoShowcaseOpen === 'true' ||
            document.documentElement.dataset.miniverseOpen === 'true'));
      if (typeof document === 'undefined') {
        return showcaseOpen || isExternalAmbientHold;
      }
      return (
        showcaseOpen ||
        document.documentElement.dataset.gatoHeroAmbientHold === 'true'
      );
    };

    const attemptPlay = async ({ fromUserGesture = false } = {}) => {
      if (!mounted) return;
      if (isShowcaseForegroundActive()) return;
      if (heroAudioMutedRef.current) return;
      if (!fromUserGesture && requiresInteractionAfterBackground) return;
      const now = performance.now();
      if (!fromUserGesture && now - lastHeroAudioPlayAttemptRef.current < HERO_AUDIO_PLAY_RETRY_MS) return;

      lastHeroAudioPlayAttemptRef.current = now;
      try {
        await audio.play();
        audioGestureUnlockRef.current = true;
      } catch {
        audioGestureUnlockRef.current = false;
      }
    };

    const updateAudioByScroll = () => {
      if (!audio) return;
      if (isShowcaseForegroundActive()) {
        if (!audio.paused) {
          audio.pause();
        }
        return;
      }
      if (heroAudioMutedRef.current) {
        if (!audio.paused) {
          audio.pause();
        }
        audio.volume = 0;
        return;
      }
      const targetVolume = getTargetVolumeByHeroPosition();
      audio.volume = targetVolume;

      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) {
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
      if (heroAudioMutedRef.current) return;
      requiresInteractionAfterBackground = false;
      if (audioGestureUnlockRef.current) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      audio.volume = targetVolume;
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      void attemptPlay({ fromUserGesture: true });
    };

    const pauseForBackground = ({ forceInteractionToResume = false } = {}) => {
      shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
      if (forceInteractionToResume) {
        requiresInteractionAfterBackground = true;
      }
      audio.pause();
      audio.volume = HERO_LOGGED_IN_AUDIO_VOLUME;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseForBackground({ forceInteractionToResume: true });
        return;
      }

      updateAudioByScroll();
      if (shouldResumeAfterVisibility && !requiresInteractionAfterBackground) {
        void attemptPlay();
      }
      shouldResumeAfterVisibility = false;
    };

    const onWindowBlur = () => {
      // Desktop tab switch and mobile app switch can both trigger blur.
      pauseForBackground({ forceInteractionToResume: true });
    };

    const onWindowFocus = () => {
      if (document.visibilityState !== 'visible') return;
      updateAudioByScroll();
      if (shouldResumeAfterVisibility && !requiresInteractionAfterBackground) {
        void attemptPlay();
      }
      shouldResumeAfterVisibility = false;
    };

    const onPageHide = () => {
      pauseForBackground({ forceInteractionToResume: true });
    };

    const onPageFreeze = () => {
      pauseForBackground({ forceInteractionToResume: true });
    };

    const onAudioError = () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      setIsHeroAudioReady(false);
      audio.src = HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
      audio.load();
      void attemptPlay();
    };

    const onCanPlay = () => {
      setIsHeroAudioReady(true);
    };
    const onAudioPlay = () => {
      setIsHeroAudioPlaying(true);
    };
    const onAudioPause = () => {
      setIsHeroAudioPlaying(false);
    };

    const onShowcaseVisibility = (event) => {
      const open = Boolean(event?.detail?.open);
      isShowcaseForeground = open;
      if (open) {
        if (isHeroInViewport) return;
        shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
        audio.pause();
        return;
      }
      updateAudioByScroll();
      if (!requiresInteractionAfterBackground) {
        void attemptPlay();
      }
    };

    const onExternalAmbientHold = (event) => {
      const hold = Boolean(event?.detail?.hold);
      isExternalAmbientHold = hold;
      if (typeof document !== 'undefined') {
        if (hold) {
          document.documentElement.dataset.gatoHeroAmbientHold = 'true';
        } else {
          delete document.documentElement.dataset.gatoHeroAmbientHold;
        }
      }
      if (hold) {
        if (isHeroInViewport) return;
        shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
        audio.pause();
        return;
      }
      updateAudioByScroll();
      if (!requiresInteractionAfterBackground) {
        void attemptPlay();
      }
    };

    setIsHeroAudioReady(audio.readyState >= 2);
    audio.volume = heroAudioMutedRef.current ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
    setIsHeroAudioPlaying(!audio.paused && !heroAudioMutedRef.current);

    void attemptPlay();
    updateAudioByScroll();
    idleRetryId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (requiresInteractionAfterBackground) return;
      if (!audio.paused) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      audio.volume = targetVolume;
      void attemptPlay();
    }, HERO_AUDIO_IDLE_RETRY_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('click', onFirstInteraction, { passive: true });
    window.addEventListener('mousedown', onFirstInteraction, { passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('wheel', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('freeze', onPageFreeze);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('ended', onAudioPause);
    audio.addEventListener('error', onAudioError);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
    window.addEventListener('gatoencerrado:hero-ambient-hold', onExternalAmbientHold);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.clearInterval(idleRetryId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('mousedown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('wheel', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('freeze', onPageFreeze);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onAudioPlay);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('ended', onAudioPause);
      audio.removeEventListener('error', onAudioError);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
      window.removeEventListener('gatoencerrado:hero-ambient-hold', onExternalAmbientHold);
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.gatoHeroAmbientHold;
      }
    };
  }, [getTargetVolumeByHeroPosition, isHeroInViewport, user]);

  const shouldRenderInlineHero = Boolean(user);

  return (
    <>
      <section
        id="hero"
        ref={heroSectionRef}
        className={`min-h-screen relative overflow-hidden ${
          shouldRenderInlineHero
            ? 'flex items-start justify-center'
            : 'flex flex-col'
        }`}
      >
        {/* Contenido */}
        {shouldRenderInlineHero ? (
          <div
            className={`container mx-auto relative z-10 ${
              isMobileViewport ? 'px-4 pt-0 pb-8' : 'px-6 pt-16 pb-14'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: 'easeOut' }}
              className={`mx-auto w-full ${isMobileViewport ? 'max-w-2xl' : 'max-w-[920px]'}`}
            >
              <MiniverseModal
                open
                onClose={handleScrollToAbout}
                initialTabId={mobileInitialTabId}
                onSelectMiniverse={handleMobileInlineMiniverseSelect}
                stayOpenOnSelect
                displayMode="inline"
              />
            </motion.div>
          </div>
        ) : (
          <div className="container mx-auto px-6 text-center relative z-10 flex-1 flex flex-col">

              {/* TOP HALF — isotipo flota hasta la línea central */}
              <div className="flex-1 flex items-end justify-center pb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="hero-logo w-24 sm:w-28 md:w-32"
                >
                  <img
                    src={isotipoGatoWebp}
                    alt="Isotipo de Gato Encerrado"
                    className="hero-logo-img"
                  />
                </motion.div>
              </div>

              {/* LÍNEA CENTRAL — GATOENCERRADO ancla el 50vh */}
              <div className="max-w-4xl mx-auto w-full">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center w-full break-words"
                  style={{ textShadow: '0 0 35px rgba(255, 223, 255, 0.45)' }}
                >
                  #GATOENCERRADO
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.45, ease: 'easeOut' }}
                  className="mt-2 flex justify-center px-3"
                >
                  <span className="relative inline-flex min-h-[2.8rem] max-w-[42rem] items-center justify-center text-center text-sm leading-tight tracking-widest uppercase text-slate-400/60 sm:min-h-[1.8rem]">
                    <span className="invisible">{HERO_ROTATING_SUBTITLE_PLACEHOLDER}</span>
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.span
                        key={currentHeroSubtitle}
                        initial={{ opacity: 0, filter: 'blur(14px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(14px)' }}
                        transition={{ duration: 1.8, ease: [0.2, 1, 0.2, 1] }}
                        className="absolute inset-0 inline-flex items-center justify-center"
                      >
                        {currentHeroSubtitle}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 1.05 }}
                  className="relative mt-5 inline-flex h-12 w-12 items-center justify-center self-center sm:mt-6"
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

              {/* BOTTOM HALF — hashtag y CTAs bajo la línea central */}
              <div className="flex-1 flex flex-col items-center justify-start pt-2">

              {/* HashtagButton3D — reemplaza los botones en su misma zona */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="mt-8 -translate-y-[7vh] flex flex-col items-center gap-2 sm:mt-10 sm:translate-y-0 md:mt-12"
              >
                <Suspense fallback={<div style={{ height: 130 }} />}>
                  <HashtagButton3D
                    onClick={() => handleOpenMiniverseList(null, 'Explora los miniversos')}
                    height="clamp(110px, 17vh, 160px)"
                    contentScale={isMobileViewport ? 1 : 1.1}
                    style={{ width: 'clamp(100px, 16vh, 150px)', margin: '0 auto' }}
                  />
                </Suspense>
                <motion.p
                  initial={false}
                  animate={
                    isHeroHintVisible
                      ? { opacity: 0.95, y: 0, filter: 'blur(0px)' }
                      : { opacity: 0, y: 6, filter: 'blur(10px)' }
                  }
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="select-none text-[0.62rem] uppercase tracking-[0.3em] text-zinc-300/45 sm:text-[0.68rem]"
                >
                  toca para abrir
                </motion.p>
              </motion.div>

              {/* — botones originales: se muestran solo si hay usuario — */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex flex-col gap-4 justify-center items-center"
              >
                {user && (
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
                    <TicketIcon size={22} className="drop-shadow-md" />
                    {primaryCtaLabel}
                  </Button>
              

                  {/* CTA SECUNDARIO — CAFÉ */}
                  <Button
                    asChild
                    variant="outline"
                    onClick={handleOpenSupportHub}
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
            
                </div>
                )}
                {user && (
                <div
                  ref={loggedInCtaTrackRef}
                  className="relative flex w-full max-w-[52rem] items-center justify-center gap-3"
                >
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-0 h-14 w-44 md:h-16 md:w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[14px]"
                    style={{ background: HERO_LOGGED_IN_SWEEP_GLOW }}
                    animate={{ left: loggedInSweepPoint.x, top: loggedInSweepPoint.y, opacity: [0.5, 0.72, 0.5] }}
                    transition={{
                      left: { type: 'spring', stiffness: 92, damping: 28, mass: 0.95 },
                      top: { type: 'spring', stiffness: 92, damping: 28, mass: 0.95 },
                      opacity: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-0 h-2.5 w-11 md:h-3 md:w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-300/35 blur-[8px]"
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
                    onClick={() => handleLoggedInHeroAction('escaparate', 'Entender', 0)}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full ${HERO_LOGGED_IN_ACTIVE_GRADIENT_CLASS} transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 0 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 0 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{ background: HERO_LOGGED_IN_ACTIVE_GLOW }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 0 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <SparkleIcon
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 0 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Descubrir
                    </span>
                  </Button>
                  <Button
                    ref={(node) => {
                      loggedInCtaRefs.current[1] = node;
                    }}
                    type="button"
                    onClick={() => handleLoggedInHeroAction('experiences', 'Habitar', 1)}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full ${HERO_LOGGED_IN_ACTIVE_GRADIENT_CLASS} transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 1 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 1 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{ background: HERO_LOGGED_IN_ACTIVE_GLOW }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 1 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <DoorOpen
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 1 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Habitar
                    </span>
                  </Button>
                  <Button
                    ref={(node) => {
                      loggedInCtaRefs.current[2] = node;
                    }}
                    type="button"
                    onClick={() => handleLoggedInHeroAction('waitlist', 'Impulsar', 2)}
                    className={loggedInCtaClass()}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full ${HERO_LOGGED_IN_ACTIVE_GRADIENT_CLASS} transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 2 ? 'opacity-62' : 'opacity-0'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full blur-[14px] transition-opacity duration-1000 ease-out ${
                        activeLoggedInCtaIndex === 2 ? 'opacity-36' : 'opacity-0'
                      }`}
                      style={{ background: HERO_LOGGED_IN_ACTIVE_GLOW }}
                    />
                    <span className={`relative z-10 inline-flex items-center gap-2 transition-transform duration-1000 ${activeLoggedInCtaIndex === 2 ? 'scale-[1.01]' : 'scale-100'}`}>
                      <HeartHandshake
                        size={18}
                        className={`transition-colors duration-1000 ${activeLoggedInCtaIndex === 2 ? 'text-white' : 'text-violet-300/90'}`}
                      />
                      Impulsar
                    </span>
                  </Button>
                </div>
              )}
              </motion.div>
              </div>{/* /bottom half */}

          </div>
        )}
      </section>
      <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
    </>
  );
};

export default Hero;
