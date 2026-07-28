const HERO_LOGGED_IN_AUDIO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/A2_Melody_MSTR.m4a';
const HERO_LOGGED_IN_AUDIO_FALLBACK_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/A2_Melody_MSTR.wav';
export const HERO_AMBIENT_DEFAULT_VOLUME = 0.35;
export const HERO_AMBIENT_MIN_AUDIBLE_VOLUME = 0.015;
const HERO_AUDIO_ENABLED_PREF_KEY = 'gatoencerrado:hero-audio-enabled';

let sharedAudio = null;
let fallbackApplied = false;
const _initMuted = (() => {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage?.getItem(HERO_AUDIO_ENABLED_PREF_KEY) === 'false'; } catch { return false; }
})();
let sharedState = {
  isMuted: _initMuted,
  isPlaying: false,
  isReady: false,
};
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // noop
    }
  });
};

const resolveAudioSource = (audio) => {
  if (!audio) return HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
  const supportsM4a = Boolean(audio.canPlayType('audio/mp4') || audio.canPlayType('audio/x-m4a'));
  return supportsM4a ? HERO_LOGGED_IN_AUDIO_URL : HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
};

const restorePlaybackState = (audio, { muted, volume }) => {
  if (!audio) return;
  audio.muted = Boolean(muted);
  audio.volume = muted ? 0 : volume;
};

export const readHeroAudioEnabledPreference = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage?.getItem(HERO_AUDIO_ENABLED_PREF_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  } catch {
    return null;
  }
};

export const writeHeroAudioEnabledPreference = (isEnabled) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(HERO_AUDIO_ENABLED_PREF_KEY, isEnabled ? 'true' : 'false');
  } catch {
    // noop
  }
};

export const getHeroAmbientState = () => sharedState;

export const subscribeHeroAmbient = (listener) => {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getHeroAmbientAudio = () => {
  if (typeof window === 'undefined') return null;
  if (sharedAudio) return sharedAudio;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.playsInline = true;
  audio.src = resolveAudioSource(audio);
  audio.load();

  audio.addEventListener('canplay', () => {
    sharedState = { ...sharedState, isReady: true };
    emit();
  });
  audio.addEventListener('play', () => {
    sharedState = { ...sharedState, isPlaying: true };
    emit();
  });
  audio.addEventListener('pause', () => {
    sharedState = { ...sharedState, isPlaying: false };
    emit();
  });
  audio.addEventListener('ended', () => {
    sharedState = { ...sharedState, isPlaying: false };
    emit();
  });
  audio.addEventListener('error', () => {
    if (fallbackApplied) return;
    fallbackApplied = true;
    sharedState = { ...sharedState, isReady: false };
    audio.src = HERO_LOGGED_IN_AUDIO_FALLBACK_URL;
    audio.load();
    emit();
  });

  sharedAudio = audio;
  sharedState = { ...sharedState, isReady: audio.readyState >= 2 };
  emit();
  return sharedAudio;
};

export const resumeHeroAmbientPlayback = async (
  {
    targetVolume = HERO_AMBIENT_DEFAULT_VOLUME,
    allowMutedWarmup = true,
  } = {}
) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return false;

  const previousState = {
    muted: Boolean(audio.muted),
    volume: Number.isFinite(audio.volume) ? audio.volume : targetVolume,
  };

  try {
    audio.muted = false;
    audio.volume = targetVolume;
    await audio.play();
    emit();
    return true;
  } catch {
    if (!allowMutedWarmup) {
      restorePlaybackState(audio, previousState);
      emit();
      return false;
    }

    try {
      audio.muted = true;
      audio.volume = 0;
      await audio.play();
      audio.muted = false;
      audio.volume = targetVolume;
      emit();
      return true;
    } catch {
      restorePlaybackState(audio, previousState);
      emit();
      return false;
    }
  }
};

export const setHeroAmbientMuted = (
  nextMuted,
  { targetVolume = HERO_AMBIENT_DEFAULT_VOLUME } = {}
) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return;
  sharedState = { ...sharedState, isMuted: Boolean(nextMuted) };
  writeHeroAudioEnabledPreference(!nextMuted);
  audio.muted = Boolean(nextMuted);

  if (nextMuted) {
    audio.pause();
    audio.volume = 0;
    emit();
    return;
  }

  audio.volume = targetVolume;
  if (targetVolume > HERO_AMBIENT_MIN_AUDIBLE_VOLUME && audio.paused) {
    void resumeHeroAmbientPlayback({ targetVolume });
  }
  emit();
};

export const toggleHeroAmbientMuted = (options = {}) => {
  const nextMuted = !sharedState.isMuted;
  setHeroAmbientMuted(nextMuted, options);
  return nextMuted;
};

export const setHeroAmbientVolume = (targetVolume) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return;
  if (sharedState.isMuted) {
    audio.muted = true;
    audio.volume = 0;
    emit();
    return;
  }
  audio.muted = false;
  audio.volume = targetVolume;
  if (targetVolume <= HERO_AMBIENT_MIN_AUDIBLE_VOLUME) {
    if (!audio.paused) audio.pause();
  } else if (audio.paused) {
    void resumeHeroAmbientPlayback({ targetVolume });
  }
  emit();
};

export const pauseHeroAmbient = ({ resetTime = false } = {}) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return;
  audio.pause();
  audio.muted = sharedState.isMuted;
  if (resetTime) audio.currentTime = 0;
  emit();
};

// Guardrail global de "pestaña fuera de vista" — Hero.jsx ya tiene su propio
// listener de visibilitychange, pero vive dentro de su propio useEffect y se
// apaga en cuanto Hero se desmonta (al navegar a /portal-encuentros,
// /bitacora o cualquier /portal-*). Este audio es un singleton de módulo que
// sigue sonando entre rutas a propósito, así que necesita su propio
// guardrail que no dependa de qué página esté montada. Convive sin
// problema con el de Hero.jsx: pausar/reproducir algo que ya está en ese
// estado es un no-op seguro en la API de <audio>, y este listener se
// registra al cargar el módulo (antes de que Hero monte su propio efecto),
// así que el ajuste más específico de Hero (volumen según scroll) siempre
// corre después y tiene la última palabra.
let wasPlayingBeforeHidden = false;
// Cambiar a OTRA APLICACIÓN (no otra pestaña del mismo navegador) no
// siempre dispara visibilitychange de forma confiable — la señal correcta
// ahí es window.blur/focus (el mismo motivo por el que Hero.jsx usa AMBAS
// señales, no solo una). Bandera compartida para que no se pisen entre sí
// si el navegador llega a disparar las dos casi al mismo tiempo.
let isGloballyBackgrounded = false;

const pauseGlobalAmbient = () => {
  if (!sharedAudio || isGloballyBackgrounded) return;
  isGloballyBackgrounded = true;
  wasPlayingBeforeHidden = !sharedAudio.paused;
  if (wasPlayingBeforeHidden) sharedAudio.pause();
};

const resumeGlobalAmbientIfNeeded = () => {
  if (!sharedAudio || !isGloballyBackgrounded) return;
  isGloballyBackgrounded = false;
  // document.hasFocus() cubre el caso de volver de otra app pero con la
  // pestaña todavía oculta (p. ej. otra ventana del mismo navegador encima).
  if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
  if (wasPlayingBeforeHidden && !sharedState.isMuted) {
    void resumeHeroAmbientPlayback({
      targetVolume: sharedAudio.volume > HERO_AMBIENT_MIN_AUDIBLE_VOLUME ? sharedAudio.volume : HERO_AMBIENT_DEFAULT_VOLUME,
    });
  }
  wasPlayingBeforeHidden = false;
};

const handleGlobalVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    pauseGlobalAmbient();
    return;
  }
  if (document.visibilityState === 'visible') {
    resumeGlobalAmbientIfNeeded();
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleGlobalVisibilityChange);
}
if (typeof window !== 'undefined') {
  window.addEventListener('blur', pauseGlobalAmbient);
  window.addEventListener('focus', resumeGlobalAmbientIfNeeded);
}
