import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FEEDBACK = {
  success: 'success',
  error: 'error',
};

const LoginAccordion = ({ onLoginSuccess }) => {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
    setFeedback(null);
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending(true);
    setFeedback(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setFeedback({ type: FEEDBACK.error, text: error.message || 'No pudimos enviar el correo.' });
    } else {
      setFeedback({
        type: FEEDBACK.success,
        text: 'Te enviamos un enlace mágico para que continues.',
      });
      setEmail('');
      onLoginSuccess?.('magic_link');
    }

    setPending(false);
  };

  const handleGoogleLogin = async () => {
    setFeedback(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setFeedback({ type: FEEDBACK.error, text: error.message });
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggleExpanded}
        className="text-sm text-purple-300 underline-offset-2 hover:text-purple-100 underline"
      >
        Inicia sesión para activar esta opción
      </button>

      {expanded ? (
        <div className="mt-4 rounded-lg border border-white/5 bg-black/30 p-4 text-sm space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full rounded-md bg-white py-2 font-semibold text-black transition hover:bg-slate-100"
          >
            Iniciar sesión con Google
          </button>

          <form onSubmit={handleMagicLink} className="space-y-2">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              required
            />

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-purple-600 py-2 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? 'Enviando...' : 'Recibir Magic Link'}
            </button>
          </form>

          {feedback ? (
            <p
              className={`text-xs ${
                feedback.type === FEEDBACK.error ? 'text-rose-300' : 'text-purple-200'
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default LoginAccordion;
