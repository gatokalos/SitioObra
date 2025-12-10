import React from 'react';

import { trackMetric } from '@/lib/trackMetric';
import { EMAIL_REDIRECT_SOURCE } from '@/lib/emailRedirectConfig';

const LoginToast = ({ emailHash, onLoginClick, onDismiss }) => {
  const handleLoginClick = () => {
    void trackMetric('login_click', EMAIL_REDIRECT_SOURCE, emailHash);
    onLoginClick?.();
  };

  const handleDismissClick = () => {
    void trackMetric('dismiss_click', EMAIL_REDIRECT_SOURCE, emailHash);
    onDismiss?.();
  };

  return (
    <div
      role="status"
      className="fixed left-1/2 top-[72px] z-[999] w-[min(94%,360px)] -translate-x-1/2 rounded-[30px] border border-white/20 bg-gradient-to-r from-[#130022]/90 via-[#0c041c]/90 to-[#070312]/90 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-[22px] text-white md:left-auto md:right-6 md:top-6 md:w-[320px] md:-translate-x-0"
    >
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">Sabemos que vienes desde tu correo.</p>
        <p className="text-xs text-slate-300">¿Quieres iniciar sesión aquí mismo?</p>
      </div>
      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          onClick={handleLoginClick}
          className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0c031c] shadow-[0_20px_40px_rgba(131,64,255,0.5)] transition hover:-translate-y-0.5"
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={handleDismissClick}
          className="flex-1 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60"
        >
          Más tarde
        </button>
      </div>
    </div>
  );
};

export default LoginToast;
