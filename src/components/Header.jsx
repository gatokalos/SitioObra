import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Info, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { INITIAL_GAT_BALANCE, readStoredInt } from '@/components/transmedia/transmediaConstants';
import { readIndexCueUsedFromSession } from '@/lib/heroActivation';
import useActiveSectionHref from '@/hooks/useActiveSectionHref';
import { fetchTransmediaCreditEvents } from '@/services/transmediaCreditsService';
import {
  findLatestRecommendedPortal,
  findLatestSpendTarget,
  readOraculoRecommendedShowcase,
} from '@/lib/transmediaCreditEventLabels';

const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const GATOKENS_REVEAL_PULSE_EVENT = 'gatoencerrado:gatokens-reveal-pulse';
const GATOKENS_REVEAL_ACK_EVENT = 'gatoencerrado:gatokens-reveal-ack';
const GATOKEN_COIN_SRC =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png';
const readGatBalance = () => {
  const v = readStoredInt(GAT_BALANCE_STORAGE_KEY, INITIAL_GAT_BALANCE);
  return Number.isFinite(v) ? Math.max(Math.trunc(v), 0) : INITIAL_GAT_BALANCE;
};

// El navegador ya lo abrió como app instalada (standalone) — iOS Safari usa su
// propia bandera (navigator.standalone) en vez del media query estándar.
const readIsRunningAsInstalledPwa = () => {
  if (typeof window === 'undefined') return false;
  const isStandaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches;
  const isIosStandalone = window.navigator?.standalone === true;
  return Boolean(isStandaloneDisplay || isIosStandalone);
};

const MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED = true;
const TRANSMEDIA_SECONDARY_ITEMS = [
  { label: 'Teatro', href: '#transmedia?focus=miniversos' },
  { label: 'Artesanías', href: '#transmedia?focus=lataza' },
  { label: 'Literatura', href: '#transmedia?focus=miniversoNovela' },
  { label: 'Gráficos', href: '#transmedia?focus=miniversoGrafico' },
  { label: 'Cine', href: '#transmedia?focus=copycats' },
  { label: 'Sonoridades', href: '#transmedia?focus=miniversoSonoro' },
  { label: 'Movimiento', href: '#transmedia?focus=miniversoMovimiento' },
  { label: 'Juegos', href: '#transmedia?focus=apps' },
  { label: 'Oráculo', href: '#transmedia?focus=oraculo' },
];

const Header = ({
  showAllianceNav = true,
  showCuradoriaNav = true,
  showIntermedioNav = false,
  showTransmediaNav = true,
  showPerspectivasNav = false,
  showObraDestacadaNav = false,
  showTerceraLlamadaNav = false,
  terceraLlamadaLabel = 'Comenzamos',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollTier, setScrollTier] = useState(0);
  const [hasUsedHeroIndexCue, setHasUsedHeroIndexCue] = useState(readIndexCueUsedFromSession);
  const [isInstalledPwa, setIsInstalledPwa] = useState(readIsRunningAsInstalledPwa);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGatInfoOpen, setIsGatInfoOpen] = useState(false);
  const [gatInfoPanelStyle, setGatInfoPanelStyle] = useState({});
  const [gatSpendRecommendation, setGatSpendRecommendation] = useState(null);
  const [isGatSpendRecommendationLoading, setIsGatSpendRecommendationLoading] = useState(false);
  const gatChipRootRef = useRef(null);
  const gatInfoPanelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast: showToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalledPwa(readIsRunningAsInstalledPwa());
    standaloneQuery.addEventListener('change', handleDisplayModeChange);
    return () => standaloneQuery.removeEventListener('change', handleDisplayModeChange);
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

      if (Number.isFinite(nextBalance)) {
        setGatBalance(Math.max(Math.trunc(nextBalance), 0));
      }
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
  }, []);

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
    ...(showPerspectivasNav ? [{ name: 'Perspectivas', href: '#provoca' }] : []),
    ...(showAllianceNav ? [{ name: 'Alianza', href: '#apoya' }] : []),
    ...(showIntermedioNav ? [{ name: 'Intermedio', href: '#blog-contribuye' }] : []),
    ...(showCuradoriaNav ? [{ name: 'Curaduría', href: '#dialogo-critico' }] : []),
    ...(showIntermedioNav ? [{ name: 'Caída del telón', href: '#next-show' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Obra destacada', href: '#about' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Galería fractal', href: '#instagram' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Créditos', href: '#team' }] : []),
    { name: 'Contacto', href: '#contact' },
  ];
  const mobileMenuItems = [
    { name: 'Primera fila', href: '#hero' },
    ...(showTerceraLlamadaNav
      ? [{ name: 'Tercera llamada', href: '#bienvenida-creador', description: terceraLlamadaLabel }]
      : []),
    ...(showTransmediaNav
      ? [
          {
            name: 'Miniversos',
            href: '#transmedia',
            description: 'Las formas de la obra',
            secondary: TRANSMEDIA_SECONDARY_ITEMS,
          },
        ]
      : []),
    ...(showPerspectivasNav ? [{ name: 'Perspectivas', href: '#provoca' }] : []),
    ...(showAllianceNav
      ? [
          {
            name: 'Alianza',
            href: '#apoya',
            description: 'Causa social',
            secondary: [
              { label: 'Ver modelo de impacto', href: '#apoya' },
              { label: 'Dejar una huella', href: '#cta' },
            ],
          },
        ]
      : []),
    ...(showIntermedioNav
      ? [{ name: 'Intermedio', href: '#blog-contribuye', description: 'La Reflexión' }]
      : []),
    ...(showCuradoriaNav
      ? [
          {
            name: 'Curaduría',
            href: '#dialogo-critico',
            description: 'Diálogo crítico y educativo',
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
      ? [{ name: 'Caída del telón', href: '#next-show', description: 'Obra fundacional' }]
      : []),
    ...(showObraDestacadaNav
      ? [{ name: 'Obra destacada', href: '#about', description: 'Teatro · Es un gato encerrado' }]
      : []),
    ...(showObraDestacadaNav ? [{ name: 'Galería fractal', href: '#instagram' }] : []),
    ...(showObraDestacadaNav ? [{ name: 'Créditos de la obra', href: '#team' }] : []),
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
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'header-encuentros'),
    });
  }, [location, navigate, user]);

  const handleToggleIndex = useCallback(() => {
    if (shouldGateIndexUntilHeroReveal) return;
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
  // Contrato: el chip vive en el Header siempre que haya saldo — ya no depende
  // de scroll (isTransmediaVisible) ni de haberlo "fijado" antes al recibir un
  // pulso (isGatChipPinned). Confirmado 2026-07-14.
  const shouldShowGatChip = gatBalance > 0 || isGatChipPulsing;
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
    if (!isGatInfoOpen) return undefined;
    let cancelled = false;
    setIsGatSpendRecommendationLoading(true);
    (async () => {
      const { events } = await fetchTransmediaCreditEvents(20);
      if (cancelled) return;
      const recommendation =
        findLatestRecommendedPortal(events) || findLatestSpendTarget(events) || readOraculoRecommendedShowcase();
      setGatSpendRecommendation(recommendation);
      setIsGatSpendRecommendationLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isGatInfoOpen]);

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
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, textShadow: '0 0 8px rgba(233, 213, 255, 0.5)' }}
                className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-full transition ${
                  isMenuOpen ? 'drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]' : ''
                }`}
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
              {user ? (
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
              {!isInstalledPwa && (
                <a
                  href="/pwa-instructions.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white"
                  aria-label="¡Instala #GatoEncerrado como app!"
                  title="Instalar como app"
                >
                  <Smartphone size={18} />
                </a>
              )}
              <motion.div
                ref={gatChipRootRef}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border pl-2.5 pr-1 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm transition-colors sm:gap-1.5 sm:pl-3 sm:pr-1.5 sm:text-[0.68rem] sm:tracking-[0.24em] ${
                  isGatChipPulsing
                    ? 'border-amber-300/45 bg-amber-500/15 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.28)]'
                    : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                }`}
                animate={
                  isGatChipPulsing
                    ? gatChipPulseAnimate
                    : { opacity: shouldShowGatChip ? 1 : 0, scale: 1 }
                }
                transition={
                  isGatChipPulsing
                    ? gatChipPulseTransition
                    : { duration: 0.5, ease: 'easeOut' }
                }
                style={{
                  pointerEvents: shouldShowGatChip ? 'auto' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={handleGatChipClick}
                  disabled={!isGatChipPulsing}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 ${isGatChipPulsing ? 'cursor-pointer' : 'cursor-default'}`}
                  tabIndex={shouldShowGatChip ? 0 : -1}
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
                  tabIndex={shouldShowGatChip ? 0 : -1}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-current/60 normal-case transition hover:text-white"
                >
                  <Info size={11} />
                </button>
              </motion.div>
              {isGatInfoOpen && typeof document !== 'undefined' && createPortal(
                <div
                  ref={gatInfoPanelRef}
                  style={gatInfoPanelStyle}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
                >
                  <div className="space-y-2 px-4 py-3.5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-amber-600">
                      GATokens · tu energía
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700">
                      Los GATokens son la moneda simbólica de #GatoEncerrado: se ganan explorando el universo y se
                      usan para activar experiencias dentro de los miniversos.
                    </p>
                    {isGatSpendRecommendationLoading ? (
                      <p className="text-[0.68rem] text-slate-400">Buscando dónde conviene gastarlos…</p>
                    ) : gatSpendRecommendation ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGatInfoOpen(false);
                          handleNavClick(`#transmedia?focus=${gatSpendRecommendation.showcaseId}`);
                        }}
                        className="group flex w-full items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-left text-xs leading-relaxed text-violet-800 transition hover:border-violet-300 hover:bg-violet-100"
                      >
                        <span>
                          Te recomendamos gastarlos en{' '}
                          <span className="font-semibold">{gatSpendRecommendation.title}</span>.
                        </span>
                        <span className="shrink-0 text-violet-500 transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </button>
                    ) : (
                      <p className="text-[0.68rem] text-slate-500">
                        Explora un miniverso para descubrir dónde conviene gastarlos primero.
                      </p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 bg-amber-50 px-4 py-2">
                    <p className="text-[0.68rem] text-slate-500">
                      Saldo actual:{' '}
                      <span className="font-semibold text-amber-600">
                        {gatBalance.toLocaleString('es-MX')} GAT
                      </span>
                    </p>
                  </div>
                </div>,
                document.body
              )}
              {user ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="xl:hidden h-auto w-auto rounded-none p-0 text-amber-100 hover:bg-transparent hover:text-amber-50"
                  onClick={handleOpenSupportHub}
                  aria-label="Abrir café, charla y merch"
                  title="Café, charla y merch"
                >
                  <Coffee size={20} />
                </Button>
              ) : null}
            </div>
          </div>

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
