// ------------------------------------
// RESERVE MODAL (versión corregida)
// ------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const LOGO_SRC = '/assets/logoapp.png';

const INTEREST_OPTIONS = [
  {
    value: 'recordatorio',
    label: 'Recordatorio de la función',
    description: 'Recibe el aviso oficial justo antes de que abra la función en diciembre.',
  },
  {
    value: 'reservaciones',
    label: 'Información sobre reservaciones',
    description: 'Accede a la línea de reservaciones y consulta los paquetes que aún quedan.',
  },
];

const CALENDAR_LINK =
  'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Gato%20Encerrado%20%C2%B7%2028%20de%20diciembre&dates=20241228T210000Z/20241228T223000Z&details=Funci%C3%B3n%20especial%20en%20CEC&location=CECUT';
const SMS_NUMBER = import.meta.env.VITE_SMS_NUMBER || '+5215550112233';
const SMS_MESSAGE = encodeURIComponent(
  'Recordarme la función #GatoEncerrado el 28 de diciembre en CECUT.'
);
const RECORDATORIO_ACTIONS = [
  {
    id: 'calendar',
    label: 'Añadir a mi calendario',
    description: 'Calendario de Google prellenado con lugar y horario.',
    href: CALENDAR_LINK,
  },
  {
    id: 'sms',
    label: 'Enviar notificación vía SMS',
    description: 'Recibe una alerta en tu celular el día del evento.',
    href: `sms:${SMS_NUMBER}?body=${SMS_MESSAGE}`,
  },
];

const PACKAGE_OPTIONS = [
  {
    id: 'taza-250',
    title: 'Taza',
    price: '$250',
    helper: 'Edición especial disponible el día del evento.',
  },
  {
    id: 'taza-causa-600',
    title: 'Taza con causa',
    price: '$600',
    helper: 'Incluye membresía de 6 meses. Se entrega el 28 de diciembre.',
  },
  {
    id: 'novela-400',
    title: 'Novela “Mi Gato Encerrado”',
    price: '$400',
    helper: 'Primera edición con QR secreto.',
  },
  {
    id: 'combo-900',
    title: 'Combo novela + taza con causa',
    price: '$900',
    helper: 'Paquete completo disponible solo el día del evento.',
  },
];

const PACKAGE_LABEL_MAP = PACKAGE_OPTIONS.reduce((acc, option) => {
  acc[option.id] = `${option.title} — ${option.price}`;
  return acc;
}, {});

const initialFormState = {
  fullName: '',
  email: '',
  city: '',
  interest: INTEREST_OPTIONS[0].value,
  notes: '',
  packages: [],
};

// Animation variants
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
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

// -------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------

const ReserveModal = ({ open, onClose, initialInterest = INTEREST_OPTIONS[0].value }) => {
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setFormState({ ...initialFormState, interest: initialInterest });
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open, initialInterest]);

  // Allow ESC close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Form changes
  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTogglePackage = useCallback((packageId) => {
    setFormState((prev) => {
      const exists = prev.packages.includes(packageId);
      return {
        ...prev,
        packages: exists
          ? prev.packages.filter((item) => item !== packageId)
          : [...prev.packages, packageId],
      };
    });
  }, []);

  const selectedInterest = useMemo(
    () => INTEREST_OPTIONS.find((item) => item.value === formState.interest) ?? INTEREST_OPTIONS[0],
    [formState.interest]
  );

  // Submission handler
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') return;

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo electrónico.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const packageSummary =
          formState.packages.length > 0
            ? `Paquetes apartados (sin pago): ${formState.packages
                .map((pkg) => PACKAGE_LABEL_MAP[pkg])
                .join(', ')}`
            : null;

        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: formState.city.trim() || null,
          interest: formState.interest,
          channel: 'landing',
          object_type: 'boleto',
          event: 'funcion-2024-12-28',
          notes: [packageSummary, formState.notes.trim()].filter(Boolean).join(' | ') || null,
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          setStatus('error');
          setErrorMessage('No pudimos registrar tu solicitud. Intenta nuevamente.');
          return;
        }

        await sendReserveConfirmationEmail({
          email: payload.email,
          name: payload.full_name,
          interestLabel: selectedInterest.label,
          interestValue: payload.interest,
          city: payload.city,
          notes: payload.notes,
        });

        setStatus('success');
        toast({ description: '¡Gracias! Te enviaremos las próximas novedades.' });
      } catch (err) {
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [formState, selectedInterest.label, status]
  );

  const handleClose = useCallback(() => {
    if (status !== 'loading') onClose?.();
  }, [onClose, status]);

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------

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
            className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
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
                    Regístrate para recibir acceso y novedades del Gato Encerrado
                  </h2>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="self-end text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* CONTENT GRID */}
            <div className="grid md:grid-cols-2 gap-8">

              {/* LEFT COLUMN */}
              <div className="space-y-5 text-sm text-slate-300/90 leading-relaxed">
                <div className="glass-effect rounded-xl border border-white/5 p-4 space-y-3">
                  <h3 className="font-display text-lg text-slate-100">
                    Compra presencial en taquilla del CECUT
                  </h3>
                  <ul className="space-y-2 text-slate-300/80">
                    <li>• Taquilla del CECUT · Preventa disponible hasta agotar localidades.</li>
                    <li>• Solo 45 tazas disponibles como incentivo de preventa.</li>
                    <li>• Las tazas se entregan exclusivamente en taquilla, hasta agotar existencias.</li>
                    <li>• El día del evento habrá mesa de merch con tazas extra y la novela impresa.</li>
                  </ul>
                </div>

                <div className="glass-effect rounded-xl border border-purple-400/20 p-4 space-y-3">
                  <h3 className="font-display text-lg text-purple-200">¿Qué te gustaría apartar?</h3>
                  <p className="text-xs text-slate-400/80">
                    Si deseas pagarlo por adelantado, déjalo marcado y te enviaremos un enlace seguro para completar tu compra.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-200">
                    {PACKAGE_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={formState.packages.includes(option.id)}
                          onChange={() => handleTogglePackage(option.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-400 bg-black/40 text-purple-500 focus:ring-purple-400"
                        />
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-100">
                            {option.title} <span className="text-slate-400 font-normal">· {option.price}</span>
                          </p>
                          <p className="text-xs text-slate-400">{option.helper}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — FORM */}
              <form className="space-y-5" onSubmit={handleSubmit}>

                {/* nombre */}
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

                {/* email */}
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

                {/* ciudad */}
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

                {/* INTEREST DROPDOWN */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">¿Qué quieres recibir?</label>
                  <select
                    name="interest"
                    value={formState.interest}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  >
                    {INTEREST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400/80">{selectedInterest.description}</p>
                </div>

                <div className="glass-effect rounded-2xl border border-white/5 bg-black/25 p-4 space-y-3">
                  <h3 className="font-display text-lg text-slate-100">Acción preferida</h3>
                  {formState.interest === 'recordatorio' ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {RECORDATORIO_ACTIONS.map((action) => (
                        <a
                          key={action.id}
                          href={action.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-slate-100 hover:border-purple-400/80 hover:bg-slate-900/70 transition"
                        >
                          <span className="text-sm font-semibold">{action.label}</span>
                          <span className="text-xs text-slate-400/80">{action.description}</span>
                        </a>
                      ))}
                    </div>
                      ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300/80">
                        Recibirás en tu correo (y en el CTA de confirmación) la línea de reservaciones para concretar el paquete que quieras.
                        Nos encargamos de enviarte la liga segura sin saturar este formulario.
                      </p>
                    </div>
                  )}
                </div>

                {/* NOTES */}
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

                {/* ERRORS / SUCCESS */}
                {status === 'error' && (
                  <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {status === 'success' && (
                  <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Tu registro quedó guardado. Revisaremos tu correo con los siguientes pasos.
                  </div>
                )}

                {/* BUTTONS */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                  >
                    {status === 'loading' ? 'Enviando…' : 'Guardar mi registro'}
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

async function sendReserveConfirmationEmail({ email, name, interestLabel, interestValue, city, notes }) {
  if (!email) return;

  try {
    const { error } = await supabase.functions.invoke('send-reserve-confirmation', {
      body: { email, name, interestLabel, interestValue, city, notes },
    });

    if (error) console.error('[ReserveModal] Error en sendReserveConfirmationEmail:', error);
  } catch (err) {
    console.error('[ReserveModal] Excepción en sendReserveConfirmationEmail:', err);
  }
}
