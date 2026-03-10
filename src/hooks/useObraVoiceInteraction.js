import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  OBRA_VOICE_MODES,
  DEFAULT_OBRA_VOICE_MODE_ID,
  MOBILE_OBRA_SECONDARY_CTA_STATES,
  normalizeSilvestrePrompt,
  shuffleArray,
} from '@/components/transmedia/transmediaConstants';
import { PORTAL_VOZ_MODE_QUESTIONS, SILVESTRE_TRIGGER_QUESTIONS } from '@/lib/obraConversation';

/**
 * Manages Obra voice interaction state: active mode, mobile CTA flow,
 * scroll-to-section refs, and Silvestre prompt dispatch.
 *
 * @param {object}   deps
 * @param {boolean}  deps.isMobileViewport
 * @param {object|null} deps.activeDefinition
 * @param {boolean}  deps.isListening
 * @param {boolean}  deps.isSilvestreFetching
 * @param {boolean}  deps.isSilvestreResponding
 * @param {boolean}  deps.isSilvestrePlaying
 * @param {string|null} deps.pendingSilvestreAudioUrl
 * @param {string}   deps.transcript
 * @param {Function} deps.consumeObraVoiceGAT
 * @param {Function} deps.incrementObraModeUsage
 * @param {Function} deps.getSpentSilvestreSetForMode
 * @param {Function} deps.markSilvestreQuestionSpent
 * @param {Function} deps.handleSendSilvestrePreset
 * @param {Function} deps.handleOpenSilvestreChat
 */
const useObraVoiceInteraction = ({
  isMobileViewport,
  activeDefinition,
  isListening,
  isSilvestreFetching,
  isSilvestreResponding,
  isSilvestrePlaying,
  pendingSilvestreAudioUrl,
  transcript,
  consumeObraVoiceGAT,
  incrementObraModeUsage,
  getSpentSilvestreSetForMode,
  markSilvestreQuestionSpent,
  handleSendSilvestrePreset,
  handleOpenSilvestreChat,
}) => {
  const [activeObraModeId, setActiveObraModeId] = useState(DEFAULT_OBRA_VOICE_MODE_ID);
  const [elevatedSilvestreStarter, setElevatedSilvestreStarter] = useState(null);
  const [mobileObraSecondaryCtaState, setMobileObraSecondaryCtaState] = useState(
    MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT
  );
  const [mobileObraReplayPrompt, setMobileObraReplayPrompt] = useState('');
  const [mobileAwaitingEmotionSwitch, setMobileAwaitingEmotionSwitch] = useState(false);

  const obraConversationControlsRef = useRef(null);
  const obraModesRef = useRef(null);
  const obraDetonadoresRef = useRef(null);
  const wasSilvestrePlayingRef = useRef(false);
  const previousObraModeIdRef = useRef(DEFAULT_OBRA_VOICE_MODE_ID);

  const isObraVoiceBusy =
    isListening ||
    isSilvestreFetching ||
    isSilvestreResponding ||
    isSilvestrePlaying ||
    Boolean(pendingSilvestreAudioUrl);

  const tragicoStarters = useMemo(() => {
    if (!activeDefinition || activeDefinition.type !== 'tragedia') {
      return [];
    }
    const allModeQuestions = OBRA_VOICE_MODES.flatMap(
      (mode) => PORTAL_VOZ_MODE_QUESTIONS[mode.id] ?? []
    );
    const base = [
      ...allModeQuestions,
      ...(activeDefinition.conversationStarters ?? []),
      ...SILVESTRE_TRIGGER_QUESTIONS,
    ];
    const uniqueQuestions = Array.from(
      new Set(
        base
          .map((question) => (typeof question === 'string' ? question.trim() : ''))
          .filter(Boolean)
      )
    );
    return shuffleArray(uniqueQuestions);
  }, [activeDefinition]);

  const tragicoStarterSet = useMemo(
    () => new Set(tragicoStarters.map((starter) => normalizeSilvestrePrompt(starter)).filter(Boolean)),
    [tragicoStarters]
  );

  // Reset mobile obra state when activeDefinition changes away from tragedia
  useEffect(() => {
    if (!activeDefinition || activeDefinition.type !== 'tragedia') {
      setElevatedSilvestreStarter(null);
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileObraReplayPrompt('');
      setMobileAwaitingEmotionSwitch(false);
      wasSilvestrePlayingRef.current = false;
    }
  }, [activeDefinition]);

  // Update secondary CTA state when mode changes on mobile
  useEffect(() => {
    const previousModeId = previousObraModeIdRef.current;
    if (previousModeId === activeObraModeId) return;

    if (!isMobileViewport || activeDefinition?.type !== 'tragedia') {
      previousObraModeIdRef.current = activeObraModeId;
      return;
    }

    if (
      mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION &&
      mobileAwaitingEmotionSwitch
    ) {
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE);
      setMobileAwaitingEmotionSwitch(false);
      previousObraModeIdRef.current = activeObraModeId;
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE) {
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileObraReplayPrompt('');
      setMobileAwaitingEmotionSwitch(false);
    }

    previousObraModeIdRef.current = activeObraModeId;
  }, [
    activeDefinition,
    activeObraModeId,
    isMobileViewport,
    mobileAwaitingEmotionSwitch,
    mobileObraSecondaryCtaState,
  ]);

  // Trigger replay prompt after Silvestre finishes playing
  useEffect(() => {
    const wasPlaying = wasSilvestrePlayingRef.current;
    const isPlaybackIdle =
      !isSilvestrePlaying &&
      !isSilvestreResponding &&
      !isSilvestreFetching &&
      !pendingSilvestreAudioUrl;
    if (
      wasPlaying &&
      isPlaybackIdle &&
      activeDefinition?.type === 'tragedia' &&
      isMobileViewport
    ) {
      const replayCandidate =
        normalizeSilvestrePrompt(transcript) || normalizeSilvestrePrompt(elevatedSilvestreStarter);
      if (replayCandidate) {
        setMobileObraReplayPrompt(replayCandidate);
        setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION);
        setMobileAwaitingEmotionSwitch(true);
      }
    }
    wasSilvestrePlayingRef.current = isSilvestrePlaying;
  }, [
    activeDefinition,
    elevatedSilvestreStarter,
    isSilvestreFetching,
    isMobileViewport,
    isSilvestrePlaying,
    isSilvestreResponding,
    pendingSilvestreAudioUrl,
    transcript,
  ]);

  const scrollToObraConversationControls = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraConversationControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [isMobileViewport]);

  const scrollToObraModes = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraModesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isMobileViewport]);

  const scrollToObraDetonadores = useCallback(() => {
    if (typeof window === 'undefined' || !isMobileViewport) return;
    window.requestAnimationFrame(() => {
      obraDetonadoresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [isMobileViewport]);

  const sendSilvestrePromptToObra = useCallback(
    async (prompt, { modeId = null } = {}) => {
      const normalizedPrompt = normalizeSilvestrePrompt(prompt);
      if (!normalizedPrompt) return false;
      const resolvedModeId =
        typeof modeId === 'string' && modeId.trim() ? modeId.trim() : activeObraModeId;
      const isStarterPrompt = tragicoStarterSet.has(normalizedPrompt);
      const spentSet = getSpentSilvestreSetForMode(resolvedModeId);
      if (isStarterPrompt && spentSet.has(normalizedPrompt)) return false;
      const canProceed = await consumeObraVoiceGAT({
        actionLabel: 'Enviar una pregunta a La Obra',
        source: 'preset',
        modeId: resolvedModeId,
      });
      if (!canProceed) return false;
      incrementObraModeUsage(resolvedModeId);
      if (isStarterPrompt) {
        markSilvestreQuestionSpent(normalizedPrompt, { modeId: resolvedModeId });
      }
      setElevatedSilvestreStarter(normalizedPrompt);
      setMobileObraReplayPrompt(normalizedPrompt);
      setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
      setMobileAwaitingEmotionSwitch(false);
      scrollToObraConversationControls();
      void handleSendSilvestrePreset(normalizedPrompt, { modeId: resolvedModeId });
      return true;
    },
    [
      activeObraModeId,
      consumeObraVoiceGAT,
      getSpentSilvestreSetForMode,
      handleSendSilvestrePreset,
      incrementObraModeUsage,
      markSilvestreQuestionSpent,
      tragicoStarterSet,
      scrollToObraConversationControls,
    ]
  );

  const handleUseSilvestreStarter = useCallback(
    async (starter, modeId = null) => {
      await sendSilvestrePromptToObra(starter, { modeId });
    },
    [sendSilvestrePromptToObra]
  );

  const handleMobileObraSecondaryCta = useCallback(async () => {
    if (!isMobileViewport || activeDefinition?.type !== 'tragedia') return;
    if (isObraVoiceBusy) return;

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT) {
      scrollToObraDetonadores();
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.TRY_OTHER_EMOTION) {
      setMobileAwaitingEmotionSwitch(true);
      scrollToObraModes();
      return;
    }

    if (mobileObraSecondaryCtaState === MOBILE_OBRA_SECONDARY_CTA_STATES.LAUNCH_PHRASE) {
      const promptToReplay =
        normalizeSilvestrePrompt(mobileObraReplayPrompt) ||
        normalizeSilvestrePrompt(transcript) ||
        normalizeSilvestrePrompt(elevatedSilvestreStarter);
      if (!promptToReplay) {
        setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
        setMobileAwaitingEmotionSwitch(false);
        return;
      }
      await sendSilvestrePromptToObra(promptToReplay, { modeId: activeObraModeId });
    }
  }, [
    activeDefinition,
    activeObraModeId,
    elevatedSilvestreStarter,
    isMobileViewport,
    isObraVoiceBusy,
    mobileObraReplayPrompt,
    mobileObraSecondaryCtaState,
    scrollToObraDetonadores,
    scrollToObraModes,
    sendSilvestrePromptToObra,
    transcript,
  ]);

  const handleOpenSilvestreChatCta = useCallback(async (modeId = null) => {
    const resolvedModeId =
      typeof modeId === 'string' && modeId.trim() ? modeId.trim() : activeObraModeId;
    const shouldChargeVoiceTurn =
      !isListening &&
      !isSilvestrePlaying &&
      !pendingSilvestreAudioUrl &&
      !isSilvestreFetching &&
      !isSilvestreResponding;

    if (shouldChargeVoiceTurn) {
      const canProceed = await consumeObraVoiceGAT({
        actionLabel: 'Hablar con La Obra por micrófono',
        source: 'mic',
        modeId: resolvedModeId,
      });
      if (!canProceed) return;
      incrementObraModeUsage(resolvedModeId);
    }
    setMobileObraSecondaryCtaState(MOBILE_OBRA_SECONDARY_CTA_STATES.READ_SCRIPT);
    setMobileAwaitingEmotionSwitch(false);
    handleOpenSilvestreChat({ modeId: resolvedModeId });
    scrollToObraConversationControls();
  }, [
    activeObraModeId,
    consumeObraVoiceGAT,
    handleOpenSilvestreChat,
    incrementObraModeUsage,
    isListening,
    isSilvestreFetching,
    isSilvestrePlaying,
    isSilvestreResponding,
    pendingSilvestreAudioUrl,
    scrollToObraConversationControls,
  ]);

  return {
    activeObraModeId,
    setActiveObraModeId,
    elevatedSilvestreStarter,
    mobileObraSecondaryCtaState,
    setMobileObraSecondaryCtaState,
    mobileObraReplayPrompt,
    mobileAwaitingEmotionSwitch,
    setMobileAwaitingEmotionSwitch,
    obraConversationControlsRef,
    obraModesRef,
    obraDetonadoresRef,
    isObraVoiceBusy,
    tragicoStarters,
    tragicoStarterSet,
    sendSilvestrePromptToObra,
    handleUseSilvestreStarter,
    handleMobileObraSecondaryCta,
    handleOpenSilvestreChatCta,
    scrollToObraConversationControls,
    scrollToObraModes,
    scrollToObraDetonadores,
  };
};

export default useObraVoiceInteraction;
