import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const SILVESTRE_QUESTIONS_STORAGE_KEY = 'gatoencerrado:silvestre-questions-spent';

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
        const forceConciencia =
          (import.meta.env.VITE_OBRA_FORCE_CONCIENCIA ?? 'false') === 'true';
        const useObraConciencia =
          (import.meta.env.VITE_OBRA_USE_CONCIENCIA ?? 'true') === 'true';
        const isPreset = source === 'preset';
        const useConcienciaForThisRequest = forceConciencia || (useObraConciencia && isPreset);
        const userId = user?.id ?? 'anonymous';
        const candidates = useConcienciaForThisRequest
          ? [
              {
                endpoint: '/api/obra-conciencia',
                payload: { pregunta: message, user_id: userId },
                label: 'conciencia',
              },
            ]
          : [
              {
                endpoint: '/api/obra-voz',
                payload: { mensaje: message },
                label: 'voz',
              },
              {
                endpoint: '/api/obra-conciencia',
                payload: { pregunta: message, user_id: userId },
                label: 'conciencia (fallback)',
              },
            ];

        let audioBlob = null;
        let responseText = null;
        let lastError = null;

        for (const candidate of candidates) {
          try {
            const response = await fetch(`${apiBase}${candidate.endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
              },
              body: JSON.stringify(candidate.payload),
              signal: controller.signal,
            });
            if (requestId !== silvestreRequestIdRef.current) {
              return false;
            }
            if (!response.ok) {
              throw new Error(`${candidate.label} responded ${response.status}`);
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
        setMicError('No pudimos enviar tu mensaje a Silvestre. Intenta nuevamente más tarde.');
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

  const handleOpenSilvestreChat = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
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
          sendTranscript(finalText, { source: 'mic' });
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
    async (starter) => {
      if (!starter) {
        return;
      }

      if (isListening) {
        stopSilvestreListening({ discardTranscript: true });
      }

      setTranscript(starter);
      await sendTranscript(starter, { source: 'preset' });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:open-silvestre', {
            detail: { source: 'preset', mensaje: starter },
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
      if (silvestreAbortRef.current) {
        silvestreAbortRef.current.abort();
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
