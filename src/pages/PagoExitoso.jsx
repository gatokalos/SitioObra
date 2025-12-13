import React, { useEffect, useState } from 'react';

const PagoExitoso = () => {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('session_id') ?? '');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-center text-gray-900">
      <div className="max-w-lg space-y-4">
        <h1 className="font-headline text-3xl font-bold tracking-widest uppercase">Pago confirmado</h1>
        <p className="text-lg">Pago confirmado. Gracias por apoyar este proyecto.</p>
        {sessionId && (
          <p className="text-sm text-gray-500">
            ID de sesión: <span className="font-mono">{sessionId}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default PagoExitoso;
