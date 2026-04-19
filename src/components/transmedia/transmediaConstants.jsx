import {
  Feather,
  Scan,
  CheckCircle2,
  Zap,
  Wrench,
  Heart,
  Layers,
  Flame,
  Drama,
  Coffee,
  BookOpen,
  Palette,
  Film,
  Music,
  MapIcon,
  Dice5,
  Brain,
  Map,
  Users,
  RadioTower,
  HeartHandshake,
  Smartphone,
} from 'lucide-react';
import { OBRA_CONVERSATION_STARTERS } from '@/lib/obraConversation';
import { safeGetItem } from '@/lib/safeStorage';
import { normalizeBridgeKey } from '@/lib/bienvenidaBridge';

export const GAT_COSTS = {
  quironFull: 300,
  graficoSwipe: 110,
  novelaChapter: 150,
  sonoroMix: 130,
  tazaActivation: 90,
  movimientoRuta: 280,
};
export const INITIAL_GAT_BALANCE = 0;
export const OBRA_VOICE_MIN_GAT = 25;
export const OBRA_VOICE_PRECARE_TURN_THRESHOLD = 2;
export const OBRA_VOICE_PRECARE_THRESHOLD_GAT = OBRA_VOICE_MIN_GAT * OBRA_VOICE_PRECARE_TURN_THRESHOLD;
export const SHOWCASE_REVEAL_REWARD_GAT = {
  apps: 20,
  oraculo: 20,
};
export const SHOWCASE_REQUIRED_GAT = {
  miniversos: OBRA_VOICE_MIN_GAT,
  copycats: 150,
  miniversoGrafico: GAT_COSTS.graficoSwipe,
  miniversoNovela: 25,
  miniversoSonoro: GAT_COSTS.sonoroMix,
  lataza: 30,
  miniversoMovimiento: 0,
  apps: 150,
  oraculo: 0,
};
export const MOVEMENT_COLLABORATOR_CALL_ITEMS = [
  'Intérpretes y bailarines por ciudad',
  'Diseño y desarrollo de skins digitales',
  'Asistencia en captura de movimiento',
  'Espacios para activación urbana',
  'Comunidad interesada en exploración corporal',
];
export const LEGACY_TAZA_VIEWER_ENABLED = false;
export const SHOWCASE_BADGE_IDS = [
  'miniversos',
  'lataza',
  'miniversoNovela',
  'miniversoGrafico',
  'copycats',
  'miniversoSonoro',
  'miniversoMovimiento',
  'oraculo',
  'apps',
];
export const EXPLORER_BADGE_STORAGE_KEY = 'gatoencerrado:explorer-badge';
export const HERO_PENDING_MINIVERSE_SELECTION_KEY = 'gatoencerrado:hero-inline-miniverse-selection';
export const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';
export const getInitialInstallPwaCTAVisibility = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
  const isStandalone =
    Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
    Boolean(typeof navigator !== 'undefined' && navigator.standalone === true);
  return isMobile && !isStandalone;
};
export const EXPLORER_BADGE_REWARD = 1000;
export const EXPLORER_BADGE_NAME = 'Errante Consagrado';
export const ENABLE_SHOWCASE_AUTO_CYCLE = false;
export const SHOWCASE_AUTO_CYCLE_INTERVAL_MS = 9000;
export const SHOWCASE_OPEN_TRANSITION = {
  dimMs: 120,
  blackoutMs: 90,
  revealMs: 220,
};
export const INTERACTIVE_EXPERIENCE_GOAL = 'interactive_experience_placeholder';
export const DEFAULT_BADGE_STATE = {
  unlocked: false,
  unlockedAt: null,
  rewardClaimed: false,
  claimedAt: null,
  claimedType: null,
};
export const requestCameraAccess = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia no disponible en este navegador');
  }
  const attempts = [
    { video: true },
    { video: {} },
    { video: { facingMode: 'environment' } },
    { video: { facingMode: { ideal: 'environment' } } },
    { video: { facingMode: { ideal: 'user' } } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
  ];
  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      lastError = error;
      // Si falló por restricciones o permisos, probamos el siguiente intento.
      continue;
    }
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    for (const device of videoInputs) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: device.deviceId } },
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
  } catch (error) {
    lastError = error;
  }

  throw lastError ?? new Error('No pudimos usar la cámara en este dispositivo.');
};
export const MINIVERSO_TILE_GRADIENTS = {
  miniversos: 'linear-gradient(135deg, rgba(31,21,52,0.95), rgba(64,36,93,0.85), rgba(122,54,127,0.65))',
  copycats: 'linear-gradient(135deg, rgba(16,27,54,0.95), rgba(38,63,109,0.85), rgba(92,47,95,0.7))',
  miniversoGrafico: 'linear-gradient(135deg, rgba(37,19,52,0.95), rgba(70,32,86,0.85), rgba(141,58,121,0.65))',
  miniversoNovela: 'linear-gradient(135deg, rgba(26,24,60,0.95), rgba(59,43,95,0.85), rgba(108,56,118,0.7))',
  miniversoSonoro: 'linear-gradient(135deg, rgba(18,29,62,0.95), rgba(32,65,103,0.85), rgba(70,91,146,0.65))',
  lataza: 'linear-gradient(135deg, rgba(44,20,30,0.95), rgba(101,45,66,0.85), rgba(196,111,86,0.6))',
  miniversoMovimiento: 'linear-gradient(135deg, rgba(24,30,45,0.95), rgba(40,64,65,0.85), rgba(74,123,102,0.65))',
  apps: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(22,163,74,0.75), rgba(34,211,238,0.65))',
  oraculo: 'linear-gradient(135deg, rgba(38,18,56,0.95), rgba(86,33,115,0.85), rgba(168,68,139,0.65))',
  default: 'linear-gradient(135deg, rgba(20,14,35,0.95), rgba(47,28,71,0.85), rgba(90,42,100,0.65))',
};
export const MINIVERSO_TILE_COLORS = {
  miniversos: {
    background: 'rgba(31,21,52,0.75)',
    border: 'rgba(186,131,255,0.35)',
    text: '#e9d8ff',
    accent: '#f4c8ff',
  },
  copycats: {
    background: 'rgba(16,27,54,0.75)',
    border: 'rgba(132,176,255,0.35)',
    text: '#dbeafe',
    accent: '#c6f6ff',
  },
  miniversoGrafico: {
    background: 'rgba(37,19,52,0.75)',
    border: 'rgba(214,146,255,0.35)',
    text: '#fce7f3',
    accent: '#fed7e2',
  },
  miniversoNovela: {
    background: 'rgba(26,24,60,0.75)',
    border: 'rgba(163,148,255,0.35)',
    text: '#e0e7ff',
    accent: '#c7d2fe',
  },
  miniversoSonoro: {
    background: 'rgba(18,29,62,0.75)',
    border: 'rgba(122,179,255,0.35)',
    text: '#e0f2fe',
    accent: '#bae6fd',
  },
  lataza: {
    background: 'rgba(44,20,30,0.75)',
    border: 'rgba(255,173,145,0.35)',
    text: '#ffedd5',
    accent: '#fed7aa',
  },
  miniversoMovimiento: {
    background: 'rgba(24,30,45,0.75)',
    border: 'rgba(163,233,208,0.35)',
    text: '#d1fae5',
    accent: '#a7f3d0',
  },
  apps: {
    background: 'rgba(16,185,129,0.18)',
    border: 'rgba(110,231,183,0.45)',
    text: '#d1fae5',
    accent: '#99f6e4',
  },
  oraculo: {
    background: 'rgba(38,18,56,0.75)',
    border: 'rgba(225,160,235,0.35)',
    text: '#fbe7ff',
    accent: '#f3d1ff',
  },
  default: {
    background: 'rgba(20,14,35,0.7)',
    border: 'rgba(186,131,255,0.3)',
    text: '#f3e8ff',
    accent: '#e9d8fd',
  },
};
export const VITRINA_MIRROR_EFFECTS = {
  copycats: {
    '--mirror-tint-rgb': '255, 196, 120',
    '--mirror-speed': '6.4s',
    '--mirror-angle': '18deg',
    '--mirror-width': '44%',
    '--mirror-blur': '0.55px',
    '--mirror-opacity': '0.44',
  },
  miniversoSonoro: {
    '--mirror-tint-rgb': '165, 219, 255',
    '--mirror-speed': '7.2s',
    '--mirror-angle': '14deg',
    '--mirror-width': '52%',
    '--mirror-blur': '0.9px',
    '--mirror-opacity': '0.34',
  },
  oraculo: {
    '--mirror-tint-rgb': '226, 184, 255',
    '--mirror-speed': '8.4s',
    '--mirror-angle': '24deg',
    '--mirror-width': '40%',
    '--mirror-blur': '0.75px',
    '--mirror-opacity': '0.32',
  },
  lataza: {
    '--mirror-tint-rgb': '255, 214, 168',
    '--mirror-speed': '7.6s',
    '--mirror-angle': '16deg',
    '--mirror-width': '46%',
    '--mirror-blur': '0.65px',
    '--mirror-opacity': '0.35',
  },
  default: {
    '--mirror-tint-rgb': '215, 190, 255',
    '--mirror-speed': '7.8s',
    '--mirror-angle': '22deg',
    '--mirror-width': '46%',
    '--mirror-blur': '0.6px',
    '--mirror-opacity': '0.34',
  },
};
export const ORACULO_URL = (() => {
  const raw =
    import.meta.env?.VITE_BIENVENIDA_URL ??
    import.meta.env?.VITE_ORACULO_URL ??
    (import.meta.env?.DEV ? 'http://localhost:5174' : '');
  return raw ? raw.replace(/\/+$/, '') : '';
})();
export const CAUSE_SITE_URL = 'https://www.ayudaparalavida.com/index.html';
export const TOPIC_BY_SHOWCASE = {
  miniversos: 'obra_escenica',
  copycats: 'cine',
  miniversoGrafico: 'graficos',
  miniversoNovela: 'novela',
  miniversoSonoro: 'sonoro',
  miniversoMovimiento: 'movimiento',
  lataza: 'artesanias',
  apps: 'apps',
  oraculo: 'oraculo',
};
// Enable the editorial shield only when explicitly requested.
export const MINIVERSO_EDITORIAL_INTERCEPTION_ENABLED =
  import.meta.env?.VITE_MINIVERSO_INTERCEPTION === 'true';
export const CONTRIBUTION_CATEGORY_BY_SHOWCASE = {
  miniversos: 'obra_escenica',
  copycats: 'cine',
  miniversoGrafico: 'grafico',
  miniversoNovela: 'miniverso_novela',
  miniversoSonoro: 'sonoro',
  miniversoMovimiento: 'movimiento',
  lataza: 'taza',
  apps: 'apps',
  oraculo: 'oraculo',
};
export const BLOG_MINIVERSO_KEYS_BY_SHOWCASE = {
  miniversos: ['obra_escenica', 'miniversos', 'obra'],
  copycats: ['cine', 'copycats'],
  miniversoGrafico: ['graficos', 'grafico', 'miniversografico'],
  miniversoNovela: ['novela', 'miniversonovela', 'literatura'],
  miniversoSonoro: ['sonoro', 'miniversosonoro', 'sonoridades'],
  miniversoMovimiento: ['movimiento', 'miniversomovimiento'],
  lataza: ['artesanias', 'taza', 'lataza'],
  apps: ['apps', 'juegos'],
  oraculo: ['oraculo'],
};
export const readStoredJson = (key, fallback) => {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

export const readStoredInt = (key, fallback) => {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const readStoredBool = (key, fallback = false) => {
  const raw = safeGetItem(key);
  if (raw === null || raw === undefined) return fallback;
  return raw === 'true';
};

export const buildShowcaseEnergyFromBoosts = (baseEnergyByShowcase = {}, boosts = {}) => {
  const next = {};
  Object.entries(baseEnergyByShowcase).forEach(([showcaseId, baseAmount]) => {
    const amount = Number.isFinite(baseAmount) ? Number(baseAmount) : 0;
    next[showcaseId] = boosts?.[showcaseId] ? amount + amount : amount;
  });
  return next;
};

export const buildShowcaseRewardLabel = (entry) => {
  if (!entry) return null;
  const reward = Number.isFinite(entry.reward) ? Math.max(entry.reward, 0) : 0;
  return entry.claimed
    ? `MINI-VERSO LEÍDO · +${reward} GAT`
    : null;
};

export const buildShowcaseEnergyState = (availableGAT) => {
  const safeAvailable = Number.isFinite(availableGAT) ? Math.max(Math.trunc(availableGAT), 0) : 0;
  if (safeAvailable <= 0) {
    return {
      label: 'Energía agotada',
      amount: '0 GAT',
      className: 'text-rose-300/95',
    };
  }
  return {
    label: 'Energía disponible',
    amount: `${safeAvailable} GAT`,
    className: 'text-emerald-200/95',
  };
};

export const buildShowcaseMinRequiredCopy = (showcaseId) => {
  const required = Number(SHOWCASE_REQUIRED_GAT[showcaseId] ?? 0);
  if (!Number.isFinite(required) || required <= 0) {
    return 'mínima requerida 0 GAT';
  }
  return `mínima requerida ${Math.max(Math.trunc(required), 0)} GAT`;
};
export const MINIVERSO_VERSE_EFFECTS = {
  miniversoNovela: 'flip',
  miniversoSonoro: 'flip',
  lataza: 'flip',
  copycats: 'flip',
  miniversos: 'flip',
  miniversoGrafico: 'flip',
  miniversoMovimiento: 'flip',
  oraculo: 'flip',
  default: 'flip',
};

export function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
export const OBRA_VOICE_MODES = [
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
export const DEFAULT_OBRA_VOICE_MODE_ID = OBRA_VOICE_MODES[0].id;
export const MOBILE_OBRA_SECONDARY_CTA_STATES = {
  READ_SCRIPT: 'read-script',
  TRY_OTHER_EMOTION: 'try-other-emotion',
  LAUNCH_PHRASE: 'launch-phrase',
};
export const normalizeSilvestrePrompt = (value) => (typeof value === 'string' ? value.trim() : '');
export const OBRA_EMOTION_LOG_STORAGE_KEY = 'gatoencerrado:obra-emotion-log';
export const OBRA_EMOTION_ORBS_STORAGE_KEY = 'gatoencerrado:obra-emotion-orbs';
export const OBRA_EMOTION_MAX_ORBS = 36;
export const OBRA_EMOTION_ORB_VERSION = 2;
export const OBRA_EMOTION_MODE_REGIONS = {
  'confusion-lucida': { left: 50, top: 24, spreadX: 7, spreadY: 7, size: 14 },
  'sospecha-doctora': { left: 38, top: 38, spreadX: 10, spreadY: 8, size: 15 },
  'necesidad-orden': { left: 52, top: 52, spreadX: 10, spreadY: 9, size: 16 },
  'humor-negro': { left: 62, top: 40, spreadX: 10, spreadY: 8, size: 15 },
  'cansancio-mental': { left: 40, top: 64, spreadX: 11, spreadY: 10, size: 17 },
  'atraccion-incomoda': { left: 46, top: 48, spreadX: 12, spreadY: 10, size: 16 },
  vertigo: { left: 58, top: 70, spreadX: 9, spreadY: 9, size: 16 },
  rabia: { left: 70, top: 30, spreadX: 13, spreadY: 11, size: 18 },
  default: { left: 50, top: 50, spreadX: 11, spreadY: 11, size: 15 },
};
export const clampEmotionValue = (value, min, max) => Math.max(min, Math.min(max, value));
export const resolveEmotionRegion = (modeId) => OBRA_EMOTION_MODE_REGIONS[modeId] ?? OBRA_EMOTION_MODE_REGIONS.default;
export const createEmotionOrb = (modeId, seed, index = 0) => {
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
export const normalizeStoredEmotionOrbs = (raw) => {
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
export const showcaseDefinitions = {
  miniversos: {
    label: 'Drama',
    type: 'tragedia',
    intro:
      'Los estados emocionales de Silvestre no son etiquetas. Son lugares donde la escena ocurre. Di una frase —tuya o del libreto— y escucha cómo la obra responde desde adentro. Luego cambia de emoción y detona la misma frase otra vez. La escena nunca responde igual.',
    introNode: (
      <>
        <p className="text-base leading-relaxed text-neutral-300">
          Este miniverso existe para habitar los estados emocionales de <strong>Silvestre</strong> desde dentro de la obra.{' '}
          Aquí puedes escuchar fragmentos dramáticos y recorrer distintos sentimientos mientras la escena se despliega en tu mente.
        </p>
        <p className="text-lg leading-relaxed font-medium text-white mt-4">
          A veces no necesitamos una conversación. A veces sólo necesitamos <strong>escuchar el drama por un rato</strong>.
        </p>
      </>
    ),
    cartaTitle: '#LaPuertaInvisible',
    notaAutoral: 'Entré sin saber.\nAlgo dijo mi nombre.\nY ya no hubo salida.',

    ctaLabel: 'Habla conmigo',
    conversationStarters: OBRA_CONVERSATION_STARTERS,
iaProfile: {
  type: 'Una voz que no es personaje ni herramienta: es la conciencia de la obra en proceso.',
  interaction: 'Elige una emoción de Silvestre. Habla desde ahí. La obra responderá diferente al cambiar de emoción.',
  tokensRange: 'Lo suficiente para decir algo sin agotarlo.',
  coverage: 'Existe mientras haya quienes la convoquen.',
  footnote: 'No todas las voces quieren durar. Gracias por dejarlas pasar.',
},
    collaborators: [
      {
        id: 'carlos-perez',
        name: 'Carlos Pérez',
        role: 'Coordinador de diálogo',
        bio: 'Mi trabajo se enfocó en pensar cómo la experiencia escénica podía continuar más allá de la función, no desde la explicación, sino desde preguntas cuidadas y abiertas. Diseñé este espacio que respeta la ambigüedad de la obra y acompaña al espectador sin imponer interpretaciones.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/autores/carlos_perez_avatar.png',
      },
      {
        id: 'incendio-producciones',
        name: 'Incendio Producciones',
        role: 'Producción ejecutiva asociada',
        bio: 'Esta versión del chat fue adaptada para acompañar la puesta en escena de Gilberto Corrales. El trabajo de dirección y producción transformó la obra, y este espacio fue ajustado para dialogar con esa nueva forma.',
        image: '/assets/incendiologo.png',
      },
    ],
  },
  copycats: {
    label: 'Mini-verso cine',
    shareLabel: 'Cine',
    type: 'cinema',
    intro: 'El cine dentro de #GatoEncerrado es otro modo de entrar al encierro.',
    promise: 'CopyCats (no-ficción) y Quirón (autoficción) dialogan desde extremos distintos del mismo espectro: una filma el desgaste creativo y la fractura del proceso; la otra abre una confesión íntima que decide hablar del suicidio sin rodeos.',
    theme:
      'Dos películas, dos vulnerabilidades distintas, un mismo impulso: usar el arte para tocar aquello que no queremos decir en voz alta y encontrar otra manera de contarlo.',
    tone: ['Premiere íntima', 'Laboratorio abierto', 'Cine con memoria'],
    cartaTitle: '#LuzQueEditas',
    copycats: {
      title: 'CopyCats',
      description: 'CopyCats observa el acto de crear mientras ocurre. Un cine-ensayo sobre repetición, desgaste creativo y el extraño momento en que una obra empieza a copiarse a sí misma.',

      assets: [
        {
          id: 'copycats-carta',
          label: 'Ensayo abierto (4:27)',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Cadena_Gesto_small.mp4',
        },
      ],
      tags: ['teaser', 'Identidad Digital', 'Archivo autoficcional'],
    },
    quiron: {
      title: 'Quirón',
      description: 'Mira el teaser de un cortometraje que explora la vulnerabilidad donde casi nunca se nombra.',
            tags: ['Cine-ensayo', 'Identidad Digital', 'Archivo autoficcional'],


      fullVideo: {
        id: 'quiron-full',
        label: 'Cortometraje completo',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron_10min.mp4',
        bucket: 'Cine - teasers',
        path: 'Quiron_10min.mp4',
      },
      teaser: {
        id: 'quiron-teaser',
        label: 'Teaser oficial',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron_small.mp4',
      },

    },
    collaborators: [
      {
        id: 'viviana-gonzalez',
        name: 'Viviana González',
        role: 'Dirección y fotografía · CopyCats / Quirón',
        bio: 'Viviana acompaña al Cine de #GatoEncerrado con una mirada que piensa. Comunicóloga y docente en la Ibero, su experiencia ilumina procesos más que superficies. Fue quien sostuvo el pulso visual de Quirón y CopyCats: cámara, escucha y diálogo creativo continuo. Su presencia abrió rutas nuevas para traducir lo íntimo, lo incierto y lo que apenas empieza a nacer en pantalla',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/viviana_gg.jpeg',
        anchor: '#team',
      },
      {
        id: 'diego-madera',
        name: 'Diego Madera',
        role: 'Compositor · Tema musical',
        bio: 'Diego tiende puentes entre emoción y estructura. Compositor de formación precisa y sensibilidad abierta, su música respira junto al material filmado: acompaña, sostiene y revela. En el Cine de #GatoEncerrado, sus partituras funcionan como una línea de vida, un lugar donde el caos ordena su ritmo. Es también maestro de piano, y esa pedagogía silenciosa terminó resonando en la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
        anchor: '#team',
      },
       {
        id: 'lia-perez',
        name: 'Lía Pérez, MPSE',
        role: 'Diseño Sonoro & Pulso emocional',
        bio: 'Lía se sumó a Cine de #GatoEncerrado con una entrega luminosa: sin pedir nada a cambio y afinando cada capa de sonido en Quirón y CopyCats. Su oído construye atmósferas que no se escuchan: se sienten. Entre risas, ruidos, silencios y tormentas interiores, su trabajo sostuvo el timbre emocional de las piezas y dejó una huella discreta, pero imprescindible.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
      },
      {
        id: 'maria-diana-laura-rodriguez',
        name: 'María Diana Laura Rodriguez',
        role: 'Producción en línea & Cuerpo en escena',
        bio: 'María Diana Laura llegó a este miniverso cinematográfico desde dos frentes: coordinó la producción en línea del cortometraje y encarnó a Cirila en el oráculo, llevando esa figura entre lo ritual y lo doméstico a la pantalla. Su energía organizativa y su presencia performática sostuvieron momentos clave del proceso, dejando constancia de que producir también es un acto de imaginación.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariadianalaura.jpg',
        anchor: '#team',
      },
      {
        id: 'tania-fraire',
        name: 'Tania Fraire Vázques',
        role: 'Autoficción (Quirón) · Intérprete natural en pantalla',
        bio: 'Tania llegó a este proyecto transmedia desde la autoficción, pero pronto reveló algo más: una actriz natural, sin artificio, capaz de sostener la cámara como si respirara con ella. En la proyección privada de Quirón, el maestro Gilberto Corrales lo señaló con asombro: su actuación encendía la escena desde un lugar genuino, vulnerable y preciso. Su participación abrió una grieta luminosa por donde la historia pudo volverse más humana. Tania colabora en una non-profit, es diseñadora gráfica y transfronteriza de corazón.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/tania.jpg',
        anchor: '#team',
      },
      {
        id: 'briseida-lopez-inzunza',
        name: 'Briseida López Inzunza',
        role: 'Artista escénica · Voz en off (Copycats)',
        bio: 'Artista escénica mexicana con trayectoria en danza, actuación, coreografía y pedagogía. Su labor une la destreza emocional del cuerpo con la claridad dramática, explorando el movimiento como lenguaje narrativo. En Copycats, su voz en off aporta una presencia sensible y profunda que acompaña y amplifica la experiencia de la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/BriseidaLopez.jpg',
        anchor: '#team',
      },
    ],

    proyeccion: {
      title: '🗓️ Mayo 2026 · Cineteca CECUT',
      description:
        'Forma parte de la primera proyección doble de CopyCats + Quirón, con conversatorio del equipo y sonido Dolby Atmos diseñado por Concrete Sounds.',
      cta: 'Quiero ser parte de la proyección',
      footnote: 'Registro de interés activo. Espera noticias.',
    },
    notaAutoral: 'Memoria encendida.\nCámara despierta.\nY el tiempo la vuelve a montar.',
    iaProfile: {
      type: 'GPT-4o mini + subtítulos vivos y notas críticas asistidas.',
      interaction: 'Notas críticas y captions contextuales por espectador.',
      tokensRange: '200–450 tokens por visita.',
      coverage: 'Incluido en la activación de huellas.',
      footnote: 'La IA acompaña la mirada; la decisión sigue siendo humana.',
    },
  },
  lataza: {
    label: 'Artesanías',
    type: 'object-webar',
    slug: 'taza-que-habla',
    subtitle: 'Esta no es una taza. Es un umbral.',
    intro:
      (
<>
  <p className="text-base leading-relaxed text-slate-300">
    Un objeto cotidiano convertido en <strong>símbolo de comunión</strong>.<br/>
    Cada pieza está vinculada a un sentimiento; cada sentimiento, a una historia personal.
  </p>

  <p className="text-base leading-relaxed text-slate-300 mt-3">
    En el universo #GatoEncerrado, las artesanías no son simple mercancía ni souvenir. 
    Son pequeñas piezas narrativas que acompañan conversaciones, silencios y momentos de reflexión compartida.
  </p>

          <p className="text-lg leading-relaxed font-medium text-white mt-4">
    A veces las historias aparecen mientras sostenemos algo entre las manos.
  </p>
</>
),
    note: 'Apunta tu cámara y aparecerá tu frase',
    ctaLabel: 'Activa tu taza',
    ctaMessage: 'Cuando liberes la activación WebAR, descubrirás la pista que le corresponde a tu taza.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza_h.png',
    phrases: ['La taza te habla.'],
    instructions: [
      'Permite el acceso a tu cámara para iniciar.',
      'Coloca la taza completa en cuadro, con buena iluminación.',
      'Mantén el marcador visible hasta que aparezca una orbe.',
    ],
    collaborators: [
       {
        id: 'miroslava-wilson',
        name: 'Miroslava Wilson',
        role: 'Vinculación y gestión institucional',
        bio: 'Miroslava acompañó el proceso que permitió integrar la taza al circuito institucional del CECUT, facilitando su presencia como parte de la preventa de la obra. Su gestión ayudó a tender el puente entre el objeto y el espacio escénico.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Miroslava%20.jpg',
      },
      {
        id: 'taller-paco-padilla',
        name: 'Taller Paco Padilla',
        role: 'Cerámica artesanal de Tlaquepaque',
        bio: 'Referente de la cerámica artesanal de Tlaquepaque.El Taller Paco Padilla puso sus manos y su fuego en la primera serie de tazas del universo. Cada pieza salió de su horno con una vibración artesanal única, sosteniendo en barro el pulso íntimo de Gato Encerrado y regalándole un hogar físico a lo que antes era solo símbolo.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/pacopadilla.jpeg',
      },

      {
        id: 'yeraldin-roman',
        name: 'Yeraldín Román',
        role: 'Diseño gráfico, fotografía y enlace local',
        bio: 'Desde su experiencia en diseño gráfico, afinó la estética de la taza. Fue la primera en tenerla en sus manos y fotografiarla. En su trabajo continuo con Isabel Ayuda para la Vida y en este miniverso, se encargó de registrar marcas que hacen de #GatoEncerrado un universo.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/yeraldin.png',
      },
         {
        id: 'rocio-morgan',
        name: 'Rocío Morgan',
        role: 'Coordinación de entregas',
        bio: 'Rocío coordinó la entrega de las primeras tazas como un gesto de agradecimiento dentro del proceso de Es un gato encerrado, cuidando que llegaran tanto al equipo como a personas cercanas al proyecto. Marcando así las primeras activaciones de nuestro primer objeto artesanal.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rocio.jpg',
      },
    ],
    comments: [
      {
        id: 'la-taza-comment-1',
        quote: '"La taza me mostró una frase que me persiguió toda la semana."',
        author: 'Usuario anónimo',
      },
      {
        id: 'la-taza-comment-2',
        quote: '"No entendí nada… hasta que le agarré el modo."',
        author: 'Sofía B.',
      },
    ],
    cartaTitle: '#ElSentidoEnLasManos',
    notaAutoral: 'Tomé un objeto.\nSu forma me sostuvo.\nSu sentido calmó mis manos.',
    iaProfile: {
      type: 'IA ligera para pistas contextuales + WebAR.',
      interaction: '1 activación guiada por objeto (escaneo breve).',
      tokensRange: '90–140 tokens por activación.',
      coverage: 'Cubierto por suscriptores; no hay costo directo por usuario.',
      footnote: 'La IA solo guía la pista; el ritual lo completa quien sostiene la taza.',
    },
  },
  miniversoNovela: {
    label: 'Literatura',
    type: 'blog-series',
    slug: null,
    intro:
      'En este miniverso literario se entiende la escritura como una forma de expansión. No es un complemento de la obra escénica, sino un espacio propio donde fragmentos, voces, poemas y apuntes dialogan entre sí y amplían el universo #GatoEncerrado.',
    cartaTitle: '#LaPreguntaInsiste',
    notaAutoral:
      'Escribí para entender\ny la página me abrió otra pregunta.',
    collaborators: [
      {
        id: 'pepe-rojo',
        name: 'Pepe Rojo',
        role: 'Escritor y crítico cultural',
        bio: 'Pepe Rojo acompañó la literatura de este miniverso con una lectura precisa y generosa. Autor emblemático de la narrativa fronteriza, ofreció el prólogo de Mi Gato Encerrado, abriendo el libro desde una mirada que entiende el artificio, la herida y la imaginación como un mismo territorio. Su intervención dio claridad y ruta al futuro de la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/peperojo.jpeg',
      },
      {
        id: 'groppe-imprenta',
        name: 'Groppe Libros',
        role: 'Edición física',
        bio: 'Acompañaron la primera edición física de Mi Gato Encerrado con oficio paciente y preciso. Pusieron forma donde antes había solo palabras: papel, tinta y cuidado. Gracias a su trabajo, este universo encontró también su cuerpo de libro.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/groppelibros.png',
      },
    ],
    entries: [
      {
        id: 'compra-libro',
        title: 'Despierta dentro del libro',
        description:
          'Lectura como acto de conciencia: cruzar sus páginas es recorrer la mente misma.',
        image: '/assets/edicion-fisica.png',
        type: 'purchase-link',
        url: '/comprar-novela',
        snippet: {
          tagline: 'Tu ejemplar como portal',
          text:
            'Escanea el QR de tu libro para acceder a lecturas ocultas y conversaciones con otros lectores del universo #GatoEncerrado.',
        },
        app: {
          id: 'autoficcion-app',
          ctaLabel: 'Leer fragmentos',
          ctaAction: 'openAutoficcionPreview',
        },
      },
      {
        id: 'comentarios-lectores',
        title: 'Ecos del Club de Lectura',
        type: 'quotes',
        quotes: [
          {
            quote: '"No sabía que un libro podía hablarme a mitad de la página."',
            author: 'Lectora anónima',
          },
          {
            quote:
              '"Volví a subrayar y entendí que la obra también estaba escribiendo mi propia memoria."',
            author: 'Club de Lectura Frontera',
          },
        ],
      },
    ],
    ctaLabel: 'Leer los primeros fragmentos',
    iaProfile: {
      type: 'GPT-4o mini + voz sintética para fragmentos.',
      interaction: 'Guía de lectura y acompañamiento breve por capítulo.',
      tokensRange: '150–320 tokens por fragmento leído.',
      coverage: 'Cubierto por suscriptores; lectura sin costo adicional.',
      footnote: 'La IA susurra; la historia sigue siendo tuya.',
    },
  },
  miniversoSonoro: {
    label: 'Sonoridades',
    type: 'audio-dream',
    intro:
      <p>Sonoridades reúne la música original y el diseño sonoro creados para la obra, junto con piezas que expanden su universo más allá del escenario. <br/><br/>En la puesta, el sonido no acompañó la historia: la transformó.
Abrió una experiencia inmersiva donde la resonancia modifica la percepción del tiempo, del cuerpo y del espacio. <br/><br/>
Este espacio permite recorrer esas composiciones, explorar sus capas y descubrir cómo lo audible deja huella incluso cuando la escena ya terminó. <br/><br/> Aquí, cada visita es una mezcla nueva, un sueño que se reinventa con cada escucha.</p>,
    highlights: [
      'Video que fluye solo.',
      'Música que tú eliges.',
      'Poemas que respiran en pantalla.',
    ],
    exploration: [
      'El video corre por su cuenta — cambia con cada visita.',
      'Tú eliges la música — ajusta el ánimo del sueño.',
      'Escoge un poema — y observa cómo se desliza mientras todo ocurre.',
    ],
    closing: [
      'Sueño en tres capas',
      'Cada combinación abre un sueño distinto.',
      'Entra y crea el tuyo.',
    ],
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/videos-v/Vacio.mov',
    musicOptions: [
      {
        id: 'silencio',
        label: 'Silencio',
        url: '',
      },
      {
        id: 'ensayo-abierto',
        label: 'Ensayo Abierto (pista)',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/cat_theme.m4a',
      },
    ],
    poems: [
      {
        id: 'pulmon',
        label: 'Poema 1 — "Pulmón"',
        text: 'La noche se abre como un pulmón cansado.',
      },
      {
        id: 'cuerpo',
        label: 'Poema 2 — "Cuerpo"',
        text: 'Lo que cae del sueño también cae del cuerpo.',
      },
    ],
    cartaTitle: '#LoQueSuenaAdentro',
    notaAutoral: 'Abrí los ojos.\nLa resonancia era antigua.\nComo el silencio.',
    iaProfile: {
      type: 'GPT-4o mini para poemas móviles + curaduría sonora.',
      interaction: 'Selección de poema y mezcla guiada.',
      tokensRange: '130–280 tokens por mezcla.',
      coverage: 'Incluido en la huella transmedia.',
      footnote: 'La IA elige la forma; tú eliges el ánimo.',
    },
    collaborators: [
      {
        id: 'lia-perez',
        name: 'Lía Pérez, MPSE',
        role: 'Diseño Sonoro',
        bio: 'Artista sonora con más de doce años de experiencia. Fundadora de Concrete Sounds, ha colaborado en filmes como "Ya no estoy aquí" y "Monos". Su especialidad es la creación de paisajes inmersivos que amplían la dimensión sensorial del teatro.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
      },
      {
        id: 'diego-madera',
        name: 'Diego Madera',
        role: 'Compositor',
        bio: 'Músico y compositor cuyo trabajo explora la tensión entre sonido y silencio. Su pieza original acompaña los pasajes emocionales de la obra.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
      },
    ],
    comments: [
      {
        id: 'sonoro-comment-1',
        quote: '"La mezcla se sintió como respirar dentro del sueño."',
        author: 'Escucha anónima',
      },
      {
        id: 'sonoro-comment-2',
        quote: '"Elegí la pista incorrecta y terminé llorando. Gracias por eso."',
        author: 'Residencia Sonora',
      },
    ],
  },
  miniversoGrafico: {
    label: 'Gráficos',
    type: 'graphic-lab',
    intro:
      <p>Gráficos explora el universo #GatoEncerrado desde la imagen. <br/><br/> Aquí las escenas se quedan en otro momento: lo que en la obra aparece como pensamiento o diálogo, en el cómic puede convertirse en ensayo, en silencio, en otra voz.<br/><br/> No solo el de Silvestre, sino el de cualquiera que se haya sentido como él. <br/>Dibujar permite mirar lo que no siempre se dice en escena.</p>,
    cartaTitle: '#MirarmeLoQueSoy',
    notaAutoral:
      'Me quedé dibujando,\ncomo si el papel supiera quién soy\nmejor que yo.',
    collaborators: [
      {
        id: 'manuel-sarabia',
        name: 'Manuel Sarabia',
        role: 'Ilustrador y crítico de cine',
        bio: 'Desde Sadaka Estudio trazó los primeros storyboards de Tres pies al gato, ayudando a imaginar cómo se ve un mundo cuando aún no existe.',
        image: '/images/placeholder-colaboradores.jpg',
      },
    ],

    swipe: {
      title: 'Swipe narrativo',
      description: 'Haz scroll hacia arriba para navegar por tarjetas verticales.',
      steps: [
        'Cada tarjeta revela una escena, una decisión o una herida.',
        'Desliza y elige: ¿quieres ver lo que pasa o lo que duele?',
      ],
    },
    swipeShowcases: [
      {
        id: 'tres-pies-galeria',
        title: 'Tres Pies al Gato',
        description: 'Exploraciones de la novela gráfica.',
        previewImage: '/assets/silvestre-comic.jpeg',
        type: 'internal-reading',
        previewMode: 'pdf',
        previewPdfUrl:
          'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/grafico/Cap%20Aula.pdf',
        swipeNotes: [
          'Swipe vertical en PDF; cada página es una viñeta-ritual.',
          'Optimizado para móvil y tableta.',
        ],
      },
    ],
    comments: [
      {
        id: 'grafico-comment-1',
        quote: '"Cada viñeta parecía escucharme; terminé subrayando con colores."',
        author: 'Residencia gráfica MX',
      },
      {
        id: 'grafico-comment-2',
        quote: '"El swipe me hizo sentir que estaba dentro del storyboard."',
        author: 'Colectivo Tres Pies',
      },
    ],
    ctas: {
      primary: 'Explora el miniverso gráfico',
      secondary: 'Súmate a la residencia gráfica',
    },
    iaProfile: {
      type: 'IA asistida para glifos y variaciones gráficas.',
      interaction: 'Swipe narrativo con prompts curados.',
      tokensRange: '110–220 tokens por sesión.',
      coverage: 'Cubierto por suscriptores; sin costo por visitante.',
      footnote: 'La IA abre caminos; el trazo final sigue siendo humano.',
    },
  },
  miniversoMovimiento: {
    label: 'Movimiento',
     intro:'Este miniverso creativo traslada al cuerpo los conflictos mentales del universo #GatoEncerrado. Si en la obra la mente se fragmenta, aquí el cuerpo busca arraigo. Es un laboratorio coreográfico y somático que se activa por ciudad.No se interpretan emociones: se atraviesan.',

         type: 'movement-ritual',
    pendingName: 'La Ruta de la Corporeidad',
    tagline: 'Talleres de Cuerpo Colectivo',
    overview: [
      'La Ruta de la Corporeidad es una experiencia coreográfica transmedial que recorre plazas, parques y espacios públicos. Activa un ritual contemporáneo con avatares, realidad aumentada y movimiento colectivo.',
    ],
    diosaHighlights: [
      'Una presencia digital inspirada en mitologías mesoamericanas.',
      'Diseñada con motion capture.',
      'Acompañada de música original.',
      'Proyectada con videomapping láser durante las noches.',
    ],

    invitation: '¿Y tú? ¿Bailarás con nosotrxs o solo mirarás pasar a las presencias?',
    actions: [
      {
        id: 'ruta',
        label: 'Explora su ruta',
        description: 'Sigue el mapa interactivo o la línea de tiempo animada de cada estación (Tijuana, La Paz, etc.).',
        badge: 'CTA principal',
        buttonLabel: 'Explorar',
        toastMessage: 'Muy pronto liberaremos el mapa coreográfico y el timeline de estaciones.',
        icon: Map,
      },
      {
        id: 'marcador-ar',
        label: 'Activa un marcador AR en tu ciudad',
        description: 'Activa la cámara (WebAR) o abre la guía para instalar la app y recibir instrucciones.',
        buttonLabel: 'Activar AR',
        toastMessage: 'La guía WebAR se está terminando; te avisaremos cuando la cámara pueda abrir el portal.',
        icon: Scan,
      },
      {
        id: 'talleres',
        label: 'Inscríbete a los talleres coreográficos',
        description: 'Convocatorias abiertas por temporada. Reserva tu lugar en los talleres que trazan la ruta.',
        buttonLabel: 'Inscribirme',
        toastMessage: 'Abriremos el formulario conectado a Supabase para registrar tu participación.',
        icon: Users,
      },
      {
        id: 'livestream',
        label: 'Sigue el livestream de la función final',
        description: 'Activa un embed o cuenta regresiva para ver la ruta completa cuando llegue la noche.',
        buttonLabel: 'Ver livestream',
        toastMessage: 'El livestream y su countdown estarán activos antes de la función final.',
        icon: RadioTower,
      },
    ],
    diosasGallery: [
      {
        id: 'coatlicue-360',
        title: 'Coatlicue',
        description: 'Madre tierra. Peso. Vida y muerte simultánea.',
        badge: 'Portal AR',
        location: 'Hombros / Carga',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Coatlicue/coatlicue_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Coatlicue/coatlicue_web.jpg',
        gradient: 'linear-gradient(165deg, rgba(16,185,129,0.65), rgba(59,130,246,0.55), rgba(168,85,247,0.55))',
      },
      {
        id: 'chanico-360',
        title: 'Chanico',
        description: 'Fuego doméstico. Centro del hogar.',
        badge: 'Portal AR',
        location: 'Plexo / Centro de voluntad',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Chantico/chanico_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Chantico/chanico_web.jpg',
        gradient: 'linear-gradient(175deg, rgba(14,165,233,0.55), rgba(52,211,153,0.45), rgba(8,47,73,0.75))',
      },
      {
        id: 'chicomecoatl-360',
        title: 'Chicomecóatl',
        description: 'Maíz. Fertilidad. Sostén de vida.',
        badge: 'Portal AR',
        location: 'Caderas / Raíz',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Chicomecoatl/chicomecoatl_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Chicomecoatl/chicomecoatl_web.jpg',
        gradient: 'linear-gradient(175deg, rgba(99,102,241,0.52), rgba(20,184,166,0.45), rgba(109,40,217,0.55))',
      },
      {
        id: 'cihuacoatl-360',
        title: 'Cihuacóatl',
        description: 'Guía. Resguardo. Lo que sostiene lo vulnerable.',
        badge: 'Portal AR',
        location: 'Cuello / Sostén de identidad',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Cihuacoatl/Chuhuacoatl_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Cihuacoatl/Chuhuacoatl_web.jpg',
        gradient: 'linear-gradient(178deg, rgba(71,85,105,0.62), rgba(59,130,246,0.45), rgba(99,102,241,0.5))',
      },
      {
        id: 'coyolxauhqui-360',
        title: 'Coyolxauhqui',
        description: 'Luna desmembrada en movimiento continuo.',
        badge: 'Portal AR',
        location: 'Cabeza / Fragmentación',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Coyolxauhqui/Coyolxauhqui_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Coyolxauhqui/Coyolxauhqui_web.jpg',
        gradient: 'linear-gradient(180deg, rgba(129,140,248,0.58), rgba(14,165,233,0.45), rgba(30,41,59,0.7))',
      },
      {
        id: 'itztli-360',
        title: 'Itztli',
        description: 'Corte. Filo. Verdad que atraviesa.',
        badge: 'Portal AR',
        location: 'Mandíbula / Voz retenida',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Itztli/Itztli_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Itztli/Itztli_web.jpg',
        gradient: 'linear-gradient(175deg, rgba(2,6,23,0.75), rgba(29,78,216,0.48), rgba(148,163,184,0.42))',
      },
      {
        id: 'tlazohteotl-360',
        title: 'Tlazohteotl',
        description: 'Purga, deseo y ambivalencia.',
        badge: 'Portal AR',
        location: 'Vientre / Deseo / Culpa',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Tlazohteotl/Tlazohteotl_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Tlazohteotl/Tlazohteotl_web.jpg',
        gradient: 'linear-gradient(172deg, rgba(244,114,182,0.5), rgba(251,191,36,0.45), rgba(109,40,217,0.52))',
      },
      {
        id: 'xochiquetzal-360',
        title: 'Xochiquetzal',
        description: 'Movimiento, arte, vitalidad.',
        badge: 'Portal AR',
        location: 'Piernas / Impulso',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Xochiquetzal/Xochiquetzal_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Xochiquetzal/Xochiquetzal_web.jpg',
        gradient: 'linear-gradient(170deg, rgba(244,114,182,0.55), rgba(59,130,246,0.45), rgba(16,185,129,0.5))',
      },
      {
        id: 'tzitzimime-360',
        title: 'Tzitzimime',
        description: 'Presencias estelares. Observadoras del cosmos.',
        badge: 'Portal AR',
        location: 'Ojos / Mirada / Percepción',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Tzitzimime/tzitzime_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Tzitzimime/tzitzime_web.jpg',
        gradient: 'linear-gradient(180deg, rgba(99,102,241,0.6), rgba(168,85,247,0.5), rgba(14,165,233,0.45))',
      },
      {
        id: 'ixchel-360',
        title: 'Ixchel',
        description: 'Agua, ciclos, lunaridad.',
        badge: 'Portal AR',
        location: 'Tobillos / Suelo',

        videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Ixchel/Ixchel_web.mp4',
        poster: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Ixchel/Ixchel_web.jpg',
        gradient: 'linear-gradient(170deg, rgba(56,189,248,0.55), rgba(34,211,238,0.5), rgba(59,130,246,0.45))',
      },
    ],
    collaborators: [],

    cartaTitle: '#CaerEsDanzar',
    notaAutoral: 'Mi cuerpo colapsará;\nno sin danza\nni dolor bonito.',
    iaProfile: {
      type: 'Actualmente no usa IA en producción.',
      interaction:
        'Registro en motion capture (mocap), traducción a avatar digital y activación en sitio mediante realidad aumentada.',
      tokensRange: 'Sin consumo de IA por visitante en esta etapa.',
      coverage: 'Producción técnica y activación territorial gestionadas por el equipo de Movimiento.',
      footnote: 'Cuando integremos módulos de IA reales, esta ficha se actualizará con métricas verificables.',
    },
  },
  apps: {
    id: 'apps',
    label: 'Juegos',
    type: 'apps',
    tagline: 'Juegos como portales • Apps como rituales felinos.',
      intro: (
  <>
    <p>
      Aquí el universo explora sus propios <strong>clichés</strong> y los pone en juego.
    </p>

    <p>
      Porque las historias se construyen con formas que ya conocemos:
      <strong> inicio, desarrollo y final</strong>.
    </p><br />

    <p>
      Dicen que <em>no hay nada nuevo bajo el sol</em>. Tal vez.<br />
      Pero cuando una historia se juega,
      <strong> podemos contarla a nuestra manera.</strong>
    </p>
  </>
),
    cartaTitle: '#NoHayDesandar',
    notaAutoral:
      'Elegí un camino pequeño.\nAhora no lo puedo desandar.\nEl juego me jugó.',
    liveExperience: {
      title: 'App en vivo',
      description: 'Juega la app completa dentro de la vitrina, sin salir del miniverso.',
      url: 'https://juegos.miniversos.ai/',
      ctaLabel: 'Abrir en pestaña nueva',
    },
    iaProfile: {
      type: 'IA para misiones y ritmo de juego felino.',
      interaction: 'Tap / swipe progresivo; sugiere palabras en la voz del personaje.',
      tokensRange: '90–180 tokens por sesión.',
      coverage: 'Incluido en la huella transmedia (no gasta tus GAT).',
      footnote: 'La IA propone el siguiente giro; tú das el tap y decides cuándo cerrar el telón.',
    },
  },
  oraculo: {
    label: 'Oráculo',
    type: 'oracle',
    intro: (
  <>
    Este miniverso existe para mirar lo que <strong>#GatoEncerrado</strong> despierta en ti.
    <br /><br />
    A través de preguntas breves, el <strong>Oráculo</strong> abre un espacio para observar tus propias respuestas:
    emociones, intuiciones y pensamientos que aparecen después de la experiencia.
    <br /><br />
    <strong>Aquí no se interpreta la obra.</strong>
    <br />
    Se aprende a <em>observar al observador</em>.
  </>
),
    loops: [
      'Responde preguntas simbólicas, filosóficas, existenciales, absurdas o personales.',
      'Cada respuesta se guarda como semilla de conocimiento simbólico para IA, literatura y obra interactiva.',
      'Mientras más participas, más GATokens generas (proof-of-resonance con límites diarios anti-spam).',
    ],
    rewards: [
  { title: 'Responder una pregunta profunda', tokens: '+20 GAT', description: 'Comparte una reflexión que vibre en lo simbólico o emocional.' },
  { title: 'Elegir y comentar reflexiones de otrxs', tokens: '+30 GAT', description: 'Modo foro: amplifica ideas y suma tu mirada.' },
  { title: 'Volver tras una semana', tokens: '+30 GAT', description: 'Regresa al Oráculo y sigue el hilo de tu propia huella.' },
  { title: 'Invitar a alguien con su primera reflexión', tokens: '+50 GAT', description: 'Trae otra mente al Oráculo. Recompensa única por invitación.' },
],
    limitsNote: 'Límites diarios para evitar spam y preservar el valor simbólico de cada respuesta.',
    seedNotes: [
  'Las respuestas se almacenan como semillas de conocimiento simbólico.',
  'Alimentan una base de datos viviente para literatura, IA personalizada y obra interactiva.',
  'Cada huella deja una señal en la mente del Gato.',
],
    ctaLabel: 'Pregunta, responde y mintea',
    ctaDescription:
      'Tu pensamiento también construye este universo.',
    tagline: 'Interacción que deja huella. Reflexión que te recompensa.',
    cartaTitle: '#CambiarSinCambiar',
    notaAutoral: 'Miré el espejo.\nNo dijo nada.\nÉramos dos... y no.',
    iaProfile: {
      type: 'GPT-4o + embeddings simbólicos curados por la comunidad.',
      interaction: '1–3 reflexiones cortas por sesión; foro breve guiado.',
      tokensRange: '20–120 tokens por reflexión (promedio ~20 GAT).',
      coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
      footnote: 'El minado es simbólico y humano: no es financiero, es resonancia.',
    },
  },
};


export const formats = [
  {
    id: 'miniversos',
    title: 'Drama',
    icon: Drama,
    iconClass: 'text-purple-300',

    iaTokensNote: 'Energía confiada: 300 GAT',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_obra.png',
  },
  {
    id: 'lataza',
    title: 'Artesanías',
    icon: Coffee,
    iconClass: 'text-amber-300',

    iaTokensNote: 'Mantener ritual: ~90 GAT.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_artesanias.png',
  },
  {
    id: 'miniversoNovela',
    title: 'Literatura',
    icon: BookOpen,
    iconClass: 'text-emerald-300',

    iaTokensNote: 'Energía viva: ~150 GAT.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_literatura.png',
  },
  {
    id: 'miniversoGrafico',
    title: 'Gráficos',
    icon: Palette,
    iconClass: 'text-fuchsia-300',

    iaTokensNote: 'Requiere ~110 GAT.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_graficos.png',
  },
  {
    id: 'copycats',
    title: 'Cine',
    icon: Film,
    iconClass: 'text-rose-300',

    iaTokensNote: 'Requiere ~250 confiados.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/cine.png',
  },
  {
    id: 'miniversoSonoro',
    title: 'Sonoridades',
    icon: Music,
    iconClass: 'text-cyan-300',

    iaTokensNote: 'Requiere ~130 GAT',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_sonoridades.png',
  },
  {
    id: 'miniversoMovimiento',
    title: 'Movimiento',
    icon: MapIcon,
    iconClass: 'text-sky-300',

    iaTokensNote: '~280 por mapa.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_movimiento.png',
  },
  {
    id: 'apps',
    title: 'Juegos',
    icon: Dice5,
    iconClass: 'text-lime-300',

    iaTokensNote: 'IA marca el ritmo felino.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_juegos.png',
  },
  {
    id: 'oraculo',
    title: 'Oráculo',
    icon: Brain,
    iconClass: 'text-indigo-300',

    iaTokensNote: 'Aquí se minan GATokes',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/posters/poster_oraculo.png',
  },
];

export const getHashAnchor = (hashValue) => String(hashValue || '').split('?')[0];

export const parseNumericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

export const extractFocusIncomingGAT = (intent) => {
  if (!intent || typeof intent !== 'object') return null;

  const pick = (...paths) => {
    for (const path of paths) {
      let cursor = intent;
      let validPath = true;
      for (const segment of path) {
        if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
          validPath = false;
          break;
        }
        cursor = cursor[segment];
      }
      if (!validPath) continue;
      const parsed = parseNumericValue(cursor);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  const prioritized =
    pick(
      ['gat_delta'],
      ['gatDelta'],
      ['gat_added'],
      ['gatAdded'],
      ['gat_earned'],
      ['gatEarned'],
      ['gatos_traidos'],
      ['gatosTraidos'],
      ['tokens_earned'],
      ['tokensEarned'],
      ['token_bonus'],
      ['tokenBonus'],
      ['reward_gatokens'],
      ['reward', 'gatokens'],
      ['reward', 'tokens'],
      ['credits', 'delta'],
      ['wallet', 'delta']
    ) ??
    pick(
      ['gatokens'],
      ['gat_tokens'],
      ['gatos'],
      ['tokens'],
      ['available_tokens'],
      ['wallet', 'available_tokens']
    );

  return prioritized === null ? null : Math.trunc(prioritized);
};

export const getFocusParamFromLocation = (locationLike) => {
  if (!locationLike) return null;

  const searchParams = new URLSearchParams(locationLike.search || '');
  const fromSearch =
    searchParams.get('focus') ||
    searchParams.get('appId') ||
    searchParams.get('app_id') ||
    searchParams.get('recommended_app_id');
  if (fromSearch) return fromSearch;

  const hashRaw = String(locationLike.hash || '');
  const [hashAnchor, hashQuery = ''] = hashRaw.split('?');
  if (normalizeBridgeKey(hashAnchor) !== 'transmedia' || !hashQuery) return null;
  const hashParams = new URLSearchParams(hashQuery);
  return (
    hashParams.get('focus') ||
    hashParams.get('appId') ||
    hashParams.get('app_id') ||
    hashParams.get('recommended_app_id')
  );
};

export const CAUSE_ACCORDION = [
  {
    id: 'tratamientos',
    title: 'Terapias',
    description:
      'Tan solo una huella asigna hasta 6 sesiones a un joven sin costo para su familia. Isabel Ayuda para la Vida, A.C. activa las sesiones cuando se detecta riesgo emocional.',
    tramo: '1er tramo',
    icon: HeartHandshake,
    metric: '6 sesiones promedio por suscriptor',
    imageAlt: 'Foto de archivo de acompañamiento emocional.',
    imageLabel: 'Foto de archivo',
    imageUrls: [
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento1.jpg',
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento3.jpg',
    'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento2.jpg',
    'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/seguimiento4.jpg',
],

  },
  {
    id: 'residencias',
    tramo: '2do tramo',
    title: 'Talleres',
    description:
      'Talleres de 2 meses en alianza con la asociación, donde artistas ponen su práctica al servicio de programas escolares de acompañamiento emocional. Cada 17 huellas financian una residencia completa.',
    icon: Palette,
    metric: 'Hasta 3 residencias activas por temporada',
    imageAlt: 'Foto de archivo de residencias creativas.',
    imageLabel: 'Foto de archivo',
    imageUrls: [
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias_creativas.jpeg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias2.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias3.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/residencias.jpg',
    ],
  },
  {
    id: 'app-escolar',
    tramo: '3er tramo',
    title: 'Licencias',
  description:
    'Implementación y seguimiento semestral de la app de detección temprana. 75 huellas financian 1 escuela por semestre.',
  icon: Smartphone,
  metric: '5 escuelas atendidas por ciclo escolar',
  imageAlt: 'Captura de la app Causa Social en escuelas (versión beta).',
  imageLabel: 'Capturas beta de la app',
    imageUrls: [
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app%20causa%20social/Sofia1.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app%20causa%20social/Luis.jpg',
       'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app%20causa%20social/Andres1.jpg',
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/app%20causa%20social/Ximena.jpg',


    ],
  },
];
