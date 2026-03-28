import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';

const AUTOFICCION_URL = import.meta.env.VITE_AUTOFICCION_URL ?? '';

const Autoficcion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const iframeRef = useRef(null);

  const baseUrl = useMemo(
    () => (AUTOFICCION_URL ? AUTOFICCION_URL.replace(/\/+$/, '') : ''),
    []
  );

  const authDisplayName = useMemo(
    () => user?.user_metadata?.alias || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : ''),
    [user]
  );

  const postUserContext = (targetWindow, appOrigin) => {
    if (!targetWindow || !appOrigin) return;
    targetWindow.postMessage(
      {
        type: 'autoficcion:user-context',
        userId: user?.id ?? null,
        userName: authDisplayName || null,
        profile: {
          id: user?.id ?? null,
          full_name: user?.user_metadata?.full_name ?? null,
          display_name: user?.user_metadata?.alias ?? null,
          name: authDisplayName || null,
          email: user?.email ?? null,
        },
      },
      appOrigin
    );
  };

  // Construir src del iframe con contexto básico del usuario autenticado.
  const iframeSrc = useMemo(() => {
    if (!baseUrl) return '';
    const url = new URL(baseUrl);
    if (user?.id) url.searchParams.set('user_id', user.id);
    if (authDisplayName) url.searchParams.set('user_name', authDisplayName);
    return url.toString();
  }, [authDisplayName, baseUrl, user?.id]);

  // Escuchar mensajes de la app autoficción (postMessage bridge)
  useEffect(() => {
    let appOrigin = '';
    try {
      appOrigin = new URL(baseUrl).origin;
    } catch {
      return undefined;
    }

    const handleMessage = (event) => {
      if (event.origin !== appOrigin) return;

      const { type } = event.data ?? {};

      if (type === 'autoficcion:request-login') {
        setShowLogin(true);
        return;
      }

      if (type === 'autoficcion:request-user-context') {
        postUserContext(event.source, appOrigin);
        return;
      }

      if (type === 'autoficcion:close') {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authDisplayName, baseUrl, navigate, user]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-0">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            title="Mi gato encerrado — autoficción"
            src={iframeSrc}
            className="h-full w-full border-0"
            allow="microphone; fullscreen; clipboard-write"
            onLoad={() => {
              if (!baseUrl) return;
              try {
                postUserContext(iframeRef.current?.contentWindow, new URL(baseUrl).origin);
              } catch {}
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm px-8 text-center">
            Falta configurar <code className="mx-1 text-slate-300">VITE_AUTOFICCION_URL</code> en el entorno.
          </div>
        )}
      </div>

      {!user && (
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80"
        >
          IR AL SITIO
        </button>
      )}

      {showLogin && <LoginOverlay onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default Autoficcion;
