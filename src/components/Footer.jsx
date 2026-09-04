import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

// Pieza editorial con el resplandor integrado en la propia imagen.
const esferaFinalPng = '/assets/esfera_final.png';

const Footer = () => {
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
                Una experiencia narrativa interactiva desplegada en nueve formas creativas. Quien entra deja de ser alguien que tan solo observa: aborda y transforma, desde un lugar propio, una herida emocional compartida.
              </p>
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
                <li className="text-slate-400">dramaturgo@gatoencerrado.org</li>
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
