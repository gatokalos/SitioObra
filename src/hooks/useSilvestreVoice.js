import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabasePublic } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';

const SILVESTRE_QUESTIONS_STORAGE_KEY = 'gatoencerrado:silvestre-questions-spent';
const MODES = [
  'confusion-lucida',
  'sospecha-doctora',
  'necesidad-orden',
  'humor-negro',
  'cansancio-mental',
  'atraccion-incomoda',
  'vertigo',
];
const DEFAULT_MODE = 'confusion-lucida';
const LEGACY_MODE_ALIASES = {
  'lectura-profunda': 'confusion-lucida',
  artista: 'atraccion-incomoda',
  rabia: 'atraccion-incomoda',
  'claro-directo': 'necesidad-orden',
  tiktoker: 'humor-negro',
  'util-hoy': 'cansancio-mental',
  poeta: 'vertigo',
  filósofo: 'vertigo',
  filosofo: 'vertigo',
};
const ENABLE_OBRA_VOICE_FALLBACK =
  String(import.meta.env.VITE_OBRA_ENABLE_VOICE_FALLBACK || '').toLowerCase() === 'true';
const ENABLE_SILVESTRE_TIMING_DEBUG =
  String(import.meta.env.VITE_DEBUG_SILVESTRE_TIMING || '').toLowerCase() === 'true';
const SERVICE_UNAVAILABLE_COOLDOWN_MS = 15000;
const normalizeMode = (value) => {
  const key = (value || '').toString().toLowerCase().trim();
  const resolved = LEGACY_MODE_ALIASES[key] || key;
  return MODES.includes(resolved) ? resolved : DEFAULT_MODE;
};
const getNowMs = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
const roundMs = (value) => Math.max(0, Math.round(value));
const isSilvestreTimingDebugEnabled = () => {
  if (ENABLE_SILVESTRE_TIMING_DEBUG) return true;
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('gatoencerrado:debug-silvestre-timing') === '1';
};

const parseApiErrorResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    if (text) {
      return { message: text.slice(0, 280) };
    }
  } catch (error) {
    // Ignore parse failures: caller will handle with generic message.
  }
  return null;
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

const normalizeQuestionKey = (value) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeStoredSpentSilvestreQuestions = (raw) => {
  if (!raw) return {};

  // Legacy format: array of spent questions (global spend).
  if (Array.isArray(raw)) {
    return raw.reduce((acc, question) => {
      const key = normalizeQuestionKey(question);
      if (!key) return acc;
      acc[key] = [...MODES];
      return acc;
    }, {});
  }

  if (typeof raw !== 'object') return {};

  return Object.entries(raw).reduce((acc, [question, modesRaw]) => {
    const key = normalizeQuestionKey(question);
    if (!key) return acc;

    let nextModes = [];
    if (Array.isArray(modesRaw)) {
      nextModes = modesRaw.map((mode) => normalizeMode(mode)).filter(Boolean);
    } else if (modesRaw === true) {
      nextModes = [...MODES];
    } else if (modesRaw && typeof modesRaw === 'object') {
      nextModes = Object.entries(modesRaw)
        .filter(([, isEnabled]) => Boolean(isEnabled))
        .map(([mode]) => normalizeMode(mode))
        .filter(Boolean);
    }

    const uniqueModes = Array.from(new Set(nextModes)).filter((mode) => MODES.includes(mode));
    if (!uniqueModes.length) return acc;

    acc[key] = uniqueModes.length >= MODES.length ? [...MODES] : uniqueModes;
    return acc;
  }, {});
};

const DEFAULT_THINKING_MESSAGE = 'La Obra esta pensando...';
const THINKING_MESSAGE_PHASES = [
  { afterMs: 0, text: 'Estoy contigo.' },
  { afterMs: 6500, text: 'Sigo pensando...' },
  { afterMs: 9999, text: 'Ya voy.' },
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
  const initialSpentSilvestreQuestions = normalizeStoredSpentSilvestreQuestions(
    readStoredJson(SILVESTRE_QUESTIONS_STORAGE_KEY, {})
  );

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
  const [spentSilvestreQuestionsByMode, setSpentSilvestreQuestionsByMode] = useState(
    initialSpentSilvestreQuestions
  );

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const micTimeoutRef = useRef(null);
  const silvestreAudioRef = useRef(null);
  const silvestreAudioUrlRef = useRef(null);
  const silvestreRequestIdRef = useRef(0);
  const silvestreAbortRef = useRef(null);
  const serviceUnavailableUntilRef = useRef(0);
  const ignoreNextTranscriptRef = useRef(false);
  const modeRef = useRef(null);
  const thinkingMessageTimerRef = useRef(null);
  const thinkingPulseTimerRef = useRef(null);
  const thinkingSoundTimerRef = useRef(null);
  const thinkingAudioContextRef = useRef(null);

  const spentSilvestreSetsByMode = useMemo(() => {
    const initialSets = MODES.reduce((acc, mode) => {
      acc[mode] = new Set();
      return acc;
    }, {});

    Object.entries(spentSilvestreQuestionsByMode).forEach(([question, modes]) => {
      const questionKey = normalizeQuestionKey(question);
      if (!questionKey || !Array.isArray(modes)) return;
      modes.forEach((mode) => {
        const normalized = normalizeMode(mode);
        if (!initialSets[normalized]) {
          initialSets[normalized] = new Set();
        }
        initialSets[normalized].add(questionKey);
      });
    });

    return initialSets;
  }, [spentSilvestreQuestionsByMode]);

  const spentSilvestreSet = useMemo(() => {
    const fullySpent = Object.entries(spentSilvestreQuestionsByMode).reduce((acc, [question, modes]) => {
      if (!Array.isArray(modes)) return acc;
      const uniqueModes = Array.from(new Set(modes.map((mode) => normalizeMode(mode))));
      if (uniqueModes.length >= MODES.length) {
        acc.add(question);
      }
      return acc;
    }, new Set());
    return fullySpent;
  }, [spentSilvestreQuestionsByMode]);

  const spentSilvestreQuestions = useMemo(
    () => Array.from(spentSilvestreSet),
    [spentSilvestreSet]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(
      SILVESTRE_QUESTIONS_STORAGE_KEY,
      JSON.stringify(spentSilvestreQuestionsByMode)
    );
  }, [spentSilvestreQuestionsByMode]);

  const getSpentSilvestreSetForMode = useCallback(
    (modeId) => {
      const normalizedMode = normalizeMode(modeId);
      return spentSilvestreSetsByMode[normalizedMode] ?? new Set();
    },
    [spentSilvestreSetsByMode]
  );

  const isSilvestreQuestionFullySpent = useCallback(
    (question) => {
      const questionKey = normalizeQuestionKey(question);
      if (!questionKey) return false;
      return spentSilvestreSet.has(questionKey);
    },
    [spentSilvestreSet]
  );

  const getSilvestreQuestionProgress = useCallback(
    (question) => {
      const questionKey = normalizeQuestionKey(question);
      if (!questionKey) {
        return { count: 0, total: MODES.length, isComplete: false };
      }
      const usedModes = Array.isArray(spentSilvestreQuestionsByMode[questionKey])
        ? spentSilvestreQuestionsByMode[questionKey]
        : [];
      const count = Math.min(
        Array.from(new Set(usedModes.map((mode) => normalizeMode(mode)))).filter((mode) =>
          MODES.includes(mode)
        ).length,
        MODES.length
      );
      return { count, total: MODES.length, isComplete: count >= MODES.length };
    },
    [spentSilvestreQuestionsByMode]
  );

  const markSilvestreQuestionSpent = useCallback((question, options = {}) => {
    const questionKey = normalizeQuestionKey(question);
    if (!questionKey) return;

    const modeCandidate =
      typeof options === 'string'
        ? options
        : options?.modeId || options?.selectedMode || DEFAULT_MODE;
    const normalizedMode = normalizeMode(modeCandidate);

    setSpentSilvestreQuestionsByMode((prev) => {
      const prevModes = Array.isArray(prev[questionKey]) ? prev[questionKey] : [];
      if (prevModes.includes(normalizedMode)) return prev;
      const nextModes = Array.from(new Set([...prevModes, normalizedMode]));
      return {
        ...prev,
        [questionKey]: nextModes.length >= MODES.length ? [...MODES] : nextModes,
      };
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
      if (Date.now() < serviceUnavailableUntilRef.current) {
        setMicError('La IA de La Obra se está recuperando. Intenta de nuevo en unos segundos.');
        return false;
      }
      const source = options.source || null;
      const mode_id = normalizeMode(options.modeId || options.selectedMode);
      const userName =
        typeof options.userName === 'string' && options.userName.trim()
          ? options.userName.trim()
          : null;
      const debugTimingEnabled = isSilvestreTimingDebugEnabled();
      const requestStartedAt = getNowMs();
      const timingCandidates = [];
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
        const userNamePayload = userName
          ? { user_name: userName, nombre: userName, author_name: userName }
          : {};
        const candidates = [
          {
            endpoint: '/api/obra-conciencia',
            payload: { pregunta: message, user_id: userId, mode_id, ...userNamePayload },
            label: 'conciencia',
          },
        ];
        if (ENABLE_OBRA_VOICE_FALLBACK) {
          candidates.push({
            endpoint: '/api/obra-voz',
            payload: { mensaje: message, mode_id, user_id: userId, ...userNamePayload },
            label: 'voz (fallback)',
          });
        }

        let audioBlob = null;
        let responseText = null;
        let lastError = null;

        for (const candidate of candidates) {
          const candidateStartedAt = getNowMs();
          try {
            const response = await fetch(`${apiBase}${candidate.endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(candidate.payload),
              signal: controller.signal,
            });
            const responseHeadersAt = getNowMs();
            if (requestId !== silvestreRequestIdRef.current) {
              return false;
            }
            if (!response.ok) {
              const apiError = await parseApiErrorResponse(response);
              const candidateError = new Error(`${candidate.label} responded ${response.status}`);
              candidateError.status = response.status;
              candidateError.endpoint = candidate.endpoint;
              candidateError.apiError = apiError;
              // If the backend answered with an HTTP error, don't fan-out to another
              // model endpoint for the same user turn unless fallback is explicitly
              // enabled and the primary endpoint failed with a server-side error.
              const shouldAllowFallback =
                ENABLE_OBRA_VOICE_FALLBACK &&
                response.status >= 500 &&
                candidate.endpoint === '/api/obra-conciencia';
              candidateError.noFallback = !shouldAllowFallback;
              throw candidateError;
            }
            responseText =
              response.headers.get('x-silvestre-text') ||
              response.headers.get('x-silvestre-answer') ||
              null;
            const blob = await response.blob();
            const blobReadyAt = getNowMs();
            if (requestId !== silvestreRequestIdRef.current) {
              return false;
            }
            if (!blob || !(blob.type || '').startsWith('audio/')) {
              throw new Error(`${candidate.label} returned non-audio payload (${blob?.type || 'unknown'})`);
            }
            if (debugTimingEnabled) {
              timingCandidates.push({
                endpoint: candidate.endpoint,
                status: response.status,
                headersMs: roundMs(responseHeadersAt - candidateStartedAt),
                blobMs: roundMs(blobReadyAt - responseHeadersAt),
                totalMs: roundMs(blobReadyAt - candidateStartedAt),
                bytes: blob.size ?? null,
              });
            }
            audioBlob = blob;
            break;
          } catch (error) {
            if (debugTimingEnabled) {
              timingCandidates.push({
                endpoint: candidate.endpoint,
                status: error?.status ?? null,
                totalMs: roundMs(getNowMs() - candidateStartedAt),
                error: error?.message || 'unknown',
              });
            }
            console.error('[Silvestre Voice] candidate error:', {
              message: error?.message,
              status: error?.status,
              endpoint: error?.endpoint,
              apiError: error?.apiError ?? null,
            });
            lastError = error;
            if (error?.noFallback) {
              break;
            }
          }
        }

        if (!audioBlob) {
          if (debugTimingEnabled) {
            console.info('[Silvestre Timing]', {
              source,
              mode_id,
              ok: false,
              phase: 'no-audio-blob',
              totalMs: roundMs(getNowMs() - requestStartedAt),
              candidates: timingCandidates,
            });
          }
          throw lastError || new Error('No se pudo obtener audio de La Obra');
        }
        serviceUnavailableUntilRef.current = 0;
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
        const beforePlayAt = getNowMs();
        try {
          await audio.play();
          if (debugTimingEnabled) {
            const playResolvedAt = getNowMs();
            console.info('[Silvestre Timing]', {
              source,
              mode_id,
              ok: true,
              autoplayBlocked: false,
              requestToPlayableMs: roundMs(playResolvedAt - requestStartedAt),
              prePlayMs: roundMs(beforePlayAt - requestStartedAt),
              playStartMs: roundMs(playResolvedAt - beforePlayAt),
              audioBytes: audioBlob.size ?? null,
              candidates: timingCandidates,
            });
          }
        } catch (playError) {
          if (playError?.name === 'NotAllowedError') {
            if (debugTimingEnabled) {
              console.info('[Silvestre Timing]', {
                source,
                mode_id,
                ok: true,
                autoplayBlocked: true,
                requestToAudioReadyMs: roundMs(getNowMs() - requestStartedAt),
                audioBytes: audioBlob.size ?? null,
                candidates: timingCandidates,
              });
            }
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
        if (debugTimingEnabled && error?.name !== 'AbortError') {
          console.info('[Silvestre Timing]', {
            source,
            mode_id,
            ok: false,
            totalMs: roundMs(getNowMs() - requestStartedAt),
            status: error?.status ?? null,
            error: error?.message || 'unknown',
            candidates: timingCandidates,
          });
        }
        if (error?.name === 'AbortError') {
          if (requestId === silvestreRequestIdRef.current) {
            setIsSilvestreFetching(false);
            setIsSilvestreResponding(false);
          }
          return false;
        }
        console.error('[Silvestre Voice] Error sending transcript:', error);
        const backendMessage =
          typeof error?.apiError?.message === 'string' ? error.apiError.message : '';
        if (error?.status === 429) {
          setMicError(
            backendMessage ||
              'La IA alcanzó su límite de cuota. Intenta más tarde mientras se restablece el servicio.'
          );
        } else if (error?.status >= 500) {
          serviceUnavailableUntilRef.current = Date.now() + SERVICE_UNAVAILABLE_COOLDOWN_MS;
          if (error?.apiError?.request_id) {
            console.error('[Silvestre Voice] backend request_id:', error.apiError.request_id);
          }
          setMicError(
            'La IA de La Obra no está disponible en este momento. Intenta nuevamente en unos segundos.'
          );
        } else {
          setMicError(backendMessage || 'No pudimos enviar tu mensaje a Silvestre. Intenta nuevamente más tarde.');
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
      const userName =
        typeof options.userName === 'string' && options.userName.trim()
          ? options.userName.trim()
          : null;
      setTranscript(starter);
      await sendTranscript(starter, { source: 'preset', modeId, userName });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:open-silvestre', {
            detail: {
              source: 'preset',
              mensaje: starter,
              mode_id: normalizeMode(modeId),
              user_name: userName,
            },
          })
        );
      }
    },
    [isListening, sendTranscript, stopSilvestreListening]
  );

  const resetSilvestreQuestions = useCallback(() => {
    setSpentSilvestreQuestionsByMode({});
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
    getSpentSilvestreSetForMode,
    isSilvestreQuestionFullySpent,
    getSilvestreQuestionProgress,
    markSilvestreQuestionSpent,
    handleOpenSilvestreChat,
    handleSendSilvestrePreset,
    handlePlayPendingAudio,
    resetSilvestreQuestions,
    stopSilvestreResponse,
  };
};
