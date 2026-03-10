import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { showcaseDefinitions, SHOWCASE_REQUIRED_GAT } from '@/components/transmedia/transmediaConstants';

/**
 * Manages the Quirón cinema unlock, playback, precare, and aftercare flow.
 *
 * @param {object} deps
 * @param {string|null} deps.activeShowcase - Currently active showcase ID
 * @param {boolean}     deps.isAuthenticated
 * @param {number}      deps.availableGATokens
 * @param {object}      deps.showcaseBoosts
 * @param {Function}    deps.showGuardrailPrecareOnce
 * @param {Function}    deps.trackTransmediaCreditEvent
 * @param {Function}    deps.toast
 */
const useQuironCinemaFlow = ({
  activeShowcase,
  isAuthenticated,
  availableGATokens,
  showcaseBoosts,
  showGuardrailPrecareOnce,
  trackTransmediaCreditEvent,
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

  const handleToggleQuironPrompt = useCallback(() => {
    const currentDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
    if (!currentDefinition?.quiron?.fullVideo) {
      toast({ description: 'No encontramos el cortometraje completo en este momento.' });
      return;
    }
    setIsQuironPrecareVisible(true);
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

      if (!isAuthenticated) {
        showGuardrailPrecareOnce({
          actionLabel: 'este cortometraje',
          message: 'Puedes verlo ahora y, si agotas tus GAT, activar huella para seguir sin fricción.',
          remaining: Number.isFinite(availableGATokens) ? Math.max(Number(availableGATokens), 0) : 0,
        });
      }

      if (isQuironUnlocking) return;
      setIsQuironUnlocking(true);
      setShowQuironCoins(true);

      try {
        const isCopycatsFullUnlocked = Boolean(showcaseBoosts?.copycats_full_unlock);
        if (!isCopycatsFullUnlocked) {
          const unlockResult = await trackTransmediaCreditEvent({
            eventKey: 'showcase_boost:copycats_full_unlock',
            amount: -SHOWCASE_REQUIRED_GAT.copycats,
            requiredTokens: SHOWCASE_REQUIRED_GAT.copycats,
            actionLabel: 'Este cortometraje completo',
            oncePerIdentity: true,
            metadata: { source: 'transmedia_cine_full_unlock' },
          });
          if (!unlockResult.ok) {
            return;
          }
        }

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'cine', spent: true, amount: SHOWCASE_REQUIRED_GAT.copycats },
            })
          );
        }

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
      availableGATokens,
      isAuthenticated,
      isQuironUnlocking,
      quironSignedUrl,
      showcaseBoosts,
      showGuardrailPrecareOnce,
      toast,
      trackTransmediaCreditEvent,
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