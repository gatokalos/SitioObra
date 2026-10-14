import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ensureAnonId } from '@/lib/identity';
import { normalizarGesto, sellarForma, reintentarSellosPendientes } from '@/lib/sello';
import { readResonanceRecord } from '@/lib/bitacoraShared';
import { buildEscenaFrase, PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { showcaseDefinitions } from '@/components/transmedia/transmediaConstants';
import {
  fetchTransmediaCreditState,
  registerTransmediaCreditEvent,
  createTransmediaIdempotencyKey,
} from '@/services/transmediaCreditsService';

const APP_URL = import.meta.env.VITE_LITERATURA_APP_URL ?? 'https://literatura.miniversos.ai';
// Marca del historial mientras la escena está abierta (ver el efecto de abajo).
const ESCENA_STATE = 'gatoencerrado:escena:literatura';

// Los avisos de «Al entrar en escena…» son la única fuente del copy que el
// dispositivo dice en su transición (punto 6, Carlos, 11 oct 2026): el sitio se
// los manda, sin emojis, y el Marcador solo los pone en escena.
const quitarEmoji = (texto) => String(texto ?? '').replace(/^[^\p{L}\p{N}«¿¡"']+/u, '').trim();
const avisosDeLaEscena = () => {
  const notes = showcaseDefinitions?.miniversoNovela?.iaProfile?.notes;
  return Array.isArray(notes) ? notes.map(quitarEmoji).filter(Boolean) : [];
};
const FREE_NOVELA_QUESTIONS = 3;

// Marcador Inteligente — el artefacto necesita anon_id para llamar a
// /literatura/match, /selection y /voice-event con la MISMA sesión que
// guardó /baseline (ResonanceModal). Antes esta iframe no llevaba ningún
// contexto ni puente postMessage; ambos son necesarios para el flujo nuevo.
const LiteraturaAppOverlay = ({ open, onClose, onRequireLogin }) => {
  const sessionContextRef = useRef(null); // { fragment_id, plano, initiator } — capturado desde ThreadOverlay
  // D-69 (9 oct 2026): el sello lo da el gesto, no la ventana. Cuando la app
  // anuncia que el gesto terminó (enunciado o declinado), aquí se sella en el
  // momento —espejo local y servidor— sin esperar a que la persona cierre.
  const gestoRef = useRef(null);
  const cerrarRef = useRef(null);
  // El «atrás» del navegador con la escena abierta: se pregunta, no se sale.
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const trampaRef = useRef(false);

  const iframeSrc = useMemo(() => {
    try {
      const url = new URL(APP_URL);
      const anonId = ensureAnonId();
      if (anonId) url.searchParams.set('anon_id', anonId);
      url.searchParams.set('miniverso_id', 'literatura');
      // La entrada por el sitio (D-52): el Marcador en modo gesto.
      url.searchParams.set('modo', 'gesto');
      return url.toString();
    } catch {
      return APP_URL;
    }
  }, []);

  // El botón «atrás» (o el deslizar hacia atrás del trackpad) no saca de la
  // escena ni borra lo andado (Carlos, 11 oct 2026, primera prueba): mientras
  // la ventana está abierta hay una entrada propia en el historial; si la
  // persona retrocede, la entrada se repone y se le pregunta si de verdad
  // quiere salir. Recargar o cerrar la pestaña también pide confirmación.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const marcar = () => {
      try {
        const previo = window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
        // idx se conserva para que el enrutador del sitio siga contando bien.
        window.history.pushState({ ...previo, idx: (Number(previo.idx) || 0) + 1, [ESCENA_STATE]: true }, '', window.location.href);
        trampaRef.current = true;
      } catch { /* sin historial manipulable: no hay trampa, pero la escena sigue */ }
    };
    marcar();
    const onPop = () => {
      marcar();
      setConfirmarSalida(true);
    };
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Al cerrar por la vía normal se retira la entrada propia, para que el
      // siguiente «atrás» de la persona haga lo de siempre.
      if (trampaRef.current && window.history.state?.[ESCENA_STATE]) {
        trampaRef.current = false;
        try { window.history.back(); } catch { /* ignore */ }
      } else {
        trampaRef.current = false;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let appOrigin = '';
    try {
      appOrigin = new URL(APP_URL).origin;
    } catch {
      return undefined;
    }

    // Sellos que no llegaron al servidor en una visita anterior.
    void reintentarSellosPendientes();

    const handleMessage = (event) => {
      if (event.origin !== appOrigin) return;
      const { type } = event.data ?? {};

      if (type === 'autoficcion:gesto') {
        const { forma, resultado, fragment_id, plano, match_id, duration_ms, ts } = event.data ?? {};
        if (forma && forma !== 'literatura') return;
        const gesto = normalizarGesto({ resultado, fragment_id, plano, match_id, duration_ms, ts });
        if (!gesto) return;
        gestoRef.current = gesto;
        void sellarForma('literatura', gesto);
        return;
      }

      if (type === 'autoficcion:request-login') {
        onRequireLogin?.();
        return;
      }

      // El Marcador pide contexto al arrancar: se le manda la frase de la escena
      // (la misma plantilla de la tarjeta, en pasado, con el chip elegido) y los avisos.
      if (type === 'autoficcion:request-user-context') {
        const record = readResonanceRecord('literatura');
        const frase = buildEscenaFrase('literatura', record?.l2_option);
        // Desde el 14 oct 2026 la conversación ocurre dentro del Marcador: viaja
        // el emblema (para la esfera «Terminar la escena») y, si la forma ya
        // quedó sellada sin terminar la conversación, el gesto, para entrar ahí.
        const conversacionPendiente = !!record?.experience_ts && !record?.l2_conv_done;
        event.source?.postMessage({
          type: 'autoficcion:escena-context',
          frase,
          avisos: avisosDeLaEscena(),
          emblema: PORTAL_EMBLEM_URL.literatura,
          gesto_resultado: conversacionPendiente ? (record?.gesto_resultado ?? 'enunciado') : null,
        }, appOrigin);
        return;
      }

      // La escena terminó (gesto hecho, o salida sin gesto): el Marcador pide
      // cerrarse; quien recibe el cierre abre la conversación si hubo gesto.
      if (type === 'autoficcion:cerrar-escena') {
        const { conversacion } = event.data ?? {};
        cerrarRef.current?.(conversacion === 'terminada' || conversacion === 'pendiente' ? conversacion : null);
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

            // availableGat viaja siempre que se pudo leer el saldo, aparte del
            // conteo de preguntas gratis: el Marcador Inteligente lo usa para
            // avisar si el GAT no alcanza para la voz ANTES de llegar al gate
            // (VoiceReadGate), no solo cuando el débito real falla con 402.
            const used = state.novela_questions ?? 0;
            if (used >= FREE_NOVELA_QUESTIONS) {
              respond({ allowed: false, used, limit: FREE_NOVELA_QUESTIONS, availableGat: state.available_tokens });
              return;
            }

            const { state: newState, error: regError } = await registerTransmediaCreditEvent({
              eventKey: 'novela_question',
              amount: 0,
              idempotencyKey: createTransmediaIdempotencyKey('novela_question'),
            });

            if (regError) { respond({ allowed: true, availableGat: state.available_tokens }); return; }

            respond({ allowed: true, used: newState.novela_questions, limit: FREE_NOVELA_QUESTIONS, availableGat: newState.available_tokens });
          } catch {
            respond({ allowed: true }); // fail open, sin dato de saldo
          }
        })();
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, onRequireLogin]);

  if (!open || typeof document === 'undefined') return null;

  const handleClose = (conversacion = null) => {
    const sessionContext = sessionContextRef.current;
    const gesto = gestoRef.current;
    sessionContextRef.current = null;
    gestoRef.current = null;
    setConfirmarSalida(false);
    // El contexto del debate (si llegó), el gesto (si se anunció) y en qué
    // quedó la conversación. El sello ya está escrito; quien recibe esto no
    // debe volver a sellar.
    const conv = typeof conversacion === 'string' ? conversacion : null;
    onClose?.(sessionContext || gesto || conv ? { ...(sessionContext ?? {}), gesto, conversacion: conv } : null);
  };
  cerrarRef.current = handleClose;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#080806]">
      {/* La escena ocupa la ventana entera, sin marco, en cualquier pantalla
          (Carlos, 12 oct 2026: el marco no le gustó). La salida flota encima. */}
      <iframe
        src={iframeSrc}
        title="Separador inteligente · Literatura"
        className="absolute inset-0 h-full w-full border-0"
        allow="microphone; camera"
        loading="lazy"
      />
      <button
        type="button"
        onClick={() => handleClose()}
        className="absolute right-4 z-10 rounded-full bg-black/45 px-3 py-1.5 text-sm text-slate-300 backdrop-blur-sm transition hover:text-white"
        style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        Salir de la escena ✕
      </button>

      {confirmarSalida && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="salir-escena-titulo"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0a08] p-6 text-center shadow-2xl">
            <p id="salir-escena-titulo" className="font-display text-xl text-amber-100">¿Salir de la escena?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
              Todavía no hiciste el gesto. Si sales, la forma queda abierta y puedes volver a entrar.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConfirmarSalida(false)}
                className="rounded-full border border-amber-300/50 bg-amber-300/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-amber-200"
              >
                Seguir en la escena
              </button>
              <button
                type="button"
                onClick={() => handleClose()}
                className="rounded-full border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default LiteraturaAppOverlay;
