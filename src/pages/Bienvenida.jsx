import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  setBienvenidaTransmediaIntent,
  getBienvenidaFlowGoal,
  clearBienvenidaFlowGoal,
  clearBienvenidaPending,
  clearBienvenidaReturnPath,
  getBienvenidaReturnPath,
  markBienvenidaSeen,
  setBienvenidaReturnPath,
  setBienvenidaSkip,
  isBienvenidaQaAlwaysFreshUser,
} from '@/lib/bienvenida';
import { extractRecommendedAppId, normalizeBridgeKey } from '@/lib/bienvenidaBridge';
import { pauseHeroAmbient } from '@/lib/heroAmbientAudio';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';

const BRIDGE_EVENT_REQUEST_AUTH_MODAL = 'bienvenida:request-auth-modal';
const BRIDGE_EVENT_AUTH_SUCCESS = 'sitioobra:auth-success';
const BRIDGE_AUTH_STORAGE_KEY = 'gatoencerrado:bienvenida-bridge-auth:v1';
const BRIDGE_EVENT_REQUEST_TRAZOS = 'bienvenida:request-trazos';
const BRIDGE_EVENT_TRAZOS_ERROR = 'sitioobra:trazos-error';
const GATO_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const Bienvenida = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cabinaReached, setCabinaReached] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const iframeRef = useRef(null);
  const pendingBridgeAuthRef = useRef(null);
  const baseUrl = useMemo(() => {
    const raw = import.meta.env.VITE_BIENVENIDA_URL ?? import.meta.env.VITE_ORACULO_URL ?? '';
    return raw ? raw.replace(/\/+$/, '') : '';
  }, []);
  const OPEN_TRANSMEDIA_EVENT = 'bienvenida:open-transmedia';
  const flowGoal = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('goal') || getBienvenidaFlowGoal() || '';
  }, [location.search]);

  const bienvenidaOrigin = useMemo(() => {
    if (!baseUrl) return '';
    try {
      return new URL(baseUrl).origin;
    } catch {
      return '';
    }
  }, [baseUrl]);

  // Frozen on mount: user login mid-flow must NOT reload the iframe.
  const [iframeSrc] = useState(() => {
    if (!baseUrl) return '';
    const url = new URL(baseUrl);
    const isQaAlwaysFreshUser = isBienvenidaQaAlwaysFreshUser(user?.id);
    if (user?.id) {
      url.searchParams.set('user_id', user.id);
    }
    if (user?.email) {
      url.searchParams.set('email', user.email);
    }
    if (flowGoal) {
      url.searchParams.set('goal', flowGoal);
    }
    if (isQaAlwaysFreshUser) {
      url.searchParams.set('qa_fresh', '1');
    }
    return url.toString();
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    delete document.documentElement.dataset.bienvenidaFade;
    pauseHeroAmbient();
  }, []);

  const clearPendingBridgeAuth = useCallback(() => {
    pendingBridgeAuthRef.current = null;
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(BRIDGE_AUTH_STORAGE_KEY);
    } catch {}
  }, []);

  const storePendingBridgeAuth = useCallback((payload) => {
    pendingBridgeAuthRef.current = payload;
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(BRIDGE_AUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, []);

  const postBridgeReply = useCallback(
    (type, payload = {}) => {
      if (typeof window === 'undefined' || !bienvenidaOrigin) return false;
      const targetWindow = iframeRef.current?.contentWindow;
      if (!targetWindow) return false;
      try {
        targetWindow.postMessage({ type, payload }, bienvenidaOrigin);
        return true;
      } catch (error) {
        console.warn('[sitioobra-bridge] failed posting reply', { type, error });
        return false;
      }
    },
    [bienvenidaOrigin]
  );

  const flushBridgeAuthSuccess = useCallback(() => {
    if (!user || !pendingBridgeAuthRef.current) return false;
    const pending = pendingBridgeAuthRef.current;
    const didPost = postBridgeReply(BRIDGE_EVENT_AUTH_SUCCESS, {
      appId: pending.appId ?? null,
      selectedAppId: pending.appId ?? null,
      source: 'sitioobra-bienvenida',
      userId: user.id ?? null,
      userEmail: user.email ?? null,
    });
    if (didPost) {
      clearPendingBridgeAuth();
    }
    return didPost;
  }, [clearPendingBridgeAuth, postBridgeReply, user]);

  const handleFinish = useCallback(() => {
    if (!user) {
      setBienvenidaSkip();
    } else {
      markBienvenidaSeen(user.id);
    }
    clearBienvenidaPending();
    const returnPath = getBienvenidaReturnPath() || '/';
    clearBienvenidaReturnPath();
    clearBienvenidaFlowGoal();
    navigate(returnPath, { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(BRIDGE_AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        window.sessionStorage.removeItem(BRIDGE_AUTH_STORAGE_KEY);
        return;
      }
      pendingBridgeAuthRef.current = parsed;
    } catch {}
  }, []);

  useEffect(() => {
    flushBridgeAuthSuccess();
  }, [flushBridgeAuthSuccess]);

  useEffect(() => {
    if (user && showLoginOverlay) {
      setShowLoginOverlay(false);
    }
  }, [user, showLoginOverlay]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event?.data) return;
      if (typeof event.data !== 'object') return;
      if (!bienvenidaOrigin || event.origin !== bienvenidaOrigin) return;
      const { type } = event.data;
      const payload = event.data?.payload;
      const payloadAppId = extractRecommendedAppId(payload);
      console.info('[sitioobra-bridge] received', {
        type,
        origin: event.origin,
        appId: payloadAppId || null,
      });
      if (type === BRIDGE_EVENT_REQUEST_AUTH_MODAL) {
        const pendingPayload = {
          appId: payloadAppId || null,
          requestedAt: Date.now(),
        };
        storePendingBridgeAuth(pendingPayload);

        if (user) {
          flushBridgeAuthSuccess();
          return;
        }

        setShowLoginOverlay(true);
        return;
      }
      if (type === 'bienvenida:cabina-reached') {
        setCabinaReached(true);
        return;
      }
      if (type === 'bienvenida:gatokens-update') {
        const value = event.data?.gatokens;
        if (typeof value === 'number' && value > 0) {
          try {
            window.localStorage.setItem('gatoencerrado:gatokens-available', String(value));
            window.dispatchEvent(
              new CustomEvent('gatoencerrado:gatokens-balance-update', {
                detail: { balance: value, source: 'bienvenida' },
              })
            );
          } catch {}
        }
        return;
      }
      if (type === 'bienvenida:close' || type === 'bienvenida:done') {
        handleFinish();
        return;
      }
      if (type === OPEN_TRANSMEDIA_EVENT) {
        if (flowGoal === 'subscription') {
          handleFinish();
          return;
        }
        const payloadHashTarget = normalizeBridgeKey(payloadAppId) || 'transmedia';
        if (payload && typeof payload === 'object') {
          setBienvenidaTransmediaIntent(payload);
        }
        const returnPath = getBienvenidaReturnPath() || '/';
        const returnPathWithoutHash = String(returnPath).split('#')[0] || '/';
        setBienvenidaReturnPath(`${returnPathWithoutHash}#${payloadHashTarget}`);
        handleFinish();
      }
      if (type === BRIDGE_EVENT_REQUEST_TRAZOS) {
        const { texto_oracular, personaje_id } = payload ?? {};
        if (!texto_oracular || !personaje_id) {
          postBridgeReply(BRIDGE_EVENT_TRAZOS_ERROR, { message: 'Faltan datos para la transformación.' });
          return;
        }
        const userId = user?.id ?? payload?.usuario_id ?? null;
        fetch(`${GATO_API_URL}/api/transformar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto_oracular, personaje_id, usuario_id: userId }),
        })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data?.id) {
              const msg = typeof data?.error === 'string' ? data.error : 'No pudimos transformar tu perfil.';
              postBridgeReply(BRIDGE_EVENT_TRAZOS_ERROR, { message: msg });
              return;
            }
            navigate(`/trazos?transformacion=${encodeURIComponent(data.id)}&personaje=${encodeURIComponent(personaje_id)}`);
          })
          .catch(() => {
            postBridgeReply(BRIDGE_EVENT_TRAZOS_ERROR, { message: 'Error de red al transformar.' });
          });
        return;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [bienvenidaOrigin, flowGoal, flushBridgeAuthSuccess, handleFinish, navigate, postBridgeReply, storePendingBridgeAuth, user]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-0">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            title="Bienvenida"
            src={iframeSrc}
            className="h-full w-full border-0"
            allow="camera; microphone; fullscreen; web-share; clipboard-write"
            onLoad={() => {
              flushBridgeAuthSuccess();
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-200">
            Falta configurar `VITE_BIENVENIDA_URL` o `VITE_ORACULO_URL`.
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleFinish}
        disabled={cabinaReached}
        className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80 disabled:pointer-events-none disabled:opacity-0"
      >
        Cerrar
      </button>
      {showLoginOverlay && <LoginOverlay onClose={() => setShowLoginOverlay(false)} />}
    </div>
  );
};

export default Bienvenida;
