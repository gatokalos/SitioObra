import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeStorageType } from '@/lib/safeStorage';

const overlayBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const overlayCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const GoogleIcon = ({ className }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 48 48"
    className={className}
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.69 1.22 9.18 3.62l6.82-6.82C35.87 2.4 30.33 0 24 0 14.62 0 6.56 5.38 2.64 13.2l7.94 6.17C12.4 13.36 17.72 9.5 24 9.5z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.24 0 11.47-2.05 15.29-5.57l-7.06-5.77c-1.96 1.32-4.47 2.1-8.23 2.1-6.17 0-11.41-3.91-13.28-9.27l-8.05 6.21C6.56 42.63 14.62 48 24 48z"
    />
    <path
      fill="#4A90E2"
      d="M46.5 24.5c0-1.64-.15-3.21-.42-4.75H24v9h12.7c-.55 2.94-2.23 5.43-4.78 7.12l7.06 5.77c4.13-3.81 6.52-9.43 6.52-17.14z"
    />
    <path
      fill="#FBBC05"
      d="M10.72 29.49A14.5 14.5 0 0 1 9.5 24c0-1.93.37-3.78 1.02-5.48l-7.94-6.17A23.94 23.94 0 0 0 0 24c0 3.86.92 7.5 2.58 10.73l8.14-5.24z"
    />
  </svg>
);

const AppleIcon = ({ className }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={className}
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M16.7 12.1c0-2.9 2.4-3.9 2.5-4-1.4-2-3.6-2.3-4.4-2.3-1.8-.2-3.6 1.1-4.5 1.1-.9 0-2.3-1-3.9-1-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 8.9 1.5 11.8 1 1.4 2.2 3 3.8 3 1.5 0 2.1-1 4-1 1.9 0 2.4 1 4 1 1.7 0 2.8-1.5 3.8-2.9 1.2-1.7 1.6-3.4 1.7-3.5-.1 0-3.3-1.2-3.6-4.2z"
    />
    <path
      fill="currentColor"
      d="M14.6 2.5c.8-1 1.4-2.4 1.2-3.8-1.2.1-2.7.8-3.5 1.8-.7.9-1.4 2.3-1.2 3.7 1.3.1 2.7-.7 3.5-1.7z"
    />
  </svg>
);

const LoginOverlay = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [pendingMagic, setPendingMagic] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const storageBlocked = safeStorageType === 'memory';
  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const { origin, pathname, hash } = window.location;
    // Conservamos el hash si no contiene tokens de Supabase.
    const cleanHash = hash && !hash.includes('access_token') ? hash : '';
    return `${origin}${pathname}${cleanHash}`;
  }, []);

  const handleMagicLink = useCallback(
    async (event) => {
      event.preventDefault();
      if (pendingMagic) {
        return;
      }

      if (storageBlocked) {
        setFeedback({
          type: 'error',
          text: 'Tu navegador móvil está bloqueando almacenamiento. Ábrelo en el navegador por defecto o desactiva el modo privado para iniciar sesión.',
        });
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
      safeSetItem('gatoencerrado:resume-contribution', 'true');

      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectTo,
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
    [email, pendingMagic, redirectTo, storageBlocked]
  );

  const handleGoogleLogin = useCallback(async () => {
    setFeedback(null);
    if (storageBlocked) {
      setFeedback({
        type: 'error',
        text: 'No pudimos iniciar sesión porque el navegador bloquea cookies/almacenamiento. Prueba abrir en Safari/Chrome fuera de modo privado.',
      });
      return;
    }
    safeSetItem('gatoencerrado:resume-contribution', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'No pudimos iniciar sesión con Google.' });
      return;
    }

    onClose?.();
  }, [onClose, redirectTo, storageBlocked]);

  const handleAppleLogin = useCallback(async () => {
    setFeedback(null);
    if (storageBlocked) {
      setFeedback({
        type: 'error',
        text: 'No pudimos iniciar sesión porque el navegador bloquea cookies/almacenamiento. Prueba abrir en Safari/Chrome fuera de modo privado.',
      });
      return;
    }
    safeSetItem('gatoencerrado:resume-contribution', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message || 'No pudimos iniciar sesión con Apple.' });
      return;
    }

    onClose?.();
  }, [onClose, redirectTo, storageBlocked]);

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
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
          >
            <GoogleIcon className="h-4 w-4" />
            Iniciar sesión con Google
          </button>
          <button
            type="button"
            onClick={handleAppleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
          >
            <AppleIcon className="h-4 w-4" />
            Iniciar sesión con Apple
          </button>
          {storageBlocked ? (
            <p className="text-xs text-amber-300">
              Tu navegador está bloqueando almacenamiento; abre el sitio en Safari/Chrome (fuera de modo privado) para completar el login.
            </p>
          ) : null}

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
