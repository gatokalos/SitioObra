import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Feather,
  Flame,
  Scan,
  CheckCircle2,
  Zap,
  Wrench,
  Heart,
  Layers,
  BookOpen,
  Hand,
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import { PORTAL_VOZ_MODE_QUESTIONS } from '@/lib/obraConversation';
import { useSilvestreVoice } from '@/hooks/useSilvestreVoice';
import IAInsightCard from '@/components/IAInsightCard';
import ObraConversationControls from '@/components/miniversos/obra/ObraConversationControls';
import ObraQuestionList from '@/components/miniversos/obra/ObraQuestionList';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { fetchApprovedContributions } from '@/services/contributionService';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';

const VOICE_MODES = [
  {
    id: 'confusion-lucida',
    title: 'Confusión lúcida',
    description: 'Sueño y realidad mezclados.',
    accent: 'from-violet-200/20 via-purple-300/10 to-transparent',
    icon: Feather,
    tint: {
      border: 'rgba(196,181,253,0.5)',
      glow: '0 20px 60px rgba(139,92,246,0.25)',
      dot: 'rgba(196,181,253,0.9)',
    },
  },
  {
    id: 'sospecha-doctora',
    title: 'Sospecha',
    description: 'Duda empedernida',
    accent: 'from-cyan-200/20 via-sky-300/10 to-transparent',
    icon: Scan,
    tint: {
      border: 'rgba(125,211,252,0.45)',
      glow: '0 18px 55px rgba(14,165,233,0.2)',
      dot: 'rgba(125,211,252,0.9)',
    },
  },
  {
    id: 'rabia',
    title: 'Rabia',
    description: 'Cuando el cuerpo habla primero.',
    accent: 'from-red-200/20 via-orange-300/10 to-transparent',
    icon: Flame,
    tint: {
      border: 'rgba(252,165,165,0.45)',
      glow: '0 18px 55px rgba(239,68,68,0.2)',
      dot: 'rgba(252,165,165,0.9)',
    },
  },
  {
    id: 'necesidad-orden',
    title: 'Necesidad de orden',
    description: 'Una versión clara y breve, sin adornos.',
    accent: 'from-amber-200/20 via-orange-300/10 to-transparent',
    icon: CheckCircle2,
    tint: {
      border: 'rgba(251,191,36,0.45)',
      glow: '0 18px 55px rgba(251,191,36,0.2)',
      dot: 'rgba(251,191,36,0.9)',
    },
  },
  {
    id: 'humor-negro',
    title: 'Ironía',
    description: 'Filosa y sin explicación.',
    accent: 'from-fuchsia-200/20 via-pink-300/10 to-transparent',
    icon: Zap,
    tint: {
      border: 'rgba(244,114,182,0.45)',
      glow: '0 18px 55px rgba(236,72,153,0.2)',
      dot: 'rgba(244,114,182,0.9)',
    },
  },
  {
    id: 'cansancio-mental',
    title: 'Cansancio mental',
    description: 'Aterrizaje forzoso.',
    accent: 'from-emerald-200/20 via-teal-300/10 to-transparent',
    icon: Wrench,
    tint: {
      border: 'rgba(110,231,183,0.45)',
      glow: '0 18px 55px rgba(16,185,129,0.2)',
      dot: 'rgba(110,231,183,0.9)',
    },
  },
  {
    id: 'atraccion-incomoda',
    title: 'Atracción incómoda',
    description: 'Enganche y molestia, a la vez.',
    accent: 'from-rose-200/20 via-pink-300/10 to-transparent',
    icon: Heart,
    tint: {
      border: 'rgba(251,113,133,0.45)',
      glow: '0 18px 55px rgba(244,114,182,0.2)',
      dot: 'rgba(251,113,133,0.9)',
    },
  },
  {
    id: 'vertigo',
    title: 'Vértigo',
    description: 'No hay punto final.',
    accent: 'from-violet-200/20 via-indigo-300/10 to-transparent',
    icon: Layers,
    tint: {
      border: 'rgba(165,180,252,0.45)',
      glow: '0 18px 55px rgba(129,140,248,0.2)',
      dot: 'rgba(165,180,252,0.9)',
    },
  },
];

const DEFAULT_VOICE_MODE_ID = VOICE_MODES[0].id;
const MOBILE_OBRA_SECONDARY_CTA_STATES = {
  READ_SCRIPT: 'read-script',
  TRY_OTHER_EMOTION: 'try-other-emotion',
  LAUNCH_PHRASE: 'launch-phrase',
};
const OBRA_EMOTION_LOG_STORAGE_KEY = 'gatoencerrado:obra-emotion-log';
const OBRA_EMOTION_ORBS_STORAGE_KEY = 'gatoencerrado:obra-emotion-orbs';
const OBRA_EMOTION_MAX_ORBS = 36;
const OBRA_EMOTION_ORB_VERSION = 2;
const SCENE_BLOG_KEYS = ['obra_escenica', 'miniversos', 'obra'];
const SCENE_BLOG_KEY_SET = new Set(SCENE_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const OBRA_EMOTION_MODE_REGIONS = {
  'confusion-lucida': { left: 50, top: 24, spreadX: 7, spreadY: 7, size: 14 },
  'sospecha-doctora': { left: 38, top: 38, spreadX: 10, spreadY: 8, size: 15 },
  'necesidad-orden': { left: 52, top: 52, spreadX: 10, spreadY: 9, size: 16 },
  'humor-negro': { left: 62, top: 40, spreadX: 10, spreadY: 8, size: 15 },
  'cansancio-mental': { left: 40, top: 64, spreadX: 11, spreadY: 10, size: 17 },
  'atraccion-incomoda': { left: 46, top: 48, spreadX: 12, spreadY: 10, size: 16 },
  vertigo: { left: 58, top: 70, spreadX: 9, spreadY: 9, size: 16 },
  default: { left: 50, top: 50, spreadX: 11, spreadY: 11, size: 15 },
};

const collectiveEmotionBaseline = {
  'confusion-lucida': 19,
  'sospecha-doctora': 14,
  'necesidad-orden': 16,
  'humor-negro': 12,
  'cansancio-mental': 18,
  'atraccion-incomoda': 13,
  vertigo: 10,
};

const collectiveNodeLayout = [
  { x: 17, y: 27 },
  { x: 82, y: 22 },
  { x: 73, y: 76 },
  { x: 24, y: 80 },
];
const SCENE_PORTAL_INTRO = (
  <>
    <p className="text-base leading-relaxed text-neutral-300">
      Los estados emocionales de <strong>Silvestre</strong> no son etiquetas.{' '}
      Son lugares donde la escena ocurre.
    </p>
    <p className="text-base leading-relaxed text-neutral-300 mt-3">
      Di una frase —tuya o del libreto— y escucha cómo la obra responde desde adentro.
    </p>
    <p className="text-base leading-relaxed text-neutral-300 mt-3">
      Luego cambia de emoción y detona la misma frase otra vez.
    </p>
    <p className="text-lg leading-relaxed font-medium text-white mt-4">
      La escena nunca responde igual.
    </p>
  </>
);
const SCENE_PORTAL_IA_PROFILE = {
  type: 'Una voz que no es personaje ni herramienta: es la conciencia de la obra en proceso.',
  interaction: 'Elige una emoción de Silvestre. Habla desde ahí. La obra responderá diferente al cambiar de emoción.',
  tokensRange: 'Lo suficiente para decir algo sin agotarlo.',
  coverage: 'Existe mientras haya quienes la convoquen.',
  footnote: 'No todas las voces quieren durar. Gracias por dejarlas pasar.',
};
const SCENE_PORTAL_NOTA_AUTORAL = {
  title: '#LaPuertaInvisible',
  verse: 'Entré sin saber.\nAlgo dijo mi nombre.\nY ya no hubo salida.',
};
const MINIVERSO_TILE_GRADIENTS = {
  miniversos: 'linear-gradient(135deg, rgba(31,21,52,0.95), rgba(64,36,93,0.85), rgba(122,54,127,0.65))',
  default: 'linear-gradient(135deg, rgba(20,14,35,0.95), rgba(47,28,71,0.85), rgba(90,42,100,0.65))',
};
const MINIVERSO_TILE_COLORS = {
  miniversos: {
    background: 'rgba(31,21,52,0.75)',
    border: 'rgba(186,131,255,0.35)',
    text: '#e9d8ff',
    accent: '#f4c8ff',
  },
  default: {
    background: 'rgba(20,14,35,0.7)',
    border: 'rgba(186,131,255,0.3)',
    text: '#f3e8ff',
    accent: '#e9d8fd',
  },
};
const SCENE_PORTAL_COLLABORATORS = [
  {
    id: 'carlos-perez',
    name: 'Carlos Pérez',
    role: 'Coordinador de diálogo',
    bio: 'Mi trabajo se enfocó en pensar cómo la experiencia escénica podía continuar más allá de la función, no desde la explicación, sino desde preguntas cuidadas y abiertas. Diseñé este espacio que respeta la ambigüedad de la obra y acompaña al espectador sin imponer interpretaciones.',
    image:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/autores/carlos_perez_avatar.png',
  },
  {
    id: 'incendio-producciones',
    name: 'Incendio Producciones',
    role: 'Producción ejecutiva asociada',
    bio: 'Esta versión del chat fue adaptada para acompañar la puesta en escena de Gilberto Corrales. El trabajo de dirección y producción transformó la obra, y este espacio fue ajustado para dialogar con esa nueva forma.',
    image: '/assets/incendiologo.png',
  },
];

const normalizeSilvestrePrompt = (value) => (typeof value === 'string' ? value.trim() : '');

const readStoredJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage?.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const shuffleArray = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const clampEmotionValue = (value, min, max) => Math.max(min, Math.min(max, value));

const resolveEmotionRegion = (modeId) => OBRA_EMOTION_MODE_REGIONS[modeId] ?? OBRA_EMOTION_MODE_REGIONS.default;

const createEmotionOrb = (modeId, seed, index = 0) => {
  const region = resolveEmotionRegion(modeId);
  const seedA = (Math.sin(seed * 0.73) + 1) / 2;
  const seedB = (Math.sin(seed * 1.17) + 1) / 2;
  const seedC = (Math.sin(seed * 1.91) + 1) / 2;
  const seedD = (Math.sin(seed * 2.37) + 1) / 2;
  return {
    id: `${modeId}-${seed}`,
    modeId,
    version: OBRA_EMOTION_ORB_VERSION,
    left: clampEmotionValue(region.left + (seedA - 0.5) * 2 * region.spreadX, 30, 70),
    top: clampEmotionValue(region.top + (seedB - 0.5) * 2 * region.spreadY, 14, 84),
    size: region.size + seedC * 12 + (index % 3),
    opacity: 0.3 + seedD * 0.28,
  };
};

const normalizeStoredEmotionOrbs = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object' || typeof entry.modeId !== 'string') return null;
      if (entry.version === OBRA_EMOTION_ORB_VERSION) return entry;
      const parsedSeed = Number.parseInt(String(entry.id ?? '').split('-').pop() || '', 10);
      const seed = Number.isFinite(parsedSeed) ? parsedSeed : Date.now() + index * 53;
      return createEmotionOrb(entry.modeId, seed, index);
    })
    .filter(Boolean)
    .slice(-OBRA_EMOTION_MAX_ORBS);
};

const MiniVersoCard = ({
  title,
  verse,
  palette,
  effect = 'flip',
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleCardToggle = () => {
    setIsActive((prev) => !prev);
  };

  if (effect === 'flip') {
    return (
      <div className="relative [perspective:1200px]" onClick={handleCardToggle}>
        <motion.div
          animate={{ rotateY: isActive ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="relative min-h-[220px] [transform-style:preserve-3d]"
        >
          <div
            className="absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-4 text-sm [backface-visibility:hidden]"
            style={{
              backgroundImage: palette.gradient,
              borderColor: palette.border,
              color: palette.text,
              inset: 0,
            }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg"
              style={{
                color: palette.accent,
                backgroundColor: `${palette.background}cc`,
                border: `1px solid ${palette.border}`,
              }}
            >
              {title}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white/85 shadow-[0_0_16px_rgba(255,255,255,0.18)]">
              <Hand size={16} className="animate-pulse" />
            </span>
          </div>
          <div
            className="absolute inset-0 rounded-2xl border px-6 py-5 [backface-visibility:hidden] flex items-center justify-center text-sm"
            style={{
              backgroundImage: palette.gradient,
              borderColor: palette.border,
              color: palette.text,
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="leading-relaxed whitespace-pre-line text-center font-light">{verse}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

const ShowcaseReactionInline = ({
  title,
  description,
  buttonLabel,
  status,
  onReact,
  className = '',
}) => (
  <div className={`mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{title}</p>
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={onReact}
        className={`rounded-full p-3 transition ${
          status === 'success'
            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 shadow-[0_0_25px_rgba(244,114,182,0.6)] text-white border border-transparent'
            : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white hover:from-purple-500 hover:to-indigo-500'
        }`}
        disabled={status === 'loading'}
      >
        <Heart size={20} />
      </button>
    </div>
    {buttonLabel ? (
      <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
        {status === 'loading' ? 'Enviando...' : buttonLabel}
      </p>
    ) : null}
  </div>
);

const PortalVoz = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

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
  } = useSilvestreVoice();

  const [activeModeId, setActiveModeId] = useState(DEFAULT_VOICE_MODE_ID);
  const [elevatedSilvestreStarter, setElevatedSilvestreStarter] = useState(null);
  const [mobileObraSecondaryCtaState, setMobileObraSecondaryCtaState] = useState(
    MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT
  );
  const [mobileObraReplayPrompt, setMobileObraReplayPrompt] = useState('');
  const [mobileAwaitingEmotionSwitch, setMobileAwaitingEmotionSwitch] = useState(false);
  const [obraModeUsage, setObraModeUsage] = useState(() => {
    const raw = readStoredJson(OBRA_EMOTION_LOG_STORAGE_KEY, {});
    return VOICE_MODES.reduce((acc, mode) => {
      const value = Number(raw?.[mode.id] ?? 0);
      acc[mode.id] = Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
      return acc;
    }, {});
  });
  const [obraEmotionOrbs, setObraEmotionOrbs] = useState(() => {
    const raw = readStoredJson(OBRA_EMOTION_ORBS_STORAGE_KEY, []);
    return normalizeStoredEmotionOrbs(raw);
  });
  const [communityComments, setCommunityComments] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [latestSceneReading, setLatestSceneReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [openCollaboratorId, setOpenCollaboratorId] = useState(null);

  const obraConversationControlsRef = useRef(null);
  const obraModesRef = useRef(null);
  const obraDetonadoresRef = useRef(null);
  const wasSilvestrePlayingRef = useRef(false);
  const previousObraModeIdRef = useRef(DEFAULT_VOICE_MODE_ID);
  const readingTooltipRef = useRef(null);

  const starterPool = useMemo(() => {
    const base = VOICE_MODES.flatMap((mode) => PORTAL_VOZ_MODE_QUESTIONS[mode.id] ?? []);
    const unique = Array.from(
      new Set(
        base
          .map((question) => (typeof question === 'string' ? question.trim() : ''))
          .filter(Boolean)
      )
    );
    return shuffleArray(unique);
  }, []);

  const tragicoStarterSet = useMemo(
    () => new Set(starterPool.map((starter) => normalizeSilvestrePrompt(starter)).filter(Boolean)),
    [starterPool]
  );

  const activeMode = useMemo(
    () => VOICE_MODES.find((mode) => mode.id === activeModeId) ?? VOICE_MODES[0],
    [activeModeId]
  );
  const activeTint = activeMode?.tint ?? VOICE_MODES[0].tint;
  const activeModeSpentSet = useMemo(
    () => getSpentSilvestreSetForMode(activeModeId),
    [activeModeId, getSpentSilvestreSetForMode]
  );
  const visibleStarters = useMemo(
    () => starterPool.filter((starter) => !isSilvestreQuestionFullySpent(starter)),
    [isSilvestreQuestionFullySpent, starterPool]
  );
  const questionProgressMap = useMemo(
    () =>
      visibleStarters.reduce((acc, starter) => {
        acc[starter] = getSilvestreQuestionProgress(starter).count;
        return acc;
      }, {}),
    [getSilvestreQuestionProgress, visibleStarters]
  );

  const isObraVoiceBusy =
    isListening ||
    isSilvestreFetching ||
    isSilvestreResponding ||
    isSilvestrePlaying ||
    Boolean(pendingSilvestreAudioUrl);

  const hasReplayPrompt = Boolean(normalizeSilvestrePrompt(mobileObraReplayPrompt));
  const mobileSecondaryCtaCopy =
    mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION
      ? 'Escúchala con otra emoción'
      : mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE
        ? 'Lanza la frase'
        : 'Sacar del guion';
  const mobileSecondaryCtaEmphasis =
    mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION
      ? 'glow'
      : mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE
        ? 'action'
        : 'soft';
  const mobileSecondaryCtaDisabled =
    isObraVoiceBusy ||
    (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE && !hasReplayPrompt);
  const sceneReadingAuthorLabel = (latestSceneReading?.author || '').trim() || 'autor invitado';
  const sceneReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestSceneReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestSceneReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestSceneReading?.image_url) ||
    sanitizeExternalHttpUrl(latestSceneReading?.author_avatar_url) ||
    null;

  const emotionUsageEntries = useMemo(
    () =>
      VOICE_MODES
        .map((mode) => ({ ...mode, count: Number(obraModeUsage?.[mode.id] ?? 0) }))
        .sort((a, b) => b.count - a.count),
    [obraModeUsage]
  );
  const emotionModesById = useMemo(
    () =>
      VOICE_MODES.reduce((acc, mode) => {
        acc[mode.id] = mode;
        return acc;
      }, {}),
    []
  );
  const emotionLegendEntries = useMemo(
    () => emotionUsageEntries.filter((mode) => mode.count > 0).slice(0, 3),
    [emotionUsageEntries]
  );
  const collectiveEmotionRows = useMemo(
    () =>
      VOICE_MODES.map((mode) => {
        const localCount = Number(obraModeUsage?.[mode.id] ?? 0);
        const baseline = Number(collectiveEmotionBaseline?.[mode.id] ?? 10);
        const collective = baseline + Math.min(localCount * 2, 14);
        return { ...mode, collective };
      }).sort((a, b) => b.collective - a.collective),
    [obraModeUsage]
  );
  const collectiveEmotionNodes = useMemo(
    () => collectiveEmotionRows.slice(0, 4),
    [collectiveEmotionRows]
  );
  const collectiveSyntheticSessions = useMemo(
    () => collectiveEmotionRows.reduce((sum, row) => sum + Number(row.collective || 0), 0) + 26,
    [collectiveEmotionRows]
  );
  const collectivePhraseMetric = {
    phrase: '¿La Doctora sí entiende a Silvestre… o solo parece que sí?',
    reused: 63,
    original: 37,
  };
  const collectiveTopEmotion = collectiveEmotionRows[0] ?? null;

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
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(OBRA_EMOTION_LOG_STORAGE_KEY, JSON.stringify(obraModeUsage));
  }, [obraModeUsage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(OBRA_EMOTION_ORBS_STORAGE_KEY, JSON.stringify(obraEmotionOrbs));
  }, [obraEmotionOrbs]);

  useEffect(() => {
    let isCancelled = false;
    const loadComments = async () => {
      setCommunityLoading(true);
      setCommunityError('');
      const topics = ['obra_escenica', 'miniversos', 'obra'];
      let resolvedData = [];
      let resolvedError = null;
      for (const topic of topics) {
        const { data, error } = await fetchApprovedContributions(topic);
        if (isCancelled) return;
        if (error) {
          resolvedError = error;
          continue;
        }
        if (Array.isArray(data) && data.length) {
          resolvedData = data;
          resolvedError = null;
          break;
        }
      }
      if (isCancelled) return;
      if (resolvedError && !resolvedData.length) {
        setCommunityError('No pudimos cargar comentarios.');
      }
      setCommunityComments(resolvedData);
      setCommunityLoading(false);
    };

    loadComments();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLatestSceneReading = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .not('slug', 'is', null)
        .not('miniverso', 'is', null)
        .order('published_at', { ascending: false })
        .limit(60);

      if (cancelled) return;
      if (error) {
        console.warn('[PortalVoz] No se pudo detectar lectura relacionada:', error);
        setLatestSceneReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return SCENE_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestSceneReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestSceneReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestSceneReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestSceneReading?.slug]);

  useEffect(() => {
    if (!isReadingTooltipOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!readingTooltipRef.current) return;
      if (!readingTooltipRef.current.contains(event.target)) {
        setIsReadingTooltipOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsReadingTooltipOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isReadingTooltipOpen]);

  useEffect(() => {
    const previousModeId = previousObraModeIdRef.current;
    if (previousModeId === activeModeId) return;

    if (!isMobileViewport) {
      previousObraModeIdRef.current = activeModeId;
      return;
    }

    if (
      mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION &&
      mobileAwaitingEmotionSwitch
    ) {
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE);
      setMobileAwaitingEmotionSwitch(false);
      previousObraModeIdRef.current = activeModeId;
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE) {
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileObraReplayPrompt('');
      setMobileAwaitingEmotionSwitch(false);
    }

    previousObraModeIdRef.current = activeModeId;
  }, [activeModeId, isMobileViewport, mobileAwaitingEmotionSwitch, mobileObraSecondaryCtaState]);

  useEffect(() => {
    const wasPlaying = wasSilvestrePlayingRef.current;
    const isPlaybackIdle =
      !isSilvestrePlaying &&
      !isSilvestreResponding &&
      !isSilvestreFetching &&
      !pendingSilvestreAudioUrl;

    if (wasPlaying && isPlaybackIdle && isMobileViewport) {
      const replayCandidate =
        normalizeSilvestrePrompt(transcript) || normalizeSilvestrePrompt(elevatedSilvestreStarter);
      if (replayCandidate) {
        setMobileObraReplayPrompt(replayCandidate);
        setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION);
        setMobileAwaitingEmotionSwitch(true);
      }
    }

    wasSilvestrePlayingRef.current = isSilvestrePlaying;
  }, [
    elevatedSilvestreStarter,
    isMobileViewport,
    isSilvestreFetching,
    isSilvestrePlaying,
    isSilvestreResponding,
    pendingSilvestreAudioUrl,
    transcript,
  ]);

  const incrementObraModeUsage = useCallback((modeId) => {
    const normalized = VOICE_MODES.some((mode) => mode.id === modeId) ? modeId : DEFAULT_VOICE_MODE_ID;
    setObraModeUsage((prev) => ({
      ...prev,
      [normalized]: (Number(prev?.[normalized] ?? 0) || 0) + 1,
    }));
    setObraEmotionOrbs((prev) => {
      const nextSeed = Date.now() + prev.length * 37;
      const next = [...prev, createEmotionOrb(normalized, nextSeed, prev.length)];
      return next.slice(-OBRA_EMOTION_MAX_ORBS);
    });
  }, []);

  const scrollToObraConversationControls = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraConversationControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [isMobileViewport]);

  const scrollToObraModes = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraModesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isMobileViewport]);

  const scrollToObraDetonadores = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraDetonadoresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [isMobileViewport]);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);

  const sendSilvestrePromptToObra = useCallback(
    async (prompt, { modeId = null } = {}) => {
      if (!requireAuth()) return false;
      const normalizedPrompt = normalizeSilvestrePrompt(prompt);
      if (!normalizedPrompt) return false;

      const resolvedModeId =
        typeof modeId === 'string' && modeId.trim() ? modeId.trim() : activeModeId;
      const isStarterPrompt = tragicoStarterSet.has(normalizedPrompt);
      const spentSet = getSpentSilvestreSetForMode(resolvedModeId);
      if (isStarterPrompt && spentSet.has(normalizedPrompt)) return false;

      incrementObraModeUsage(resolvedModeId);
      if (isStarterPrompt) {
        markSilvestreQuestionSpent(normalizedPrompt, { modeId: resolvedModeId });
      }

      setElevatedSilvestreStarter(normalizedPrompt);
      setMobileObraReplayPrompt(normalizedPrompt);
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileAwaitingEmotionSwitch(false);
      scrollToObraConversationControls();

      await handleSendSilvestrePreset(normalizedPrompt, {
        modeId: resolvedModeId,
        userName: user?.user_metadata?.full_name || user?.user_metadata?.alias || null,
      });
      return true;
    },
    [
      activeModeId,
      getSpentSilvestreSetForMode,
      handleSendSilvestrePreset,
      incrementObraModeUsage,
      markSilvestreQuestionSpent,
      requireAuth,
      scrollToObraConversationControls,
      tragicoStarterSet,
      user?.user_metadata?.alias,
      user?.user_metadata?.full_name,
    ]
  );

  const handleUseSilvestreStarter = useCallback(
    async (starter, modeId = null) => {
      await sendSilvestrePromptToObra(starter, { modeId });
    },
    [sendSilvestrePromptToObra]
  );

  const handleMobileObraSecondaryCta = useCallback(async () => {
    if (!isMobileViewport) return;
    if (isObraVoiceBusy) return;

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT) {
      scrollToObraDetonadores();
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION) {
      setMobileAwaitingEmotionSwitch(true);
      scrollToObraModes();
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE) {
      const promptToReplay =
        normalizeSilvestrePrompt(mobileObraReplayPrompt) ||
        normalizeSilvestrePrompt(transcript) ||
        normalizeSilvestrePrompt(elevatedSilvestreStarter);
      if (!promptToReplay) {
        setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
        setMobileAwaitingEmotionSwitch(false);
        return;
      }
      await sendSilvestrePromptToObra(promptToReplay, { modeId: activeModeId });
    }
  }, [
    activeModeId,
    elevatedSilvestreStarter,
    isMobileViewport,
    isObraVoiceBusy,
    mobileObraReplayPrompt,
    mobileObraSecondaryCtaState,
    scrollToObraDetonadores,
    scrollToObraModes,
    sendSilvestrePromptToObra,
    transcript,
  ]);

  const handleOpenSilvestreChatCta = useCallback(
    (modeId = null) => {
      if (!requireAuth()) return;
      const resolvedModeId =
        typeof modeId === 'string' && modeId.trim() ? modeId.trim() : activeModeId;
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileAwaitingEmotionSwitch(false);
      handleOpenSilvestreChat({ modeId: resolvedModeId });
      scrollToObraConversationControls();
    },
    [activeModeId, handleOpenSilvestreChat, requireAuth, scrollToObraConversationControls]
  );

  const handleSelectMode = useCallback((modeId) => {
    setActiveModeId(modeId);
  }, []);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversos', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const renderCollaboratorsSection = useCallback(() => {
    if (!SCENE_PORTAL_COLLABORATORS.length) return null;
    const normalized = SCENE_PORTAL_COLLABORATORS.map((collaborator, index) => ({
      ...collaborator,
      _avatarId: collaborator.id ?? `portal-voz-collab-${index}`,
      _image: collaborator.image || '/images/placeholder-colaboradores.jpg',
    }));
    const selected = normalized.find((collaborator) => collaborator._avatarId === openCollaboratorId);
    const avatarsToShow = normalized.filter((collaborator) => collaborator._avatarId !== selected?._avatarId);

    return (
      <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4 md:space-y-3">
        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] md:items-center gap-3">
          <motion.div layout className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            {avatarsToShow.map((collaborator) => {
              const isActive = selected?._avatarId === collaborator._avatarId;
              return (
                <motion.button
                  key={collaborator._avatarId}
                  type="button"
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onClick={() => setOpenCollaboratorId(collaborator._avatarId)}
                  className={`h-16 w-16 md:h-12 md:w-12 rounded-full border ${
                    isActive ? 'border-purple-300/80 ring-2 ring-purple-400/50' : 'border-white/15'
                  } bg-white/5 overflow-hidden transition hover:border-purple-300/60 shadow-lg shadow-black/30`}
                  title={collaborator.name}
                >
                  <img
                    src={collaborator._image}
                    alt={`Retrato de ${collaborator.name}`}
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
      </div>
    );
  }, [openCollaboratorId]);

  const sceneTileColors = MINIVERSO_TILE_COLORS.miniversos ?? MINIVERSO_TILE_COLORS.default;
  const sceneTileGradient = MINIVERSO_TILE_GRADIENTS.miniversos ?? MINIVERSO_TILE_GRADIENTS.default;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-rose-900/35 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Vitrina</p>
                    <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Escena</h3>
                  </div>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  {SCENE_PORTAL_INTRO}
                </div>
                <IAInsightCard {...SCENE_PORTAL_IA_PROFILE} compact />
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={SCENE_PORTAL_NOTA_AUTORAL.title}
                    verse={SCENE_PORTAL_NOTA_AUTORAL.verse}
                    palette={{
                      gradient: sceneTileGradient,
                      border: sceneTileColors.border,
                      text: sceneTileColors.text,
                      accent: sceneTileColors.accent,
                      background: sceneTileColors.background,
                    }}
                    effect="flip"
                  />
                </div>
              </div>
            </div>
          </div>

          {renderCollaboratorsSection()}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="contents lg:block lg:min-w-0 lg:space-y-6">
              <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Entra a la escena</p>
                  <h2
                    className="font-display text-[clamp(1.3rem,5.6vw,1.55rem)] leading-tight text-white sm:text-2xl break-words"
                    style={{ textWrap: 'balance' }}
                  >
                    Habita los sentimeintos de Silvestre
                  </h2>
                  <p className="text-sm text-slate-300/80 break-words">
                    Así como una misma frase no suena igual con otra emoción, aquí lo conciencia de la obra cambia cuando tu intención cambia.
                    <br />
                    </p>
                </div>

                <div ref={obraModesRef} className="space-y-3">
                  {VOICE_MODES.map((mode) => {
                    const isActiveMode = activeModeId === mode.id;

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
                                secondaryCtaVisible={isMobileViewport}
                                secondaryCtaCopy={mobileSecondaryCtaCopy}
                                secondaryCtaDisabled={mobileSecondaryCtaDisabled}
                                secondaryCtaEmphasis={mobileSecondaryCtaEmphasis}
                                onMicClick={() => handleOpenSilvestreChatCta(activeModeId)}
                                onPlayPending={handlePlayPendingAudio}
                                onSecondaryCtaClick={handleMobileObraSecondaryCta}
                                tone={activeTint}
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
                        onClick={() => handleSelectMode(mode.id)}
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

              <div className="order-5 min-w-0 lg:order-none rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Voces de la comunidad</p>
                  <RelatedReadingTooltipButton
                    slug={latestSceneReading?.slug}
                    authorLabel={sceneReadingAuthorLabel}
                    thumbnailUrl={sceneReadingThumbnailUrl}
                    ariaLabel="Mostrar lectura relacionada de Escena"
                    tone="cyan"
                  />
                </div>
                <div className="max-h-[240px] form-surface relative overflow-y-auto px-3 py-3 pr-2">
                  {communityLoading ? (
                    <p className="px-1 py-2 text-sm text-slate-600/85">Cargando comentarios...</p>
                  ) : communityError ? (
                    <p className="px-1 py-2 text-sm text-rose-700/85">{communityError}</p>
                  ) : communityComments.length ? (
                    <div className="space-y-2.5">
                      {communityComments.map((comment) => (
                        <div
                          key={`portal-voz-comment-${comment.id}`}
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
                    <p className="px-1 py-2 text-sm text-slate-600/85">Todavía no hay voces en este miniverso.</p>
                  )}
                </div>
                <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500/85">
                  Desliza para leer más voces
                </p>
                <div className="pt-4 mt-1 border-t border-white/10">
                  <div className="mx-auto w-full max-w-md">
                    <button
                      type="button"
                      className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                      onClick={handleOpenCommunityComposer}
                    >
                      coméntanos algo
                    </button>
                  </div>
                </div>

                <ShowcaseReactionInline
                  title="Resonancia colectiva"
                  description="Haz clic para dejar un pulso que mantenga viva la conversación."
                  buttonLabel="Enviar pulsaciones"
                  status={reactionStatus}
                  onReact={handleSendPulse}
                />
              </div>
            </div>

            <div className="order-2 min-w-0 space-y-6 lg:order-none">
              <div
                ref={obraDetonadoresRef}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-6"
                style={{ borderColor: activeTint?.border, boxShadow: activeTint?.glow }}
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 opacity-35 bg-gradient-to-br ${activeMode.accent}`}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage: `radial-gradient(circle at top, ${activeTint?.dot || 'rgba(196,181,253,0.6)'}, transparent 65%)`,
                  }}
                />
                <div className="relative z-10">
                  {visibleStarters.length ? (
                    <ObraQuestionList
                      starters={visibleStarters}
                      spentSet={activeModeSpentSet}
                      questionProgressMap={questionProgressMap}
                      questionProgressTotal={VOICE_MODES.length}
                      onSelect={(starter) => handleUseSilvestreStarter(starter, activeModeId)}
                      variant="stack"
                      elevatedStarter={elevatedSilvestreStarter}
                      elevatedCopy="Pruébala con otra emoción"
                      tone={{
                        borderColor: activeTint?.border,
                        dotColor: activeTint?.dot,
                        headingColor: activeTint?.dot,
                      }}
                      eyebrowChip={activeMode?.description || ''}
                      cornerIcon={activeMode?.icon || null}
                      cornerIconLabel={`Perfil activo: ${activeMode?.title || ''}`}
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-pink-200" style={{ color: activeTint?.dot }}>
                        Detonadores escénicos
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
                          background: 'radial-gradient(circle at 34% 26%, rgba(148,163,184,0.52), rgba(15,23,42,0.04) 68%)',
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
                      <p className="text-[10px] uppercase tracking-[0.34em] text-cyan-200/95">Beta · Afinación colectiva</p>
                      <p className="text-sm font-semibold text-slate-100">Mockup del registro emocional de Silvestre</p>
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
                      <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/90">Métrica ficticia</p>
                      <span className="text-[11px] text-slate-300/80">{collectiveSyntheticSessions} sesiones simuladas</span>
                    </div>
                    <p className="text-xs text-slate-200/90 leading-relaxed">
                      Frase más usada vs uso de frases originales en el chat colectivo.
                    </p>
                    <p className="text-xs italic text-slate-200/90">"{collectivePhraseMetric.phrase}"</p>

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

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="obra_escenica"
        />
      </div>
    </div>
  );
};

export default PortalVoz;
