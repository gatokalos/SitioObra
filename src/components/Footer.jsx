import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Pieza editorial con el resplandor integrado en la propia imagen.
const esferaFinalPng = '/assets/esfera_final.png';

const Footer = () => {
  const instagramUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const twitterUrl = 'https://x.com/SilvestreFilis';
  const facebookUrl = 'https://www.facebook.com/share/16pHNpZjpM/?mibextid=wwXIfr';

  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próxima visita! 🚀"
      });
    }
  };

  const handleLinkClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (href === '#instagram') {
      window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-fractal-gallery'));
    }
  };

  return (
    <footer className="relative py-16 mt-24 min-h-[560px]">
      <div className="section-divider mb-16"></div>
      
      <div className="container mx-auto px-6">
        <div className="mb-12 grid gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(180px,0.75fr)] lg:gap-12">
          <div className="flex justify-center md:hidden">
            <motion.img
              src={esferaFinalPng}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              viewport={{ once: true }}
              className="h-auto w-[145px] select-none"
            />
          </div>

          <div>
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
                Una experiencia narrativa interactiva desplegada en nueve formas creativas. Quien entra deja de ser solo observadxr: aborda y transforma, desde un lugar propio, una herida emocional compartida.
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
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="font-semibold text-slate-200 mb-4 block">Contacto</span>
              <ul className="space-y-3 text-sm font-light">
                <li className="text-slate-400">contacto@gatoencerrado.org</li>
                <li className="text-slate-400">+52 331 532 7985</li>
                <li className="text-slate-400">Carlos A. Pérez H.<br />Tijuana, México</li>
              </ul>
            </motion.div>
          </div>

          <div className="hidden items-start justify-end md:flex">
            <motion.img
              src={esferaFinalPng}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              viewport={{ once: true }}
              className="h-auto w-[190px] select-none lg:w-[220px]"
            />
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
            <span>para la comunidad</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
