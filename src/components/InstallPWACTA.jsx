import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const once = (fn) => {
  let called = false;
  return (...args) => {
    if (called) return;
    called = true;
    fn(...args);
  };
};

const InstallPWACTA = () => {
  const [promptEvent, setPromptEvent] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
  const isiOS = /iphone|ipad|ipod/i.test(userAgent);

  const handleInstallAttempt = async () => {
    if (!promptEvent) {
      setStatusMsg(
        isiOS ? (
          <>
            <span>En Safari toca el ícono de compartir y elige “Añadir a pantalla de inicio”.</span>
            <br />
            <span>Allí mismo verás la opción "Guardar como App Web".</span>
          </>
        ) : (
          'Si el botón no responde, abre el menú de tu navegador y busca “Instalar app” o “Agregar a pantalla de inicio”.'
        )
      );
      return;
    }
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setStatusMsg(
      choice?.outcome === 'accepted'
        ? 'Gracias. Ahora abre #GatoEncerrado desde tu pantalla de inicio y verás la experiencia sin barras.'
        : 'Perfecto, si quieres puedes instalarla cuando gustes.'
    );
    setPromptEvent(null);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateStandaloneState = () => {
      const nav = typeof navigator !== 'undefined' ? navigator : null;
      const mediaQuery = window.matchMedia('(display-mode: standalone)');

      const isStandaloneDisplay =
        Boolean(mediaQuery && mediaQuery.matches) || Boolean(nav?.standalone === true);
      setIsStandalone(isStandaloneDisplay);
    };

    updateStandaloneState();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const mediaListener = (event) => {
      if (event.matches) {
        setIsStandalone(true);
      } else {
        updateStandaloneState();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', mediaListener);
    } else {
      mediaQuery.addListener(mediaListener);
    }

    const handleAppInstalled = once(() => {
      setIsStandalone(true);
      setStatusMsg('Listo: la app ya está instalada y se abre sin barras del navegador.');
    });

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaListener);
      } else {
        mediaQuery.removeListener(mediaListener);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const showIosHint = isiOS && !isStandalone;
  const showInstallButton = isMobile && !isStandalone;
  const shouldRender = isMobile && !isStandalone;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-left text-slate-100 space-y-4">
      <p className="text-sm leading-relaxed">
        Para vivir #GatoEncerrado como una app nativa y ocultar las barras del navegador, instálala en tu móvil.
      </p>

      {showInstallButton && (
        <div className="flex flex-col gap-2">
          <Button onClick={handleInstallAttempt} variant="outline">
            Instalar App Web
          </Button>
          {!promptEvent && !isiOS && !statusMsg && (
            <p className="text-xs text-slate-400">
              Si el botón no responde, abre el menú de tu navegador y busca “Instalar app” o “Agregar a pantalla de inicio”.
            </p>
          )}
        </div>
      )}

      

      {statusMsg && (
        <p className="text-xs text-emerald-300" aria-live="polite">
          {statusMsg}
        </p>
      )}
    </div>
  );
};

export default InstallPWACTA;
