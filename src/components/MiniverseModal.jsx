import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { BookOpen, Brain, Check, Compass, Coffee, Coins, Dice5, Drama, Film, Filter, Heart, HeartHandshake, HeartPulse, MapIcon, Music, Palette, School, Share2, Sparkles, DoorOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase } from '@/lib/supabaseClient';
import HuellaEmbeddedCheckout from '@/components/HuellaEmbeddedCheckout';
import { createEmbeddedSubscription, startCheckoutFallback } from '@/lib/huellaCheckout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeSetItem } from '@/lib/safeStorage';
import { getTopShowcaseLikes } from '@/services/showcaseLikeService';
import { isSafariBrowser } from '@/lib/browser';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { canQuerySubscriptionTableFromClient, warnUnsupportedClientRole } from '@/lib/supabaseSessionRole';
import {
  MINIVERSE_HOME_EVENT_TYPES,
  trackMiniverseHomeEvent,
} from '@/services/miniverseHomeAnalyticsService';

const TABS = [
  { id: 'escaparate', label: 'Expande', icon: Sparkles },
  { id: 'experiences', label: 'Habita', icon:  DoorOpen},
  { id: 'waitlist', label: 'Impulsa', icon: HeartHandshake },
];
const DEFAULT_TAB_ID = 'escaparate';
const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));
const resolveInitialTabId = (tabId) => (VALID_TAB_IDS.has(tabId) ? tabId : DEFAULT_TAB_ID);
const getTabHeadingVerb = (tabId) => {
  if (tabId === 'escaparate') return 'Expande';
  if (tabId === 'waitlist') return 'Impulsa';
  return 'Habita';
};
const INCENDIO_LOGO_SRC = '/assets/incendiologo.png';
const INCENDIO_VIDEO_PLACEHOLDER_TITLE = 'VIDEO EN PRODUCCIÓN';
const INCENDIO_VIDEO_PLACEHOLDER_COPY =
  'La versión completa de esta microficción está siendo producida por Incendio Producciones. Muy pronto podrás verla aquí.';

const MINIVERSE_TILE_GRADIENTS = {
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

const MINIVERSE_TILE_COLORS = {
  miniversos: {
    border: 'rgba(186,131,255,0.35)',
    text: '#e9d8ff',
  },
  copycats: {
    border: 'rgba(132,176,255,0.35)',
    text: '#dbeafe',
  },
  miniversoGrafico: {
    border: 'rgba(214,146,255,0.35)',
    text: '#fce7f3',
  },
  miniversoNovela: {
    border: 'rgba(163,148,255,0.35)',
    text: '#e0e7ff',
  },
  miniversoSonoro: {
    border: 'rgba(122,179,255,0.35)',
    text: '#e0f2fe',
  },
  lataza: {
    border: 'rgba(255,173,145,0.35)',
    text: '#ffedd5',
  },
  miniversoMovimiento: {
    border: 'rgba(163,233,208,0.35)',
    text: '#d1fae5',
  },
  apps: {
    border: 'rgba(110,231,183,0.45)',
    text: '#d1fae5',
  },
  oraculo: {
    border: 'rgba(225,160,235,0.35)',
    text: '#fbe7ff',
  },
  default: {
    border: 'rgba(186,131,255,0.3)',
    text: '#f3e8ff',
  },
};

const MINIVERSE_STARFIELDS = {
  drama:
    'radial-gradient(1px 1px at 10% 18%, rgba(255,255,255,1), transparent 50%),' +
    'radial-gradient(1.5px 1.5px at 26% 36%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 38% 22%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 48% 64%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 62% 46%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 72% 26%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 82% 62%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 88% 18%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(3px 3px at 22% 30%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(2.5px 2.5px at 78% 42%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(3.5px 3.5px at 58% 74%, rgba(255,255,255,1), transparent 62%)',
  literatura:
    'radial-gradient(1px 1px at 14% 22%, rgba(255,255,255,1), transparent 50%),' +
    'radial-gradient(1.5px 1.5px at 22% 58%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 34% 30%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 46% 70%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 56% 42%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 66% 18%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 78% 54%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 90% 26%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(3px 3px at 28% 32%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(2.5px 2.5px at 72% 38%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(3.5px 3.5px at 60% 72%, rgba(255,255,255,1), transparent 62%)',
  taza:
    'radial-gradient(1px 1px at 12% 24%, rgba(255,255,255,1), transparent 50%),' +
    'radial-gradient(1.5px 1.5px at 24% 44%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 36% 60%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 44% 28%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 58% 52%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 82% 46%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 90% 68%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(3px 3px at 26% 34%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(2.5px 2.5px at 76% 40%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(3.5px 3.5px at 62% 76%, rgba(255,255,255,1), transparent 62%)',
  default:
    'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,1), transparent 50%),' +
    'radial-gradient(1.5px 1.5px at 24% 42%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 36% 28%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 52% 18%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 64% 48%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 72% 30%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 80% 66%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(2px 2px at 88% 22%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1.5px 1.5px at 58% 78%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(1px 1px at 90% 82%, rgba(255,255,255,1), transparent 55%),' +
    'radial-gradient(3px 3px at 20% 30%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(2.5px 2.5px at 78% 42%, rgba(255,255,255,1), transparent 62%),' +
    'radial-gradient(3.5px 3.5px at 62% 74%, rgba(255,255,255,1), transparent 62%)',
};

const MINIVERSE_NARRATIVE_CTA_STYLES = `
.narrative-cta-btn{
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid rgba(196,181,253,0.36);
  background: rgba(37,28,69,0.62);
  color: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
}

.narrative-cta-btn::before{
  content: "";
  position: absolute;
  inset: -38%;
  background: linear-gradient(130deg,
    rgba(192,132,252,0.62) 0%,
    rgba(129,140,248,0.38) 38%,
    rgba(167,139,250,0.55) 64%,
    rgba(99,102,241,0.34) 100%);
  transform: rotate(7deg);
  opacity: .72;
  pointer-events: none;
}

.narrative-cta-btn::after{
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0 32%, rgba(0,0,0,.2) 32% 33%, transparent 33% 100%);
  mix-blend-mode: multiply;
  opacity: .8;
  pointer-events: none;
}

.narrative-cta-btn:hover{
  transform: translateY(-1px);
  filter: saturate(1.08);
  box-shadow: 0 16px 36px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.1);
}

.narrative-cta-btn:active{ transform: translateY(0) scale(.99); }

.narrative-cta-btn > span{
  position: relative;
  z-index: 1;
}
`;
const MINIVERSE_DISCOVER_INTRO_MESH =
  'radial-gradient(circle at 14% 18%, rgba(139,92,246,0.38), transparent 36%),' +
  'radial-gradient(circle at 86% 20%, rgba(56,189,248,0.30), transparent 34%),' +
  'radial-gradient(circle at 72% 78%, rgba(20,184,166,0.28), transparent 40%),' +
  'radial-gradient(circle at 26% 82%, rgba(34,211,238,0.24), transparent 38%),' +
  'radial-gradient(circle at 56% 32%, rgba(99,102,241,0.20), transparent 34%),' +
  'linear-gradient(135deg, rgba(10,12,28,0.96), rgba(15,23,42,0.92), rgba(17,24,39,0.90))';
const MINIVERSE_PORTAL_TITLE_PATTERN = /^\d+\s*-\s*/;
const VISITED_MINIVERSES_STORAGE_KEY = 'gatoencerrado:miniverse-visited';
const getPortalLabelFromTitle = (title = '') => {
  const normalizedTitle = String(title || '').trim();
  return normalizedTitle.replace(MINIVERSE_PORTAL_TITLE_PATTERN, '').trim() || normalizedTitle;
};
const extractDurationFromLabel = (label = '') => {
  const match = String(label).match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() || null;
};
const stripDurationFromLabel = (label = '') =>
  String(label).replace(/\s*\(([^)]+)\)\s*$/, '').trim();
const parseActTitle = (title = '') => {
  const rawTitle = String(title || '').trim();
  const match = rawTitle.match(/^(\d{1,2})\s*-\s*(.+)$/);
  if (!match) {
    return { actNumber: '', displayTitle: rawTitle };
  }
  return {
    actNumber: String(match[1]).padStart(2, '0'),
    displayTitle: match[2]?.trim() || rawTitle,
  };
};

const MINIVERSE_CARDS = [
  {
    id: 'drama',
    formatId: 'miniversos',
    appName: 'Obra',
    icon: Drama,
    thumbLabel: 'D',
    thumbGradient: 'from-purple-400/80 via-fuchsia-500/70 to-rose-500/60',
    glassTint: '284 70% 62%',
    title: '01 - La escena',
    titleShort: '🎧 "Abre la puerta" (30 seg)',
    description: 'Yo no quería hacer una obra. Solo quería entender algo que me estaba pasando.',

    videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/Loop_escenico_small.mp4',
    ctaVerb: 'Entra',
    action: 'Explora',
    isPremium: true,
  },
  {
    id: 'literatura',
    formatId: 'miniversoNovela',
    appName: 'Literatura',
    icon: BookOpen,
    thumbLabel: 'L',
    thumbGradient: 'from-emerald-400/80 via-teal-500/70 to-cyan-500/60',
    glassTint: '168 70% 52%',
    title: '02 - La escritura',
    titleShort: '🎧 "Entre grietas" (30 seg)',
    description: 'Pensé que si la escribía, lo iba a entender.',
    videoUrl: null,
    ctaVerb: 'Lee',
    action: 'Explora',
    isPremium: true,
  },
  {
    id: 'taza',
    formatId: 'lataza',
    appName: 'Artesanías',
    icon: Coffee,
    thumbLabel: 'A',
    thumbGradient: 'from-amber-400/80 via-orange-500/70 to-rose-500/60',
    glassTint: '28 78% 58%',
    title: '03 - El objeto',
    titleShort: '🎧 "Lo que se sostiene" (30 seg)',
    description: 'Entonces necesité algo pequeño. Quise sostenerla con las manos.',
    videoUrl: null,
    ctaVerb: 'Sostén',
    action: 'Explora',
  },
  {
    id: 'graficos',
    formatId: 'miniversoGrafico',
    appName: 'Gráficos',
    icon: Palette,
    thumbLabel: 'G',
    thumbGradient: 'from-fuchsia-400/80 via-purple-500/70 to-indigo-500/60',
    glassTint: '304 65% 60%',
    title: '04 - La imagen',
    titleShort: '🎧 "La imagen de sí" (30 seg)',
    description: 'Un día me vi dibujando y no supe si estaba creando o si algo me estaba dibujando a mí…',
    videoUrl: null,
    ctaVerb: 'Mira',
    action: 'Explora',
  },
  {
    id: 'cine',
    formatId: 'copycats',
    appName: 'Cine',
    icon: Film,
    thumbGradient: 'from-rose-500/80 via-red-500/70 to-fuchsia-500/60',
    glassTint: '352 70% 60%',
    title: '05 - El lente',
    titleShort: '🎧 "El quiebre" (30 seg)',
    description: 'Por primera vez… pensé en detenerme.',
    videoUrl: null,
    ctaVerb: 'Observa',
    action: 'Explora',
    isPremium: true,
  },
  {
    id: 'sonoro',
    formatId: 'miniversoSonoro',
    appName: 'Sonoridades',
    icon: Music,
    thumbLabel: 'S',
    thumbGradient: 'from-sky-400/80 via-cyan-500/70 to-indigo-500/60',
    glassTint: '206 80% 58%',
    title: '06 - El eco',
      titleShort: '🎧 "La memoria" (30 seg)',
      description: 'Entonces entendí: todo esto había empezado antes de mí.',
    videoUrl: null,
    ctaVerb: 'Escucha',
    action: 'Explora',
  },
  {
    id: 'movimiento',
    formatId: 'miniversoMovimiento',
    appName: 'Movimiento',
    icon: MapIcon,
    thumbLabel: 'M',
    thumbGradient: 'from-sky-400/80 via-emerald-500/70 to-cyan-500/60',
    glassTint: '176 62% 52%',
    title: '07 - El cuerpo',
    titleShort: '🎧 "El límite" (30 seg)',
    description: 'Ahí toqué el límite. Y no había respuestas. Solo vértigo.',
    videoUrl: null,
    ctaVerb: 'Siente',
    action: 'Explora',
  },
  {
    id: 'apps',
    formatId: 'apps',
    appName: 'Apps',
    icon: Dice5,
    thumbLabel: 'J',
    thumbGradient: 'from-lime-400/80 via-emerald-500/70 to-teal-500/60',
    glassTint: '138 60% 48%',
    title: '08 - El juego',
    titleShort: '🎧 "La elección" (30 seg)',
    description: 'Convertí la pregunta en recorrido. Dejé que otros eligieran por mí.',
    videoUrl: null,
    ctaVerb: 'Elige',
    action: 'Explora',
  },
  {
    id: 'oraculo',
    formatId: 'oraculo',
    appName: 'Oráculo',
    icon: Brain,
    thumbLabel: 'O',
    thumbGradient: 'from-indigo-400/80 via-violet-500/70 to-purple-500/60',
    glassTint: '266 62% 60%',
    title: '09 - El espejo',
    titleShort: '🎧 "La revelación" (30 seg)',
    description: 'Tal vez esto nunca fue una obra. Tal vez fue un sueño compartido en nueve formas.',
    videoUrl: null,
    ctaVerb: 'Consulta',
    action: 'Explora',
  },

];

const MINIVERSE_ICON_IMAGES = {
  miniversos: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/la_obra.png',
  lataza: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/la_taza.png',
  copycats: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/cortos.png',
  miniversoMovimiento: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/lasdiosas.png',
  miniversoNovela: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/literatura.png',
  miniversoGrafico: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/los_graficos.png',
  miniversoSonoro: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/sonoridades.png',
  apps: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/juegos.png',
  oraculo: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/el_oraculo.png',
};
const MINIVERSE_ICON_PLACEHOLDER = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/juegos.png';

const initialFormState = {
  fullName: '',
  email: '',
  interest: 'miniversos',
  message: '',
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 18, transition: { duration: 0.2, ease: 'easeIn' } },
};

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';
const SUPPORT_WHATSAPP = '+523315327985';
const SUPPORT_MESSAGE =
  'Hola,%0Ami huella está activa pero no aparece ligada a mi cuenta.%0A¿Me ayudan a vincularla?%0A%0AGracias.';
const SUBSCRIPTION_PRICE_ID = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
const CAUSE_SITE_URL = 'https://www.ayudaparalavida.com/index.html';
const HERO_VERB_SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const HERO_VERB_SCRAMBLE_INTERVAL_MS = 26;
const HERO_VERB_SPLIT_FLAP_HOLD_MS = 96;
const ACT_NUMBER_SCRAMBLE_DIGITS = '0123456789';
const ACT_NUMBER_SCRAMBLE_INTERVAL_MS = 42;
const ACT_NUMBER_SPLIT_FLAP_HOLD_MS = 72;

const readStoredJson = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = window.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`[MiniverseModal] No se pudo leer ${key}`, error);
    return fallback;
  }
};

const IncendioVideoPlaceholder = ({ compact = false }) => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-5 text-center ${
      compact ? 'gap-3' : 'gap-5'
    }`}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(7,10,18,0.2)_34%,rgba(0,0,0,0.88)_100%)]"
    />
    <img
      src={INCENDIO_LOGO_SRC}
      alt="Incendio Producciones"
      className={`relative h-auto object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.12)] ${
        compact ? 'w-24 sm:w-28' : 'w-32 sm:w-40 md:w-44'
      }`}
      loading="lazy"
    />
    <div className={`relative flex flex-col items-center ${compact ? 'max-w-[17rem] gap-2' : 'max-w-xl gap-3'}`}>
      <p className={`${compact ? 'text-[0.58rem]' : 'text-[11px]'} uppercase tracking-[0.34em] text-slate-200/82`}>
        {INCENDIO_VIDEO_PLACEHOLDER_TITLE}
      </p>
      <p className={`${compact ? 'text-[0.72rem]' : 'text-sm'} leading-relaxed text-slate-300/85`}>
        {INCENDIO_VIDEO_PLACEHOLDER_COPY}
      </p>
    </div>
  </div>
);

const MiniverseModal = ({
  open,
  onClose,
  onSelectMiniverse,
  initialTabId = null,
  shelved = false,
  stayOpenOnSelect = false,
  displayMode = 'modal',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session } = useAuth();
  const isSafari = isSafariBrowser();
  const isInlineMode = displayMode === 'inline';
  const inlineTitleStyle = isInlineMode ? { fontFamily: 'Vox Round, Inter, sans-serif' } : undefined;
  const inlineCardTitleStyle = isInlineMode ? { fontFamily: 'Vox Round, Inter, sans-serif' } : undefined;
  const shouldUseSingleLinePortalTitle = (title, { force = false } = {}) =>
    isInlineMode &&
    (force || (isMobileViewport && MINIVERSE_PORTAL_TITLE_PATTERN.test(String(title || ''))));
  const resolvedInitialTabId = useMemo(() => resolveInitialTabId(initialTabId), [initialTabId]);
  const [activeTab, setActiveTab] = useState(() => resolvedInitialTabId);
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMiniverseId, setSelectedMiniverseId] = useState(null);
  const [selectedUpcomingId, setSelectedUpcomingId] = useState(null);
  const [showcaseFullscreenCard, setShowcaseFullscreenCard] = useState(null);
  const [visitedMiniverses, setVisitedMiniverses] = useState(() =>
    readStoredJson(VISITED_MINIVERSES_STORAGE_KEY, {})
  );
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState('');
  const [embeddedCheckoutStatus, setEmbeddedCheckoutStatus] = useState('');
  const [showcaseEnergy, setShowcaseEnergy] = useState(() =>
    readStoredJson('gatoencerrado:showcase-energy', {})
  );
  const [showcaseBoosts, setShowcaseBoosts] = useState(() =>
    readStoredJson('gatoencerrado:showcase-boosts', {})
  );
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [communityTopLikes, setCommunityTopLikes] = useState([]);
  const [isLoadingCommunityLikes, setIsLoadingCommunityLikes] = useState(false);
  const [isCauseSiteOpen, setIsCauseSiteOpen] = useState(false);
  const [inlineHeadingVerbDisplay, setInlineHeadingVerbDisplay] = useState(() =>
    getTabHeadingVerb(resolvedInitialTabId)
  );
  const [inlineActNumberDisplay, setInlineActNumberDisplay] = useState('');
  const metadataSubscriber = Boolean(
    user?.user_metadata?.isSubscriber === true ||
      user?.user_metadata?.isSubscriber === 'true' ||
      user?.user_metadata?.is_subscriber === true ||
      user?.user_metadata?.is_subscriber === 'true' ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.user_metadata?.subscription_status === 'trialing' ||
      user?.user_metadata?.stripe_subscription_status === 'active' ||
      user?.user_metadata?.stripe_subscription_status === 'trialing' ||
      user?.user_metadata?.plan === 'subscriber' ||
      user?.user_metadata?.tier === 'subscriber' ||
      user?.app_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.subscription_status === 'trialing' ||
      user?.app_metadata?.stripe_subscription_status === 'active' ||
      user?.app_metadata?.stripe_subscription_status === 'trialing' ||
      user?.app_metadata?.roles?.includes?.('subscriber')
  );
  const isSubscriber = metadataSubscriber || hasActiveSubscription;
  const desktopShowcaseVideoRef = useRef(null);
  const mobileShowcaseVideoRef = useRef(null);
  const modalContentRef = useRef(null);
  const inlineHeadingScrambleTimerRef = useRef(null);
  const inlineHeadingRevealTimeoutRef = useRef(null);
  const inlineActNumberScrambleTimerRef = useRef(null);
  const inlineActNumberRevealTimeoutRef = useRef(null);
  const setHeroAmbientHold = useCallback((hold) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('gatoencerrado:hero-ambient-hold', {
        detail: {
          hold: Boolean(hold),
          source: 'miniverse-modal-video',
        },
      }),
    );
  }, []);

  const stopModalMediaPlayback = useCallback(({ reset = false } = {}) => {
    const root = modalContentRef.current;
    if (!root || typeof document === 'undefined') return;

    root.querySelectorAll('video, audio').forEach((mediaNode) => {
      if (!(mediaNode instanceof HTMLMediaElement)) return;
      try {
        mediaNode.pause?.();
        if (reset) {
          mediaNode.currentTime = 0;
        }
      } catch {
        // noop
      }
    });

    const pipNode = document.pictureInPictureElement;
    if (pipNode instanceof HTMLVideoElement && root.contains(pipNode)) {
      try {
        pipNode.pause?.();
      } catch {
        // noop
      }
      if (typeof document.exitPictureInPicture === 'function') {
        document.exitPictureInPicture().catch(() => {});
      }
    }

    const fullscreenNode = document.fullscreenElement;
    if (fullscreenNode && root.contains(fullscreenNode) && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => {});
    }
    setHeroAmbientHold(false);
  }, [setHeroAmbientHold]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isSafari) {
      document.documentElement.classList.add('is-safari');
    }
  }, [isSafari]);

  useEffect(() => {
    if (!user?.id) {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return undefined;
    }

    if (!canQuerySubscriptionTableFromClient(session)) {
      warnUnsupportedClientRole(session, 'MiniverseModal');
      setIsCheckingSubscription(false);
      return undefined;
    }

    let isMounted = true;
    setIsCheckingSubscription(true);

    supabase
      .from('suscriptores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .then(({ count, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[MiniverseModal] No se pudo validar huella:', error);
          setHasActiveSubscription(false);
          return;
        }
        setHasActiveSubscription((count ?? 0) > 0);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSubscription(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session, user?.id]);

  const playKnockSound = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    const context = new AudioContext();
    const now = context.currentTime;

    const scheduleKnock = (time, frequency) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.06, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.14);
    };

    scheduleKnock(now + 0.02, 180);
    scheduleKnock(now + 0.18, 150);

    setTimeout(() => {
      context.close();
    }, 500);
  }, []);

  useEffect(() => {
    if (open) {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const isMobile = mediaQuery.matches;
        setIsMobileViewport(isMobile);
      }
      setActiveTab(resolvedInitialTabId);
      setFormState(initialFormState);
      setStatus('idle');
      setErrorMessage('');
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
      setShowcaseFullscreenCard(null);
      setActiveShowcaseIndex(0);
      setIsCauseSiteOpen(false);
      setEmbeddedClientSecret('');
      setEmbeddedCheckoutStatus('');
      setShowcaseEnergy(readStoredJson('gatoencerrado:showcase-energy', {}));
      setShowcaseBoosts(readStoredJson('gatoencerrado:showcase-boosts', {}));
      return;
    }
    stopModalMediaPlayback({ reset: true });
    setIsCauseSiteOpen(false);
  }, [open, resolvedInitialTabId, stopModalMediaPlayback]);

  useEffect(() => {
    if (!open || !shelved) return undefined;
    stopModalMediaPlayback();
    return undefined;
  }, [open, shelved, stopModalMediaPlayback]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    if (open && !shelved) {
      if (!isInlineMode) {
        document.documentElement.dataset.miniverseOpen = 'true';
      }
      return;
    }
    delete document.documentElement.dataset.miniverseOpen;
  }, [isInlineMode, open, shelved]);

  useEffect(() => {
    if (isInlineMode || typeof document === 'undefined' || !open || shelved) {
      return undefined;
    }

    const { documentElement, body } = document;
    const lockCountKey = 'gatoScrollLockCount';
    const prevHtmlOverflowKey = 'gatoPrevHtmlOverflow';
    const prevBodyOverflowKey = 'gatoPrevBodyOverflow';
    const prevOverscrollBehaviorKey = 'gatoPrevOverscrollBehavior';

    const currentCount = Number(documentElement.dataset[lockCountKey] || '0');
    if (currentCount === 0) {
      documentElement.dataset[prevHtmlOverflowKey] = documentElement.style.overflow || '';
      documentElement.dataset[prevBodyOverflowKey] = body.style.overflow || '';
      documentElement.dataset[prevOverscrollBehaviorKey] = documentElement.style.overscrollBehavior || '';
    }
    documentElement.dataset[lockCountKey] = String(currentCount + 1);

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    documentElement.style.overscrollBehavior = 'none';

    return () => {
      const nextCount = Math.max(Number(documentElement.dataset[lockCountKey] || '1') - 1, 0);
      documentElement.dataset[lockCountKey] = String(nextCount);

      if (nextCount > 0) {
        return;
      }

      documentElement.style.overflow = documentElement.dataset[prevHtmlOverflowKey] || '';
      body.style.overflow = documentElement.dataset[prevBodyOverflowKey] || '';
      documentElement.style.overscrollBehavior =
        documentElement.dataset[prevOverscrollBehaviorKey] || '';

      delete documentElement.dataset[lockCountKey];
      delete documentElement.dataset[prevHtmlOverflowKey];
      delete documentElement.dataset[prevBodyOverflowKey];
      delete documentElement.dataset[prevOverscrollBehaviorKey];
    };
  }, [isInlineMode, open, shelved]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleStorage = (event) => {
      if (event.key === 'gatoencerrado:showcase-energy') {
        setShowcaseEnergy(readStoredJson('gatoencerrado:showcase-energy', {}));
      }
      if (event.key === 'gatoencerrado:showcase-boosts') {
        setShowcaseBoosts(readStoredJson('gatoencerrado:showcase-boosts', {}));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const handleMediaChange = (event) => {
      setIsMobileViewport(event.matches);
      setActiveTab(resolvedInitialTabId);
    };
    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [resolvedInitialTabId]);

  useEffect(() => {
    if (!open || shelved) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        stopModalMediaPlayback({ reset: true });
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, shelved, stopModalMediaPlayback]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const activeTabLabel = useMemo(
    () => TABS.find((tab) => tab.id === activeTab)?.label ?? TABS[0].label,
    [activeTab]
  );
  const activeTabHeadingVerb = useMemo(() => getTabHeadingVerb(activeTab), [activeTab]);
  const shouldPlaceInlineTabsOnTop = isInlineMode && isMobileViewport;
  const shouldAnimateInlineHeading = isInlineMode;
  const inlineHeadingVerb = shouldAnimateInlineHeading ? inlineHeadingVerbDisplay : activeTabHeadingVerb;

  useEffect(() => {
    if (inlineHeadingScrambleTimerRef.current) {
      window.clearInterval(inlineHeadingScrambleTimerRef.current);
      inlineHeadingScrambleTimerRef.current = null;
    }
    if (inlineHeadingRevealTimeoutRef.current) {
      window.clearTimeout(inlineHeadingRevealTimeoutRef.current);
      inlineHeadingRevealTimeoutRef.current = null;
    }

    if (!shouldAnimateInlineHeading || typeof window === 'undefined') {
      setInlineHeadingVerbDisplay(activeTabHeadingVerb);
      return undefined;
    }

    const prefersReducedMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );
    if (prefersReducedMotion) {
      setInlineHeadingVerbDisplay(activeTabHeadingVerb);
      return undefined;
    }

    const target = activeTabHeadingVerb;
    const totalFrames = Math.max(target.length * 2, 10);
    let frame = 0;
    const getScrambleChar = () =>
      HERO_VERB_SCRAMBLE_CHARS[
        Math.floor(Math.random() * HERO_VERB_SCRAMBLE_CHARS.length)
      ].toLowerCase();

    inlineHeadingScrambleTimerRef.current = window.setInterval(() => {
      frame += 1;
      const revealed = Math.min(target.length, Math.floor((frame / totalFrames) * target.length));
      let nextValue = '';

      for (let index = 0; index < target.length; index += 1) {
        if (index < revealed) {
          nextValue += target[index];
          continue;
        }
        nextValue += getScrambleChar();
      }

      setInlineHeadingVerbDisplay(nextValue);

      if (frame >= totalFrames) {
        if (inlineHeadingScrambleTimerRef.current) {
          window.clearInterval(inlineHeadingScrambleTimerRef.current);
          inlineHeadingScrambleTimerRef.current = null;
        }
        const lastIndex = Math.max(target.length - 1, 0);
        const splitFlapLatch =
          target.length > 0
            ? `${target.slice(0, lastIndex)}${getScrambleChar()}`
            : target;
        setInlineHeadingVerbDisplay(splitFlapLatch);
        inlineHeadingRevealTimeoutRef.current = window.setTimeout(() => {
          setInlineHeadingVerbDisplay(target);
          inlineHeadingRevealTimeoutRef.current = null;
        }, HERO_VERB_SPLIT_FLAP_HOLD_MS);
      }
    }, HERO_VERB_SCRAMBLE_INTERVAL_MS);

    return () => {
      if (inlineHeadingScrambleTimerRef.current) {
        window.clearInterval(inlineHeadingScrambleTimerRef.current);
        inlineHeadingScrambleTimerRef.current = null;
      }
      if (inlineHeadingRevealTimeoutRef.current) {
        window.clearTimeout(inlineHeadingRevealTimeoutRef.current);
        inlineHeadingRevealTimeoutRef.current = null;
      }
    };
  }, [activeTabHeadingVerb, shouldAnimateInlineHeading]);
  const activeTabIntro = useMemo(() => {
      if (activeTab === 'escaparate') {
      return {
      lead: 'Conecta con la obra a través de una microficción en nueve actos. Cada acto dialoga con una forma distinta de sí y abre la misma pregunta:',
      highlight: '¿por qué esta obra se expande más allá del teatro?',
      };
    }
    if (activeTab === 'experiences') {
      return {
        lead: 'Aquí las nueve formas de la obra en un formato más familiar:',
        highlight:
          'un ecosistema listo para tocar, intervenir y volver cuando quieras.',
          continuation: 'Con $50 MXN al mes, accedes a la versión completa.'
      };
    }
      return {
      lead: 'La soledad, la confusión o el miedo que esta obra pone en escena,',
      highlight: 'muchos niños y jóvenes tijuanenses las viven cada día en silencio.',
      continuation: 'Tu huella ayuda a detectarlas y acompañarlas a tiempo.'
    };
  }, [activeTab]);
  const showcaseMiniverses = useMemo(
    () => MINIVERSE_CARDS.filter((card) => !card.isUpcoming),
    []
  );
  const dramaShowcaseCard = useMemo(
    () => showcaseMiniverses.find((card) => card.id === 'drama') ?? showcaseMiniverses[0] ?? null,
    [showcaseMiniverses]
  );
  const showcaseNarrativeCards = useMemo(() => {
    const prologueVideoUrl = dramaShowcaseCard?.videoUrl ?? null;
    return [
      {
        id: 'prologo',
        formatId: 'miniversos',
        appName: 'Prólogo',
        icon: Sparkles,
        thumbLabel: 'P',
        thumbGradient: 'from-violet-300/80 via-fuchsia-400/70 to-cyan-400/60',
        title: 'Autoficción en fragmentos',
        titleShort: 'Prólogo',
        ctaLabel: '🎧 "El arte de no romperse"',
        ctaDuration: '5 min',
        description: '¿Qué pasa cuando algo se expande sin pausa y empieza a romperse?',
        videoUrl: prologueVideoUrl,
        fullscreenVideoUrlDesktop: null,
        fullscreenVideoUrlMobile: null,
        eyebrow: 'Prólogo',
        isPrologue: true,
        portalLabel: 'Prólogo',
        customGradient: MINIVERSE_DISCOVER_INTRO_MESH,
      },
      ...showcaseMiniverses.map((card) => {
        const rawCtaLabel = card.titleShort ?? card.title;
        return {
          ...card,
          ctaLabel: stripDurationFromLabel(rawCtaLabel),
          ctaDuration: extractDurationFromLabel(rawCtaLabel),
          fullscreenVideoUrlDesktop: card.fullscreenVideoUrlDesktop ?? card.fullscreenVideoUrl ?? null,
          fullscreenVideoUrlMobile: card.fullscreenVideoUrlMobile ?? card.fullscreenVideoUrl ?? null,
          portalLabel: getPortalLabelFromTitle(card.title),
        };
      }),
    ];
  }, [dramaShowcaseCard, showcaseMiniverses]);
  const fictionShowcaseCards = useMemo(
    () => showcaseNarrativeCards.filter((card) => !card.isPrologue),
    [showcaseNarrativeCards]
  );
  const activeShowcaseCard = useMemo(
    () => showcaseNarrativeCards[activeShowcaseIndex] ?? showcaseNarrativeCards[0] ?? null,
    [activeShowcaseIndex, showcaseNarrativeCards]
  );
  const activeShowcaseTitleMeta = useMemo(
    () => parseActTitle(activeShowcaseCard?.title ?? ''),
    [activeShowcaseCard?.title]
  );
  const activeShowcaseActNumber = activeShowcaseTitleMeta.actNumber;
  const activeShowcaseTitleText = activeShowcaseTitleMeta.displayTitle;
  const sharedShowcaseVideoUrl = useMemo(
    () => dramaShowcaseCard?.videoUrl ?? showcaseNarrativeCards.find((card) => card.videoUrl)?.videoUrl ?? null,
    [dramaShowcaseCard, showcaseNarrativeCards]
  );
  const mobileExploreButtonLabel = useMemo(() => {
    if (!activeShowcaseCard) return 'Navega entre formas';
    if (activeShowcaseCard.isPrologue) return 'Primera forma: La escena';
    if (!fictionShowcaseCards.length) return 'Navega entre formas';
    const currentFictionIndex = fictionShowcaseCards.findIndex((card) => card.id === activeShowcaseCard.id);
    const baseIndex = currentFictionIndex >= 0 ? currentFictionIndex : 0;
    const nextCard = fictionShowcaseCards[(baseIndex + 1) % fictionShowcaseCards.length] ?? fictionShowcaseCards[0];
    return `Siguiente: ${nextCard?.portalLabel ?? 'La escena'}`;
  }, [activeShowcaseCard, fictionShowcaseCards]);
  const activeShowcaseVideoHint = useMemo(() => {
    if (!activeShowcaseCard) return '';
    const durationToken = String(activeShowcaseCard.ctaDuration || '').trim();
    if (!durationToken) {
      return activeShowcaseCard.isPrologue ? 'Video completo' : 'Testimonio en video';
    }
    const videoLabel = activeShowcaseCard.isPrologue ? 'Video completo' : 'Fragmento';
    return `${videoLabel} · ${durationToken.toUpperCase()}`;
  }, [activeShowcaseCard]);

  useEffect(() => {
    if (inlineActNumberScrambleTimerRef.current) {
      window.clearInterval(inlineActNumberScrambleTimerRef.current);
      inlineActNumberScrambleTimerRef.current = null;
    }
    if (inlineActNumberRevealTimeoutRef.current) {
      window.clearTimeout(inlineActNumberRevealTimeoutRef.current);
      inlineActNumberRevealTimeoutRef.current = null;
    }

    if (!isInlineMode || typeof window === 'undefined') {
      setInlineActNumberDisplay(activeShowcaseActNumber);
      return undefined;
    }

    if (!activeShowcaseActNumber) {
      setInlineActNumberDisplay('');
      return undefined;
    }

    const prefersReducedMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );
    if (prefersReducedMotion) {
      setInlineActNumberDisplay(activeShowcaseActNumber);
      return undefined;
    }

    const target = activeShowcaseActNumber;
    const totalFrames = Math.max(target.length * 2, 6);
    let frame = 0;
    const getDigit = () =>
      ACT_NUMBER_SCRAMBLE_DIGITS[
        Math.floor(Math.random() * ACT_NUMBER_SCRAMBLE_DIGITS.length)
      ];

    inlineActNumberScrambleTimerRef.current = window.setInterval(() => {
      frame += 1;
      const revealed = Math.min(target.length, Math.floor((frame / totalFrames) * target.length));
      let nextValue = '';

      for (let index = 0; index < target.length; index += 1) {
        if (index < revealed) {
          nextValue += target[index];
          continue;
        }
        if (target[index] === '0') {
          nextValue += '0';
          continue;
        }
        nextValue += getDigit();
      }

      setInlineActNumberDisplay(nextValue);

      if (frame >= totalFrames) {
        if (inlineActNumberScrambleTimerRef.current) {
          window.clearInterval(inlineActNumberScrambleTimerRef.current);
          inlineActNumberScrambleTimerRef.current = null;
        }
        const lastIndex = Math.max(target.length - 1, 0);
        const latchDigit = target[lastIndex] === '0' ? '0' : getDigit();
        const splitFlapLatch =
          target.length > 0
            ? `${target.slice(0, lastIndex)}${latchDigit}`
            : target;
        setInlineActNumberDisplay(splitFlapLatch);
        inlineActNumberRevealTimeoutRef.current = window.setTimeout(() => {
          setInlineActNumberDisplay(target);
          inlineActNumberRevealTimeoutRef.current = null;
        }, ACT_NUMBER_SPLIT_FLAP_HOLD_MS);
      }
    }, ACT_NUMBER_SCRAMBLE_INTERVAL_MS);

    return () => {
      if (inlineActNumberScrambleTimerRef.current) {
        window.clearInterval(inlineActNumberScrambleTimerRef.current);
        inlineActNumberScrambleTimerRef.current = null;
      }
      if (inlineActNumberRevealTimeoutRef.current) {
        window.clearTimeout(inlineActNumberRevealTimeoutRef.current);
        inlineActNumberRevealTimeoutRef.current = null;
      }
    };
  }, [activeShowcaseActNumber, isInlineMode]);
  const activeShowcaseFullscreenVideoUrl = useMemo(() => {
    if (!showcaseFullscreenCard) return null;
    const desktopUrl = showcaseFullscreenCard.fullscreenVideoUrlDesktop ?? null;
    const mobileUrl = showcaseFullscreenCard.fullscreenVideoUrlMobile ?? null;
    if (isMobileViewport) return mobileUrl ?? desktopUrl;
    return desktopUrl ?? mobileUrl;
  }, [isMobileViewport, showcaseFullscreenCard]);
  const upcomingMiniverses = useMemo(
    () => MINIVERSE_CARDS.filter((card) => card.isUpcoming),
    []
  );
  const selectedMiniverse = useMemo(
    () => MINIVERSE_CARDS.find((card) => card.id === selectedMiniverseId) ?? null,
    [selectedMiniverseId]
  );
  const selectedUpcoming = useMemo(
    () => upcomingMiniverses.find((card) => card.id === selectedUpcomingId) ?? null,
    [selectedUpcomingId, upcomingMiniverses]
  );
  const communityLikeMap = useMemo(
    () => new Map((communityTopLikes ?? []).map((entry) => [entry.showcaseId, entry.count])),
    [communityTopLikes]
  );
  const communityHeartTotal = useMemo(
    () => (communityTopLikes ?? []).reduce((acc, entry) => acc + (entry?.count ?? 0), 0),
    [communityTopLikes]
  );
  const visibleMiniverseCards = useMemo(
    () => {
      if (!showFavoritesOnly) return MINIVERSE_CARDS;
      const ranking = (communityTopLikes ?? [])
        .map((entry) =>
          MINIVERSE_CARDS.find((card) => !card.isUpcoming && card.formatId === entry.showcaseId) ?? null
        )
        .filter(Boolean);
      return ranking;
    },
    [communityTopLikes, showFavoritesOnly]
  );

  const markMiniverseVisited = useCallback((miniverseId) => {
    if (!miniverseId) return;
    const storedVisited = readStoredJson(VISITED_MINIVERSES_STORAGE_KEY, {});
    if (!storedVisited[miniverseId]) {
      safeSetItem(
        VISITED_MINIVERSES_STORAGE_KEY,
        JSON.stringify({ ...storedVisited, [miniverseId]: true })
      );
    }
    setVisitedMiniverses((prev) => (prev[miniverseId] ? prev : { ...prev, [miniverseId]: true }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncVisitedFromStorage = () => {
      setVisitedMiniverses(readStoredJson(VISITED_MINIVERSES_STORAGE_KEY, {}));
    };
    window.addEventListener('focus', syncVisitedFromStorage);
    window.addEventListener('pageshow', syncVisitedFromStorage);
    return () => {
      window.removeEventListener('focus', syncVisitedFromStorage);
      window.removeEventListener('pageshow', syncVisitedFromStorage);
    };
  }, []);

  const trackAppClick = useCallback((card, source = 'grid') => {
    if (!card?.id) return;
    void trackMiniverseHomeEvent({
      eventType: MINIVERSE_HOME_EVENT_TYPES.APP_CLICK,
      appId: card.id,
      source,
      metadata: {
        formatId: card.formatId ?? null,
        title: card.title ?? null,
      },
    });
  }, []);

  const handleTabChange = useCallback(
    (tabId) => {
      stopModalMediaPlayback();
      if (selectedMiniverseId) {
        markMiniverseVisited(selectedMiniverseId);
      }
      setActiveTab(tabId);
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
      setActiveShowcaseIndex(0);
    },
    [markMiniverseVisited, selectedMiniverseId, stopModalMediaPlayback]
  );

  const handleClose = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    stopModalMediaPlayback({ reset: true });
    setShowcaseFullscreenCard(null);
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    onClose?.();
  }, [markMiniverseVisited, onClose, selectedMiniverseId, status, stopModalMediaPlayback]);

  const handleSelectCard = useCallback(
    (card, source = 'grid') => {
      if (card.isUpcoming) {
        return;
      }
      if (!visitedMiniverses[card.id]) {
        playKnockSound();
      }
      markMiniverseVisited(card.id);
      trackAppClick(card, source);

      const portalRoute = resolvePortalRoute({
        formatId: card.formatId,
        cardId: card.id,
        mobileOnly: true,
        isMobileViewport,
      });
      if (portalRoute) {
        navigate(portalRoute, {
          state: createPortalLaunchState(location, 'miniverse-modal-card', {
            showcaseId: card.formatId,
          }),
        });
        if (!isInlineMode && !stayOpenOnSelect) {
          handleClose();
        }
        return;
      }

      if (isInlineMode && !isMobileViewport && activeTab === 'experiences') {
        onSelectMiniverse?.(card.formatId);
        return;
      }

      if (isInlineMode) {
        setSelectedMiniverseId(card.id);
        return;
      }

      onSelectMiniverse?.(card.formatId);
      if (!stayOpenOnSelect) {
        handleClose();
      }
    },
    [
      handleClose,
      isInlineMode,
      isMobileViewport,
      activeTab,
      location,
      markMiniverseVisited,
      navigate,
      onSelectMiniverse,
      playKnockSound,
      setSelectedMiniverseId,
      stayOpenOnSelect,
      trackAppClick,
      visitedMiniverses,
    ]
  );

  const handleSelectUpcoming = useCallback((card) => {
    setSelectedUpcomingId(card.id);
  }, []);

  const handleReturnToUpcomingList = useCallback(() => {
    setSelectedUpcomingId(null);
  }, []);

  const handleReturnToList = useCallback(() => {
    stopModalMediaPlayback();
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    setSelectedMiniverseId(null);
  }, [markMiniverseVisited, selectedMiniverseId, stopModalMediaPlayback]);

  const legacyScrollToSection = useCallback(() => {
    if (!selectedMiniverse) return;
    // legacy: scroll to section
    onSelectMiniverse?.(selectedMiniverse.formatId);
  }, [onSelectMiniverse, selectedMiniverse]);

  const handleEnterMiniverse = useCallback(() => {
    if (!selectedMiniverse) return;
    markMiniverseVisited(selectedMiniverse.id);
    trackAppClick(selectedMiniverse, 'detail-enter');
    const portalRoute = resolvePortalRoute({
      formatId: selectedMiniverse.formatId,
      cardId: selectedMiniverse.id,
      mobileOnly: true,
      isMobileViewport,
    });
    if (portalRoute) {
      navigate(portalRoute, {
        state: createPortalLaunchState(location, 'miniverse-modal-enter', {
          showcaseId: selectedMiniverse.formatId,
        }),
      });
      if (!isInlineMode) {
        handleClose();
      }
      return;
    }
    legacyScrollToSection();
    if (!stayOpenOnSelect) {
      handleClose();
    }
  }, [
    handleClose,
    legacyScrollToSection,
    location,
    markMiniverseVisited,
    navigate,
    isMobileViewport,
    selectedMiniverse,
    stayOpenOnSelect,
    trackAppClick,
    isInlineMode,
  ]);

  const handleEnterShowcase = useCallback(
    (card) => {
      if (!card) return;
      if (!visitedMiniverses[card.id]) {
        playKnockSound();
      }
      markMiniverseVisited(card.id);
      trackAppClick(card, 'showcase-card');
      const portalRoute = resolvePortalRoute({
        formatId: card.formatId,
        cardId: card.id,
        mobileOnly: true,
        isMobileViewport,
      });
      if (portalRoute) {
        navigate(portalRoute, {
          state: createPortalLaunchState(location, 'miniverse-modal-showcase', {
            showcaseId: card.formatId,
          }),
        });
        if (!isInlineMode) {
          handleClose();
        }
        return;
      }
      onSelectMiniverse?.(card.formatId);
      if (!stayOpenOnSelect) {
        handleClose();
      }
    },
    [
      handleClose,
      location,
      markMiniverseVisited,
      navigate,
      isMobileViewport,
      onSelectMiniverse,
      playKnockSound,
      stayOpenOnSelect,
      trackAppClick,
      visitedMiniverses,
      isInlineMode,
    ]
  );

  const handleDockShare = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#transmedia`;
    const sharePayload = {
      title: '#GatoEncerrado · Miniversos',
      text: 'Te comparto la pantalla de inicio de los miniversos de #GatoEncerrado.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        void trackMiniverseHomeEvent({
          eventType: MINIVERSE_HOME_EVENT_TYPES.HOME_SHARE,
          source: 'dock-share:web-share',
          metadata: { target: 'home_screen' },
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ description: 'Enlace copiado para compartir la pantalla de inicio.' });
        void trackMiniverseHomeEvent({
          eventType: MINIVERSE_HOME_EVENT_TYPES.HOME_SHARE,
          source: 'dock-share:clipboard',
          metadata: { target: 'home_screen' },
        });
        return;
      }

      window.prompt('Copia este enlace para compartir:', shareUrl);
      void trackMiniverseHomeEvent({
        eventType: MINIVERSE_HOME_EVENT_TYPES.HOME_SHARE,
        source: 'dock-share:prompt',
        metadata: { target: 'home_screen' },
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast({ description: 'No pudimos compartir en este momento. Intenta de nuevo.' });
    }
  }, []);

  const handleDockOpenTransmedia = useCallback(() => {
    void trackMiniverseHomeEvent({
      eventType: MINIVERSE_HOME_EVENT_TYPES.OPEN_TRANSMEDIA,
      source: 'dock-transmedia',
    });
    handleClose();
    if (typeof document !== 'undefined') {
      const section = document.getElementById('transmedia');
      if (section) {
        window.setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return;
      }
    }
    navigate('/#transmedia');
  }, [handleClose, navigate]);

  useEffect(() => {
    if (!open || selectedMiniverse || activeTab !== 'experiences') return;
    let isMounted = true;
    setIsLoadingCommunityLikes(true);
    getTopShowcaseLikes(3)
      .then(({ data }) => {
        if (!isMounted) return;
        setCommunityTopLikes(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCommunityLikes(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeTab, open, selectedMiniverse]);

  const handleEnterUpcoming = useCallback(() => {
    if (!selectedUpcoming) return;
    onSelectMiniverse?.(selectedUpcoming.formatId);
  }, [onSelectMiniverse, selectedUpcoming]);

  const requireShowcaseLogin = useCallback(
    (card) => {
      if (user) {
        return true;
      }
      safeSetItem(
        LOGIN_RETURN_KEY,
        JSON.stringify({
          anchor: '#transmedia',
          action: 'showcase-cta',
          miniverseId: card?.id ?? null,
        })
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-login-modal'));
      }
      toast({ description: 'Inicia sesión para activar esta vitrina.' });
      return false;
    },
    [user]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') {
        return;
      }

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: null,
          interest: 'miniversos',
          channel: 'landing',
          object_type: 'experiencia-digital',
          event: 'miniversos',
          notes: formState.message.trim() || null,
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          console.error('[MiniverseModal] Error al registrar miniverso:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('rsvp_extended')
              ? 'Crea la tabla rsvp_extended en Supabase para habilitar este formulario.'
              : 'No pudimos registrar tu interés. Intenta de nuevo.'
          );
          return;
        }

        setStatus('success');
        toast({
          description: 'Gracias. Te enviaremos una señal cuando el próximo miniverso cobre vida.',
        });
      } catch (err) {
        console.error('[MiniverseModal] Excepción al guardar:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [formState, status]
  );

  const handleScrollToSupport = useCallback(() => {
    stopModalMediaPlayback({ reset: true });
    if (typeof document === 'undefined') {
      onClose?.();
      return;
    }
    onClose?.();
    setTimeout(() => {
      document.querySelector('#apoya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 140);
  }, [onClose, stopModalMediaPlayback]);

  const handleOpenCauseSite = useCallback(() => {
    setIsCauseSiteOpen(true);
  }, []);

  const handleCloseCauseSite = useCallback(() => {
    setIsCauseSiteOpen(false);
  }, []);

  const handleSubscriptionCheckout = useCallback(async () => {
    if (!SUBSCRIPTION_PRICE_ID) {
      toast({ description: 'Configura VITE_STRIPE_SUBSCRIPTION_PRICE_ID antes de continuar.' });
      return;
    }

    if (isCheckoutLoading) {
      return;
    }

    if (isSubscriber) {
      toast({ description: 'Tu huella ya está activa en esta cuenta.' });
      return;
    }

    const normalizedEmail = user?.email ? user.email.trim().toLowerCase() : '';
    try {
      setIsCheckoutLoading(true);
      setEmbeddedCheckoutStatus('');
      const metadata = {
        channel: 'landing',
        event: 'suscripcion-landing',
        packages: 'subscription',
        source: 'miniverse_modal',
      };

      const data = await createEmbeddedSubscription({
        priceId: SUBSCRIPTION_PRICE_ID,
        metadata,
      });

      if (!data?.ok) {
        if (data?.error === 'already_subscribed') {
          toast({ description: 'Tu huella ya está activa en esta cuenta.' });
          return;
        }
        throw new Error(data?.error || 'embedded_unknown_error');
      }

      if (!data.client_secret) {
        throw new Error('missing_client_secret');
      }

      setEmbeddedClientSecret(data.client_secret);
      setActiveTab('waitlist');
      setEmbeddedCheckoutStatus('');
    } catch (err) {
      console.warn('[MiniverseModal] Embedded checkout error. Activando fallback.', err);
      setEmbeddedCheckoutStatus('No se pudo abrir el formulario embebido. Redirigiendo al checkout...');
      try {
        await startCheckoutFallback({
          priceId: SUBSCRIPTION_PRICE_ID,
          customerEmail: normalizedEmail || undefined,
          metadata: {
            channel: 'landing',
            event: 'suscripcion-landing',
            packages: 'subscription',
            source: 'miniverse_modal_fallback',
          },
        });
      } catch (fallbackError) {
        console.error('[MiniverseModal] Fallback checkout error:', fallbackError);
        toast({ description: fallbackError?.message || 'No se pudo reconocer la huella.' });
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  }, [isCheckoutLoading, isSubscriber, user?.email]);

  const handleEmbeddedCheckoutDone = useCallback(({ ok, message }) => {
    if (!ok) {
      return;
    }
    const normalizedStatus = (message || '').toLowerCase();
    const isSuccessful = normalizedStatus === 'succeeded' || normalizedStatus === 'processing';
    if (isSuccessful) {
      setHasActiveSubscription(true);
      setEmbeddedCheckoutStatus('Pago confirmado. Tu huella se activará en esta cuenta.');
      setEmbeddedClientSecret('');
      toast({ description: 'Pago confirmado. Gracias por dejar tu huella.' });
      return;
    }
    setEmbeddedCheckoutStatus(`Estado actual del pago: ${message || 'unknown'}.`);
  }, []);

  const resolveVisibleShowcasePreviewVideo = useCallback((cardId) => {
    if (desktopShowcaseVideoRef.current) {
      return desktopShowcaseVideoRef.current;
    }
    if (typeof document === 'undefined') return null;
    const videos = Array.from(
      document.querySelectorAll(`[data-showcase-preview="${cardId}"]`)
    );
    if (!videos.length) return null;
    return videos.find((video) => video.offsetParent !== null) || videos[0] || null;
  }, []);

  const handleShowcasePreviewHoverStart = useCallback(
    (card) => {
      if (!card) return;
      const target = resolveVisibleShowcasePreviewVideo(card.id ?? 'desktop-shared');
      if (!target) return;
      try {
        target.muted = true;
        target.loop = true;
        target.playsInline = true;
        const playPromise = target.play?.();
        if (typeof playPromise?.catch === 'function') {
          playPromise.catch(() => {});
        }
      } catch (error) {
        // noop: preview hover must not block interaction.
      }
    },
    [resolveVisibleShowcasePreviewVideo]
  );

  const handleShowcasePreviewHoverEnd = useCallback(
    (card) => {
      const target = resolveVisibleShowcasePreviewVideo(card?.id ?? 'desktop-shared');
      if (!target) return;
      try {
        target.pause?.();
        target.currentTime = 0;
      } catch (error) {
        // noop
      }
    },
    [resolveVisibleShowcasePreviewVideo]
  );

  const handleOpenShowcaseFullscreen = useCallback(
    (card) => {
      if (!card) return;
      if (!card.isPrologue) {
        markMiniverseVisited(card.id);
      }
      trackAppClick(card, 'showcase-fullscreen-cta');
      stopModalMediaPlayback();
      setShowcaseFullscreenCard(card);
    },
    [markMiniverseVisited, stopModalMediaPlayback, trackAppClick]
  );

  const handleCloseShowcaseFullscreen = useCallback(() => {
    setShowcaseFullscreenCard(null);
    setHeroAmbientHold(false);
  }, [setHeroAmbientHold]);

  const handleExploreMobileShowcase = useCallback(() => {
    if (!activeShowcaseCard || !showcaseNarrativeCards.length) return;

    let nextCardId = null;
    if (activeShowcaseCard.isPrologue) {
      nextCardId = fictionShowcaseCards[0]?.id ?? showcaseNarrativeCards[0]?.id ?? null;
    } else if (fictionShowcaseCards.length > 0) {
      const currentFictionIndex = fictionShowcaseCards.findIndex((item) => item.id === activeShowcaseCard.id);
      const baseIndex = currentFictionIndex >= 0 ? currentFictionIndex : 0;
      nextCardId =
        fictionShowcaseCards[(baseIndex + 1) % fictionShowcaseCards.length]?.id ??
        fictionShowcaseCards[0]?.id ??
        null;
    }

    if (!nextCardId) return;
    const nextGlobalIndex = showcaseNarrativeCards.findIndex((item) => item.id === nextCardId);
    if (nextGlobalIndex < 0) return;
    setActiveShowcaseIndex(nextGlobalIndex);
  }, [activeShowcaseCard, fictionShowcaseCards, showcaseNarrativeCards]);

  const handleShowcasePrimaryCta = useCallback(
    (card) => {
      if (!card) return;
      handleOpenShowcaseFullscreen(card);
    },
    [handleOpenShowcaseFullscreen]
  );

  const handleShowcaseCardMouseEnter = useCallback(
    (card) => {
      handleShowcasePreviewHoverStart(card);
    },
    [handleShowcasePreviewHoverStart]
  );

  const handleShowcaseCardMouseLeave = useCallback(
    (card) => {
      handleShowcasePreviewHoverEnd(card);
    },
    [handleShowcasePreviewHoverEnd]
  );

  useEffect(() => {
    // Deshabilitado intencionalmente durante desarrollo:
    // evita el autoscroll del carrusel para facilitar revisión de UI/UX.
    return undefined;
  }, []);

  useEffect(() => {
    if (!open || activeTab !== 'escaparate' || !isMobileViewport) return undefined;
    const video = mobileShowcaseVideoRef.current;
    if (!video || !sharedShowcaseVideoUrl) return undefined;
    let cancelled = false;

    const attemptPlay = () => {
      if (cancelled) return;
      try {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        const maybePromise = video.play?.();
        if (typeof maybePromise?.catch === 'function') {
          maybePromise.catch(() => {});
        }
      } catch {
        // noop
      }
    };

    const handleVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible') return;
      attemptPlay();
    };

    attemptPlay();
    video.addEventListener('loadeddata', attemptPlay);
    video.addEventListener('canplay', attemptPlay);
    video.addEventListener('stalled', attemptPlay);
    video.addEventListener('suspend', attemptPlay);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', attemptPlay);
      video.removeEventListener('canplay', attemptPlay);
      video.removeEventListener('stalled', attemptPlay);
      video.removeEventListener('suspend', attemptPlay);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeTab, isMobileViewport, open, sharedShowcaseVideoUrl, activeShowcaseIndex]);

  useEffect(
    () => () => {
      stopModalMediaPlayback({ reset: true });
    },
    [stopModalMediaPlayback]
  );

  useEffect(
    () => () => {
      setHeroAmbientHold(false);
    },
    [setHeroAmbientHold]
  );

  const shouldAnimatePresence = !isSafari;

  const modalLayer = open ? (
    <motion.div
          className={`safari-stable-layer ${
            isInlineMode
              ? 'relative z-10 w-full'
              : 'fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none'
          } ${shelved ? 'pointer-events-none' : ''}`}
          initial={shouldAnimatePresence ? 'hidden' : false}
          animate="visible"
          exit={shouldAnimatePresence ? 'hidden' : undefined}
          aria-hidden={shelved ? 'true' : undefined}
        >
          {!isInlineMode ? (
            <motion.div
              className={`safari-stable-layer safari-backdrop-lite absolute inset-0 bg-black/80 ${isSafari ? '' : 'backdrop-blur-sm'} ${shelved ? 'pointer-events-none' : ''}`}
              variants={backdropVariants}
              onClick={handleClose}
              aria-hidden="true"
            />
          ) : null}

          <motion.div
            ref={modalContentRef}
            role="dialog"
            aria-modal={shelved ? 'false' : 'true'}
            aria-labelledby="miniverse-modal-title"
            variants={modalVariants}
            className={`safari-stable-layer relative z-10 flex ${
              isInlineMode
                ? 'w-full max-w-none flex-col overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none'
                : 'w-[calc(100vw-2rem)] max-w-4xl flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-10 shadow-2xl max-h-[100vh] min-h-[97vh] md:max-h-[73vh] md:min-h-[73vh] overflow-hidden'
            } ${
              isSafari ? '' : 'transition-[opacity,filter,transform] duration-500'
            } ${
              shelved ? 'pointer-events-none opacity-0 blur-sm scale-[0.98]' : 'opacity-100 blur-0 scale-100'
            }`}
          >
            <style>{MINIVERSE_NARRATIVE_CTA_STYLES}</style>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(5,5,10,0.35), rgba(5,5,10,0.35))',
                filter: 'grayscale(0.25)',
              }}
            />
            <div
              className={`relative z-10 flex-1 ${
                isInlineMode
                  ? 'overflow-visible pr-0'
                  : 'overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pr-0 sm:pr-1'
              }`}
            >
            <div>
        <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${isInlineMode ? 'mb-5' : 'mb-6'}`}>
          <div className={isInlineMode ? 'w-full' : ''}>
            {isInlineMode && shouldPlaceInlineTabsOnTop ? (
              <div className="mb-4 hero-inline-segmented ui-segmented ui-segmented--rect !w-full !overflow-hidden ![grid-template-columns:repeat(3,minmax(0,1fr))]">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`ui-segmented__btn !min-h-[44px] !w-full !justify-center !px-2.5 !py-2 !text-center !text-[11px] !font-semibold !uppercase !tracking-[0.24em] !leading-[1.2] ${
                        isActive ? 'ui-segmented__btn--active' : 'ui-segmented__btn--secondary'
                      }`}
                    >
                      <span className="inline-flex w-full items-center justify-center">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
       

            <h2
              id="miniverse-modal-title"
              className={`${isInlineMode ? `hero-inline-title-glow hero-inline-title-tight mb-1.5 text-center font-semibold leading-[1.05] tracking-[-0.01em] ${shouldPlaceInlineTabsOnTop ? 'mt-0.5' : ''} ${!isMobileViewport ? 'hero-inline-title-desktop' : ''}` : 'font-display text-3xl'} text-slate-50`}
              style={inlineTitleStyle}
            >
              {isInlineMode ? (
                <>
                  <span className="hero-inline-title-line">{inlineHeadingVerb} el Universo</span>
                  <span className="hero-inline-title-line"> #GatoEncerrado</span>
                </>
              ) : (
                <>
                  {activeTabHeadingVerb} el universo #GatoEncerrado
                </>
              )}
            </h2>

            {isInlineMode ? (
              <div className={`mt-1 ${shouldPlaceInlineTabsOnTop ? 'space-y-4' : 'space-y-5 md:space-y-6'}`}>
                <div
                  className={`hero-inline-intro-plecas mx-auto px-1 py-3 text-center ${
                    isMobileViewport
                      ? 'max-w-4xl text-sm'
                      : 'hero-inline-intro-plecas-desktop max-w-5xl'
                  }`}
                >
                  {activeTabIntro.lead}{' '}
                  <strong className="hero-inline-intro-strong font-semibold">
                    {activeTabIntro.highlight}
                  </strong>
                  {activeTabIntro.continuation ? ` ${activeTabIntro.continuation}` : ''}
                </div>

                {!shouldPlaceInlineTabsOnTop ? (
                  <div className="hero-inline-segmented ui-segmented ui-segmented--rect !w-full !overflow-hidden ![grid-template-columns:repeat(3,minmax(0,1fr))]">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className={`ui-segmented__btn !min-h-[44px] !w-full !justify-center !px-2.5 !py-2 !text-center !text-[11px] !font-semibold !uppercase !tracking-[0.24em] !leading-[1.2] ${
                            isActive ? 'ui-segmented__btn--active' : 'ui-segmented__btn--secondary'
                          }`}
                        >
                          <span className="inline-flex w-full items-center justify-center">
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full min-w-0 rounded-full border px-2.5 py-2 text-[0.72rem] sm:w-auto sm:px-4 sm:text-sm font-semibold transition ${
                        activeTab === tab.id
                          ? 'border-purple-400/60 bg-purple-500/20 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                          : 'border-white/15 bg-slate-950/75 text-slate-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_22px_rgba(0,0,0,0.35)] hover:border-purple-300/45 hover:bg-slate-900/85 hover:text-purple-100'
                      }`}
                    >
                      <span className="inline-flex w-full items-center justify-center gap-1.5 sm:w-auto sm:gap-2">
                        {tab.icon ? (
                          <>
                            <span className="sm:hidden">
                              <tab.icon size={14} className="text-purple-300" />
                            </span>
                            <span className="hidden sm:inline">
                              <tab.icon size={18} className="text-purple-300" />
                            </span>
                          </>
                        ) : null}
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-purple-400/60 bg-purple-500/20 px-4 py-3 text-sm text-purple-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  {activeTabIntro.lead}{' '}
                  <strong className="font-semibold text-white">
                    {activeTabIntro.highlight}
                  </strong>
                  {activeTabIntro.continuation ? ` ${activeTabIntro.continuation}` : ''}
                </div>
              </>
            )}
          </div>
        </div>

            <div className="grid md:grid-cols-2 gap-8">
              {activeTab === 'waitlist' ? (
                <>
                  <div className="order-2 md:order-1 glass-effect relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-7 text-slate-200/90">
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400/80">
                          Súmate al proyecto
                        </span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="mt-5 space-y-3">
                        <h3 className="font-display text-3xl text-slate-50">
                          Tu huella es real
                        </h3>
                        <p className="text-sm text-slate-300/90 leading-relaxed">
                          Al dejar tu huella, te integras al ecosistema creativo de Gato Encerrado y lo ayudas a florecer.
                        </p>
                      </div>

                      <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                        <div className="flex flex-col items-center gap-4">
                          <span className="h-36 w-36 overflow-hidden rounded-[1.35rem] bg-transparent">
                            <img
                              src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/causa%20social/causa_social.png"
                              alt="Causa social Isabel Ayuda para la Vida"
                              loading="lazy"
                              className="h-full w-full object-cover drop-shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
                            />
                          </span>
                          <Button
                            type="button"
                            onClick={handleSubscriptionCheckout}
                            className="white-glass-btn h-11 min-w-[10.5rem] px-6 text-base font-semibold tracking-[0.2px]"
                          >
                            Dejar mi huella
                          </Button>
                          {embeddedCheckoutStatus ? (
                            <p className="text-center text-xs leading-relaxed text-slate-300/80">
                              {embeddedCheckoutStatus}
                            </p>
                          ) : null}
                          {embeddedClientSecret ? (
                            <HuellaEmbeddedCheckout
                              clientSecret={embeddedClientSecret}
                              onDone={handleEmbeddedCheckoutDone}
                            />
                          ) : null}
                          <button
                            type="button"
                            onClick={handleScrollToSupport}
                            className="relative flex w-full items-center justify-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/60"
                          >
                            <div className="h-5 w-5 rounded-full border border-emerald-300/40 bg-emerald-300/70 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
                            <span className="text-sm text-slate-300/80 leading-relaxed">
                              Quiero saber cómo funciona.
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-1 md:order-2 hidden md:block glass-effect relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-7 text-slate-200/90">
                    <div className="relative z-10 space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400/80">
                          Impacto en cadena
                        </span>
                        
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                      <p className="text-xs text-slate-400/80 leading-relaxed">
                        En alianza con Isabel Ayuda para la Vida, A.C.{' '}
                        <button
                          type="button"
                          onClick={handleScrollToSupport}
                          className="text-slate-200 underline underline-offset-4 hover:text-white transition"
                        >
                          Conoce más
                        </button>
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                            <HeartPulse size={18} className="text-rose-200" />
                          </div>
                          
                          <div>
                            <p className="font-semibold text-slate-100">Terapias</p>
                            <p className="text-xs text-slate-300/80">6 sesiones promedio por suscriptor</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                            <Sparkles size={18} className="text-purple-200" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">Residencias creativas</p>
                            <p className="text-xs text-slate-300/80">3 residencias activas por temporada</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                            <School size={18} className="text-sky-200" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">App Causa Social en escuelas</p>
                            <p className="text-xs text-slate-300/80">5 escuelas atendidas por ciclo escolar</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                            <Coins size={18} className="text-amber-200" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">Expansión creativa del universo</p>
                            <p className="text-xs text-slate-300/80">Nuevas escenas, juegos e historias</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleOpenCauseSite}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                          Visitar sitio
                        </button>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
                          <img
                            src="/assets/isabel_banner.png"
                            alt="Isabel Ayuda para la Vida"
                            loading="lazy"
                            className="h-10 w-auto object-contain sm:h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'escaparate' && !isMobileViewport ? (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400/80">
             
                    <span>
                      Tarjeta {Math.min(activeShowcaseIndex + 1, Math.max(showcaseNarrativeCards.length, 1))}/
                      {Math.max(showcaseNarrativeCards.length, 1)}
                    </span>
                  </div>

                  {activeShowcaseCard ? (
                    <article
                      className="px-1"
                      onMouseEnter={() => handleShowcaseCardMouseEnter(activeShowcaseCard)}
                      onMouseLeave={() => handleShowcaseCardMouseLeave(activeShowcaseCard)}
                    >
                      <div
                        className="glass-effect relative overflow-hidden rounded-2xl border bg-white/5 p-5 sm:p-8 mx-auto w-[88vw] max-w-[24rem] sm:max-w-none sm:w-auto"
                        style={{
                          borderColor:
                            MINIVERSE_TILE_COLORS[activeShowcaseCard.formatId]?.border ??
                            MINIVERSE_TILE_COLORS.default.border,
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-90"
                          style={{
                            backgroundImage: activeShowcaseCard.customGradient ||
                              MINIVERSE_TILE_GRADIENTS[activeShowcaseCard.formatId] ||
                              MINIVERSE_TILE_GRADIENTS.default,
                            filter: 'saturate(1.1)',
                            backgroundSize: '160% 160%',
                            backgroundPosition: '0% 0%',
                          }}
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-95 mix-blend-screen"
                          style={{
                            backgroundImage:
                              MINIVERSE_STARFIELDS[activeShowcaseCard.id] ?? MINIVERSE_STARFIELDS.default,
                          }}
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen star-pulse"
                          style={{
                            backgroundImage:
                              'radial-gradient(6px 6px at 18% 26%, rgba(255,255,255,0.9), transparent 70%),' +
                              'radial-gradient(5px 5px at 72% 38%, rgba(255,255,255,0.85), transparent 70%),' +
                              'radial-gradient(7px 7px at 60% 68%, rgba(255,255,255,0.85), transparent 72%),' +
                              'radial-gradient(4px 4px at 38% 58%, rgba(255,255,255,0.8), transparent 70%)',
                          }}
                        />
                        <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
                        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-center">
                          <div className="flex flex-col gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`h-12 w-12 rounded-full bg-gradient-to-br ${activeShowcaseCard.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                              >
                                {activeShowcaseCard.icon ? (
                                  <activeShowcaseCard.icon size={22} className="text-white drop-shadow-sm" />
                                ) : (
                                  activeShowcaseCard.thumbLabel
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                                  {activeShowcaseCard.eyebrow || 'Autoficción en fragmentos'}
                                </p>
                                <h3
                                  className={`${isInlineMode
                                    ? shouldUseSingleLinePortalTitle(activeShowcaseCard.title, { force: activeShowcaseCard.isPrologue })
                                      ? activeShowcaseCard.isPrologue
                                        ? 'hero-inline-card-title-prologue'
                                        : 'hero-inline-card-title-singleline'
                                      : 'text-4xl font-semibold leading-[1.02] tracking-[-0.01em]'
                                    : 'font-display text-3xl'} text-slate-50`}
                                  style={inlineCardTitleStyle}
                                >
                                  {activeShowcaseActNumber ? (
                                    <>
                                      <span className="hero-inline-act-number">
                                        {inlineActNumberDisplay || activeShowcaseActNumber}
                                      </span>
                                      {' - '}
                                      <span>{activeShowcaseTitleText}</span>
                                    </>
                                  ) : (
                                    activeShowcaseTitleText
                                  )}
                                </h3>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                type="button"
                                onClick={() => handleShowcasePrimaryCta(activeShowcaseCard)}
                                className="narrative-cta-btn py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                              >
                                <span>{activeShowcaseCard.ctaLabel ?? activeShowcaseCard.titleShort ?? activeShowcaseCard.title}</span>
                              </Button>
                              <Button
                                type="button"
                                onClick={handleExploreMobileShowcase}
                                className="bg-white text-slate-900 hover:bg-white/90 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                              >
                                <span className="w-full truncate text-center">{mobileExploreButtonLabel}</span>
                              </Button>
                            </div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">
                              {activeShowcaseVideoHint}
                            </p>
                          </div>
                          <div className="w-full">
                            <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                              {sharedShowcaseVideoUrl ? (
                                <>
                                  <video
                                    ref={desktopShowcaseVideoRef}
                                    src={sharedShowcaseVideoUrl}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    playsInline
                                    muted
                                    loop
                                    preload="metadata"
                                    data-showcase-preview="desktop-shared"
                                  />
                                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                                  <div className="hero-inline-video-glass-overlay" />
                                
                                  <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                      key={`desktop-showcase-synopsis-${activeShowcaseCard.id}`}
                                      initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                      exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                      className="hero-inline-video-synopsis-layer pointer-events-none"
                                    >
                                      <p className="hero-inline-video-synopsis mx-auto max-w-[88%] text-center">
                                        {activeShowcaseCard.description}
                                      </p>
                                    </motion.div>
                                  </AnimatePresence>
                                </>
                              ) : (
                                <IncendioVideoPlaceholder compact />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : activeTab === 'escaparate' && isMobileViewport ? (
                <div className="md:col-span-2 space-y-4">
       
                  {activeShowcaseCard ? (
                    <article
                      className="glass-effect relative overflow-hidden rounded-2xl border bg-white/5 p-5 sm:p-8"
                      style={{
                        borderColor:
                          MINIVERSE_TILE_COLORS[activeShowcaseCard.formatId]?.border ??
                          MINIVERSE_TILE_COLORS.default.border,
                      }}
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-90"
                        style={{
                          backgroundImage: activeShowcaseCard.customGradient ||
                            MINIVERSE_TILE_GRADIENTS[activeShowcaseCard.formatId] ||
                            MINIVERSE_TILE_GRADIENTS.default,
                          filter: 'saturate(1.1)',
                          backgroundSize: '160% 160%',
                          backgroundPosition: '0% 0%',
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-95 mix-blend-screen"
                        style={{
                          backgroundImage:
                            MINIVERSE_STARFIELDS[activeShowcaseCard.id] ?? MINIVERSE_STARFIELDS.default,
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen star-pulse"
                        style={{
                          backgroundImage:
                            'radial-gradient(6px 6px at 18% 26%, rgba(255,255,255,0.9), transparent 70%),' +
                            'radial-gradient(5px 5px at 72% 38%, rgba(255,255,255,0.85), transparent 70%),' +
                            'radial-gradient(7px 7px at 60% 68%, rgba(255,255,255,0.85), transparent 72%),' +
                            'radial-gradient(4px 4px at 38% 58%, rgba(255,255,255,0.8), transparent 70%)',
                        }}
                      />
                      <div className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
                      <div className="relative z-10 grid gap-6 items-center">
                        <div className="flex flex-col gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`h-12 w-12 rounded-full bg-gradient-to-br ${activeShowcaseCard.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                            >
                              {activeShowcaseCard.icon ? (
                                <activeShowcaseCard.icon size={22} className="text-white drop-shadow-sm" />
                              ) : (
                                activeShowcaseCard.thumbLabel
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                                {activeShowcaseCard.eyebrow || 'Autoficción en fragmentos'}
                              </p>
                              <h3
                                className={`${isInlineMode
                                  ? shouldUseSingleLinePortalTitle(activeShowcaseCard.title, { force: activeShowcaseCard.isPrologue })
                                    ? activeShowcaseCard.isPrologue
                                      ? 'hero-inline-card-title-prologue'
                                      : 'hero-inline-card-title-singleline'
                                    : 'text-4xl font-semibold leading-[1.02] tracking-[-0.01em]'
                                  : 'font-display text-3xl'} text-slate-50`}
                                style={inlineCardTitleStyle}
                              >
                                {activeShowcaseActNumber ? (
                                  <>
                                    <span className="hero-inline-act-number">
                                      {inlineActNumberDisplay || activeShowcaseActNumber}
                                    </span>
                                    {' - '}
                                    <span>{activeShowcaseTitleText}</span>
                                  </>
                                ) : (
                                  activeShowcaseTitleText
                                )}
                              </h3>
                            </div>
                          </div>
                          <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)] text-left">
                            {sharedShowcaseVideoUrl ? (
                              <>
                                <video
                                  ref={mobileShowcaseVideoRef}
                                  src={sharedShowcaseVideoUrl}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  playsInline
                                  muted
                                  loop
                                  autoPlay
                                  preload="metadata"
                                  data-showcase-video="mobile-shared"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                                <div className="hero-inline-video-glass-overlay" />
                                <AnimatePresence mode="wait" initial={false}>
                                  <motion.div
                                    key={`mobile-showcase-synopsis-${activeShowcaseCard.id}`}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="hero-inline-video-synopsis-layer pointer-events-none"
                                  >
                                    <p className="hero-inline-video-synopsis mx-auto max-w-[88%] text-center">
                                      {activeShowcaseCard.description}
                                    </p>
                                  </motion.div>
                                </AnimatePresence>
                       
                              </>
                            ) : (
                              <IncendioVideoPlaceholder compact />
                            )}
                          </div>
                          <div className="flex flex-col gap-3">
                            <Button
                              type="button"
                              onClick={handleExploreMobileShowcase}
                              className="bg-white text-slate-900 hover:bg-white/90 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                            >
                              <span className="w-full truncate text-center">{mobileExploreButtonLabel}</span>
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleShowcasePrimaryCta(activeShowcaseCard)}
                              className="narrative-cta-btn py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                            >
                              <span>{activeShowcaseCard.ctaLabel ?? activeShowcaseCard.titleShort ?? activeShowcaseCard.title}</span>
                            </Button>
                            <p className="w-full text-center text-xs uppercase tracking-[0.35em] text-slate-300/70">
                              {activeShowcaseVideoHint}
                            </p>
                          </div>
                
                        </div>
                      </div>
                    </article>
                  ) : null}
                </div>
              ) : selectedMiniverse ? (
                <div className="md:col-span-2">
                  <div
                    className="glass-effect relative overflow-hidden rounded-2xl border bg-white/5 p-6 sm:p-8 space-y-0"
                    style={{
                      borderColor:
                        MINIVERSE_TILE_COLORS[selectedMiniverse.formatId]?.border ??
                        MINIVERSE_TILE_COLORS.default.border,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{
                        backgroundImage:
                          MINIVERSE_TILE_GRADIENTS[selectedMiniverse.formatId] ??
                          MINIVERSE_TILE_GRADIENTS.default,
                        filter: 'saturate(1.1)',
                        backgroundSize: '160% 160%',
                        backgroundPosition: '0% 0%',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen"
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
                    <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-center">
                      <div className="flex flex-col gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${selectedMiniverse.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                          >
                            {selectedMiniverse.icon ? (
                              <selectedMiniverse.icon size={22} className="text-white drop-shadow-sm" />
                            ) : (
                              selectedMiniverse.thumbLabel
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Narrativa expandida</p>
                            <h3
                              className={`${isInlineMode
                                ? shouldUseSingleLinePortalTitle(selectedMiniverse.title)
                                  ? 'hero-inline-card-title-singleline'
                                  : 'text-4xl font-semibold leading-[1.02] tracking-[-0.01em]'
                                : 'font-display text-3xl'} text-slate-50`}
                              style={inlineCardTitleStyle}
                            >
                              {selectedMiniverse.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300/90 leading-relaxed">
                          {selectedMiniverse.description}
                        </p>
                        <div className="lg:hidden w-full">
                          <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                            {selectedMiniverse.videoUrl ? (
                              <>
                                <video
                                  src={selectedMiniverse.videoUrl}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  playsInline
                                  muted
                                  loop
                                  controls
                                />
                                <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                  Escena en proceso
                                </div>
                              </>
                            ) : (
                              <IncendioVideoPlaceholder compact />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            type="button"
                            onClick={handleEnterMiniverse}
                            className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                          >
                            {selectedMiniverse.ctaVerb ?? 'Abrir portal'}
                          </Button>
                          <button
                            type="button"
                            onClick={handleReturnToList}
                            className="rounded-lg border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-300 hover:text-white hover:border-purple-300/40 transition"
                          >
                            Tocar otra puerta
                          </button>
                        </div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                          Testimonio en video
                        </p>
                      </div>
                      <div className="w-full">
                        <div className="hidden lg:block relative w-full aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                          {selectedMiniverse.videoUrl ? (
                            <>
                              <video
                                src={selectedMiniverse.videoUrl}
                                className="absolute inset-0 h-full w-full object-cover"
                                playsInline
                                muted
                                loop
                                controls
                              />
                              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                Escena en proceso
                              </div>
                            </>
                          ) : (
                            <IncendioVideoPlaceholder compact />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 w-full max-w-3xl mx-auto space-y-4">
     
                  <div className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-slate-900/80 via-[#0b1431]/85 to-[#050917]/90 p-3.5 sm:w-full sm:max-w-none sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.55)]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-35"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 20% 12%, rgba(129,140,248,0.22) 0%, transparent 45%), radial-gradient(circle at 82% 24%, rgba(167,139,250,0.18) 0%, transparent 38%), radial-gradient(circle at 50% 120%, rgba(14,165,233,0.12) 0%, transparent 50%)',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-[0.18]"
                      style={{
                        backgroundImage:
                          'radial-gradient(1px 1px at 10% 18%, rgba(255,255,255,0.75), transparent 60%), radial-gradient(1px 1px at 26% 42%, rgba(255,255,255,0.55), transparent 60%), radial-gradient(1.5px 1.5px at 42% 30%, rgba(226,232,240,0.55), transparent 65%), radial-gradient(1px 1px at 58% 64%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(1.5px 1.5px at 76% 36%, rgba(226,232,240,0.5), transparent 65%), radial-gradient(1px 1px at 88% 74%, rgba(255,255,255,0.4), transparent 60%)',
                      }}
                    />
                    <div
                      className={`relative w-full grid ${
                        isInlineMode ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3'
                      } gap-3 sm:gap-6`}
                    >
                      {visibleMiniverseCards.map((card) => {
                        const isUpcoming = Boolean(card.isUpcoming);
                        const isVisited = !isUpcoming && Boolean(visitedMiniverses[card.id]);
                        const communityHearts = communityLikeMap.get(card.formatId) ?? 0;
                        const appLabel = card.appName ?? (card.title ?? '').replace(/^Miniverso\s+/i, '');
                        return (
                          <div key={card.title} className="relative mx-auto w-full">
                            {showFavoritesOnly ? (
                              <span className="absolute -left-2 -top-2 z-10 inline-flex items-center gap-1 rounded-full border border-rose-300/60 bg-rose-500/15 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.35)]">
                                <Heart size={10} fill="currentColor" />
                                {communityHearts}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleSelectCard(card, 'grid')}
                              disabled={isUpcoming}
                              aria-label={card.ctaVerb ?? card.appName ?? card.title}
                              className={`group relative mx-auto flex w-full flex-col items-center justify-start gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:cursor-not-allowed ${
                                isUpcoming ? 'opacity-70' : 'hover:scale-[1.03] active:scale-[0.98]'
                              }`}
                            >
                              {isUpcoming ? (
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-white/10 bg-slate-800/50 flex items-center justify-center text-slate-200 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                                  {card.icon ? <card.icon size={28} className="text-slate-200/80" /> : card.thumbLabel}
                                </div>
                              ) : null}
                              {!isUpcoming ? (
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                                  <div
                                    className={`h-full w-full rounded-2xl overflow-hidden border bg-black/35 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition duration-300 ${
                                      isVisited
                                        ? 'border-white/15'
                                        : 'border-white/10 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(80,40,160,0.35)]'
                                    }`}
                                  >
                                    <img
                                      src={MINIVERSE_ICON_IMAGES[card.formatId] ?? MINIVERSE_ICON_PLACEHOLDER}
                                      alt={card.appName ?? card.title}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  {isVisited ? (
                                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/80 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.55)]">
                                      <Check size={12} strokeWidth={2.4} />
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              <span className="text-center text-[0.65rem] sm:text-xs text-slate-300/90 leading-tight">
                                {appLabel}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                      {showFavoritesOnly && visibleMiniverseCards.length === 0 ? (
                        <div
                          className={`${
                            isInlineMode ? 'col-span-3' : 'col-span-2 md:col-span-3'
                          } rounded-2xl border border-white/15 bg-black/30 p-4 text-center`}
                        >
                          <p className="text-xs sm:text-sm text-slate-300/90">
                            Aún no hay suficientes likes para construir favoritas de comunidad.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowFavoritesOnly(false)}
                            className="mt-3 text-xs uppercase tracking-[0.25em] text-purple-200 hover:text-white transition"
                          >
                            Ver todas
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="relative mt-6 pt-5">
                      <div className="absolute left-0 right-0 top-0 h-px bg-white/10" />
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                        <button
                          type="button"
                          onClick={() => setShowFavoritesOnly((prev) => !prev)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
                            showFavoritesOnly
                              ? 'border-rose-300/60 bg-rose-500/15 text-rose-100'
                              : 'border-white/20 bg-black/25 text-slate-100 hover:bg-white/15'
                          }`}
                          aria-pressed={showFavoritesOnly}
                          aria-label="Mostrar favoritas de la comunidad"
                        >
                          <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                          {showFavoritesOnly
                            ? `Pulsos ${communityHeartTotal}`
                            : isLoadingCommunityLikes
                              ? 'Comunidad...'
                              : 'Favoritas comunidad'}
                        </button>
                        <div className="h-8 w-px bg-white/15" />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDockShare}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/25 text-slate-100 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                            aria-label="Compartir pantalla de inicio"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={handleDockOpenTransmedia}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/25 text-slate-100 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                            aria-label="Ir a sección transmedia"
                          >
                            <Compass size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!selectedMiniverse && !isInlineMode ? (
              <div
                className={`z-30 mt-6 w-full max-w-3xl mx-auto flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/75 px-3 py-2 text-xs text-slate-400 backdrop-blur-sm ${
                  isInlineMode ? '' : 'sticky bottom-2'
                }`}
              >
                <span>{activeTabLabel}</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="relative z-40 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-purple-300/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                >
                  <span>Cerrar</span>
                  <span aria-hidden="true" className="text-[0.7rem]">✕</span>
                </button>
              </div>
            ) : null}
            </div>
            </div>
          </motion.div>
        </motion.div>
  ) : null;

  const causeSiteOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isCauseSiteOpen ? (
          <motion.div
            key="miniverse-cause-site-iframe"
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
                      Abrir en nueva pestaña
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

  const showcaseNarrativeOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {showcaseFullscreenCard ? (
          <motion.div
            key="miniverse-showcase-narrative-video"
            className="fixed inset-0 z-[176] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseShowcaseFullscreen}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Video narrativo: ${showcaseFullscreenCard.title}`}
              className={`relative z-10 my-6 w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/92 shadow-[0_35px_120px_rgba(0,0,0,0.7)] ${
                isMobileViewport ? 'max-w-sm' : 'max-w-5xl'
              }`}
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">
                    Video narrativo completo
                  </p>
                  <h3 className="font-display text-2xl text-slate-100">{showcaseFullscreenCard.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseShowcaseFullscreen}
                  className="text-slate-300 hover:text-white transition"
                >
                  Cerrar ✕
                </button>
              </div>
              <div className={`relative w-full bg-black ${isMobileViewport ? 'aspect-[9/16]' : 'aspect-[16/9]'}`}>
                {activeShowcaseFullscreenVideoUrl ? (
                  <video
                    src={activeShowcaseFullscreenVideoUrl}
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <IncendioVideoPlaceholder />
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <>
      {shouldAnimatePresence ? <AnimatePresence>{modalLayer}</AnimatePresence> : modalLayer}
      {causeSiteOverlay}
      {showcaseNarrativeOverlay}
    </>
  );
};

export default MiniverseModal;
