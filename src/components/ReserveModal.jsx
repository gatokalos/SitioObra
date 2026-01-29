// -------------------------------------------------------------
// RESERVE MODAL – VERSIÓN DEFINITIVA, CLARA Y OPTIMIZADA (2025)
// -------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import { Heart } from 'lucide-react';

const LOGO_SRC = '/assets/logoapp.png';

// -------------------------------------------------------------
// PRODUCTOS A APARTAR
// -------------------------------------------------------------
export const PACKAGE_OPTIONS = [
  {
    id: 'taza-250',
    title: 'Taza AR',
    price: '$250',
    helper: 'Taza especial con activación AR.',
    priceId: import.meta.env.VITE_PRICE_TAZA,
  },
  {
    id: 'novela-400',
    title: 'Novela “Mi Gato Encerrado”',
    price: '$400',
    helper: 'Primera edición con QR secreto.',
    priceId: import.meta.env.VITE_PRICE_NOVELA,
  },
  {
    id: 'combo-900',
    title: 'Combo: novela + 2 tazas',
    price: '$900',
    helper: 'Paquete completo disponible solo el día del evento (incluye suscripción al Universo Transmedial si lo solicitas).',
    priceId: import.meta.env.VITE_PRICE_COMBO,
  },
];

const PACKAGE_LABEL_MAP = PACKAGE_OPTIONS.reduce((acc, option) => {
  acc[option.id] = `${option.title} — ${option.price}`;
  return acc;
}, {});

const PACKAGE_PRICE_MAP = PACKAGE_OPTIONS.reduce((acc, option) => {
  if (option.priceId) {
    acc[option.id] = option.priceId;
  }
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
const RESERVE_COPY = {
  season: {
    eyebrow: '28 de diciembre · CECUT',
    title: 'Aparta tus artículos de #GatoEncerrado',
    subtitle:
      'Estos productos son edición especial y se entregan únicamente en la mesa de merch el día del evento.',
    notice: (
      <>
        Este formulario <strong>no es para comprar boletos</strong>. Aquí solo apartas artículos de
        merch (taza, novela o combo). Los boletos se adquieren directamente en taquilla CECUT.
      </>
    ),
    footerNote: null,
    intro: null,
  },
  offseason: {
    eyebrow: 'Encontrémonos fuera del teatro',
    title: 'Objetos del universo #GatoEncerrado',
    intro:
      'La idea es simple: cuando varias personas se interesan, buscamos la manera de encontrarnos, compartir café, conversación y entregar los objetos en mano.',
    notice: (
  <>
    También podemos hacer envíos y coordinar encuentros virtuales. Después de elegir lo que más te guste, nos pondremos en contacto contigo. <strong>Cada reserva abre una conversación.</strong>
  </>
),
    footerNote:
      'A largo plazo, soñamos con un espacio físico donde arte, café y salud mental puedan convivir.',
  },
};

// COMPONENT
// -------------------------------------------------------------
const ReserveModal = ({
  open,
  onClose,
  mode = 'offseason',
  initialPackages = [],
  overlayZClass = 'z-50',
}) => {
  const initialPackagesKey = useMemo(
    () => (Array.isArray(initialPackages) ? initialPackages.join('|') : ''),
    [initialPackages]
  );
  const normalizedInitialPackages = useMemo(
    () => (Array.isArray(initialPackages) ? initialPackages : []),
    [initialPackagesKey]
  );
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Resetea cuando se abre
  // -------------------------------------------------------------
  useEffect(() => {
    if (open) {
      const sanitizedPackages = normalizedInitialPackages.filter((pkgId) => PACKAGE_PRICE_MAP[pkgId]);
      setFormState({ ...initialFormState, packages: sanitizedPackages });
      setStatus('idle');
      setErrorMessage('');
      setCheckoutError('');
      setIsCheckoutLoading(false);
    }
  }, [open, normalizedInitialPackages]);

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

  const validateForm = useCallback(() => {
    if (!formState.fullName.trim() || !formState.email.trim()) {
      return 'Por favor completa tu nombre y correo electrónico.';
    }
    if (formState.packages.length === 0) {
      return 'Selecciona al menos un artículo para apartar.';
    }
    return null;
  }, [formState]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') return;

      const validationError = validateForm();
      if (validationError) {
        toast({ description: validationError });
        return;
      }

      setStatus('loading');
      setIsSubmitting(true);
      setErrorMessage('');
      setCheckoutError('');

      try {
        const payload = {
          fullName: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: formState.city.trim() || null,
          notes: formState.notes.trim() || '',
          packages: formState.packages,
          channel: 'landing',
          event: 'cecutt_28dic',
        };

        const { error } = await supabase.functions.invoke('send-reserve-confirmation', {
          body: payload,
        });

        if (error) throw error;

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
    [formState, status, fireConfetti, validateForm]
  );

  const handleCheckout = useCallback(
    async (event) => {
      event.preventDefault?.();
      if (isCheckoutLoading || status === 'loading') return;

      const validationError = validateForm();
      if (validationError) {
        toast({ description: validationError });
        return;
      }

      setCheckoutError('');
      setIsCheckoutLoading(true);

      try {
        const line_items = formState.packages.map((pkgId) => ({
          price: PACKAGE_PRICE_MAP[pkgId],
          quantity: 1,
        }));

        if (line_items.some((item) => !item.price)) {
          throw new Error('Faltan precios configurados para algunos paquetes.');
        }

        const payload = {
          mode: 'payment',
          line_items,
          customer_email: formState.email.trim().toLowerCase(),
          metadata: {
            channel: 'landing',
            event: 'funcion-2025-12-28',
            packages: formState.packages.join(','),
          },
        };

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: payload,
        });

        if (error || !data?.url) {
          throw error || new Error('Falta la URL de pago.');
        }

        window.location.href = data.url;
      } catch (err) {
        console.error('[ReserveModal] Checkout error:', err);
        setCheckoutError('No pudimos iniciar el pago. Intenta nuevamente.');
      } finally {
        setIsCheckoutLoading(false);
      }
    },
    [formState, isCheckoutLoading, status, validateForm]
  );

  const handleClose = useCallback(() => {
    if (status !== 'loading') onClose?.();
  }, [status, onClose]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  const copy = RESERVE_COPY[mode] ?? RESERVE_COPY.offseason;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${overlayZClass} flex items-start justify-center px-4 py-6 sm:py-10 overflow-y-auto`}
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <img
                  src={LOGO_SRC}
                  alt="#GatoEncerrado"
                  className="h-12 w-auto object-contain rounded-full border border-white/20 bg-white/5 p-1 shadow-lg"
                />
                <div>
                  {copy.eyebrow ? (
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
                      {copy.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="font-display text-3xl text-slate-50">
                    {copy.title}
                  </h2>
                  {copy.subtitle ? (
                    <p className="text-xs text-slate-400/80 mt-1">{copy.subtitle}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar modal"
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            {copy.intro ? (
              <p className="mb-6 text-sm text-slate-300/90 leading-relaxed">{copy.intro}</p>
            ) : null}

            {copy.notice ? (
              <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs text-yellow-200">
                {copy.notice}
              </div>
            ) : null}

            {/* GRID */}
            <div className="grid md:grid-cols-2 gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-5">
                <div>
                
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
  {PACKAGE_OPTIONS.map((option) => {
    const isSelected = formState.packages.includes(option.id);
    const isCombo = option.id === 'combo-900';

    // Mapeo de imágenes por paquete
    const imageMap = {
      'taza-250': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/TazaPreventa.jpg',
      'novela-400': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/novela_mesa.jpg',
      'combo-900': 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/NovelaTazaCombo.jpg',
    };

    const imageHeightClass = isCombo ? 'h-48' : 'h-32';

    return (
      <label
        key={option.id}
        className={`relative block rounded-2xl border ${
          isSelected
            ? 'border-purple-400/70 shadow-[0_12px_35px_rgba(126,34,206,0.35)]'
            : 'border-white/10'
        } bg-gradient-to-br from-slate-900/80 to-black/60 p-4 hover:border-purple-400/40 transition ${isCombo ? 'sm:col-span-2' : ''}`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleTogglePackage(option.id)}
          className="sr-only"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition duration-300 ${
            isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.45)]">
            <Heart size={48} className="text-purple-500" />
          </div>
        </div>

        <div className={`mb-3 w-full ${imageHeightClass} rounded-xl overflow-hidden border border-white/5`}>
          <img
            src={imageMap[option.id]}
            alt={option.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-100">
            {option.title}{' '}
            <span className="text-slate-400 font-normal">· {option.price}</span>
          </p>
          <p className="text-xs text-slate-400">{option.helper}</p>
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
                    placeholder="¿Desde dónde nos escribes?"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Notas</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formState.notes}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
                    placeholder="¿Necesitas facilidades especiales o quires solicitar tu suscripción?"
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
                    Te enviamos un correo para que tengas listo tu pago antes del evento.
                  </div>
                )}

                {/* Checkout error */}
                {checkoutError && (
                  <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {checkoutError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                  >
                    {isSubmitting ? 'Enviando…' : 'Apartar'}
                  </Button>

       

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCheckoutLoading || status === 'loading'}
                    onClick={handleCheckout}
                    className="w-full border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                  >
                    {isCheckoutLoading ? 'Redirigiendo…' : 'Comprar ahora'}
                  </Button>
             
                </div>
              </form>
            </div>

            {copy.footerNote ? (
              <p className="mt-8 text-sm text-slate-300/80">{copy.footerNote}</p>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReserveModal;
