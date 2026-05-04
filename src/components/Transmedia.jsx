import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpen,
  Dice5,
  HeartHandshake,
  Feather,
  Palette,
  CheckCircle2,
  Wrench,
  Zap,
  Smartphone,
  Coffee,
  Drama,
  Film,
  Video,
  Music,
  Heart,
  Brain,
  Map,
  Scan,
  Users,
  RadioTower,
  Sparkles,
  Layers,
  MapIcon,
  Coins,
  Quote,
  CheckCheckIcon,
  Hand,
  User,
  Send,
  X,
  PawPrint,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';
import CallToAction from '@/components/CallToAction';
import { fetchBlogPostBySlug } from '@/services/blogService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { consumeBienvenidaTransmediaIntent, setBienvenidaReturnPath } from '@/lib/bienvenida';
import {
  extractRecommendedAppId,
  normalizeBridgeKey,
  resolveShowcaseFromAppId,
  resolveShowcaseFromHash,
} from '@/lib/bienvenidaBridge';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { trackVitranaOpen } from '@/services/portalTrackingService';
import MiniversoSonoroPreview from '@/components/miniversos/sonoro/MiniversoSonoroPreview';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import IAInsightCard from '@/components/IAInsightCard';
import DiosasCarousel from '@/components/DiosasCarousel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { useSilvestreVoice } from '@/hooks/useSilvestreVoice';
import ObraConversationControls from '@/components/miniversos/obra/ObraConversationControls';
import ObraQuestionList from '@/components/miniversos/obra/ObraQuestionList';
import { supabase } from '@/lib/supabaseClient';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';
import { isSafariBrowser } from '@/lib/browser';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { fetchFocusAppMetadata } from '@/services/focusAppMetadataService';
import useActiveSubscription from '@/hooks/useActiveSubscription';
import useObraEmotionTracking from '@/hooks/useObraEmotionTracking';
import useQuironCinemaFlow from '@/hooks/useQuironCinemaFlow';
import useShowcaseCarousel from '@/hooks/useShowcaseCarousel';
import useShowcaseTransition from '@/hooks/useShowcaseTransition';
import useTransmediaCredits from '@/hooks/useTransmediaCredits';
import useGatBalanceToast from '@/hooks/useGatBalanceToast';
import useExplorerBadge from '@/hooks/useExplorerBadge';
import useMiniversoUnlocks from '@/hooks/useMiniversoUnlocks';
import useMerchCheckout from '@/hooks/useMerchCheckout';
import usePdfPreview from '@/hooks/usePdfPreview';
import useShowcaseData from '@/hooks/useShowcaseData';
import useMiniversoShare from '@/hooks/useMiniversoShare';
import useNovelaAppCTA from '@/hooks/useNovelaAppCTA';
import useExternalPanels from '@/hooks/useExternalPanels';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useObraVoiceInteraction from '@/hooks/useObraVoiceInteraction';
import useTransmediaSectionAudio from '@/hooks/useTransmediaSectionAudio';
import useShowcaseGuard from '@/hooks/useShowcaseGuard';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import ShowcaseReactionInline from '@/components/transmedia/ShowcaseReactionInline';
import CauseImpactAccordion from '@/components/transmedia/CauseImpactAccordion';

const MARIANA_GALLERY = [
  {
    type: 'image',
    url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/prototito_transmedia.jpeg',
    caption: '#Cat.in.a.Box',
  },
];

const MiniverseModal = lazy(() => import('@/components/MiniverseModal'));
const ContributionModal = lazy(() => import('@/components/ContributionModal'));
const ARExperience = lazy(() => import('@/components/ar/ARExperience'));
const AutoficcionPreviewOverlay = lazy(() => import('@/components/novela/AutoficcionPreviewOverlay'));
const LoginOverlay = lazy(() => import('@/components/ContributionModal/LoginOverlay'));
const PdfPreviewDocument = lazy(() => import('@/components/transmedia/PdfPreviewDocument'));
import {
  GAT_COSTS,
  SHOWCASE_REQUIRED_GAT,
  MOVEMENT_COLLABORATOR_CALL_ITEMS,
  LEGACY_TAZA_VIEWER_ENABLED,
  SHOWCASE_BADGE_IDS,
  EXPLORER_BADGE_STORAGE_KEY,
  HERO_PENDING_MINIVERSE_SELECTION_KEY,
  LOGIN_RETURN_KEY,
  EXPLORER_BADGE_REWARD,
  EXPLORER_BADGE_NAME,
  SHOWCASE_OPEN_TRANSITION,
  INTERACTIVE_EXPERIENCE_GOAL,
  DEFAULT_BADGE_STATE,
  requestCameraAccess,
  MINIVERSO_TILE_GRADIENTS,
  MINIVERSO_TILE_COLORS,
  VITRINA_MIRROR_EFFECTS,
  ORACULO_URL,
  CAUSE_SITE_URL,
  MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED,
  readStoredJson,
  buildShowcaseRewardLabel,
  buildShowcaseEnergyState,
  buildShowcaseMinRequiredCopy,
  MINIVERSO_VERSE_EFFECTS,
  shuffleArray,
  OBRA_VOICE_MODES,
  DEFAULT_OBRA_VOICE_MODE_ID,
  MOBILE_OBRA_SECONDARY_CTA_STATES,
  normalizeSilvestrePrompt,
  showcaseDefinitions,
  formats,
  getHashAnchor,
  parseNumericValue,
  extractFocusIncomingGAT,
  getFocusParamFromLocation,
  CAUSE_ACCORDION,
} from '@/components/transmedia/transmediaConstants';

const SHOWCASE_EYEBROW_COLOR = {
  copycats:            'text-sky-300',
  lataza:              'text-amber-300',
  miniversoNovela:     'text-violet-300',
  miniversoSonoro:     'text-cyan-300',
  miniversoGrafico:    'text-fuchsia-300',
  miniversoMovimiento: 'text-emerald-300',
  apps:                'text-emerald-300',
  oraculo:             'text-violet-300',
  miniversos:          'text-purple-300',
};

const SHOWCASE_CARD_GRADIENT = {
  copycats:            'to-sky-900/25',
  lataza:              'to-amber-900/25',
  miniversoNovela:     'to-violet-900/25',
  miniversoSonoro:     'to-cyan-900/25',
  miniversoGrafico:    'to-fuchsia-900/25',
  miniversoMovimiento: 'to-emerald-900/25',
  apps:                'to-emerald-900/25',
  oraculo:             'to-violet-900/25',
  miniversos:          'to-rose-900/35',
};

const VITRANA_QUESTION_BY_SHOWCASE = {
  miniversos:          '¿Qué significa habitar una emoción delante de otros?',
  miniversoSonoro:     '¿Por qué algunos sonidos duran más que las imágenes?',
  miniversoGrafico:    '¿Qué ocurre cuando alguien más interpreta nuestra apariencia?',
  miniversoMovimiento: '¿Qué sabe el cuerpo antes que la mente?',
  apps:                '¿Qué cambia cuando una historia depende de nuestras decisiones?',
  copycats:            '¿Cuándo un objeto deja de ser solo un objeto?',
  lataza:              '¿Cuándo un objeto deja de ser solo un objeto?',
  miniversoNovela:     '¿Qué cambia cuando una experiencia se convierte en relato?',
  cine:                '¿Qué significa verse fallar desde afuera?',
  oraculo:             '¿Cuándo una experiencia deja de sentirse individual?',
};

const Transmedia = ({ allianceOnlyMode = false }) => {
  const [isMiniverseOpen, setIsMiniverseOpen] = useState(false);
  const [hasLoadedMiniverseModal, setHasLoadedMiniverseModal] = useState(false);
  const [isMiniverseShelved, setIsMiniverseShelved] = useState(false);
  const [miniverseContext, setMiniverseContext] = useState(null);
  const [miniverseInitialTabId, setMiniverseInitialTabId] = useState(null);
  const [activeShowcase, setActiveShowcase] = useState(null);
  const hasHandledDeepLinkRef = useRef(false);
  const [returnShowcaseId, setReturnShowcaseId] = useState(null);
  const [showcaseContent, setShowcaseContent] = useState({});
  const showcaseRef = useRef(null);
  const supportSectionRef = useRef(null);
  const [isMiniversoEditorialModalOpen, setIsMiniversoEditorialModalOpen] = useState(false);
  const [showAutoficcionPreview, setShowAutoficcionPreview] = useState(false);
  const [hasLoadedAutoficcionPreview, setHasLoadedAutoficcionPreview] = useState(false);
  const [galeriaMarianaIndex, setGaleriaMarianaIndex] = useState(null);
  const {
    micPromptVisible,
    transcript,
    micError,
    isListening,
    showSilvestreCoins,
    isSilvestreResponding,
    isSilvestreFetching,
    isSilvestrePlaying,
    pendingSilvestreAudioUrl,
    silvestreThinkingMessage,
    isSilvestreThinkingPulse,
    getSpentSilvestreSetForMode,
    isSilvestreQuestionFullySpent,
    getSilvestreQuestionProgress,
    markSilvestreQuestionSpent,
    handleOpenSilvestreChat,
    handleSendSilvestrePreset,
    handlePlayPendingAudio,
    resetSilvestreQuestions,
  } = useSilvestreVoice();
  const {
    obraModeUsage,
    obraEmotionOrbs,
    incrementObraModeUsage,
  } = useObraEmotionTracking();
  const [recommendedShowcaseId, setRecommendedShowcaseId] = useState(null);
  const [focusLockShowcaseId, setFocusLockShowcaseId] = useState(null);
  const [focusIncomingGAT, setFocusIncomingGAT] = useState(null);
  const [focusAppMetadata, setFocusAppMetadata] = useState(null);
  const [isMovementCreditsOpen, setIsMovementCreditsOpen] = useState(false);
  const [openCollaboratorId, setOpenCollaboratorId] = useState(null);
  const [detonadoresHintActive, setDetonadoresHintActive] = useState(false);
  const detonadoresHintFiredRef = useRef(false);
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const { user, session } = useAuth();
  const { hasActiveSubscription } = useActiveSubscription(user?.id, session);
  const isAuthenticated = Boolean(user);
  const isSubscriber = Boolean(
    user?.user_metadata?.isSubscriber ||
      user?.user_metadata?.is_subscriber ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.roles?.includes?.('subscriber') ||
      hasActiveSubscription
  );
  const navigate = useNavigate();
  const location = useLocation();
  const releaseDesktopFocusLock = useCallback(() => {
    setFocusLockShowcaseId(null);
    setFocusIncomingGAT(null);
    setFocusAppMetadata(null);
  }, []);
  const {
    showcaseCarouselIndex,
    setShowcaseCarouselIndex,
    mobileShowcaseIndex,
    setMobileShowcaseIndex,
    mobileSwipeBlockTapRef,
    visibleShowcases,
    handleShowcaseNextBatch,
    handleShowcasePrevBatch,
    handleMobileShowcaseNext,
    handleMobileShowcasePrev,
    handleMobileShowcaseTouchStart,
    handleMobileShowcaseTouchMove,
    handleMobileShowcaseTouchEnd,
  } = useShowcaseCarousel({
    isMobileViewport,
    focusLockShowcaseId,
    releaseDesktopFocusLock,
    location,
  });
  const isSafari = isSafariBrowser();
  const {
    baseEnergyByShowcase,
    availableGATokens,
    sonoroSpent, setSonoroSpent,
    graphicSpent, setGraphicSpent,
    novelaQuestions, setNovelaQuestions,
    tazaActivations, setTazaActivations,
    showcaseBoosts, setShowcaseBoosts,
    showcaseEnergy, setShowcaseEnergy,
    tokenPrecareContext, setTokenPrecareContext,
    quironSpent, setQuironSpent,
    syncTransmediaCredits,
    trackTransmediaCreditEvent,
  } = useTransmediaCredits({ isAuthenticated, userId: user?.id, toast });
  const { isMerchCheckoutLoading, handleOpenNovelaReserve } = useMerchCheckout({ userEmail: user?.email, activeShowcase, toast });
  const [movementPendingAction, setMovementPendingAction] = useState(null);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [hasLoadedContributionModal, setHasLoadedContributionModal] = useState(false);
  const [contributionCategoryId, setContributionCategoryId] = useState(null);
  const [useLegacyTazaViewer, setUseLegacyTazaViewer] = useState(LEGACY_TAZA_VIEWER_ENABLED);
  const isDesktopFocusLockActive = Boolean(focusLockShowcaseId) && !isMobileViewport;

  useEffect(() => {
    if (isMiniverseOpen) setHasLoadedMiniverseModal(true);
  }, [isMiniverseOpen]);

  useEffect(() => {
    if (isContributionOpen) setHasLoadedContributionModal(true);
  }, [isContributionOpen]);

  useEffect(() => {
    if (showAutoficcionPreview) setHasLoadedAutoficcionPreview(true);
  }, [showAutoficcionPreview]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isSafari) {
      document.documentElement.classList.add('is-safari');
    }
  }, [isSafari]);
  const allShowcasesUnlocked = useMemo(
    () => SHOWCASE_BADGE_IDS.every((id) => showcaseBoosts?.[id]),
    [showcaseBoosts]
  );

  const {
    showGuardrailPrecareOnce,
    requireShowcaseAuth,
    consumeObraVoiceGAT,
    handleCloseTokenPrecare,
    handleTokenPrecareActivateHuella,
    resetGuardrailNotice,
  } = useShowcaseGuard({
    isAuthenticated,
    availableGATokens,
    setTokenPrecareContext,
    trackTransmediaCreditEvent,
    toast,
    supportSectionRef,
  });

  const {
    isQuironFullVisible,
    quironSignedUrl,
    isQuironPlaybackUnlocked,
    shouldResumeQuironPlay,
    isQuironPrecareVisible,
    hasQuironPlaybackStarted,
    setHasQuironPlaybackStarted,
    isQuironAftercareVisible,
    isQuironUnlocking,
    showQuironCoins,
    showQuironCommunityPrompt,
    quironVideoRef,
    handleToggleQuironPrompt,
    handleCloseQuironPrecare,
    handleConfirmQuironPrecare,
    handleQuironPlayRequest,
    handleCloseQuironFull,
    handleQuironPlaybackEnded,
    handleCloseQuironAftercare,
    setIsQuironFullVisible,
    setShouldResumeQuironPlay,
    resetOnLogout: resetQuironOnLogout,
  } = useQuironCinemaFlow({
    activeShowcase,
    isAuthenticated,
    availableGATokens,
    showcaseBoosts,
    showGuardrailPrecareOnce,
    trackTransmediaCreditEvent,
    toast,
  });

  const {
    explorerBadge,
    setExplorerBadge,
    showBadgeCoins,
    setShowBadgeCoins,
    showBadgeLoginOverlay,
    hasLoadedBadgeLoginOverlay,
    celebratedShowcaseId,
    setCelebratedShowcaseId,
    handleBadgeLogin,
    handleCloseBadgeLogin,
    handleBadgeSubscribe,
    handleExplorerReward,
    handleShowcaseRevealBoost,
  } = useExplorerBadge({
    allShowcasesUnlocked,
    isSubscriber,
    showcaseBoosts,
    baseEnergyByShowcase,
    trackTransmediaCreditEvent,
    setIsContributionOpen,
  });

  useEffect(() => {
    if (showBadgeLoginOverlay) setHasLoadedBadgeLoginOverlay(true);
  }, [showBadgeLoginOverlay]);

  useEffect(() => {
    if (isAuthenticated) return;
    setQuironSpent(false);
    resetQuironOnLogout();
  }, [isAuthenticated, resetQuironOnLogout]);

  // silvestre storage handled in useSilvestreVoice

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResumeContribution = () => setIsContributionOpen(true);
    window.addEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    return () => window.removeEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
  }, []);





  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const pending = safeGetItem(LOGIN_RETURN_KEY);
    if (!pending) return;
    try {
      const parsed = JSON.parse(pending);
      if (parsed?.anchor !== '#transmedia') return;
      safeRemoveItem(LOGIN_RETURN_KEY);
      if (parsed?.action !== 'quiron-play') {
        window.setTimeout(() => {
          document.getElementById('transmedia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
        return;
      }
      const targetShowcase = parsed?.showcaseId || 'copycats';
      setActiveShowcase(targetShowcase);
      setIsQuironFullVisible(true);
      setShouldResumeQuironPlay(true);
      window.setTimeout(() => {
        document.getElementById('transmedia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch {
      safeRemoveItem(LOGIN_RETURN_KEY);
    }
  }, [isAuthenticated, setIsQuironFullVisible, setShouldResumeQuironPlay]);

  const renderMobileVideoBadge = () =>
    isMobileViewport ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/80">
          <Video size={14} />
          Ver video
        </div>
      </div>
    ) : null;

  const handleOpenMiniverses = useCallback((contextLabel = null, initialTabId = null) => {
    if (!user) {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.bienvenidaFade = 'true';
      }
      setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          navigate('/bienvenida', { replace: true });
        }, 450);
      }
      return;
    }
    const normalizedLabel = typeof contextLabel === 'string' ? contextLabel : null;
    const normalizedTabId =
      initialTabId === 'escaparate' || initialTabId === 'experiences' || initialTabId === 'waitlist'
        ? initialTabId
        : null;
    setMiniverseContext(normalizedLabel);
    setMiniverseInitialTabId(normalizedTabId);
    setIsMiniverseShelved(false);
    setIsMiniverseOpen(true);
  }, [location.hash, location.pathname, location.search, navigate, user]);

  const handleCloseMiniverses = useCallback(() => {
    setIsMiniverseShelved(false);
    setIsMiniverseOpen(false);
    setMiniverseContext(null);
    setMiniverseInitialTabId(null);
  }, []);

  const loadShowcaseContent = useCallback(async (showcaseId) => {
    const definition = showcaseDefinitions[showcaseId];
    if (!definition || definition.type === 'blog-series' || !definition.slug) {
      return;
    }

    setShowcaseContent((prev) => ({
      ...prev,
      [showcaseId]: { ...(prev[showcaseId] ?? {}), status: 'loading', error: null },
    }));

    try {
      const post = await fetchBlogPostBySlug(definition.slug);
      if (!post) {
        throw new Error('No encontramos el texto asociado a este miniverso.');
      }

      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: { status: 'success', post, error: null },
      }));
    } catch (error) {
      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: {
          status: 'error',
          post: null,
          error: error?.message ?? 'Ocurrió un error al cargar este escaparate.',
        },
      }));
    }
  }, []);

  const openMiniverseById = useCallback(
    (formatId) => {
      if (!formatId || !showcaseDefinitions[formatId]) return;
      setActiveShowcase(formatId);
      trackVitranaOpen(formatId, user);
      const definition = showcaseDefinitions[formatId];
      if (definition.slug && definition.type !== 'blog-series') {
        const entry = showcaseContent[formatId];
        if (!entry || entry.status === 'error') {
          loadShowcaseContent(formatId);
        }
      }
    },
    [loadShowcaseContent, showcaseContent]
  );

  const navigateToMobilePortalIfReady = useCallback(
    (formatId) => {
      if (!formatId) return false;
      const portalRoute = resolvePortalRoute({
        formatId,
        mobileOnly: true,
        isMobileViewport,
      });
      if (!portalRoute) {
        return false;
      }
      navigate(portalRoute, {
        state: createPortalLaunchState(location, 'transmedia-mobile-portal', {
          showcaseId: formatId,
        }),
      });
      return true;
    },
    [isMobileViewport, location, navigate]
  );

  const {
    showcaseOpenTransition,
    clearShowcaseOpenTransitionTimers,
    resetShowcaseOpenTransition,
    runShowcaseOpenTransition,
  } = useShowcaseTransition({ openMiniverseById });

  const resolveShowcaseFromBienvenida = useCallback((payload) => {
    const rawAppId = extractRecommendedAppId(payload);
    return resolveShowcaseFromAppId(rawAppId, showcaseDefinitions);
  }, []);

  const focusShowcaseCard = useCallback((showcaseId) => {
    if (!showcaseId) return;
    const targetIndex = formats.findIndex((item) => item.id === showcaseId);
    if (targetIndex < 0) return;

    setRecommendedShowcaseId(showcaseId);
    setActiveShowcase(null);
    setIsMiniverseShelved(false);
    setMobileShowcaseIndex(targetIndex);

    if (formats.length > 3) {
      const desktopStart = (targetIndex - 1 + formats.length) % formats.length;
      setShowcaseCarouselIndex(desktopStart);
    }
  }, []);

  const stopScopedMediaPlayback = useCallback((preserveHeroAmbient = true) => {
    if (typeof document === 'undefined') {
      return;
    }

    const mediaNodes = Array.from(document.querySelectorAll('video, audio'));
    mediaNodes.forEach((mediaNode) => {
      if (!(mediaNode instanceof HTMLMediaElement)) {
        return;
      }
      if (preserveHeroAmbient && mediaNode.dataset?.ambientRole === 'hero') {
        return;
      }
      try {
        mediaNode.pause?.();
      } catch (error) {
        // noop
      }
    });

    const pipNode = document.pictureInPictureElement;
    if (pipNode instanceof HTMLVideoElement) {
      try {
        pipNode.pause?.();
      } catch (error) {
        // noop
      }
      if (typeof document.exitPictureInPicture === 'function') {
        document.exitPictureInPicture().catch(() => {});
      }
    }

    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleCloseShowcase = useCallback(() => {
    stopScopedMediaPlayback(true);
    document.body.classList.remove('overflow-hidden');
    resetShowcaseOpenTransition();
    setActiveShowcase(null);
    setIsMiniverseShelved(false);
  }, [resetShowcaseOpenTransition, stopScopedMediaPlayback]);

  const handleSelectMiniverse = useCallback(
    (formatId) => {
      if (!formatId) return;
      if (navigateToMobilePortalIfReady(formatId)) {
        setIsMiniverseShelved(false);
        return;
      }
      if (MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED) {
        setIsMiniversoEditorialModalOpen(true);
        return;
      }
      if (showcaseDefinitions[formatId]) {
        openMiniverseById(formatId);
      }
      setIsMiniverseShelved(true);
    },
    [navigateToMobilePortalIfReady, openMiniverseById, setIsMiniversoEditorialModalOpen]
  );

  useEffect(() => {
    if (!activeShowcase && isMiniverseShelved) {
      setIsMiniverseShelved(false);
    }
  }, [activeShowcase, isMiniverseShelved]);

  const handleFormatClick = useCallback(
    (formatId) => {
      if (showcaseOpenTransition.phase !== 'idle') {
        return;
      }
      if (navigateToMobilePortalIfReady(formatId)) {
        return;
      }
      if (focusLockShowcaseId) {
        releaseDesktopFocusLock();
      }
      if (MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED) {
        setIsMiniversoEditorialModalOpen(true);
        return;
      }
      if (showcaseDefinitions[formatId]) {
        const definition = showcaseDefinitions[formatId];
        if (definition.slug && definition.type !== 'blog-series') {
          const entry = showcaseContent[formatId];
          if (!entry || entry.status === 'error') {
            loadShowcaseContent(formatId);
          }
        }
        runShowcaseOpenTransition(formatId);
        return;
      }
      handleOpenMiniverses();
    },
    [
      focusLockShowcaseId,
      handleOpenMiniverses,
      loadShowcaseContent,
      navigateToMobilePortalIfReady,
      releaseDesktopFocusLock,
      runShowcaseOpenTransition,
      showcaseContent,
      showcaseOpenTransition.phase,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpenMiniverseList = (event) => {
      const tabId = event?.detail?.tabId ?? null;
      const contextLabel = event?.detail?.contextLabel ?? 'Explora los miniversos';
      handleOpenMiniverses(contextLabel, tabId);
    };
    window.addEventListener('gatoencerrado:open-miniverse-list', handleOpenMiniverseList);
    return () =>
      window.removeEventListener('gatoencerrado:open-miniverse-list', handleOpenMiniverseList);
  }, [handleOpenMiniverses]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleSelectMiniverseFromHeroInline = (event) => {
      const formatId = event?.detail?.formatId ?? null;
      if (!formatId) return;
      safeRemoveItem(HERO_PENDING_MINIVERSE_SELECTION_KEY);
      handleSelectMiniverse(formatId);
    };
    window.addEventListener(
      'gatoencerrado:select-miniverse-format',
      handleSelectMiniverseFromHeroInline,
    );
    return () =>
      window.removeEventListener(
        'gatoencerrado:select-miniverse-format',
        handleSelectMiniverseFromHeroInline,
      );
  }, [handleSelectMiniverse]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const pendingFormatId = String(
      safeGetItem(HERO_PENDING_MINIVERSE_SELECTION_KEY) ?? '',
    ).trim();
    if (!pendingFormatId) return undefined;
    safeRemoveItem(HERO_PENDING_MINIVERSE_SELECTION_KEY);
    const timeoutId = window.setTimeout(() => {
      handleSelectMiniverse(pendingFormatId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [handleSelectMiniverse]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingIntent = consumeBienvenidaTransmediaIntent();
    if (!pendingIntent) return;
    const rawAppId = extractRecommendedAppId(pendingIntent);
    const showcaseId = resolveShowcaseFromBienvenida(pendingIntent);
    console.info('[sitioobra-bridge] resolved appId -> showcaseId', {
      appId: rawAppId ?? null,
      showcaseId: showcaseId ?? null,
    });
    const section = document.getElementById('transmedia');
    if (section) {
      if (!section.hasAttribute('tabindex')) {
        section.setAttribute('tabindex', '-1');
      }
      section.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (!showcaseId) {
      console.info('[sitioobra-bridge] fallback generic', {
        appId: rawAppId ?? null,
      });
      setActiveShowcase(null);
      setIsMiniverseShelved(false);
      return;
    }
    setFocusLockShowcaseId(showcaseId);
    setFocusIncomingGAT(extractFocusIncomingGAT(pendingIntent));
    setFocusAppMetadata(null);
    focusShowcaseCard(showcaseId);
  }, [focusShowcaseCard, resolveShowcaseFromBienvenida]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const focusRaw = getFocusParamFromLocation(location);
    if (!focusRaw) return undefined;

    let isCancelled = false;

    const fallbackFocusId =
      resolveShowcaseFromAppId(focusRaw, showcaseDefinitions) ||
      resolveShowcaseFromHash(focusRaw, showcaseDefinitions);

    const clearFocus = () => {
      setFocusLockShowcaseId(null);
      setFocusIncomingGAT(null);
      setFocusAppMetadata(null);
      setRecommendedShowcaseId(null);
    };

    const applyFocus = (showcaseId, metadata = null, options = {}) => {
      const { shouldScroll = true } = options;
      if (!showcaseId) return;
      const section = document.getElementById('transmedia');
      if (shouldScroll && section) {
        if (!section.hasAttribute('tabindex')) {
          section.setAttribute('tabindex', '-1');
        }
        section.focus({ preventScroll: true });
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setFocusLockShowcaseId(showcaseId);
      setFocusIncomingGAT(null);
      setFocusAppMetadata(metadata);
      focusShowcaseCard(showcaseId);
    };

    // Fallback inmediato para evitar latencia perceptible en deep-link.
    if (fallbackFocusId) {
      applyFocus(fallbackFocusId, null);
    } else {
      clearFocus();
    }

    const resolveFocusFromRpc = async () => {
      const { metadata, error } = await fetchFocusAppMetadata(focusRaw);
      if (isCancelled) return;

      if (error) {
        console.warn('[Transmedia] No se pudo resolver metadata de focus:', error);
      }

      const rpcShowcaseId = metadata
        ? (showcaseDefinitions[metadata.showcaseId] ? metadata.showcaseId : null) ||
          resolveShowcaseFromAppId(metadata.appId, showcaseDefinitions) ||
          resolveShowcaseFromHash(metadata.appSlug, showcaseDefinitions)
        : null;

      if (rpcShowcaseId) {
        const shouldScroll = rpcShowcaseId !== fallbackFocusId;
        applyFocus(rpcShowcaseId, metadata, { shouldScroll });
        return;
      }

      if (!fallbackFocusId) {
        clearFocus();
      }
    };

    resolveFocusFromRpc();

    return () => {
      isCancelled = true;
    };
  }, [focusShowcaseCard, location, showcaseDefinitions]);

  // Ref para evitar que el efecto reabra la vitrina cuando focusLockShowcaseId
  // cambia a null al cerrar (el hash sigue igual, solo cambió la var de estado).
  const lastHashEffectRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (getFocusParamFromLocation(location)) return;
    const hashAnchor = getHashAnchor(location.hash);
    const showcaseId = resolveShowcaseFromHash(hashAnchor, showcaseDefinitions);
    // HashAnchorScroller en App.jsx maneja el scroll a #transmedia;
    // aquí solo gestionamos estado interno (qué vitrina abrir).
    if (showcaseId === null) return;
    if (!showcaseId) return;
    // Solo actuar cuando el hash realmente cambió, no cuando focusLockShowcaseId
    // cambia a null al cerrar (lo que causaría reabrir la vitrina).
    if (lastHashEffectRef.current === location.hash) return;
    lastHashEffectRef.current = location.hash;
    if (focusLockShowcaseId) {
      releaseDesktopFocusLock();
    }
    openMiniverseById(showcaseId);
  }, [focusLockShowcaseId, location, openMiniverseById, releaseDesktopFocusLock]);

  const navigateToCuratorial = useCallback(
    (slug = null) => {
      if (activeShowcase) {
        handleCloseShowcase();
      }
      if (isMiniverseOpen || isMiniverseShelved) {
        handleCloseMiniverses();
      }

      window.setTimeout(() => {
        if (slug) {
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:open-blog', {
              detail: { slug },
            })
          );
        }
        document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 140);
    },
    [
      activeShowcase,
      handleCloseMiniverses,
      handleCloseShowcase,
      isMiniverseOpen,
      isMiniverseShelved,
    ]
  );

  const handleOpenBlogEntry = useCallback((slug) => {
    if (!slug) {
      return;
    }
    if (!requireShowcaseAuth('Inicia sesión para leer este fragmento.', { action: 'read-fragment', extras: { slug } })) {
      return;
    }
    navigateToCuratorial(slug);
  }, [navigateToCuratorial, requireShowcaseAuth]);

  const {
    latestBlogPostByShowcase,
    publicContributions,
    publicContributionsLoading,
    publicContributionsError,
    readingTooltipForShowcase,
    readingTapArmedByShowcase,
    readingGlowDismissedByShowcase,
    getTopicForShowcase,
    getContributionCategoryForShowcase,
    fetchPublicComments,
    handleOpenLatestBlogForShowcase,
    handleReadingBadgeClick,
  } = useShowcaseData({ navigateToCuratorial, isMobileViewport });

  const {
    imagePreview,
    pdfPreview,
    pdfNumPages,
    setPdfNumPages,
    pdfLoadError,
    setPdfLoadError,
    pdfPageWidth,
    pdfContainerRef,
    pdfEndSentinelRef,
    handleOpenImagePreview,
    handleCloseImagePreview,
    handleOpenPdfPreview,
    handleClosePdfPreview,
    handlePdfLoadSuccess,
  } = usePdfPreview({ requireShowcaseAuth, availableGATokens, isAuthenticated, setTokenPrecareContext, toast });

  const handleCloseMiniversoEditorialModal = useCallback(() => {
    setIsMiniversoEditorialModalOpen(false);
  }, []);

  const handleEditorialCtaClick = useCallback(() => {
    setIsMiniversoEditorialModalOpen(false);
    setTimeout(() => {
      supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const handleScrollToSupport = useCallback(() => {
    supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const {
    isNovelaSubmitting,
    showNovelaCoins,
    showSonoroCoins,
    isGraphicUnlocking,
    showGraphicCoins,
    isTazaActivating,
    tazaCameraReady,
    setTazaCameraReady,
    showTazaCoins,
    isTazaARActive,
    isMobileARFullscreen,
    isProjectionInterestSubmitting,
    isProjectionInterestSent,
    showProjectionEmailInput,
    setShowProjectionEmailInput,
    projectionEmailDraft,
    setProjectionEmailDraft,
    handleNovelaQuestionSend,
    handleSonoroEnter,
    handleOpenGraphicSwipe,
    handleActivateAR,
    handleCloseARExperience,
    handleProjectionInterest,
    handleProjectionEmailSubmit,
    handleARError,
    resetMiniversoUnlockState,
  } = useMiniversoUnlocks({
    trackTransmediaCreditEvent,
    sonoroSpent,
    graphicSpent,
    handleOpenPdfPreview,
    isAuthenticated,
    isSubscriber,
    toast,
    activeShowcase,
  });

  const handleResetCredits = useCallback(() => {
    setQuironSpent(false);
    setIsQuironFullVisible(false);
    setNovelaQuestions(0);
    setSonoroSpent(false);
    setGraphicSpent(false);
    setIsAppsDemoUnlocking(false);
    setTazaActivations(0);
    resetMiniversoUnlockState();
    setShowcaseBoosts({});
    setShowcaseEnergy(baseEnergyByShowcase);
    setExplorerBadge(DEFAULT_BADGE_STATE);
    setShowBadgeCoins(false);
    setCelebratedShowcaseId(null);
    resetGuardrailNotice();
    resetSilvestreQuestions();
    if (typeof window !== 'undefined') {
      safeRemoveItem('gatoencerrado:quiron-spent');
      safeRemoveItem('gatoencerrado:novela-questions');
      safeRemoveItem('gatoencerrado:sonoro-spent');
      safeRemoveItem('gatoencerrado:graphic-spent');
      safeRemoveItem('gatoencerrado:taza-activations');
      safeRemoveItem('gatoencerrado:showcase-boosts');
      safeRemoveItem('gatoencerrado:showcase-energy');
      safeRemoveItem('gatoencerrado:gatokens-available');
      safeRemoveItem(EXPLORER_BADGE_STORAGE_KEY);
      safeRemoveItem('gx_anon_id');
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'novela', spent: false, amount: 0, count: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'cine', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'grafico', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: false, amount: 0, count: 0 },
        })
      );
    }
    void syncTransmediaCredits();
  }, [baseEnergyByShowcase, resetGuardrailNotice, resetMiniversoUnlockState, resetSilvestreQuestions, syncTransmediaCredits]);


  const handleOpenInteractiveExperience = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.bienvenidaFade = 'true';
    }
    setBienvenidaReturnPath(`${location.pathname}${location.search}#apoya`);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        navigate(`/bienvenida?goal=${INTERACTIVE_EXPERIENCE_GOAL}`, { replace: true });
      }, 450);
    }
  }, [location.pathname, location.search, navigate]);

  const activeDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
  const activeData = activeShowcase ? showcaseContent[activeShowcase] : null;

  const { buildMiniverseShareUrl, handleShareMiniverse, handleShareImpactModel } = useMiniversoShare({
    activeShowcase,
    activeDefinition,
    toast,
  });

  const { handleLaunchWebAR, handleOpenCameraForQR, handleNovelAppCTA } = useNovelaAppCTA({
    requireShowcaseAuth,
    trackTransmediaCreditEvent,
    setShowAutoficcionPreview,
    toast,
  });

  const {
    isOraculoOpen,
    isCauseSiteOpen,
    handleOpenOraculo,
    handleCloseOraculo,
    handleOpenCauseSite,
    handleCloseCauseSite,
  } = useExternalPanels({ requireShowcaseAuth, toast });

  const {
    activeObraModeId,
    setActiveObraModeId,
    elevatedSilvestreStarter,
    mobileObraSecondaryCtaState,
    setMobileObraSecondaryCtaState,
    mobileObraReplayPrompt,
    mobileAwaitingEmotionSwitch,
    setMobileAwaitingEmotionSwitch,
    obraConversationControlsRef,
    obraModesRef,
    obraDetonadoresRef,
    isObraVoiceBusy,
    tragicoStarters,
    tragicoStarterSet,
    sendSilvestrePromptToObra,
    handleUseSilvestreStarter,
    handleMobileObraSecondaryCta,
    handleOpenSilvestreChatCta,
    scrollToObraConversationControls,
    scrollToObraModes,
    scrollToObraDetonadores,
  } = useObraVoiceInteraction({
    isMobileViewport,
    activeDefinition,
    isListening,
    isSilvestreFetching,
    isSilvestreResponding,
    isSilvestrePlaying,
    pendingSilvestreAudioUrl,
    transcript,
    consumeObraVoiceGAT,
    incrementObraModeUsage,
    getSpentSilvestreSetForMode,
    markSilvestreQuestionSpent,
    handleSendSilvestrePreset,
    handleOpenSilvestreChat,
  });

  const focusMetadataImageUrl = sanitizeExternalHttpUrl(focusAppMetadata?.imageUrl ?? null);
  const isCinematicShowcaseOpen = Boolean(activeDefinition);
  const isShowcaseOpenTransitionActive = showcaseOpenTransition.phase !== 'idle';
  const showcaseTransitionTargetId = showcaseOpenTransition.targetId;
  const safeAvailableGATokens = Number.isFinite(availableGATokens)
    ? Math.max(Math.trunc(Number(availableGATokens)), 0)
    : 0;
  const showcaseTokenLedger = useMemo(
    () =>
      formats.map((format) => {
        const reward = Number(baseEnergyByShowcase[format.id] ?? 0);
        const required = Number(SHOWCASE_REQUIRED_GAT[format.id] ?? 0);
        const claimed = Boolean(showcaseBoosts?.[format.id]);
        const canActivate = required <= 0 || safeAvailableGATokens >= required;
        return {
          id: format.id,
          title: format.title,
          reward,
          required,
          claimed,
          canActivate,
          statusLabel: required <= 0 ? 'Sin consumo directo' : canActivate ? 'Disponible' : 'Agotada',
        };
      }),
    [baseEnergyByShowcase, safeAvailableGATokens, showcaseBoosts]
  );
  const showcaseTokenLedgerById = useMemo(() => {
    const index = {};
    showcaseTokenLedger.forEach((entry) => {
      index[entry.id] = entry;
    });
    return index;
  }, [showcaseTokenLedger]);

  const { gatBalanceToast } = useGatBalanceToast(safeAvailableGATokens);

  useEffect(() => {
    if (hasHandledDeepLinkRef.current) return;
    const params = new URLSearchParams(location.search);
    const miniverse = params.get('miniverso');
    if (!miniverse || !showcaseDefinitions[miniverse]) return;
    hasHandledDeepLinkRef.current = true;

    if (typeof document !== 'undefined') {
      const anchor = document.querySelector('#transmedia');
      if (anchor) {
        const target = anchor.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: target, behavior: 'smooth' });
        window.setTimeout(() => openMiniverseById(miniverse), 350);
        return;
      }
    }
    openMiniverseById(miniverse);
  }, [location.search, openMiniverseById]);


  useBodyScrollLock({ isCinematicShowcaseOpen, isMiniverseShelved, handleCloseShowcase });

  const { transmediaSectionRef } = useTransmediaSectionAudio({ isSilvestrePlaying });

  const previousActiveShowcaseRef = useRef(null);
  const activeParagraphs = useMemo(() => {
    if (!activeData?.post?.content) {
      return [];
    }
    return activeData.post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  }, [activeData]);

  // Reset collaborator when activeDefinition changes (ora state reset is handled by useObraVoiceInteraction)
  useEffect(() => {
    setOpenCollaboratorId(null);
  }, [activeDefinition]);

  useEffect(() => {
    const previous = previousActiveShowcaseRef.current;
    if (previous && previous !== activeShowcase) {
      stopScopedMediaPlayback(true);
    }
    previousActiveShowcaseRef.current = activeShowcase;
  }, [activeShowcase, stopScopedMediaPlayback]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.gatoShowcaseOpen = activeShowcase ? 'true' : 'false';
    }
    window.dispatchEvent(
      new CustomEvent('gatoencerrado:showcase-visibility', {
        detail: {
          open: Boolean(activeShowcase),
          showcaseId: activeShowcase ?? null,
        },
      }),
    );
    return undefined;
  }, [activeShowcase]);

  useEffect(
    () => () => {
      stopScopedMediaPlayback(true);
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.gatoShowcaseOpen;
      }
      if (typeof window === 'undefined') return;
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:showcase-visibility', {
          detail: { open: false, showcaseId: null },
        }),
      );
    },
    [stopScopedMediaPlayback],
  );

  const renderCollaboratorsSection = useCallback(
    (collaborators, prefix = 'collab', bare = false) => {
      if (!Array.isArray(collaborators) || !collaborators.length) return null;
      const normalized = collaborators.map((collab, idx) => ({
        ...collab,
        _avatarId: collab.id ?? `${prefix}-${idx}`,
        _image: collab.image || '/images/placeholder-colaboradores.jpg',
      }));
      const selected = normalized.find((collab) => collab._avatarId === openCollaboratorId);
      const avatarsToShow = normalized.filter((collab) => collab._avatarId !== selected?._avatarId);
      const inner = (
        <>
          <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] md:items-center gap-3">
            <motion.div layout className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              {avatarsToShow.map((collab) => {
                const isActive = selected?._avatarId === collab._avatarId;
                return (
                  <motion.button
                    key={collab._avatarId}
                    type="button"
                    layout
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={() => setOpenCollaboratorId(collab._avatarId)}
                    className={`h-16 w-16 md:h-12 md:w-12 rounded-full border ${
                      isActive ? 'border-purple-300/80 ring-2 ring-purple-400/50' : 'border-white/15'
                    } bg-white/5 overflow-hidden transition hover:border-purple-300/60 shadow-lg shadow-black/30`}
                    title={collab.name}
                  >
                    <img
                      src={collab._image}
                      alt={`Retrato de ${collab.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </motion.button>
                );
              })}
            </motion.div>
            <p className="text-xs uppercase tracking-[0.35em] text-purple-300 text-center md:text-right">
              Colaboradores
            </p>
          </div>
          {selected ? (
            <div className="border border-white/10 rounded-2xl bg-black/20 p-4 flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
              <img
                src={selected._image}
                alt={`Retrato de ${selected.name}`}
                className="h-24 w-24 md:h-18 md:w-18 rounded-full object-cover border border-white/10 flex-shrink-0 shadow-lg shadow-black/30"
                loading="lazy"
              />
              <div className="space-y-2 flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
                  <div className="space-y-1">
                    <p className="text-slate-100 font-semibold">{selected.name}</p>
                    {selected.role ? (
                      <p className="text-[11px] uppercase tracking-[0.3em] text-purple-300">
                        {selected.role}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCollaboratorId(null)}
                    className="text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition self-center md:self-start"
                    aria-label="Cerrar ficha de colaborador"
                  >
                    Cerrar ✕
                  </button>
                </div>
                {selected.bio ? (
                  <p className="text-sm text-slate-200/90 leading-relaxed">{selected.bio}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      );
      if (bare) return <div className="space-y-3">{inner}</div>;
      return (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4 md:space-y-3">
          {inner}
        </div>
      );
    },
    [openCollaboratorId]
  );

  useEffect(() => {
    if (activeShowcase !== 'copycats') {
      setOpenCollaboratorId(null);
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'oraculo') {
      handleCloseOraculo();
    }
  }, [activeShowcase, handleCloseOraculo]);

  useEffect(() => {
    if (activeShowcase !== 'lataza') {
      handleCloseARExperience();
    }
  }, [activeShowcase, handleCloseARExperience]);

  useEffect(() => {
    if (!isMiniversoEditorialModalOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseMiniversoEditorialModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMiniversoEditorialModalOpen, handleCloseMiniversoEditorialModal]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const handleMovementAction = useCallback((action) => {
    if (!action) {
      return;
    }
    setMovementPendingAction(action);
  }, []);
  const handleCloseMovementActionOverlay = useCallback(() => {
    setMovementPendingAction(null);
  }, []);

  const handleOpenExperienceSite = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open('https://gatoencerrado.ai', '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenContribution = useCallback(
    (categoryId = null) => {
      if (activeShowcase) {
        setReturnShowcaseId(activeShowcase);
        setActiveShowcase(null);
      } else {
        setReturnShowcaseId(null);
      }
      setContributionCategoryId(categoryId);
      setIsContributionOpen(true);
    },
    [activeShowcase]
  );

  const handleReturnToShowcase = useCallback(() => {
    if (!returnShowcaseId) return;
    setIsContributionOpen(false);
    setContributionCategoryId(null);
    const targetId = returnShowcaseId;
    setReturnShowcaseId(null);
    requestAnimationFrame(() => openMiniverseById(targetId));
  }, [openMiniverseById, returnShowcaseId]);

  const renderCommunityBlock = useCallback(
    (
      showcaseId,
      {
        heading = 'Laboratorio de emociones',
        ctaLabel = 'Registra tu respuesta',
        subCopy = 'Nos interesa explorar qué ocurre en distintas personas cuando una experiencia transforma su manera de entender el mundo.',
        emptyMessage = 'Aún no hay comentarios de la comunidad.',
        reactionProps = null,
        className = 'rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5',
        commentsViewportClassName = 'max-h-[330px]',
        hideReaction = false,
      } = {}
    ) => {
      if (!showcaseId) return null;
      // const comments = publicContributions[showcaseId] ?? [];
      // const isLoading = publicContributionsLoading[showcaseId];
      // const error = publicContributionsError[showcaseId];
      const categoryId = getContributionCategoryForShowcase(showcaseId);

      return (
        <div className={className}>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70 mb-1">{heading}</p>
          <div className="form-surface px-6 py-8">
            {VITRANA_QUESTION_BY_SHOWCASE[showcaseId] ? (
              <p className="text-slate-800 text-base leading-relaxed italic text-center font-light">
                {VITRANA_QUESTION_BY_SHOWCASE[showcaseId]}
              </p>
            ) : (
              <p className="text-slate-400/60 text-sm text-center py-2">···</p>
            )}
          </div>
          {/* Listado de comentarios — temporalmente desactivado; pendiente de ubicar en Backstage
          <div className={`${commentsViewportClassName} form-surface relative overflow-y-auto px-3 py-3 pr-2`}>
            {isLoading ? (
              <p className="px-1 py-2 text-sm text-slate-600/85">Cargando comentarios…</p>
            ) : error ? (
              <p className="px-1 py-2 text-sm text-rose-700/85">{error}</p>
            ) : comments.length ? (
              <div className="space-y-2.5">
                {comments.map((comment) => (
                  <div
                    key={`${showcaseId}-${comment.id}`}
                    className="rounded-xl border border-indigo-200/70 bg-white/72 p-3 shadow-[0_6px_18px_rgba(80,120,255,0.08)]"
                  >
                    <p className="mb-1.5 text-[0.96rem] font-light leading-relaxed text-slate-800">
                      {comment.proposal}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500/85">
                      {comment.name || 'Anónimo'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-1 py-2 text-sm text-slate-600/85">{emptyMessage}</p>
            )}
          </div>
          <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500/85">
            Desliza para leer más voces
          </p>
          */}
          <div className="pt-4 mt-1 border-t border-white/10">
            <div className="mx-auto w-full max-w-md">
              <Button
                variant="outline"
                className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase"
                onClick={() => handleOpenContribution(categoryId)}
              >
                {ctaLabel}
              </Button>
            </div>
            <p className="text-xs text-slate-400/70 leading-relaxed px-1 mt-3">
              {subCopy}
            </p>
          </div>
          {!hideReaction && reactionProps && activeShowcase === showcaseId ? (
            <ShowcaseReactionInline {...reactionProps} />
          ) : null}
        </div>
      );
    },
    [
      activeShowcase,
      getContributionCategoryForShowcase,
      getTopicForShowcase,
      handleReadingBadgeClick,
      handleOpenContribution,
      isMobileViewport,
      latestBlogPostByShowcase,
      readingGlowDismissedByShowcase,
      readingTooltipForShowcase,
      publicContributions,
      publicContributionsError,
      publicContributionsLoading,
    ]
  );

  useEffect(() => {
    if (!activeShowcase) return;
    if (publicContributions[activeShowcase]) return;
    fetchPublicComments(activeShowcase);
  }, [activeShowcase, fetchPublicComments, publicContributions]);

const rendernotaAutoral = () => {
  if (!activeDefinition?.notaAutoral) return null;

  const activeId = activeDefinition.id ?? activeShowcase;
  const tileColors = MINIVERSO_TILE_COLORS[activeId] ?? MINIVERSO_TILE_COLORS.default;
  const tileGradient = MINIVERSO_TILE_GRADIENTS[activeId] ?? MINIVERSO_TILE_GRADIENTS.default;
  const isTragedia = activeDefinition.type === 'tragedia';
  const effect = MINIVERSO_VERSE_EFFECTS[activeId] ?? MINIVERSO_VERSE_EFFECTS.default;

  return (
    <div className="relative flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso Autoral</p>
      <MiniVersoCard
        title={activeDefinition.cartaTitle || 'Nota autoral'}
        verse={activeDefinition.notaAutoral}
        palette={{
          gradient: tileGradient,
          border: tileColors.border,
          text: tileColors.text,
          accent: tileColors.accent,
          background: tileColors.background,
        }}
        effect={effect}
        isTragedia={isTragedia}
        onFirstReveal={() => handleShowcaseRevealBoost(activeId)}
        celebration={celebratedShowcaseId === activeId}
      />
    </div>
  );
};


  const renderPostDetails = (emptyMessage = 'Pronto liberaremos la carta completa de este miniverso.') => {
    if (!activeDefinition?.slug) {
      return null;
    }

    if (activeData?.status === 'loading') {
      return <p className="text-slate-400 text-sm">Cargando la carta que acompaña a este miniverso…</p>;
    }

    if (activeData?.status === 'error') {
      return <p className="text-red-300 text-sm">{activeData.error}</p>;
    }

    if (activeData?.status === 'success' && activeData.post) {
      return (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            {activeData.post.author ? (
              <span className="inline-flex items-center gap-2">
                <Feather size={16} />
                {activeData.post.author}
                {activeData.post.author_role ? (
                  <span className="text-slate-500">/ {activeData.post.author_role}</span>
                ) : null}
              </span>
            ) : null}
            {activeData.post.published_at ? (
              <span>
                {new Date(activeData.post.published_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            ) : null}
          </div>
          <h4 className="font-display text-2xl text-slate-100 mb-6">{activeData.post.title}</h4>
          <div className="space-y-5 text-slate-200 leading-relaxed font-light">
            {activeParagraphs.length === 0 ? (
              <p>Muy pronto abriremos el expediente completo de este miniverso. Gracias por tu curiosidad.</p>
            ) : (
              activeParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            )}
          </div>
        </>
      );
    }

    return <p className="text-slate-400 text-sm">{emptyMessage}</p>;
  };

  const renderShowcaseContent = () => {
    if (!activeDefinition) {
      return (
        <p className="text-slate-400 text-sm">
          Selecciona un miniverso para explorar su carta y materiales.
        </p>
      );
    }

  if (activeDefinition.type === 'object-webar') {
    const objectWebArVideoId = `${activeShowcase ?? 'object-webar'}-video`;
    const isTazaUnlimited = true;
    const remainingTazaGatokens = isTazaUnlimited ? Number.POSITIVE_INFINITY : Math.max(90 - tazaActivations * 30, 0);

      return (
        <div className="space-y-8">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
  <div className="flex items-center justify-between gap-3 px-6 pt-4">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">
      OBRAS DESTACADAS
    </p>
  </div>

  {activeShowcase === 'lataza' && isTazaARActive && !isMobileARFullscreen ? (
    <div className="p-0 sm:p-4">
      {useLegacyTazaViewer ? (
        <div className="relative w-full min-h-[75vh] rounded-3xl overflow-hidden border border-white/10 bg-black/50">
          <iframe
            title="Visor AR Taza (estable)"
            src="/webar/taza/"
            className="absolute inset-0 w-full h-full"
            allow="camera; microphone; fullscreen; xr-spatial-tracking"
          />
        </div>
      ) : (
        <Suspense fallback={<div className="w-full min-h-[75vh] sm:min-h-[80vh] rounded-3xl border border-white/10 bg-black/50" />}>
          <ARExperience
            targetSrc="/webar/taza/taza.mind"
            phrases={activeDefinition.phrases}
            showScanGuide
            guideImageSrc="/webar/taza/taza-marker.jpg"
            guideLabel="Alinea la ilustración de la taza con el contorno. No necesita ser exacto."
            onExit={handleCloseARExperience}
            initialCameraReady
            onError={handleARError}
          />
        </Suspense>
      )}
    </div>
  ) : (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* ───────── Columna izquierda: taza ───────── */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-[4/3] max-h-[260px] overflow-hidden rounded-2xl bg-black/50">
          {/\.mp4($|\?)/i.test(activeDefinition.image) ? (
            <video
              src={activeDefinition.image}
              className="absolute inset-0 h-full w-full object-contain"
              autoPlay
              playsInline
              muted
              loop
              controls={canUseInlinePlayback(objectWebArVideoId)}
              poster={activeDefinition.imagePoster}
            />
          ) : (
            <img
              src={activeDefinition.image}
              alt="Ilustración de La Taza"
              className="absolute inset-0 h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">
          {activeDefinition.note}
        </p>

        {activeDefinition.instructions ? (
          <ul className="text-sm text-slate-300/90 space-y-2">
            {activeDefinition.instructions.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-300 mt-1">●</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {activeShowcase === 'lataza' ? (
          <div className="relative inline-flex overflow-visible flex-col gap-2">
            <Button
              className="relative border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-visible"
              variant="outline"
              onClick={handleActivateAR}
              disabled={isTazaActivating}
            >
              {isTazaActivating ? 'Procesando...' : activeDefinition.ctaLabel}
            </Button>
            {LEGACY_TAZA_VIEWER_ENABLED ? (
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <input
                  type="checkbox"
                  className="accent-purple-400"
                  checked={useLegacyTazaViewer}
                  onChange={(e) => setUseLegacyTazaViewer(e.target.checked)}
                />
                Usar visor estable (A‑Frame)
              </label>
            ) : null}
            <button
              type="button"
              onClick={() => handleOpenNovelaReserve(['taza-250'])}
              disabled={isMerchCheckoutLoading}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
            >
              {isMerchCheckoutLoading ? 'Abriendo checkout...' : 'Comprar tu taza'}
            </button>
          </div>
        ) : null}

      </div>

      {/* ───────── Columna derecha: Proceso Mariana Núñez ───────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-5">
        {galeriaMarianaIndex === null ? (
          <>
            <div className="border-l-2 border-amber-400/50 pl-4 space-y-2">
              <div>
                <p className="font-display text-base text-slate-100">#CatInABox</p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mt-1">Cerámica esmaltada · 2026</p>
              </div>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Este &ldquo;gato&rdquo; —el hashtag que usamos en código y redes para conectar— aquí se vuelve objeto: un volumen que cabe en una caja.
              </p>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Ya no organiza contenido; se guarda. Un nodo físico dentro del sistema transmedial de #GatoEncerrado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGaleriaMarianaIndex(0)}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10"
            >
              <img
                src={MARIANA_GALLERY[0].url}
                alt={MARIANA_GALLERY[0].caption}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-xs uppercase tracking-[0.35em] text-white">Ver proceso</p>
              </div>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGaleriaMarianaIndex(null)}
                className="text-xs uppercase tracking-[0.3em] text-amber-400/80 hover:text-amber-300 transition-colors"
              >
                ← Cédula
              </button>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {galeriaMarianaIndex + 1} / {MARIANA_GALLERY.length}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              {MARIANA_GALLERY[galeriaMarianaIndex].type === 'video' ? (
                <video
                  src={MARIANA_GALLERY[galeriaMarianaIndex].url}
                  controls
                  className="w-full"
                />
              ) : (
                <img
                  src={MARIANA_GALLERY[galeriaMarianaIndex].url}
                  alt={MARIANA_GALLERY[galeriaMarianaIndex].caption}
                  className="w-full object-contain"
                />
              )}
            </div>
            <p className="text-center text-xs text-slate-400">{MARIANA_GALLERY[galeriaMarianaIndex].caption}</p>
            {MARIANA_GALLERY.length > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setGaleriaMarianaIndex((i) => (i - 1 + MARIANA_GALLERY.length) % MARIANA_GALLERY.length)}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setGaleriaMarianaIndex((i) => (i + 1) % MARIANA_GALLERY.length)}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )}
</div>

            {activeDefinition.sentiments ? (
              <div className="rounded-2xl border border-white/10 p-6 bg-black/30">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Sentimientos vinculados</p>
                <ul className="space-y-3 text-slate-300/80 text-sm leading-relaxed">
                  {activeDefinition.sentiments.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            {renderCommunityBlock('lataza', {
              reactionProps: {
                showcaseId: 'lataza',
                description: 'Haz clic en este miniverso para hacerlo resonar contigo.',
                buttonLabel: 'Resonar con la taza',
              },
            })}
          </div>
        </div>
        </div>
      );
    }

    if (activeDefinition.type === 'audio-dream') {
    return (
      <div className="space-y-8">
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-0 lg:p-6">
            <MiniversoSonoroPreview
              videoUrl={activeDefinition.videoUrl}
              videoTitle={activeDefinition.label}
              videoArtist="Residencia #GatoEncerrado"
              audioOptions={activeDefinition.musicOptions}
              poemOptions={activeDefinition.poems}
              showHeader
              showCTA
              onEnterExperience={handleSonoroEnter}
              isSpent={sonoroSpent}
              coinBlast={showSonoroCoins}
              costLabel="130 gatokens"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Cómo explorar</p>
                <ol className="list-decimal list-inside space-y-3 text-slate-200 text-sm leading-relaxed md:text-base">
                  {activeDefinition.exploration?.map((step, index) => (
                    <li key={`sonoro-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
              {activeDefinition.closing?.length ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3 text-sm text-slate-300">
                  {activeDefinition.closing.map((line, index) => (
                    <p key={`sonoro-closing-${index}`}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              {renderCommunityBlock('miniversoSonoro', {
                reactionProps: {
                  showcaseId: 'miniversoSonoro',
                  title: 'La voz de quienes escuchan',
                  description: 'Comparte tu vibración y deja un like que resuene en este miniverso.',
                  buttonLabel: 'Hacer latir la resonancia',
                  className: 'mt-0',
                },
              })}
            </div>
          </div>
        </div>
      </div>
    );
    }

    if (activeDefinition.type === 'oracle') {
      return (
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Minado simbólico</p>
              {activeDefinition.loops ? (
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {activeDefinition.loops.map((step, index) => (
                    <li key={`oraculo-loop-${index}`} className="flex items-start gap-2">
                      <span className="text-purple-300 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {activeDefinition.tagline ? (
                <p className="text-sm text-purple-200/90">{activeDefinition.tagline}</p>
              ) : null}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                  onClick={handleOpenOraculo}
                >
                  {activeDefinition.ctaLabel}
                </Button>
                <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.ctaDescription}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Sistema de recompensas</p>
              <div className="grid gap-3 md:grid-cols-2">
                {activeDefinition.rewards?.map((reward, index) => (
                  <div
                    key={`oraculo-reward-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-100">{reward.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200">
                        <Coins size={14} className="text-amber-200" />
                        {reward.tokens}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300/90 leading-relaxed">{reward.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">{activeDefinition.limitsNote}</p>
            </div>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Semillas de conocimiento</p>
              <ul className="space-y-2 text-sm text-slate-300/85 leading-relaxed">
                {activeDefinition.seedNotes?.map((seed, index) => (
                  <li key={`oraculo-seed-${index}`} className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-1 text-amber-200" />
                    <span>{seed}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-200" />
                <p className="text-sm text-slate-200 font-semibold">Interacción que deja huella</p>
              </div>
              <p className="text-sm text-slate-300/85 leading-relaxed">
                Tus reflexiones afinan la mente del Gato: entrenamiento simbólico, no binario y emocional. Cada
                participación se audita para evitar ruido.
              </p>
              <p className="text-xs text-slate-500">El Oráculo es un espacio curado; el minado es resonancia, no dinero.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'tragedia') {
      const onClose = handleCloseShowcase;
      const activeModeSpentSet = getSpentSilvestreSetForMode(activeObraModeId);
      const visibleStarters = tragicoStarters.filter(
        (starter) => !isSilvestreQuestionFullySpent(starter)
      );
      const questionProgressMap = visibleStarters.reduce((acc, starter) => {
        acc[starter] = getSilvestreQuestionProgress(starter).count;
        return acc;
      }, {});
      const activeObraMode =
        OBRA_VOICE_MODES.find((mode) => mode.id === activeObraModeId) ?? OBRA_VOICE_MODES[0];
      const activeObraTint = activeObraMode?.tint ?? OBRA_VOICE_MODES[0].tint;
      const hasReplayPrompt = Boolean(normalizeSilvestrePrompt(mobileObraReplayPrompt));
      const mobileSecondaryCtaCopy =
        mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION
          ? 'Escúchala con otra emoción'
          : mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE
            ? 'Lanza la frase'
            : 'Escoger del laboratorio';
      const mobileSecondaryCtaEmphasis =
        mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION
          ? 'glow'
          : mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE
            ? 'action'
            : 'soft';
      const mobileSecondaryCtaDisabled =
        isObraVoiceBusy ||
        (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE &&
          !hasReplayPrompt);

      const reactionDetails = {
        showcaseId: 'miniversos',
        title: 'Resonancia colectiva',
        description: 'Haz clic para dejar un pulso que mantenga viva la conversación.',
        buttonLabel: 'Enviar pulsaciones',
        className: 'mt-4',
      };
      const emotionUsageEntries = OBRA_VOICE_MODES
        .map((mode) => ({
          ...mode,
          count: Number(obraModeUsage?.[mode.id] ?? 0),
        }))
        .sort((a, b) => b.count - a.count);
      const emotionModesById = OBRA_VOICE_MODES.reduce((acc, mode) => {
        acc[mode.id] = mode;
        return acc;
      }, {});
      const emotionLegendEntries = emotionUsageEntries
        .filter((mode) => mode.count > 0)
        .slice(0, 3);
      const collectiveEmotionBaseline = {
        'confusion-lucida': 19,
        'sospecha-doctora': 14,
        'necesidad-orden': 16,
        'humor-negro': 12,
        'cansancio-mental': 18,
        'atraccion-incomoda': 13,
        vertigo: 10,
      };
      const collectiveEmotionRows = OBRA_VOICE_MODES.map((mode) => {
        const localCount = Number(obraModeUsage?.[mode.id] ?? 0);
        const baseline = Number(collectiveEmotionBaseline?.[mode.id] ?? 10);
        const collective = baseline + Math.min(localCount * 2, 14);
        return {
          ...mode,
          collective,
        };
      }).sort((a, b) => b.collective - a.collective);
      const collectiveEmotionNodes = collectiveEmotionRows.slice(0, 4);
      const collectiveNodeLayout = [
        { x: 17, y: 27 },
        { x: 82, y: 22 },
        { x: 73, y: 76 },
        { x: 24, y: 80 },
      ];
      const collectiveSyntheticSessions = collectiveEmotionRows.reduce(
        (sum, row) => sum + Number(row.collective || 0),
        0
      ) + 26;
      const collectivePhraseMetric = {
        phrase: '¿La Doctora sí entiende a Silvestre… o solo parece que sí?',
        reused: 63,
        original: 37,
      };
      const collectiveTopEmotion = collectiveEmotionRows[0] ?? null;

      return (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="contents lg:block lg:min-w-0 lg:space-y-6">
              <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Experiencia narrativa</p>
                  <h2
                    className="font-display text-[clamp(1.3rem,5.6vw,1.55rem)] leading-tight text-white sm:text-2xl break-words"
                    style={{ textWrap: 'balance' }}
                  >
                    Habita los sentimientos de Silvestre
                  </h2>
                   <p className="text-base leading-relaxed text-neutral-300">
          Los estados emocionales de <strong>Silvestre</strong> no son etiquetas.{' '}
          Son lugares donde la escena ocurre. Di una frase —tuya o del libreto— y escucha cómo la obra responde desde adentro.
        </p>
        <p className="text-lg leading-relaxed font-medium text-white mt-4">
          La escena nunca responde igual.
        </p>
                </div>

                <div ref={obraModesRef} className="space-y-3">
                  {OBRA_VOICE_MODES.map((mode) => {
                    const isActiveMode = activeObraModeId === mode.id;

                    if (isActiveMode) {
                      return (
                        <div
                          key={mode.id}
                          className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/5 to-black/30 p-4 text-left transition border-white/40 shadow-[0_18px_55px_rgba(124,58,237,0.2)]"
                          style={{ borderColor: mode.tint?.border, boxShadow: mode.tint?.glow }}
                        >
                          <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-0 opacity-70 bg-gradient-to-br ${mode.accent}`}
                          />
                          <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-black/40"
                                style={{ borderColor: mode.tint?.border }}
                              >
                                {mode.icon ? <mode.icon size={18} style={{ color: mode.tint?.dot }} /> : null}
                              </span>
                              <p className="text-lg font-semibold text-white">{mode.title}</p>
                            </div>

                            <div ref={obraConversationControlsRef}>
                              <ObraConversationControls
                                ctaLabel="Pulsa para improvisar"
                                isSilvestrePlaying={isSilvestrePlaying}
                                pendingSilvestreAudioUrl={pendingSilvestreAudioUrl}
                                isSilvestreFetching={isSilvestreFetching}
                                isSilvestreResponding={isSilvestreResponding}
                                silvestreThinkingMessage={silvestreThinkingMessage}
                                isSilvestreThinkingPulse={isSilvestreThinkingPulse}
                                isListening={isListening}
                                micPromptVisible={micPromptVisible}
                                showSilvestreCoins={showSilvestreCoins}
                                micError={micError}
                                transcript={transcript}
                                secondaryCtaVisible
                                secondaryCtaCopy={mobileSecondaryCtaCopy}
                                secondaryCtaDisabled={mobileSecondaryCtaDisabled}
                                secondaryCtaEmphasis={mobileSecondaryCtaEmphasis}
                                onMicClick={() => {
                                  if (!detonadoresHintFiredRef.current && !isMobileViewport) {
                                    detonadoresHintFiredRef.current = true;
                                    setDetonadoresHintActive(true);
                                    setTimeout(() => setDetonadoresHintActive(false), 2000);
                                  }
                                  handleOpenSilvestreChatCta(activeObraModeId);
                                }}
                                onPlayPending={handlePlayPendingAudio}
                                onSecondaryCtaClick={() => {
                                  if (!isMobileViewport) {
                                    setDetonadoresHintActive(true);
                                    setTimeout(() => setDetonadoresHintActive(false), 2000);
                                  }
                                  handleMobileObraSecondaryCta();
                                }}
                                tone={activeObraTint}
                                className="pt-1"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveObraModeId(mode.id)}
                        aria-pressed={false}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-black/30 p-4 text-left transition hover:border-purple-300/50 hover:shadow-[0_12px_40px_rgba(124,58,237,0.18)]"
                      >
                        <div
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 opacity-60 bg-gradient-to-br ${mode.accent}`}
                        />
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-black/40"
                              style={{ borderColor: mode.tint?.border }}
                            >
                              {mode.icon ? <mode.icon size={18} style={{ color: mode.tint?.dot }} /> : null}
                            </span>
                            <p className="text-lg font-semibold text-white">{mode.title}</p>
                          </div>
                          <p className="text-sm text-slate-300/85">{mode.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="order-5 min-w-0 lg:order-none">
                {renderCommunityBlock('miniversos', {
                  emptyMessage: 'Todavía no hay voces en este miniverso.',
                  reactionProps: reactionDetails,
                  className: 'rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5',
                  commentsViewportClassName: 'max-h-[240px]',
                })}
              </div>
            </div>

            <div className="order-2 min-w-0 space-y-6 lg:order-none">
              <div
                ref={obraDetonadoresRef}
                className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-6 transition-opacity${detonadoresHintActive ? ' animate-pulse' : ''}`}
                style={{ borderColor: activeObraTint?.border, boxShadow: activeObraTint?.glow }}
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 opacity-35 bg-gradient-to-br ${activeObraMode.accent}`}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage: `radial-gradient(circle at top, ${activeObraTint?.dot || 'rgba(196,181,253,0.6)'}, transparent 65%)`,
                  }}
                />
                <div className="relative z-10">
                {visibleStarters.length ? (
                  <ObraQuestionList
                    starters={visibleStarters}
                    spentSet={activeModeSpentSet}
                    questionProgressMap={questionProgressMap}
                    questionProgressTotal={OBRA_VOICE_MODES.length}
                    onSelect={handleUseSilvestreStarter}
                    variant="stack"
                    elevatedStarter={elevatedSilvestreStarter}
                    elevatedCopy="Pruébala con otra emoción"
                    tone={{
                      borderColor: activeObraTint?.border,
                      dotColor: activeObraTint?.dot,
                      headingColor: activeObraTint?.dot,
                    }}
                    eyebrowChip={activeObraMode?.description || ''}
                    cornerIcon={activeObraMode?.icon || null}
                    cornerIconLabel={`Perfil activo: ${activeObraMode?.title || ''}`}
                  />
                ) : (
                  <div className="space-y-2">
                    <p
                      className="text-xs uppercase tracking-[0.35em] text-pink-200"
                      style={{ color: activeObraTint?.dot }}
                    >
                      Tiñe la escena con sentimiento
                    </p>
                    <p className="text-sm text-slate-300/85 leading-relaxed">
                      Ya completaste estas preguntas en todas emociones de Silvestre.
                    </p>
                  </div>
                )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 10%, rgba(148,163,184,0.22), transparent 42%), radial-gradient(circle at 80% 90%, rgba(59,130,246,0.16), transparent 48%)',
                  }}
                />
                <div className="relative z-10 space-y-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Mi bitácora de emociones</p>
                  <div className="relative mx-auto h-[260px] w-full max-w-[300px]" aria-hidden="true">
                    <div className="absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2 rounded-full border border-slate-300/30 bg-gradient-to-b from-slate-700/55 to-slate-900/50" />
                    <div className="absolute left-1/2 top-[3.35rem] h-[92px] w-[92px] -translate-x-1/2 rounded-[46%_46%_38%_38%/32%_32%_56%_56%] border border-slate-200/16 bg-gradient-to-b from-slate-700/45 via-slate-900/35 to-transparent" />
                    <div className="absolute left-1/2 top-[7.9rem] h-9 w-[168px] -translate-x-1/2 rounded-full border border-slate-300/12 bg-slate-900/24 blur-[0.2px]" />
                    <div className="absolute left-1/2 top-[9.05rem] h-[86px] w-[148px] -translate-x-1/2 rounded-[52%_52%_42%_42%/35%_35%_62%_62%] border border-slate-300/12 bg-gradient-to-b from-slate-800/30 to-transparent" />
                    <div className="absolute left-1/2 top-[12.3rem] h-[80px] w-[220px] -translate-x-1/2 rounded-[56%_56%_46%_46%/60%_60%_40%_40%] border border-slate-300/12 bg-gradient-to-b from-slate-700/25 via-slate-900/20 to-transparent" />
                    <div className="absolute left-1/2 top-[13.4rem] h-[52px] w-[130px] -translate-x-1/2 rounded-[42%_42%_48%_48%/40%_40%_60%_60%] border border-slate-300/10 bg-slate-900/22" />
                    {obraEmotionOrbs.length ? (
                      obraEmotionOrbs.map((orb, index) => {
                        const mode = emotionModesById[orb.modeId];
                        const tint = mode?.tint?.dot || 'rgba(196,181,253,0.85)';
                        const glow = Math.round(8 + orb.size * 0.22);
                        return (
                          <motion.span
                            key={orb.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
                            style={{
                              left: `${orb.left}%`,
                              top: `${orb.top}%`,
                              width: `${orb.size}px`,
                              height: `${orb.size}px`,
                              opacity: orb.opacity,
                              background: `radial-gradient(circle at 32% 28%, ${tint}, rgba(7,10,18,0.02) 68%)`,
                              boxShadow: `0 0 ${glow}px ${tint}`,
                              filter: 'saturate(1.15)',
                            }}
                            animate={{ opacity: [orb.opacity * 0.75, orb.opacity, orb.opacity * 0.8] }}
                            transition={{
                              duration: 4.8 + (index % 6) * 0.35,
                              repeat: Infinity,
                              repeatType: 'mirror',
                              ease: 'easeInOut',
                            }}
                          />
                        );
                      })
                    ) : (
                      <span
                        className="absolute left-1/2 top-[46%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          background:
                            'radial-gradient(circle at 34% 26%, rgba(148,163,184,0.52), rgba(15,23,42,0.04) 68%)',
                          boxShadow: '0 0 20px rgba(148,163,184,0.22)',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emotionLegendEntries.length ? (
                      emotionLegendEntries.map((mode) => (
                        <span
                          key={`emotion-chip-${mode.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: mode?.tint?.dot || 'rgba(196,181,253,0.9)',
                              boxShadow: `0 0 8px ${mode?.tint?.dot || 'rgba(196,181,253,0.7)'}`,
                            }}
                          />
                          {mode.title} x{mode.count}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400/80">
                        <span className="h-2 w-2 rounded-full bg-slate-400/70 shadow-[0_0_8px_rgba(148,163,184,0.45)]" />
                        Aún sin dudas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/12 via-violet-500/10 to-fuchsia-500/12 p-5 shadow-[0_18px_45px_rgba(56,189,248,0.14)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-55"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 18% 12%, rgba(103,232,249,0.3), transparent 46%), radial-gradient(circle at 82% 88%, rgba(196,181,253,0.2), transparent 52%)',
                  }}
                />
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.34em] text-cyan-200/95">
                        Beta · Afinación colectiva
                      </p>
                      <p className="text-sm font-semibold text-slate-100">
                        Mockup del registro emocional de Silvestre
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/50 bg-cyan-400/15 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-100">
                      Datos simulados
                    </span>
                  </div>

                  <p className="text-xs text-slate-200/88 leading-relaxed">
                    Aún no hay suficientes usuarios para crear una inteligencia artificial de #GatoEncerrado con estabilidad.
                    Este beta muestra cómo podría leerse el pulso colectivo cuando la conversación escale.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="relative mx-auto h-48 w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                      >
                        {collectiveEmotionNodes.map((mode, index) => {
                          const point = collectiveNodeLayout[index % collectiveNodeLayout.length];
                          return (
                            <line
                              key={`collective-link-${mode.id}`}
                              x1="50"
                              y1="52"
                              x2={point.x}
                              y2={point.y}
                              stroke={mode?.tint?.dot || 'rgba(196,181,253,0.55)'}
                              strokeOpacity="0.55"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          );
                        })}
                      </svg>

                      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full border border-cyan-200/55 bg-gradient-to-br from-cyan-200/30 via-violet-200/20 to-fuchsia-200/20 text-center shadow-[0_0_28px_rgba(56,189,248,0.38)]">
                        <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                          Silvestre
                          colectivo
                        </span>
                      </div>

                      {collectiveEmotionNodes.map((mode, index) => {
                        const point = collectiveNodeLayout[index % collectiveNodeLayout.length];
                        const size = 36 + Math.min(mode.collective, 44) * 0.35;
                        return (
                          <div
                            key={`collective-node-${mode.id}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-black/55 text-center shadow-[0_0_22px_rgba(148,163,184,0.2)]"
                            style={{
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                              width: `${size}px`,
                              height: `${size}px`,
                              borderColor: mode?.tint?.dot || 'rgba(196,181,253,0.65)',
                              boxShadow: `0 0 18px ${mode?.tint?.dot || 'rgba(196,181,253,0.28)'}`,
                            }}
                          >
                            <div className="flex h-full w-full flex-col items-center justify-center px-1">
                              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-100">
                                {mode.title}
                              </span>
                              <span className="text-[10px] font-semibold text-cyan-100">{mode.collective}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/90">
                        Métrica ficticia
                      </p>
                      <span className="text-[11px] text-slate-300/80">
                        {collectiveSyntheticSessions} sesiones simuladas
                      </span>
                    </div>
                    <p className="text-xs text-slate-200/90 leading-relaxed">
                      Frase más usada vs uso de frases originales en el chat colectivo.
                    </p>
                    <p className="text-xs italic text-slate-200/90">“{collectivePhraseMetric.phrase}”</p>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300/90">
                          <span>Frase más usada</span>
                          <span>{collectivePhraseMetric.reused}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300/85 to-fuchsia-300/85 shadow-[0_0_14px_rgba(56,189,248,0.35)]"
                            style={{ width: `${collectivePhraseMetric.reused}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-300/90">
                          <span>Frases originales</span>
                          <span>{collectivePhraseMetric.original}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-300/85 to-cyan-300/80 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
                            style={{ width: `${collectivePhraseMetric.original}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {collectiveTopEmotion ? (
                      <p className="text-[11px] text-slate-300/80">
                        Pulso dominante del mockup:{' '}
                        <span style={{ color: collectiveTopEmotion?.tint?.dot || 'rgba(196,181,253,0.9)' }}>
                          {collectiveTopEmotion.title}
                        </span>
                        . Así se vería el afinado de la voz colectiva de Silvestre.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      );
    }
    if (activeDefinition.type === 'graphic-lab') {
      const swipeShowcases = activeDefinition.swipeShowcases ?? [];
      const swipeMeta = activeDefinition.swipe ?? {};

      return (
        <div className="space-y-8">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
   

      

            {swipeShowcases.length ? (
              <div className="space-y-4">
                {swipeShowcases.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-fuchsia-900/40 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.65)]"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1fr_1.3fr]">
                      {entry.previewImage ? (
                        <div className="relative h-full min-h-[240px]">
                          <img
                            src={entry.previewImage}
                            alt={entry.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                            <Scan size={14} className="text-fuchsia-200" />
                            Swipe PDF
                          </div>
                          <div className="absolute left-4 bottom-4 text-sm text-white/90">
                            Lector visual · scroll vertical
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-col space-y-4 p-6">
                        <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
                          Obra destacada
                        </p>
                        <h4 className="font-display text-2xl text-slate-100">{entry.title}</h4>
                        {entry.description ? (
                          <p className="text-sm text-slate-200/90 leading-relaxed">{entry.description}</p>
                        ) : null}
                        {entry.swipeNotes?.length ? (
                          <ul className="space-y-2 text-sm text-slate-100 leading-relaxed">
                            {entry.swipeNotes.map((point, index) => (
                              <li key={`${entry.id}-note-${index}`} className="flex items-start gap-2">
                                <span className="text-fuchsia-200 mt-1">●</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          {entry.previewImage ? (
                            <Button
                              className="sm:flex-none justify-center bg-gradient-to-r from-fuchsia-600/80 to-purple-500/80 hover:from-fuchsia-500 hover:to-purple-400 text-white"
                              onClick={() =>
                                handleOpenImagePreview({
                                  src: entry.previewImage,
                                  title: entry.title,
                                  description: entry.description,
                                }, { requiresAuth: false })
                              }
                            >
                              Ver portada
                            </Button>
                          ) : null}
                          {entry.previewPdfUrl ? (
                            <div className="relative inline-flex overflow-visible">
                              {showGraphicCoins ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: -6 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute -top-7 right-0 rounded-full border border-amber-200/60 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                                >
                                  -{GAT_COSTS.graficoSwipe} gat
                                </motion.div>
                              ) : null}
                              <Button
                                variant="outline"
                                disabled={isGraphicUnlocking}
                                onClick={() => handleOpenGraphicSwipe(entry)}
                                className="w-full sm:w-auto justify-center border-fuchsia-300/40 text-fuchsia-200 hover:bg-fuchsia-500/10 relative overflow-visible"
                              >
                                <span className="relative z-10">
                                  {graphicSpent ? 'Abrir swipe en PDF' : isGraphicUnlocking ? 'Aplicando...' : 'Abrir swipe en PDF'}
                                </span>
                                {showGraphicCoins ? (
                                  <span className="pointer-events-none absolute inset-0">
                                    {Array.from({ length: 6 }).map((_, index) => {
                                      const endX = 140 + index * 14;
                                      const endY = -140 - index * 12;
                                      return (
                                        <motion.span
                                          key={`graphic-coin-${index}`}
                                          className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                          initial={{ opacity: 0.9, scale: 0.7, x: 0, y: 0 }}
                                          animate={{
                                            opacity: 0,
                                            scale: 1.05,
                                            x: endX,
                                            y: endY,
                                            rotate: 120 + index * 18,
                                          }}
                                          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
                                        />
                                      );
                                    })}
                                  </span>
                                ) : null}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-100/80">
                          Prototipo del Capítulo 1
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            
            {renderCommunityBlock('miniversoGrafico', {
              reactionProps: {
                showcaseId: 'miniversoGrafico',
                title: 'Validación gráfica',
                description: 'Haz clic para dejar un like y seguir curando esta colección.',
                buttonLabel: 'Resonar con el trazo',
                className: 'mt-0 bg-gradient-to-r from-fuchsia-900/20 to-black/40',
              },
            })}
          </div>
        </div>
        </div>
      );
    }

    if (activeDefinition.type === 'movement-ritual') {
      const hasDiosasGallery =
        Array.isArray(activeDefinition.diosasGallery) && activeDefinition.diosasGallery.length > 0;
      const hasMovementMicrointeractions =
        Array.isArray(activeDefinition.microinteractions) && activeDefinition.microinteractions.length > 0;

      return (
        <div className="space-y-8">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-purple-900/30 p-6 lg:p-8">
            <h3 className="font-display text-3xl text-slate-100">{activeDefinition.tagline}</h3>
            <p className="text-sm leading-relaxed text-slate-100/80 md:text-base">
              Cuando la obra visita una ciudad, Movimiento activa una semana de exploración corporal abierta a la
              comunidad. Cada jornada trabaja una fuerza corporal específica, desde arraigo hasta fragmentación, a
              través de entrenamiento somático y creación coreográfica.
              <br />
              <br />
              Estas coreografías se registran mediante captura de movimiento (o mocap) y se traducen en presencias digitales que
              habitan ese territorio. Al finalizar el proceso, la acción escénica no desaparece: queda sembrada en el
              espacio público como una presencia en realidad aumentada.
                  </p>
            {hasDiosasGallery ? (
              <DiosasCarousel
                items={activeDefinition.diosasGallery}
                label="Swipe-horizontal"
                caption="Cada clip muestra un giro 360° de las presencias cuenta-cuentos."
              />
            ) : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr] xl:items-start">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Activaciones de ruta</p>
                <div className="space-y-3">
                  {activeDefinition.actions?.map((action) => {
                    const ActionIcon = action.icon || ArrowRight;
                    return (
                      <div
                        key={action.id}
                        className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3 hover:border-purple-400/40 transition"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full border border-white/10 bg-white/5 p-3">
                              <ActionIcon size={20} className="text-purple-200" />
                            </div>
                            <div>
                              {action.badge ? (
                                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{action.badge}</p>
                              ) : null}
                              <p className="font-semibold text-slate-100">{action.label}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10 sm:w-auto"
                            onClick={() => handleMovementAction(action)}
                          >
                            {action.buttonLabel ? `${action.buttonLabel} (próximamente)` : 'Próximamente'}
                          </Button>
                        </div>
                        {action.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{action.description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasMovementMicrointeractions ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeDefinition.microinteractions.map((micro, index) => (
                    <div
                      key={`movement-micro-${index}`}
                      className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3 text-sm leading-relaxed"
                    >
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">{micro.title}</p>
                      {micro.description ? <p className="text-slate-300/85">{micro.description}</p> : null}
                      {micro.items?.length ? (
                        <ul className="space-y-2 text-slate-200/85">
                          {micro.items.map((item, bulletIndex) => (
                            <li key={`movement-micro-item-${index}-${bulletIndex}`} className="flex items-start gap-2">
                              <span className="text-purple-300 mt-1">●</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

            </div>

            <div className="space-y-5">
              {renderCommunityBlock('miniversoMovimiento', {
                emptyMessage: 'Todavía no hay voces en este miniverso.',
                className: 'rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5',
                commentsViewportClassName: 'max-h-[240px]',
                hideReaction: true,
              })}

              <ShowcaseReactionInline
                showcaseId="miniversoMovimiento"
                title="Resonancia colectiva"
                description="Haz clic y deja un pulso para que la Ruta de la Corporeidad siga viva."
                buttonLabel="Hacer vibrar la ruta"
                className="mt-0 rounded-3xl border-white/10 bg-black/30"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'apps') {
      const embeddedAppUrl = sanitizeExternalHttpUrl(activeDefinition.liveExperience?.url);

      return (
        <div className="space-y-8">
          {embeddedAppUrl ? (
            <div className="rounded-3xl border border-emerald-200/20 bg-black/30 p-4 sm:p-5 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/75">Experiencia incrustada</p>
                  <h4 className="font-display text-xl text-slate-100">
                    {activeDefinition.liveExperience?.title || 'App en vivo'}
                  </h4>
                  {activeDefinition.liveExperience?.description ? (
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-300/85">
                      {activeDefinition.liveExperience.description}
                    </p>
                  ) : null}
                </div>
                <a
                  href={embeddedAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  {activeDefinition.liveExperience?.ctaLabel || 'Abrir aparte'}
                </a>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-emerald-200/20 bg-slate-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <iframe
                  src={embeddedAppUrl}
                  title={activeDefinition.liveExperience?.title || 'App de Juegos'}
                  className="block h-[68vh] min-h-[520px] w-full bg-white"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; fullscreen; gamepad; gyroscope; microphone; web-share"
                />
              </div>
            </div>
          ) : null}

          {renderCommunityBlock('apps', {
            reactionProps: {
              showcaseId: 'apps',
              title: 'Resonancia lúdica',
              description: 'Deja un pulso para que el gato anfitrión abra más telones.',
              buttonLabel: 'Hacer vibrar este miniverso',
              className: 'mt-0',
            },
          })}
        </div>
      );
    }

    if (activeDefinition.type === 'cinema') {
      const copycatsAssets = (() => {
        const seen = new Set();
        return (activeDefinition.copycats?.assets ?? []).filter((asset) => {
          const key = asset?.id || asset?.url;
          if (!key) {
            return true;
          }
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();

      const quironStills = (() => {
        const seen = new Set();
        return (activeDefinition.quiron?.stills ?? []).filter((still, index) => {
          const key = typeof still === 'string' ? still : still?.id || still?.url || `idx-${index}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();
      const toneTags = activeDefinition.tone ?? [];
      const isQuironUnlocked = Boolean(showcaseBoosts?.copycats_full_unlock || quironSpent);
      const copycatsPrimaryAsset = copycatsAssets[0] ?? null;
      const copycatsSecondaryAssets = copycatsAssets.slice(1);
      const quironPrimaryAsset = activeDefinition.quiron?.teaser ?? null;
      const quironTags = activeDefinition.quiron?.tags ?? activeDefinition.copycats?.tags ?? [];

      const handleBackgroundVideoActivate = async (event, videoId) => {
        const target = event.currentTarget;
        if (!(target instanceof HTMLVideoElement)) return;

        if (isMobileViewport) {
          await requestMobileVideoPresentation(event, videoId);
          return;
        }

        target.controls = true;
        target.muted = false;
        target.loop = false;

        try {
          await target.play();
        } catch (error) {
          // Si el navegador bloquea la reproducción con sonido, dejamos visibles los controles.
        }
      };

      const renderMedia = (asset) => {
        if (!asset?.url) return null;
        const isVideoFile = /\.mp4($|\?)/i.test(asset.url);
        const videoId = asset?.id || asset?.url;
        return (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
            <div className="aspect-video w-full bg-black/60">
              {isVideoFile ? (
                <div className="relative h-full w-full">
                  {isMobileViewport ? (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                  ) : null}
                  {renderMobileVideoBadge()}
                  <video
                    src={asset.url}
                    title={asset.label}
                    className="w-full h-full object-cover"
                    controls={canUseInlinePlayback(videoId)}
                    onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : (
                <iframe
                  src={asset.url}
                  title={asset.label}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              )}
            </div>
            {asset.label ? (
              <div className="px-4 py-3 text-sm text-slate-300 flex items-center justify-between gap-3">
                <span>{asset.label}</span>
              </div>
            ) : null}
          </div>
        );
      };

      const renderImmersiveCinemaBlock = ({
        eyebrow,
        title,
        description,
        microcopy,
        tags = [],
        asset = null,
        reserveClassName = 'h-[11rem] sm:h-[14rem]',
        extraContent = null,
      }) => {
        if (!asset?.url) return null;
        const isVideoFile = /\.mp4($|\?)/i.test(asset.url);
        const videoId = asset?.id || asset?.url || title;

        return (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30">
            <div className="absolute inset-0">
              {isVideoFile ? (
                <div className="relative h-full w-full bg-black/60">
                  <video
                    src={asset.url}
                    title={asset.label || title}
                    className="h-full w-full cursor-pointer object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={asset.poster}
                    controls={isMobileViewport ? canUseInlinePlayback(videoId) : false}
                    onClick={(event) => {
                      void handleBackgroundVideoActivate(event, videoId);
                    }}
                  />
                </div>
              ) : (
                <iframe
                  src={asset.url}
                  title={asset.label || title}
                  className="h-full w-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.14)_35%,rgba(0,0,0,0.72)_100%)]" />
              {isVideoFile ? (
                <div className="pointer-events-none absolute right-5 top-5 z-10">
                  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                    <Video size={14} />
                    {isMobileViewport ? 'Toca para abrir' : 'Haz clic para activar'}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative z-10 flex min-h-[30rem] flex-col p-6">
              <div aria-hidden="true" className={reserveClassName} />

              <div className="mt-auto space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/75">{eyebrow}</p>
                  <h4 className="font-display text-xl text-slate-100">{title}</h4>
                </div>
                {description ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-300/85">{description}</p>
                ) : null}
                {microcopy ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-100/92">{microcopy}</p>
                ) : null}
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={`${title}-tag-${index}`}
                        className="rounded-full border border-purple-400/30 bg-purple-900/20 px-3 py-1 text-xs text-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {asset.label ? (
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-300/75">{asset.label}</p>
                ) : null}
              </div>

              {extraContent ? <div className="mt-5">{extraContent}</div> : null}
            </div>
          </div>
        );
      };

      const copycatsBlock = (
        renderImmersiveCinemaBlock({
          eyebrow: 'Documental',
          title: activeDefinition.copycats?.title,
          description: activeDefinition.copycats?.description,
          microcopy: activeDefinition.copycats?.microcopy,
          tags: activeDefinition.copycats?.tags ?? [],
          asset: copycatsPrimaryAsset,
          extraContent: copycatsSecondaryAssets.length ? (
            <div className="space-y-4">
              {copycatsSecondaryAssets.map((asset) => (
                <div key={asset.id || asset.url}>{renderMedia(asset)}</div>
              ))}
            </div>
          ) : null,
        })
      );

      const quironBlock = (
        renderImmersiveCinemaBlock({
          eyebrow: 'Cortometraje',
          title: activeDefinition.quiron?.title,
          description: activeDefinition.quiron?.description,
          microcopy: activeDefinition.quiron?.microcopy,
          tags: quironTags,
          asset: quironPrimaryAsset,
          extraContent: quironStills.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {quironStills.map((still, index) => {
                const label = typeof still === 'string' ? still : still.label || `Still ${index + 1}`;
                const url = typeof still === 'string' ? null : still.url;
                return url ? (
                  <div
                    key={still.id || `quiron-still-${index}`}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm"
                  >
                    <div className="aspect-[4/3] bg-black/40">
                      <img
                        src={url}
                        alt={label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-200">{label}</p>
                  </div>
                ) : (
                  <span
                    key={`quiron-still-pill-${index}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ) : null,
        })
      );

      const proyeccionBlock = (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-purple-900/40 p-6 space-y-4">
          <span className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
            <CheckCheckIcon size={14} />
            {isQuironUnlocked ? 'Liberado' : `${SHOWCASE_REQUIRED_GAT.copycats} GAT requeridos`}
          </span>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Proyección privada</p>
          <h4 className="font-display text-2xl text-slate-100">{activeDefinition.proyeccion?.title}</h4>
          <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.proyeccion?.description}</p>
          {showProjectionEmailInput ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-slate-300">Ingresa tu correo para recibir confirmación de tu lugar:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={projectionEmailDraft}
                  onChange={(e) => setProjectionEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProjectionEmailSubmit();
                    if (e.key === 'Escape') setShowProjectionEmailInput(false);
                  }}
                  className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  autoFocus
                />
                <Button
                  onClick={handleProjectionEmailSubmit}
                  disabled={isProjectionInterestSubmitting || !projectionEmailDraft.trim()}
                  className="shrink-0 bg-gradient-to-r from-amber-500/90 to-orange-500/90 hover:from-amber-400 hover:to-orange-400 text-white"
                >
                  {isProjectionInterestSubmitting ? 'Enviando…' : 'Registrarme'}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectionEmailInput(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleProjectionInterest}
              disabled={isProjectionInterestSubmitting || isProjectionInterestSent}
              className={`w-full justify-center text-white sm:w-auto ${
                isProjectionInterestSent
                  ? 'bg-emerald-500/80 hover:bg-emerald-500/80'
                  : 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 hover:from-amber-400 hover:to-orange-400'
              }`}
            >
              {isProjectionInterestSubmitting
                ? 'Registrando...'
                : isProjectionInterestSent
                  ? 'Espera noticias'
                  : activeDefinition.proyeccion?.cta}
            </Button>
            {isQuironUnlocked ? (
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-500/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:w-auto">
                <CheckCheckIcon size={14} />
                Cortometraje desbloqueado
              </span>
            ) : (
              <div className="relative flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  onClick={handleToggleQuironPrompt}
                  disabled={isQuironUnlocking}
                  className="relative w-full justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-hidden"
                >
                  {isQuironUnlocking ? 'Procesando…' : 'Ver cortometraje ahora'}
                </Button>
                {showQuironCoins ? (
                  <div className="pointer-events-none absolute inset-0 overflow-visible">
                    {Array.from({ length: 6 }).map((_, index) => {
                      const startLeft = 0.35 + index * 0.04;
                      const startTop = 0.7;
                      const x = 220 + index * 8;
                      const y = -240 - index * 18;
                      return (
                        <motion.span
                          key={`quiron-coin-flight-${index}`}
                          className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                          style={{ left: `${startLeft * 100}%`, top: `${startTop * 100}%` }}
                          initial={{ opacity: 0.95, scale: 0.8, rotate: 0, x: 0, y: 0 }}
                          animate={{ opacity: 0, scale: 1, rotate: 140 + index * 18, x, y }}
                          transition={{ duration: 1.15, ease: 'easeOut' }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          )}
          {isProjectionInterestSent ? (
            <p className="text-xs text-emerald-200/90">Recibirás un correo para confirmar tu lugar al acercarse la fecha.</p>
          ) : null}

          {showQuironCommunityPrompt ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl border border-amber-200/40 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              El acceso inicial habilita una visualización.
              Con huella solidaria, puedes volver cuando quieras.
            </motion.div>
          ) : null}
      
          {activeDefinition.proyeccion?.footnote ? (
            <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.proyeccion.footnote}</p>
          ) : null}
        </div>
      );

      const comentariosBlock = renderCommunityBlock('copycats', {
        className: 'rounded-3xl border border-white/10 bg-black/25 p-6 space-y-5',
        reactionProps: {
          showcaseId: 'copycats',
          title: 'Mi favorito',
          description: 'Deja tu aplauso y amplifica la audiencia.',
          buttonLabel: 'Sumar mi aplauso',
          className: 'mt-2 bg-gradient-to-r from-slate-900/40 to-purple-900/20',
        },
      });

      return (
        <div className="space-y-8">
          {isMobileViewport ? (
            <div className="space-y-6">
              {copycatsBlock}
              {quironBlock}
              {proyeccionBlock}
              {comentariosBlock}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                {copycatsBlock}
                {proyeccionBlock}
              </div>
              <div className="space-y-6">
                {quironBlock}
                {comentariosBlock}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeDefinition.type === 'blog-series') {
      const entries = activeDefinition.entries ?? [];
      const renderEntryAction = (entry) => {
        switch (entry.type) {
          case 'internal-reading':
            if (entry.previewMode === 'pdf' && entry.previewPdfUrl) {
              return (
                <>
                  <Button
                    onClick={() => setShowAutoficcionPreview(true)}
                    className="w-full sm:w-auto justify-center"
                  >
                    Leer fragmento
                  </Button>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-100">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1 text-amber-50">
                      <Coins size={14} className="text-amber-50" />
                      150 gatokens
                    </span>
                    <span className="text-slate-400">Lectura y desbloqueo del PDF interactivo</span>
                  </div>
                </>
              );
            }
            if (entry.previewMode === 'image' && entry.previewImage) {
              return (
                <Button
                  onClick={() =>
                    handleOpenImagePreview({
                      src: entry.previewImage,
                      title: entry.title,
                      description: entry.description,
                    })
                  }
                  className="w-full sm:w-auto justify-center"
                >
                  Ver fragmento
                </Button>
              );
            }
            return entry.contentSlug ? (
              <>
                <Button onClick={() => handleOpenBlogEntry(entry.contentSlug)} className="w-full sm:w-auto justify-center">
                  Leer fragmento
                </Button>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-amber-100">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1 text-amber-50">
                    <Coins size={14} className="text-amber-50" />
                    150 gatokens
                  </span>
                  <span className="text-slate-400">Lectura y desbloqueo del fragmento</span>
                </div>
              </>
            ) : null;
          case 'purchase-link':
            if (entry.app) {
              return (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleOpenNovelaReserve}
                    disabled={isMerchCheckoutLoading}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
                  >
                    {isMerchCheckoutLoading ? 'Abriendo checkout...' : 'Comprar edición física'}
                  </button>
                  <Button
                    onClick={() => handleNovelAppCTA(entry.app)}
                    className="w-full sm:w-auto justify-center bg-purple-600/80 hover:bg-purple-600 text-white rounded-full"
                  >
                    {entry.app.ctaLabel || 'Leer fragmentos'}
                  </Button>
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={handleOpenNovelaReserve}
                disabled={isMerchCheckoutLoading}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
              >
                {isMerchCheckoutLoading ? 'Abriendo checkout...' : 'Comprar edición'}
              </button>
            );
          case 'qr-scan':
            return (
              <Button
                variant="outline"
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10 w-full sm:w-auto justify-center"
                onClick={() =>
                  toast({
                    title: 'Escanea el QR',
                    description: 'Abre la cámara de tu dispositivo y apunta al código para activar la experiencia.',
                  })
                }
              >
                Escanear QR
              </Button>
            );
          default:
            return null;
        }
      };

      return (
        <div className="space-y-10">
          <div>{renderPostDetails()}</div>
          {entries.length > 0 ? (
            activeShowcase === 'miniversoNovela' ? (
              <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
                <div className="space-y-6">
                  {entries.map((entry) => {
                    if (entry.id === 'comentarios-lectores') {
                      return null;
                    }
                    if (entry.type === 'horizontal-gallery') {
                      return (
                        <div
                          key={entry.id}
                          className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4"
                        >
                          <div className="space-y-2">
                            <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                            {entry.description ? (
                              <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                            ) : null}
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2">
                            {entry.images?.map((image, index) => (
                              <div
                                key={`${entry.id}-${index}`}
                                className="w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40"
                              >
                                <img
                                  src={image}
                                  alt={`${entry.title} ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const imageSrc = entry.previewImage || entry.image;
                    const action = renderEntryAction(entry);

                    return (
                      <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={entry.title}
                            className="w-full h-52 sm:h-64 object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <div className={`space-y-4 ${imageSrc ? 'px-6 pt-5 pb-6' : 'p-6'}`}>
                          <div className="space-y-2">
                            {entry.eyebrow ? (
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{entry.eyebrow}</p>
                            ) : null}
                            <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                            {entry.descriptionNode ?? (entry.description ? (
                              <p className="text-sm text-slate-300/80 leading-relaxed whitespace-pre-line">{entry.description}</p>
                            ) : null)}
                          </div>
                          {entry.snippet ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
                              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{entry.snippet.tagline}</p>
                              <div className="flex items-start gap-4">
                                <div className="shrink-0 flex h-16 w-16 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-900/20">
                                  <QrCode size={32} className="text-purple-300/50" />
                                </div>
                                {entry.snippet.text ? (
                                  <p className="text-sm text-slate-200/90 leading-relaxed">{entry.snippet.text}</p>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                          {action}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-6">
                  {renderCommunityBlock('miniversoNovela', {
                    emptyMessage: 'Todavía no hay voces en este miniverso.',
                    className: 'rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5',
                    ctaLabel: 'Registra tu experiencia',
                    subCopy: 'Estamos investigando cómo distintas personas atraviesan emociones que se reflejan en esta plataforma.',
                  })}
                  <ShowcaseReactionInline
                    showcaseId="miniversoNovela"
                    title="Resonancia colectiva"
                    description="Haz clic este miniverso para hacerlo resonar."
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
                {entries.map((entry) => {
                  if (entry.id === 'comentarios-lectores') {
                    return null;
                  }
                  if (entry.type === 'horizontal-gallery') {
                    return (
                      <div
                        key={entry.id}
                        className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4"
                      >
                        <div className="space-y-2">
                          <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                          {entry.description ? (
                            <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {entry.images?.map((image, index) => (
                            <div
                              key={`${entry.id}-${index}`}
                              className="w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40"
                            >
                              <img
                                src={image}
                                alt={`${entry.title} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const imageSrc = entry.previewImage || entry.image;
                  const action = renderEntryAction(entry);

                  return (
                    <div key={entry.id} className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4">
                      {imageSrc ? (
                        <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 h-52 sm:h-64">
                          <img src={imageSrc} alt={entry.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                        {entry.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                        ) : null}
                      </div>
                      {entry.snippet ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{entry.snippet.tagline}</p>
                          {entry.snippet.text ? (
                            <p className="text-sm text-slate-200/90 leading-relaxed">{entry.snippet.text}</p>
                          ) : null}
                        </div>
                      ) : null}
                      {action}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">Muy pronto liberaremos el resto de la serie.</p>
          )}
        </div>
      );
    }

    const videos = activeDefinition.videos ?? [];

    return (
      <div className="space-y-10">
        <div>
          {renderPostDetails(
            'Pronto liberaremos la carta completa de este miniverso. Mientras tanto puedes explorar la galería audiovisual.'
          )}
        </div>

        {videos.length > 0 ? (
          <div>
            <h5 className="font-display text-xl text-slate-100 mb-4">Galería audiovisual</h5>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((video, index) => {
                const videoId = video.id || video.url || `video-${index}`;
                return (
                  <div
                    key={video.id || video.url || `video-${index}`}
                    className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex flex-col"
                  >
                    <div className="relative aspect-video w-full">
                      {/\.mp4($|\?)/i.test(video.url) ? (
                        <>
                          {isMobileViewport ? (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                          ) : null}
                          {renderMobileVideoBadge()}
                          <video
                            src={video.url}
                            title={video.title}
                            className="w-full h-full object-cover bg-black"
                            controls={canUseInlinePlayback(videoId)}
                            onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                            playsInline
                            preload="metadata"
                            poster={video.poster}
                          />
                        </>
                      ) : (
                        <iframe
                          src={video.url}
                          title={video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                        ></iframe>
                      )}
                    </div>
                    <div className="p-4 space-y-1 text-sm text-slate-300">
                      <p className="font-semibold text-slate-100">{video.title}</p>
                      {video.author ? <p>{video.author}</p> : null}
                      {video.duration ? <p className="text-slate-500">Duración: {video.duration}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {activeShowcase === 'copycats' ? (
          <ShowcaseReactionInline
            showcaseId="copycats"
            description="Guarda un like que celebra las miradas que quedarán en escena."
            title="Opiniones después del corte"
          />
        ) : null}
      </div>
    );
  };

  const renderExplorerBadge = () => {
    if (!explorerBadge.unlocked) {
      return null;
    }
    const badgeStatus = !isAuthenticated ? 'guest' : isSubscriber ? 'subscriber' : 'member';
    const alias =
      user?.user_metadata?.alias ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.display_name ||
      'Errante anónimo';
    const statusCopy = {
      guest:
        'Inicia sesión para guardar esta insignia, nombrarla y recibir futuras recompensas vinculadas a tu cuenta.',
      member:
        'Tu badge ya está en tu cuenta. Hazte suscriptor para transformar este logro en energía real y recibir recargas automáticas.',
      subscriber: `Recompensa activada. Sumamos ${EXPLORER_BADGE_REWARD} GATokens a tu saldo como agradecimiento.`,
    };
    const cta =
      badgeStatus === 'guest' ? (
        <Button onClick={handleBadgeLogin} className="bg-purple-600/80 hover:bg-purple-600 text-white">
          Iniciar sesión
        </Button>
      ) : badgeStatus === 'member' ? (
        <Button
          onClick={handleBadgeSubscribe}
          variant="outline"
          className="border-amber-300/60 text-amber-200 hover:bg-amber-200/10"
        >
          Dejar huella
        </Button>
      ) : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="mt-10 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-slate-900/70 to-purple-900/30 p-6 md:p-8 shadow-[0_20px_80px_rgba(115,73,255,0.15)]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="relative h-16 w-16 rounded-2xl border border-purple-400/40 bg-black/40 flex items-center justify-center">
              <Sparkles className="text-purple-200" size={28} />
              {showBadgeCoins ? (
                <span className="pointer-events-none absolute inset-0">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const endX = (index - 2.5) * 18;
                    const endY = -50 - index * 12;
                    return (
                      <motion.span
                        key={`badge-coin-${index}`}
                        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                        initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1.05, x: endX, y: endY, rotate: 100 + index * 24 }}
                        transition={{ duration: 1.05, ease: 'easeOut', delay: index * 0.03 }}
                      />
                    );
                  })}
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-purple-200/80">Insignia secreta</p>
              <h4 className="font-display text-2xl text-white">{EXPLORER_BADGE_NAME}</h4>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Leíste los nueve mini-versos autorales y abriste cada portal. {alias} ahora figura en el registro de
                errantes.
              </p>
              <p className="text-xs text-slate-300/70 uppercase tracking-[0.25em]">{statusCopy[badgeStatus]}</p>
              {badgeStatus === 'subscriber' && explorerBadge.rewardClaimed ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-emerald-200">
                  <Coins size={14} className="text-emerald-200" />
                  +{EXPLORER_BADGE_REWARD} GAT
                </div>
              ) : null}
            </div>
          </div>
          {cta ? <div className="flex-shrink-0">{cta}</div> : null}
        </div>
      </motion.div>
    );
  };

  const showcaseDipToBlackOverlay = typeof document !== 'undefined' && isShowcaseOpenTransitionActive
    ? createPortal(
      <motion.div
        key="showcase-dip-to-black"
        className="fixed inset-0 z-[145] bg-black pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{
          opacity: showcaseOpenTransition.phase === 'blackout' ? 1 : 0,
        }}
        transition={{
          duration:
            showcaseOpenTransition.phase === 'revealing'
              ? SHOWCASE_OPEN_TRANSITION.revealMs / 1000
              : SHOWCASE_OPEN_TRANSITION.blackoutMs / 1000,
          ease: 'easeInOut',
        }}
      />,
      document.body,
    )
    : null;

  const showcaseOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {activeDefinition ? (
          <motion.div
            key="showcase-overlay"
            className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/95 via-slate-950/90 to-black/95"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseShowcase}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-95 mix-blend-screen"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(7px 7px at 7% 10%, rgba(248,250,252,0.82), transparent 75%),' +
                  'radial-gradient(7px 7px at 13% 24%, rgba(241,245,249,0.68), transparent 78%),' +
                  'radial-gradient(17px 17px at 21% 42%, rgba(255,255,255,0.52), transparent 76%),' +
                  'radial-gradient(7px 7px at 30% 17%, rgba(226,232,240,0.66), transparent 77%),' +
                  'radial-gradient(7px 7px at 39% 60%, rgba(241,245,249,0.62), transparent 78%),' +
                  'radial-gradient(17px 17px at 47% 31%, rgba(255,255,255,0.5), transparent 99%),' +
                  'radial-gradient(7px 7px at 54% 14%, rgba(241,245,249,0.62), transparent 77%),' +
                  'radial-gradient(7px 7px at 62% 46%, rgba(226,232,240,0.66), transparent 78%),' +
                  'radial-gradient(7px 7px at 70% 20%, rgba(255,255,255,0.46), transparent 76%),' +
                  'radial-gradient(7px 7px at 79% 64%, rgba(241,245,249,0.62), transparent 77%),' +
                  'radial-gradient(13px 13px at 87% 36%, rgba(226,232,240,0.66), transparent 78%),' +
                  'radial-gradient(7px 7px at 93% 78%, rgba(255,255,255,0.45), transparent 76%),' +
                  'radial-gradient(7px 7px at 17% 76%, rgba(248,250,252,0.55), transparent 76%),' +
                  'radial-gradient(15px 15px at 44% 84%, rgba(241,245,249,0.5), transparent 77%),' +
                  'radial-gradient(9px 9px at 74% 86%, rgba(226,232,240,0.54), transparent 78%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-78 mix-blend-screen star-pulse"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(7px 7px at 9% 20%, rgba(255,255,255,0.82), transparent 78%),' +
                  'radial-gradient(7px 7px at 25% 67%, rgba(241,245,249,0.68), transparent 78%),' +
                  'radial-gradient(7px 7px at 57% 16%, rgba(226,232,240,0.72), transparent 78%),' +
                  'radial-gradient(7px 7px at 73% 70%, rgba(255,255,255,0.62), transparent 78%),' +
                  'radial-gradient(7px 7px at 90% 29%, rgba(241,245,249,0.68), transparent 78%),' +
                  'radial-gradient(7px 7px at 49% 82%, rgba(248,250,252,0.58), transparent 78%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-48"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.2) 36%, rgba(0,0,0,0.78) 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-28 mix-blend-screen"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(190,170,255,0.22) 0%, rgba(190,170,255,0.06) 34%, rgba(0,0,0,0) 58%)',
              }}
            />
            <motion.div
              ref={showcaseRef}
              className="relative z-10 my-10 w-[calc(100vw-2.5rem)] max-w-6xl max-h-[88vh] overflow-y-auto rounded-[28px] border border-white/15 bg-slate-950/55 backdrop-blur-2xl p-6 md:p-10 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex justify-end gap-3 mb-6">
                <button
                  onClick={handleShareMiniverse}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-200/90 hover:border-purple-300/40 hover:text-white transition"
                  aria-label="Compartir miniverso"
                >
                  <Send size={14} className="text-purple-200" />
                </button>
                <button
                  onClick={handleCloseShowcase}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200/90 hover:border-purple-300/40 hover:text-white transition"
                  aria-label="Cerrar vitrina"
                >
                  <X size={14} />
                </button>
              </div>
              <div className={`rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 ${SHOWCASE_CARD_GRADIENT[activeShowcase] ?? 'to-slate-800/20'} shadow-[0_25px_65px_rgba(15,23,42,0.65)] mb-6`}>
                <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <p className={`text-xs uppercase tracking-[0.4em] ${SHOWCASE_EYEBROW_COLOR[activeShowcase] ?? 'text-slate-400/70'}`}>#Miniversos</p>
                        <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{activeDefinition.label}</h3>
                      </div>
                      {latestBlogPostByShowcase[activeShowcase]?.slug ? (
                        <RelatedReadingTooltipButton
                          slug={latestBlogPostByShowcase[activeShowcase].slug}
                          authorLabel={latestBlogPostByShowcase[activeShowcase].author?.trim() || 'autor invitado'}
                          thumbnailUrl={
                            sanitizeExternalHttpUrl(latestBlogPostByShowcase[activeShowcase].featured_image_url) ||
                            sanitizeExternalHttpUrl(latestBlogPostByShowcase[activeShowcase].cover_image) ||
                            sanitizeExternalHttpUrl(latestBlogPostByShowcase[activeShowcase].image_url) ||
                            sanitizeExternalHttpUrl(latestBlogPostByShowcase[activeShowcase].author_avatar_url) ||
                            null
                          }
                          ariaLabel="Mostrar lectura disponible en Textos"
                          tone="cyan"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                      {activeDefinition.introNode ?? <p>{activeDefinition.intro}</p>}
                      {activeDefinition.narrative?.map((paragraph, index) => (
                        <p key={`narrative-paragraph-${index}`} className="text-sm text-slate-300/90 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="hidden lg:block">
                      {activeDefinition.type === 'movement-ritual' ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-3">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(148,163,184,0.22)]">
                                <User size={16} />
                              </span>
                              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300/85">Colaboradores</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsMovementCreditsOpen((prev) => !prev)}
                              className="text-xs uppercase tracking-[0.3em] text-slate-300 hover:text-white transition"
                            >
                              {isMovementCreditsOpen ? 'Ocultar' : 'Abrir'}
                            </button>
                          </div>
                          {isMovementCreditsOpen ? (
                            <div className="space-y-4">
                              <p className="text-sm font-semibold text-slate-100">Colaboradores que buscamos</p>
                              <ul className="space-y-2 text-sm text-slate-300/90">
                                {MOVEMENT_COLLABORATOR_CALL_ITEMS.map((item) => (
                                  <li key={`movement-collab-hdr-${item}`} className="flex items-start gap-2">
                                    <span className="mt-1 text-purple-300">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  onClick={() => handleOpenContribution(getContributionCategoryForShowcase('miniversoMovimiento'))}
                                  className="w-full justify-center bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white hover:from-emerald-400/90 hover:to-emerald-500/90 sm:w-auto"
                                >
                                  Convocatoria abierta
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : renderCollaboratorsSection(activeDefinition.collaborators, activeShowcase ?? 'hdr')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="lg:hidden">
                      {renderCollaboratorsSection(activeDefinition.collaborators, activeShowcase ?? 'hdr')}
                    </div>
                    {rendernotaAutoral()}
                    {activeDefinition.iaProfile ? (
                      <div className="hidden lg:block">
                        <IAInsightCard {...activeDefinition.iaProfile} compact />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>{renderShowcaseContent()}</div>
              {activeDefinition.iaProfile ? (
                <div className="lg:hidden mt-4">
                  <IAInsightCard {...activeDefinition.iaProfile} compact />
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const oraculoOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isOraculoOpen ? (
          <motion.div
            key="oraculo-iframe"
            className="fixed inset-0 z-[170] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOraculo}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Oráculo interactivo"
              className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Oráculo en vivo</p>
                  <h3 className="font-display text-2xl text-slate-100">Demo completa</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {ORACULO_URL ? (
                    <a
                      href={ORACULO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseOraculo}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="h-[72vh] bg-black">
                {ORACULO_URL ? (
                  <iframe
                    title="Oráculo interactivo"
                    src={ORACULO_URL}
                    className="h-full w-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; magnetometer; microphone; camera"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    URL del Oráculo no configurada.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const causeSiteOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isCauseSiteOpen ? (
          <motion.div
            key="cause-site-iframe"
            className="fixed inset-0 z-[175] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCauseSite}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Isabel Ayuda para la Vida"
              className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Causa social</p>
                  <h3 className="font-display text-2xl text-slate-100">Isabel Ayuda para la Vida</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {CAUSE_SITE_URL ? (
                    <a
                      href={CAUSE_SITE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pesta��a
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseCauseSite}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[16/10] bg-black">
                {CAUSE_SITE_URL ? (
                  <iframe
                    src={CAUSE_SITE_URL}
                    title="Isabel Ayuda para la Vida"
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
                    No se pudo cargar el sitio.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const quironFullOverlay = typeof document !== 'undefined' && isQuironFullVisible && activeDefinition?.quiron?.fullVideo
    ? createPortal(
      <div className="fixed inset-0 z-[245] bg-black/85 backdrop-blur-sm overflow-auto overscroll-none">
        <div className="max-w-5xl mx-auto space-y-4 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200">
              Cortometraje completo desbloqueado
            </p>
            <Button
              variant="outline"
              className="border-white/30 text-slate-100 hover:bg-white/10"
              onClick={handleCloseQuironFull}
            >
              Cerrar
            </Button>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/40 overflow-hidden shadow-2xl">
            {isQuironPlaybackUnlocked ? (
              (() => {
                const url = quironSignedUrl || activeDefinition.quiron.fullVideo.url;
                if (!url) return null;
                const videoId = activeDefinition.quiron.fullVideo.id || url;
                const isVideoFile = /\.mp4($|\?)/i.test(url);
                if (isVideoFile) {
                  return (
                    <video
                      ref={quironVideoRef}
                      src={quironSignedUrl}
                      title={activeDefinition.quiron.fullVideo.label || 'Cortometraje completo'}
                      className="w-full h-full object-contain bg-black"
                      controls={canUseInlinePlayback(videoId)}
                      onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                      onContextMenu={(event) => event.preventDefault()}
                      onPlay={() => setHasQuironPlaybackStarted(true)}
                      onEnded={handleQuironPlaybackEnded}
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      disablePictureInPicture
                      disableRemotePlayback
                      playsInline
                      preload="metadata"
                    />
                  );
                }
                return (
                  <iframe
                    src={url}
                    title={activeDefinition.quiron.fullVideo.label || 'Cortometraje completo'}
                    className="w-full h-[70vh]"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                );
              })()
            ) : (
              <div className="flex min-h-[52vh] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300/70">Quirón · Cortometraje completo</p>
                <p className="max-w-2xl text-sm text-slate-300/90 leading-relaxed">
                  La vista previa está lista. Reproduce para continuar.
                </p>
                <Button
                  onClick={() => handleQuironPlayRequest(true)}
                  disabled={isQuironUnlocking}
                  className="bg-gradient-to-r from-purple-600/80 to-indigo-500/80 hover:from-purple-500 hover:to-indigo-400 text-white"
                >
                  {isQuironUnlocking ? 'Preparando...' : 'Play'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const quironAftercareOverlay = typeof document !== 'undefined' && isQuironAftercareVisible
    ? createPortal(
      <div className="fixed inset-0 z-[246] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={handleCloseQuironAftercare} />
        <div className="relative z-10 my-8 w-[calc(100vw-2rem)] max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Después de Quirón</p>
          <h4 className="mt-3 font-display text-3xl text-slate-100">
            ¿Quisieras compartir esta experiencia con alguien querido?
          </h4>
          <p className="mt-3 text-sm text-slate-300/85 leading-relaxed">
            A veces ver una historia así se siente mejor cuando se conversa.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Quiero compartirte este cortometraje de #GatoEncerrado:\n${buildMiniverseShareUrl('copycats')}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Enviar por mensaje
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent('Quiero compartirte este cortometraje')}&body=${encodeURIComponent(`Te comparto la vitrina de cine de #GatoEncerrado:\n${buildMiniverseShareUrl('copycats')}`)}`}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Enviar por correo
            </a>
          </div>
          <button
            type="button"
            onClick={handleCloseQuironAftercare}
            className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-slate-200"
          >
            Cerrar
          </button>
        </div>
      </div>,
      document.body,
    )
    : null;

  const quironPrecareOverlay = typeof document !== 'undefined' && isQuironPrecareVisible
    ? createPortal(
      <div className="fixed inset-0 z-[246] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={handleCloseQuironPrecare} />
        <div className="relative z-10 my-8 w-[calc(100vw-2rem)] max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Antes de continuar</p>
          <p className="mt-3 text-sm text-slate-300/85 leading-relaxed">
            Una vez desbloqueado, el cortometraje se habilita una vez; con una huella activada puedes volver cuando quieras. ¿Quieres continuar?
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={handleConfirmQuironPrecare}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-400"
            >
              Continuar
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseQuironPrecare}
              className="inline-flex items-center justify-center rounded-full border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const tokenPrecareOverlay = typeof document !== 'undefined' && tokenPrecareContext
    ? createPortal(
      <div className="fixed inset-0 z-[246] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={handleCloseTokenPrecare} />
        <div className="relative z-10 my-8 w-[calc(100vw-2rem)] max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">¿Quieres continuar?</p>
          <h4 className="mt-3 font-display text-3xl text-slate-100">
            {tokenPrecareContext.mode === 'guardrail'
              ? 'Estás por gastar la energía de tus últimos GAT.'
              : 'Tus GATokens disponibles se han agotado.'}
          </h4>
          <p className="mt-3 text-sm text-slate-300/85 leading-relaxed">
            {tokenPrecareContext.mode === 'guardrail' ? (
              <>
                {tokenPrecareContext.message || 'Puedes seguir explorando por ahora.'}{' '}
                Cuando gastes tu último GAT, tendrás la opción de activar tu huella por{' '}
                <span className="font-semibold text-emerald-200">$50 MXN al mes</span> para continuar.
              </>
            ) : (
              <>
                {tokenPrecareContext.actionLabel || 'Esta activación'} requiere{' '}
                <span className="font-semibold text-amber-200">
                  {Number.isFinite(tokenPrecareContext.required) ? tokenPrecareContext.required : 0} GAT
                </span>
                . Te faltan{' '}
                <span className="font-semibold text-rose-200">
                  {Number.isFinite(tokenPrecareContext.missing) ? tokenPrecareContext.missing : 0}
                </span>
                . Activa tu huella para ampliar tu energía y seguir explorando sin fricción.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {tokenPrecareContext.mode === 'guardrail' ? (
              <Button
                onClick={handleCloseTokenPrecare}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-400"
              >
                gastar mis GAT
              </Button>
            ) : (
              <Button
                onClick={handleTokenPrecareActivateHuella}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-400"
              >
                Activar huella por $50/mes
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCloseTokenPrecare}
              className="inline-flex items-center justify-center rounded-full border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Seguir explorando
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const movementActionOverlay = typeof document !== 'undefined' && movementPendingAction
    ? createPortal(
      <div className="fixed inset-0 z-[246] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={handleCloseMovementActionOverlay} />
        <div className="relative z-10 my-8 w-[calc(100vw-2rem)] max-w-2xl rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Ruta en construcción</p>
          <h4 className="mt-3 font-display text-3xl text-slate-100">
            Gracias por tu entusiasmo
          </h4>
          <p className="mt-3 text-sm text-slate-300/85 leading-relaxed">
            Este módulo está en fase de preparación. Si te interesa participar, tu registro nos ayuda
            a priorizar las siguientes activaciones del miniverso: mapa de ruta, talleres
            coreográficos, marcador AR y transmisión de función final.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                handleCloseMovementActionOverlay();
                handleOpenContribution(getContributionCategoryForShowcase('miniversoMovimiento'));
              }}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-600/80 to-cyan-500/70 px-6 py-3 text-sm font-semibold text-white hover:from-emerald-500 hover:to-cyan-400"
            >
              Sumarme a la convocatoria
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseMovementActionOverlay}
              className="inline-flex items-center justify-center rounded-full border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const gatBalanceToastOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {gatBalanceToast ? (
          <motion.div
            key={`gat-balance-toast-${gatBalanceToast.id}`}
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="pointer-events-none fixed right-4 top-4 sm:top-5 z-[400]"
          >
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-[0_8px_22px_rgba(0,0,0,0.4)] backdrop-blur-md ${
                gatBalanceToast.delta > 0
                  ? 'border-emerald-300/45 bg-emerald-500/12 text-emerald-100'
                  : 'border-amber-300/45 bg-amber-500/12 text-amber-100'
              }`}
            >
              <Coins size={12} />
              <span>{gatBalanceToast.delta > 0 ? `+${gatBalanceToast.delta}` : gatBalanceToast.delta} GAT</span>
              <span className="text-slate-200/80">· {gatBalanceToast.balance} GAT</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  const imagePreviewOverlay = typeof document !== 'undefined' && imagePreview
    ? createPortal(
      <div className="fixed inset-0 z-[240] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImagePreview} />
        <div className="relative z-10 my-10 w-[calc(100vw-2rem)] max-w-3xl">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleCloseImagePreview}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
            <div className="relative w-full aspect-[4/3] bg-black/60">
              <img
                src={imagePreview.src}
                alt={imagePreview.title || 'Vista previa'}
                className="absolute inset-0 w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            {(imagePreview.title || imagePreview.description) ? (
              <div className="p-6 space-y-2">
                {imagePreview.title ? (
                  <h4 className="font-display text-2xl text-slate-100">{imagePreview.title}</h4>
                ) : null}
                {imagePreview.description ? (
                  <p className="text-sm text-slate-300/80 leading-relaxed">{imagePreview.description}</p>
                ) : null}
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                  {imagePreview.label || 'Ilustración de la novela'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const pdfPreviewOverlay = typeof document !== 'undefined' && pdfPreview
    ? createPortal(
      <div className="fixed inset-0 z-[230] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClosePdfPreview} />
        <div className="relative z-10 my-10 w-[calc(100vw-2rem)] max-w-5xl space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Lectura en progreso</p>
              <h4 className="font-display text-2xl text-slate-100">{pdfPreview.title || 'Fragmento en PDF'}</h4>
              {pdfPreview.description ? (
                <p className="text-sm text-slate-300/80 leading-relaxed max-w-2xl">{pdfPreview.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClosePdfPreview}
              className="self-start rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
            >
              Cerrar ✕
            </button>
          </div>

          <div
            ref={pdfContainerRef}
            className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl p-4 max-h-[75vh] overflow-auto"
          >
            {pdfLoadError ? (
              <p className="text-sm text-red-300 text-center py-8">{pdfLoadError}</p>
            ) : (
              <Suspense fallback={<p className="text-sm text-slate-400 text-center py-8">Preparando visor PDF…</p>}>
                <PdfPreviewDocument
                  file={pdfPreview.src}
                  numPages={pdfNumPages}
                  pageWidth={pdfPageWidth}
                  onLoadSuccess={handlePdfLoadSuccess}
                  onLoadError={(error) => {
                    console.error('Error al cargar PDF del miniverso:', error);
                    setPdfLoadError('No pudimos cargar el fragmento en PDF. Intenta de nuevo más tarde.');
                  }}
                />
              </Suspense>
            )}
            <div ref={pdfEndSentinelRef} className="h-px w-full" aria-hidden="true" />
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;
  const SupportBlockContainer = isMobileViewport ? 'div' : motion.div;
  const supportBlockMotionProps = isMobileViewport
    ? {}
    : {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        transition: { duration: 0.8, ease: 'easeOut' },
        viewport: { once: true, amount: 0.25 },
      };

  return (
    <>
      <section
        ref={transmediaSectionRef}
        id="transmedia"
        className={`relative pb-24 ${
          allianceOnlyMode
            ? 'pt-10 min-h-[900px] md:pt-14 md:min-h-[980px]'
            : 'pt-[clamp(3.5rem,8vh,6rem)]'
        }`}
      >
        {import.meta.env?.DEV ? (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={handleResetCredits}
              className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:bg-amber-500/20"
            >
              Reset créditos
            </button>
          </div>
        ) : null}
        {!allianceOnlyMode ? (
          <div className="section-divider mb-[clamp(2.5rem,6vh,5.25rem)]"></div>
        ) : null}

        <div className="container mx-auto px-6">
          {!allianceOnlyMode ? (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="text-center mb-[clamp(2.5rem,5.5vh,4rem)] space-y-[clamp(1.25rem,2.2vh,1.75rem)] min-h-[clamp(210px,27vh,260px)]"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Narrativa Transmedia</p>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-gradient italic">
                La Obra en otras formas
              </h2>
              <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
    <em>Es un gato encerrado</em> no se acaba en el teatro.<br />
    Desde ahí se abrió en <strong>nueve formas creativas</strong>.<br />

      Cada una con su propio lenguaje y forma de participación.<br /><br />

   Ninguna repite la historia: <strong>la transforman.</strong><br /><br />

  </p>
            </motion.div>
          ) : null}

          {!allianceOnlyMode ? (
            <>
              <div className="lg:hidden space-y-6">
            {(() => {
              const format = formats[mobileShowcaseIndex % formats.length];
              const currentIndex = mobileShowcaseIndex % formats.length;
              const prevIndex = (mobileShowcaseIndex - 1 + formats.length) % formats.length;
              const nextIndex = (mobileShowcaseIndex + 1) % formats.length;
              const prevLabel = formats[prevIndex]?.title ?? '';
              const nextLabel = formats[nextIndex]?.title ?? '';
              const maxVisibleDots = 7;
              const visibleDotCount = Math.min(maxVisibleDots, formats.length);
              const maxStart = Math.max(formats.length - visibleDotCount, 0);
              const dotWindowStart = Math.min(
                Math.max(currentIndex - Math.floor(visibleDotCount / 2), 0),
                maxStart
              );
              const dotWindowEnd = dotWindowStart + visibleDotCount;
              const visibleDotIndices = Array.from(
                { length: visibleDotCount },
                (_, offset) => dotWindowStart + offset
              );
              const Icon = format.icon;
              const iconClass = format.iconClass ?? 'text-purple-200';
              const tileGradient =
                MINIVERSO_TILE_GRADIENTS[format.id] ?? MINIVERSO_TILE_GRADIENTS.default;
              const mirrorEffect =
                VITRINA_MIRROR_EFFECTS[format.id] ?? VITRINA_MIRROR_EFFECTS.default;
              const isActiveTile = activeShowcase === format.id;
              const isTransitionTargetTile = isShowcaseOpenTransitionActive && showcaseTransitionTargetId === format.id;
              const isTransitionDimTile = isShowcaseOpenTransitionActive && !isTransitionTargetTile;
              const isDimmedTile = (isCinematicShowcaseOpen && !isActiveTile) || isTransitionDimTile;
              const isRecommendedTile = recommendedShowcaseId === format.id;
              const tokenEntry = showcaseTokenLedgerById[format.id];
              const rewardLabel = buildShowcaseRewardLabel(tokenEntry);
              const energyState = buildShowcaseEnergyState(safeAvailableGATokens);
              const minRequiredCopy = buildShowcaseMinRequiredCopy(format.id);
              return (
                <>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <button
                      type="button"
                      disabled={isShowcaseOpenTransitionActive}
                      onClick={() => setMobileShowcaseIndex(prevIndex)}
                      className="justify-self-start inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200/90 transition hover:border-purple-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:opacity-45 disabled:pointer-events-none"
                      aria-label={`Ir a vitrina anterior: ${prevLabel}`}
                    >
                      <span aria-hidden="true">←</span>
                      <span className="truncate">{prevLabel}</span>
                    </button>
                    <div className="flex items-center justify-center gap-2 min-w-[88px]">
                      {visibleDotIndices.map((idx, offset) => {
                        const item = formats[idx];
                        const isActiveDot = idx === currentIndex;
                        const isLeftEdgeDot = offset === 0 && dotWindowStart > 0;
                        const isRightEdgeDot =
                          offset === visibleDotIndices.length - 1 && dotWindowEnd < formats.length;
                        return (
                          <button
                            key={`mobile-dot-${item.id}`}
                            type="button"
                            disabled={isShowcaseOpenTransitionActive}
                            onClick={() => setMobileShowcaseIndex(idx)}
                            className={`h-2 w-2 rounded-full transition ${
                              isActiveDot
                                ? 'bg-slate-100 shadow-[0_0_8px_rgba(255,255,255,0.55)]'
                                : isLeftEdgeDot || isRightEdgeDot
                                  ? 'bg-slate-500/40 hover:bg-slate-300/65'
                                  : 'bg-slate-500/70 hover:bg-slate-300/80'
                            } disabled:opacity-45 disabled:pointer-events-none`}
                            aria-label={`Ir a vitrina ${item.title}`}
                            aria-current={isActiveDot ? 'true' : undefined}
                          />
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={isShowcaseOpenTransitionActive}
                      onClick={() => setMobileShowcaseIndex(nextIndex)}
                      className="justify-self-end inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200/90 transition hover:border-purple-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:opacity-45 disabled:pointer-events-none"
                      aria-label={`Ir a vitrina siguiente: ${nextLabel}`}
                    >
                      <span className="truncate">{nextLabel}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <motion.div
                    key={format.id}
                    initial={isSafari ? false : { opacity: 0, y: 18 }}
                    animate={
                      isSafari
                        ? { opacity: 1, y: 0 }
                        : { opacity: 1, y: 0, scale: isTransitionTargetTile ? 1.01 : 1 }
                    }
                    whileTap={isShowcaseOpenTransitionActive ? undefined : { scale: 0.985, y: -2 }}
                    transition={isSafari ? { duration: 0.12, ease: 'linear' } : { duration: 0.28, ease: 'easeOut' }}
                    className={`safari-stable-layer group vitrina-pozo-glass vitrina-pozo--${format.id} glass-effect hover-glow rounded-2xl border border-white/10 bg-black/30 overflow-hidden text-left shadow-[0_20px_60px_rgba(0,0,0,0.55)] active:border-purple-300/40 active:shadow-[0_24px_70px_rgba(88,28,135,0.45)] ${
                      isDimmedTile ? 'opacity-70' : ''
                    } ${
                      isRecommendedTile
                        ? 'border-fuchsia-300/60 shadow-[0_0_0_1px_rgba(244,114,182,0.35),0_24px_80px_rgba(168,85,247,0.3)]'
                        : ''
                    } ${
                      isShowcaseOpenTransitionActive ? 'pointer-events-none' : ''
                    }`}
                    onClick={() => {
                      if (isShowcaseOpenTransitionActive) return;
                      if (mobileSwipeBlockTapRef.current) return;
                      handleFormatClick(format.id);
                    }}
                    onTouchStart={isShowcaseOpenTransitionActive ? undefined : handleMobileShowcaseTouchStart}
                    onTouchMove={isShowcaseOpenTransitionActive ? undefined : handleMobileShowcaseTouchMove}
                    onTouchEnd={isShowcaseOpenTransitionActive ? undefined : handleMobileShowcaseTouchEnd}
                    onTouchCancel={isShowcaseOpenTransitionActive ? undefined : handleMobileShowcaseTouchEnd}
                  >
                    <div className="relative vitrina-pozo-glass__media h-[500px] max-[375px]:h-[360px] bg-slate-500/20 overflow-hidden">
                      {format.image ? (
                        <img
                          src={format.image}
                          alt={`Imagen de ${format.title}`}
                          className="showcase-parallax-media safari-stable-media absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/25" />
                      <div className="vitrina-image-overlay" style={mirrorEffect} />
                    </div>
                    <div className="relative vitrina-pozo-glass__meta overflow-hidden">
                      {isRecommendedTile ? (
                        <div className="absolute right-4 top-4 z-20 rounded-full border border-fuchsia-300/50 bg-fuchsia-500/20 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-fuchsia-100">
                          Recomendada
                        </div>
                      ) : null}
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 opacity-80"
                        style={{
                          backgroundImage: tileGradient,
                          filter: 'saturate(1.1)',
                          backgroundSize: '160% 160%',
                          backgroundPosition: '0% 0%',
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-35 mix-blend-screen"
                        style={{
                          backgroundImage:
                            'radial-gradient(1px 1px at 12% 18%, rgba(248,250,252,0.8), transparent 65%),' +
                            'radial-gradient(1.5px 1.5px at 24% 42%, rgba(241,245,249,0.65), transparent 70%),' +
                            'radial-gradient(2px 2px at 36% 28%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,0.45), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 52% 18%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(2px 2px at 64% 48%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 72% 30%, rgba(255,255,255,0.4), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 80% 66%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(2px 2px at 88% 22%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,0.35), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 58% 78%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(1px 1px at 90% 82%, rgba(255,255,255,0.35), transparent 70%)',
                        }}
                      />
                      <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
                    </div>
                    <div className="relative z-10 px-6 pb-6 pt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Icon
                          size={24}
                          className={`${iconClass} drop-shadow-[0_0_12px_rgba(168,85,247,0.35)] transition-transform duration-300 group-hover:-translate-y-1 group-active:-translate-y-1`}
                        />
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Miniversos</p>
                          <h3 className="font-display text-2xl text-slate-100">{format.title}</h3>
                        </div>
                      </div>
                  
                      <div className="space-y-1">
                        {rewardLabel ? (
                          <p className="text-xs text-purple-200/90 uppercase tracking-[0.25em]">
                            {rewardLabel}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em]">
                          <Coins size={12} className={energyState.className} />
                          <span className={energyState.className}>
                            {energyState.label} {energyState.amount}
                          </span>
                          <span className="text-amber-200/90">· {minRequiredCopy}</span>
                        </div>
                      </div>
                      <div className="text-purple-300 flex items-center gap-2 font-semibold transition-all duration-300 group-hover:gap-3 group-active:gap-3">
                        Abrir vitrina
                        <ArrowRight size={18} />
                      </div>
                      </div>
                    </div>
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-300 ease-in-out ${
                        isTransitionDimTile ? 'opacity-95' : 'opacity-0'
                      }`}
                    />
                  </motion.div>
                </>
              );
            })()}
              </div>
              <div className="hidden lg:block">
            {isDesktopFocusLockActive ? (
              <div className="relative mx-auto mb-5 w-full max-w-[31rem] rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/10 px-5 py-4 text-center shadow-[0_10px_30px_rgba(120,39,173,0.25)]">
                <button
                  type="button"
                  onClick={releaseDesktopFocusLock}
                  className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-fuchsia-200/45 bg-fuchsia-400/20 text-sm font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/35"
                  aria-label="Cerrar enfoque recomendado"
                >
                  ×
                </button>
                <div className="text-center">
                  {focusMetadataImageUrl ? (
                    <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-xl border border-fuchsia-200/35 bg-black/25">
                      <img
                        src={focusMetadataImageUrl}
                        alt={focusAppMetadata?.title ? `Imagen recomendada de ${focusAppMetadata.title}` : 'Imagen recomendada'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-fuchsia-100/90">Vitrina recomendada por el gato de la cabina</p>
                  <p className="mt-1 text-[1.05rem] font-semibold leading-snug text-slate-100">
                    Cuentas con{' '} extras de energía
                    <span className="font-semibold text-amber-200">
                      {Number.isFinite(focusIncomingGAT) ? `${focusIncomingGAT} GAT` : 'tus GAT'}
                    </span>
                    .
                  </p>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-8 min-h-[720px]">
              {visibleShowcases.map((format, index) => {
                const Icon = format.icon;
                const iconClass = format.iconClass ?? 'text-purple-200';
                const tileGradient =
                  MINIVERSO_TILE_GRADIENTS[format.id] ?? MINIVERSO_TILE_GRADIENTS.default;
                const mirrorEffect =
                  VITRINA_MIRROR_EFFECTS[format.id] ?? VITRINA_MIRROR_EFFECTS.default;
                const isRecommendedTile = recommendedShowcaseId === format.id;
                const isFocusCenterTile = index === 1;
                const isFocusSideTile = isDesktopFocusLockActive && !isFocusCenterTile;
                const isTransitionTargetTile =
                  isShowcaseOpenTransitionActive && showcaseTransitionTargetId === format.id;
                const isTransitionDimTile =
                  isShowcaseOpenTransitionActive &&
                  showcaseTransitionTargetId !== format.id;
                const tokenEntry = showcaseTokenLedgerById[format.id];
                const rewardLabel = buildShowcaseRewardLabel(tokenEntry);
                const energyState = buildShowcaseEnergyState(safeAvailableGATokens);
                const minRequiredCopy = buildShowcaseMinRequiredCopy(format.id);
                return (
                  <motion.button
                    key={format.id}
                    type="button"
                    initial={isSafari ? false : { opacity: 0, y: 20 }}
                    animate={
                      isSafari
                        ? { opacity: 1, y: 0 }
                        : { opacity: 1, y: 0, scale: isTransitionTargetTile ? 1.012 : 1 }
                    }
                    transition={isSafari ? { duration: 0.12, ease: 'linear' } : { duration: 0.32, delay: index * 0.03, ease: 'easeOut' }}
                    className={`safari-stable-layer group vitrina-pozo-glass vitrina-pozo--${format.id} glass-effect rounded-2xl border border-white/10 bg-black/30 hover:border-purple-400/50 overflow-hidden text-left shadow-[0_20px_60px_rgba(0,0,0,0.55)] flex flex-col min-h-[620px] hover-glow transition ${
                      isRecommendedTile
                        ? 'border-fuchsia-300/60 shadow-[0_0_0_1px_rgba(244,114,182,0.35),0_24px_80px_rgba(168,85,247,0.3)]'
                        : ''
                    } ${
                      isFocusSideTile || isTransitionDimTile
                        ? 'opacity-45 saturate-50 brightness-75 scale-[0.985]'
                        : ''
                    } ${
                      isTransitionTargetTile ? 'border-purple-300/55 shadow-[0_24px_90px_rgba(88,28,135,0.45)]' : ''
                    } ${
                      isShowcaseOpenTransitionActive ? 'pointer-events-none' : ''
                    }`}
                    onClick={() => {
                      if (isShowcaseOpenTransitionActive) return;
                      handleFormatClick(format.id);
                    }}
                  >
                    <div className="relative vitrina-pozo-glass__media flex-1 min-h-[320px] bg-slate-500/20 overflow-hidden">
                      {format.image ? (
                        <img
                          src={format.image}
                          alt={`Imagen de ${format.title}`}
                          className="showcase-parallax-media safari-stable-media absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
                      {isFocusSideTile ? (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
                      ) : null}
                      <div className="vitrina-image-overlay" style={mirrorEffect} />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                    </div>
                    <div className="relative vitrina-pozo-glass__meta p-6 overflow-hidden min-h-[240px]">
                      {isRecommendedTile ? (
                        <div className="absolute right-4 top-4 z-20 rounded-full border border-fuchsia-300/50 bg-fuchsia-500/20 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-fuchsia-100">
                          Recomendada
                        </div>
                      ) : null}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-80 pointer-events-none"
                        style={{
                          backgroundImage: tileGradient,
                          filter: 'saturate(1.1)',
                          backgroundSize: '160% 160%',
                          backgroundPosition: '0% 0%',
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-35 mix-blend-screen pointer-events-none"
                        style={{
                          backgroundImage:
                            'radial-gradient(1px 1px at 12% 18%, rgba(248,250,252,0.8), transparent 65%),' +
                            'radial-gradient(1.5px 1.5px at 24% 42%, rgba(241,245,249,0.65), transparent 70%),' +
                            'radial-gradient(2px 2px at 36% 28%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,0.45), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 52% 18%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(2px 2px at 64% 48%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 72% 30%, rgba(255,255,255,0.4), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 80% 66%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(2px 2px at 88% 22%, rgba(226,232,240,0.6), transparent 70%),' +
                            'radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,0.35), transparent 70%),' +
                            'radial-gradient(1.5px 1.5px at 58% 78%, rgba(241,245,249,0.55), transparent 70%),' +
                            'radial-gradient(1px 1px at 90% 82%, rgba(255,255,255,0.35), transparent 70%)',
                        }}
                      />
                      <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
                      <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <Icon size={24} className={`${iconClass} drop-shadow-[0_0_12px_rgba(168,85,247,0.35)] transition-transform duration-300 group-hover:-translate-y-1`} />
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Miniverso</p>
                          <h3 className="font-display text-2xl text-slate-100">{format.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300/85 leading-relaxed min-h-[1.5rem]">
                        {format.instruccion}
                      </p>
                      <div className="space-y-1">
                        {rewardLabel ? (
                          <p className="text-xs text-purple-200/90 uppercase tracking-[0.25em]">
                            {rewardLabel}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em]">
                          <Coins size={12} className={energyState.className} />
                          <span className={energyState.className}>
                            {energyState.label} {energyState.amount}
                          </span>
                          <span className="text-amber-200/90">· {minRequiredCopy}</span>
                        </div>
                      </div>
             
                      </div>
                    </div>
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-300 ease-in-out ${
                        isTransitionDimTile ? 'opacity-95' : 'opacity-0'
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                disabled={isShowcaseOpenTransitionActive}
                onClick={handleShowcasePrevBatch}
                className="h-10 w-10 rounded-full border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:border-purple-300/40 transition disabled:opacity-45 disabled:pointer-events-none"
                aria-label="Vitrina anterior"
              >
                ←
              </button>
              <button
                type="button"
                disabled={isShowcaseOpenTransitionActive}
                onClick={handleShowcaseNextBatch}
                className="h-10 w-10 rounded-full border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:border-purple-300/40 transition disabled:opacity-45 disabled:pointer-events-none"
                aria-label="Siguiente vitrina"
              >
                →
              </button>
            </div>
              </div>
              {showcaseOverlay}
              {showcaseDipToBlackOverlay}
              {oraculoOverlay}
              {causeSiteOverlay}
              {gatBalanceToastOverlay}
              {quironFullOverlay}
              {quironPrecareOverlay}
              {quironAftercareOverlay}
              {tokenPrecareOverlay}
              {movementActionOverlay}
              {imagePreviewOverlay}
              {pdfPreviewOverlay}

              {renderExplorerBadge()}
            </>
          ) : null}
          {/* #apoya y CTA extraídos a AlianzaSocial.jsx */}
        </div>
      </section>

      {hasLoadedMiniverseModal ? (
        <Suspense fallback={null}>
          <MiniverseModal
            open={isMiniverseOpen}
            onClose={handleCloseMiniverses}
            contextLabel={miniverseContext}
            initialTabId={miniverseInitialTabId}
            onSelectMiniverse={handleSelectMiniverse}
            shelved={isMiniverseShelved}
            stayOpenOnSelect
          />
        </Suspense>
      ) : null}
      {hasLoadedContributionModal ? (
        <Suspense fallback={null}>
          <ContributionModal
            open={isContributionOpen}
            onClose={() => {
              setIsContributionOpen(false);
              setContributionCategoryId(null);
              setReturnShowcaseId(null);
            }}
            initialCategoryId={contributionCategoryId}
            presentation="sheet"
            onReturnToShowcase={returnShowcaseId ? handleReturnToShowcase : null}
          />
        </Suspense>
      ) : null}
      {showBadgeLoginOverlay && hasLoadedBadgeLoginOverlay ? (
        <Suspense fallback={null}>
          <LoginOverlay onClose={handleCloseBadgeLogin} />
        </Suspense>
      ) : null}

      {MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED && isMiniversoEditorialModalOpen ? (
        <div className="fixed inset-0 z-[190] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseMiniversoEditorialModal} />
          <div className="relative z-10 my-10 w-[calc(100vw-2rem)] max-w-xl">
            <div className="glass-effect rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl p-8 md:p-10 text-center space-y-6">
              <h3 className="font-display text-3xl md:text-4xl text-slate-50">
                “Este espacio se activará después de la función.”
              </h3>
              <p className="text-base md:text-lg text-slate-200/90 leading-relaxed">
                Las expansiones narrativas ya están en marcha,<br />
                pero hoy el foco está en la obra en escena.<br />
                <br />
                Nos vemos en el teatro.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center">
          
                <button
                  type="button"
                  onClick={handleEditorialCtaClick}
                  className="px-4 py-2 rounded-full bg-white/10 text-sm font-semibold uppercase tracking-[0.3em] text-purple-100 hover:bg-white/20 transition"
                >
                  ¿Conoces nuestra causa social?
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isTazaARActive && isMobileARFullscreen ? (
        <div className="fixed inset-0 z-40 bg-black">
          <Suspense fallback={<div className="h-full w-full bg-black" />}>
            <ARExperience
              targetSrc="/webar/taza/taza.mind"
              phrases={showcaseDefinitions.lataza.phrases}
              showScanGuide
              guideImageSrc="/webar/taza/taza-marker.jpg"
              guideLabel="Alinea la ilustración de la taza con el contorno. No necesita ser exacto."
              onExit={handleCloseARExperience}
              initialCameraReady
              onError={handleARError}
            />
          </Suspense>
        </div>
      ) : null}
      {hasLoadedAutoficcionPreview ? (
        <Suspense fallback={null}>
          <AutoficcionPreviewOverlay
            open={showAutoficcionPreview}
            onClose={() => setShowAutoficcionPreview(false)}
          />
        </Suspense>
      ) : null}
    </>
  );
};

export default Transmedia;
