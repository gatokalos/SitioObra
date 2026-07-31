import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
const TicketPurchaseModal = React.lazy(() => import('@/components/TicketPurchaseModal'));
const GatokensRevealModal = React.lazy(() => import('@/components/GatokensRevealModal'));
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
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { createHeroStars } from '@/lib/heroStars';
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
import { consumePendingContinuation } from '@/lib/pendingContinuation';

const POZO_HERO_REVEAL_KEY = 'gatoencerrado:pozo-hero-reveal:v1';

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;
const HERO_LOGGED_IN_AUDIO_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.m4a`;
const HERO_LOGGED_IN_AUDIO_FALLBACK_URL = `${SUPABASE_STORAGE}/Sonoridades/audio/A2_Melody_MSTR.wav`;
const HERO_LOGGED_IN_AUDIO_VOLUME = 0.35;
const HERO_AUDIO_MIN_AUDIBLE_VOLUME = 0.015;
const HERO_AUDIO_PLAY_RETRY_MS = 2500;
const HERO_AUDIO_IDLE_RETRY_MS = 6000;
// Id del # real en Header.jsx — destino de la animación de transmigración.
const HEADER_INDEX_HASHTAG_ID = 'header-index-hashtag';
const HERO_TITLE = 'GATOENCERRADO';
const HERO_BRAND_LABEL = '#GATOENCERRADO';
const HERO_INACTIVE_HINT = 'Pulsa al gato cuando lo veas';
const HERO_INACTIVE_ECHO_COUNT = 13;
const HERO_INACTIVE_ECHO_ENTRY_DURATION_S = 0.72;
const HERO_INACTIVE_ECHO_STAGGER_S = 0.095;
const PWA_HASH_WHISPERS = [
  '¿Me llevas contigo?',
  'Ya me encontraste.',
  '¿O yo a ti?',
  'Luego no me busques…',
  'Ya, llévame a casa.',
  'Sigue las instrucciones.',
];
const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const readHeroGatBalance = () => {
  const value = Number(safeGetItem(GAT_BALANCE_STORAGE_KEY));
  return Number.isFinite(value) ? Math.max(Math.trunc(value), 0) : 0;
};
// Tras cerrar el sheet de instrucciones, no se vuelve a interceptar el primer
// tap del hashtag hasta que pase este tiempo — sin esto, cada visita nueva
// repetía la misma pregunta aunque el usuario ya hubiera contestado.
const HERO_PWA_PROMPT_DECLINED_KEY = 'gatoencerrado:pwa-install-declined-at';
const HERO_PWA_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const HERO_ROTATING_SUBTITLES = [
  'Una experiencia narrativa interactiva',            // 1 · el cajón (ver decisión A)
  'Basada en una herida emocional compartida',        // 2 · el origen — intacta, es de tus mejores
  'Teatro que no necesita escenario',                 // 3 · la expansión escénica
  'Arte, tecnología y cuidado: una sola función',  // 4 · la función de la obra
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

const HeroInactiveSignal = ({ prefersReducedMotion = false }) => {
  const echoes = Array.from(
    { length: HERO_INACTIVE_ECHO_COUNT },
    (_, index) => 0.035 + (index / (HERO_INACTIVE_ECHO_COUNT - 1)) ** 1.18 * 0.27
  );

  return (
    <motion.div
      className="hero-inactive-signal"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: '13vh',
              scale: 0.74,
              filter: 'blur(7px)',
            }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : { duration: 0.42, ease: [0.4, 0, 0.2, 1] }
      }
    >
      {echoes.map((echoOpacity, index) => {
        const isNear = index === echoes.length - 1;
        const depth = echoes.length <= 1 ? 1 : index / (echoes.length - 1);
        return (
          <motion.span
            key={`hero-inactive-echo-${index}`}
            aria-hidden="true"
            className={`hero-inactive-signal__line${isNear ? ' hero-inactive-signal__line--near' : ''}`}
            style={{
              '--hero-echo-depth': depth,
              '--hero-echo-opacity': echoOpacity,
              '--hero-echo-delay': `${-(index * 0.83)}s`,
              '--hero-echo-glow-alpha': 0.015 + depth * 0.055,
              '--hero-echo-violet-alpha': 0.01 + depth * 0.035,
              '--hero-echo-mobile-glow-alpha': 0.012 + depth * 0.04,
              fontSize: `clamp(${0.64 + depth * 0.12}rem, ${0.76 + depth * 0.14}vw, ${0.78 + depth * 0.16}rem)`,
              letterSpacing: `${0.23 - depth * 0.045}em`,
            }}
            initial={
              prefersReducedMotion
                ? { opacity: echoOpacity }
                : { opacity: 0, y: -12, scale: 0.82 }
            }
            animate={{ opacity: echoOpacity, y: 0, scale: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : HERO_INACTIVE_ECHO_ENTRY_DURATION_S,
              delay: prefersReducedMotion ? 0 : index * HERO_INACTIVE_ECHO_STAGGER_S,
              ease: [0.2, 1, 0.2, 1],
            }}
          >
            <span
              className="hero-inactive-signal__copy"
              data-text={HERO_INACTIVE_HINT}
            >
              {HERO_INACTIVE_HINT}
            </span>
          </motion.span>
        );
      })}
    </motion.div>
  );
};

const HERO_ROTATING_SUBTITLE_PLACEHOLDER =
'Una experiencia narrativa transmedial';
const HERO_SUBTITLE_ROTATION_MS = 3800;
const HERO_STARFIELD_STAR_COUNT_MOBILE = 165;
const HERO_STARFIELD_STAR_COUNT_DESKTOP = 300;

// Estrellas fugaces: pocas, esporádicas (ciclo largo + delay propio) y
// confinadas a la mitad superior, para no cruzar el título ni el # 3D.
const HERO_SHOOTING_STAR_COUNT = 2;

const createHeroShootingStars = () =>
  Array.from({ length: HERO_SHOOTING_STAR_COUNT }).map((_, index) => ({
    id: index,
    x: 15 + Math.random() * 60,
    y: 6 + Math.random() * 30,
    delay: Math.random() * 22,
    duration: 24 + Math.random() * 10,
  }));

// Estrella fugaz "a demanda": una por gesto de swipe/tap/scroll bloqueado,
// con cooldown para que no se sienta como gimmick si el usuario insiste.
const GESTURE_SHOOTING_STAR_COOLDOWN_MS = 3000;
const GESTURE_SHOOTING_STAR_LIFETIME_MS = 1000;

const readIsRunningAsInstalledPwa = () => {
  if (typeof window === 'undefined') return false;
  const isStandaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches;
  const isIosStandalone = window.navigator?.standalone === true;
  return Boolean(isStandaloneDisplay || isIosStandalone);
};

const readHeroPwaPromptRecentlyDeclined = () => {
  const declinedAt = Number(safeGetItem(HERO_PWA_PROMPT_DECLINED_KEY));
  if (!declinedAt) return false;
  return Date.now() - declinedAt < HERO_PWA_PROMPT_COOLDOWN_MS;
};

const Hero = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isGatokensModalOpen, setIsGatokensModalOpen] = useState(false);
  const [recommendedVitranaId, setRecommendedVitranaId] = useState(null);
  const [isUmbralReveal, setIsUmbralReveal] = useState(false);
  const [autoVideoFormatId, setAutoVideoFormatId] = useState(null);
  const [isAutoVideoOpen, setIsAutoVideoOpen] = useState(false);
  const [heroSubtitleIndex, setHeroSubtitleIndex] = useState(0);
  const [heroGhostSubtitle, setHeroGhostSubtitle] = useState(null);
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
  const [isHeroPwaInstructionsOpen, setIsHeroPwaInstructionsOpen] = useState(false);
  const [pwaHashWhisper, setPwaHashWhisper] = useState(null);
  const lastPwaHashWhisperIndexRef = useRef(-1);
  const lastPwaHashWhisperAtRef = useRef(0);
  const pwaHashWhisperTimerRef = useRef(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(readIsRunningAsInstalledPwa);
  const [heroGatBalance, setHeroGatBalance] = useState(readHeroGatBalance);
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
  const heroShootingStars = useMemo(createHeroShootingStars, []);
  // Estrellas fugaces "a demanda" — una por gesto de swipe/tap/scroll
  // mientras el scroll está bloqueado en Estado Cero, para que el usuario
  // sienta respuesta en vez de fricción cuando el gesto no mueve la página.
  const [gestureShootingStars, setGestureShootingStars] = useState([]);
  const lastGestureStarAtRef = useRef(0);
  const gestureStarIdRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: isAuthLoading } = useAuth();

  // Se oculta mientras el sheet de instrucciones PWA está abierto — como ese
  // sheet ya no tiene fondo propio (ver PWAInstructionsOverlay), este texto
  // se vería detrás, mezclado con los pasos.
  // El HUB solo reemplaza este espacio cuando hay energía real. Una PWA
  // instalada o una sesión iniciada con 0 GAT siguen viendo el Estado Cero:
  // ecos, hint y #3D.
  const isGatLinktreeAudience =
    heroGatBalance > 0 && (Boolean(user) || isInstalledPwa);
  const shouldShowHeroInactiveHint = !hasActivatedAudio && isHeroHashReady && !isHeroPwaInstructionsOpen && !isGatLinktreeAudience;
  const currentHeroSubtitle = hasActivatedAudio
    ? heroGhostSubtitle ?? HERO_ROTATING_SUBTITLES[heroSubtitleIndex]
    : shouldShowHeroInactiveHint ? HERO_INACTIVE_HINT : '';
  const isHeroGhostSubtitle = hasActivatedAudio && heroGhostSubtitle !== null;
  const heroTitleSignalDisplay = useSignalDriftText(HERO_BRAND_LABEL, { active: hasActivatedAudio });
  const heroTitleDisplay = useMemo(
    () => heroTitleSignalDisplay.slice(1) || HERO_TITLE,
    [heroTitleSignalDisplay],
  );
  const { toast } = useToast();
  const narrativeVideoUrl = isMobileViewport ? null : NARRATIVE_VIDEO_URL_DESKTOP;
  const prefersReducedMotion = useReducedMotion();
  const heroInactiveHintEntryDelay = prefersReducedMotion
    ? 0.12
    : (HERO_INACTIVE_ECHO_COUNT - 1) * HERO_INACTIVE_ECHO_STAGGER_S
      + HERO_INACTIVE_ECHO_ENTRY_DURATION_S;

  useEffect(() => {
    const syncGatBalance = (event) => {
      const eventBalance = Number(event?.detail?.balance);
      setHeroGatBalance(
        Number.isFinite(eventBalance)
          ? Math.max(Math.trunc(eventBalance), 0)
          : readHeroGatBalance()
      );
    };
    window.addEventListener('gatoencerrado:gatokens-balance-update', syncGatBalance);
    window.addEventListener('storage', syncGatBalance);
    return () => {
      window.removeEventListener('gatoencerrado:gatokens-balance-update', syncGatBalance);
      window.removeEventListener('storage', syncGatBalance);
    };
  }, []);

  useEffect(() => {
    writeHeroActivatedToSession(hasActivatedAudio);
  }, [hasActivatedAudio]);

  // Bloquea el scroll mientras dure el Estado Cero (invitado, escena sin
  // activar) — antes se podía hacer scroll y asomarse al resto del sitio
  // por detrás del Hero sin haber activado nada.
  //
  // Se probó position:fixed en body (más robusto contra scroll táctil en
  // iOS) pero rompía el clic de activación del # 3D — probablemente un
  // resize/reset del raycaster de R3F al sacar a body del flujo normal. Se
  // revirtió a overflow-hidden por clase: ya se verificó (incógnito, sesión
  // limpia) que resuelve el caso real reportado, sin ese efecto colateral.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (user || hasActivatedAudio) return undefined;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [user, hasActivatedAudio]);

  // Mientras el scroll está bloqueado, un swipe/tap/scroll que "no hace
  // nada" se siente como fricción — en vez de eso, dispara una estrella
  // fugaz como respuesta. El mismo contrato aplica cuando el HUB personal
  // está abierto, incluso para usuarios autenticados.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const spawnGestureShootingStar = (event) => {
      const isGatHubOpen = document.body?.dataset.gatHubOpen === 'true';
      const isZeroStateLocked = !user && !hasActivatedAudio;
      if (!isZeroStateLocked && !isGatHubOpen) return;
      if (event.target?.closest?.('button, [role="button"], a')) return;
      const internalScrollRegion = event.target?.closest?.('[data-gat-hub-scroll]');
      if (
        internalScrollRegion &&
        internalScrollRegion.scrollHeight > internalScrollRegion.clientHeight
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastGestureStarAtRef.current < GESTURE_SHOOTING_STAR_COOLDOWN_MS) return;
      lastGestureStarAtRef.current = now;
      const id = gestureStarIdRef.current++;
      setGestureShootingStars((prev) => [
        ...prev,
        { id, x: 12 + Math.random() * 66, y: 8 + Math.random() * 34 },
      ]);
      window.setTimeout(() => {
        setGestureShootingStars((prev) => prev.filter((star) => star.id !== id));
      }, GESTURE_SHOOTING_STAR_LIFETIME_MS);
    };

    window.addEventListener('pointerdown', spawnGestureShootingStar, { passive: true });
    window.addEventListener('wheel', spawnGestureShootingStar, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', spawnGestureShootingStar);
      window.removeEventListener('wheel', spawnGestureShootingStar);
    };
  }, [user, hasActivatedAudio]);

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

  // Reanuda exactamente la acción que originó el login. La recomendación
  // durable y esta intención de una sola ejecución son datos distintos: un
  // login genérico no debe disparar videos inesperados.
  useEffect(() => {
    if (!user) return;
    const continuation = consumePendingContinuation();
    if (!continuation?.showcaseId) return;
    try {
      localStorage.removeItem('gatoencerrado:pending-vitrana-skip-modal');
    } catch {}
    setAutoVideoFormatId(continuation.showcaseId);
    setIsAutoVideoOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const handleOpenNarrativeContinuation = (event) => {
      const showcaseId = event?.detail?.showcaseId;
      if (typeof showcaseId !== 'string' || !showcaseId) return;
      setAutoVideoFormatId(showcaseId);
      setIsAutoVideoOpen(true);
    };
    window.addEventListener(
      'gatoencerrado:open-narrative-continuation',
      handleOpenNarrativeContinuation
    );
    return () =>
      window.removeEventListener(
        'gatoencerrado:open-narrative-continuation',
        handleOpenNarrativeContinuation
      );
  }, []);

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

  const scrollToNextHeroSection = useCallback(() => {
    const target = ['#bienvenida-creador', '#transmedia', '#provoca', '#contact']
      .map((selector) => document.querySelector(selector))
      .find(Boolean);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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

  const handleCloseTicket = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);

  useEffect(() => {
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
  }, [hasActivatedAudio]);


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
        // La escena y el scroll no dependen de que el elemento de audio ya
        // exista. En PWA puede inicializarse unas décimas después; la función
        // compartida reanuda el sonido cuando está disponible sin cancelar la
        // activación narrativa.
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

  // Header y Hero son hermanos — cerrar el HUB de accesos rápidos vive en
  // Header.jsx, pero activar la escena (audio + índice) es lógica de Hero.
  // Mismo gesto que ya existe al cerrar PWAInstructionsOverlay
  // (handleDeclineHeroPwaInstall → handleIsotipoClick), coordinado aquí por
  // evento global en vez de subir todo ese estado de audio a un padre común.
  useEffect(() => {
    const handleActivateSceneRequest = () => {
      if (!hasActivatedAudio) handleIsotipoClick();
    };
    window.addEventListener('gatoencerrado:activate-scene-request', handleActivateSceneRequest);
    return () => window.removeEventListener('gatoencerrado:activate-scene-request', handleActivateSceneRequest);
  }, [hasActivatedAudio, handleIsotipoClick]);

  const shouldInterceptHeroActivationForPwa = useCallback(() => (
    isMobileViewport &&
    !user &&
    !isInstalledPwa &&
    !hasActivatedAudio &&
    !readHeroPwaPromptRecentlyDeclined()
  ), [hasActivatedAudio, isInstalledPwa, isMobileViewport, user]);

  const showNextPwaHashWhisper = useCallback(() => {
    const now = Date.now();
    if (now - lastPwaHashWhisperAtRef.current < 650) return;
    lastPwaHashWhisperAtRef.current = now;
    let nextIndex = Math.floor(Math.random() * PWA_HASH_WHISPERS.length);
    if (
      PWA_HASH_WHISPERS.length > 1 &&
      nextIndex === lastPwaHashWhisperIndexRef.current
    ) {
      nextIndex = (nextIndex + 1) % PWA_HASH_WHISPERS.length;
    }
    lastPwaHashWhisperIndexRef.current = nextIndex;
    setPwaHashWhisper({
      id: now,
      text: PWA_HASH_WHISPERS[nextIndex],
    });
    if (pwaHashWhisperTimerRef.current) {
      window.clearTimeout(pwaHashWhisperTimerRef.current);
    }
    pwaHashWhisperTimerRef.current = window.setTimeout(() => {
      setPwaHashWhisper(null);
      pwaHashWhisperTimerRef.current = null;
    }, 1650);
  }, []);

  useEffect(() => () => {
    if (pwaHashWhisperTimerRef.current) {
      window.clearTimeout(pwaHashWhisperTimerRef.current);
    }
  }, []);

  const handleHeroHashClick = useCallback(() => {
    // Mismo trato que PWAInstructionsOverlay: mientras el HUB de accesos
    // rápidos (Header.jsx) está abierto, el # 3D no activa la escena por su
    // cuenta — solo la × del HUB lo hace. Lectura síncrona vía dataset
    // porque este estado vive en un componente hermano, no en un padre.
    if (typeof document !== 'undefined' && document.body?.dataset.gatHubOpen === 'true') {
      return;
    }
    if (isHeroPwaInstructionsOpen) {
      showNextPwaHashWhisper();
      return;
    }
    if (shouldInterceptHeroActivationForPwa()) {
      setIsHeroPwaInstructionsOpen(true);
      return;
    }
    handleIsotipoClick();
  }, [
    handleIsotipoClick,
    isHeroPwaInstructionsOpen,
    shouldInterceptHeroActivationForPwa,
    showNextPwaHashWhisper,
  ]);

  // Único punto de salida del sheet de instrucciones (la X) — cerrar
  // siempre continúa a la escena, nunca deja al usuario "varado" con el
  // hashtag inerte.
  const handleDeclineHeroPwaInstall = useCallback(() => {
    safeSetItem(HERO_PWA_PROMPT_DECLINED_KEY, String(Date.now()));
    setPwaHashWhisper(null);
    setIsHeroPwaInstructionsOpen(false);
    handleIsotipoClick();
  }, [handleIsotipoClick]);

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

  return (
    <>
      <section
        id="hero"
        ref={heroSectionRef}
        className="min-h-screen relative overflow-hidden flex flex-col"
      >
        <AnimatePresence>
          {!hasActivatedAudio && (
              <motion.div
                key="hero-starfield"
                aria-hidden="true"
                className="hero-starfield"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.3, ease: 'easeOut' } }}
              >
                {heroStars.map((star) => (
                  <span
                    key={star.id}
                    className={`hero-star${star.twinkle ? ' hero-star--twinkle' : ''}`}
                    style={{
                      top: `${star.y}%`,
                      left: `${star.x}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      opacity: star.opacity,
                      '--star-glow': star.glow,
                      '--star-opacity': star.opacity,
                      '--twinkle-delay': `${star.twinkleDelay}s`,
                      '--twinkle-duration': `${star.twinkleDuration}s`,
                    }}
                  />
                ))}
                {heroShootingStars.map((shootingStar) => (
                  <span
                    key={`shooting-${shootingStar.id}`}
                    className="hero-shooting-star"
                    style={{
                      top: `${shootingStar.y}%`,
                      left: `${shootingStar.x}%`,
                      '--shoot-delay': `${shootingStar.delay}s`,
                      '--shoot-duration': `${shootingStar.duration}s`,
                    }}
                  />
                ))}
                {gestureShootingStars.map((star) => (
                  <span
                    key={`gesture-shooting-${star.id}`}
                    className="hero-shooting-star hero-shooting-star--instant"
                    style={{ top: `${star.y}%`, left: `${star.x}%` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        {/* Contenido */}
          <div className="container mx-auto px-6 text-center relative z-10 flex-1 flex flex-col">

              {/* TOP HALF — hash fijo de marca hasta la línea central */}
              <div className="relative flex flex-1 items-end justify-center">
                <AnimatePresence>
                  {shouldShowHeroInactiveHint ? (
                    <HeroInactiveSignal
                      key="hero-inactive-signal"
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  ) : null}
                </AnimatePresence>
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
                    // Fase Cero: mismo trato en móvil y desktop (antes solo
                    // desktop, ahora también móvil — la escena activada abajo
                    // sigue intacta por plataforma, sin tocar esos valores.
                    opacity: !hasActivatedAudio
                      ? 0.28
                      : isMobileViewport ? 1 : 0.96,
                    visibility: 'visible',
                    filter: !hasActivatedAudio
                      ? 'brightness(0.7) contrast(1.08)'
                      : isMobileViewport ? 'brightness(1.12) contrast(1.08)' : 'brightness(1) contrast(1.05)',
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
                        animate={{
                          opacity: 1,
                          filter: 'blur(0px)',
                          transition: {
                            duration: 1.8,
                            ease: [0.2, 1, 0.2, 1],
                            delay: shouldShowHeroInactiveHint ? heroInactiveHintEntryDelay : 0,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          filter: 'blur(14px)',
                          transition: {
                            duration: 1.8,
                            ease: [0.2, 1, 0.2, 1],
                            delay: 0,
                          },
                        }}
                        className={`hero-subtitle-copy absolute inset-0 inline-flex items-center justify-center ${isHeroGhostSubtitle ? 'italic' : 'not-italic'}`}
                      >
                        {shouldShowHeroInactiveHint ? (
                          <span
                            className="inline-flex items-center justify-center"
                            style={{
                              '--hero-hint-entry-delay': `${heroInactiveHintEntryDelay}s`,
                            }}
                          >
                            {currentHeroSubtitle}
                            <span className="hero-hint-cursor" aria-hidden="true" />
                          </span>
                        ) : currentHeroSubtitle}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.div>
                <div
                  className="hero-central-spacer relative mt-5 inline-flex h-12 w-12 items-center justify-center self-center sm:mt-2"
                  aria-hidden={true}
                >
                  <AnimatePresence>
                    {hasActivatedAudio ? (
                      <motion.button
                        key="hero-scroll-cue"
                        type="button"
                        initial={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -4, filter: 'blur(8px)' }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
                        onClick={scrollToNextHeroSection}
                        className="hero-scroll-cue"
                        aria-label="Continuar hacia la siguiente sección"
                      >
                        <ChevronDown size={25} strokeWidth={1.8} />
                      </motion.button>
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
                  pointerEvents: hasActivatedAudio ? 'none' : 'auto',
                }}
                role="button"
                tabIndex={hasActivatedAudio ? -1 : 0}
                onKeyDown={handleHeroHashKeyDown}
                aria-hidden={hasActivatedAudio}
                aria-label="Activar escena"
              >
                <div className="hero-pwa-hash-whisper-anchor" aria-live="polite">
                  <AnimatePresence mode="wait">
                    {isHeroPwaInstructionsOpen && pwaHashWhisper ? (
                      <motion.span
                        key={pwaHashWhisper.id}
                        initial={{ opacity: 0, y: 7, scale: 0.98, filter: 'blur(7px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -5, scale: 0.99, filter: 'blur(5px)' }}
                        transition={{
                          duration: prefersReducedMotion ? 0.14 : 0.34,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="hero-pwa-hash-whisper"
                      >
                        {pwaHashWhisper.text}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                {!hasActivatedAudio && (
                  <Suspense fallback={null}>
                    <HashtagButton3D
                      onClick={handleHeroHashClick}
                      onReady={handleHeroHashReady}
                      height="var(--hero-title-mark-size)"
                      contentScale={isMobileViewport ? 0.92 : 1}
                      style={{ width: 'var(--hero-title-mark-size)', margin: '0 auto' }}
                      showGlow={isHeroPwaInstructionsOpen}
                      glowPulseKey={pwaHashWhisper?.id ?? 0}
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

              </div>{/* /bottom half */}

          </div>
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
        onClose={handleDeclineHeroPwaInstall}
       
      />
    </>
  );
};

export default Hero;
