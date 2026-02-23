// -------------------------------------------------------------
// RESERVE MODAL – VERSIÓN DEFINITIVA, CLARA Y OPTIMIZADA (2025)
// -------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import { Heart, MapIcon } from 'lucide-react';

const LOGO_SRC = '/assets/logoapp.webp';
// Banner (placeholder). Reemplaza por tu póster horizontal cuando lo tengas.
const BANNER_SRC = '/assets/placeholder-banner.webp';


const RESERVE_BUTTON_STYLES = `
/* ReserveModal: glossy CTA button */
.reserve-btn{
  --r: 999px;
  position: relative;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: var(--r);
  cursor: pointer;
  color: rgba(255,255,255,.92);
  font-weight: 650;
  background: rgba(16,18,24,.62);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 12px 30px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
  overflow: hidden;
}

.reserve-btn::before{
  content:"";
  position:absolute;
  inset:-40%;
  background:
    linear-gradient(135deg,
      rgba(120,255,233,.55) 0%,
      rgba(120,160,255,.25) 35%,
      rgba(206,120,255,.55) 60%,
      rgba(255,210,120,.35) 100%);
  transform: rotate(8deg);
  opacity: .65;
  filter: blur(0px);
  pointer-events:none;
}

.reserve-btn::after{
  content:"";
  position:absolute; inset:0;
  background:
    linear-gradient(90deg, transparent 0 35%, rgba(0,0,0,.22) 35% 36%, transparent 36% 100%);
  mix-blend-mode: multiply;
  opacity: .9;
  pointer-events:none;
}

.reserve-btn:hover{
  transform: translateY(-1px);
  filter: saturate(1.10);
  box-shadow: 0 16px 36px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,255,255,.08);
}

.reserve-btn:active{ transform: translateY(0px) scale(.99); }

.reserve-btn:focus-visible{
  outline: 0;
  box-shadow:
    0 0 0 3px rgba(120,255,233,.16),
    0 16px 36px rgba(0,0,0,.62),
    inset 0 1px 0 rgba(255,255,255,.08);
}

.reserve-btn--secondary::after{
  opacity: .55;
}

.reserve-btn--primary{
  background: rgba(16,18,24,.52);
}

/* Texto arriba de los overlays */
.reserve-btn > span{
  position: relative;
  z-index: 1;
}
`;
// -------------------------------------------------------------
// PRODUCTOS A APARTAR
// -------------------------------------------------------------
export const PACKAGE_OPTIONS = [
  {
    id: 'taza-250',
    title: 'Taza artesanal',
    price: '$250 MXN',
    
    priceId: import.meta.env.VITE_PRICE_TAZA,
  },
  {
    id: 'novela-400',
    title: 'Novela Ensayo',
    price: '$400 MXN',
    
    priceId: import.meta.env.VITE_PRICE_NOVELA,
  },
  {
    id: 'combo-900',
    title: 'Novela + 2 tazas',
    price: '$900 MXN',
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
    title: 'Puntos de encuentro',
    intro:
      'Estos objetos no circulan solos. Cuando alguien se interesa, buscamos la manera de activar una conversación en tu ciudad.',
    notice: (
  <>
    También coordinamos envíos y encuentros virtuales cuando el diálogo lo requiere. <strong>Cada activación abre una conversación.</strong>
  </>
),
    footerNote: (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        
        <div className="flex flex-col gap-4 sm:gap-3 sm:grid sm:grid-cols-[96px_26px_1fr] sm:items-start">
          <div className="order-3 sm:order-1 sm:pt-1 sm:justify-self-start self-start">
            <div className="h-[64px] w-[64px] sm:h-[84px] sm:w-[84px] overflow-hidden rounded-full border border-white/25 shadow-[0_10px_26px_rgba(0,0,0,0.45)] ring-2 ring-purple-300/30">
              <img
                src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/autores/avatar_carlosph.jpg"
                alt="Carlos A. Pérez H."
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="order-1 sm:order-2 text-[4.25rem] sm:text-4xl text-purple-200/90 leading-[0.65] sm:justify-self-end sm:text-right self-start">“</div>
          <div className="order-2 sm:order-3">
            <p className="text-sm text-slate-100/90 leading-relaxed italic">
              A largo plazo, imaginamos un centro donde crear también sea investigar, y cuidar la salud mental sea una forma de arte compartido.
            </p>
            <div className="mt-4">
              <p className="text-base text-white font-semibold tracking-wide">Carlos A. Pérez H.</p>
              <p className="text-xs uppercase tracking-[0.25em] text-purple-200/80">Creador de #GatoEncerrado</p>
            </div>
          </div>
      
        </div>
      </div>
    ),
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
  const [showProposalForm, setShowProposalForm] = useState(false);

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
      setShowProposalForm(false);
      // Prefill email/fullName from Supabase session if available and fields empty
    
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

  const validateReserve = useCallback(() => {
    if (!formState.fullName.trim() || !formState.email.trim()) {
      return 'Por favor completa tu nombre y correo electrónico.';
    }
    if (!formState.notes.trim()) {
      return 'Por favor comparte tu intención o propuesta.';
    }
    if (formState.packages.length === 0) {
      return 'Selecciona al menos un objeto que te guste.';
    }
    return null;
  }, [formState]);

    const validateCheckout = useCallback(() => {
    if (formState.packages.length === 0) {
      return 'Selecciona al menos un objeto que te guste.';
    }

    const normalizedEmail = formState.email.trim().toLowerCase();
    const isValidEmail = /\S+@\S+\.\S+/.test(normalizedEmail);
    if (!isValidEmail) {
      return 'Para abrir la tienda necesitamos un correo electrónico válido.';
    }

    return null;
  }, [formState.email, formState.packages.length]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') return;

      const validationError = validateReserve();
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
    [formState, status, fireConfetti, validateReserve]
  );

  const handleCheckout = useCallback(
    async (event) => {
      event.preventDefault?.();
      if (isCheckoutLoading || status === 'loading') return;

      const validationError = validateCheckout();
      if (validationError) {
        setCheckoutError(validationError);
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
          metadata: {
            channel: 'landing',
            event: 'funcion-2025-12-28',
            packages: formState.packages.join(','),
          },
        };
        const normalizedEmail = formState.email.trim().toLowerCase();
payload.customer_email = normalizedEmail;
      
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
    [formState, isCheckoutLoading, status, validateCheckout]
  );

  const handleClose = useCallback(() => {
    if (status !== 'loading') onClose?.();
  }, [status, onClose]);

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  const copy = RESERVE_COPY[mode] ?? RESERVE_COPY.offseason;

  const modalTree = (
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
            <style>{RESERVE_BUTTON_STYLES}</style>
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

            {/* BANNER */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="mb-6 sm:mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <motion.img
                  src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/banner_cafegato.jpg"
                  alt="Banner Café Gato"
                  className="h-[140px] sm:h-[190px] w-full object-cover"
                  initial={{ scale: 1.03 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                 
                </div>
              </div>
            </motion.div>

            {copy.intro ? (
              <p className="mb-4 text-sm text-slate-300/90 leading-relaxed">{copy.intro}</p>
            ) : null}

            {copy.footerNote ? (
              <div className="mb-6">{copy.footerNote}</div>
            ) : null}

            {/* GRID */}
            <div className="grid md:grid-cols-[1.12fr_0.88fr] gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-5 order-2 md:order-1">
               <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400/80">
            Objetos disponibles
          </p>
          <h3 className="mt-2 text-lg text-slate-100 font-semibold">
            Elige lo que quieres activar
          </h3>
          <p className="mt-1 text-sm text-slate-300/80 leading-relaxed">
            Selecciona uno o varios. Enviar es para coordinar; “Comprar ahora” abre checkout si ya estás listx.
          </p>
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
        className={`group relative block rounded-2xl border ${
  isSelected
    ? 'border-purple-400/70 shadow-[0_12px_35px_rgba(126,34,206,0.35)]'
    : 'border-white/10'
} bg-gradient-to-br from-slate-900/80 to-black/60 p-4 hover:border-purple-400/40 transition hover:-translate-y-[1px] ${isCombo ? 'sm:col-span-2' : ''}`}
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
  className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition duration-300 ${
    isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
  }`}
>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.45)]">
            <Heart size={48} className="text-purple-500" />
          </div>
        </div>

        <div className={`relative z-0 mb-3 w-full ${imageHeightClass} rounded-xl overflow-hidden border border-white/5`}>
          <img
            src={imageMap[option.id]}
            alt={option.title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
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
            <form
  className="relative space-y-5 md:sticky md:top-6 self-start order-1 md:order-2"
  onSubmit={handleSubmit}
>
<div className="relative min-h-[520px]">
              {/* ───────── Mapa comunitario (UI mock) ───────── */}
<div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
  <div className="flex items-center justify-between gap-3">
    <h4 className="text-xs uppercase tracking-[0.35em] text-slate-300">
      Mapa comunitario
    </h4>
    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-200">
      <MapIcon size={12} />
      Beta
    </span>
  </div>

  <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(192,132,252,0.16),transparent_40%),linear-gradient(120deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]" />
    <div className="absolute inset-0 opacity-25 [background-size:22px_22px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.22)_1px,transparent_1px)]" />
    <span className="absolute left-[18%] top-[34%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
    <span className="absolute left-[57%] top-[48%] h-3 w-3 rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.75)]" />
    <span className="absolute left-[74%] top-[26%] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
    <p className="absolute bottom-2 left-3 text-[10px] uppercase tracking-[0.25em] text-slate-300/80">
      Próximamente: cafeterías sugeridas por la comunidad
    </p>
  </div>

  <div className="space-y-2 text-xs text-slate-300/90">
    <p className="uppercase tracking-[0.25em] text-slate-400">Sugerencias destacadas</p>
    <ul className="space-y-1.5">
      <li>• Tijuana Centro · Cafetería de la esquina</li>
      <li>• Zona Río · Punto de lectura nocturna</li>
      <li>• Playas · Charla con taza y libreta</li>
    </ul>
  </div>

  <button
    type="button"
    onClick={() => setShowProposalForm(true)}
    className="mt-1 text-xs uppercase tracking-[0.3em] text-purple-300 hover:text-purple-200 self-start"
  >
    📍Sugerir cafetería
  </button>
</div>

{!showProposalForm ? (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300/90">
    <p className="leading-relaxed">
      Si quieres proponer un punto de encuentro o colaboración, toca <strong>“Sugerir cafetería”</strong>.
      Si ya estás listx, puedes ir directo a <strong>“Comprar ahora”</strong>.
    </p>
  </div>
) : null}


{showProposalForm ? (
  <div className="absolute inset-0 z-20">
    {/* scrim suave */}
    <div
      className="absolute inset-0 rounded-2xl bg-slate-950/70 backdrop-blur-sm border border-white/10"
      aria-hidden="true"
    />

    {/* panel scrolleable dentro de la columna */}
    <div className="relative h-full rounded-2xl p-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400/90">
            Propuesta
          </p>
          <h4 className="text-base font-semibold text-slate-100">
            Sugerir cafetería
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setShowProposalForm(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition"
          aria-label="Cerrar formulario"
        >
          ✕
        </button>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Tu nombre</label>
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
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium text-slate-200">Correo electrónico</label>
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
      <div className="space-y-2 mt-4">
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
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium text-slate-200">Intención o propuesta</label>
        <textarea
          name="notes"
          rows={3}
          required
          value={formState.notes}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
          placeholder="¿Te interesa un punto de venta, una presentación, un conversatorio o una colaboración?"
        />
      </div>
    </div>
  </div>
) : null}
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
  {showProposalForm ? (
    <Button
      type="submit"
      disabled={status === 'loading'}
      className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
    >
      {isSubmitting ? 'Enviando…' : 'Enviar'}
    </Button>
  ) : null}

  <button
  type="button"
  onClick={handleCheckout}
  disabled={isCheckoutLoading}
  className="reserve-btn reserve-btn--primary mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
>
  <span>
    {isCheckoutLoading ? 'Abriendo tienda…' : 'Comprar ahora'}
  </span>
</button>
</div>
              </form>
            </div>

            {copy.notice ? (
              <div className="mt-8 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs text-yellow-200">
                {copy.notice}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalTree;
  }

  return createPortal(modalTree, document.body);
};

export default ReserveModal;
