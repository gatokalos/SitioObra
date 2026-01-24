import React, { useMemo, useState } from 'react';

const DEFAULT_MESSAGES = {
  idle: 'Para activar la experiencia WebAR necesitamos permiso para usar tu cámara.',
  requesting: 'Solicitando acceso a la cámara…',
  granted: 'Cámara lista. Si no ves la previsualización, asegúrate de apuntar a la taza.',
  insecure: 'Necesitas abrir este sitio en HTTPS para habilitar la cámara en móvil.',
  error: 'No pudimos usar la cámara de tu dispositivo.',
};

const CameraPermissionPrompt = ({
  onGranted,
  className = '',
  copy = {},
  variant = 'card',
}) => {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const mergedCopy = useMemo(() => ({ ...DEFAULT_MESSAGES, ...copy }), [copy]);

  const handleRequest = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setStatus('insecure');
      return;
    }
    // Saltamos el precheck y dejamos que el motor AR pida la cámara con sus propios constraints.
    setStatus('granted');
    onGranted?.();
  };

  const baseClasses =
    variant === 'overlay'
      ? 'w-full max-w-xs rounded-3xl border border-white/20 bg-black/70 p-6 text-center space-y-4 text-slate-200 backdrop-blur'
      : 'rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3 text-slate-300/90';

  return (
    <div className={`${baseClasses} ${className}`}>
      <p className="text-sm leading-relaxed">{mergedCopy[status]}</p>
      {status === 'error' && errorMessage ? (
        <p className="text-xs text-red-200/80">{errorMessage}</p>
      ) : null}
      {status !== 'granted' ? (
        <button
          type="button"
          onClick={handleRequest}
          className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold bg-purple-500/80 hover:bg-purple-500 transition text-white disabled:opacity-50"
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? 'Abriendo cámara…' : 'Activar cámara'}
        </button>
      ) : null}
    </div>
  );
};

export default CameraPermissionPrompt;
