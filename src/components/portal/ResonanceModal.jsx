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

          {/* Contenido: flex column — pregunta arriba (desktop), form abajo */}
          <div className="relative z-10 h-full overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col">

            {/* Zona superior: espaciador móvil / pregunta amber en desktop */}
            <div className="lg:flex-1 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-6">
              <div aria-hidden="true" className="h-32 sm:h-40 lg:hidden" />
              {question ? (
                <p className="hidden lg:block font-display text-center leading-snug text-amber-300/90 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]"
                  style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.4rem)' }}>
                  {question}
                </p>
              ) : null}
            </div>

            {/* Separador decorativo (solo desktop) */}
            <div aria-hidden="true" className="hidden lg:block mx-8 mb-4 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />

            {/* Zona inferior: formulario */}
            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 lg:pb-6 lg:px-8">
              {status === 'success' ? (
                <div className="flex flex-col gap-3 py-8 text-center">
                  <p className="text-slate-200 text-base">Tu resonancia quedó registrada.</p>
                  <p className="text-slate-400/70 text-sm">Gracias por compartir tu intuición.</p>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="space-y-0.5">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                      Laboratorio
                    </div>
                    <h3
                      id="resonance-modal-title"
                      className="font-display leading-tight tracking-tight text-white"
                      style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)' }}
                    >
                      Resonancia colectiva
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-200">Tu nombre</label>
                      <input
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="form-surface w-full px-3 py-2 text-sm"
                        placeholder="¿Cómo te llamas?"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-200">Correo electrónico</label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-surface w-full px-3 py-2 text-sm"
                        placeholder="nombre@correo.com"
                      />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-xs font-medium text-slate-200">Tu intuición</label>
                      <textarea
                        name="respuesta"
                        value={formData.respuesta}
                        onChange={handleChange}
                        required
                        rows={2}
                        className="form-surface w-full resize-none px-3 py-2 text-sm"
                        placeholder={question ?? '¿Qué te resuena?'}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full rounded-full border border-purple-500/70 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20 disabled:opacity-50 lg:col-span-2"
                    >
                      {status === 'submitting' ? 'Enviando…' : 'Enviar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResonanceModal;
