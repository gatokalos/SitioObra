const HERO_LOGGED_IN_AUDIO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/A2_Melody_MSTR.m4a';
const HERO_LOGGED_IN_AUDIO_FALLBACK_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/A2_Melody_MSTR.wav';
export const HERO_AMBIENT_DEFAULT_VOLUME = 0.35;
export const HERO_AMBIENT_MIN_AUDIBLE_VOLUME = 0.015;
const HERO_AUDIO_ENABLED_PREF_KEY = 'gatoencerrado:hero-audio-enabled';

let sharedAudio = null;
let fallbackApplied = false;
let sharedState = {
  isMuted: false,
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
  audio.preload = 'metadata';
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

export const setHeroAmbientMuted = (
  nextMuted,
  { targetVolume = HERO_AMBIENT_DEFAULT_VOLUME } = {}
) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return;
  sharedState = { ...sharedState, isMuted: Boolean(nextMuted) };
  writeHeroAudioEnabledPreference(!nextMuted);

  if (nextMuted) {
    audio.pause();
    audio.volume = 0;
    emit();
    return;
  }

  audio.volume = targetVolume;
  if (targetVolume > HERO_AMBIENT_MIN_AUDIBLE_VOLUME && audio.paused) {
    void audio.play().catch(() => {});
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
    audio.volume = 0;
    emit();
    return;
  }
  audio.volume = targetVolume;
  if (targetVolume <= HERO_AMBIENT_MIN_AUDIBLE_VOLUME) {
    if (!audio.paused) audio.pause();
  } else if (audio.paused) {
    void audio.play().catch(() => {});
  }
  emit();
};

export const pauseHeroAmbient = ({ resetTime = false } = {}) => {
  const audio = getHeroAmbientAudio();
  if (!audio) return;
  audio.pause();
  if (resetTime) audio.currentTime = 0;
  emit();
};
