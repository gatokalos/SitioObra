import React, { useState } from 'react';
import CameraPermissionPrompt from '@/components/ar/CameraPermissionPrompt';
import MindARScene from '@/components/ar/MindARScene';

const ARExperience = ({ targetSrc = '/assets/targets.mind' }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);

  return (
    <section className="space-y-6">
      <CameraPermissionPrompt onGranted={() => setIsCameraReady(true)} />
      <MindARScene targetSrc={targetSrc} isCameraReady={isCameraReady} />
      <p className="text-sm text-slate-400/80">
        Si el marcador no se detecta de inmediato, ajusta la iluminación y mantén la taza completa dentro del encuadre.
      </p>
    </section>
  );
};

export default ARExperience;
