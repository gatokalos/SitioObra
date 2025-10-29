import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Inicio', href: '#hero' },
    { name: 'La Obra', href: '#about' },
    { name: 'Equipo', href: '#team' },
    { name: 'Universo', href: '#transmedia' },
    { name: 'Textos', href: '#curatorial' },
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
          <motion.div
            whileHover={{ scale: 1.05, textShadow: "0 0 8px rgba(233, 213, 255, 0.5)" }}
            className="font-display text-2xl font-bold text-gradient cursor-pointer"
            onClick={() => handleNavClick('#hero')}
          >
            #GatoEncerrado 💜
          </motion.div>

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

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
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
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
};

export default Header;