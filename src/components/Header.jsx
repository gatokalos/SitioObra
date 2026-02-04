import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
  const handleCloseOverlay = useCallback(() => setShowLoginOverlay(false), []);
  const handleOpenOverlay = useCallback(() => setShowLoginOverlay(true), []);
  const handleLogout = useCallback(async () => {
    if (!user) {
      setShowLoginOverlay(true);
      return;
    }
    const { error } = await signOut();
    if (error) {
      showToast({
        description: error.message || 'No pudimos cerrar sesión. Intenta más tarde.',
      });
    } else {
      showToast({
        description: 'Sesión cerrada correctamente.',
      });
    }
  }, [signOut, showToast, user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (typeof window === "undefined") return;
    const handleOpenFromToast = () => setShowLoginOverlay(true);
    window.addEventListener('open-login-modal', handleOpenFromToast);
    return () => window.removeEventListener('open-login-modal', handleOpenFromToast);
  }, [setShowLoginOverlay]);

  const menuItems = [
    { name: 'Obra', href: '#about' },
    { name: 'Equipo', href: '#team' },
    { name: 'Función', href: '#next-show' },
    { name: 'Galería', href: '#instagram' },
    { name: 'Textos', href: '#dialogo-critico' },
    { name: 'Miniversos', href: '#transmedia' },
    { name: 'Causa', href: '#apoya' },
  ];

  const handleNavClick = (href) => {
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/60 backdrop-blur-lg border-b border-slate-100/10' : 'bg-transparent'
        }`}
      >
      <nav className="container mx-auto px-6 py-3 max-[375px]:px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, textShadow: "0 0 8px rgba(233, 213, 255, 0.5)" }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleNavClick('#hero')}
            >
              <span className="font-display text-2xl font-bold text-gradient max-[375px]:text-lg whitespace-nowrap">
                Es un gato encerrado
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
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
                  <div className="absolute left-0 mt-2 w-40 rounded-xl border border-white/10 bg-black/90 py-2 text-sm text-slate-100 shadow-xl">
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
            ) : (
              <button
                onClick={handleOpenOverlay}
                className="inline text-xs font-semibold text-slate-100 sm:text-sm"
              >
                Iniciar sesión
              </button>
            )}
          </div>

          <div className="hidden xl:flex items-center space-x-1">
            <motion.button
              whileHover={{ scale: 1.05, color: '#e9d5ff' }}
              onClick={() => handleNavClick('#contact')}
              className="text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-md border border-purple-300/30 hover:bg-purple-500/20"
            >
              Contacto
            </motion.button>
            {menuItems.map((item) => (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.05, color: '#e9d5ff' }}
                onClick={() => handleNavClick(item.href)}
                className="text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-md"
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
            className="xl:hidden text-slate-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden mt-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-slate-100/10"
          >
            <button
              onClick={() => handleNavClick('#contact')}
              className="block w-full text-left py-3 text-slate-200 hover:text-white transition-colors border-b border-slate-100/10"
            >
              Contacto
            </button>
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="block w-full text-left py-3 text-slate-200 hover:text-white transition-colors mt-2"
              >
                {item.name}
              </button>
            ))}
          </motion.div>
        )}
      </nav>
      </motion.header>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseOverlay} /> : null}
    </>
  );
};

export default Header;
