import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AUTOFICCION_URL = import.meta.env.VITE_AUTOFICCION_URL ?? '';

const Autoficcion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const baseUrl = useMemo(
    () => (AUTOFICCION_URL ? AUTOFICCION_URL.replace(/\/+$/, '') : ''),
    []
  );

  // Construir src del iframe con user_id si hay sesión activa
  const iframeSrc = useMemo(() => {
    if (!baseUrl) return '';
    const url = new URL(baseUrl);
    if (user?.id) url.searchParams.set('user_id', user.id);
    return url.toString();
  }, [baseUrl, user?.id]);

  // Abrir modal de login si viene con ?login=true (acceso directo desde literatura.miniversos.ai)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      params.delete('login');
      const clean = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, '', clean);
      // Pequeño delay para que el listener del modal esté registrado antes de disparar el evento
      setTimeout(() => window.dispatchEvent(new Event('open-login-modal')), 150);
    }
  }, []);

  // Escuchar mensajes de la app autoficción (postMessage bridge)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!baseUrl) return;
      try {
        const appOrigin = new URL(baseUrl).origin;
        if (event.origin !== appOrigin) return;
      } catch { return; }

      const { type } = event.data ?? {};

      // La app pide abrir el modal de login de SitioObra
      if (type === 'autoficcion:request-login') {
        window.dispatchEvent(new Event('open-login-modal'));
        return;
      }

      // La app pide cerrar (botón de regreso interno)
      if (type === 'autoficcion:close') {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [baseUrl, navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-0">
        {iframeSrc ? (
          <iframe
            title="Mi gato encerrado — autoficción"
            src={iframeSrc}
            className="h-full w-full border-0"
            allow="microphone; fullscreen; clipboard-write"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm px-8 text-center">
            Falta configurar <code className="mx-1 text-slate-300">VITE_AUTOFICCION_URL</code> en el entorno.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80"
      >
        Cerrar
      </button>
    </div>
  );
};

export default Autoficcion;
