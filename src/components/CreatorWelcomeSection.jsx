import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { setBienvenidaReturnPath } from '@/lib/bienvenida';

const CREATOR_AVATAR_SRC =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/autores/carlos_perez_avatar.png';

const CreatorWelcomeSection = ({ hasEnteredUniverse = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleEnter = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.bienvenidaFade = 'true';
    }
    setBienvenidaReturnPath(`${location.pathname}${location.search}${location.hash}`);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        navigate('/bienvenida', { replace: true });
      }, 450);
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return (
    <section id="bienvenida-creador" className="py-24 relative min-h-[520px]">
      <div className="section-divider mb-24"></div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="relative glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          >
            <motion.div
              initial={{ opacity: 0.35, scale: 0.9 }}
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[85%] h-[85%] md:w-[70%] md:h-[70%] rounded-full bg-purple-600/30 blur-[100px]"
            />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl font-medium text-slate-100 mb-6 text-center">
              La Tercera Llamada
            </h3>
           <div className="text-slate-300/80 leading-relaxed mb-6 max-w-2xl mx-auto font-light text-center space-y-4">
  <p>No sé cómo llegaste hasta aquí.<br />Pero me alegra que lo hayas hecho.</p>
  <p>Esto que ves es un universo hecho de preguntas.<br />No todas tienen respuesta.<br />Algunas solo necesitan que alguien las habite.</p>
  <p>Yo te estaba esperando.</p>
</div>
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 shadow-lg shadow-black/40 bg-black/30">
                <img
                  className="w-full h-full object-cover"
                  src={CREATOR_AVATAR_SRC}
                  alt="Carlos A. Pérez H."
                  loading="lazy"
                />
              </div>
              <p className="font-display text-sm text-purple-100">Carlos A. Pérez H.</p>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-purple-200/70">
                Creador de #GatoEncerrado
              </p>
            </div>
            <Button
              type="button"
              onClick={handleEnter}
              className="ge-chip-action ge-chip-action--primary mx-auto"
            >
              {hasEnteredUniverse ? 'Revisitar' : '¿Comenzamos?'}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CreatorWelcomeSection;
