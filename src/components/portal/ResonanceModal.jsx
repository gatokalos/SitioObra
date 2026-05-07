import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const TIGER_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/loggin_tiger.jpg';

const ResonanceModal = ({ open, onClose, question, portal }) => {
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', respuesta: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!open) return;
    modalRef.current?.parentElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [open]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await supabase.from('vitrana_resonances').insert({
        anon_id: ensureAnonId(),
        portal: portal ?? null,
        question: question ?? null,
        nombre: formData.nombre,
        email: formData.email,
        respuesta: formData.respuesta,
      });
    } catch (_) {}
    setStatus('success');
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', respuesta: '' });
    setStatus('idle');
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="resonance-modal-title"
          className="absolute inset-0 z-50 rounded-[2.5rem] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Imagen de fondo */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(7,4,13,0.18) 0%, rgba(9,5,16,0.84) 42%, rgba(7,4,11,0.96) 100%), url(${TIGER_URL})`,
              backgroundPosition: 'center top',
              backgroundSize: 'cover',
            }}
          />
          {/* Gradientes de color */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% -10%, rgba(255,255,255,0.08), transparent 34%), radial-gradient(circle at 10% 72%, rgba(255,120,40,0.34), transparent 28%), radial-gradient(circle at 85% 62%, rgba(255,135,48,0.26), transparent 24%), linear-gradient(180deg, rgba(20,8,36,0.18) 0%, rgba(16,7,25,0.7) 48%, rgba(8,5,14,0.92) 100%)',
            }}
          />

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-base text-slate-300 backdrop-blur-md transition hover:border-white/35 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Contenido */}
          <div className="relative z-10 h-full overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-6 lg:flex lg:items-end lg:pt-5">
            <div aria-hidden="true" className="h-32 sm:h-36 lg:h-4" />

            {status === 'success' ? (
              <div className="flex flex-col gap-3 py-8 text-center">
                <p className="text-slate-200 text-base">Tu resonancia quedó registrada.</p>
                <p className="text-slate-400/70 text-sm">Gracias por compartir tu intuición.</p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                    Emociones
                  </div>
                  <h3
                    id="resonance-modal-title"
                    className="font-display text-[clamp(1.75rem,7vw,2.5rem)] leading-tight tracking-tight text-white lg:text-3xl"
                  >
                    Resonancia colectiva
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-200">Tu nombre</label>
                    <input
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="form-surface w-full px-4 py-3 lg:py-2.5"
                      placeholder="¿Cómo te llamas?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-200">Correo electrónico</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-surface w-full px-4 py-3 lg:py-2.5"
                      placeholder="nombre@correo.com"
                    />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-sm font-medium text-slate-200">Tu intuición</label>
                    <textarea
                      name="respuesta"
                      value={formData.respuesta}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="form-surface w-full resize-none px-4 py-3 lg:py-2.5"
                      placeholder={question ?? '¿Qué te resuena?'}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full rounded-full border border-purple-500/70 px-4 py-3 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50 lg:col-span-2"
                  >
                    {status === 'submitting' ? 'Enviando…' : 'Enviar'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResonanceModal;
