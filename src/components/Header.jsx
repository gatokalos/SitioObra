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

  const menuItems = [
    { name: 'Obra', href: '#about' },
    { name: 'Equipo', href: '#team' },
    { name: 'Miniversos', href: '#transmedia' },
    { name: 'Textos', href: '#dialogo-critico' },
    { name: 'Galería', href: '#instagram' },
    { name: 'Función', href: '#next-show' },
  ];

  const handleNavClick = (href) => {
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/60 backdrop-blur-lg border-b border-slate-100/10' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, textShadow: "0 0 8px rgba(233, 213, 255, 0.5)" }}
            className="flex items-center gap-3 cursor-pointer text-white"
            onClick={() => handleNavClick('#hero')}
          >
            <span className="font-display text-2xl font-bold text-gradient">#GatoEncerrado</span>
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
            {user ? (
              <span className="text-sm md:text-base font-semibold tracking-tight text-white">
                {greetingLabel}
              </span>
            ) : null}
          </motion.button>

          <div className="hidden md:flex items-center space-x-1">
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
             <motion.button
                whileHover={{ scale: 1.05, color: '#e9d5ff' }}
                onClick={() => handleNavClick('#contact')}
                className="text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-md ml-4 border border-purple-300/30 hover:bg-purple-500/20"
              >
                Contacto
              </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <button
              onClick={user ? handleLogout : handleOpenOverlay}
              className="hidden md:inline text-sm font-semibold text-slate-100"
            >
              {authActionLabel}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-slate-100/10"
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
            <button
                onClick={() => handleNavClick('#contact')}
                className="block w-full text-left py-3 text-slate-200 hover:text-white transition-colors mt-2 border-t border-slate-100/10"
              >
                Contacto
              </button>
            <button
              onClick={user ? handleLogout : handleOpenOverlay}
              className="block w-full text-left py-3 text-slate-200 hover:text-white transition-colors mt-2"
            >
              {authActionLabel}
            </button>
          </motion.div>
        )}
      </nav>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseOverlay} /> : null}
    </motion.header>
  );
};

export default Header;
