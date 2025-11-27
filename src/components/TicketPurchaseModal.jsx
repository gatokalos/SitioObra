import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import logoApp from '/assets/logoapp.png';

const CALENDAR_LINK =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Gato%20Encerrado%20%C2%B7%2028%20de%20diciembre&dates=20241228T210000Z/20241228T223000Z&details=Funci%C3%B3n%20especial%20en%20CEC&location=CECUT';

const SMS_NUMBER = import.meta.env.VITE_SMS_NUMBER || '+526623550516';
const SMS_MESSAGE = encodeURIComponent(
  'Hola equipo Gato Encerrado, recuérdenme la función del 28 de diciembre en CECUT.'
);

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 0.85 } };
const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const TicketPurchaseModal = ({ open, onClose }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleScrollTo = (selector) => {
    onClose?.();
    setTimeout(
      () => document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      80
    );
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            variants={backdropVariants}
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            variants={modalVariants}
            className="
              relative z-10 w-full max-w-lg               /* MOBILE: ideal width */
              rounded-3xl border border-white/10 
              bg-slate-950/95 p-5 sm:p-8 
              shadow-[0_20px_70px_rgba(0,0,0,0.5)]
              overflow-y-auto max-h-[90vh]
            "
          >
            {/* ================== HEADER ================== */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoApp}
                  alt="Logotipo Gato Encerrado"
                  className="h-10 w-10 rounded-xl border border-white/15 bg-black/40 p-1"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300/80">
                    28 de diciembre · CECUT
                  </p>
                  <h3
                    id="ticket-modal-title"
                    className="font-display text-xl sm:text-3xl text-slate-50 leading-tight"
                  >
                    Función única de Es un Gato Encerrado
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition text-lg"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* ================== MOBILE-FIRST STACK ================== */}
            <div className="flex flex-col gap-6">

              {/* ======================================
                  BLOQUE COMPLETO: COMPRA + TAZA + ACLARACIONES
              ====================================== */}
              <div className="rounded-3xl border border-white/10 bg-black/40 p-5 space-y-6 shadow-[0_15px_50px_rgba(0,0,0,0.4)]">

                {/* Compra presencial */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-slate-100 leading-tight">
                    Compra presencial en taquilla del CECUT
                  </h4>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    La preventa está abierta hasta agotar localidades.
                    <br />
                    <strong className="text-slate-100/90 block mt-1">
                      La Taza Incentivo solo se entrega durante la preventa y mientras haya stock.
                    </strong>
                    <span className="text-xs text-slate-400/90 block mt-1">
                      El día del evento podría no haber tazas disponibles.
                    </span>
                  </p>

             
                </div>

                {/* Taza */}
                <div className="space-y-4">
                  <img
                    src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/TazaPreventa.jpg"
                    alt="Taza incentivo de preventa"
                    className="w-full h-44 object-cover rounded-xl border border-white/10"
                  />

                  <p className="text-sm text-slate-300 leading-relaxed">
                    Esta pieza activa WebAR y forma parte del Miniverso Taza, donde se cruza con la causa social del proyecto.
                  </p>

                  <div className="flex flex-col gap-3">
              
                    <Button
                      variant="outline"
                      className="w-full border-purple-300/40 text-purple-200 hover:bg-purple-500/10"
                      onClick={() => handleScrollTo('#apoya')}
                    >
                      Apoya el proyecto
                    </Button>
                  </div>
                </div>
              </div>

              {/* ======================================
                  BLOQUE: RECORDATORIOS
              ====================================== */}
              <div className="rounded-3xl border border-white/10 bg-black/35 p-5 space-y-4 shadow-inner">

                <p className="text-[10px] uppercase tracking-[0.32em] text-purple-300/80">
                  No te pierdas la función
                </p>

                <h4 className="text-lg font-semibold text-slate-100 leading-tight">
                  Sabemos que los días se pasan volando
                </h4>

                <p className="text-sm text-slate-400 leading-relaxed">
                  Activa un recordatorio para que el 28 no se te pase:
                </p>

                <div className="flex flex-col gap-3">

                  {/* Google Calendar */}
                  <a
                    href={CALENDAR_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      block w-full rounded-2xl border border-white/10 bg-slate-900/60 
                      px-4 py-4 text-slate-100 hover:border-purple-400/80 transition
                    "
                  >
                    <span className="block text-sm font-semibold">Añadir a mi calendario</span>
                    <span className="text-xs text-slate-400">
                      Con fecha, hora y lugar prellenados.
                    </span>
                  </a>

                  {/* Asistencia humana */}
                  <a
                    href={`https://wa.me/${SMS_NUMBER.replace(/\D/g, '')}?text=${SMS_MESSAGE}`}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      block w-full rounded-2xl border border-white/10 bg-slate-900/60 
                      px-4 py-4 text-slate-100 hover:border-purple-400/80 transition
                    "
                  >
                    <span className="block text-sm font-semibold">Recibir asistencia humana</span>
                    <span className="text-xs text-slate-400">
                      Te enviamos un aviso personalizado por WhatsApp/SMS.
                    </span>
                  </a>
                </div>
              </div>

             {/* ======================================
            BLOQUE: TE CHOCA HACER LÍNEA
   ====================================== */}
<div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-300 space-y-3">
  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/80">
    ¿No te gusta hacer fila?
  </p>

  <h4 className="font-semibold text-slate-100">
    También puedes comprar en línea desde tu celular
  </h4>

 
    <span className="text-slate-500 text-xs">
      (La Taza Incentivo se entrega solo en compras presenciales.)
    </span>


  <Button
    asChild
    className="
      w-full py-3 rounded-2xl font-semibold
      bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 
      hover:from-orange-400 hover:to-pink-400
      text-white shadow-[0_12px_40px_rgba(255,99,132,0.35)]
    "
  >
    <a
      href="https://www.taquillacecut.com.mx/eventos/saladeespectaculos/2025-12-28"
      target="_blank"
      rel="noreferrer"
    >
      Comprar en taquillacecut.com.mx
    </a>
  </Button>
</div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default TicketPurchaseModal;