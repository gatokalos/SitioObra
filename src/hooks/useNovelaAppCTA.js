import { useCallback } from 'react';
import { GAT_COSTS } from '@/components/transmedia/transmediaConstants';

/**
 * Manages novela app CTA interactions: WebAR stub, camera QR, and autoficcion preview unlock.
 *
 * @param {object}   deps
 * @param {Function} deps.requireShowcaseAuth
 * @param {Function} deps.trackTransmediaCreditEvent
 * @param {Function} deps.setShowAutoficcionPreview
 * @param {Function} deps.toast
 */
const useNovelaAppCTA = ({
  requireShowcaseAuth,
  trackTransmediaCreditEvent,
  setShowAutoficcionPreview,
  toast,
}) => {
  const handleLaunchWebAR = useCallback(
    (message) => {
      toast({
        description: message || 'Muy pronto liberaremos la activación WebAR de este objeto.',
      });
    },
    [toast]
  );

  const handleOpenCameraForQR = useCallback(async () => {
    if (!requireShowcaseAuth('Inicia sesión para usar esta activación.', { action: 'open-camera-qr' })) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({ description: 'Tu dispositivo no permite abrir la cámara desde el navegador.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      toast({
        description: 'Listo. En la versión final validaremos el QR con geolocalización para redimir tu ejemplar.',
      });
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({ description: 'No pudimos acceder a la cámara. Revisa los permisos e inténtalo de nuevo.' });
    }
  }, [requireShowcaseAuth, toast]);

  const handleNovelAppCTA = useCallback(
    async (app) => {
      if (!app) return;

      if (app.ctaUrl) {
        window.open(app.ctaUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      if (app.ctaAction === 'openCamera') {
        handleOpenCameraForQR();
        return;
      }

      if (app.ctaAction === 'openAutoficcionPreview') {
        const result = await trackTransmediaCreditEvent({
          eventKey: 'showcase_boost:novela_fragment_unlock',
          amount: -GAT_COSTS.novelaChapter,
          requiredTokens: GAT_COSTS.novelaChapter,
          actionLabel: 'Esta lectura de fragmentos',
          oncePerIdentity: true,
          metadata: { source: 'transmedia_novela_fragmentos' },
        });
        if (!result.ok) {
          return;
        }
        setShowAutoficcionPreview(true);
        return;
      }

      toast({
        description: app.ctaMessage || 'Muy pronto liberaremos esta app interactiva.',
      });
    },
    [handleOpenCameraForQR, setShowAutoficcionPreview, trackTransmediaCreditEvent, toast]
  );

  return { handleLaunchWebAR, handleOpenCameraForQR, handleNovelAppCTA };
};

export default useNovelaAppCTA;
