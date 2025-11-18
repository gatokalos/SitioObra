import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const TABS = [
  { id: 'waitlist', label: 'Próximamente' },
  { id: 'experiences', label: 'Miniversos activos' },
];

const MINIVERSE_CARDS = [
  {
    title: 'Microficciones sonoras',
    description: 'Voces internas de Silvestre publicadas en notas de voz efímeras.',
    action: 'Pronto recibirás el enlace secreto.',
  },
  {
    title: 'Bitácora interactiva',
    description: 'Un recorrido visual por los objetos que habitan la habitación de Silvestre.',
    action: 'Se liberará con la novela impresa.',
  },
  {
    title: 'Constelación de espectadores',
    description: 'Mapa colaborativo donde la comunidad comparte sueños y teorías.',
    action: 'Disponible a partir de enero 2025.',
  },
];

const initialFormState = {
  fullName: '',
  email: '',
  interest: 'miniversos',
  message: '',
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const MiniverseModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      setActiveTab(TABS[0].id);
      setFormState(initialFormState);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open]);

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
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const activeTabLabel = useMemo(() => TABS.find((tab) => tab.id === activeTab)?.label ?? TABS[0].label, [activeTab]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') {
        return;
      }

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: null,
          interest: 'miniversos',
          channel: 'landing',
          object_type: 'experiencia-digital',
          event: 'miniversos',
          notes: formState.message.trim() || null,
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          console.error('[MiniverseModal] Error al registrar miniverso:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('rsvp_extended')
              ? 'Crea la tabla rsvp_extended en Supabase para habilitar este formulario.'
              : 'No pudimos registrar tu interés. Intenta de nuevo.'
          );
          return;
        }

        setStatus('success');
        toast({
          description: 'Gracias. Te enviaremos una señal cuando el próximo miniverso cobre vida.',
        });
      } catch (err) {
        console.error('[MiniverseModal] Excepción al guardar:', err);
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
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 py-6 sm:px-4 sm:py-10 overflow-y-auto"
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
            aria-labelledby="miniverse-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-5 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
                  Universos expandidos #GatoEncerrado
                </p>
                <h2 id="miniverse-modal-title" className="font-display text-3xl text-slate-50">
                  Explora los miniversos
                </h2>
                <p className="text-sm text-slate-400/80">
                  Lo que empieza en el escenario continúa en otros formatos. Aquí reunimos las experiencias emergentes.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="self-end text-slate-400 hover:text-white transition"
                aria-label="Cerrar explorador de miniversos"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    activeTab === tab.id
                      ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                      : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {activeTab === 'waitlist' ? (
                <>
                  <div className="space-y-4 text-slate-300/90 text-sm leading-relaxed">
                    <div className="glass-effect rounded-xl border border-white/5 p-4">
                      <h3 className="font-display text-lg text-slate-100 mb-3">¿Qué necesitas saber?</h3>
                      <ul className="space-y-2 text-slate-300/80">
                        <li>• Las activaciones WebAR de la taza se liberarán primero para esta lista.</li>
                        <li>• Algunas experiencias requieren tokens únicos impresos en la novela.</li>
                        <li>• Los miniversos tienen ventanas de tiempo limitadas para preservar la intimidad.</li>
                      </ul>
                    </div>
                    <div className="glass-effect rounded-xl border border-purple-400/20 p-4">
                      <h3 className="font-display text-lg text-purple-200 mb-3">¿Qué recibirás?</h3>
                      <p>
                        Invitaciones privadas, códigos de acceso, experimentos digitales y acceso anticipado a los
                        contenidos de la Comunidad #GatoEncerrado.
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
                        placeholder="Tu nombre"
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
                      <label className="text-sm font-medium text-slate-200">Mensaje opcional</label>
                      <textarea
                        name="message"
                        rows={3}
                        value={formState.message}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                        placeholder="Comparte qué miniverso te emociona más o si traes alguna propuesta."
                      />
                    </div>

                    {status === 'error' ? (
                      <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                      </div>
                    ) : null}
                    {status === 'success' ? (
                      <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Quedas en lista para las próximas experiencias. Llegará un correo con la primera pista.
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                    >
                      {status === 'loading' ? 'Guardando…' : 'Quiero recibir las activaciones'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="md:col-span-2 grid md:grid-cols-3 gap-6">
                  {MINIVERSE_CARDS.map((card) => (
                    <div key={card.title} className="glass-effect rounded-2xl border border-white/10 p-6">
                      <h3 className="font-display text-xl text-slate-100 mb-3">{card.title}</h3>
                      <p className="text-sm text-slate-300/80 leading-relaxed mb-4">{card.description}</p>
                      <span className="text-xs uppercase tracking-[0.25em] text-purple-200/80">
                        {card.action}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
              <span>{activeTabLabel}</span>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MiniverseModal;
