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
    audio.volume = TRANSMEDIA_AMBIENT_DEFAULT_VOLUME;
    void audio.play().catch(() => {});
  }, []);

  // IntersectionObserver: start when section enters, stop when it leaves
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        isActiveRef.current = isVisible;
        if (isVisible) {
          if (!isDuckedRef.current) attemptPlay();
        } else {
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
      if (Boolean(event?.detail?.open)) return; // solo nos importa el cierre
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

  // Pause on tab hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseTransmediaAmbient();
      } else if (isActiveRef.current && !isSilvestrePlaying) {
        attemptPlay();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [attemptPlay, isSilvestrePlaying]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    fadeTo(0, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { transmediaSectionRef: sectionRef };
};

export default useTransmediaSectionAudio;
