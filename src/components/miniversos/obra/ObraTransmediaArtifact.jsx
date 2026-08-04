import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ObraConversationControls from '@/components/miniversos/obra/ObraConversationControls';
import ObraQuestionList from '@/components/miniversos/obra/ObraQuestionList';
import { useSilvestreVoice } from '@/hooks/useSilvestreVoice';
import { PORTAL_VOZ_MODE_QUESTIONS } from '@/lib/obraConversation';
import {
  DEFAULT_OBRA_VOICE_MODE_ID,
  OBRA_VOICE_MODES,
} from '@/components/transmedia/transmediaConstants';

const ObraTransmediaArtifact = ({ open, onClose }) => {
  const [activeModeId, setActiveModeId] = useState(DEFAULT_OBRA_VOICE_MODE_ID);
  const [elevatedStarter, setElevatedStarter] = useState(null);
  const {
    micPromptVisible,
    transcript,
    micError,
    isListening,
    showSilvestreCoins,
    isSilvestreResponding,
    isSilvestreFetching,
    isSilvestrePlaying,
    pendingSilvestreAudioUrl,
    silvestreThinkingMessage,
    isSilvestreThinkingPulse,
    getSpentSilvestreSetForMode,
    markSilvestreQuestionSpent,
    handleOpenSilvestreChat,
    handleSendSilvestrePreset,
    handlePlayPendingAudio,
    submitMicTranscript,
    stopSilvestreListening,
    stopSilvestreResponse,
  } = useSilvestreVoice();

  const activeMode = useMemo(
    () => OBRA_VOICE_MODES.find((mode) => mode.id === activeModeId) ?? OBRA_VOICE_MODES[0],
    [activeModeId],
  );
  const starters = PORTAL_VOZ_MODE_QUESTIONS[activeModeId] ?? [];
  const spentSet = getSpentSilvestreSetForMode(activeModeId);

  const closeArtifact = useCallback(() => {
    stopSilvestreListening({ discardTranscript: true });
    stopSilvestreResponse();
    onClose?.();
  }, [onClose, stopSilvestreListening, stopSilvestreResponse]);

  const handleStarter = useCallback(
    async (starter) => {
      const normalized = typeof starter === 'string' ? starter.trim() : '';
      if (!normalized) return;
      setElevatedStarter(normalized);
      markSilvestreQuestionSpent(normalized, { modeId: activeModeId });
      await handleSendSilvestrePreset(normalized, { modeId: activeModeId });
    },
    [activeModeId, handleSendSilvestrePreset, markSilvestreQuestionSpent],
  );

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeArtifact();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeArtifact, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[950] overflow-y-auto bg-slate-950 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Artefacto transmedia: conversación con La Obra"
    >
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-violet-300">Artefacto transmedia</p>
          <p className="font-display text-lg text-white">El drama</p>
        </div>
        <button
          type="button"
          onClick={closeArtifact}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-slate-200 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar artefacto transmedia"
        >
          <X size={18} />
        </button>
      </div>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:px-6">
        <section className="space-y-5 rounded-3xl border border-white/10 bg-black/35 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:p-7">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Conversación con La Obra</p>
            <h1 className="font-display text-2xl leading-tight text-white sm:text-3xl">
              Habita los sentimientos de Silvestre
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Elige un estado emocional, deja una frase que traigas encerrada y escucha cómo la obra responde desde dentro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OBRA_VOICE_MODES.map((mode) => {
              const isActive = mode.id === activeModeId;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveModeId(mode.id)}
                  className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                    isActive ? 'bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                  style={isActive ? { borderColor: mode.tint?.border, boxShadow: mode.tint?.glow } : undefined}
                  aria-pressed={isActive}
                >
                  <span className="flex items-center gap-2">
                    {mode.icon ? <mode.icon size={16} style={{ color: mode.tint?.dot }} /> : null}
                    <span className="text-xs font-semibold text-white sm:text-sm">{mode.title}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="rounded-3xl border bg-black/30 p-5"
            style={{ borderColor: activeMode?.tint?.border }}
          >
            <p className="mb-4 text-center text-xs uppercase tracking-[0.28em]" style={{ color: activeMode?.tint?.dot }}>
              Responder desde {activeMode?.title}
            </p>
            <ObraConversationControls
              ctaLabel="Pulsa para sacarlo"
              isSilvestrePlaying={isSilvestrePlaying}
              pendingSilvestreAudioUrl={pendingSilvestreAudioUrl}
              isSilvestreFetching={isSilvestreFetching}
              isSilvestreResponding={isSilvestreResponding}
              silvestreThinkingMessage={silvestreThinkingMessage}
              isSilvestreThinkingPulse={isSilvestreThinkingPulse}
              isListening={isListening}
              micPromptVisible={micPromptVisible}
              showSilvestreCoins={showSilvestreCoins}
              micError={micError}
              transcript={transcript}
              onMicClick={() => handleOpenSilvestreChat({ modeId: activeModeId })}
              onPlayPending={handlePlayPendingAudio}
              onTranscriptSubmit={() => submitMicTranscript(transcript)}
              tone={activeMode?.tint}
            />
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <ObraQuestionList
            starters={starters}
            spentSet={spentSet}
            elevatedStarter={elevatedStarter}
            onSelect={handleStarter}
            variant="stack"
            pageSize={4}
            tone={{
              borderColor: activeMode?.tint?.border,
              itemBorderColor: activeMode?.tint?.border,
              dotColor: activeMode?.tint?.dot,
              headingColor: activeMode?.tint?.dot,
            }}
            eyebrowChip={activeMode?.title}
          />
        </aside>
      </main>
    </motion.div>,
    document.body,
  );
};

export default ObraTransmediaArtifact;
