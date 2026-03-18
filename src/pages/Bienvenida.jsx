import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const Bienvenida = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const iframeSrc = useMemo(() => {
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
  }, [baseUrl, flowGoal, user?.email, user?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    delete document.documentElement.dataset.bienvenidaFade;
    pauseHeroAmbient();
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
            Falta configurar `VITE_BIENVENIDA_URL` o `VITE_ORACULO_URL`.
          </div>
        )}
      </div>
    </div>
  );
};

export default Bienvenida;
