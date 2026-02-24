import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const SILVESTRE_QUESTIONS_STORAGE_KEY = 'gatoencerrado:silvestre-questions-spent';
const MODES = [
  'lectura-profunda',
  'artista',
  'claro-directo',
  'tiktoker',
  'util-hoy',
  'poeta',
];
const DEFAULT_MODE = 'lectura-profunda';
const ENABLE_OBRA_VOICE_FALLBACK =
  String(import.meta.env.VITE_OBRA_ENABLE_VOICE_FALLBACK || '').toLowerCase() === 'true';
const normalizeMode = (value) => {
  const key = (value || '').toString().toLowerCase().trim();
  return MODES.includes(key) ? key : DEFAULT_MODE;
};

const readStoredJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage?.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const DEFAULT_THINKING_MESSAGE = 'La Obra esta pensando...';
const THINKING_MESSAGE_PHASES = [
  { afterMs: 0, text: 'Gracias por preguntar...' },
  { afterMs: 6500, text: 'Sigo pensando...' },
  { afterMs: 9999, text: 'Ya lo tengo...' },
];

const resolveThinkingMessage = (elapsedMs) => {
  let next = DEFAULT_THINKING_MESSAGE;
  for (const phase of THINKING_MESSAGE_PHASES) {
    if (elapsedMs >= phase.afterMs) {
      next = phase.text;
    } else {
      break;
    }
  }
  return next;
};

export const useSilvestreVoice = () => {
  const { user } = useAuth();
  const initialSpentSilvestreQuestions = readStoredJson(SILVESTRE_QUESTIONS_STORAGE_KEY, []);

  const [micPromptVisible, setMicPromptVisible] = useState(false);
  const [hasShownMicPrompt, setHasShownMicPrompt] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSilvestreCoins, setShowSilvestreCoins] = useState(false);
  const [isSilvestreResponding, setIsSilvestreResponding] = useState(false);
  const [isSilvestreFetching, setIsSilvestreFetching] = useState(false);
  const [isSilvestrePlaying, setIsSilvestrePlaying] = useState(false);
  const [pendingSilvestreAudioUrl, setPendingSilvestreAudioUrl] = useState(null);
  const [silvestreThinkingMessage, setSilvestreThinkingMessage] = useState(DEFAULT_THINKING_MESSAGE);
  const [isSilvestreThinkingPulse, setIsSilvestreThinkingPulse] = useState(false);
  const [spentSilvestreQuestions, setSpentSilvestreQuestions] = useState(
    Array.isArray(initialSpentSilvestreQuestions) ? initialSpentSilvestreQuestions : []
  );

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const micTimeoutRef = useRef(null);
  const silvestreAudioRef = useRef(null);
  const silvestreAudioUrlRef = useRef(null);
  const silvestreRequestIdRef = useRef(0);
  const silvestreAbortRef = useRef(null);
  const ignoreNextTranscriptRef = useRef(false);
  const modeRef = useRef(null);
  const thinkingMessageTimerRef = useRef(null);
  const thinkingPulseTimerRef = useRef(null);
  const thinkingSoundTimerRef = useRef(null);
  const thinkingAudioContextRef = useRef(null);

  const spentSilvestreSet = useMemo(
    () => new Set(spentSilvestreQuestions),
    [spentSilvestreQuestions]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(
      SILVESTRE_QUESTIONS_STORAGE_KEY,
      JSON.stringify(spentSilvestreQuestions)
    );
  }, [spentSilvestreQuestions]);

  const markSilvestreQuestionSpent = useCallback((question) => {
    if (!question) return;
    setSpentSilvestreQuestions((prev) => {
      if (prev.includes(question)) return prev;
      return [...prev, question];
    });
  }, []);

  const stopSilvestreAudio = useCallback(() => {
    if (silvestreAudioRef.current) {
      silvestreAudioRef.current.pause();
      silvestreAudioRef.current.src = '';
      silvestreAudioRef.current = null;
    }
    if (silvestreAudioUrlRef.current) {
      URL.revokeObjectURL(silvestreAudioUrlRef.current);
      silvestreAudioUrlRef.current = null;
    }
    setIsSilvestrePlaying(false);
    setPendingSilvestreAudioUrl(null);
  }, []);

  const stopSilvestreResponse = useCallback(() => {
    if (silvestreAbortRef.current) {
      silvestreAbortRef.current.abort();
      silvestreAbortRef.current = null;
    }
    silvestreRequestIdRef.current += 1;
    stopSilvestreAudio();
    setIsSilvestreFetching(false);
    setIsSilvestreResponding(false);
  }, [stopSilvestreAudio]);

  const recordObraChat = useCallback(
    async ({ question, answer, source }) => {
      if (!question) return;
      const shouldRecordObraChat = false;
      if (!shouldRecordObraChat) {
        return;
      }
      try {
        const anonId = ensureAnonId();
        const { error } = await supabasePublic.from('miniverso_obra_interactions').insert({
          interaction_type: 'chat',
          question,
          answer: answer || null,
          source: source || null,
          user_id: user?.id ?? null,
          anon_id: anonId ?? null,
        });
        if (error) {
          console.error('[La Obra Chat] Supabase insert error:', error);
        }
      } catch (error) {
        console.error('[La Obra Chat] Supabase insert failed:', error);
      }
    },
    [user]
  );

  const playThinkingTone = useCallback(({ frequency = 360, gain = 0.014, duration = 0.12 } = {}) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!thinkingAudioContextRef.current) {
        thinkingAudioContextRef.current = new AudioContextClass();
      }
      const context = thinkingAudioContextRef.current;
      if (context.state === 'suspended') {
        void context.resume();
      }
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    } catch (error) {
      // Silent fail: this feedback should never block voice flow.
    }
  }, []);

  useEffect(() => {
    const isSilvestreThinking =
      (isSilvestreFetching || isSilvestreResponding) &&
      !isSilvestrePlaying &&
      !pendingSilvestreAudioUrl;

    if (!isSilvestreThinking) {
      setSilvestreThinkingMessage(DEFAULT_THINKING_MESSAGE);
      setIsSilvestreThinkingPulse(false);
      if (thinkingMessageTimerRef.current) {
        clearInterval(thinkingMessageTimerRef.current);
        thinkingMessageTimerRef.current = null;
      }
      if (thinkingPulseTimerRef.current) {
        clearInterval(thinkingPulseTimerRef.current);
        thinkingPulseTimerRef.current = null;
      }
      if (thinkingSoundTimerRef.current) {
        clearInterval(thinkingSoundTimerRef.current);
        thinkingSoundTimerRef.current = null;
      }
      return undefined;
    }

    const startedAt = Date.now();
    const updateThinkingMessage = () => {
      const elapsedMs = Date.now() - startedAt;
      setSilvestreThinkingMessage(resolveThinkingMessage(elapsedMs));
    };

    updateThinkingMessage();
    setIsSilvestreThinkingPulse(true);
    playThinkingTone({ frequency: 420, gain: 0.02, duration: 0.16 });

    thinkingMessageTimerRef.current = setInterval(updateThinkingMessage, 900);
    thinkingPulseTimerRef.current = setInterval(() => {
      setIsSilvestreThinkingPulse((prev) => !prev);
    }, 700);
    thinkingSoundTimerRef.current = setInterval(() => {
      playThinkingTone();
    }, 4800);

    return () => {
      if (thinkingMessageTimerRef.current) {
        clearInterval(thinkingMessageTimerRef.current);
        thinkingMessageTimerRef.current = null;
      }
      if (thinkingPulseTimerRef.current) {
        clearInterval(thinkingPulseTimerRef.current);
        thinkingPulseTimerRef.current = null;
      }
      if (thinkingSoundTimerRef.current) {
        clearInterval(thinkingSoundTimerRef.current);
        thinkingSoundTimerRef.current = null;
      }
    };
  }, [
    isSilvestreFetching,
    isSilvestreResponding,
    isSilvestrePlaying,
    pendingSilvestreAudioUrl,
    playThinkingTone,
  ]);

  const sendTranscript = useCallback(
    async (message, options = {}) => {
      if (!message) {
        return false;
      }
      const source = options.source || null;
      let requestId = 0;
      try {
        if (silvestreAbortRef.current) {
          silvestreAbortRef.current.abort();
        }
        stopSilvestreAudio();
        const controller = new AbortController();
        silvestreAbortRef.current = controller;
        requestId = (silvestreRequestIdRef.current += 1);
        setIsSilvestreFetching(true);
        setIsSilvestreResponding(true);
        const apiBase = import.meta.env.VITE_OBRA_API_URL;
        const userId = user?.id ?? 'anonymous';
        const mode_id = normalizeMode(options.modeId || options.selectedMode);
        const candidates = [
          {
            endpoint: '/api/obra-conciencia',
            payload: { pregunta: message, user_id: userId, mode_id },
            label: 'conciencia',
          },
        ];
        if (ENABLE_OBRA_VOICE_FALLBACK) {
          candidates.push({
            endpoint: '/api/obra-voz',
            payload: { mensaje: message, mode_id, user_id: userId },
            label: 'voz (fallback)',
          });
        }

        let audioBlob = null;
        let responseText = null;
        let lastError = null;

        for (const candidate of candidates) {
          try {
            const response = await fetch(`${apiBase}${candidate.endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(candidate.payload),
              signal: controller.signal,
            });
            if (requestId !== silvestreRequestIdRef.current) {
              return false;
            }
            if (!response.ok) {
              const candidateError = new Error(`${candidate.label} responded ${response.status}`);
              candidateError.status = response.status;
              candidateError.endpoint = candidate.endpoint;
              // If the backend answered with an HTTP error, don't fan-out to another
              // model endpoint for the same user turn.
              candidateError.noFallback = true;
              throw candidateError;
            }
            responseText =
              response.headers.get('x-silvestre-text') ||
              response.headers.get('x-silvestre-answer') ||
              null;
            const blob = await response.blob();
            if (requestId !== silvestreRequestIdRef.current) {
              return false;
            }
            if (!blob || !(blob.type || '').startsWith('audio/')) {
              throw new Error(`${candidate.label} returned non-audio payload (${blob?.type || 'unknown'})`);
            }
            audioBlob = blob;
            break;
          } catch (error) {
            console.error('[Silvestre Voice] candidate error:', error);
            lastError = error;
            if (error?.noFallback) {
              break;
            }
          }
        }

        if (!audioBlob) {
          throw lastError || new Error('No se pudo obtener audio de La Obra');
        }
        if (requestId === silvestreRequestIdRef.current) {
          setIsSilvestreFetching(false);
        }
        await recordObraChat({ question: message, answer: responseText, source });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.playsInline = true;
        silvestreAudioRef.current = audio;
        silvestreAudioUrlRef.current = audioUrl;
        audio.addEventListener(
          'play',
          () => {
            setIsSilvestrePlaying(true);
          },
          { once: true }
        );
        audio.addEventListener(
          'ended',
          () => {
            if (silvestreAudioUrlRef.current === audioUrl) {
              URL.revokeObjectURL(audioUrl);
              silvestreAudioUrlRef.current = null;
              silvestreAudioRef.current = null;
              setIsSilvestreResponding(false);
              setIsSilvestrePlaying(false);
              setShowSilvestreCoins(true);
              setTimeout(() => setShowSilvestreCoins(false), 1200);
              setPendingSilvestreAudioUrl(null);
            }
          },
          { once: true }
        );
        try {
          await audio.play();
        } catch (playError) {
          if (playError?.name === 'NotAllowedError') {
            setPendingSilvestreAudioUrl(audioUrl);
            setIsSilvestreResponding(false);
            setIsSilvestrePlaying(false);
            setMicError('Toca “Reproducir” para escuchar la respuesta.');
            return true;
          }
          if (silvestreAudioUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            silvestreAudioUrlRef.current = null;
            silvestreAudioRef.current = null;
            setIsSilvestreResponding(false);
            setIsSilvestrePlaying(false);
          }
          throw playError;
        }
        setMicError('');
        return true;
      } catch (error) {
        if (error?.name === 'AbortError') {
          if (requestId === silvestreRequestIdRef.current) {
            setIsSilvestreFetching(false);
            setIsSilvestreResponding(false);
          }
          return false;
        }
        console.error('[Silvestre Voice] Error sending transcript:', error);
        if (error?.status === 429) {
          setMicError('La IA alcanzó su límite de cuota. Intenta más tarde mientras se restablece el servicio.');
        } else if (error?.status >= 500) {
          setMicError('La IA de La Obra no está disponible en este momento. Intenta nuevamente más tarde.');
        } else {
          setMicError('No pudimos enviar tu mensaje a Silvestre. Intenta nuevamente más tarde.');
        }
        if (requestId === silvestreRequestIdRef.current) {
          setIsSilvestreFetching(false);
          setIsSilvestreResponding(false);
        }
        return false;
      }
    },
    [recordObraChat, stopSilvestreAudio, user]
  );

  const stopSilvestreListening = useCallback(
    (options = {}) => {
      if (options.discardTranscript) {
        transcriptRef.current = '';
        setTranscript('');
        ignoreNextTranscriptRef.current = true;
      }
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('[Silvestre Voice] stop error:', err);
        }
      }
      setIsListening(false);
    },
    [isListening]
  );

  const handlePlayPendingAudio = useCallback(async () => {
    if (!pendingSilvestreAudioUrl) return;
    let audio = silvestreAudioRef.current;
    if (!audio || silvestreAudioUrlRef.current !== pendingSilvestreAudioUrl) {
      audio = new Audio(pendingSilvestreAudioUrl);
      silvestreAudioRef.current = audio;
      silvestreAudioUrlRef.current = pendingSilvestreAudioUrl;
      audio.addEventListener(
        'ended',
        () => {
          if (silvestreAudioUrlRef.current === pendingSilvestreAudioUrl) {
            URL.revokeObjectURL(pendingSilvestreAudioUrl);
            silvestreAudioUrlRef.current = null;
            silvestreAudioRef.current = null;
            setIsSilvestreResponding(false);
            setIsSilvestrePlaying(false);
            setPendingSilvestreAudioUrl(null);
          }
        },
        { once: true }
      );
    }
    try {
      await audio.play();
      setIsSilvestrePlaying(true);
      setIsSilvestreResponding(false);
      setPendingSilvestreAudioUrl(null);
      setMicError('');
    } catch (err) {
      console.error('[Silvestre Voice] play pending error:', err);
      setMicError('No pudimos reproducir el audio. Intenta tocar de nuevo.');
    }
  }, [pendingSilvestreAudioUrl]);

  const handleOpenSilvestreChat = useCallback((options = {}) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (options && typeof options === 'object') {
      modeRef.current = options.modeId || options.selectedMode || null;
    } else if (typeof options === 'string') {
      modeRef.current = options;
    } else {
      modeRef.current = null;
    }
    if (
      pendingSilvestreAudioUrl &&
      !isListening &&
      !isSilvestrePlaying &&
      !isSilvestreResponding &&
      !isSilvestreFetching
    ) {
      handlePlayPendingAudio();
      return;
    }
    if (isSilvestreFetching) {
      return;
    }

    if (!hasShownMicPrompt) {
      setMicPromptVisible(true);
      setHasShownMicPrompt(true);
    } else if (!micPromptVisible) {
      setMicPromptVisible(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(
        'Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.'
      );
      window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const text = results.map((result) => result[0]?.transcript ?? '').join(' ');
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = (event) => {
        console.error('[Silvestre Voice] recognition error:', event);
        setMicError('No pudimos acceder al micrófono. Intenta nuevamente.');
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        if (ignoreNextTranscriptRef.current) {
          ignoreNextTranscriptRef.current = false;
          return;
        }
        const finalText = transcriptRef.current.trim();
        if (finalText) {
          sendTranscript(finalText, { source: 'mic', modeId: modeRef.current });
          transcriptRef.current = '';
        }
      };
      recognitionRef.current = recognition;
    }

    if (isListening) {
      stopSilvestreListening();
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setMicError('');
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
      micTimeoutRef.current = setTimeout(() => {
        stopSilvestreListening();
      }, 45000);
    } catch (error) {
      console.error('[Silvestre Voice] start error:', error);
      setMicError('No pudimos abrir el micrófono. Intenta nuevamente.');
    }

    window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
  }, [
    handlePlayPendingAudio,
    hasShownMicPrompt,
    isListening,
    isSilvestrePlaying,
    isSilvestreResponding,
    isSilvestreFetching,
    micPromptVisible,
    pendingSilvestreAudioUrl,
    sendTranscript,
    stopSilvestreListening,
  ]);

  const handleSendSilvestrePreset = useCallback(
    async (starter, options = {}) => {
      if (!starter) {
        return;
      }

      if (isListening) {
        stopSilvestreListening({ discardTranscript: true });
      }

      const modeId = options.modeId || options.selectedMode || null;
      setTranscript(starter);
      await sendTranscript(starter, { source: 'preset', modeId });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:open-silvestre', {
            detail: { source: 'preset', mensaje: starter, mode_id: normalizeMode(modeId) },
          })
        );
      }
    },
    [isListening, sendTranscript, stopSilvestreListening]
  );

  const resetSilvestreQuestions = useCallback(() => {
    setSpentSilvestreQuestions([]);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(SILVESTRE_QUESTIONS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
      if (thinkingMessageTimerRef.current) {
        clearInterval(thinkingMessageTimerRef.current);
      }
      if (thinkingPulseTimerRef.current) {
        clearInterval(thinkingPulseTimerRef.current);
      }
      if (thinkingSoundTimerRef.current) {
        clearInterval(thinkingSoundTimerRef.current);
      }
      if (silvestreAbortRef.current) {
        silvestreAbortRef.current.abort();
      }
      if (thinkingAudioContextRef.current) {
        void thinkingAudioContextRef.current.close?.();
      }
      stopSilvestreAudio();
    };
  }, [stopSilvestreAudio]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
    };
  }, []);

  return {
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
    spentSilvestreQuestions,
    spentSilvestreSet,
    markSilvestreQuestionSpent,
    handleOpenSilvestreChat,
    handleSendSilvestrePreset,
    handlePlayPendingAudio,
    resetSilvestreQuestions,
    stopSilvestreResponse,
  };
};
