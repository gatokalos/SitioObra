// -------------------------------------------------------------
// RESERVE MODAL – VERSIÓN DEFINITIVA, CLARA Y OPTIMIZADA (2025)
// -------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';

const LOGO_SRC = '/assets/logoapp.png';

// -------------------------------------------------------------
// PRODUCTOS A APARTAR
// -------------------------------------------------------------
export const PACKAGE_OPTIONS = [
  {
    id: 'taza-250',
    title: 'Taza AR',
    price: '$250',
    helper: 'Taza especial con activación AR. Disponible el día del evento.',
  },
  {
    id: 'taza-causa-600',
    title: 'Taza con causa',
    price: '$600',
    helper: 'Incluye membresía anual. Se entrega el 28 de diciembre.',
  },
  {
    id: 'novela-400',
    title: 'Novela “Mi Gato Encerrado”',
    price: '$400',
    helper: 'Primera edición con QR secreto.',
  },
  {
    id: 'combo-900',
    title: 'Combo: novela + 2 tazas',
    price: '$900',
    helper: 'Paquete completo disponible solo el día del evento.',
  },
];

const PACKAGE_LABEL_MAP = PACKAGE_OPTIONS.reduce((acc, option) => {
  acc[option.id] = `${option.title} — ${option.price}`;
  return acc;
}, {});

// -------------------------------------------------------------
// ESTADO DEL FORMULARIO
// -------------------------------------------------------------
const initialFormState = {
  fullName: '',
  email: '',
  city: '',
  notes: '',
  packages: [],
};

// -------------------------------------------------------------
// ANIMACIONES
// -------------------------------------------------------------
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// -------------------------------------------------------------
// COMPONENT
// -------------------------------------------------------------
const ReserveModal = ({ open, onClose }) => {
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Resetea cuando se abre
  // -------------------------------------------------------------
  useEffect(() => {
    if (open) {
      setFormState(initialFormState);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open]);

  // -------------------------------------------------------------
  // Permitir cerrar con ESC
  // -------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTogglePackage = useCallback((pkg) => {
    setFormState((prev) => {
      const exists = prev.packages.includes(pkg);
      return {
        ...prev,
        packages: exists
          ? prev.packages.filter((item) => item !== pkg)
          : [...prev.packages, pkg],
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') return;

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo electrónico.' });
        return;
      }

      if (formState.packages.length === 0) {
        toast({ description: 'Selecciona al menos un artículo para apartar.' });
        return;
      }

      setStatus('loading');
      setIsSubmitting(true);
      setErrorMessage('');

      try {
        const packagesSummary = formState.packages
          .map((pkg) => PACKAGE_LABEL_MAP[pkg])
          .join(', ');

        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: formState.city.trim() || null,
          object_type: 'merch',
          event: 'funcion-2025-12-28',
          channel: 'landing',
          notes: `${packagesSummary} | ${formState.notes || ''}`.trim(),
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          setStatus('error');
          setErrorMessage('No pudimos registrar tu solicitud. Intenta nuevamente.');
          return;
        }

        // Envía correo de confirmación
        await sendReserveConfirmationEmail({
          email: payload.email,
          name: payload.full_name,
          city: payload.city,
          notes: payload.notes,
        });

        fireConfetti();
        setStatus('success');
        toast({ description: '¡Apartado recibido! Revisa tu correo con los siguientes pasos.' });
      } catch (err) {
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, status, fireConfetti]
  );

  const handleClose = useCallback(() => {
    if (status !== 'loading') onClose?.();
  }, [status, onClose]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:py-10 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={modalVariants}
            className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 sm:p-10 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {confettiBursts.map((burst) => (
              <ConfettiBurst key={burst} seed={burst} />
            ))}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <img
                  src={LOGO_SRC}
                  alt="#GatoEncerrado"
                  className="h-12 w-auto object-contain rounded-full border border-white/20 bg-white/5 p-1 shadow-lg"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
                    28 de diciembre · CECUT
                  </p>
                  <h2 className="font-display text-3xl text-slate-50">
                    Aparta tus artículos de #GatoEncerrado
                  </h2>
                  <p className="text-xs text-slate-400/80 mt-1">
                    Estos productos son edición especial y se entregan únicamente en la mesa de merch el día del evento.
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="self-end text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Aviso anti confusión */}
            <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs text-yellow-200">
              Este formulario <strong>no es para comprar boletos</strong>.  
              Aquí solo apartas artículos de merch (taza, novela o combo).  
              Los boletos se adquieren directamente en taquilla CECUT.
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-lg text-slate-100 mb-1">
                    Paquetes disponibles
                  </h3>
                  <p className="text-xs text-slate-400/80">
                    Marca lo que quieras apartar. Te enviaremos tu línea de reservaciones y un enlace de pago seguro (Stripe).
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
  {PACKAGE_OPTIONS.map((option) => {
    const isSelected = formState.packages.includes(option.id);

    // Mapeo de imágenes por paquete
    const imageMap = {
      'taza-250': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/tazax1.jpeg',
      'taza-causa-600': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza2x1.jpeg',
      'novela-400': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/novelasola.jpeg',
      'combo-900': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/NovelaTazaCombo.png',
    };

    return (
      <label
        key={option.id}
        className={`relative block rounded-2xl border ${
          isSelected
            ? 'border-purple-400/70 shadow-[0_12px_35px_rgba(126,34,206,0.35)]'
            : 'border-white/10'
        } bg-gradient-to-br from-slate-900/80 to-black/60 p-4 hover:border-purple-400/40 transition`}
      >
        {/* IMAGEN REAL DEL PAQUETE */}
        <div className="mb-3 w-full h-32 rounded-xl overflow-hidden border border-white/5">
          <img
            src={imageMap[option.id]}
            alt={option.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleTogglePackage(option.id)}
            className="mt-1 h-4 w-4 rounded border-slate-400 bg-black/40 text-purple-500 focus:ring-purple-400"
          />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              {option.title}{' '}
              <span className="text-slate-400 font-normal">· {option.price}</span>
            </p>
            <p className="text-xs text-slate-400">{option.helper}</p>
          </div>
        </div>
      </label>
    );
  })}
</div>
              </div>

              {/* RIGHT COLUMN — FORM */}
              <form className="space-y-5" onSubmit={handleSubmit}>

                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Nombre completo *</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="¿Cómo te llamas?"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Correo electrónico *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="nombre@correo.com"
                  />
                </div>

                {/* Ciudad */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Ciudad</label>
                  <input
                    name="city"
                    type="text"
                    value={formState.city}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="¿Desde dónde nos visitas?"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Mensaje opcional</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formState.notes}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
                    placeholder="¿Necesitas facilidades especiales o tienes un código de preventa?"
                  />
                </div>

                {/* Errors */}
                {status === 'error' && (
                  <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {/* Success */}
                {status === 'success' && (
                  <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    ¡Listo! Revisa tu correo para completar tu apartado.
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                  >
                    {isSubmitting ? 'Enviando…' : 'Apartar mis artículos'}
                  </Button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReserveModal;

// -------------------------------------------------------------
// SEND EMAIL (Resend + Supabase Edge Function)
// -------------------------------------------------------------
async function sendReserveConfirmationEmail({ email, name, city, notes }) {
  if (!email) return;

  try {
    const { error } = await supabase.functions.invoke('send-reserve-confirmation', {
      body: { email, name, city, notes },
    });

    if (error) console.error('[ReserveModal] Error en sendReserveConfirmationEmail:', error);
  } catch (err) {
    console.error('[ReserveModal] Exception in sendReserveConfirmationEmail:', err);
  }
}