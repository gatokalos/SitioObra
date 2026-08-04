import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ensureAnonId } from '@/lib/identity';
import {
  fetchTransmediaCreditState,
  registerTransmediaCreditEvent,
  createTransmediaIdempotencyKey,
} from '@/services/transmediaCreditsService';

const APP_URL = 'https://literatura.miniversos.ai';
const FREE_NOVELA_QUESTIONS = 3;

// Marcador Inteligente — el artefacto necesita anon_id para llamar a
// /literatura/match, /selection y /voice-event con la MISMA sesión que
// guardó /baseline (ResonanceModal). Antes esta iframe no llevaba ningún
// contexto ni puente postMessage; ambos son necesarios para el flujo nuevo.
const LiteraturaAppOverlay = ({ open, onClose, onRequireLogin }) => {
  const sessionContextRef = useRef(null); // { fragment_id, plano, initiator } — capturado desde ThreadOverlay

  const iframeSrc = useMemo(() => {
    try {
      const url = new URL(APP_URL);
      const anonId = ensureAnonId();
      if (anonId) url.searchParams.set('anon_id', anonId);
      url.searchParams.set('miniverso_id', 'literatura');
      return url.toString();
    } catch {
      return APP_URL;
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let appOrigin = '';
    try {
      appOrigin = new URL(APP_URL).origin;
    } catch {
      return undefined;
    }

    const handleMessage = (event) => {
      if (event.origin !== appOrigin) return;
      const { type } = event.data ?? {};

      if (type === 'autoficcion:request-login') {
        onRequireLogin?.();
        return;
      }

      if (type === 'autoficcion:literatura-session-context') {
        const { fragment_id, plano, initiator } = event.data ?? {};
        sessionContextRef.current = { fragment_id: fragment_id ?? null, plano: plano ?? null, initiator: initiator ?? null };
        return;
      }

      if (type === 'autoficcion:gat-request') {
        (async () => {
          const respond = (payload) => {
            event.source?.postMessage({ type: 'autoficcion:gat-response', ...payload }, appOrigin);
          };
          try {
            const { state, error: stateError } = await fetchTransmediaCreditState();
            if (stateError) { respond({ allowed: true }); return; }

            const used = state.novela_questions ?? 0;
            if (used >= FREE_NOVELA_QUESTIONS) {
              respond({ allowed: false, used, limit: FREE_NOVELA_QUESTIONS });
              return;
            }

            const { state: newState, error: regError } = await registerTransmediaCreditEvent({
              eventKey: 'novela_question',
              amount: 0,
              idempotencyKey: createTransmediaIdempotencyKey('novela_question'),
            });

            if (regError) { respond({ allowed: true }); return; }

            respond({ allowed: true, used: newState.novela_questions, limit: FREE_NOVELA_QUESTIONS });
          } catch {
            respond({ allowed: true }); // fail open
          }
        })();
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, onRequireLogin]);

  if (!open || typeof document === 'undefined') return null;

  const handleClose = () => {
    const sessionContext = sessionContextRef.current;
    sessionContextRef.current = null;
    onClose?.(sessionContext);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl">
      <button
        type="button"
        onClick={handleClose}
        className="mb-4 self-center text-slate-300 hover:text-white text-sm"
      >
        Cerrar ✕
      </button>

      <div className="w-full max-w-sm flex-1 sm:flex-none sm:aspect-[9/16] sm:max-h-[88dvh] overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/10">
        <iframe
          src={iframeSrc}
          title="Separador inteligente · Literatura"
          className="w-full h-full"
          allow="microphone; camera"
          loading="lazy"
        />
      </div>
    </div>,
    document.body,
  );
};

export default LiteraturaAppOverlay;
