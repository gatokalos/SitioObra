import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CameraPermissionPrompt from '@/components/ar/CameraPermissionPrompt';
import MindARScene from '@/components/ar/MindARScene';
import { toast } from '@/components/ui/use-toast';
import { RotateCcw, Share2, X } from 'lucide-react';

const DEFAULT_PHRASES = ['La taza te escucha.'];

const ARExperience = ({ targetSrc = '/assets/targets.mind', phrases = DEFAULT_PHRASES, onExit }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const sceneRef = useRef(null);

  const phraseList = useMemo(() => {
    if (Array.isArray(phrases) && phrases.length > 0) {
      return phrases;
    }
    return DEFAULT_PHRASES;
  }, [phrases]);

  useEffect(() => {
    setPhraseIndex(0);
  }, [targetSrc]);

  const handleNextPhrase = () => {
    setPhraseIndex((prev) => (prev + 1) % phraseList.length);
  };

  const handleExit = () => {
    onExit?.();
  };

  const handleShareCapture = useCallback(async () => {
    if (!sceneRef.current?.captureFrame) {
      toast({ description: 'La cámara aún no está lista para capturar.' });
      return;
    }
    try {
      const blob = await sceneRef.current.captureFrame();
      if (!blob) {
        toast({ description: 'No pudimos obtener la captura. Intenta de nuevo.' });
        return;
      }
      const file = new File([blob], 'miniverso-taza.jpg', { type: 'image/jpeg' });
      const shareText =
        '#EstoNoEsUnaTaza · Comparte tu constelación y etiqueta a @gatoencerradoai para aparecer en la galería.';

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Miniverso Taza',
          text: shareText,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'miniverso-taza.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          description: 'Guardamos la captura. Compártela desde tu galería con #EstoNoEsUnaTaza.',
        });
      }
    } catch (error) {
      console.error('[ARExperience] Error al compartir captura:', error);
      toast({ description: 'No pudimos compartir la captura. Intenta más tarde.' });
    }
  }, []);

  const iconButtonClass =
    'rounded-full bg-black/55 text-white p-3 shadow-lg border border-white/15 hover:bg-black/70 transition backdrop-blur';

  const overlayControls = (
    <div className="pointer-events-auto flex items-center gap-3">
      <button type="button" onClick={handleNextPhrase} className={iconButtonClass} aria-label="Nueva frase">
        <RotateCcw size={18} />
      </button>
      <button type="button" onClick={handleShareCapture} className={iconButtonClass} aria-label="Compartir captura">
        <Share2 size={18} />
      </button>
      <button type="button" onClick={handleExit} className={iconButtonClass} aria-label="Salir de AR">
        <X size={18} />
      </button>
    </div>
  );

  return (
    <section className="space-y-4 -mx-4 sm:mx-0">
      <CameraPermissionPrompt onGranted={() => setIsCameraReady(true)} />
      <MindARScene
        ref={sceneRef}
        targetSrc={targetSrc}
        isCameraReady={isCameraReady}
        message={phraseList[phraseIndex]}
        className="w-full min-h-[75vh] sm:min-h-[80vh]"
        overlay={overlayControls}
      />
      <p className="text-sm text-slate-400/80 px-4 sm:px-0">
        Si el marcador no se detecta de inmediato, ajusta la iluminación y mantén la taza completa dentro del encuadre.
      </p>
    </section>
  );
};

export default ARExperience;
