import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeStorageType } from '@/lib/safeStorage';

const overlayBackdropVariants = {
  hidden: { opacity: 0, transition: { duration: 0.18, ease: 'easeInOut' } },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const overlayCardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.34,
      delay: 0.05,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.99,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
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

const LOGIN_TIGER_ART_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/loggin_tiger.jpg';

const getMailUrl = (emailAddr) => {
  const domain = (emailAddr ?? '').split('@')[1]?.toLowerCase() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com';
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'https://outlook.live.com';
  if (domain === 'yahoo.com' || domain === 'ymail.com') return 'https://mail.yahoo.com';
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') return 'https://www.icloud.com/mail';
  return 'mailto:';
};

const LoginOverlay = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [pendingMagic, setPendingMagic] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const storageBlocked = safeStorageType === 'memory';
  const isLocalPreviewPort =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.port === '4173';
  const redirectTo = useMemo(() => {
    const explicitRedirect = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_TO;
    if (explicitRedirect) return explicitRedirect;
    if (typeof window === 'undefined') return undefined;
    const { origin, pathname, hash } = window.location;
    // Conservamos el hash si no contiene tokens de Supabase.
    const cleanHash = hash && !hash.includes('access_token') ? hash : '';
    return `${origin}${pathname}${cleanHash}`;
  }, []);
  const isSubmitting = pendingMagic || Boolean(pendingProvider);

  const handleMagicLink = useCallback(
    async (event) => {
      event.preventDefault();
      if (pendingMagic || pendingProvider) {
        return;
      }

      if (storageBlocked) {
        setFeedback({
          type: 'error',
          text: 'Tu navegador está cerrando la puerta. Abre el sitio en Safari o Chrome fuera de modo privado para cruzar.',
        });
        return;
      }

      const normalized = email.trim();
      if (!normalized) {
        setFeedback({
          type: 'error',
          text: 'Escribe tu correo para enviarte la puerta de acceso.',
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
        setFeedback({ type: 'error', text: error.message || 'No pudimos abrir el acceso por correo.' });
      } else {
        setSubmittedEmail(normalized);
        setFeedback({
          type: 'success',
          text: 'Te mandamos un acceso por correo. Ábrelo y continúas desde donde ibas.',
        });
        setEmail('');
      }

      setPendingMagic(false);
    },
    [email, pendingMagic, pendingProvider, redirectTo, storageBlocked]
  );

  const handleGoogleLogin = useCallback(async () => {
    setFeedback(null);
    if (pendingMagic || pendingProvider) {
      return;
    }
    if (storageBlocked) {
      setFeedback({
        type: 'error',
        text: 'No pudimos cruzar con Google porque el navegador bloquea cookies o almacenamiento. Prueba en Safari o Chrome fuera de modo privado.',
      });
      return;
    }
    setPendingProvider('google');
    safeSetItem('gatoencerrado:resume-contribution', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setPendingProvider(null);
      setFeedback({ type: 'error', text: error.message || 'No pudimos abrir la puerta con Google.' });
      return;
    }

    onClose?.();
  }, [onClose, pendingMagic, pendingProvider, redirectTo, storageBlocked]);

  const handleAppleLogin = useCallback(async () => {
    setFeedback(null);
    if (pendingMagic || pendingProvider) {
      return;
    }
    if (storageBlocked) {
      setFeedback({
        type: 'error',
        text: 'No pudimos cruzar con Apple porque el navegador bloquea cookies o almacenamiento. Prueba en Safari o Chrome fuera de modo privado.',
      });
      return;
    }
    setPendingProvider('apple');
    safeSetItem('gatoencerrado:resume-contribution', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setPendingProvider(null);
      setFeedback({ type: 'error', text: error.message || 'No pudimos abrir la puerta con Apple.' });
      return;
    }

    onClose?.();
  }, [onClose, pendingMagic, pendingProvider, redirectTo, storageBlocked]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[260] flex items-stretch justify-center overflow-y-auto overflow-x-hidden overscroll-none sm:items-center"
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
        className="relative z-10 h-full w-full sm:my-6 sm:h-auto sm:w-[calc(100vw-1.25rem)] sm:max-w-[29rem]"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayCardVariants}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-base text-slate-300 backdrop-blur-md transition hover:border-white/35 hover:text-white sm:right-3 sm:top-3"
          aria-label="Cerrar overlay"
        >
          ✕
        </button>

        <div className="relative h-full bg-[#05030a] shadow-[0_28px_100px_rgba(0,0,0,0.72)] sm:rounded-[2.9rem] sm:border sm:border-white/10 sm:p-2.5">

          <div className="relative h-full overflow-y-auto bg-[#09060f] sm:max-h-[88vh] sm:rounded-[2.35rem] sm:border sm:border-white/10">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  `linear-gradient(180deg, rgba(7,4,13,0.18) 0%, rgba(9,5,16,0.84) 42%, rgba(7,4,11,0.96) 100%), url(${LOGIN_TIGER_ART_URL})`,
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% -10%, rgba(255,255,255,0.08), transparent 34%), radial-gradient(circle at 10% 72%, rgba(255,120,40,0.34), transparent 28%), radial-gradient(circle at 85% 62%, rgba(255,135,48,0.26), transparent 24%), linear-gradient(180deg, rgba(20,8,36,0.18) 0%, rgba(16,7,25,0.7) 48%, rgba(8,5,14,0.92) 100%)',
              }}
            />

            <div className="relative z-10 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8 sm:pt-4">
              <div
                aria-hidden="true"
                className="h-[11rem] sm:h-[13rem]"
              />
              <div>
                <div className="space-y-3">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
                    Login
                  </div>
                  <div>
                    <h3
                      id="tracking-overlay-title"
                      className="font-display text-[clamp(2rem,7vw,3rem)] leading-[0.94] tracking-[-0.03em] text-white"
                    >
                      Para continuar, <br /> hay que cruzar
                    </h3>
                    <p
                      id="tracking-overlay-desc"
                      className="mt-3 max-w-[39ch] text-lg leading-relaxed text-white/80"
                    >
                      Aquí seguimos. Y más allá, hay algo nuevo por habitar.
                    </p>
                  </div>
                </div>

                {/* ── Magic Link form — CTA primario ── */}
                <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
                  <label htmlFor="tracking-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="tracking-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@correo.com"
                    className="form-surface form-surface--pill w-full px-6 py-4 text-lg"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(255,92,20,0.34)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundImage:
                        'linear-gradient(90deg, rgba(158,92,255,0.9) 0%, rgba(197,77,150,0.88) 28%, rgba(255,120,33,0.94) 72%, rgba(255,87,24,0.9) 100%)',
                    }}
                  >
                    {pendingMagic ? 'Abriendo el acceso...' : 'Pasar al otro lado'}
                  </button>
                </form>

                {feedback ? (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed backdrop-blur-md ${
                      feedback.type === 'error'
                        ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
                        : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
                    }`}
                  >
                    {feedback.text}
                  </div>
                ) : null}

                {feedback?.type === 'success' && submittedEmail ? (
                  <a
                    href={getMailUrl(submittedEmail)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-6 py-3.5 text-base font-semibold text-emerald-100 backdrop-blur-md transition hover:bg-emerald-500/20"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                      <path d="M2.003 5.884 10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z" />
                      <path d="m18 8.118-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z" />
                    </svg>
                    Abrir mi correo
                  </a>
                ) : null}

                {/* ── Divider ── */}
                <div className="relative my-5">
                  <div className="border-t border-white/10" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#09060f] px-3 text-xs text-white/35">
                    o
                  </span>
                </div>

                {/* ── Social — opciones secundarias ── */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-white/18 bg-white/8 px-5 py-4 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition hover:border-white/35 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    {pendingProvider === 'google' ? 'Abriendo Google...' : 'Entrar con Google'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-white/18 bg-white/8 px-5 py-4 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition hover:border-white/35 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <AppleIcon className="h-5 w-5" />
                    {pendingProvider === 'apple' ? 'Abriendo Apple...' : 'Entrar con Apple'}
                  </button>
                </div>

                {(storageBlocked || isLocalPreviewPort) ? (
                  <div className="mt-4 space-y-2">
                    {storageBlocked ? (
                      <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-100/90 backdrop-blur-md">
                        Tu navegador esta bloqueando almacenamiento. Abre el sitio en Safari o Chrome fuera de modo privado para completar el acceso.
                      </div>
                    ) : null}
                    {isLocalPreviewPort ? (
                      <div className="rounded-2xl border border-amber-300/20 bg-black/25 px-4 py-3 text-xs leading-relaxed text-amber-100/90 backdrop-blur-md">
                        Estas en `localhost:4173`. Si OAuth falla, usa{' '}
                        <a href="http://localhost:5173" className="underline underline-offset-2 hover:text-white">
                          localhost:5173
                        </a>{' '}
                        o agrega `http://localhost:4173` a los redirects permitidos en Supabase.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-6 text-center text-[1.1rem] text-white/68">
                  Todo va a estar bien. Nada se pierde.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (typeof document === 'undefined') {
    return overlay;
  }

  return createPortal(overlay, document.body);
};

export default LoginOverlay;
