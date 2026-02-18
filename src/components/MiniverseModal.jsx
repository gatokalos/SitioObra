import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { BookOpen, Brain, Check, Compass, Coffee, Coins, Drama, Film, Gamepad2, Heart, HeartHandshake, HeartPulse, MapIcon, Music, Palette, School, Share2, Smartphone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeSetItem } from '@/lib/safeStorage';
import { getTopShowcaseLikes } from '@/services/showcaseLikeService';
import { isSafariBrowser } from '@/lib/browser';
import {
  MINIVERSE_HOME_EVENT_TYPES,
  trackMiniverseHomeEvent,
} from '@/services/miniverseHomeAnalyticsService';

const TABS = [
  { id: 'escaparate', label: 'Entender', icon: Sparkles },
  { id: 'experiences', label: 'Decidir', icon: Gamepad2 },
  { id: 'waitlist', label: 'Sostener', icon: HeartHandshake },
];
const DEFAULT_TAB_ID = 'escaparate';
const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));

const MINIVERSE_PORTAL_ROUTES = {
  drama: '/portal-voz',
  literatura: '/portal-lectura',
  taza: '/portal-artesanias',
};

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
    titleShort: 'Abre la puerta',
    description: 'Todo empezó ahí. El escenario no cerró cuando bajó el telón.',
    videoUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/miniversos/chat_obra.mp4',
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
    titleShort: 'Lee entre grietas',
    description: 'Lo que no cabía en escena necesitó otro lenguaje.',
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
    titleShort: 'Lo que se sostiene',
    description:
      'Cuando todo se vuelve abstracto, algo pequeño puede anclarte.',
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
    title: '04 - El trazo',
    titleShort: 'La imagen de sí',
    description: 'Mirarse desde afuera también es una forma de verdad.',
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
    title: '05 - La cámara',
    titleShort: 'El quiebre',
    description: 'La cámara no protege. Solo muestra.',
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
    titleShort: 'La memoria',
    description: 'Algunas cosas no se inventan. Se recuerdan.',
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
    titleShort: 'El límite',
    description: 'Somos finitos. Y aun así nos movemos.',
    videoUrl: null,
    ctaVerb: 'Siente',
    action: 'Explora',
  },
  {
    id: 'apps',
    formatId: 'apps',
    appName: 'Apps',
    icon: Smartphone,
    thumbLabel: 'J',
    thumbGradient: 'from-lime-400/80 via-emerald-500/70 to-teal-500/60',
    glassTint: '138 60% 48%',
    title: '08 - El juego',
    titleShort: 'La elección',
    description: 'No hay un solo recorrido. Tú decides cómo entrar.',
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
    titleShort: 'La revelación',
    description: 'No responde. Devuelve.',
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
  'Hola,%0Ami suscripción está activa pero no aparece ligada a mi cuenta.%0A¿Me ayudan a vincularla?%0A%0AGracias.';
const SUBSCRIPTION_PRICE_ID = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
const CAUSE_SITE_URL = 'https://www.ayudaparalavida.com/index.html';

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

const MiniverseModal = ({
  open,
  onClose,
  onSelectMiniverse,
  initialTabId = null,
  shelved = false,
  stayOpenOnSelect = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSafari = isSafariBrowser();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID);
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMiniverseId, setSelectedMiniverseId] = useState(null);
  const [selectedUpcomingId, setSelectedUpcomingId] = useState(null);
  const [visitedMiniverses, setVisitedMiniverses] = useState({});
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [isShowcaseAutoPlay, setIsShowcaseAutoPlay] = useState(true);
  const [showcaseCountdown, setShowcaseCountdown] = useState(9);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showcaseEnergy, setShowcaseEnergy] = useState(() =>
    readStoredJson('gatoencerrado:showcase-energy', {})
  );
  const [showcaseBoosts, setShowcaseBoosts] = useState(() =>
    readStoredJson('gatoencerrado:showcase-boosts', {})
  );
  const [communityOptIn, setCommunityOptIn] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [communityTopLikes, setCommunityTopLikes] = useState([]);
  const [isLoadingCommunityLikes, setIsLoadingCommunityLikes] = useState(false);
  const [isCauseSiteOpen, setIsCauseSiteOpen] = useState(false);
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
  const showcaseRef = useRef(null);

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
          console.warn('[MiniverseModal] No se pudo validar suscripción:', error);
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
  }, [user?.id]);

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
      const resolvedInitialTab = VALID_TAB_IDS.has(initialTabId) ? initialTabId : DEFAULT_TAB_ID;
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const isMobile = mediaQuery.matches;
        setIsMobileViewport(isMobile);
      }
      setActiveTab(resolvedInitialTab);
      setFormState(initialFormState);
      setStatus('idle');
      setErrorMessage('');
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
      setActiveShowcaseIndex(0);
      setIsShowcaseAutoPlay(true);
      setShowcaseCountdown(9);
      setIsCauseSiteOpen(false);
      setShowcaseEnergy(readStoredJson('gatoencerrado:showcase-energy', {}));
      setShowcaseBoosts(readStoredJson('gatoencerrado:showcase-boosts', {}));
      return;
    }
    setIsCauseSiteOpen(false);
  }, [initialTabId, open]);

  useEffect(() => {
    if (open && !shelved) {
      document.documentElement.dataset.miniverseOpen = 'true';
      return;
    }
    delete document.documentElement.dataset.miniverseOpen;
  }, [open, shelved]);

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
      setActiveTab(DEFAULT_TAB_ID);
    };
    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (!open || shelved) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, shelved]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const activeTabLabel = useMemo(
    () => TABS.find((tab) => tab.id === activeTab)?.label ?? TABS[0].label,
    [activeTab]
  );
  const activeTabIntro = useMemo(() => {
    if (activeTab === 'experiences') {
      return {
        lead: 'Te presentamos los nueve miniversos como una pantalla de inicio:',
        highlight:
          'Un formato familiar para explorar y volver cuando quieras.',
          continuation: 'Con tu huella activa, accedes a la versión completa en miniversos.ai.'
      };
    }
    if (activeTab === 'escaparate') {
      return {
      lead: 'Esta galería despliega una microficción en nueve actos.',
      highlight: 'Cada acto dialoga con un miniverso',
      continuation: 'y abre la misma pregunta: ¿qué ocurre cuando la obra se expande y exige otro lenguaje?'
      };
    }
    return {
      lead: 'Activa el acceso completo a los miniversos,',
      highlight: 'impulsa acompañamiento emocional real y mantiene viva la experiencia artística más allá del escenario.',
      continuation: 'Tu participación deja impacto tangible.'
    };
  }, [activeTab]);
  const showcaseMiniverses = useMemo(
    () => MINIVERSE_CARDS.filter((card) => !card.isUpcoming),
    []
  );
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
    setVisitedMiniverses((prev) => (prev[miniverseId] ? prev : { ...prev, [miniverseId]: true }));
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
      if (selectedMiniverseId) {
        markMiniverseVisited(selectedMiniverseId);
      }
      setActiveTab(tabId);
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
      setActiveShowcaseIndex(0);
      requestAnimationFrame(() => {
        if (tabId === 'escaparate') {
          const node = showcaseRef.current;
          if (node) {
            node.scrollTo({ left: 0, behavior: 'auto' });
          }
        }
      });
    },
    [markMiniverseVisited, selectedMiniverseId]
  );

  const handleClose = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    onClose?.();
  }, [markMiniverseVisited, onClose, selectedMiniverseId, status]);

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
      onSelectMiniverse?.(card.formatId);
      if (!stayOpenOnSelect) {
        handleClose();
      }
    },
    [
      handleClose,
      markMiniverseVisited,
      onSelectMiniverse,
      playKnockSound,
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
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    setSelectedMiniverseId(null);
  }, [markMiniverseVisited, selectedMiniverseId]);

  const legacyScrollToSection = useCallback(() => {
    if (!selectedMiniverse) return;
    // legacy: scroll to section
    onSelectMiniverse?.(selectedMiniverse.formatId);
  }, [onSelectMiniverse, selectedMiniverse]);

  const handleEnterMiniverse = useCallback(() => {
    if (!selectedMiniverse) return;
    markMiniverseVisited(selectedMiniverse.id);
    trackAppClick(selectedMiniverse, 'detail-enter');
    const portalRoute = MINIVERSE_PORTAL_ROUTES[selectedMiniverse.id];
    if (portalRoute) {
      navigate(portalRoute);
      handleClose();
      return;
    }
    legacyScrollToSection();
    if (!stayOpenOnSelect) {
      handleClose();
    }
  }, [
    handleClose,
    legacyScrollToSection,
    markMiniverseVisited,
    navigate,
    selectedMiniverse,
    stayOpenOnSelect,
    trackAppClick,
  ]);

  const handleEnterShowcase = useCallback(
    (card) => {
      if (!card) return;
      if (!visitedMiniverses[card.id]) {
        playKnockSound();
      }
      markMiniverseVisited(card.id);
      trackAppClick(card, 'showcase-card');
      const portalRoute = MINIVERSE_PORTAL_ROUTES[card.id];
      if (portalRoute) {
        navigate(portalRoute);
        handleClose();
        return;
      }
      onSelectMiniverse?.(card.formatId);
      if (!stayOpenOnSelect) {
        handleClose();
      }
    },
    [
      handleClose,
      isSubscriber,
      markMiniverseVisited,
      navigate,
      onSelectMiniverse,
      playKnockSound,
      stayOpenOnSelect,
      trackAppClick,
      visitedMiniverses,
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

  const handleCommunityOptIn = useCallback(async () => {
    safeSetItem(
      LOGIN_RETURN_KEY,
      JSON.stringify({ anchor: '#apoya', action: 'community-opt-in' })
    );
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-login-modal'));
      }
      toast({ description: 'Inicia sesión para recibir actualizaciones.' });
      return;
    }
    if (communityOptIn) {
      setCommunityOptIn(false);
      toast({ description: 'Ya no enviaremos este tipo de actualizaciones por ahora.' });
      return;
    }

    setCommunityOptIn(true);
    try {
      const { error } = await supabase.functions.invoke('community-optin-email', {
        body: {
          source: 'miniverse_modal',
          context: 'sostener_tab',
        },
      });
      if (error) {
        throw error;
      }
      toast({ description: 'Te enviamos un correo con los próximos pasos para entender cómo funciona.' });
    } catch (error) {
      console.error('[MiniverseModal] No se pudo enviar correo de opt-in:', error);
      toast({ description: 'Recibimos tu interés, pero no pudimos enviar el correo en este momento.' });
    }
  }, [communityOptIn, user]);

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
    if (typeof document === 'undefined') {
      onClose?.();
      return;
    }
    onClose?.();
    setTimeout(() => {
      document.querySelector('#apoya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 140);
  }, [onClose]);

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

    try {
      setIsCheckoutLoading(true);
      const normalizedEmail = user?.email ? user.email.trim().toLowerCase() : '';
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'subscription',
          line_items: [
            {
              price: SUBSCRIPTION_PRICE_ID,
              quantity: 1,
            },
          ],
          customer_email: normalizedEmail || undefined,
          metadata: {
            channel: 'landing',
            event: 'suscripcion-landing',
            packages: 'subscription',
          },
        },
      });

      if (error || !data?.url) {
        throw error || new Error('No se pudo crear la sesión');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[MiniverseModal] Checkout error:', err);
      toast({ description: err?.message || 'No se pudo abrir la suscripción.' });
    } finally {
      setIsCheckoutLoading(false);
    }
  }, [isCheckoutLoading, user?.email]);

  const handlePlayShowcaseVideo = useCallback((cardId) => {
    if (typeof document === 'undefined') return false;
    const videos = Array.from(
      document.querySelectorAll(`[data-showcase-video="${cardId}"]`)
    );
    if (!videos.length) {
      return false;
    }
    const target = videos.find((video) => video.offsetParent !== null) || videos[0];
    if (!target) {
      return false;
    }
    try {
      target.play?.();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    } catch (error) {
      console.warn('[MiniverseModal] No se pudo reproducir el video', error);
      return false;
    }
  }, []);

  const handleShowcaseCta = useCallback(
    (card) => {
      if (!card) return;
      if (!requireShowcaseLogin(card)) {
        return;
      }
      if (card.videoUrl) {
        const played = handlePlayShowcaseVideo(card.id);
        if (played) {
          return;
        }
      }
      handleEnterShowcase(card);
    },
    [handleEnterShowcase, handlePlayShowcaseVideo, requireShowcaseLogin]
  );

  const scrollShowcaseTo = useCallback((index, behavior = 'smooth') => {
    const node = showcaseRef.current;
    if (!node) return;
    node.scrollTo({ left: node.clientWidth * index, behavior });
  }, []);

  const handleShowcaseScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) {
      return;
    }
    const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
    setActiveShowcaseIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    setShowcaseCountdown(9);
  }, []);

  const pauseShowcaseAutoPlay = useCallback(() => {
    setIsShowcaseAutoPlay(false);
    setShowcaseCountdown(9);
  }, []);

  const resumeShowcaseAutoPlay = useCallback(() => {
    setIsShowcaseAutoPlay(true);
    setShowcaseCountdown(9);
  }, []);

  const handleShowcaseNext = useCallback(() => {
    if (!showcaseMiniverses.length) return;
    const nextIndex = (activeShowcaseIndex + 1) % showcaseMiniverses.length;
    setActiveShowcaseIndex(nextIndex);
    scrollShowcaseTo(nextIndex);
    setShowcaseCountdown(9);
  }, [activeShowcaseIndex, scrollShowcaseTo, showcaseMiniverses.length]);

  const handleShowcasePrev = useCallback(() => {
    if (!showcaseMiniverses.length) return;
    const prevIndex =
      (activeShowcaseIndex - 1 + showcaseMiniverses.length) % showcaseMiniverses.length;
    setActiveShowcaseIndex(prevIndex);
    scrollShowcaseTo(prevIndex);
    setShowcaseCountdown(9);
  }, [activeShowcaseIndex, scrollShowcaseTo, showcaseMiniverses.length]);

  useEffect(() => {
    if (!open || activeTab !== 'escaparate' || showcaseMiniverses.length < 2 || !isShowcaseAutoPlay) {
      return undefined;
    }
    const tick = window.setInterval(() => {
      setShowcaseCountdown((prev) => {
        if (prev <= 1) {
          const nextIndex = (activeShowcaseIndex + 1) % showcaseMiniverses.length;
          setActiveShowcaseIndex(nextIndex);
          scrollShowcaseTo(nextIndex);
          return 9;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [activeShowcaseIndex, activeTab, isShowcaseAutoPlay, open, scrollShowcaseTo, showcaseMiniverses.length]);

  const shouldAnimatePresence = !isSafari;

  const modalLayer = open ? (
    <motion.div
          className={`safari-stable-layer fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-6 sm:px-4 sm:py-10 overflow-y-auto overflow-x-hidden ${
            shelved ? 'pointer-events-none' : ''
          }`}
          initial={shouldAnimatePresence ? 'hidden' : false}
          animate="visible"
          exit={shouldAnimatePresence ? 'hidden' : undefined}
          aria-hidden={shelved ? 'true' : undefined}
        >
          <motion.div
            className={`safari-stable-layer safari-backdrop-lite absolute inset-0 bg-black/80 ${isSafari ? '' : 'backdrop-blur-sm'} ${shelved ? 'pointer-events-none' : ''}`}
            variants={backdropVariants}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal={shelved ? 'false' : 'true'}
            aria-labelledby="miniverse-modal-title"
            variants={modalVariants}
            className={`safari-stable-layer relative z-10 flex w-[calc(100vw-2rem)] max-w-4xl flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-10 shadow-2xl max-h-[95vh] min-h-[95vh] md:max-h-[73vh] md:min-h-[73vh] overflow-hidden ${
              isSafari ? '' : 'transition-[opacity,filter,transform] duration-500'
            } ${
              shelved ? 'pointer-events-none opacity-0 blur-sm scale-[0.98]' : 'opacity-100 blur-0 scale-100'
            }`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(5,5,10,0.35), rgba(5,5,10,0.35))',
                filter: 'grayscale(0.25)',
              }}
            />
            <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pr-0 sm:pr-1">
            <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
              Narrativa expandida
            </p>

            <h2 id="miniverse-modal-title" className="font-display text-3xl text-slate-50">
              Habita el universo de #GatoEncerrado
            </h2>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/90">
              {activeTabIntro.lead}{' '}
              <strong className="font-semibold text-slate-50">
                {activeTabIntro.highlight}
              </strong>
              {activeTabIntro.continuation ? ` ${activeTabIntro.continuation}` : ''}
            </div>

            <div className="mt-6 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-full border px-3 py-2 text-xs sm:px-4 sm:text-sm transition ${
                    activeTab === tab.id
                      ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                      : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab.icon ? (
                      <>
                        <span className="sm:hidden">
                          <tab.icon size={16} className="text-purple-300" />
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
          </div>
        </div>

            <div className="grid md:grid-cols-2 gap-8">
              {activeTab === 'waitlist' ? (
                <>
                  <div className="glass-effect relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-7 text-slate-200/90">
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400/80">
                          Apoya el proyecto
                        </span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="mt-5 space-y-3">
                        <h3 className="font-display text-3xl text-slate-50">
                          Tu huella importa
                        </h3>
                        <p className="text-sm text-slate-300/90 leading-relaxed">
                          Deja tu huella y accede a tu versión personal de la App Causa Social que se implementa en escuelas. 
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
                            disabled={isCheckoutLoading}
                            className="h-11 min-w-[10.5rem] bg-white px-6 text-base font-semibold text-slate-900 hover:bg-white/90"
                          >
                            Activar huella
                          </Button>
                          <button
                            type="button"
                            onClick={handleCommunityOptIn}
                            className="relative flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/60"
                          >
                            <div
                              className={`h-5 w-5 rounded-full border border-white/20 ${
                                communityOptIn ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-slate-600/40'
                              }`}
                            />
                            <span className="text-sm text-slate-300/80 leading-relaxed">
                              Quiero entender cómo funciona.
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-effect relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-7 text-slate-200/90">
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
                            <p className="font-semibold text-slate-100">Tratamientos emocionales</p>
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
                    <button
                      type="button"
                      onClick={handleShowcasePrev}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-slate-300 hover:text-white hover:border-purple-300/40 transition"
                      aria-label="Portal anterior"
                    >
                      <span aria-hidden="true">←</span>
                      Anterior
                    </button>
                    <span>
                      Siguiente portal:{' '}
                      <strong className="text-slate-100">
                        {showcaseMiniverses[(activeShowcaseIndex + 1) % Math.max(showcaseMiniverses.length, 1)]
                          ?.titleShort ?? 'Próximo'}
                      </strong>{' '}
                      · {showcaseCountdown}s
                    </span>
                  </div>

                  <div
                    ref={showcaseRef}
                    onScroll={handleShowcaseScroll}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth scroll-px-4"
                  >
                    {showcaseMiniverses.map((card) => (
                      <article
                        key={`escaparate-${card.id}`}
                        className="w-full min-w-full shrink-0 snap-center px-1"
                      >
                        <div
                          className="glass-effect relative overflow-hidden rounded-2xl border bg-white/5 p-5 sm:p-8 mx-auto w-[88vw] max-w-[24rem] sm:max-w-none sm:w-auto"
                          style={{
                            borderColor:
                              MINIVERSE_TILE_COLORS[card.formatId]?.border ??
                              MINIVERSE_TILE_COLORS.default.border,
                          }}
                        >
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-90"
                            style={{
                              backgroundImage:
                                MINIVERSE_TILE_GRADIENTS[card.formatId] ??
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
                                MINIVERSE_STARFIELDS[card.id] ?? MINIVERSE_STARFIELDS.default,
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
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${card.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                                >
                                  {card.icon ? (
                                    <card.icon size={22} className="text-white drop-shadow-sm" />
                                  ) : (
                                    card.thumbLabel
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">Narrativa expandida</p>
                                  <h3 className="font-display text-3xl text-slate-50">{card.title}</h3>
                                </div>
                              </div>
                              <p className="text-sm text-slate-200/90 leading-relaxed">
                                {card.description}
                              </p>
                              <div className="lg:hidden w-full">
                                <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                                  {card.videoUrl ? (
                                    <>
                                      <video
                                        src={card.videoUrl}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        playsInline
                                        muted
                                        loop
                                        controls
                                        onPlay={pauseShowcaseAutoPlay}
                                        onPause={resumeShowcaseAutoPlay}
                                        data-showcase-video={card.id}
                                      />
                                      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                        Escena en proceso
                                      </div>
                                    </>
                                  ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                                      <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                        ▶︎
                                      </div>
                                      <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  type="button"
                                  onClick={() => handleShowcaseCta(card)}
                                  className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                                >
                                  {card.titleShort ?? card.title}
                                </Button>
                                {card.isPremium ? (
                                  <Button
                                    type="button"
                                    onClick={handleSubscriptionCheckout}
                                    disabled={isCheckoutLoading}
                                    className="bg-white text-slate-900 hover:bg-white/90 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                                  >
                                    {isCheckoutLoading ? 'Abriendo…' : 'Dejar huella'}
                                  </Button>
                                ) : null}
                              </div>
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">
                                Testimonio en video
                              </p>
                            </div>
                            <div className="w-full">
                              <div className="hidden lg:block relative w-full aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                                {card.videoUrl ? (
                                  <>
                                    <video
                                      src={card.videoUrl}
                                      className="absolute inset-0 h-full w-full object-cover"
                                      playsInline
                                      muted
                                      loop
                                      controls
                                      onPlay={pauseShowcaseAutoPlay}
                                      onPause={resumeShowcaseAutoPlay}
                                      data-showcase-video={card.id}
                                    />
                                    <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                      Escena en proceso
                                    </div>
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                                    <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                      ▶︎
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'escaparate' && isMobileViewport ? (
                <div className="md:col-span-2 space-y-4">
                  {showcaseMiniverses.map((card) => (
                    <article
                      key={`escaparate-mobile-${card.id}`}
                      className="glass-effect relative overflow-hidden rounded-2xl border bg-white/5 p-5 sm:p-8"
                      style={{
                        borderColor:
                          MINIVERSE_TILE_COLORS[card.formatId]?.border ??
                          MINIVERSE_TILE_COLORS.default.border,
                      }}
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-90"
                        style={{
                          backgroundImage:
                            MINIVERSE_TILE_GRADIENTS[card.formatId] ??
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
                            MINIVERSE_STARFIELDS[card.id] ?? MINIVERSE_STARFIELDS.default,
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
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-12 w-12 rounded-full bg-gradient-to-br ${card.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                            >
                              {card.icon ? (
                                <card.icon size={22} className="text-white drop-shadow-sm" />
                              ) : (
                                card.thumbLabel
                              )}
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">Narrativa expandida</p>
                              <h3 className="font-display text-3xl text-slate-50">{card.title}</h3>
                            </div>
                          </div>
                          <p className="text-sm text-slate-200/90 leading-relaxed">
                            {card.description}
                          </p>
                          <div className="lg:hidden w-full">
                            <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                              {card.videoUrl ? (
                                <>
                                  <video
                                    src={card.videoUrl}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    playsInline
                                    muted
                                    loop
                                    controls
                                    onPlay={pauseShowcaseAutoPlay}
                                    onPause={resumeShowcaseAutoPlay}
                                    data-showcase-video={card.id}
                                  />
                                  <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                    Escena en proceso
                                  </div>
                                </>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                                  <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                    ▶︎
                                  </div>
                                  <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              type="button"
                              onClick={() => handleShowcaseCta(card)}
                              className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                            >
                              {card.titleShort ?? card.title}
                            </Button>
                            {card.isPremium ? (
                              <Button
                                type="button"
                                onClick={handleSubscriptionCheckout}
                                disabled={isCheckoutLoading}
                                className="bg-white text-slate-900 hover:bg-white/90 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                              >
                                {isCheckoutLoading ? 'Abriendo…' : 'Deja tu huella'}
                              </Button>
                            ) : null}
                          </div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">
                            Testimonio en video
                          </p>
                        </div>
                        <div className="w-full">
                          <div className="hidden lg:block relative w-full aspect-[4/5] rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                            {card.videoUrl ? (
                              <>
                                <video
                                  src={card.videoUrl}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  playsInline
                                  muted
                                  loop
                                  controls
                                  onPlay={pauseShowcaseAutoPlay}
                                  onPause={resumeShowcaseAutoPlay}
                                  data-showcase-video={card.id}
                                />
                                <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-200">
                                  Escena en proceso
                                </div>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                                <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                  ▶︎
                                </div>
                                <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
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
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${selectedMiniverse.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                          >
                            {selectedMiniverse.icon ? (
                              <selectedMiniverse.icon size={22} className="text-white drop-shadow-sm" />
                            ) : (
                              selectedMiniverse.thumbLabel
                            )}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Narrativa expandida</p>
                            <h3 className="font-display text-3xl text-slate-50">{selectedMiniverse.title}</h3>
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
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                                <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                  ▶︎
                                </div>
                                <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                              </div>
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300/70">
                              <div className="h-12 w-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-sm uppercase tracking-[0.3em]">
                                ▶︎
                              </div>
                              <p className="text-xs uppercase tracking-[0.4em]">Video próximamente</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 w-full max-w-3xl mx-auto space-y-4">
     
                  <div className="relative mx-auto w-[calc(100%-0.5rem)] max-w-[19rem] overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-slate-900/80 via-[#0b1431]/85 to-[#050917]/90 p-4 sm:w-full sm:max-w-none sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.55)]">
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
                    <div className="relative w-full grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {visibleMiniverseCards.map((card) => {
                        const isUpcoming = Boolean(card.isUpcoming);
                        const isVisited = !isUpcoming && Boolean(visitedMiniverses[card.id]);
                        const communityHearts = communityLikeMap.get(card.formatId) ?? 0;
                        const appLabel = card.appName ?? (card.title ?? '').replace(/^Miniverso\s+/i, '');
                        return (
                          <div key={card.title} className="relative mx-auto w-24 sm:w-28">
                            {!isUpcoming && isVisited ? (
                              <span className="absolute -right-1 -top-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/80 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.55)]">
                                <Check size={12} strokeWidth={2.4} />
                              </span>
                            ) : null}
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
                              className={`group relative mx-auto flex w-24 sm:w-28 flex-col items-center justify-start gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:cursor-not-allowed ${
                                isUpcoming ? 'opacity-70' : 'hover:scale-[1.03] active:scale-[0.98]'
                              }`}
                            >
                              {isUpcoming ? (
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-white/10 bg-slate-800/50 flex items-center justify-center text-slate-200 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                                  {card.icon ? <card.icon size={28} className="text-slate-200/80" /> : card.thumbLabel}
                                </div>
                              ) : null}
                              {!isUpcoming ? (
                                <div
                                  className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border bg-black/35 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition duration-300 ${
                                    isVisited
                                      ? 'border-emerald-300/50 shadow-[0_0_22px_rgba(16,185,129,0.25)]'
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
                              ) : null}
                              <span className="text-center text-[0.65rem] sm:text-xs text-slate-300/90 leading-tight">
                                {appLabel}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                      {showFavoritesOnly && visibleMiniverseCards.length === 0 ? (
                        <div className="col-span-2 md:col-span-3 rounded-2xl border border-white/15 bg-black/30 p-4 text-center">
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

            {!selectedMiniverse ? (
              <div className="mt-6 w-full max-w-3xl mx-auto flex items-center justify-between text-xs text-slate-500">
                <span>{activeTabLabel}</span>
                <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
                  Cerrar
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
            className="fixed inset-0 z-[175] flex items-center justify-center px-4 py-6"
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
              className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
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

  return (
    <>
      {shouldAnimatePresence ? <AnimatePresence>{modalLayer}</AnimatePresence> : modalLayer}
      {causeSiteOverlay}
    </>
  );
};

export default MiniverseModal;
