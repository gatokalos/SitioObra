import { useEffect, useRef, useCallback } from 'react';
import {
  getTransmediaSectionAudio,
  pauseTransmediaAmbient,
  readTransmediaAudioPreference,
  TRANSMEDIA_AMBIENT_DEFAULT_VOLUME,
  TRANSMEDIA_AMBIENT_MIN_AUDIBLE_VOLUME,
  TRANSMEDIA_AMBIENT_DUCK_VOLUME,
} from '@/lib/transmediaSectionAudio';

const FADE_DURATION_MS = 800;

const useTransmediaSectionAudio = ({ isSilvestrePlaying }) => {
  const sectionRef  = useRef(null);
  const isActiveRef = useRef(false);
  const isDuckedRef = useRef(false);
  const fadeRafRef  = useRef(null);

  const fadeTo = useCallback((targetVolume, durationMs = FADE_DURATION_MS) => {
    const audio = getTransmediaSectionAudio();
    if (!audio) return;
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    const startVolume = audio.volume;
    const startTime   = Date.now();
    const step = () => {
      const a = getTransmediaSectionAudio();
      if (!a) return;
      const progress = Math.min((Date.now() - startTime) / durationMs, 1);
      a.volume = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * progress));
      if (progress < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        fadeRafRef.current = null;
        if (targetVolume <= TRANSMEDIA_AMBIENT_MIN_AUDIBLE_VOLUME && !a.paused) a.pause();
      }
    };
    fadeRafRef.current = requestAnimationFrame(step);
  }, []);

  const attemptPlay = useCallback(() => {
    const audio = getTransmediaSectionAudio();
    if (!audio) return;
    if (readTransmediaAudioPreference() === false) return;
    // Cancelar cualquier fade-to-0 en curso para evitar que pause el audio
    // justo después de que play() lo haya arrancado (race condition con RAF).
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    audio.volume = TRANSMEDIA_AMBIENT_DEFAULT_VOLUME;
    void audio.play().catch(() => {});
  }, []);

  // Pre-unlock del elemento de audio en el primer gesto del usuario (necesario en iOS Safari:
  // play() desde IntersectionObserver no está en el call stack del gesto y es bloqueado).
  useEffect(() => {
    const preUnlock = () => {
      if (readTransmediaAudioPreference() === false) return;
      const audio = getTransmediaSectionAudio();
      if (!audio) return;
      const wasPaused = audio.paused;
      audio.muted = true;
      audio.volume = 0;
      void audio.play().then(() => {
        if (wasPaused) audio.pause();
        audio.muted = false;
        audio.volume = 0;
      }).catch(() => {
        audio.muted = false;
      });
    };
    window.addEventListener('pointerdown', preUnlock, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', preUnlock);
  }, []);

  // IntersectionObserver: start when section enters, stop when it leaves
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const dispatchHeroHold = (hold) =>
      window.dispatchEvent(new CustomEvent('gatoencerrado:hero-ambient-hold', { detail: { hold } }));

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        isActiveRef.current = isVisible;
        if (isVisible) {
          dispatchHeroHold(true);
          if (!isDuckedRef.current) attemptPlay();
        } else {
          dispatchHeroHold(false);
          fadeTo(0, 600);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [attemptPlay, fadeTo]);

  // Duck / unduck when Silvestre speaks
  useEffect(() => {
    if (isSilvestrePlaying) {
      isDuckedRef.current = true;
      fadeTo(TRANSMEDIA_AMBIENT_DUCK_VOLUME, 500);
    } else if (isDuckedRef.current) {
      isDuckedRef.current = false;
      if (isActiveRef.current) fadeTo(TRANSMEDIA_AMBIENT_DEFAULT_VOLUME, 800);
    }
  }, [isSilvestrePlaying, fadeTo]);

  // Retomar cuando cierra una vitrina (necesario en iOS: el IntersectionObserver
  // no siempre re-dispara al restaurar body desde position:fixed)
  useEffect(() => {
    const onShowcaseVisibility = (event) => {
      if (Boolean(event?.detail?.open)) return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (inViewport) {
        isActiveRef.current = true;
        if (!isDuckedRef.current) attemptPlay();
      }
    };
    window.addEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
    return () => window.removeEventListener('gatoencerrado:showcase-visibility', onShowcaseVisibility);
  }, [attemptPlay]);

  // Pause on tab hidden / app switch — mirrors Hero's blur+visibilitychange guardrails
  useEffect(() => {
    let shouldResumeAfterFocus = false;

    const onBlur = () => {
      const audio = getTransmediaSectionAudio();
      if (!audio) return;
      shouldResumeAfterFocus = !audio.paused && audio.volume > TRANSMEDIA_AMBIENT_MIN_AUDIBLE_VOLUME;
      if (shouldResumeAfterFocus) pauseTransmediaAmbient();
    };

    const onFocus = () => {
      if (document.visibilityState !== 'visible') return;
      if (shouldResumeAfterFocus && isActiveRef.current && !isDuckedRef.current) {
        attemptPlay();
      }
      shouldResumeAfterFocus = false;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        shouldResumeAfterFocus = false; // visibilitychange ya lo maneja onBlur no aplica aquí
        pauseTransmediaAmbient();
      } else if (isActiveRef.current && !isSilvestrePlaying) {
        attemptPlay();
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [attemptPlay, isSilvestrePlaying]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    fadeTo(0, 400);
    window.dispatchEvent(new CustomEvent('gatoencerrado:hero-ambient-hold', { detail: { hold: false } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { transmediaSectionRef: sectionRef };
};

export default useTransmediaSectionAudio;
