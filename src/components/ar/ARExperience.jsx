import React, { useEffect, useMemo, useState } from 'react';
import CameraPermissionPrompt from '@/components/ar/CameraPermissionPrompt';
import MindARScene from '@/components/ar/MindARScene';
import { Button } from '@/components/ui/button';

const DEFAULT_PHRASES = ['La taza te escucha.'];

const ARExperience = ({ targetSrc = '/assets/targets.mind', phrases = DEFAULT_PHRASES, onExit }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

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

  return (
    <section className="space-y-4">
      <CameraPermissionPrompt onGranted={() => setIsCameraReady(true)} />
      <MindARScene
        targetSrc={targetSrc}
        isCameraReady={isCameraReady}
        message={phraseList[phraseIndex]}
        className="w-full h-[60vh] sm:h-[65vh]"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleNextPhrase} className="flex-1">
          Nueva frase
        </Button>
        <Button variant="ghost" onClick={handleExit} className="flex-1">
          Salir
        </Button>
      </div>
      <p className="text-sm text-slate-400/80">
        Si el marcador no se detecta de inmediato, ajusta la iluminación y mantén la taza completa dentro del encuadre.
      </p>
    </section>
  );
};

export default ARExperience;
