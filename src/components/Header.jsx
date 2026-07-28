import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Info, Sparkles, LogIn, Compass, BookOpen, MessageCircle, UserCircle2, DoorOpen, X, ArrowUpRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { INITIAL_GAT_BALANCE, readStoredInt } from '@/components/transmedia/transmediaConstants';
import { readIndexCueUsedFromSession, writeHeroActivatedToSession } from '@/lib/heroActivation';
import useActiveSectionHref from '@/hooks/useActiveSectionHref';
import { fetchTransmediaCreditEvents } from '@/services/transmediaCreditsService';
import useActiveSubscription from '@/hooks/useActiveSubscription';
import { isInstalledPWA } from '@/lib/pwaDetection';
import {
  readBienvenidaRecommendedShowcase,
  findLatestRecommendedPortal,
  findLatestSpendTarget,
  readOraculoRecommendedShowcase,
} from '@/lib/transmediaCreditEventLabels';
import { CATALOG, readGlobalConsent, writeGlobalConsent } from '@/lib/bitacoraShared';
import { ensureAnonId } from '@/lib/identity';

const BITACORA_API_BASE = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const GATOKENS_REVEAL_PULSE_EVENT = 'gatoencerrado:gatokens-reveal-pulse';
const GATOKENS_REVEAL_ACK_EVENT = 'gatoencerrado:gatokens-reveal-ack';
const GATOKEN_COIN_SRC =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png';
const readGatBalance = () => {
  const v = readStoredInt(GAT_BALANCE_STORAGE_KEY, INITIAL_GAT_BALANCE);
  return Number.isFinite(v) ? Math.max(Math.trunc(v), 0) : INITIAL_GAT_BALANCE;
};

const GAT_LINKTREE_DISMISSED_SESSION_KEY = 'gatoencerrado:gat-linktree-dismissed-session';

// El HUB y la bandeja comparten el mismo vocabulario visual que el programa de
// mano: vidrio oscuro, borde fino y color reservado para estados reales.
const GatLinktreeTile = ({ icon: TileIcon, label, onClick, statusDotClass: dotClass, tone = 'neutral', indicator = 'arrow' }) => {
  const isAccountTile = tone === 'cyan';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[6.1rem] flex-col items-center justify-center gap-2 rounded-xl border px-2.5 py-3 text-center transition duration-200 ${
        isAccountTile
          ? 'border-cyan-300/25 bg-cyan-300/[0.045] hover:border-cyan-200/40 hover:bg-cyan-300/[0.075]'
          : 'border-white/[0.085] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.055]'
      }`}
    >
      <span
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-black/25 transition ${
          isAccountTile
            ? 'border-cyan-300/35 text-cyan-100'
            : 'border-white/20 text-slate-200 group-hover:border-white/35 group-hover:text-white'
        }`}
      >
        <TileIcon strokeWidth={1.45} className="h-5 w-5" />
        {dotClass ? (
          <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#08090d] ${dotClass}`} />
        ) : null}
      </span>
      <p
        className="font-display max-w-[8.5rem] text-[0.78rem] leading-[1.15] text-slate-100"
      >
        {label}
      </p>
      {indicator === 'arrow' ? (
        <ArrowUpRight
          size={11}
          strokeWidth={1.7}
          className="absolute right-2.5 top-2.5 text-slate-500 transition group-hover:text-slate-200"
        />
      ) : indicator === 'dot' ? (
        <span className={`absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full ${dotClass ?? 'bg-emerald-400'}`} />
      ) : null}
    </button>
  );
};

const MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED = true;
const TRANSMEDIA_SECONDARY_ITEMS = [
  { label: 'El drama', href: '#transmedia?focus=miniversos' },
  { label: 'El objeto', href: '#transmedia?focus=lataza' },
  { label: 'La palabra', href: '#transmedia?focus=miniversoNovela' },
  { label: 'La apariencia', href: '#transmedia?focus=miniversoGrafico' },
  { label: 'El lente', href: '#transmedia?focus=copycats' },
  { label: 'La vibración', href: '#transmedia?focus=miniversoSonoro' },
  { label: 'El cuerpo', href: '#transmedia?focus=miniversoMovimiento' },
  { label: 'La ventura', href: '#transmedia?focus=apps' },
  { label: 'El reflejo', href: '#transmedia?focus=oraculo' },
];

const Header = ({
  showAllianceNav = true,
  showCuradoriaNav = true,
  showIntermedioNav = false,
  showTransmediaNav = true,
  showPerspectivasNav = false,
  showObraDestacadaNav = false,
  showTerceraLlamadaNav = false,
  showGatChip = true,
  terceraLlamadaLabel = '#Comenzamos',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollTier, setScrollTier] = useState(0);
  const [hasUsedHeroIndexCue, setHasUsedHeroIndexCue] = useState(readIndexCueUsedFromSession);
  // Referencia para saber si el # ya estaba revelado en un montaje previo de
  // esta misma sesión — evita repetir el aro pulsante cada vez que Header se
  // remonta (p. ej. al navegar y volver a "/").
  const wasIndexCueAlreadyUsedAtMountRef = useRef(readIndexCueUsedFromSession());
  const [hasOpenedIndexOnce, setHasOpenedIndexOnce] = useState(false);
  const [hasHeroLeftViewportOnce, setHasHeroLeftViewportOnce] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isGatInfoOpen, setIsGatInfoOpen] = useState(false);
  const [gatInfoPanelStyle, setGatInfoPanelStyle] = useState({});
  const [gatSpendRecommendation, setGatSpendRecommendation] = useState(null);
  const [isGatLoginEligible, setIsGatLoginEligible] = useState(false);
  const [isGatSpendRecommendationLoading, setIsGatSpendRecommendationLoading] = useState(false);
  const [showGatWhatsappInput, setShowGatWhatsappInput] = useState(false);
  const [gatWhatsappPhone, setGatWhatsappPhone] = useState('');
  const [gatWhatsappSubmitting, setGatWhatsappSubmitting] = useState(false);
  const [gatWhatsappDone, setGatWhatsappDone] = useState(() => readGlobalConsent());
  const gatChipRootRef = useRef(null);
  const gatInfoPanelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, signOut } = useAuth();
  const { toast: showToast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const { hasActiveSubscription } = useActiveSubscription(user?.id, session);
  const isSubscriber = Boolean(
    user?.user_metadata?.isSubscriber === true ||
      user?.user_metadata?.isSubscriber === 'true' ||
      hasActiveSubscription
  );
  const isGatLinktreeAudience = Boolean(user) || isInstalledPWA();
  const [isGatLinktreeOpen, setIsGatLinktreeOpen] = useState(
    () => isGatLinktreeAudience && typeof window !== 'undefined' && !window.sessionStorage.getItem(GAT_LINKTREE_DISMISSED_SESSION_KEY)
  );
  // Header y Hero son hermanos — Hero necesita saber, de forma síncrona y
  // dentro de un click handler (no un re-render), si el HUB sigue abierto,
  // para que el # 3D no active la escena por su cuenta mientras tanto
  // (mismo comportamiento que ya existe para PWAInstructionsOverlay). Un
  // dataset en <body> es más simple aquí que subir este estado a un padre
  // común solo para esta lectura puntual.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.dataset.gatHubOpen = isGatLinktreeOpen ? 'true' : 'false';
    return () => {
      delete document.body.dataset.gatHubOpen;
    };
  }, [isGatLinktreeOpen]);
  useEffect(() => {
    if (!isGatLinktreeOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isGatLinktreeOpen]);
  const [isLinktreeSessionExpanded, setIsLinktreeSessionExpanded] = useState(false);
  // Cerrar cualquiera de los dos paneles del sistema de GAT (el HUB que abre
  // solo, o el tooltip que abre el chip) — usado por cualquier acceso del
  // grid que navegue a otro lado, para que no se quede flotando encima.
  // Cierra el HUB y/o el tooltip por CUALQUIER camino (la X, o un tile que
  // navega a otro lado) y siempre activa la escena — el HUB es un puente, no
  // debe dejar al Hero en un estado "a medias" sin importar cómo se cerró.
  // Header y Hero son hermanos, no padre-hijo, así que se coordina por
  // evento global en vez de prop drilling (mismo gesto que cerrar
  // PWAInstructionsOverlay: X → handleIsotipoClick).
  const closeGatPanels = useCallback(() => {
    setIsGatInfoOpen(false);
    setIsGatLinktreeOpen(false);
    // Sin la bandera, el efecto de auto-apertura de abajo ve isGatLinktreeOpen
    // en false (sin registro de "ya lo cerraste") y lo vuelve a abrir de
    // inmediato — por eso antes el HUB "no cerraba" al navegar desde un tile.
    try {
      window.sessionStorage.setItem(GAT_LINKTREE_DISMISSED_SESSION_KEY, '1');
    } catch {
      // Silencioso
    }
    // Cuaderno holográfico y café navegan a OTRA ruta (/bitacora,
    // /portal-encuentros) — eso desmonta Hero.jsx casi de inmediato. El
    // evento de abajo sí llega (dispatchEvent es síncrono), pero el efecto
    // de Hero.jsx que persiste hasActivatedAudio a sessionStorage puede no
    // alcanzar a correr antes de que la ruta cambie y Hero se desmonte —
    // por eso solo "Explorar recomendación" (navegación en la misma
    // página) se veía activar la escena de verdad. Se escribe aquí también,
    // directo y síncrono, para no depender de que ese efecto alcance a
    // correr: así, cuando Hero vuelva a montar, ya lee la sesión activada.
    writeHeroActivatedToSession(true);
    window.dispatchEvent(new CustomEvent('gatoencerrado:activate-scene-request'));
  }, []);
  useEffect(() => {
    if (!isGatLinktreeOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeGatPanels();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeGatPanels, isGatLinktreeOpen]);
  useEffect(() => {
    if (!isGatLinktreeAudience || isGatLinktreeOpen) return;
    try {
      if (window.sessionStorage.getItem(GAT_LINKTREE_DISMISSED_SESSION_KEY)) return;
    } catch {
      // Silencioso
    }
    setIsGatLinktreeOpen(true);
  }, [isGatLinktreeAudience, isGatLinktreeOpen]);
  const handleOpenBackstage = useCallback(async () => {
    closeGatPanels();
    const base = 'https://gatoencerrado.org';
    const win = window.open(`${base}/mi-cuenta/acceso`, '_blank', 'noopener,noreferrer');
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.access_token && win && !win.closed) {
      const params = new URLSearchParams({ token: currentSession.access_token });
      if (currentSession.refresh_token) params.set('refresh', currentSession.refresh_token);
      win.location.replace(`${base}/api/auth/handoff?${params}`);
    }
  }, [closeGatPanels]);

  const profileName =
    user?.user_metadata?.alias ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : '');
  const simplifiedName = profileName ? profileName.trim().split(/\s+/)[0] : '';
  const greetingLabel = user ? `Hola ${simplifiedName || 'gato'}` : '';
  const authActionLabel = user ? 'Cerrar sesión' : 'Iniciar sesión';
  const statusDotClass = user ? 'bg-emerald-400' : 'bg-slate-600';
  // Mientras el # del Hero siga presente sin usarse, el toggle # del Header
  // se mantiene oculto: solo debe haber un # clicable en pantalla a la vez.
  const shouldGateIndexUntilHeroReveal = !user && location.pathname === '/' && !hasUsedHeroIndexCue;
  // Aro pulsante que guía la vista hacia el # recién revelado — se apaga en
  // cuanto el usuario lo usa, el Hero sale del viewport, o si ya se había
  // revelado en un montaje previo de esta sesión (ver wasIndexCueAlreadyUsedAtMountRef).
  const showIndexGuidePulse =
    hasUsedHeroIndexCue &&
    !wasIndexCueAlreadyUsedAtMountRef.current &&
    !hasOpenedIndexOnce &&
    !hasHeroLeftViewportOnce;


  const [gatBalance, setGatBalance] = useState(readGatBalance);
  const [gatRevealPulse, setGatRevealPulse] = useState(null);
  useEffect(() => {
    const sync = () => setGatBalance(readGatBalance());
    window.addEventListener('gatoencerrado:gatokens-balance-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('gatoencerrado:gatokens-balance-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Este primer clic en el # del Hero solo revela el # del Header —
    // a propósito NO abre el menú (eso requiere un segundo clic explícito
    // en el # ya revelado, ver handleToggleIndex).
    const handleIndexCueUsed = () => setHasUsedHeroIndexCue(true);

    window.addEventListener('gatoencerrado:hero-index-cue-used', handleIndexCueUsed);
    return () => {
      window.removeEventListener('gatoencerrado:hero-index-cue-used', handleIndexCueUsed);
    };
  }, []);

  // Apaga el aro pulsante del # (ver showIndexGuidePulse) en cuanto el Hero
  // sale del viewport — a partir de ahí el # ya es el foco natural de la
  // pantalla y no necesita seguir llamando la atención.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleHeroLeftViewport = () => setHasHeroLeftViewportOnce(true);
    window.addEventListener('gatoencerrado:hero-left-viewport', handleHeroLeftViewport);
    return () => {
      window.removeEventListener('gatoencerrado:hero-left-viewport', handleHeroLeftViewport);
    };
  }, []);

  useEffect(() => {
    if (shouldGateIndexUntilHeroReveal) {
      setIsMenuOpen(false);
    }
  }, [shouldGateIndexUntilHeroReveal]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpenIndex = () => {
      if (shouldGateIndexUntilHeroReveal) return;
      setIsMenuOpen(true);
    };
    window.addEventListener('gatoencerrado:open-index', handleOpenIndex);
    return () => window.removeEventListener('gatoencerrado:open-index', handleOpenIndex);
  }, [shouldGateIndexUntilHeroReveal]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleRevealPulse = (event) => {
      const nextBalance = Number(event?.detail?.balance);
      const safeNextBalance = Number.isFinite(nextBalance) ? Math.max(Math.trunc(nextBalance), 0) : gatBalance;

      if (safeNextBalance <= 0) {
        setGatRevealPulse(null);
        return;
      }

      setGatBalance(safeNextBalance);
      setGatRevealPulse({ id: Date.now() });
    };

    const handleRevealAck = () => {
      setGatRevealPulse(null);
    };

    window.addEventListener(GATOKENS_REVEAL_PULSE_EVENT, handleRevealPulse);
    window.addEventListener(GATOKENS_REVEAL_ACK_EVENT, handleRevealAck);
    return () => {
      window.removeEventListener(GATOKENS_REVEAL_PULSE_EVENT, handleRevealPulse);
      window.removeEventListener(GATOKENS_REVEAL_ACK_EVENT, handleRevealAck);
    };
  }, [gatBalance]);

  const handleCloseOverlay = useCallback(() => setShowLoginOverlay(false), []);

  const handleLogout = useCallback(async () => {
    if (!user) {
      return;
    }
    const { error } = await signOut();
    if (error) {
      showToast({
        description: error.message || 'No pudimos cerrar sesión. Intenta más tarde.',
      });
      return;
    }
    showToast({
      description: 'Sesión cerrada correctamente.',
    });
  }, [signOut, showToast, user]);

  const handleAuthActionFromMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (user) {
      void handleLogout();
    }
  }, [handleLogout, user]);

  const handleOpenLoginFromGatTooltip = useCallback(() => {
    setIsGatInfoOpen(false);
    setShowLoginOverlay(true);
  }, []);

  // Atajo al cuaderno holográfico desde el tooltip de GAT — reusa la misma
  // recomendación que ya calcula el bloque de arriba como punto de entrada.
  // Una vez adentro, cambiar de miniverso es trivial (constelación de
  // CuadernoHolografico), así que no hace falta que la elección sea perfecta.
  const handleOpenHolograficoFromGatTooltip = useCallback(() => {
    const entry = CATALOG.find((c) => c.showcase === gatSpendRecommendation?.showcaseId);
    const portalKey = entry?.key ?? 'oraculo';
    closeGatPanels();
    navigate(`/bitacora?t=${encodeURIComponent(ensureAnonId())}&m=${portalKey}`);
  }, [gatSpendRecommendation, navigate, closeGatPanels]);

  // Atajo para dejar el WhatsApp desde el tooltip, para quien dejó pasar la
  // primera oportunidad en el cierre de L3 (ResonanceModal). El consentimiento
  // es global por anon_id, no por miniverso — cualquier miniverso_id vale.
  const handleSubmitGatWhatsapp = useCallback(async () => {
    if (gatWhatsappPhone.trim().length < 8) return;
    setGatWhatsappSubmitting(true);
    try {
      const entry = CATALOG.find((c) => c.showcase === gatSpendRecommendation?.showcaseId);
      await fetch(`${BITACORA_API_BASE}/api/bitacora/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id: ensureAnonId(),
          miniverso_id: entry?.key ?? 'oraculo',
          canal: 'whatsapp',
          phone_number: gatWhatsappPhone.trim(),
        }),
      });
      writeGlobalConsent();
      setGatWhatsappDone(true);
    } catch {
      // Silencioso, mismo criterio que usePushSubscription — no interrumpir.
    } finally {
      setGatWhatsappSubmitting(false);
    }
  }, [gatWhatsappPhone, gatSpendRecommendation]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 180) {
        setScrollTier(2);
      } else if (y > 20) {
        setScrollTier(1);
      } else {
        setScrollTier(0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerToneClass =
    scrollTier === 2
      ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/88 backdrop-blur-xl border-b border-white/15 shadow-[0_14px_36px_rgba(2,6,23,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : scrollTier === 1
        ? 'bg-gradient-to-b from-slate-900/72 to-slate-950/68 backdrop-blur-lg border-b border-white/10 shadow-[0_10px_26px_rgba(2,6,23,0.38),inset_0_1px_0_rgba(255,255,255,0.06)]'
        : 'bg-transparent';

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleClickAway = (event) => {
      if (event.target?.closest?.('[data-site-index-root]')) {
        return;
      }
      setIsMenuOpen(false);
    };
    window.addEventListener('pointerdown', handleClickAway);
    return () => window.removeEventListener('pointerdown', handleClickAway);
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpenFromToast = () => setShowLoginOverlay(true);
    window.addEventListener('open-login-modal', handleOpenFromToast);
    return () => window.removeEventListener('open-login-modal', handleOpenFromToast);
  }, []);

  const menuItems = [
    { name: 'Primera fila', href: '#hero' },
    ...(showTerceraLlamadaNav ? [{ name: 'Tercera llamada', href: '#bienvenida-creador' }] : []),
    ...(showTransmediaNav ? [{ name: 'Miniversos', href: '#transmedia' }] : []),
    ...(showPerspectivasNav ? [{ name: 'Voces en la sala', href: '#provoca' }] : []),
    ...(showAllianceNav ? [{ name: 'Alianza', href: '#apoya' }] : []),
    ...(showIntermedioNav ? [{ name: 'Intermedio', href: '#blog-contribuye' }] : []),
    ...(showCuradoriaNav ? [{ name: 'Curaduría', href: '#dialogo-critico' }] : []),
    ...(showIntermedioNav ? [{ name: 'Caída del telón', href: '#next-show' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Obra fundacional', href: '#about' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Créditos', href: '#team' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Galería fractal', href: '#instagram' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Antes de irte', href: '#conoce-sistema' }] : []),
    { name: 'Contacto', href: '#contact' },
  ];
  const mobileMenuItems = [
    { name: 'Primera fila', href: '#hero', description: '#esununiverso',
 },
    ...(showTerceraLlamadaNav
      ? [{ name: 'Tercera llamada', href: '#bienvenida-creador', description: terceraLlamadaLabel }]
      : []),
    ...(showTransmediaNav
      ? [
          {
            name: 'La obra toma forma',
            href: '#transmedia',
            description: '#narrativaexpandida',
            secondary: TRANSMEDIA_SECONDARY_ITEMS,
          },
        ]
      : []),
    ...(showPerspectivasNav ? [{ name: 'Voces en la sala', href: '#provoca', description: '#heridaemocional' }] : []),
    ...(showIntermedioNav
      ? [{ name: 'Intermedio', href: '#blog-contribuye', description: '#Lareflexion' }]
      : []),
    ...(showCuradoriaNav
      ? [
          {
            name: 'Curaduría',
            href: '#dialogo-critico',
            description: '#pensamientocritico',
            secondary: [
              { label: 'Curaduría Reflexiva', href: '#dialogo-critico?focus=curaduria' },
              { label: 'Expansiones Narrativas', href: '#dialogo-critico?focus=expansiones' },
              { label: 'Detrás de Cámaras', href: '#dialogo-critico?focus=backstage' },
              { label: 'Buscador Backstage', href: '#dialogo-critico', action: 'show-buscador' },
            ],
          },
        ]
      : []),
    ...(showIntermedioNav
      ? [{
          name: 'Caída del telón',
          href: '#next-show',
          description: '#ArchivoEscénico',
          ...(showObraDestacadaNav
            ? {
                secondary: [
                  { label: 'Obra fundacional', href: '#about' },
                  { label: 'Créditos de la función', href: '#team' },
                  { label: 'Galería fractal', href: '#instagram' },
                ],
              }
            : {}),
        }]
      : []),
    ...(showObraDestacadaNav
      ? [{ name: 'Antes de irte', href: '#conoce-sistema', description: '#Nuestromodelo' }]
      : []),
    { name: 'Contacto', href: '#contact' },
  ];

  const activeSectionHref = useActiveSectionHref(mobileMenuItems.map((item) => item.href));

  const handleNavClick = useCallback((href) => {
    setIsMenuOpen(false);
    if (typeof href !== 'string' || !href) return;
    const revealFractalGallery = () => {
      window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-fractal-gallery'));
    };
    if (href.startsWith('#') && href.includes('?')) {
      const [hashAnchor] = href.split('?');
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: href,
        },
        { replace: false }
      );
      const anchorEl = document.querySelector(hashAnchor);
      if (anchorEl) {
        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (href === '#instagram') {
      revealFractalGallery();
    }
  }, [location.pathname, location.search, navigate]);

  const handleOpenSupportHub = useCallback(() => {
    if (!user) return;
    setIsMenuOpen(false);
    closeGatPanels();
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'header-encuentros'),
    });
  }, [location, navigate, user, closeGatPanels]);

  const handleToggleIndex = useCallback(() => {
    if (shouldGateIndexUntilHeroReveal) return;
    setHasOpenedIndexOnce(true);
    setIsMenuOpen((prev) => !prev);
  }, [shouldGateIndexUntilHeroReveal]);

  const acknowledgeGatRevealPulse = useCallback((source = 'header-chip') => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(GATOKENS_REVEAL_ACK_EVENT, {
        detail: { source },
      })
    );
  }, []);

  const handleGatChipClick = useCallback(() => {
    if (!gatRevealPulse) return;
    acknowledgeGatRevealPulse('header-chip');
  }, [acknowledgeGatRevealPulse, gatRevealPulse]);

  const isGatChipPulsing = Boolean(gatRevealPulse);
  // El Header decide si existe el chip; el saldo solo define su contenido.
  // En anónimo no debe adelantarse al ritual de activación del Hero.
  const shouldShowGatChip = Boolean(showGatChip && gatBalance > 0 && !isGatLinktreeOpen);
  const gatChipPulseAnimate = prefersReducedMotion
    ? { opacity: 1, scale: 1 }
    : {
        opacity: 1,
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 0 18px rgba(34,211,238,0.14)',
          '0 0 34px rgba(251,191,36,0.44)',
          '0 0 18px rgba(34,211,238,0.14)',
        ],
      };
  const gatChipPulseTransition = prefersReducedMotion
    ? { duration: 0.2, ease: 'easeOut' }
    : { duration: 1.25, ease: 'easeInOut', repeat: Infinity };
  const gatCoinPulseAnimate = prefersReducedMotion
    ? { scale: 1 }
    : {
        scale: [1, 1.18, 1],
        filter: [
          'drop-shadow(0 0 6px rgba(251,191,36,0.28))',
          'drop-shadow(0 0 12px rgba(251,191,36,0.7))',
          'drop-shadow(0 0 6px rgba(251,191,36,0.28))',
        ],
      };

  useEffect(() => {
    if (!shouldShowGatChip && isGatInfoOpen) {
      setIsGatInfoOpen(false);
    }
  }, [isGatInfoOpen, shouldShowGatChip]);

  useEffect(() => {
    if (gatBalance <= 0 && gatRevealPulse) {
      setGatRevealPulse(null);
    }
  }, [gatBalance, gatRevealPulse]);

  // Bandeja del tooltip de GATokens: nace debajo del chip y permanece anclada
  // al header. En móvil ocupa casi todo el ancho; en desktop conserva un ancho
  // compacto alineado con el borde derecho del chip.
  const calcGatInfoPosition = useCallback(() => {
    if (!gatChipRootRef.current || typeof window === 'undefined') return;
    const rect = gatChipRootRef.current.getBoundingClientRect();
    const isMobileViewport = window.innerWidth < 640;
    const viewportGutter = isMobileViewport ? 12 : 24;
    const availableWidth = Math.max(window.innerWidth - viewportGutter * 2, 0);
    const panelW = isMobileViewport
      ? availableWidth
      : Math.min(440, availableWidth);
    const desiredRight = window.innerWidth - rect.right;
    const rightFromEdge = Math.min(
      Math.max(desiredRight, viewportGutter),
      Math.max(window.innerWidth - panelW - viewportGutter, viewportGutter)
    );

    setGatInfoPanelStyle({
      position: 'fixed',
      width: panelW,
      right: rightFromEdge,
      top: rect.bottom,
      bottom: 'auto',
      zIndex: 40,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isGatInfoOpen) return undefined;
    calcGatInfoPosition();
    window.addEventListener('resize', calcGatInfoPosition);
    document.addEventListener('scroll', calcGatInfoPosition, true);
    return () => {
      window.removeEventListener('resize', calcGatInfoPosition);
      document.removeEventListener('scroll', calcGatInfoPosition, true);
    };
  }, [isGatInfoOpen, calcGatInfoPosition]);

  // Al abrir el tooltip: ¿dónde conviene ir a gastar/seguir gastando los GAT?
  // Prioridad:
  // 1) el metadata.recommended del resonance:l3-reward más reciente (ya
  //    terminaste algo y el sistema sugiere el siguiente paso);
  // 2) si no hay L3 completado, el evento más reciente de CUALQUIER tipo que
  //    apunte a una vitrina — "sigues con crédito gastado/en curso ahí";
  // 3) si nunca hay historial, la recomendación de primera vez del Oráculo.
  useEffect(() => {
    // El HUB (isGatLinktreeOpen) puede abrir solo, sin que nadie haya tocado
    // el chip todavía — antes esto solo corría con isGatInfoOpen, así que la
    // recomendación no aparecía hasta que además se abriera el tooltip.
    if (!isGatInfoOpen && !isGatLinktreeOpen) return undefined;
    let cancelled = false;
    setIsGatSpendRecommendationLoading(true);
    (async () => {
      const { events } = await fetchTransmediaCreditEvents(20);
      if (cancelled) return;
      const completedRecommendation = findLatestRecommendedPortal(events);
      const recommendation =
        completedRecommendation ||
        findLatestSpendTarget(events) ||
        readBienvenidaRecommendedShowcase() ||
        readOraculoRecommendedShowcase();
      setGatSpendRecommendation(recommendation);
      setIsGatLoginEligible(Boolean(completedRecommendation));
      setIsGatSpendRecommendationLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isGatInfoOpen, isGatLinktreeOpen]);

  useEffect(() => {
    if (!isGatInfoOpen) return undefined;
    const onPointerDown = (event) => {
      if (
        gatChipRootRef.current && !gatChipRootRef.current.contains(event.target) &&
        gatInfoPanelRef.current && !gatInfoPanelRef.current.contains(event.target)
      ) {
        setIsGatInfoOpen(false);
      }
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') setIsGatInfoOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isGatInfoOpen]);

  // Contenido compartido por el tooltip (clic en el chip) y el HUB (se abre
  // solo para autenticados/PWA) — mismos accesos, mismo estilo, para no
  // mantener dos diseños distintos de lo mismo.
  const gatAccessGridContent = (
    <>
      <div className="mx-auto grid w-full max-w-[21rem] grid-cols-2 gap-2">
        {!user && isGatLoginEligible ? (
          <GatLinktreeTile icon={LogIn} label="Iniciar sesión" onClick={handleOpenLoginFromGatTooltip} tone="neutral" />
        ) : null}
        {gatSpendRecommendation ? (
          <GatLinktreeTile
            icon={Compass}
            label={`Explorar ${gatSpendRecommendation.title}`}
            onClick={() => {
              closeGatPanels();
              handleNavClick(`#transmedia?focus=${gatSpendRecommendation.showcaseId}&source=gat-recommendation`);
            }}
            tone="violet"
          />
        ) : null}
        <GatLinktreeTile
          icon={BookOpen}
          label="Cuaderno holográfico"
          onClick={handleOpenHolograficoFromGatTooltip}
          tone="amber"
        />
        {user ? (
          <GatLinktreeTile icon={Coffee} label="Café, charla y merch" onClick={handleOpenSupportHub} tone="amber" />
        ) : null}
        {user ? (
          <GatLinktreeTile
            icon={UserCircle2}
            label={greetingLabel}
            statusDotClass={statusDotClass}
            onClick={() => setIsLinktreeSessionExpanded((prev) => !prev)}
            tone="cyan"
            indicator="dot"
          />
        ) : null}
        {!gatWhatsappDone ? (
          <GatLinktreeTile
            icon={MessageCircle}
            label="Avísame por WhatsApp"
            onClick={() => setShowGatWhatsappInput((prev) => !prev)}
            tone="green"
          />
        ) : null}
        {isSubscriber ? (
          <GatLinktreeTile icon={DoorOpen} label="Ir al Backstage" onClick={handleOpenBackstage} tone="violet" />
        ) : null}
      </div>

      {isLinktreeSessionExpanded && user ? (
        <div className="mx-auto mt-3 w-full max-w-[21rem] rounded-xl border border-white/10 bg-black/25 p-3 text-center text-slate-100">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
          <p className="mt-1 break-all text-xs text-slate-200/90">{user?.email || 'correo no disponible'}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}

      {showGatWhatsappInput && !gatWhatsappDone ? (
        <div className="mx-auto mt-3 w-full max-w-[21rem] space-y-1.5 rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-center text-[0.7rem] text-slate-400">¿A qué número te avisamos?</p>
          <div className="flex gap-1.5">
            <input
              type="tel"
              value={gatWhatsappPhone}
              onChange={(e) => setGatWhatsappPhone(e.target.value)}
              placeholder="+52 55 0000 0000"
              disabled={gatWhatsappSubmitting}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={handleSubmitGatWhatsapp}
              disabled={gatWhatsappSubmitting || gatWhatsappPhone.trim().length < 8}
              className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {gatWhatsappSubmitting ? '…' : 'Enviar'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerToneClass}`}
      >
        <nav className="container mx-auto px-6 py-3 max-[375px]:px-4" data-site-index-root>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              {!isGatLinktreeOpen ? (
              <motion.button
                id="header-index-hashtag"
                type="button"
                whileHover={{ scale: 1.05, textShadow: '0 0 8px rgba(233, 213, 255, 0.5)' }}
                className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-full transition ${
                  isMenuOpen ? 'drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]' : ''
                } ${showIndexGuidePulse ? 'header-index-cue-pulse' : ''}`}
                animate={{ opacity: shouldGateIndexUntilHeroReveal ? 0 : 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                style={{
                  pointerEvents: shouldGateIndexUntilHeroReveal ? 'none' : 'auto',
                  visibility: shouldGateIndexUntilHeroReveal ? 'hidden' : 'visible',
                }}
                onClick={handleToggleIndex}
                aria-controls="site-index-menu"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Cerrar índice de navegación' : 'Abrir índice de navegación'}
                tabIndex={shouldGateIndexUntilHeroReveal ? -1 : 0}
              >
                <span
                  className="header-hashtag-mark h-10 w-10 text-3xl sm:h-11 sm:w-11 sm:text-4xl"
                  aria-hidden="true"
                >
                  #
                </span>
              </motion.button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {shouldShowGatChip ? (
                <motion.div
                  ref={gatChipRootRef}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border pl-2.5 pr-1 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm transition-colors sm:gap-1.5 sm:pl-3 sm:pr-1.5 sm:text-[0.68rem] sm:tracking-[0.24em] ${
                    isGatChipPulsing
                      ? 'border-amber-300/45 bg-amber-500/15 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.28)]'
                      : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                  }`}
                  animate={isGatChipPulsing ? gatChipPulseAnimate : { opacity: 1, scale: 1 }}
                  transition={
                    isGatChipPulsing
                      ? gatChipPulseTransition
                      : { duration: 0.5, ease: 'easeOut' }
                  }
                >
                  <button
                    type="button"
                    onClick={handleGatChipClick}
                    disabled={!isGatChipPulsing}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 ${isGatChipPulsing ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-label={
                      isGatChipPulsing
                        ? 'Confirmar GATokens recibidos'
                        : `${gatBalance.toLocaleString('es-MX')} GAT disponibles`
                    }
                    title={isGatChipPulsing ? 'Confirmar GATokens recibidos' : 'GATokens disponibles'}
                  >
                    {isGatChipPulsing ? (
                      <motion.img
                        src={GATOKEN_COIN_SRC}
                        alt=""
                        className="h-3.5 w-3.5"
                        animate={gatCoinPulseAnimate}
                        transition={gatChipPulseTransition}
                      />
                    ) : (
                      <Sparkles size={12} className="text-cyan-200" />
                    )}
                    <span>Energía</span>
                    <span className="tabular-nums text-white">{gatBalance.toLocaleString('es-MX')} GAT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGatInfoOpen((prev) => !prev)}
                    aria-label="¿Qué son los GATokens?"
                    aria-expanded={isGatInfoOpen}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-current/60 normal-case transition hover:text-white"
                  >
                    <Info size={11} />
                  </button>
                </motion.div>
              ) : null}
              {shouldShowGatChip && isGatInfoOpen && typeof document !== 'undefined' && createPortal(
                <>
                  <button
                    type="button"
                    aria-label="Cerrar información de GATokens"
                    onClick={() => setIsGatInfoOpen(false)}
                    className="hero-scene-glass-overlay fixed inset-0 z-30 cursor-default"
                  />
                  <motion.div
                    ref={gatInfoPanelRef}
                    style={gatInfoPanelStyle}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.12 : 0.24, ease: 'easeOut' }}
                    role="dialog"
                    aria-modal="false"
                    aria-label="Tu energía GAT"
                    className="hero-scene-glass-panel relative flex max-h-[60dvh] flex-col overflow-hidden rounded-b-[1.4rem] border-x border-b border-white/10"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-7 top-0 z-20 h-px w-20 bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent"
                    />
                    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <div className="border-b border-white/[0.075] px-5 pb-4 pt-5 text-center sm:px-6">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-amber-300/90">
                          Tu energía
                        </p>
                        <p className="mx-auto mt-2 max-w-[18rem] text-[0.7rem] leading-relaxed text-slate-400">
                          Los GATokens son el valor que le ponemos a tu atención en #GatoEncerrado
                        </p>

                        {isGatSpendRecommendationLoading ? (
                          <p className="mt-2 text-[0.68rem] text-slate-500">Buscando dónde conviene gastarlos…</p>
                        ) : !gatSpendRecommendation ? (
                          <p className="mx-auto mt-2 max-w-[18rem] text-center text-[0.66rem] text-slate-500">
                            Representan la energía simbólica que este universo necesita para activar experiencias dentro de los miniversos.
                          </p>
                        ) : null}
                      </div>
                      <div className="w-full px-3 py-3 sm:px-4">{gatAccessGridContent}</div>
                    </div>
                    <div className="relative z-10 shrink-0 border-t border-white/[0.085] bg-white/[0.025] px-4 py-2.5">
                      <p className="text-center text-[0.66rem] uppercase tracking-[0.12em] text-slate-500">
                        Energía disponible:{' '}
                        <span className="font-semibold tracking-normal text-amber-300">
                          {gatBalance.toLocaleString('es-MX')} GAT
                        </span>
                      </p>
                    </div>
                  </motion.div>
                </>,
                document.body
              )}
            </div>
          </div>

          {isGatLinktreeOpen && isGatLinktreeAudience && typeof document !== 'undefined' && createPortal(
            <motion.aside
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: 'easeOut' }}
              className="fixed inset-0 z-[90] overflow-y-auto bg-transparent px-3 py-[calc(env(safe-area-inset-top)+12px)] sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-8"
              role="dialog"
              aria-modal="true"
              aria-label="Hub personal de GATokens"
            >
              <div
                className="relative mx-auto flex w-full max-w-[28rem] flex-col"
                style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 24px)' }}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
                  <div>
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-amber-300/90">
                      Hub personal
                    </p>
                    <h2 className="font-display mt-2 text-xl text-slate-100">Tu energía</h2>
                    <p className="mt-1 max-w-[17rem] text-xs leading-relaxed text-slate-400">
                      Cuenta, recursos y accesos personales de #GatoEncerrado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeGatPanels}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.075] hover:text-white"
                    aria-label="Cerrar hub personal"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-1 sm:px-4">
                  {gatAccessGridContent}
                </div>
              </div>
            </motion.aside>,
            document.body
          )}

          {isMenuOpen && !MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden mt-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-slate-100/10"
            >
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-left py-3 text-slate-200 hover:text-white transition-colors"
                >
                  {item.name}
                </button>
              ))}
              {user ? (
                <div className="mt-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={handleAuthActionFromMenu}
                    className="block w-full text-left py-2 text-slate-200 hover:text-white transition-colors"
                  >
                    {authActionLabel}
                  </button>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </nav>
      </motion.header>

      {isMenuOpen && MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED ? (
        <MobileMenuOverlay
          isOpen={isMenuOpen}
          menuItems={mobileMenuItems}
          activeSectionHref={activeSectionHref}
          authActionLabel={authActionLabel}
          showAuthSection={Boolean(user)}
          onNavigate={handleNavClick}
          onClose={() => setIsMenuOpen(false)}
          onAuthAction={handleAuthActionFromMenu}
        />
      ) : null}

      {showLoginOverlay ? <LoginOverlay onClose={handleCloseOverlay} /> : null}
    </>
  );
};

export default Header;
