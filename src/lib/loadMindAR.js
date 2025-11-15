const MINDAR_MODULE_URL = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

let loaderPromise = null;

export function loadMindAR() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MindAR solo está disponible en el navegador.'));
  }

  if (window.MINDAR?.IMAGE?.MindARThree) {
    return Promise.resolve(window.MINDAR.IMAGE);
  }

  if (!loaderPromise) {
    loaderPromise = import(/* @vite-ignore */ MINDAR_MODULE_URL)
      .then((module) => {
        if (module?.MindARThree) {
          return module;
        }

        if (window.MINDAR?.IMAGE?.MindARThree) {
          return window.MINDAR.IMAGE;
        }

        throw new Error('MindAR no se inicializó correctamente.');
      })
      .catch((error) => {
        console.error('[loadMindAR] Error al importar MindAR:', error);
        throw error;
      });
  }

  return loaderPromise;
}

export default loadMindAR;
