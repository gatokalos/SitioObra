import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import MobileMenuOverlay from '@/components/MobileMenuOverlay';
import {
  getHeroAmbientState,
  subscribeHeroAmbient,
  toggleHeroAmbientMuted,
  getHeroAmbientAudio,
} from '@/lib/heroAmbientAudio';
import {
  getTransmediaSectionState,
  subscribeTransmediaAmbient,
  toggleTransmediaAmbientMuted,
  getTransmediaSectionAudio,
} from '@/lib/transmediaSectionAudio';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import isotipoGatoWebp from '@/assets/isotipo-gato.webp';

const MOBILE_FULLSCREEN_MENU_PHASE_A_ENABLED = true;
const PUBLIC_HEADER_LOGO_SRC = '/assets/header-logo.png';

const Header = ({ showTransmediaNav = true }) => {
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

  const [audioState, setAudioState] = useState(() => getHeroAmbientState());
  useEffect(() => subscribeHeroAmbient(() => setAudioState(getHeroAmbientState())), []);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  useEffect(() => {
    const heroEl = document.getElementById('hero');
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  const [transmediaAudioState, setTransmediaAudioState] = useState(() => getTransmediaSectionState());
  useEffect(() => subscribeTransmediaAmbient(() => setTransmediaAudioState(getTransmediaSectionState())), []);
  const [isTransmediaVisible, setIsTransmediaVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById('transmedia');
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsTransmediaVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAudioToggle = useCallback(() => {
    const audio = getHeroAmbientAudio();
    if (!audio) return;
    // Autoplay bloqueado: primer toque reanuda en vez de mutear
    if (!audioState.isMuted && audio.paused) {
      void audio.play().catch(() => {});
      return;
    }
    toggleHeroAmbientMuted();
  }, [audioState.isMuted]);

  const handleTransmediaAudioToggle = useCallback(() => {
    const audio = getTransmediaSectionAudio();
    if (!audio) return;
    if (!transmediaAudioState.isMuted && audio.paused) {
      void audio.play().catch(() => {});
      return;
    }
    toggleTransmediaAmbientMuted();
  }, [transmediaAudioState.isMuted]);

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
    if (typeof window === 'undefined') return undefined;
    const handleOpenFromToast = () => setShowLoginOverlay(true);
    window.addEventListener('open-login-modal', handleOpenFromToast);
    return () => window.removeEventListener('open-login-modal', handleOpenFromToast);
  }, []);

  const menuItems = [
    { name: 'Alianza', href: '#apoya' },
    { name: 'Obra', href: '#about' },
    { name: 'Equipo', href: '#team' },
    { name: 'Galería', href: '#instagram' },
    { name: 'Voces', href: '#provoca' },
    { name: 'Curaduría', href: '#dialogo-critico' },
    ...(showTransmediaNav ? [{ name: 'Transmedia', href: '#transmedia' }] : []),
    { name: 'Funciones', href: '#next-show' },
    { name: 'Contacto', href: '#contact' },
  ];
  const mobileMenuItems = [
    {
      name: 'Alianza',
      href: '#apoya',
      description: 'Causa social',
      secondary: [
        { label: 'Ver modelo de impacto', href: '#apoya' },
        { label: 'Dejar una huella', href: '#cta' },
      ],
    },
    { name: 'Obra', href: '#about' },
    { name: 'Equipo', href: '#team' },
    { name: 'Galería', href: '#instagram' },
    { name: 'Voces', href: '#provoca' },
    {
      name: 'Curaduría',
      href: '#dialogo-critico',
      description: 'Diálogo crítico y educativo',
      secondary: [
        { label: 'FAQ', href: '#dialogo-critico' },
      ],
    },
    ...(showTransmediaNav
      ? [
          {
            name: 'Transmedia',
            href: '#transmedia',
            description: 'Narrativa Expandida',
            secondary: [
              { label: 'Mini-apps', href: '#transmedia' },
            ],
          },
        ]
      : []),
    { name: 'Funciones', href: '#next-show' },
    { name: 'Contacto', href: '#contact' },

  ];

  const handleNavClick = useCallback((href) => {
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleOpenSupportHub = useCallback(() => {
    if (!user) return;
    setIsMenuOpen(false);
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'header-encuentros'),
    });
  }, [location, navigate, user]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerToneClass}`}
      >
        <nav className="container mx-auto px-6 py-3 max-[375px]:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, textShadow: '0 0 8px rgba(233, 213, 255, 0.5)' }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleNavClick('#hero')}
              >
                <img
                  src={headerLogoSrc}
                  alt={headerLogoAlt}
                  className={headerLogoClassName}
                  loading="eager"
                  decoding="async"
                />
                {user ? <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} /> : null}
              </motion.button>
              {user ? (
                <div className="relative" data-profile-menu>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="inline-flex items-center text-xs font-semibold text-slate-100 transition sm:text-sm underline underline-offset-4 decoration-slate-400/40 hover:text-white hover:decoration-emerald-300/60"
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

            <div className="hidden xl:flex items-center space-x-1">
              {menuItems.map((item) => (
                <motion.button
                  key={item.name}
                  whileHover={{ scale: 1.05, color: '#e9d5ff' }}
                  onClick={() => handleNavClick(item.href)}
                  className={`text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-md ${
                    item.name === 'Contacto' ? 'border border-purple-300/30 hover:bg-purple-500/20' : ''
                  }`}
                >
                  {item.name}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {audioState.isReady && isHeroVisible ? (
                <button
                  type="button"
                  onClick={handleAudioToggle}
                  aria-label={audioState.isPlaying ? 'Silenciar sonido' : 'Activar sonido'}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition ${
                    audioState.isPlaying
                      ? 'border-violet-300/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25'
                      : 'border-white/20 bg-black/40 text-slate-300 hover:bg-black/60'
                  }`}
                >
                  {audioState.isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              ) : null}
              {transmediaAudioState.isReady && isTransmediaVisible ? (
                <button
                  type="button"
                  onClick={handleTransmediaAudioToggle}
                  aria-label={transmediaAudioState.isMuted ? 'Activar música' : 'Silenciar música'}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition ${
                    !transmediaAudioState.isMuted
                      ? 'border-fuchsia-300/40 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25'
                      : 'border-white/20 bg-black/40 text-slate-300 hover:bg-black/60'
                  }`}
                >
                  {transmediaAudioState.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              ) : null}
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
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-slate-200"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
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
