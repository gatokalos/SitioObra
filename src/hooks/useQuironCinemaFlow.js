import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showcaseDefinitions } from '@/components/transmedia/transmediaConstants';

/**
 * Manages Quirón playback and aftercare.
 *
 * Quirón se ve cuantas veces se quiera (Carlos, 12 nov 2026): ya no cuesta GAT
 * ni lleva el aviso previo de cobro («se habilita una vez; con una huella
 * activada puedes volver cuando quieras»). El botón abre directo el
 * cortometraje.
 *
 * @param {object} deps
 * @param {string|null} deps.activeShowcase - Currently active showcase ID
 * @param {boolean}     deps.isAuthenticated
 * @param {Function}    deps.toast
 */
const useQuironCinemaFlow = ({
  activeShowcase,
  isAuthenticated,
  toast,
}) => {
  const [isQuironFullVisible, setIsQuironFullVisible] = useState(false);
  const [quironSignedUrl, setQuironSignedUrl] = useState('');
  const [isQuironPlaybackUnlocked, setIsQuironPlaybackUnlocked] = useState(false);
  const [shouldResumeQuironPlay, setShouldResumeQuironPlay] = useState(false);
  const [isQuironPrecareVisible, setIsQuironPrecareVisible] = useState(false);
  const [hasQuironPlaybackStarted, setHasQuironPlaybackStarted] = useState(false);
  const [isQuironAftercareVisible, setIsQuironAftercareVisible] = useState(false);
  const [isQuironUnlocking, setIsQuironUnlocking] = useState(false);
  const [showQuironCoins, setShowQuironCoins] = useState(false);
  const [showQuironCommunityPrompt, setShowQuironCommunityPrompt] = useState(false);

  const quironVideoRef = useRef(null);

  // Reset precare when navigating away from the Quirón showcase
  useEffect(() => {
    if (activeShowcase === 'copycats') return;
    setIsQuironPrecareVisible(false);
  }, [activeShowcase]);

  // Prevent keyboard shortcuts (save/inspect) while video is playing
  useEffect(() => {
    if (!isQuironFullVisible || !isQuironPlaybackUnlocked || typeof window === 'undefined') {
      return undefined;
    }
    const preventShortcuts = (event) => {
      const key = String(event.key || '').toLowerCase();
      if (
        event.key === 'F12' ||
        ((event.ctrlKey || event.metaKey) && ['s', 'u', 'p'].includes(key))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', preventShortcuts);
    return () => window.removeEventListener('keydown', preventShortcuts);
  }, [isQuironFullVisible, isQuironPlaybackUnlocked]);

  // Abre el cortometraje completo (antes pasaba por el aviso de cobro).
  const handleToggleQuironPrompt = useCallback(() => {
    const currentDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
    if (!currentDefinition?.quiron?.fullVideo) {
      toast({ description: 'No encontramos el cortometraje completo en este momento.' });
      return;
    }
    setIsQuironPrecareVisible(false);
    setQuironSignedUrl('');
    setIsQuironPlaybackUnlocked(false);
    setShowQuironCommunityPrompt(false);
    setIsQuironFullVisible(true);
    setShouldResumeQuironPlay(true);
  }, [activeShowcase, toast]);

  const handleCloseQuironPrecare = useCallback(() => {
    setIsQuironPrecareVisible(false);
  }, []);

  const handleConfirmQuironPrecare = useCallback(() => {
    setIsQuironPrecareVisible(false);
    setQuironSignedUrl('');
    setIsQuironPlaybackUnlocked(false);
    setShowQuironCommunityPrompt(false);
    setIsQuironFullVisible(true);
    setShouldResumeQuironPlay(true);
  }, []);

  const handleQuironPlayRequest = useCallback(
    async (autoPlay = true) => {
      const currentDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
      const fullVideo = currentDefinition?.quiron?.fullVideo;
      if (!fullVideo) {
        toast({ description: 'No encontramos el cortometraje completo en este momento.' });
        return;
      }

      if (isQuironUnlocking) return;
      setIsQuironUnlocking(true);

      try {
        let url = quironSignedUrl || '';
        if (!url) {
          const bucket = fullVideo.bucket;
          const path = fullVideo.path;
          if (!bucket || !path) {
            throw new Error('Falta configuración segura del cortometraje.');
          }
          const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
          if (error || !data?.signedUrl) {
            throw error || new Error('No se pudo autorizar el cortometraje.');
          }
          url = data.signedUrl;
          setQuironSignedUrl(url);
        }

        setIsQuironPlaybackUnlocked(true);

        if (autoPlay) {
          window.setTimeout(() => {
            quironVideoRef.current?.play?.().catch(() => {});
          }, 40);
        }
      } catch (error) {
        console.error('[useQuironCinemaFlow] No se pudo reproducir Quirón completo:', error);
        toast({
          description: 'No pudimos abrir el cortometraje completo. Verifica tu sesión e inténtalo de nuevo.',
        });
      } finally {
        setShowQuironCoins(false);
        setIsQuironUnlocking(false);
      }
    },
    [
      activeShowcase,
      isQuironUnlocking,
      quironSignedUrl,
      toast,
    ]
  );

  // Auto-resume playback after login
  useEffect(() => {
    if (!shouldResumeQuironPlay || !isAuthenticated || !isQuironFullVisible) return;
    setShouldResumeQuironPlay(false);
    void handleQuironPlayRequest(true);
  }, [handleQuironPlayRequest, isAuthenticated, isQuironFullVisible, shouldResumeQuironPlay]);

  const handleCloseQuironFull = useCallback(() => {
    setIsQuironFullVisible(false);
    setQuironSignedUrl('');
    setIsQuironPlaybackUnlocked(false);
    setShouldResumeQuironPlay(false);
    if (hasQuironPlaybackStarted) {
      setIsQuironAftercareVisible(true);
    }
  }, [hasQuironPlaybackStarted]);

  const handleQuironPlaybackEnded = useCallback(() => {
    setIsQuironFullVisible(false);
    setIsQuironAftercareVisible(true);
  }, []);

  const handleCloseQuironAftercare = useCallback(() => {
    setIsQuironAftercareVisible(false);
    setHasQuironPlaybackStarted(false);
    setIsQuironPlaybackUnlocked(false);
    setQuironSignedUrl('');
  }, []);

  const resetOnLogout = useCallback(() => {
    setIsQuironFullVisible(false);
    setQuironSignedUrl('');
    setIsQuironPlaybackUnlocked(false);
    setShouldResumeQuironPlay(false);
    setHasQuironPlaybackStarted(false);
    setIsQuironAftercareVisible(false);
  }, []);

  return {
    isQuironFullVisible,
    quironSignedUrl,
    isQuironPlaybackUnlocked,
    shouldResumeQuironPlay,
    isQuironPrecareVisible,
    hasQuironPlaybackStarted,
    setHasQuironPlaybackStarted,
    isQuironAftercareVisible,
    isQuironUnlocking,
    showQuironCoins,
    showQuironCommunityPrompt,
    quironVideoRef,
    handleToggleQuironPrompt,
    handleCloseQuironPrecare,
    handleConfirmQuironPrecare,
    handleQuironPlayRequest,
    handleCloseQuironFull,
    handleQuironPlaybackEnded,
    handleCloseQuironAftercare,
    // Exposed for parent: auth-return redirect and logout reset
    setIsQuironFullVisible,
    setShouldResumeQuironPlay,
    resetOnLogout,
  };
};

export default useQuironCinemaFlow;