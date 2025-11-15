const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

let threePromise = null;

export function loadThree() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Three.js solo está disponible en el navegador.'));
  }

  if (window.__THREE_INSTANCE__) {
    return Promise.resolve(window.__THREE_INSTANCE__);
  }

  if (!threePromise) {
    threePromise = import(/* @vite-ignore */ THREE_MODULE_URL).then((module) => {
      window.__THREE_INSTANCE__ = module;
      return module;
    });
  }

  return threePromise;
}

export default loadThree;
