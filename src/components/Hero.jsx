import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpen, CoffeeIcon, DramaIcon, TicketIcon, HeartHandshake, ShoppingBag, SparkleIcon, DoorOpen, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
const TicketPurchaseModal = React.lazy(() => import('@/components/TicketPurchaseModal'));
const GatokensRevealModal = React.lazy(() => import('@/components/GatokensRevealModal'));
const MiniverseModal = React.lazy(() => import('@/components/MiniverseModal'));
const VideoNarrativeAutoplay = React.lazy(() => import('@/components/VideoNarrativeAutoplay'));
const isotipoGatoWebp = '/assets/isotipo_hero.webp';
const HashtagButton3D = React.lazy(() => import('@/components/HashtagButton3D'));
import PWAInstructionsOverlay from '@/components/PWAInstructionsOverlay';
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
import {
  showcaseDefinitions,
  ORACULO_RECOMMENDED_SHOWCASE_KEY,
} from '@/components/transmedia/transmediaConstants';
import {
  readHeroActivatedFromSession,
  writeHeroActivatedToSession,
  readIndexCueUsedFromSession,
  writeIndexCueUsedToSession,
} from '@/lib/heroActivation';

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
// Id del # real en Header.jsx — destino de la animación de transmigración.
const HEADER_INDEX_HASHTAG_ID = 'header-index-hashtag';
const HERO_TITLE = 'GATOENCERRADO';
const HERO_BRAND_LABEL = '#GATOENCERRADO';
const HERO_INACTIVE_HINT = 'Pulsa el gato';
const HERO_PWA_INSTALL_HINT = 'Agrégame como app';
const HERO_ROTATING_SUBTITLES = [
  'Una experiencia narrativa interactiva',            // 1 · el cajón (ver decisión A)
  'Basada en una herida emocional compartida',        // 2 · el origen — intacta, es de tus mejores
  'Teatro que no necesita escenario',                 // 3 · la expansión escénica
  'Arte, cuidado y cultura: una misma función',  // 4 · la función de la obra
  'Una obra con nueve vidas',                         // 5 · NUEVA — el gato escondido en el número
  'Aquí el público también deja huella',              // 6 · NUEVA — la participación
  'Hay escenas que regresan días después',            // 7 · NUEVA — la resonancia diferida, sembrada
  'Cada experiencia alimenta una investigación',      // 8 · NUEVA — la dimensión de estudio (frase ya aprobada en Impacto)
  'Sí: aquí hay gato encerrado',                      // 9 · NUEVA — el premio final del que se quedó
];

const HERO_GHOST_SUBTITLES = [
  'La obra que ocurre en tu mente',                   // canónica, intacta
  'Tal vez esta obra ya empezó en ti',                // intacta
  'Lo que resuene, te encontrará',                    // NUEVA — tu gramática de resonancia
  'El gato ya te vio',                                // NUEVA — el susurro felino (ver decisión C)
  'Una sola pregunta: ¿qué es *estar bien*?' // NUEVA — la introspección
];

const HERO_ROTATING_SUBTITLE_PLACEHOLDER =
'Una experiencia narrativa transmedial';
const HERO_SUBTITLE_ROTATION_MS = 3800;
const HERO_STARFIELD_STAR_COUNT_MOBILE = 165;
const HERO_STARFIELD_STAR_COUNT_DESKTOP = 300;

const createHeroStars = (starCount) =>
  Array.from({ length: starCount }).map((_, index) => {
    const isBrightStar = index % 7 === 0;
    return {
      id: index,
      size: isBrightStar ? Math.random() * 1.35 + 1.15 : Math.random() * 0.85 + 0.75,
      opacity: isBrightStar ? Math.random() * 0.28 + 0.58 : Math.random() * 0.28 + 0.28,
      x: Math.random() * 100,
      y: Math.random() * 100,
      glow: isBrightStar ? 1 : 0,
    };
  });

const readIsRunningAsInstalledPwa = () => {
  if (typeof window === 'undefined') return false;
  const isStandaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches;
  const isIosStandalone = window.navigator?.standalone === true;
  return Boolean(isStandaloneDisplay || isIosStandalone);
};

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
  const [isHeroAudioMuted, setIsHeroAudioMuted] = useState(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);
  const [hasActivatedAudio, setHasActivatedAudio] = useState(readHeroActivatedFromSession);
  const [hasUsedIndexCue, setHasUsedIndexCue] = useState(readIndexCueUsedFromSession);
  const [transmigrationOrigin, setTransmigrationOrigin] = useState(null);
  const hashtagAnchorRef = useRef(null);
  const userActivatedRef = useRef(readHeroActivatedFromSession());
  const audioActivatedOnceRef = useRef(readHeroActivatedFromSession());
  const [isHeroHashReady, setIsHeroHashReady] = useState(false);
  const [isHeroInViewport, setIsHeroInViewport] = useState(true);
  const [isHeroPwaPromptVisible, setIsHeroPwaPromptVisible] = useState(false);
  const [isHeroPwaInstructionsOpen, setIsHeroPwaInstructionsOpen] = useState(false);
  const [isInstalledPwa, setIsInstalledPwa] = useState(readIsRunningAsInstalledPwa);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  // Cuenta fija al montar (no reactiva a resize) para que las estrellas no
  // se rebarajen si el usuario cruza el breakpoint móvil/desktop en vivo.
  const heroStars = useMemo(
    () => createHeroStars(isMobileViewport ? HERO_STARFIELD_STAR_COUNT_MOBILE : HERO_STARFIELD_STAR_COUNT_DESKTOP),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: isAuthLoading } = useAuth();

  const rotatingCtas = [
    { label: 'Café', Icon: CoffeeIcon },
    { label: 'Charla', Icon: BookOpen },
    { label: 'Merch', Icon: ShoppingBag },
  ];
  const currentCta = rotatingCtas[ctaIndex];
  const shouldShowHeroPwaChoice =
    isMobileViewport && !user && !hasActivatedAudio && isHeroPwaPromptVisible;
  const shouldShowHeroInactiveHint = !hasActivatedAudio && isHeroHashReady;
  const currentHeroSubtitle = hasActivatedAudio
    ? heroGhostSubtitle ?? HERO_ROTATING_SUBTITLES[heroSubtitleIndex]
    : shouldShowHeroPwaChoice
      ? HERO_PWA_INSTALL_HINT
      : shouldShowHeroInactiveHint ? HERO_INACTIVE_HINT : '';
  const isHeroGhostSubtitle = hasActivatedAudio && heroGhostSubtitle !== null;
  const targetWidth = primaryCtaWidth ?? undefined;
  const heroTitleSignalDisplay = useSignalDriftText(HERO_BRAND_LABEL, { active: hasActivatedAudio && !user });
  const heroTitleDisplay = useMemo(
    () => heroTitleSignalDisplay.slice(1) || HERO_TITLE,
    [heroTitleSignalDisplay],
  );
  const { toast } = useToast();
  const narrativeVideoUrl = isMobileViewport ? null : NARRATIVE_VIDEO_URL_DESKTOP;
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    writeHeroActivatedToSession(hasActivatedAudio);
  }, [hasActivatedAudio]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalledPwa(readIsRunningAsInstalledPwa());
    standaloneQuery.addEventListener?.('change', handleDisplayModeChange);
    return () => {
      standaloneQuery.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

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
      if (showcaseId) {
        setRecommendedVitranaId(showcaseId);
        safeSetItem(ORACULO_RECOMMENDED_SHOWCASE_KEY, showcaseId);
      }
      if (pendingGatokensReveal?.source?.startsWith?.('bienvenida')) {
        nextIsUmbralReveal = true;
      }
      setIsUmbralReveal(nextIsUmbralReveal);
      setIsGatokensModalOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gatoencerrado:tercera-llamada-completed'));
      }
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

  const handleOpenHeroWelcome = useCallback(() => {
    handleOpenMiniverseList(null, 'Explora los miniversos');
  }, [handleOpenMiniverseList]);

  const handleHeroWelcomeKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleOpenHeroWelcome();
  }, [handleOpenHeroWelcome]);

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
    const GHOST_PROBABILITY = 0.28;
    const intervalId = window.setInterval(() => {
      if (Math.random() < GHOST_PROBABILITY) {
        const idx = Math.floor(Math.random() * HERO_GHOST_SUBTITLES.length);
        setHeroGhostSubtitle(HERO_GHOST_SUBTITLES[idx]);
      } else {
        setHeroGhostSubtitle(null);
        setHeroSubtitleIndex((prev) => (prev + 1) % HERO_ROTATING_SUBTITLES.length);
      }
    }, HERO_SUBTITLE_ROTATION_MS);

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
        const isIntersecting = Boolean(entry?.isIntersecting);
        setIsHeroInViewport(isIntersecting);
        if (!isIntersecting) {
          // Apaga el aro pulsante del # del Header (ver Header.jsx) — una vez
          // que el Hero sale de pantalla, ya no hace falta seguir llamando la
          // atención hacia ese destino.
          window.dispatchEvent(new CustomEvent('gatoencerrado:hero-left-viewport'));
        }
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

  const captureTransmigrationOrigin = useCallback(() => {
    const sourceEl = hashtagAnchorRef.current;
    const destEl = typeof document !== 'undefined'
      ? document.getElementById(HEADER_INDEX_HASHTAG_ID)
      : null;
    if (!sourceEl || !destEl) {
      setTransmigrationOrigin(null);
      return;
    }
    const sourceRect = sourceEl.getBoundingClientRect();
    const destRect = destEl.getBoundingClientRect();
    if (!destRect.width || !destRect.height) {
      setTransmigrationOrigin(null);
      return;
    }
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const destCenterX = destRect.left + destRect.width / 2;
    const destCenterY = destRect.top + destRect.height / 2;
    const scaleRatio = sourceRect.height / destRect.height;
    setTransmigrationOrigin({
      x: sourceCenterX - destCenterX,
      y: sourceCenterY - destCenterY,
      scale: Math.min(Math.max(scaleRatio, 1.6), 3.4),
      // Coordenadas fijas del destino real: el clon vuela renderizado en un
      // portal a document.body, posicionado ahí de reposo (ver JSX abajo).
      destTop: destRect.top,
      destLeft: destRect.left,
      destWidth: destRect.width,
      destHeight: destRect.height,
    });
  }, []);

  const revealHeaderIndexCueFromHero = useCallback(() => {
    if (typeof window === 'undefined') return;
    setHasUsedIndexCue(true);
    writeIndexCueUsedToSession();
    window.dispatchEvent(new CustomEvent('gatoencerrado:hero-index-cue-used'));
  }, []);

  const handleIsotipoClick = useCallback(() => {
    const audio = getHeroAmbientAudio();
    if (!audio) return;

    if (!userActivatedRef.current) {
      // Primera activación
      userActivatedRef.current = true;
      if (prefersReducedMotion) {
        revealHeaderIndexCueFromHero();
      } else {
        captureTransmigrationOrigin();
      }
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
      if (prefersReducedMotion) {
        revealHeaderIndexCueFromHero();
      } else {
        captureTransmigrationOrigin();
      }
      setHasActivatedAudio(true);
      setHeroAmbientMuted(false, { targetVolume: HERO_LOGGED_IN_AUDIO_VOLUME });
      window.dispatchEvent(new CustomEvent('gatoencerrado:audio-activated'));
    }
  }, [isHeroAudioMuted, hasActivatedAudio, captureTransmigrationOrigin, prefersReducedMotion, revealHeaderIndexCueFromHero]);

  const shouldInterceptHeroActivationForPwa = useCallback(() => (
    isMobileViewport &&
    !user &&
    !isInstalledPwa &&
    !hasActivatedAudio &&
    !isHeroPwaPromptVisible
  ), [hasActivatedAudio, isHeroPwaPromptVisible, isInstalledPwa, isMobileViewport, user]);

  const handleHeroHashClick = useCallback(() => {
    if (shouldInterceptHeroActivationForPwa()) {
      setIsHeroPwaPromptVisible(true);
      return;
    }
    if (isMobileViewport && !hasActivatedAudio && isHeroPwaPromptVisible) {
      return;
    }
    handleIsotipoClick();
  }, [handleIsotipoClick, hasActivatedAudio, isHeroPwaPromptVisible, isMobileViewport, shouldInterceptHeroActivationForPwa]);

  const handleDeclineHeroPwaInstall = useCallback(() => {
    setIsHeroPwaPromptVisible(false);
    handleIsotipoClick();
  }, [handleIsotipoClick]);

  const handleAcceptHeroPwaInstall = useCallback(() => {
    setIsHeroPwaInstructionsOpen(true);
  }, []);

  const handleHeroHashReady = useCallback(() => {
    setIsHeroHashReady(true);
  }, []);

  const handleHeroHashKeyDown = useCallback((event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleHeroHashClick();
  }, [handleHeroHashClick]);

  useEffect(() => {
    if (!hasActivatedAudio || hasUsedIndexCue || isHeroInViewport) return;
    revealHeaderIndexCueFromHero();
  }, [hasActivatedAudio, hasUsedIndexCue, isHeroInViewport, revealHeaderIndexCueFromHero]);

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
      audio.src = HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
      audio.load();
      void attemptPlay();
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
        {!shouldRenderInlineHero && !hasActivatedAudio ? (
          <motion.div
            aria-hidden="true"
            className="hero-starfield"
            initial={false}
            animate={{ opacity: isHeroPwaPromptVisible ? 0 : 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            {heroStars.map((star) => (
              <span
                key={star.id}
                className="hero-star"
                style={{
                  top: `${star.y}%`,
                  left: `${star.x}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  '--star-glow': star.glow,
                }}
              />
            ))}
          </motion.div>
        ) : null}
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

              {/* TOP HALF — hash fijo de marca hasta la línea central */}
              <div className="flex-1 flex items-end justify-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: hasActivatedAudio ? 0.62 : 0, y: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    className="hero-universe-mark"
                  >
                    <span className="hero-universe-mark__line" />
                    <span className="hero-universe-mark__text">Universo</span>
                    <span className="hero-universe-mark__line" />
                  </motion.div>
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: hasActivatedAudio ? 1 : 0, y: 0 }}
                    transition={{ duration: hasActivatedAudio ? 0.9 : 1, delay: hasActivatedAudio ? 0 : 0.8 }}
                    className="hero-logo hero-logo--portal"
                    style={{
                      width: 'var(--hero-portal-logo-size)',
                      '--hero-logo-glow-duration': `${HERO_SUBTITLE_ROTATION_MS}ms`,
                      marginBottom: 'clamp(1.05rem, 2.6vh, 1.7rem)',
                      pointerEvents: 'none',
                      visibility: hasActivatedAudio ? 'visible' : 'hidden',
                    }}
                  >
                    {hasActivatedAudio ? (
                      <span
                        key={`hero-logo-flash-${currentHeroSubtitle}`}
                        className="hero-logo-subtitle-flash"
                      />
                    ) : null}
                    <div className="hero-logo-visual">
                      <img
                        src={isotipoGatoWebp}
                        alt=""
                        className="hero-logo-img"
                        fetchpriority="high"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* LÍNEA CENTRAL — GATOENCERRADO ancla el 50vh */}
              <div className="max-w-4xl lg:max-w-[72rem] mx-auto w-full">
                <h1
                  className={`hero-title ${!hasActivatedAudio ? 'hero-title--pre-scene' : ''} ${hasActivatedAudio ? 'hero-title--scene-active' : ''} text-center w-full break-words`}
                  style={{
                    opacity: !hasActivatedAudio ? 0 : isMobileViewport ? 1 : 0.96,
                    visibility: hasActivatedAudio ? 'visible' : 'hidden',
                    filter: isMobileViewport
                      ? 'brightness(1.12) contrast(1.08)'
                      : 'brightness(1) contrast(1.05)',
                    transition: 'opacity 1.15s ease, filter 1.15s ease',
                  }}
                  aria-label={HERO_BRAND_LABEL}
                >
                  <span aria-hidden="true">{heroTitleDisplay}</span>
                </h1>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: hasActivatedAudio ? 1.1 : 0.8, ease: 'easeOut', delay: hasActivatedAudio ? 0 : 0.25 }}
                  className="mt-2 flex justify-center px-8"
                >
                  <span className="hero-subtitle-track relative inline-flex min-h-[2.8rem] max-w-[42rem] items-center justify-center text-center text-[0.78rem] leading-snug tracking-[0.18em] text-slate-300/70 sm:min-h-[1.8rem] sm:text-sm">
                    <span className="invisible">{HERO_ROTATING_SUBTITLE_PLACEHOLDER}</span>
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.span
                        key={currentHeroSubtitle}
                        initial={{ opacity: 0, filter: 'blur(14px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(14px)' }}
                        transition={{ duration: 1.8, ease: [0.2, 1, 0.2, 1] }}
                        className={`hero-subtitle-copy absolute inset-0 inline-flex items-center justify-center ${isHeroGhostSubtitle ? 'italic' : 'not-italic'}`}
                      >
                        {shouldShowHeroPwaChoice ? (
                          <span className="inline-flex items-center justify-center gap-2">
                            <span>{currentHeroSubtitle}</span>
                            <Smartphone size={15} strokeWidth={1.8} />
                          </span>
                        ) : currentHeroSubtitle}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.div>
                <div
                  className={`hero-central-spacer relative mt-5 inline-flex h-12 w-12 items-center justify-center self-center sm:mt-2 ${shouldShowHeroPwaChoice ? 'hero-central-spacer--pwa-choice' : ''}`}
                  aria-hidden={shouldShowHeroPwaChoice ? undefined : true}
                >
                  <AnimatePresence>
                    {shouldShowHeroPwaChoice ? (
                      <motion.div
                        key="hero-pwa-choice"
                        initial={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="hero-pwa-choice"
                      >
                        <button type="button" onClick={handleAcceptHeroPwaInstall}>
                          Sí
                        </button>
                        <span aria-hidden="true">/</span>
                        <button type="button" onClick={handleDeclineHeroPwaInstall}>
                          No
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* BOTTOM HALF — hash 3D (gatillo de activación) y CTAs bajo la línea central */}
              <div className="flex-1 flex flex-col items-center justify-start pt-2">

              {/* Hash 3D — gatillo de activación; al activarse se desvanece rápido para
                  dar paso al # plano que "transmigra" hacia el botón de índice, sin que
                  ambos coexistan visiblemente */}
              <motion.div
                ref={hashtagAnchorRef}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: hasActivatedAudio ? 0 : 1, scale: 1 }}
                transition={{ duration: hasActivatedAudio ? 0.18 : 1, ease: 'easeOut' }}
                className="hero-title-mark-slot mt-8 -translate-y-[7vh] sm:mt-10 sm:translate-y-0 md:mt-12"
                style={{
                  pointerEvents: hasActivatedAudio || shouldShowHeroPwaChoice ? 'none' : 'auto',
                }}
                role="button"
                tabIndex={hasActivatedAudio || shouldShowHeroPwaChoice ? -1 : 0}
                onKeyDown={handleHeroHashKeyDown}
                aria-hidden={hasActivatedAudio}
                aria-label={shouldShowHeroPwaChoice ? 'Decidir si instalar #GatoEncerrado como app' : 'Activar escena'}
              >
                {!hasActivatedAudio && (
                  <Suspense fallback={null}>
                    <HashtagButton3D
                      onClick={handleHeroHashClick}
                      onReady={handleHeroHashReady}
                      height="var(--hero-title-mark-size)"
                      contentScale={isMobileViewport ? 0.92 : 1}
                      style={{ width: 'var(--hero-title-mark-size)', margin: '0 auto' }}
                      showGlow={shouldShowHeroPwaChoice}
                    />
                  </Suspense>
                )}
              </motion.div>

              {/* El mismo # del gatillo de activación "transmigra" directo a su
                  destino final: el # real del Header (esquina superior
                  izquierda, ver Header.jsx#header-index-hashtag). Se renderiza
                  en un portal a document.body porque el Header vive fijo
                  (position: fixed) fuera del flujo del Hero. Al llegar, revela
                  ese # real (revealHeaderIndexCueFromHero) y se desvanece. */}
              {hasActivatedAudio && typeof document !== 'undefined'
                ? createPortal(
                    <AnimatePresence>
                      {!hasUsedIndexCue && transmigrationOrigin ? (
                        <motion.span
                          key="hero-hashtag-transmigrated"
                          initial={{
                            x: transmigrationOrigin.x,
                            y: transmigrationOrigin.y,
                            scale: transmigrationOrigin.scale,
                            opacity: 0.9,
                          }}
                          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
                          transition={{
                            opacity: { duration: 0.22, ease: 'easeOut' },
                            x: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                            y: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                            scale: { duration: 0.85, ease: [0.45, 0, 0.15, 1] },
                          }}
                          onAnimationComplete={() => revealHeaderIndexCueFromHero()}
                          className="header-hashtag-mark text-2xl inline-flex fixed pointer-events-none"
                          style={{
                            top: transmigrationOrigin.destTop,
                            left: transmigrationOrigin.destLeft,
                            width: transmigrationOrigin.destWidth,
                            height: transmigrationOrigin.destHeight,
                            zIndex: 60,
                          }}
                          aria-hidden="true"
                        >
                          #
                        </motion.span>
                      ) : null}
                    </AnimatePresence>,
                    document.body,
                  )
                : null}

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
          onPlayScene={(showcaseId) => {
            if (!showcaseId) return;
            setAutoVideoFormatId(showcaseId);
            setIsAutoVideoOpen(true);
          }}
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
      <PWAInstructionsOverlay
        isOpen={isHeroPwaInstructionsOpen}
        onClose={() => setIsHeroPwaInstructionsOpen(false)}
        eyebrow="Instala el universo"
        subtitle="Puedes volver y continuar en navegador si prefieres entrar ahora."
      />
    </>
  );
};

export default Hero;
