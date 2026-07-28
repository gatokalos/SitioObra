import React, { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Info, Sparkles, LogIn, Compass, BookOpen, MessageCircle, UserCircle2, DoorOpen, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { INITIAL_GAT_BALANCE, readStoredInt } from '@/components/transmedia/transmediaConstants';
import { readIndexCueUsedFromSession } from '@/lib/heroActivation';
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

// Misma técnica visual que PWAInstructionsOverlay: sin tarjeta de fondo (el
// starfield del Hero se ve directo detrás), ícono dentro de un cuadrado con
// esquinas redondeadas, etiqueta debajo. A diferencia de esas instrucciones,
// aquí los accesos son independientes entre sí (no un proceso paso a paso),
// por eso van en grid de 2 columnas sin flechas conectoras.
const GatLinktreeTile = ({ icon: TileIcon, label, onClick, statusDotClass: dotClass }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col items-center gap-[clamp(5px,0.85vh,8px)] text-center"
  >
    {/* bg-black/40 (no solo el borde transparente de antes): sin esto, el
        cuadrado del ícono deja ver lo que sea que haya detrás en el Hero
        (p. ej. el wordmark GATOENCERRADO), y con 5-6 accesos el grid crece
        lo suficiente para toparse con él. */}
    <span className="relative flex h-[clamp(34px,5.4vh,52px)] w-[clamp(34px,5.4vh,52px)] shrink-0 items-center justify-center rounded-[clamp(10px,1.1vh,15px)] border-[1.25px] border-white/65 bg-black/40 text-slate-100 backdrop-blur-[2px] transition group-hover:border-white group-hover:bg-white/10">
      <TileIcon strokeWidth={1.5} className="h-[clamp(17px,2.7vh,26px)] w-[clamp(17px,2.7vh,26px)]" />
      {dotClass ? (
        <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-black/40 ${dotClass}`} />
      ) : null}
    </span>
    <p
      className="max-w-[7.5rem] text-[clamp(0.7rem,1.7vh,0.85rem)] leading-tight text-slate-100"
      style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}
    >
      {label}
    </p>
  </button>
);

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
  // Mismo efecto de estrellas titilantes que PWAInstructionsOverlay — el
  // tooltip (a diferencia del HUB) es una tarjeta sólida sin el starfield
  // real del Hero detrás, así que le hace falta su propia textura.
  const gatTooltipStars = useMemo(
    () => Array.from({ length: 14 }).map((_, index) => ({
      id: index,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 4.5,
    })),
    []
  );
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
  const [isLinktreeSessionExpanded, setIsLinktreeSessionExpanded] = useState(false);
  const [isLinktreeBackstageHelpExpanded, setIsLinktreeBackstageHelpExpanded] = useState(false);
  // Cerrar cualquiera de los dos paneles del sistema de GAT (el HUB que abre
  // solo, o el tooltip que abre el chip) — usado por cualquier acceso del
  // grid que navegue a otro lado, para que no se quede flotando encima.
  const closeGatPanels = useCallback(() => {
    setIsGatInfoOpen(false);
    setIsGatLinktreeOpen(false);
    // Sin esto, el efecto de auto-apertura de abajo ve isGatLinktreeOpen en
    // false (sin bandera de "ya lo cerraste") y lo vuelve a abrir de
    // inmediato — por eso el HUB "no cerraba" al navegar desde un tile.
    try {
      window.sessionStorage.setItem(GAT_LINKTREE_DISMISSED_SESSION_KEY, '1');
    } catch {
      // Silencioso
    }
  }, []);
  const handleDismissGatLinktree = useCallback(() => {
    setIsGatLinktreeOpen(false);
    try {
      window.sessionStorage.setItem(GAT_LINKTREE_DISMISSED_SESSION_KEY, '1');
    } catch {
      // Silencioso
    }
    // Mismo gesto que cerrar PWAInstructionsOverlay: cerrar el HUB activa la
    // escena (audio + índice revelado). Header y Hero son hermanos, no
    // padre-hijo, así que se coordina por evento global en vez de prop drilling.
    window.dispatchEvent(new CustomEvent('gatoencerrado:activate-scene-request'));
  }, []);
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
    if (!isProfileMenuOpen) return undefined;
    const handleClickAway = (event) => {
      if (!event.target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickAway);
    return () => window.removeEventListener('click', handleClickAway);
  }, [isProfileMenuOpen]);

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

  // Panel del tooltip de GATokens — mismo cálculo de posición que GATChip.jsx
  // (portal/GATChip.jsx): fixed, alineado al borde derecho del chip, clamp al
  // viewport, arriba o abajo según el espacio disponible.
  const calcGatInfoPosition = useCallback(() => {
    if (!gatChipRootRef.current || typeof window === 'undefined') return;
    const rect = gatChipRootRef.current.getBoundingClientRect();
    const panelW = Math.min(window.innerWidth * 0.88, 272);
    const panelH = gatInfoPanelRef.current
      ? Math.max(gatInfoPanelRef.current.scrollHeight, 120)
      : 160;
    const gap = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const below = spaceBelow >= panelH + gap || spaceBelow >= rect.top;
    const rightFromEdge = Math.max(window.innerWidth - rect.right, 8);

    setGatInfoPanelStyle({
      position: 'fixed',
      width: panelW,
      right: rightFromEdge,
      ...(below
        ? { top: rect.bottom + gap, bottom: 'auto' }
        : { bottom: window.innerHeight - rect.top + gap, top: 'auto' }),
      zIndex: 9999,
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
      <div className="mx-auto grid w-full max-w-[19rem] grid-cols-2 gap-x-6 gap-y-5">
        {!user && isGatLoginEligible ? (
          <GatLinktreeTile icon={LogIn} label="Iniciar sesión" onClick={handleOpenLoginFromGatTooltip} />
        ) : null}
        {gatSpendRecommendation ? (
          <GatLinktreeTile
            icon={Compass}
            label={`Explorar ${gatSpendRecommendation.title}`}
            onClick={() => {
              closeGatPanels();
              handleNavClick(`#transmedia?focus=${gatSpendRecommendation.showcaseId}&source=gat-recommendation`);
            }}
          />
        ) : null}
        <GatLinktreeTile icon={BookOpen} label="Cuaderno holográfico" onClick={handleOpenHolograficoFromGatTooltip} />
        {user ? (
          <GatLinktreeTile icon={Coffee} label="Café, charla y merch" onClick={handleOpenSupportHub} />
        ) : null}
        {user ? (
          <GatLinktreeTile
            icon={UserCircle2}
            label={greetingLabel}
            statusDotClass={statusDotClass}
            onClick={() => setIsLinktreeSessionExpanded((prev) => !prev)}
          />
        ) : null}
        {!gatWhatsappDone ? (
          <GatLinktreeTile
            icon={MessageCircle}
            label="Avísame por WhatsApp"
            onClick={() => setShowGatWhatsappInput((prev) => !prev)}
          />
        ) : null}
        {user ? (
          <GatLinktreeTile
            icon={DoorOpen}
            label="Ir al Backstage"
            onClick={() => {
              if (isSubscriber) {
                handleOpenBackstage();
              } else {
                setIsLinktreeBackstageHelpExpanded((prev) => !prev);
              }
            }}
          />
        ) : null}
      </div>

      {isLinktreeSessionExpanded && user ? (
        <div className="mx-auto mt-5 w-full max-w-[19rem] rounded-xl border border-white/10 bg-black/40 p-3 text-center text-slate-100">
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

      {isLinktreeBackstageHelpExpanded && user && !isSubscriber ? (
        <div className="mx-auto mt-5 w-full max-w-[19rem] rounded-xl border border-white/10 bg-black/40 p-3 text-center text-slate-100">
          <p className="text-xs leading-relaxed text-slate-300">
            El Backstage se abre cuando activas tu huella. Esta cuenta todavía no tiene una.
          </p>
          <button
            type="button"
            onClick={() => {
              closeGatPanels();
              handleNavClick('#apoya');
            }}
            className="mt-2 w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/5"
          >
            Cómo activarla
          </button>
        </div>
      ) : null}

      {showGatWhatsappInput && !gatWhatsappDone ? (
        <div className="mx-auto mt-5 w-full max-w-[19rem] space-y-1.5">
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
                {user ? <span className={`block h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass}`} /> : null}
              </motion.button>
              ) : null}
              {user && !isGatLinktreeOpen ? (
                <div className="relative" data-profile-menu>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="inline-flex items-center whitespace-nowrap text-xs font-semibold text-slate-100 transition sm:text-sm underline underline-offset-4 decoration-slate-400/40 hover:text-white hover:decoration-emerald-300/60"
                  >
                    {greetingLabel}
                  </button>
                  {isProfileMenuOpen ? (
                    <div className="absolute left-0 mt-2 w-64 rounded-xl border border-white/10 bg-black/90 py-2 text-sm text-slate-100 shadow-xl">
                      <div className="px-4 pb-2 pt-1">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
                        <p className="mt-1 break-all text-xs text-slate-200/90">
                          {user?.email || 'correo no disponible'}
                        </p>
                      </div>
                      <div className="mx-3 mb-1 h-px bg-white/10" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left hover:bg-white/5"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  ) : null}
                </div>
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
                <div
                  ref={gatInfoPanelRef}
                  style={gatInfoPanelStyle}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {gatTooltipStars.map((star) => (
                      <span
                        key={star.id}
                        className="pwa-instructions-star"
                        style={{
                          top: `${star.top}%`,
                          left: `${star.left}%`,
                          animationDelay: `${star.delay}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2 px-4 py-4">
                    <p className="text-center text-[0.62rem] font-semibold uppercase tracking-[0.35em] text-amber-400">
                      · Tu energía ·
                    </p>
                    <p className="max-w-[13rem] text-center text-[0.68rem] leading-relaxed text-slate-400">
                      Los GATokens son el valor que le ponemos a tu atención en #GatoEncerrado
                    </p>

                    {isGatSpendRecommendationLoading ? (
                      <p className="py-1 text-[0.68rem] text-slate-500">Buscando dónde conviene gastarlos…</p>
                    ) : !gatSpendRecommendation ? (
                      <p className="max-w-[13rem] py-1 text-center text-[0.66rem] text-slate-500">
                        Representan la energía simbólica que este universo necesita para activar experiencias dentro de los miniversos.
                      </p>
                    ) : null}

                    <div className="mt-1 w-full">{gatAccessGridContent}</div>
                  </div>
                  <div className="relative z-10 border-t border-white/10 bg-white/5 px-4 py-2">
                    <p className="text-center text-[0.68rem] text-slate-400">
                      Energía disponible:{' '}
                      <span className="font-semibold text-amber-400">
                        {gatBalance.toLocaleString('es-MX')} GAT
                      </span>
                    </p>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>

          {isGatLinktreeOpen && isGatLinktreeAudience && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed inset-x-0 top-20 z-[9000] mx-auto flex max-h-[60vh] w-full max-w-md flex-col overflow-hidden lg:top-24"
              role="dialog"
              aria-modal="false"
              aria-label="Accesos rápidos de #GatoEncerrado"
            >
              <div className="flex items-center justify-end px-4 pt-2">
                <button
                  type="button"
                  onClick={handleDismissGatLinktree}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar accesos rápidos"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-1">
                {gatAccessGridContent}
              </div>
            </div>,
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
