import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import logoApp from '/assets/logoapp.png';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const TicketPurchaseModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 sm:p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoApp}
                  alt="Logotipo #GatoEncerrado"
                  className="h-10 w-10 rounded-xl object-contain border border-white/10 bg-white/5"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/80">28 de diciembre · CECUT</p>
                  <h3 id="ticket-modal-title" className="font-display text-2xl sm:text-3xl text-slate-50">
                    Función única de Es un Gato Encerrado
                  </h3>
        
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition text-lg leading-none"
                aria-label="Cerrar compra de boletos"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.35)] space-y-3 text-slate-200">
              <h4 className="text-lg font-semibold text-slate-100">Compra presencial en taquilla del CECUT</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li>Taquilla del CECUT · Preventa disponible hasta agotar localidades.</li>
                <li>Llévate una taza como incentivo de preventa (sujeto a disponibilidad).</li>
                <li>Las tazas se entregan exclusivamente en taquilla, hasta agotar existencias.</li>
                <li>
                  También puedes comprar en línea:{' '}
                  <a
                    href="https://taquillacecut.com.mx"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-200 underline underline-offset-4 hover:text-purple-100"
                  >
                    taquillacecut.com.mx
                  </a>{' '}
                  ·{' '}
                  <a
                    href="https://taquillacecut.com.mx"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-200 underline underline-offset-4 hover:text-purple-100"
                  >
                    Entrada 28/12
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1.2fr_1fr] items-center">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                <img
                  src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza_h.png"
                  alt="Taza conmemorativa #GatoEncerrado"
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  La taza es el incentivo de preventa y forma parte del Miniverso Taza. Descubre cómo conecta con la
                  causa social y la experiencia AR.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white font-semibold"
                    onClick={() => {
                      onClose?.();
                      setTimeout(
                        () => document.querySelector('#transmedia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                        50
                      );
                    }}
                  >
                    Ver Miniverso Taza
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-300/40 text-purple-200 hover:bg-purple-500/10"
                    onClick={() => {
                      onClose?.();
                      setTimeout(
                        () => document.querySelector('#apoya')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                        50
                      );
                    }}
                  >
                    Apoya el proyecto
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default TicketPurchaseModal;
