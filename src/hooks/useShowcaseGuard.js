import { useCallback, useEffect, useRef } from 'react';
import {
  OBRA_VOICE_MIN_GAT,
  OBRA_VOICE_PRECARE_THRESHOLD_GAT,
} from '@/components/transmedia/transmediaConstants';

/**
 * Manages the guardrail precare flow, showcase auth checks, and Obra voice GAT consumption.
 *
 * @param {object}   deps
 * @param {boolean}  deps.isAuthenticated
 * @param {number|null} deps.availableGATokens
 * @param {Function} deps.setTokenPrecareContext
 * @param {Function} deps.trackTransmediaCreditEvent
 * @param {Function} deps.toast
 * @param {React.RefObject} deps.supportSectionRef
 */
const useShowcaseGuard = ({
  isAuthenticated,
  availableGATokens,
  setTokenPrecareContext,
  trackTransmediaCreditEvent,
  toast,
  supportSectionRef,
}) => {
  const guardrailNoticeShownRef = useRef(false);

  // Reset guardrail flag when the user's token balance refills above the threshold
  useEffect(() => {
    const safe = Number.isFinite(availableGATokens)
      ? Math.max(Math.trunc(Number(availableGATokens)), 0)
      : 0;
    if (safe > OBRA_VOICE_PRECARE_THRESHOLD_GAT) {
      guardrailNoticeShownRef.current = false;
    }
  }, [availableGATokens]);

  const showGuardrailPrecareOnce = useCallback(
    ({ message, actionLabel = 'esta vitrina', remaining = 0 } = {}) => {
      if (isAuthenticated) return;
      if (guardrailNoticeShownRef.current) return;
      guardrailNoticeShownRef.current = true;
      setTokenPrecareContext({
        mode: 'guardrail',
        message,
        actionLabel,
        remaining,
      });
    },
    [isAuthenticated, setTokenPrecareContext]
  );

  const requireShowcaseAuth = useCallback(
    (message = 'Activa tu huella para ampliar tu energía en esta vitrina.', loginPayload = undefined) => {
      if (isAuthenticated) return true;
      const remaining = Number.isFinite(availableGATokens) ? Math.max(Number(availableGATokens), 0) : 0;
      showGuardrailPrecareOnce({
        message,
        actionLabel: loginPayload?.action || 'esta vitrina',
        remaining,
      });
      toast({ description: 'Puedes seguir explorando. Si te quedas sin GAT, activa tu huella por $50/mes.' });
      return true;
    },
    [availableGATokens, isAuthenticated, showGuardrailPrecareOnce, toast]
  );

  const consumeObraVoiceGAT = useCallback(
    async ({ actionLabel = 'Hablar con La Obra por micrófono', source = 'mic', modeId = null } = {}) => {
      const normalizedMode = typeof modeId === 'string' && modeId.trim() ? modeId.trim() : 'default';
      const remainingBeforeSpend = Number.isFinite(availableGATokens)
        ? Math.max(Number(availableGATokens), 0)
        : 0;
      const shouldShowGuardrailPrecare =
        !isAuthenticated &&
        remainingBeforeSpend > 0 &&
        remainingBeforeSpend <= OBRA_VOICE_PRECARE_THRESHOLD_GAT;
      if (shouldShowGuardrailPrecare) {
        const turnsLeft = Math.max(1, Math.ceil(remainingBeforeSpend / OBRA_VOICE_MIN_GAT));
        showGuardrailPrecareOnce({
          message:
            turnsLeft === 1
              ? 'Te queda 1 pregunta de cortesía en esta vitrina antes de agotar tus GAT.'
              : `Te quedan ${turnsLeft} preguntas de cortesía en esta vitrina antes de agotar tus GAT.`,
          actionLabel,
          remaining: remainingBeforeSpend,
        });
      }
      const result = await trackTransmediaCreditEvent({
        eventKey: 'showcase_boost:obra_voice_turn',
        amount: -OBRA_VOICE_MIN_GAT,
        requiredTokens: OBRA_VOICE_MIN_GAT,
        metadata: {
          source: 'transmedia_obra_voice',
          interaction_source: source,
          mode_id: normalizedMode,
        },
        actionLabel,
      });
      return Boolean(result.ok);
    },
    [availableGATokens, isAuthenticated, showGuardrailPrecareOnce, trackTransmediaCreditEvent]
  );

  const handleCloseTokenPrecare = useCallback(() => {
    setTokenPrecareContext(null);
  }, [setTokenPrecareContext]);

  const handleTokenPrecareActivateHuella = useCallback(() => {
    setTokenPrecareContext(null);
    if (supportSectionRef.current) {
      supportSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [setTokenPrecareContext, supportSectionRef]);

  const resetGuardrailNotice = useCallback(() => {
    guardrailNoticeShownRef.current = false;
  }, []);

  return {
    showGuardrailPrecareOnce,
    requireShowcaseAuth,
    consumeObraVoiceGAT,
    handleCloseTokenPrecare,
    handleTokenPrecareActivateHuella,
    resetGuardrailNotice,
  };
};

export default useShowcaseGuard;
