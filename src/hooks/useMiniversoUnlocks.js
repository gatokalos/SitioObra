import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { GAT_COSTS } from '@/components/transmedia/transmediaConstants';

/**
 * Manages GAT-gated unlock flows: novela questions, sonoro, graphic swipe,
 * taza AR activation, and cine projection interest.
 *
 * @param {object} deps
 * @param {Function} deps.trackTransmediaCreditEvent
 * @param {boolean}  deps.sonoroSpent
 * @param {boolean}  deps.graphicSpent
 * @param {Function} deps.handleOpenPdfPreview
 * @param {boolean}  deps.isAuthenticated
 * @param {boolean}  deps.isSubscriber
 * @param {Function} deps.toast
 * @param {string|null} deps.activeShowcase
 */
const useMiniversoUnlocks = ({
  trackTransmediaCreditEvent,
  sonoroSpent,
  graphicSpent,
  handleOpenPdfPreview,
  isAuthenticated,
  isSubscriber,
  toast,
  activeShowcase,
}) => {
  const [isNovelaSubmitting, setIsNovelaSubmitting] = useState(false);
  const [showNovelaCoins, setShowNovelaCoins] = useState(false);
  const [showSonoroCoins, setShowSonoroCoins] = useState(false);
  const [isGraphicUnlocking, setIsGraphicUnlocking] = useState(false);
  const [showGraphicCoins, setShowGraphicCoins] = useState(false);
  const [isTazaActivating, setIsTazaActivating] = useState(false);
  const [tazaCameraReady, setTazaCameraReady] = useState(false);
  const [showTazaCoins, setShowTazaCoins] = useState(false);
  const [isTazaARActive, setIsTazaARActive] = useState(false);
  const [isMobileARFullscreen, setIsMobileARFullscreen] = useState(false);
  const [isProjectionInterestSubmitting, setIsProjectionInterestSubmitting] = useState(false);
  const [isProjectionInterestSent, setIsProjectionInterestSent] = useState(false);

  // Reset projection interest when navigating away from cine
  useEffect(() => {
    if (activeShowcase === 'copycats') return;
    setIsProjectionInterestSubmitting(false);
    setIsProjectionInterestSent(false);
  }, [activeShowcase]);

  // Manage AR fullscreen and body scroll lock
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isTazaARActive && isMobile && !isMobileARFullscreen) {
      setIsMobileARFullscreen(true);
    }
    if (isTazaARActive && isMobile) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return undefined;
  }, [isTazaARActive, isMobileARFullscreen]);

  const handleNovelaQuestionSend = useCallback(async () => {
    if (isNovelaSubmitting) return;
    setIsNovelaSubmitting(true);
    setShowNovelaCoins(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const result = await trackTransmediaCreditEvent({
      eventKey: 'novela_question',
      amount: -25,
      requiredTokens: 25,
      actionLabel: 'Esta pregunta de novela',
      metadata: { source: 'transmedia_novela' },
    });
    if (result.ok && typeof result.state?.novela_questions === 'number') {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'novela', spent: true, amount: 25, count: result.state.novela_questions },
        })
      );
    }
    setShowNovelaCoins(false);
    setIsNovelaSubmitting(false);
  }, [isNovelaSubmitting, trackTransmediaCreditEvent]);

  const handleSonoroEnter = useCallback(async () => {
    if (sonoroSpent) return;
    setShowSonoroCoins(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const result = await trackTransmediaCreditEvent({
      eventKey: 'sonoro_unlock',
      amount: -GAT_COSTS.sonoroMix,
      requiredTokens: GAT_COSTS.sonoroMix,
      actionLabel: 'Esta mezcla sonoro-poética',
      oncePerIdentity: true,
      metadata: { source: 'transmedia_sonoro' },
    });
    if (result.ok) {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: true, amount: GAT_COSTS.sonoroMix },
        })
      );
    }
    setShowSonoroCoins(false);
  }, [sonoroSpent, trackTransmediaCreditEvent]);

  const handleOpenGraphicSwipe = useCallback(
    async (entry) => {
      if (!entry?.previewPdfUrl || isGraphicUnlocking) return;
      setIsGraphicUnlocking(true);

      const openPdf = () => {
        handleOpenPdfPreview({
          src: entry.previewPdfUrl,
          title: entry.title,
          description: entry.description
            ? `${entry.description} · Modo swipe vertical.`
            : 'Modo swipe vertical del lector visual interactivo.',
        });
        setTimeout(() => setIsGraphicUnlocking(false), 150);
      };

      if (!graphicSpent) {
        setShowGraphicCoins(true);
        const result = await trackTransmediaCreditEvent({
          eventKey: 'graphic_unlock',
          amount: -GAT_COSTS.graficoSwipe,
          requiredTokens: GAT_COSTS.graficoSwipe,
          actionLabel: 'Este recorrido gráfico',
          oncePerIdentity: true,
          metadata: { source: 'transmedia_grafico', entryId: entry.id ?? null },
        });
        if (result.ok) {
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'grafico', spent: true, amount: GAT_COSTS.graficoSwipe },
            })
          );
          setTimeout(openPdf, 900);
        } else {
          setTimeout(() => setIsGraphicUnlocking(false), 150);
        }
        setTimeout(() => setShowGraphicCoins(false), 1100);
        return;
      }

      openPdf();
    },
    [graphicSpent, handleOpenPdfPreview, isGraphicUnlocking, trackTransmediaCreditEvent]
  );

  const handleActivateAR = useCallback(async () => {
    if (isTazaActivating) return;
    setIsTazaActivating(true);
    setShowTazaCoins(true);
    setTazaCameraReady(false);

    const result = await trackTransmediaCreditEvent({
      eventKey: 'taza_activation',
      amount: -30,
      requiredTokens: 30,
      actionLabel: 'Esta activación AR',
      metadata: { source: 'transmedia_taza' },
    });
    if (!result.ok) {
      setShowTazaCoins(false);
      setIsTazaActivating(false);
      return;
    }

    setIsTazaARActive(true);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      setIsMobileARFullscreen(true);
      document.body.classList.add('overflow-hidden');
    } else {
      setIsMobileARFullscreen(false);
    }

    setTimeout(() => {
      setShowTazaCoins(false);
      setIsTazaActivating(false);
    }, 700);

    if (result.ok && typeof result.state?.taza_activations === 'number') {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: true, amount: 30, count: result.state.taza_activations },
        })
      );
    }
  }, [isTazaActivating, trackTransmediaCreditEvent]);

  const handleCloseARExperience = useCallback(() => {
    setIsTazaARActive(false);
    setIsMobileARFullscreen(false);
    document.body.classList.remove('overflow-hidden');
    setIsTazaActivating(false);
    setTazaCameraReady(false);
  }, []);

  const handleARError = useCallback(
    (err) => {
      const description =
        err?.message ||
        'No pudimos iniciar la activación WebAR. Revisa permisos de cámara, luz y conexión.';
      toast({ description });
      setIsTazaARActive(false);
      setIsMobileARFullscreen(false);
      setTazaCameraReady(false);
      document.body.classList.remove('overflow-hidden');
    },
    [toast]
  );

  const handleProjectionInterest = useCallback(async () => {
    if (isProjectionInterestSubmitting || isProjectionInterestSent) return;
    setIsProjectionInterestSubmitting(true);
    try {
      const { error } = await supabase.rpc('register_cine_projection_interest', {
        p_showcase_id: 'copycats',
        p_source: 'transmedia_cine',
        p_metadata: {
          section: 'proyeccion',
          path: typeof window !== 'undefined' ? window.location.pathname : null,
          is_authenticated: isAuthenticated,
          is_subscriber: isSubscriber,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.warn('[Transmedia] No se pudo registrar interés de proyección:', error);
    } finally {
      setIsProjectionInterestSubmitting(false);
      setIsProjectionInterestSent(true);
      toast({ description: 'Interés registrado. Espera noticias de la proyección.' });
    }
  }, [isAuthenticated, isProjectionInterestSent, isProjectionInterestSubmitting, isSubscriber, toast]);

  const resetMiniversoUnlockState = useCallback(() => {
    setShowSonoroCoins(false);
    setShowGraphicCoins(false);
    setIsGraphicUnlocking(false);
    setShowTazaCoins(false);
  }, []);

  return {
    isNovelaSubmitting,
    showNovelaCoins,
    showSonoroCoins,
    isGraphicUnlocking,
    showGraphicCoins,
    isTazaActivating,
    tazaCameraReady,
    setTazaCameraReady,
    showTazaCoins,
    isTazaARActive,
    isMobileARFullscreen,
    isProjectionInterestSubmitting,
    isProjectionInterestSent,
    handleNovelaQuestionSend,
    handleSonoroEnter,
    handleOpenGraphicSwipe,
    handleActivateAR,
    handleCloseARExperience,
    handleProjectionInterest,
    handleARError,
    resetMiniversoUnlockState,
  };
};

export default useMiniversoUnlocks;
