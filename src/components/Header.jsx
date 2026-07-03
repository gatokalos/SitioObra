import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import isotipoGatoWebp from '@/assets/isotipo-gato.webp';
import { INITIAL_GAT_BALANCE, readStoredInt } from '@/components/transmedia/transmediaConstants';

const GAT_BALANCE_STORAGE_KEY = 'gatoencerrado:gatokens-available';
const GATOKENS_REVEAL_PULSE_EVENT = 'gatoencerrado:gatokens-reveal-pulse';
const GATOKENS_REVEAL_PULSE_DURATION_MS = 3200;
const GATOKEN_COIN_SRC =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png';
const readGatBalance = () => {
  const v = readStoredInt(GAT_BALANCE_STORAGE_KEY, INITIAL_GAT_BALANCE);
  return Number.isFinite(v) ? Math.max(Math.trunc(v), 0) : INITIAL_GAT_BALANCE;
};

const MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED = true;
const PUBLIC_HEADER_LOGO_SRC = '/assets/header-logo.png';
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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollTier, setScrollTier] = useState(0);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast: showToast } = useToast();

  const profileName =
    user?.user_metadata?.alias ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : '');
  const simplifiedName = profileName ? profileName.trim().split(/\s+/)[0] : '';
  const greetingLabel = user ? `Hola ${simplifiedName || 'gato'}` : '';
  const authActionLabel = user ? 'Cerrar sesión' : 'Iniciar sesión';
  const statusDotClass = user ? 'bg-emerald-400' : 'bg-slate-600';
  const headerLogoSrc = user ? isotipoGatoWebp : PUBLIC_HEADER_LOGO_SRC;
  const headerLogoAlt = user ? 'Logo Gato Encerrado' : 'Isotipo Gato Encerrado';
  const headerLogoClassName = user
    ? 'h-9 w-9 rounded-full object-contain'
    : 'h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.08)] sm:h-11 sm:w-11';


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
    let timeoutId = null;

    const handleRevealPulse = (event) => {
      const nextBalance = Number(event?.detail?.balance);
      const duration = Number(event?.detail?.durationMs);
      const safeDuration = Number.isFinite(duration) && duration > 0
        ? duration
        : GATOKENS_REVEAL_PULSE_DURATION_MS;

      if (Number.isFinite(nextBalance)) {
        setGatBalance(Math.max(Math.trunc(nextBalance), 0));
      }
      setGatRevealPulse({ id: Date.now(), durationMs: safeDuration });
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setGatRevealPulse(null), safeDuration);
    };

    window.addEventListener(GATOKENS_REVEAL_PULSE_EVENT, handleRevealPulse);
    return () => {
      window.removeEventListener(GATOKENS_REVEAL_PULSE_EVENT, handleRevealPulse);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const [isTransmediaVisible, setIsTransmediaVisible] = useState(false);
  useEffect(() => {
    setIsTransmediaVisible(false);
    if (!showTransmediaNav) return undefined;
    const el = document.getElementById('transmedia');
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsTransmediaVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showTransmediaNav]);

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
    { name: 'Inicio', href: '#hero' },
    { name: 'Sobre la obra', href: '#about' },
    { name: 'Perspectivas', href: '#provoca' },
    { name: 'Tras bambalinas', href: '#team' },
    { name: 'Galería fractal', href: '#instagram' },
    ...(showIntermedioNav ? [{ name: 'Intermedio', href: '#blog-contribuye' }] : []),
    ...(showCuradoriaNav ? [{ name: 'Curaduría', href: '#dialogo-critico' }] : []),
    ...(showTransmediaNav ? [{ name: 'Transmedia', href: '#transmedia' }] : []),
    ...(showAllianceNav ? [{ name: 'Alianza', href: '#apoya' }] : []),
    { name: 'Funciones', href: '#next-show' },
    { name: 'Contacto', href: '#contact' },
  ];
  const mobileMenuItems = [
    { name: 'Inicio', href: '#hero', description: 'Bienvenida' },
    { name: 'Sobre la obra', href: '#about' },
    { name: 'Perspectivas', href: '#provoca' },
    { name: 'Tras bambalinas', href: '#team' },
    { name: 'Galería fractal', href: '#instagram' },
    ...(showIntermedioNav
      ? [{ name: 'Intermedio', href: '#blog-contribuye', description: 'Punto de no retorno' }]
      : []),
    ...(showCuradoriaNav
      ? [
          {
            name: 'Curaduría',
            href: '#dialogo-critico',
            description: 'Diálogo crítico y educativo',
            secondary: [
              { label: 'Curaduría Reflexiva', href: '#dialogo-critico' },
              { label: 'Expansiones Narrativas', href: '#dialogo-critico' },
              { label: 'Detrás de Cámaras', href: '#dialogo-critico' },
              { label: 'Buscador Backstage', href: '#dialogo-critico', action: 'show-buscador' },
            ],
          },
        ]
      : []),
    ...(showTransmediaNav
      ? [
          {
            name: 'Transmedia',
            href: '#transmedia',
            description: 'Narrativa Expandida',
            secondary: TRANSMEDIA_SECONDARY_ITEMS,
          },
        ]
      : []),
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
    { name: 'Funciones', href: '#next-show' },
    { name: 'Contacto', href: '#contact' },
  ];

  const handleNavClick = useCallback((href) => {
    setIsMenuOpen(false);
    if (typeof href !== 'string' || !href) return;
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
    setIsMenuOpen((prev) => !prev);
  }, []);

  const shouldShowGatChip = isTransmediaVisible || Boolean(gatRevealPulse);
  const gatPulseDurationSeconds = (gatRevealPulse?.durationMs ?? GATOKENS_REVEAL_PULSE_DURATION_MS) / 1000;

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
                onClick={handleToggleIndex}
                aria-controls="site-index-menu"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Cerrar índice de navegación' : 'Abrir índice de navegación'}
              >
                <img
                  src={headerLogoSrc}
                  alt={headerLogoAlt}
                  className={headerLogoClassName}
                  loading="eager"
                  decoding="async"
                />
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
              <motion.div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] backdrop-blur-sm ${
                  gatRevealPulse
                    ? 'border-amber-300/45 bg-amber-500/15 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.28)]'
                    : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.14)]'
                }`}
                animate={
                  gatRevealPulse
                    ? {
                        opacity: 1,
                        scale: [1, 1.08, 1, 1.05, 1],
                        boxShadow: [
                          '0 0 18px rgba(34,211,238,0.14)',
                          '0 0 34px rgba(251,191,36,0.44)',
                          '0 0 18px rgba(34,211,238,0.14)',
                          '0 0 28px rgba(251,191,36,0.34)',
                          '0 0 18px rgba(34,211,238,0.14)',
                        ],
                      }
                    : { opacity: shouldShowGatChip ? 1 : 0, scale: 1 }
                }
                transition={
                  gatRevealPulse
                    ? { duration: gatPulseDurationSeconds, ease: 'easeInOut' }
                    : { duration: 0.5, ease: 'easeOut' }
                }
                style={{
                  pointerEvents: shouldShowGatChip ? 'auto' : 'none',
                }}
              >
                {gatRevealPulse ? (
                  <motion.img
                    src={GATOKEN_COIN_SRC}
                    alt=""
                    className="h-3.5 w-3.5 animate-[spin_8s_linear_infinite]"
                    animate={{ scale: [1, 1.18, 1, 1.12, 1] }}
                    transition={{ duration: gatPulseDurationSeconds, ease: 'easeInOut' }}
                  />
                ) : (
                  <Sparkles size={12} className="text-cyan-200" />
                )}
                <span>Energía</span>
                <span className="tabular-nums text-white">{gatBalance.toLocaleString('es-MX')} GAT</span>
              </motion.div>
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
