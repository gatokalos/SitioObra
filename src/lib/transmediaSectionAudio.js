const TRANSMEDIA_SECTION_AUDIO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/RecurringDream.mp3';

export const TRANSMEDIA_AMBIENT_DEFAULT_VOLUME = 0.38;
export const TRANSMEDIA_AMBIENT_MIN_AUDIBLE_VOLUME = 0.012;
export const TRANSMEDIA_AMBIENT_DUCK_VOLUME = 0.07;
const PREF_KEY = 'gatoencerrado:transmedia-audio-enabled';

let sharedAudio = null;
let sharedState = { isMuted: false, isPlaying: false, isReady: false };
const listeners = new Set();

const emit = () => {
  listeners.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
};

export const readTransmediaAudioPreference = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage?.getItem(PREF_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  } catch { return null; }
};

export const writeTransmediaAudioPreference = (isEnabled) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage?.setItem(PREF_KEY, isEnabled ? 'true' : 'false'); } catch { /* noop */ }
};

export const getTransmediaSectionState = () => sharedState;

export const subscribeTransmediaAmbient = (listener) => {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getTransmediaSectionAudio = () => {
  if (typeof window === 'undefined') return null;
  if (sharedAudio) return sharedAudio;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'metadata';
  audio.playsInline = true;
  audio.src = TRANSMEDIA_SECTION_AUDIO_URL;
  audio.volume = TRANSMEDIA_AMBIENT_DEFAULT_VOLUME;
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

  sharedAudio = audio;
  sharedState = { ...sharedState, isReady: audio.readyState >= 2 };
  emit();
  return sharedAudio;
};

export const pauseTransmediaAmbient = () => {
  const audio = getTransmediaSectionAudio();
  if (!audio) return;
  audio.pause();
  emit();
};

export const setTransmediaAmbientVolume = (targetVolume) => {
  const audio = getTransmediaSectionAudio();
  if (!audio || sharedState.isMuted) return;
  audio.volume = Math.max(0, Math.min(1, targetVolume));
  if (targetVolume <= TRANSMEDIA_AMBIENT_MIN_AUDIBLE_VOLUME) {
    if (!audio.paused) audio.pause();
  } else if (audio.paused) {
    void audio.play().catch(() => {});
  }
  emit();
};

export const setTransmediaAmbientMuted = (nextMuted) => {
  const audio = getTransmediaSectionAudio();
  if (!audio) return;
  sharedState = { ...sharedState, isMuted: Boolean(nextMuted) };
  writeTransmediaAudioPreference(!nextMuted);
  if (nextMuted) {
    audio.pause();
    audio.volume = 0;
  } else {
    audio.volume = TRANSMEDIA_AMBIENT_DEFAULT_VOLUME;
    void audio.play().catch(() => {});
  }
  emit();
};

export const toggleTransmediaAmbientMuted = () => {
  const nextMuted = !sharedState.isMuted;
  setTransmediaAmbientMuted(nextMuted);
  return nextMuted;
};
