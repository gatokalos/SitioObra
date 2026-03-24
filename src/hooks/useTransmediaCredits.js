import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import {
  INITIAL_GAT_BALANCE,
  GAT_COSTS,
  SHOWCASE_REVEAL_REWARD_GAT,
  formats,
  readStoredJson,
  readStoredInt,
  readStoredBool,
  buildShowcaseEnergyFromBoosts,
} from '@/components/transmedia/transmediaConstants';
import {
  createTransmediaIdempotencyKey,
  fetchTransmediaCreditState,
  registerTransmediaCreditEvent,
} from '@/services/transmediaCreditsService';

/**
 * Manages the GAT credit economy: balances, boosts, energy, and event tracking.
 *
 * @param {object} deps
 * @param {boolean} deps.isAuthenticated
 * @param {string|null} deps.userId
 * @param {Function} deps.toast
 */
const useTransmediaCredits = ({ isAuthenticated, userId, toast }) => {
  const baseEnergyByShowcase = useMemo(() => {
    const map = {};
    const parseFromNote = (note) => {
      if (typeof note !== 'string') return 0;
      const match = note.match(/(\d+)/);
      return match ? Number.parseInt(match[1], 10) : 0;
    };
    const registerEnergy = (id, note) => {
      if (map[id]) return;
      let baseAmount = 0;
      switch (id) {
        case 'copycats':
          baseAmount = GAT_COSTS.quironFull;
          break;
        case 'miniversoGrafico':
          baseAmount = GAT_COSTS.graficoSwipe;
          break;
        case 'miniversoNovela':
          baseAmount = GAT_COSTS.novelaChapter;
          break;
        case 'miniversoSonoro':
          baseAmount = GAT_COSTS.sonoroMix;
          break;
        case 'lataza':
          baseAmount = GAT_COSTS.tazaActivation;
          break;
        case 'miniversoMovimiento':
          baseAmount = GAT_COSTS.movimientoRuta;
          break;
        case 'apps':
          baseAmount = SHOWCASE_REVEAL_REWARD_GAT.apps;
          break;
        case 'oraculo':
          baseAmount = SHOWCASE_REVEAL_REWARD_GAT.oraculo;
          break;
        default:
          baseAmount = 0;
      }
      if (!baseAmount) {
        baseAmount = parseFromNote(note);
      }
      map[id] = baseAmount;
    };
    formats.forEach((format) => registerEnergy(format.id, format.iaTokensNote));
    return map;
  }, []);

  const initialAvailableGATokens = readStoredInt('gatoencerrado:gatokens-available', INITIAL_GAT_BALANCE);
  const storedEnergy = readStoredJson('gatoencerrado:showcase-energy', null);

  const [quironSpent, setQuironSpent] = useState(false);
  const [graphicSpent, setGraphicSpent] = useState(() => readStoredBool('gatoencerrado:graphic-spent', false));
  const [novelaQuestions, setNovelaQuestions] = useState(() => readStoredInt('gatoencerrado:novela-questions', 0));
  const [sonoroSpent, setSonoroSpent] = useState(() => readStoredBool('gatoencerrado:sonoro-spent', false));
  const [tazaActivations, setTazaActivations] = useState(() => readStoredInt('gatoencerrado:taza-activations', 0));
  const [tokenPrecareContext, setTokenPrecareContext] = useState(null);
  const [availableGATokens, setAvailableGATokens] = useState(initialAvailableGATokens);
  const [showcaseEnergy, setShowcaseEnergy] = useState(() =>
    storedEnergy ? { ...baseEnergyByShowcase, ...storedEnergy } : baseEnergyByShowcase
  );
  const [showcaseBoosts, setShowcaseBoosts] = useState(() => readStoredJson('gatoencerrado:showcase-boosts', {}));

  // Seed showcase-energy in localStorage on first visit
  useEffect(() => {
    if (!safeGetItem('gatoencerrado:showcase-energy')) {
      safeSetItem('gatoencerrado:showcase-energy', JSON.stringify(baseEnergyByShowcase));
    }
  }, [baseEnergyByShowcase]);

  const applyTransmediaCreditState = useCallback(
    (state) => {
      if (!state || typeof state !== 'object') return;
      const boosts =
        state.showcase_boosts && typeof state.showcase_boosts === 'object' ? state.showcase_boosts : {};
      const safeAvailable = Number.isFinite(state.available_tokens)
        ? Number(state.available_tokens)
        : initialAvailableGATokens;
      const safeNovelaQuestions = Number.isFinite(state.novela_questions) ? Number(state.novela_questions) : 0;
      const safeTazaActivations = Number.isFinite(state.taza_activations) ? Number(state.taza_activations) : 0;

      setSonoroSpent(Boolean(state.sonoro_spent));
      setGraphicSpent(Boolean(state.graphic_spent));
      setNovelaQuestions(safeNovelaQuestions);
      setTazaActivations(safeTazaActivations);
      setShowcaseBoosts(boosts);
      setShowcaseEnergy(buildShowcaseEnergyFromBoosts(baseEnergyByShowcase, boosts));
      setAvailableGATokens(safeAvailable);

      safeSetItem('gatoencerrado:sonoro-spent', String(Boolean(state.sonoro_spent)));
      safeSetItem('gatoencerrado:graphic-spent', String(Boolean(state.graphic_spent)));
      safeSetItem('gatoencerrado:novela-questions', String(safeNovelaQuestions));
      safeSetItem('gatoencerrado:taza-activations', String(safeTazaActivations));
      safeSetItem('gatoencerrado:showcase-boosts', JSON.stringify(boosts));
      safeSetItem(
        'gatoencerrado:showcase-energy',
        JSON.stringify(buildShowcaseEnergyFromBoosts(baseEnergyByShowcase, boosts))
      );
      safeSetItem('gatoencerrado:gatokens-available', String(safeAvailable));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:gatokens-balance-update', {
            detail: {
              balance: safeAvailable,
              state,
            },
          })
        );
      }
    },
    [baseEnergyByShowcase, initialAvailableGATokens]
  );

  const syncTransmediaCredits = useCallback(async () => {
    const { state, error } = await fetchTransmediaCreditState();
    if (error) {
      console.warn('[Transmedia] No se pudo sincronizar estado de créditos:', error);
      return null;
    }
    applyTransmediaCreditState(state);
    return state;
  }, [applyTransmediaCreditState]);

  // Listen for external credit state updates (e.g. from other tabs or components)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleExternalCreditEvent = (event) => {
      const nextState = event?.detail?.state;
      if (!nextState || typeof nextState !== 'object') return;
      applyTransmediaCreditState(nextState);
    };
    window.addEventListener('gatoencerrado:external-credit-event', handleExternalCreditEvent);
    return () => window.removeEventListener('gatoencerrado:external-credit-event', handleExternalCreditEvent);
  }, [applyTransmediaCreditState]);

  // Sync credits when user logs in or out
  useEffect(() => {
    void syncTransmediaCredits();
  }, [syncTransmediaCredits, userId]);

  // Derive quironSpent from showcase boosts
  useEffect(() => {
    setQuironSpent(Boolean(showcaseBoosts?.copycats_full_unlock));
  }, [showcaseBoosts]);

  // Sync credit state from other tabs (storage) and from custom events (same tab)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key === 'gatoencerrado:novela-questions') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) setNovelaQuestions(value);
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === 'true') {
        setSonoroSpent(true);
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === null) {
        setSonoroSpent(false);
      }
      if (event.key === 'gatoencerrado:graphic-spent') {
        setGraphicSpent(event.newValue === 'true');
      }
      if (event.key === 'gatoencerrado:taza-activations') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) setTazaActivations(value);
      }
    };

    const handleCustomSpent = (event) => {
      if (event?.detail?.id === 'novela' && typeof event.detail.count === 'number') {
        setNovelaQuestions(event.detail.count);
      }
      if (event?.detail?.id === 'sonoro' && typeof event.detail.spent === 'boolean') {
        setSonoroSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'grafico' && typeof event.detail.spent === 'boolean') {
        setGraphicSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'taza' && typeof event.detail.count === 'number') {
        setTazaActivations(event.detail.count);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    };
  }, []);

  const trackTransmediaCreditEvent = useCallback(
    async ({
      eventKey,
      amount = 0,
      oncePerIdentity = false,
      metadata = {},
      requiredTokens = null,
      actionLabel = 'esta activación',
    } = {}) => {
      const expectedCost = Number.isFinite(requiredTokens)
        ? Number(requiredTokens)
        : amount < 0
          ? Math.abs(Number(amount))
          : 0;
      const missing = Math.max(expectedCost - availableGATokens, 0);
      if (expectedCost > 0 && missing > 0) {
        if (!isAuthenticated) {
          setTokenPrecareContext({ required: expectedCost, missing, actionLabel });
          return { ok: false, state: null, duplicate: false, reason: 'insufficient' };
        }
        toast({ description: `${actionLabel} requiere ${expectedCost} GATokens. Te faltan ${missing}.` });
        return { ok: false, state: null, duplicate: false, reason: 'insufficient' };
      }

      const { state, error, duplicate } = await registerTransmediaCreditEvent({
        eventKey,
        amount,
        oncePerIdentity,
        metadata,
        idempotencyKey: createTransmediaIdempotencyKey(eventKey),
      });
      if (error) {
        const errorText = String(error?.message ?? '').toLowerCase();
        if (errorText.includes('insufficient_tokens') || errorText.includes('insufficient tokens')) {
          const refreshed = await syncTransmediaCredits();
          const available = Number.isFinite(refreshed?.available_tokens)
            ? Number(refreshed.available_tokens)
            : availableGATokens;
          const expected = expectedCost > 0 ? expectedCost : Math.max(Math.abs(Number(amount)), 0);
          const nextMissing = Math.max(expected - available, 0);
          if (!isAuthenticated) {
            setTokenPrecareContext({ required: expected, missing: nextMissing, actionLabel });
            return { ok: false, state: refreshed, duplicate: false, reason: 'insufficient' };
          }
          toast({ description: `${actionLabel} requiere ${expected} GATokens. Te faltan ${nextMissing}.` });
          return { ok: false, state: refreshed, duplicate: false, reason: 'insufficient' };
        }
        console.warn('[Transmedia] No se pudo registrar evento de créditos:', { eventKey, error });
        return { ok: false, state: null, duplicate: false };
      }
      applyTransmediaCreditState(state);
      return { ok: true, state, duplicate: Boolean(duplicate) };
    },
    [applyTransmediaCreditState, availableGATokens, isAuthenticated, syncTransmediaCredits, toast]
  );

  return {
    baseEnergyByShowcase,
    availableGATokens,
    sonoroSpent,
    setSonoroSpent,
    graphicSpent,
    setGraphicSpent,
    novelaQuestions,
    setNovelaQuestions,
    tazaActivations,
    setTazaActivations,
    showcaseBoosts,
    setShowcaseBoosts,
    showcaseEnergy,
    setShowcaseEnergy,
    tokenPrecareContext,
    setTokenPrecareContext,
    quironSpent,
    setQuironSpent,
    syncTransmediaCredits,
    trackTransmediaCreditEvent,
  };
};

export default useTransmediaCredits;
