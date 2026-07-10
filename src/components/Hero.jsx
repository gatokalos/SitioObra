import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CoffeeIcon, DramaIcon, TicketIcon, HeartHandshake, ShoppingBag, SparkleIcon, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
const TicketPurchaseModal = React.lazy(() => import('@/components/TicketPurchaseModal'));
const GatokensRevealModal = React.lazy(() => import('@/components/GatokensRevealModal'));
const MiniverseModal = React.lazy(() => import('@/components/MiniverseModal'));
const VideoNarrativeAutoplay = React.lazy(() => import('@/components/VideoNarrativeAutoplay'));
const isotipoGatoWebp = '/assets/isotipo_hero.webp';
const HashtagButton3D = React.lazy(() => import('@/components/HashtagButton3D'));
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import useSignalDriftText from '@/hooks/useSignalDriftText';
import { consumeBienvenidaGatokensRevealPending, setBienvenidaReturnPath } from '@/lib/bienvenida';
import {
  getHeroAmbientAudio,
  getHeroAmbientState,
  subscribeHeroAmbient,
  readHeroAudioEnabledPreference,
  writeHeroAudioEnabledPreference,
  pauseHeroAmbient,
  resumeHeroAmbientPlayback,
  toggleHeroAmbientMuted,
  setHeroAmbientMuted,
} from '@/lib/heroAmbientAudio';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { extractRecommendedAppId, resolveShowcaseFromAppId } from '@/lib/bienvenidaBridge';
import { NARRATIVE_VIDEO_URL_DESKTOP } from '@/lib/narrativeVideo';
import { showcaseDefinitions } from '@/components/transmedia/transmediaConstants';

const POZO_HERO_REVEAL_KEY = 'gatoencerrado:pozo-hero-reveal:v1';

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
const HERO_TITLE = '#GATOENCERRADO';
const HERO_ROTATING_SUBTITLES = [
  'La obra que ocurre en tu mente',
  'Una experiencia narrativa interactiva',
  'Basada en Es un gato encerrado',
      
  ];
const HERO_GHOST_SUBTITLES = [
  'Teatro que no se mira. Se habita.',
  'Tal vez la obra ya empezó en ti',
   
];
const HERO_ROTATING_SUBTITLE_PLACEHOLDER =
'Una experiencia narrativa interactiva';

const resolveHeroInlineTabFromQuery = (search = '') => {
  if (!search) return 'experiences';
  const params = new URLSearchParams(search);
  const rawTab = (params.get(HERO_TAB_QUERY_PARAM) || '').trim().toLowerCase();

  if (rawTab === 'experiences' || rawTab === 'habitar' || rawTab === 'habita') {
    return 'experiences';
  }
  if (rawTab === 'waitlist' || rawTab === 'impulsar' || rawTab === 'activar') {
    return 'waitlist';
  }
  return 'experiences';
};

const Hero = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isGatokensModalOpen, setIsGatokensModalOpen] = useState(false);
  const [recommendedVitranaId, setRecommendedVitranaId] = useState(null);
  const [isUmbralReveal, setIsUmbralReveal] = useState(false);
  const [autoVideoFormatId, setAutoVideoFormatId] = useState(null);
  const [isAutoVideoOpen, setIsAutoVideoOpen] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [heroSubtitleIndex, setHeroSubtitleIndex] = useState(0);
  const [heroGhostSubtitle, setHeroGhostSubtitle] = useState(null);
  const [isHeroHintVisible, setIsHeroHintVisible] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [primaryCtaWidth, setPrimaryCtaWidth] = useState(null);
  const [activeLoggedInCtaIndex, setActiveLoggedInCtaIndex] = useState(1);
  const [loggedInSweepPoint] = useState({ x: 0, y: 0 });
  const primaryCtaRef = useRef(null);
  const loggedInCtaTrackRef = useRef(null);
  const loggedInCtaRefs = useRef([]);
  const heroSectionRef = useRef(null);
  const heroAudioMutedRef = useRef(false);
  const audioGestureUnlockRef = useRef(false);
  const lastHeroAudioPlayAttemptRef = useRef(0);
  const [isHeroAudioReady, setIsHeroAudioReady] = useState(false);
  const isHeroAudioReadyRef = useRef(false);
  const [isHeroAudioMuted, setIsHeroAudioMuted] = useState(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);
  const [hasActivatedAudio, setHasActivatedAudio] = useState(false);
  const userActivatedRef = useRef(false);
  const audioActivatedOnceRef = useRef(false);
  const [showAudioHint, setShowAudioHint] = useState(false);
  const isHeroAudioPlayingRef = useRef(false);
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
  const isHeroGhostSubtitle = heroGhostSubtitle !== null;
  const targetWidth = primaryCtaWidth ?? undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: isAuthLoading } = useAuth();
  const heroTitleDisplay = useSignalDriftText(HERO_TITLE, { active: !hasActivatedAudio && !user });
  const { toast } = useToast();
  const narrativeVideoUrl = isMobileViewport ? null : NARRATIVE_VIDEO_URL_DESKTOP;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let dirty = false;

    if (params.get('souvenir') === 'ok') {
      toast({
        title: 'Souvenir descargado',
        description: 'Tu recuerdo del pozo está listo en tu galería.',
        duration: 5000,
      });
      params.delete('souvenir');
      dirty = true;
    }

    const hasGatokensRevealParam = params.get('gatokens') === 'reveal';
    const pendingGatokensReveal = consumeBienvenidaGatokensRevealPending();

    if (hasGatokensRevealParam || pendingGatokensReveal) {
      // Peek at bienvenida recommendation before opening modal so both state updates
      // land in the same React batch — avoids a render with recommendedShowcaseId = null.
      let nextIsUmbralReveal = Boolean(hasGatokensRevealParam || pendingGatokensReveal?.isUmbral);
      let recommendedAppId = extractRecommendedAppId(pendingGatokensReveal);
      try {
        const raw = safeGetItem('bienvenida:transmedia-intent');
        if (raw) {
          const intent = JSON.parse(raw);
          recommendedAppId = extractRecommendedAppId(intent) || recommendedAppId;
          if (intent?.isUmbral) nextIsUmbralReveal = true;
        }
      } catch {}
      const showcaseId = resolveShowcaseFromAppId(recommendedAppId, showcaseDefinitions);
      if (showcaseId) setRecommendedVitranaId(showcaseId);
      if (pendingGatokensReveal?.source?.startsWith?.('bienvenida')) {
        nextIsUmbralReveal = true;
      }
      setIsUmbralReveal(nextIsUmbralReveal);
      setIsGatokensModalOpen(true);
      if (hasGatokensRevealParam) {
        params.delete('gatokens');
        dirty = true;
      }
    }

    if (dirty) {
      const cleanSearch = params.toString();
      const cleanUrl = location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [location.hash, location.pathname, location.search, toast]);

  // Detect pending vitrana stored before OAuth redirect → auto-open standalone video
  useEffect(() => {
    if (!user) return;
    try {
      const vitranaId = localStorage.getItem('gatoencerrado:pending-vitrana-id');
      if (!vitranaId) return;
      localStorage.removeItem('gatoencerrado:pending-vitrana-id');
      localStorage.removeItem('gatoencerrado:pending-vitrana-skip-modal');
      setAutoVideoFormatId(vitranaId);
      setIsAutoVideoOpen(true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    if (!hasActivatedAudio) return undefined;
    const ROTATION_MS = 3800;
    const GHOST_PROBABILITY = 0.28;
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
  }, [user, hasActivatedAudio]);


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
    isHeroAudioReadyRef.current = isHeroAudioReady;
  }, [isHeroAudioReady]);

  useEffect(() => {
    isHeroAudioPlayingRef.current = isHeroAudioPlaying;
  }, [isHeroAudioPlaying]);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    const preferredEnabled = readHeroAudioEnabledPreference();
    const nextMuted = preferredEnabled == null
      ? isMobileViewport
      : !preferredEnabled;

    if (preferredEnabled == null) {
      writeHeroAudioEnabledPreference(!nextMuted);
    }

    heroAudioMutedRef.current = nextMuted;
    setIsHeroAudioMuted(nextMuted);
    setIsHeroAudioReady(false);
    setIsHeroAudioPlaying(false);

    const audio = getHeroAmbientAudio();
    if (audio) {
      audio.muted = nextMuted;
      audio.volume = nextMuted ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
      if (nextMuted && !audio.paused) {
        audio.pause();
      } else if (!nextMuted && audio.paused) {
        void resumeHeroAmbientPlayback({ targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      }
    }
    return undefined;
  }, [isAuthLoading, isMobileViewport]);

  // Sincroniza heroAudioMutedRef con el estado compartido de la lib
  // para que el idle-retry no intente reproducir audio muteado desde Header
  useEffect(() => {
    return subscribeHeroAmbient(() => {
      const { isMuted } = getHeroAmbientState();
      heroAudioMutedRef.current = isMuted;
      setIsHeroAudioMuted(isMuted);
    });
  }, []);

  // Hint de audio: primera aparición 1.2s, se muestra 4s, descansa 3s.
  // El timer no depende de isHeroAudioReady para no reiniciarse si el audio tarda en cargar;
  // en cambio lee el ref en cada tick para mostrar el hint solo cuando el audio ya está listo.
  useEffect(() => {
    if (hasActivatedAudio || userActivatedRef.current || !isHeroInViewport) return;
    let showTimer, hideTimer;
    const cycle = (delay) => {
      showTimer = window.setTimeout(() => {
        if (!isHeroAudioReadyRef.current) { cycle(500); return; }
        if (isHeroAudioPlayingRef.current) { cycle(2000); return; }
        setShowAudioHint(true);
        hideTimer = window.setTimeout(() => {
          setShowAudioHint(false);
          cycle(3000);
        }, 4000);
      }, delay);
    };
    cycle(1200);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      setShowAudioHint(false);
    };
  }, [hasActivatedAudio, isHeroInViewport]);

  const handleIsotipoClick = useCallback(() => {
    const audio = getHeroAmbientAudio();
    if (!audio) return;
    setShowAudioHint(false);

    if (!userActivatedRef.current) {
      // Primera activación
      userActivatedRef.current = true;
      setHasActivatedAudio(true);
      if (!audioActivatedOnceRef.current) {
        audioActivatedOnceRef.current = true;
        window.dispatchEvent(new CustomEvent('gatoencerrado:audio-activated'));
      }
      if (isHeroAudioMuted) {
        toggleHeroAmbientMuted();
      } else {
        void resumeHeroAmbientPlayback({ targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      }
      return;
    }

    // Toggle de escena: ON ↔ OFF
    if (hasActivatedAudio) {
      setHasActivatedAudio(false);
      setHeroAmbientMuted(true);
      window.dispatchEvent(new CustomEvent('gatoencerrado:audio-deactivated'));
    } else {
      setHasActivatedAudio(true);
      setHeroAmbientMuted(false, { targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      window.dispatchEvent(new CustomEvent('gatoencerrado:audio-activated'));
    }
  }, [isHeroAudioMuted, hasActivatedAudio]);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

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
    let isInBackground = false;
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
      // Guest users: audio is gated until the isotipo is explicitly clicked.
      if (!user && !userActivatedRef.current) return;
      if (isInBackground) return;
      if (!fromUserGesture && document.visibilityState !== 'visible') return;
      if (isShowcaseForegroundActive()) return;
      if (heroAudioMutedRef.current) return;
      if (!fromUserGesture && requiresInteractionAfterBackground) return;
      const now = performance.now();
      if (!fromUserGesture && now - lastHeroAudioPlayAttemptRef.current < HERO_AUDIO_PLAY_RETRY_MS) return;

      lastHeroAudioPlayAttemptRef.current = now;
      const playbackStarted = await resumeHeroAmbientPlayback({
        targetVolume: audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME
          ? audio.volume
          : HERO_LOGGED_IN_AUDIO_VOLUME,
        allowMutedWarmup: !fromUserGesture,
      });
      audioGestureUnlockRef.current = playbackStarted;
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
        audio.muted = true;
        audio.volume = 0;
        return;
      }
      const targetVolume = getTargetVolumeByHeroPosition();
      audio.muted = false;
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
      if (!audio.paused) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      audio.muted = false;
      audio.volume = targetVolume;
      void attemptPlay({ fromUserGesture: true });
    };

    const pauseForBackground = ({ forceInteractionToResume = false } = {}) => {
      shouldResumeAfterVisibility = !audio.paused && audio.volume > HERO_AUDIO_MIN_AUDIBLE_VOLUME;
      if (forceInteractionToResume) {
        requiresInteractionAfterBackground = true;
      }
      audio.pause();
      audio.muted = heroAudioMutedRef.current;
      audio.volume = HERO_LOGGED_IN_AUDIO_VOLUME;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseForBackground();
        return;
      }

      updateAudioByScroll();
      if (shouldResumeAfterVisibility) {
        void attemptPlay();
      }
      shouldResumeAfterVisibility = false;
    };

    const onWindowBlur = () => {
      isInBackground = true;
      pauseForBackground();
    };

    const onWindowFocus = () => {
      isInBackground = false;
      if (document.visibilityState !== 'visible') return;
      updateAudioByScroll();
      if (shouldResumeAfterVisibility) {
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
    audio.muted = heroAudioMutedRef.current;
    audio.volume = heroAudioMutedRef.current ? 0 : HERO_LOGGED_IN_AUDIO_VOLUME;
    setIsHeroAudioPlaying(!audio.paused && !heroAudioMutedRef.current);

    void attemptPlay();
    updateAudioByScroll();
    idleRetryId = window.setInterval(() => {
      if (isInBackground || !document.hasFocus() || document.visibilityState !== 'visible') {
        if (!audio.paused) audio.pause();
        return;
      }
      if (requiresInteractionAfterBackground) return;
      if (!audio.paused) return;
      const targetVolume = getTargetVolumeByHeroPosition();
      if (targetVolume <= HERO_AUDIO_MIN_AUDIBLE_VOLUME) return;
      audio.volume = targetVolume;
      void attemptPlay();
    }, HERO_AUDIO_IDLE_RETRY_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true });
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
      window.removeEventListener('scroll', onFirstInteraction);
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
  }, [getTargetVolumeByHeroPosition, isAuthLoading, isHeroInViewport]);

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
              <Suspense fallback={null}>
                <MiniverseModal
                  open
                  onClose={handleScrollToAbout}
                  initialTabId={mobileInitialTabId}
                  onSelectMiniverse={handleMobileInlineMiniverseSelect}
                  stayOpenOnSelect
                  displayMode="inline"
                />
              </Suspense>
            </motion.div>
          </div>
        ) : (
          <div className="container mx-auto px-6 text-center relative z-10 flex-1 flex flex-col">

              {/* TOP HALF — isotipo flota hasta la línea central */}
              <div className="flex-1 flex items-end justify-center pb-4 sm:pb-5 md:pb-6">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="hero-logo w-24 sm:w-28 md:w-32 cursor-pointer"
                    onClick={handleIsotipoClick}
                    role="button"
                    aria-label={!hasActivatedAudio ? 'Conocer la escena' : isHeroAudioMuted ? 'Activar sonido' : 'Silenciar sonido'}
                  >
                    <motion.div
                      className="hero-logo-visual"
                      animate={showAudioHint ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                      transition={showAudioHint
                        ? { duration: 1.6, ease: 'easeInOut', repeat: 2 }
                        : { duration: 0.5, ease: 'easeOut' }
                      }
                    >
                      <img
                        src={isotipoGatoWebp}
                        alt="Isotipo de Gato Encerrado"
                        className="hero-logo-img"
                        fetchpriority="high"
                      />
                    </motion.div>
                  </motion.div>
                  <span
                    className="pointer-events-none mt-2.5 select-none whitespace-nowrap text-[0.72rem] leading-snug tracking-[0.14em] text-slate-300/75"
                    style={{
                      opacity: showAudioHint ? 0.82 : 0,
                      transform: showAudioHint ? 'translateY(0)' : 'translateY(-3px)',
                      transition: 'opacity 0.6s ease, transform 0.6s ease',
                    }}
                  >
                    ¿Empezamos?
                  </span>
                </div>
              </div>

              {/* LÍNEA CENTRAL — GATOENCERRADO ancla el 50vh */}
              <div className="max-w-4xl mx-auto w-full">
                <h1
                  className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-center w-full break-words"
                  style={{ textShadow: '0 0 35px rgba(255, 223, 255, 0.45)' }}
                  aria-label={HERO_TITLE}
                >
                  <span aria-hidden="true">{heroTitleDisplay}</span>
                </h1>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: hasActivatedAudio ? 1 : 0, y: hasActivatedAudio ? 0 : 8 }}
                  transition={{ duration: hasActivatedAudio ? 1.1 : 0, ease: 'easeOut' }}
                  className="mt-2 flex justify-center px-3"
                >
                  <span className="relative inline-flex min-h-[2.8rem] max-w-[42rem] items-center justify-center text-center text-[0.78rem] leading-snug tracking-[0.18em] text-slate-300/70 sm:min-h-[1.8rem] sm:text-sm">
                    <span className="invisible">{HERO_ROTATING_SUBTITLE_PLACEHOLDER}</span>
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.span
                        key={currentHeroSubtitle}
                        initial={{ opacity: 0, filter: 'blur(14px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(14px)' }}
                        transition={{ duration: 1.8, ease: [0.2, 1, 0.2, 1] }}
                        className={`absolute inset-0 inline-flex items-center justify-center ${isHeroGhostSubtitle ? 'italic' : 'not-italic'}`}
                      >
                        {currentHeroSubtitle}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: hasActivatedAudio ? 1 : 0, y: 0 }}
                  transition={{ duration: hasActivatedAudio ? 0.9 : 0.7, delay: hasActivatedAudio ? 0 : 1.05 }}
                  className="relative mt-5 inline-flex h-12 w-12 items-center justify-center self-center sm:mt-6"
                  style={{
                    pointerEvents: hasActivatedAudio ? 'auto' : 'none',
                    visibility: hasActivatedAudio ? 'visible' : 'hidden',
                  }}
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
                animate={{ opacity: hasActivatedAudio ? 1 : 0, y: 0 }}
                transition={{ duration: hasActivatedAudio ? 0.9 : 1, delay: hasActivatedAudio ? 0 : 0.8 }}
                className="mt-8 -translate-y-[7vh] flex flex-col items-center gap-2 sm:mt-10 sm:translate-y-0 md:mt-12"
                style={{
                  pointerEvents: hasActivatedAudio ? 'auto' : 'none',
                  visibility: hasActivatedAudio ? 'visible' : 'hidden',
                }}
                aria-hidden={!hasActivatedAudio}
              >
                <Suspense fallback={<div style={{ height: 'clamp(110px, 17vh, 160px)', width: 'clamp(100px, 16vh, 150px)', margin: '0 auto' }} />}>
                  <HashtagButton3D
                    onClick={() => handleOpenMiniverseList(null, 'Explora los miniversos')}
                    height="clamp(110px, 17vh, 160px)"
                    contentScale={isMobileViewport ? 1 : 1.1}
                    style={{ width: 'clamp(100px, 16vh, 150px)', margin: '0 auto' }}
                    showGlow={isHeroAudioPlaying}
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
                  className="select-none text-[0.72rem] leading-snug tracking-[0.14em] text-slate-300/65 sm:text-[0.78rem]"
                >
                  Pulsa este gato
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
      <Suspense fallback={null}>
        <TicketPurchaseModal open={isTicketModalOpen} onClose={handleCloseTicket} />
        <VideoNarrativeAutoplay
          key={`${autoVideoFormatId ?? 'none'}-${isAutoVideoOpen ? 'open' : 'closed'}-${isMobileViewport ? 'mobile' : 'desktop'}`}
          open={isAutoVideoOpen}
          onClose={() => setIsAutoVideoOpen(false)}
          formatId={autoVideoFormatId}
          isMobileViewport={isMobileViewport}
          videoUrl={narrativeVideoUrl}
        />
        <GatokensRevealModal
          open={isGatokensModalOpen}
          recommendedShowcaseId={recommendedVitranaId}
          isUmbral={isUmbralReveal}
          onProvoca={() => {
            setIsGatokensModalOpen(false);
            try {
              const raw = localStorage.getItem('gatoencerrado:provoca-draft');
              const quote = raw ? JSON.parse(raw)?.quote ?? '' : '';
              window.dispatchEvent(
                new CustomEvent('gatoencerrado:provoca-draft', { detail: { quote } })
              );
            } catch {}
            scrollToSection('#provoca');
          }}
          onClose={() => {
            setIsGatokensModalOpen(false);
            setIsUmbralReveal(false);
            if (!user) {
              safeSetItem(POZO_HERO_REVEAL_KEY, '1');
              window.dispatchEvent(new CustomEvent('gatoencerrado:pozo-hero-revealed'));
            }
          }}
        />
      </Suspense>
    </>
  );
};

export default Hero;
