import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

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
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
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

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          name: formState.name.trim(),
          email: formState.email.trim().toLowerCase(),
          role: formState.role.trim() || null,
          proposal: formState.proposal.trim(),
          attachment_url: formState.attachmentUrl.trim() || null,
        };

        const { error } = await supabase.from('blog_contributions').insert(payload);

        if (error) {
          console.error('[ContributionModal] Error al registrar propuesta:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('blog_contributions')
              ? 'Crea la tabla blog_contributions en Supabase para habilitar este formulario.'
              : 'No pudimos registrar tu propuesta. Intenta nuevamente.'
          );
          return;
        }

        setStatus('success');
        toast({
          description: '¡Gracias! Revisaremos tu propuesta y te contactaremos pronto.',
        });
      } catch (err) {
        console.error('[ContributionModal] Excepción al guardar:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta de nuevo más tarde.');
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
            aria-labelledby="contribution-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 sm:p-10 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
                  Blog / Diálogo vivo
                </p>
                <h2 id="contribution-modal-title" className="font-display text-3xl text-slate-50">
                  Envía tu propuesta curatorial o artística
                </h2>
                <p className="text-sm text-slate-400/80">
                  Queremos documentar y expandir las resonancias de #GatoEncerrado. Comparte tu idea y la sumaremos a la
                  mesa editorial.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="self-end text-slate-400 hover:text-white transition"
                aria-label="Cerrar formulario de propuestas"
              >
                ✕
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Nombre completo *</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="¿Cómo quieres que te nombremos?"
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
                <label className="text-sm font-medium text-slate-200">Rol o contexto</label>
                <input
                  name="role"
                  type="text"
                  value={formState.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="Crítica teatral, artista, investigador, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Propuesta *</label>
                <textarea
                  name="proposal"
                  rows={5}
                  required
                  value={formState.proposal}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                  placeholder="Resume tu texto o idea curatorial. Puedes añadir enlaces de referencia."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Enlace a material adicional</label>
                <input
                  name="attachmentUrl"
                  type="url"
                  value={formState.attachmentUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="Drive, portfolio, video, etc."
                />
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

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                >
                  {status === 'loading' ? 'Enviando…' : 'Enviar propuesta'}
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ContributionModal;
