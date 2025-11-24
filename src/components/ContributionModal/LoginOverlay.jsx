import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const overlayBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const overlayCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const LoginOverlay = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [pendingMagic, setPendingMagic] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleMagicLink = useCallback(
    async (event) => {
      event.preventDefault();
      if (pendingMagic) {
        return;
      }

      const normalized = email.trim();
      if (!normalized) {
        setFeedback({
          type: 'error',
          text: 'Ingresa tu correo para enviarte el enlace mágico.',
        });
        return;
      }

      setPendingMagic(true);
      setFeedback(null);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('gatoencerrado:resume-contribution', 'true');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
        },
      });

      if (error) {
        setFeedback({ type: 'error', text: error.message || 'No pudimos enviar el enlace.' });
      } else {
        setFeedback({
          type: 'success',
          text: 'Te enviamos un link mágico. Revisa tu correo para continuar.',
        });
        setEmail('');
      }

      setPendingMagic(false);
    },
    [email, pendingMagic]
  );

  const handleGoogleLogin = useCallback(async () => {
    setFeedback(null);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gatoencerrado:resume-contribution', 'true');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'No pudimos iniciar sesión con Google.' });
      return;
    }

    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayBackdropVariants}
    >
      <motion.button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar overlay de autenticación"
        variants={overlayBackdropVariants}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-overlay-title"
        aria-describedby="tracking-overlay-desc"
        className="relative z-10 w-full max-w-md transform rounded-3xl border border-white/10 bg-[#0a0019]/90 p-6 shadow-2xl backdrop-blur-xl"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayCardVariants}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full border border-white/15 px-2 py-1 text-sm text-slate-400 hover:text-slate-100"
          aria-label="Cerrar overlay"
        >
          ✕
        </button>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500/80">Seguimiento</p>
            <h3 id="tracking-overlay-title" className="font-display text-2xl text-slate-50">
              Inicia sesión para continuar el diálogo
            </h3>
          </div>
          <p
            id="tracking-overlay-desc"
            className="text-sm text-slate-300 leading-relaxed"
          >
            Queremos asegurarnos de que puedas retomar tu experiencia justo donde la dejaste.
            

          Esto no genera ningún cargo ni suscripción.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
          >
            Iniciar sesión con Google
          </button>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <label htmlFor="tracking-email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="tracking-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@correo.com"
              className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
              required
            />
            <button
              type="submit"
              disabled={pendingMagic}
              className="w-full rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingMagic ? 'Enviando...' : 'Enviar Magic Link'}
            </button>
          </form>

          {feedback ? (
            <p
              className={`text-xs ${
                feedback.type === 'error' ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {feedback.text}
            </p>
          ) : null}

          <p className="text-xs text-slate-500">
            Tu experienica no se perderá. Continuarás donde te quedaste.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginOverlay;
