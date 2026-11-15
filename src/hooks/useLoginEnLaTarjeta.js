import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeStorageType } from '@/lib/safeStorage';
import { buildCurrentSiteRedirectUrl, normalizeSiteRedirectUrl } from '@/lib/checkoutRedirectUrls';

// El acceso con cuenta para el dorso de una tarjeta de la galería (Carlos,
// 14 nov 2026). Hace las mismas tres llamadas que LoginOverlay —código por
// correo, Google y Apple— sin su ventana: aquí el login vive en la tarjeta.
// Deuda: la lógica está duplicada con LoginOverlay.jsx a propósito, para no
// tocar esta noche el login que ya funciona; conviene unificarlas después.
// No escribe `resume-contribution` ni la continuación del video narrativo:
// al entrar, la tarjeta sigue en su sitio y pasa a su pregunta.
export const useLoginEnLaTarjeta = ({ onEntrar, onAntesDeSalir } = {}) => {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [pendingSend, setPendingSend] = useState(false);
  const [pendingVerify, setPendingVerify] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const storageBlocked = safeStorageType === 'memory';
  const redirectTo = useMemo(() => {
    const explicitRedirect = normalizeSiteRedirectUrl(import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_TO);
    if (explicitRedirect) return explicitRedirect;
    return buildCurrentSiteRedirectUrl();
  }, []);
  const isSubmitting = pendingSend || pendingVerify || Boolean(pendingProvider);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) onEntrar?.();
    });
    return () => subscription.unsubscribe();
  }, [onEntrar]);

  const sendOtp = useCallback(async (event) => {
    event?.preventDefault?.();
    if (pendingSend || pendingProvider) return;
    if (storageBlocked) {
      setFeedback({ type: 'error', text: 'Tu navegador está cerrando la puerta. Abre el sitio en Safari o Chrome fuera de modo privado para cruzar.' });
      return;
    }
    const normalized = email.trim();
    if (!normalized) {
      setFeedback({ type: 'error', text: 'Escribe tu correo para enviarte el código de acceso.' });
      return;
    }
    setPendingSend(true);
    setFeedback(null);
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: true } });
    if (error) {
      setFeedback({ type: 'error', text: error.message || 'No pudimos enviar el código. Intenta de nuevo.' });
    } else {
      setSubmittedEmail(normalized);
      setEmail('');
      setOtpCode('');
      setStep('otp');
      setFeedback(null);
    }
    setPendingSend(false);
  }, [email, pendingSend, pendingProvider, storageBlocked]);

  const verifyOtp = useCallback(async (event) => {
    event?.preventDefault?.();
    if (pendingVerify) return;
    setPendingVerify(true);
    setFeedback(null);
    const { error } = await supabase.auth.verifyOtp({ email: submittedEmail, token: otpCode.trim(), type: 'email' });
    if (error) {
      setFeedback({ type: 'error', text: 'Código incorrecto o expirado. Revisa el correo e intenta de nuevo.' });
    }
    // Si sale bien, onAuthStateChange avisa (onEntrar).
    setPendingVerify(false);
  }, [submittedEmail, otpCode, pendingVerify]);

  const resend = useCallback(() => {
    setStep('email');
    setOtpCode('');
    setFeedback(null);
  }, []);

  const conProveedor = useCallback(async (provider, nombre) => {
    setFeedback(null);
    if (pendingSend || pendingProvider) return;
    if (storageBlocked) {
      setFeedback({ type: 'error', text: `No pudimos cruzar con ${nombre} porque el navegador bloquea cookies o almacenamiento. Prueba en Safari o Chrome fuera de modo privado.` });
      return;
    }
    setPendingProvider(provider);
    // La página se va y vuelve: quien llama deja dicho a qué tarjeta volver.
    onAntesDeSalir?.();
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setPendingProvider(null);
      setFeedback({ type: 'error', text: error.message || `No pudimos abrir la puerta con ${nombre}.` });
    }
  }, [onAntesDeSalir, pendingSend, pendingProvider, redirectTo, storageBlocked]);

  return {
    email, setEmail, submittedEmail, step, otpCode, setOtpCode,
    pendingSend, pendingVerify, pendingProvider, isSubmitting, feedback, storageBlocked,
    sendOtp, verifyOtp, resend,
    conGoogle: () => conProveedor('google', 'Google'),
    conApple: () => conProveedor('apple', 'Apple'),
  };
};
