import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  Drama,
  BookOpen,
  Smartphone,
  CupSoda,
  Film,
  BookMarked,
  Video,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginAccordion from '@/components/ContributionModal/LoginAccordion';

const CATEGORIES = [
  {
    id: 'obra_escenica',
    icon: <Drama size={20} className="text-purple-300" />,
    title: 'Miniverso Escénico',
    description: 'La función que detonó este universo literario. Voces, cuerpos y gatos en escena.',
  },
    {
    id: 'miniverso_novela',
    icon: <BookOpen size={20} className="text-emerald-300" />,
    title: 'Miniverso Novela',
    description: 'Desde la autoficción de *Mi Gato Encerrado* hasta las viñetas de *Tres pies al gato*.',
  },
  {
    id: 'taza',
    icon: <CupSoda size={20} className="text-amber-300" />,
    title: 'Miniverso Taza',
    description: 'Objeto ritual y marcador AR. Una excusa para seguir la historia desde lo cotidiano.',
  },
  {
    id: 'cine',
    icon: <Film size={20} className="text-rose-300" />,
    title: 'Miniverso Cine',
    description: '“Quirón” y otros filmes que piensan el cuerpo del Gato en clave cinematográfica.',
  },
  {
    id: 'apps',
    icon: <Smartphone size={20} className="text-lime-300" />,
    title: 'Miniverso Apps',
    description: 'Experiencias digitales que te convierten en cómplice y guardián del universo.',
  },
  {
    id: 'bitacora',
    icon: <Video size={20} className="text-indigo-300" />,
    title: 'Miniverso Bitácora',
    description: 'Crónicas, expansiones narrativas y debate vivo sobre el universo GatoEncerrado.',
  },
  {
    id: 'otro',
    icon: <Sparkles size={20} className="text-fuchsia-300" />,
    title: 'Otra contribución',
    description: 'Performance, glitch sonoro o investigación híbrida. También cabe aquí.',
  },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const initialFormState = {
  name: '',
  email: '',
  role: '',
  proposal: '',
  attachmentUrl: '',
};

const ContributionModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.email);
  const preferredName = useMemo(
    () => user?.user_metadata?.alias || user?.user_metadata?.full_name || '',
    [user]
  );

  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [notifyOnPublish, setNotifyOnPublish] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState({
      ...initialFormState,
      name: preferredName || '',
      email: user?.email ?? '',
    });
    setNotifyOnPublish(false);
    setStatus('idle');
    setErrorMessage('');
    setSelectedCategory(CATEGORIES[0]);
  }, [open, preferredName, user?.email]);

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

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') {
        return;
      }

      if (!formState.name.trim() || !formState.email.trim() || !formState.proposal.trim()) {
        toast({ description: 'Completa tu nombre, correo y una breve propuesta.' });
        return;
      }

      if (notifyOnPublish && !isAuthenticated) {
        toast({ description: 'Inicia sesión para recibir la notificación personalizada.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          name: formState.name.trim(),
          email: formState.email.trim().toLowerCase(),
          role: formState.role.trim() || null,
          topic: selectedCategory.id,
          proposal: formState.proposal.trim(),
          attachment_url: formState.attachmentUrl.trim() || null,
          notify_on_publish: notifyOnPublish,
        };

        const { error } = await supabase.from('blog_contributions').insert(payload);

        if (error) {
          console.error('[ContributionModal] Error al registrar propuesta:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('blog_contributions')
              ? 'Asegúrate de crear la tabla blog_contributions en Supabase.'
              : 'No pudimos registrar tu propuesta. Intenta nuevamente.'
          );
          return;
        }

        if (formState.email.trim()) {
          await sendConfirmationEmail({
            email: formState.email.trim().toLowerCase(),
            name: formState.name.trim(),
            proposal: formState.proposal.trim(),
          });
        }

        setStatus('success');
        toast({ description: '¡Gracias! Revisaremos tu propuesta y te contactaremos pronto.' });
      } catch (err) {
        console.error('[ContributionModal] Excepción al guardar:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [formState, status, selectedCategory, notifyOnPublish, isAuthenticated]
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
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:py-12 overflow-y-auto"
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
            aria-labelledby="contribution-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950/95 p-4 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="grid gap-6 md:grid-cols-[1.05fr_1fr]">
              <div className="flex flex-col gap-4 overflow-y-auto pr-1 max-h-[70vh] order-2 md:order-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="contribution-modal-title" className="font-display text-3xl text-slate-50 mb-1">
                      Contribuye al diálogo crítico
                    </h2>
                    <p className="text-sm text-slate-400/80">
                      Estás escribiendo sobre{' '}
                      <span className="text-purple-200 font-semibold">{selectedCategory.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-slate-400 hover:text-white transition text-xl leading-none"
                    aria-label="Cerrar formulario de propuestas"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="¿Cómo quieres que te nombremos?"
                  />

                  <input
                    name="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="nombre@correo.com"
                  />

                  <input
                    name="role"
                    type="text"
                    value={formState.role}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="Crítica teatral, artista, investigador, espectador..."
                  />

                  <textarea
                    name="proposal"
                    rows={5}
                    required
                    value={formState.proposal}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
                    placeholder="Resume tu texto, crónica o propuesta curatorial..."
                  />

                  <input
                    name="attachmentUrl"
                    type="url"
                    value={formState.attachmentUrl}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="Enlace a material adicional (Drive, portfolio, video...)"
                  />

                  <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        id="notify-on-publish"
                        type="checkbox"
                        checked={notifyOnPublish}
                        onChange={(event) => setNotifyOnPublish(event.target.checked)}
                        disabled={!isAuthenticated}
                        className={`mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-purple-500 focus:ring-purple-400 ${
                          !isAuthenticated ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                      <label
                        htmlFor="notify-on-publish"
                        className="text-sm text-slate-300/80 leading-relaxed"
                      >
                        Quiero recibir notificación cuando se publique mi propuesta
                        {!isAuthenticated ? (
                          <span className="block text-xs text-slate-500">
                            Inicia sesión para activar esta opción.
                          </span>
                        ) : null}
                      </label>
                    </div>

                    {!isAuthenticated ? <LoginAccordion /> : null}
                  </div>

                  {status === 'error' ? (
                    <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {errorMessage}
                    </div>
                  ) : null}

                  {status === 'success' ? (
                    <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      Recibimos tu propuesta. Te contactaremos si necesitamos más detalles.
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                  >
                    {status === 'loading' ? 'Enviando…' : 'Enviar propuesta'}
                  </Button>
                </form>
              </div>

              <div className="flex flex-col border-white/10 md:border-r md:pr-5 overflow-y-auto max-h-[70vh] pr-1 order-1 md:order-2">
                <div className="mb-5">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">Blog / Diálogo vivo</p>
                  <h3 className="font-display text-2xl text-slate-50 mb-2">Explora el universo #GatoEncerrado</h3>
                  <p className="text-sm text-slate-400/80">
                    Elige la pieza del ecosistema sobre la que quieres escribir. Tu mirada nos ayuda a trazar esta
                    constelación crítica.
                  </p>
                </div>

                <div className="space-y-3 pr-2">
                  {CATEGORIES.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selectedCategory.id === category.id
                          ? 'bg-purple-500/15 border-purple-300/40'
                          : 'bg-black/20 border-white/10 hover:border-purple-300/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {category.icon}
                        <h4 className="text-slate-100 font-medium">{category.title}</h4>
                      </div>
                      <p className="text-sm text-slate-400/80 leading-relaxed">{category.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export async function sendConfirmationEmail({ email, name, proposal }) {
  if (!email) {
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-proposal-confirmation', {
      body: { email, name, proposal },
    });

    if (error) {
      console.error('[ContributionModal] Error en sendConfirmationEmail:', error);
    }
  } catch (err) {
    console.error('[ContributionModal] Excepción en sendConfirmationEmail:', err);
  }
}

export default ContributionModal;
