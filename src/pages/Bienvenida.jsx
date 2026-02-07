import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  clearBienvenidaPending,
  clearBienvenidaReturnPath,
  getBienvenidaReturnPath,
  markBienvenidaSeen,
} from '@/lib/bienvenida';

const Bienvenida = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const baseUrl = import.meta.env.VITE_BIENVENIDA_URL;

  const iframeSrc = useMemo(() => {
    if (!baseUrl) return '';
    const url = new URL(baseUrl);
    if (user?.id) {
      url.searchParams.set('user_id', user.id);
    }
    if (user?.email) {
      url.searchParams.set('email', user.email);
    }
    return url.toString();
  }, [baseUrl, user?.email, user?.id]);

  const handleFinish = useCallback(() => {
    markBienvenidaSeen(user?.id);
    clearBienvenidaPending();
    const returnPath = getBienvenidaReturnPath() || '/';
    clearBienvenidaReturnPath();
    navigate(returnPath, { replace: true });
  }, [navigate, user?.id]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event?.data) return;
      const { type } = event.data;
      if (type === 'bienvenida:close' || type === 'bienvenida:done') {
        handleFinish();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-0">
        {iframeSrc ? (
          <iframe
            title="Bienvenida"
            src={iframeSrc}
            className="h-full w-full border-0"
            allow="camera; microphone; fullscreen"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-200">
            Falta configurar `VITE_BIENVENIDA_URL`.
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleFinish}
        className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80"
      >
        Cerrar
      </button>
    </div>
  );
};

export default Bienvenida;
