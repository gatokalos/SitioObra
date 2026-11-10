import { isAppleTouchDevice, isIosSafari } from './platformDetection.js';

export const PWA_INSTALL_STEP_COUNT = 4;
const PROGRESS_KEY = 'gatoencerrado:pwa-install-guide:v1';
const FINISH = { symbol: 'universe', text: 'Listo: un universo en tu bolsillo.' };
const CHROME_STEPS = [
  { symbol: 'menu', text: 'Toca el menú ⋮ de Chrome.' },
  { symbol: 'download', text: 'Elige “Instalar app” o “Agregar a inicio”.' },
  { symbol: 'check', text: 'Confirma en el diálogo.' },
  FINISH,
];
const IOS_ENDING = [
  { symbol: 'plus', text: 'Elige “Añadir a pantalla de inicio”.' },
  { symbol: 'check', text: 'Activa “Abrir como app web” y confirma.' },
  FINISH,
];

export const getPwaInstallFlow = () => {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  if (isAppleTouchDevice()) {
    if (isIosSafari()) {
      return {
        id: 'ios-safari',
        steps: [
          { symbol: 'share', text: 'Toca Compartir en Safari; si está oculto, abre ⋯.' },
          ...IOS_ENDING,
        ],
      };
    }
    if (/crios/i.test(ua)) {
      return {
        id: 'ios-chrome',
        steps: [
          { symbol: 'share', text: 'Toca Compartir en Chrome, junto a la barra de direcciones.' },
          IOS_ENDING[0],
          { symbol: 'check', text: 'Confirma con “Añadir”.' },
          FINISH,
        ],
      };
    }
    return {
      id: 'ios-other',
      steps: [
        { symbol: 'share', text: 'Abre este sitio en Safari y toca Compartir.' },
        ...IOS_ENDING,
      ],
    };
  }
  if (/edga|samsungbrowser|firefox|opr\//i.test(ua)) {
    return {
      id: 'android-other',
      steps: [
        { symbol: 'menu', text: 'Abre el menú de tu navegador.' },
        { symbol: 'download', text: 'Busca “Instalar app” o “Agregar a pantalla de inicio”.' },
        CHROME_STEPS[2],
        FINISH,
      ],
    };
  }
  return { id: 'android-chrome', steps: CHROME_STEPS };
};

const clampStep = (value) => {
  const step = Number(value);
  return Number.isInteger(step) ? Math.max(0, Math.min(step, PWA_INSTALL_STEP_COUNT)) : 0;
};

export const nextPwaInstallStep = (step) => Math.min(clampStep(step) + 1, PWA_INSTALL_STEP_COUNT);

export const readPwaInstallStep = (flowId) => {
  if (typeof window === 'undefined') return 0;
  try {
    return clampStep(window.sessionStorage.getItem(`${PROGRESS_KEY}:${flowId}`));
  } catch {
    return 0;
  }
};

export const writePwaInstallStep = (flowId, step) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${PROGRESS_KEY}:${flowId}`, String(clampStep(step)));
  } catch {
    // El estado de React conserva el paso si el navegador bloquea storage.
  }
};
