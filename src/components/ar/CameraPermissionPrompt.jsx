import React, { useMemo, useState } from 'react';

const DEFAULT_MESSAGES = {
  idle: 'Para activar la experiencia WebAR necesitamos permiso para usar tu cámara.',
  requesting: 'Solicitando acceso a la cámara…',
  granted: 'Cámara lista. Si no ves la previsualización, asegúrate de apuntar a la taza.',
  error: 'No pudimos usar la cámara de tu dispositivo.',
};

const CameraPermissionPrompt = ({ onGranted, className = '', copy = {} }) => {
  const [status, setStatus] = useState('idle');
  const mergedCopy = useMemo(() => ({ ...DEFAULT_MESSAGES, ...copy }), [copy]);

  const handleRequest = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      return;
    }
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      setStatus('granted');
      onGranted?.();
    } catch (error) {
      console.error('[CameraPermissionPrompt] Error al iniciar cámara:', error);
      setStatus('error');
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3 ${className}`}>
      <p className="text-sm text-slate-300/90">{mergedCopy[status]}</p>
      {status !== 'granted' ? (
        <button
          type="button"
          onClick={handleRequest}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-purple-500/80 hover:bg-purple-500 transition text-white disabled:opacity-50"
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? 'Abriendo cámara…' : 'Activar cámara'}
        </button>
      ) : null}
    </div>
  );
};

export default CameraPermissionPrompt;
