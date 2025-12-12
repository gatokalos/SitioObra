import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Footer = () => {
  const instagramUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const twitterUrl = 'https://x.com/SilvestreFilis';
  const facebookUrl = 'https://www.facebook.com/share/16pHNpZjpM/?mibextid=wwXIfr';

  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
      });
    }
  };

  const handleLinkClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative py-16 mt-24 min-h-[560px]">
      <div className="section-divider mb-16"></div>
      
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="font-display text-3xl font-medium italic text-gradient mb-4 block">
                #GatoEncerrado
              </span>
              <p className="text-slate-400 leading-relaxed mb-6 max-w-md font-light">
                Una experiencia teatral transmedia que explora los límites entre 
                la realidad y la ficción, creando nuevas formas de narrativa artística.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleSocialClick(instagramUrl)} className="text-slate-400 hover:text-white hover:bg-white/10"><Instagram size={20} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleSocialClick(twitterUrl)} className="text-slate-400 hover:text-white hover:bg-white/10"><Twitter size={20} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleSocialClick(facebookUrl)} className="text-slate-400 hover:text-white hover:bg-white/10"><Facebook size={20} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleLinkClick('#contact')} className="text-slate-400 hover:text-white hover:bg-white/10"><Mail size={20} /></Button>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="font-semibold text-slate-200 mb-4 block">Navegación</span>
              <ul className="space-y-3">
                {[{name: 'Obra', href: '#about'}, {name: 'Equipo', href: '#team'}, {name: 'Galería', href: '#instagram'}, { name: 'Textos', href: '#dialogo-critico' }, {name: 'Miniversos', href: '#transmedia'}, {name: 'Función', href: '#next-show'}].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => handleLinkClick(item.href)}
                      className="text-slate-400 hover:text-white transition-colors text-sm font-light"
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="font-semibold text-slate-200 mb-4 block">Contacto</span>
              <ul className="space-y-3 text-sm font-light">
                <li className="text-slate-400">contacto@gatoencerrado.ai</li>
                <li className="text-slate-400">+52 123 456 789</li>
                <li className="text-slate-400">#Universotransmedia<br />Tijuana, México</li>
              </ul>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} #GatoEncerrado. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>Hecho con</span>
            <Heart size={16} className="text-red-500/70" />
            <span>para el arte teatral</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
