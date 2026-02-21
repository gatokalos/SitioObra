import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';
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
} from '@/lib/bienvenida';
import { extractRecommendedAppId, normalizeBridgeKey } from '@/lib/bienvenidaBridge';

const Bienvenida = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const baseUrl = import.meta.env.VITE_BIENVENIDA_URL;
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

  const iframeSrc = useMemo(() => {
    if (!baseUrl) return '';
    const url = new URL(baseUrl);
    if (user?.id) {
      url.searchParams.set('user_id', user.id);
    }
    if (user?.email) {
      url.searchParams.set('email', user.email);
    }
    if (flowGoal) {
      url.searchParams.set('goal', flowGoal);
    }
    return url.toString();
  }, [baseUrl, flowGoal, user?.email, user?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    delete document.documentElement.dataset.bienvenidaFade;
  }, []);

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

  const handleOpenLogin = useCallback(() => {
    if (!user) {
      setShowLoginOverlay(true);
    }
  }, [user]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

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
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [bienvenidaOrigin, flowGoal, handleFinish]);

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
      <div className="absolute left-6 top-6 z-10">
        <PortalAuthButton onOpenLogin={handleOpenLogin} />
      </div>
      <button
        type="button"
        onClick={handleFinish}
        className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white hover:bg-black/80"
      >
        Cerrar
      </button>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
    </div>
  );
};

export default Bienvenida;
