import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const INTEREST_OPTIONS = [
  {
    value: 'preventa',
    label: 'Preventa de boletos en CECUT',
    description: 'Recibe recordatorios y códigos cuando abra la preventa física.',
  },
  {
    value: 'activaciones-transmedia',
    label: 'Alertas de activaciones transmedia',
    description: 'Acceso prioritario a dinámicas con objetos / QR / WebAR.',
  },
  {
    value: 'conversatorios',
    label: 'Conversatorios Sala Carlos Monsiváis',
    description: 'Inscríbete a charlas y laboratorios en torno a la obra.',
  },
  {
    value: 'contenido-exclusivo',
    label: 'Contenido exclusivo y curaduría expandida',
    description: 'Textos curatoriales, finales alternativos y miniversos digitales.',
  },
];

const initialFormState = {
  fullName: '',
  email: '',
  city: '',
  interest: INTEREST_OPTIONS[0].value,
  notes: '',
};

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

const ReserveModal = ({ open, onClose, initialInterest = INTEREST_OPTIONS[0].value }) => {
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      setFormState((prev) => ({
        ...initialFormState,
        interest: initialInterest || prev.interest,
      }));
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open, initialInterest]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const selectedInterest = useMemo(
    () => INTEREST_OPTIONS.find((item) => item.value === formState.interest) ?? INTEREST_OPTIONS[0],
    [formState.interest]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (status === 'loading') {
        return;
      }

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo electrónico.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: formState.city.trim() || null,
          interest: formState.interest,
          channel: 'landing',
          object_type: 'boleto',
          event: 'funcion-2024-12-28',
          notes: formState.notes.trim() || null,
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          console.error('[ReserveModal] Error al registrar interés:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('rsvp_extended')
              ? 'Aún no existe la tabla rsvp_extended en Supabase. Guarda este lead manualmente y crea la tabla para activar el formulario.'
              : 'No pudimos registrar tu solicitud. Intenta nuevamente en unos minutos.'
          );
          return;
        }

        setStatus('success');
        toast({
          description:
            '¡Gracias! Te enviaremos las actualizaciones sobre preventa y activaciones transmedia.',
        });
      } catch (err) {
        console.error('[ReserveModal] Excepción al guardar el formulario:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [formState, status]
  );

  const handleClose = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    onClose?.();
  }, [onClose, status]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 sm:p-10 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
                  28 de diciembre · CECUT
                </p>
                <h2 id="reserve-modal-title" className="font-display text-3xl text-slate-50">
                  Reserva tu boleto y entra al universo transmedia
                </h2>
              </div>

              <button
                onClick={handleClose}
                className="self-end text-slate-400 hover:text-white transition"
                aria-label="Cerrar formulario de reserva"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-5 text-sm text-slate-300/90 leading-relaxed">
                <div className="glass-effect rounded-xl border border-white/5 p-4">
                  <h3 className="font-display text-lg text-slate-100 mb-3">Compra presencial</h3>
                  <ul className="space-y-2 text-slate-300/80">
                    <li>• Taquilla del CECUT · Preventa disponible hasta agotar localidades.</li>
                    <li>• Con tu boleto recibes una taza artesanal (limitado a 150 piezas).</li>
                    <li>• Durante la función habrá mesa con 50 tazas extra y la novela impresa.</li>
                  </ul>
                </div>

                <div className="glass-effect rounded-xl border border-purple-400/20 p-4">
                  <h3 className="font-display text-lg text-purple-200 mb-3">Acceso transmedia</h3>
                  <p>
                    Cada objeto desbloquea experiencias digitales: desde WebAR de la taza hasta
                    capítulos extendidos de la novela. Déjanos tus datos para enviarte códigos y
                    claves de activación.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Nombre completo *</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="¿Cómo te llamas?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Correo electrónico *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="nombre@correo.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Ciudad</label>
                  <input
                    name="city"
                    type="text"
                    value={formState.city}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="¿Desde dónde nos visitas?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">¿Qué quieres recibir?</label>
                  <select
                    name="interest"
                    value={formState.interest}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    {INTEREST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400/80">{selectedInterest.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Mensaje opcional</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formState.notes}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                    placeholder="¿Necesitas facilidades especiales o tienes un código de preventa?"
                  />
                </div>

                {status === 'error' ? (
                  <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                {status === 'success' ? (
                  <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Tu registro quedó guardado. Revisaremos tu correo con los siguientes pasos.
                  </div>
                ) : null}

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
      ) : null}
    </AnimatePresence>
  );
};

export default ReserveModal;
