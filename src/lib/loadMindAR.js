const MINDAR_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';

let loaderPromise = null;

export function loadMindAR() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MindAR solo está disponible en el navegador.'));
  }

  if (window.MINDAR?.IMAGE?.MindARThree) {
    return Promise.resolve(window.MINDAR.IMAGE);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${MINDAR_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.MINDAR?.IMAGE) {
          resolve(window.MINDAR.IMAGE);
        } else {
          reject(new Error('MindAR no se inicializó correctamente.'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar MindAR.')));
      return;
    }

    const script = document.createElement('script');
    script.src = MINDAR_SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', () => {
      if (window.MINDAR?.IMAGE) {
        resolve(window.MINDAR.IMAGE);
      } else {
        reject(new Error('MindAR no se inicializó correctamente.'));
      }
    });
    script.addEventListener('error', () => reject(new Error('No se pudo cargar MindAR.')));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export default loadMindAR;
