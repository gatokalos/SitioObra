import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MoreHorizontal, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ObraConversationControls = ({
  ctaLabel = 'Habla con la obra',
  isSilvestrePlaying = false,
  pendingSilvestreAudioUrl = null,
  isSilvestreFetching = false,
  isSilvestreResponding = false,
  silvestreThinkingMessage = 'La Obra esta pensando...',
  isSilvestreThinkingPulse = false,
  isListening = false,
  micPromptVisible = false,
  showSilvestreCoins = false,
  micError = '',
  transcript = '',
  secondaryCtaVisible = false,
  secondaryCtaCopy = 'Leer del guion',
  secondaryCtaDisabled = false,
  secondaryCtaEmphasis = 'soft',
  onMicClick,
  onPlayPending,
  onSecondaryCtaClick,
  tone = null,
  className = '',
}) => {
  const isSilvestreThinking = isSilvestreFetching || isSilvestreResponding;
  const handlePrimaryClick = pendingSilvestreAudioUrl ? onPlayPending : onMicClick;
  const statusLabel = isSilvestrePlaying
    ? 'Te estoy respondiendo...'
    : pendingSilvestreAudioUrl
      ? 'Reproducir respuesta'
      : isSilvestreThinking
        ? silvestreThinkingMessage
        : isListening
          ? 'Pulsa otra vez para enviar'
          : micPromptVisible
            ? 'Pulsa para hablar o escoge una frase'
            : ctaLabel;
  const hasErrorState = Boolean(micError) && !isListening && !isSilvestreThinking;
  const baseBorder = tone?.border || 'rgba(196,181,253,0.6)';
  const baseDot = tone?.dot || 'rgba(196,181,253,0.95)';
  const baseGlow = tone?.glow || '0 0 45px rgba(197,108,255,0.75)';
  const primaryStyle = hasErrorState
    ? {
        borderColor: 'rgba(248,113,113,0.72)',
        backgroundColor: 'rgba(127,29,29,0.22)',
        color: 'rgba(254,202,202,0.95)',
        '--silvestre-cta-glow-strong': '0 0 40px rgba(248,113,113,0.52)',
        '--silvestre-cta-glow-soft': '0 0 18px rgba(248,113,113,0.28)',
        '--silvestre-wave-color': 'rgba(254,202,202,0.9)',
      }
    : {
        borderColor: baseBorder,
        backgroundColor: 'rgba(15,23,42,0.35)',
        color: baseDot,
        '--silvestre-cta-glow-strong': baseGlow,
        '--silvestre-cta-glow-soft': baseGlow,
        '--silvestre-wave-color': baseDot,
      };
  const statusStyle = hasErrorState ? { color: 'rgba(252,165,165,0.95)' } : { color: baseDot };
  const secondaryCtaClassName =
    secondaryCtaEmphasis === 'glow'
      ? 'border-amber-200/70 bg-gradient-to-r from-amber-300/20 via-fuchsia-300/20 to-violet-300/20 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.32)] animate-pulse'
      : secondaryCtaEmphasis === 'action'
        ? 'border-cyan-200/60 bg-cyan-400/12 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.22)]'
        : 'border-white/20 bg-black/35 text-slate-100';

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="silvestre-cta relative flex h-20 w-20 items-center justify-center rounded-full border border-purple-300/60 bg-purple-500/10 text-purple-50 shadow-[0_0_45px_rgba(197,108,255,0.75)] transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          style={primaryStyle}
          onClick={handlePrimaryClick}
          aria-label={statusLabel}
          disabled={isSilvestreThinking}
        >
          {showSilvestreCoins ? (
            <div className="pointer-events-none absolute inset-0 z-10">
              {Array.from({ length: 7 }).map((_, index) => {
                const offsetX = (index - 3) * 12;
                const offsetY = -20 - index * 6;
                return (
                  <motion.span
                    key={`silvestre-coin-${index}`}
                    className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.55)]"
                    initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
                    animate={{ opacity: 0, scale: 1.1, x: offsetX, y: offsetY, rotate: 90 + index * 30 }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.03 }}
                  />
                );
              })}
            </div>
          ) : null}
          {isSilvestrePlaying ? (
            <span className="silvestre-mic-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          ) : null}
          {!isSilvestrePlaying ? (
            pendingSilvestreAudioUrl ? (
              <Play className="h-8 w-8 relative z-10" />
            ) : isSilvestreThinking ? (
              <MoreHorizontal
                className={`h-8 w-8 relative z-10 transition-all duration-500 ${
                  isSilvestreThinkingPulse ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                }`}
              />
            ) : isListening ? (
              <Square className="h-8 w-8 relative z-10" />
            ) : (
              <Mic className="h-8 w-8 relative z-10" />
            )
          ) : null}
        </Button>
        <span
          aria-live="polite"
          className={`text-xs uppercase tracking-[0.35em] text-purple-200 text-center ${
            isSilvestreThinking ? 'thinking-blink' : ''
          }`}
          style={statusStyle}
        >
          {statusLabel}
        </span>
        {secondaryCtaVisible ? (
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            disabled={secondaryCtaDisabled}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 ${secondaryCtaClassName}`}
          >
            {secondaryCtaCopy}
          </button>
        ) : null}
      </div>

      {micError && !isListening && !transcript ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="text-xs uppercase tracking-[0.35em] text-red-300">Sin micrófono</p>
          <p>Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.</p>
        </div>
      ) : null}
      {transcript ? (
        <div className="mt-4 rounded-2xl border border-purple-500/40 bg-white/5 p-4 text-sm text-slate-100">
          <p className="break-words">{transcript}</p>
        </div>
      ) : null}
      {pendingSilvestreAudioUrl ? (
        <div className="mt-4 rounded-2xl border border-purple-400/40 bg-white/5 p-4 text-sm text-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-purple-200">Audio listo</p>
            <p>Toca reproducir para escuchar la respuesta.</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onPlayPending} className="shrink-0">
            Reproducir
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ObraConversationControls;
