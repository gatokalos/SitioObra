import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import {
  getPwaInstallFlow,
  nextPwaInstallStep,
  readPwaInstallStep,
  writePwaInstallStep,
} from '../src/lib/pwaInstallGuide.js';

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalWindow = globalThis.window;
const stored = new Map();
const setNavigator = (value) => Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { userAgent: '', platform: '', maxTouchPoints: 0, ...value },
});

beforeEach(() => {
  stored.clear();
  setNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/131.0 Mobile Safari/537.36' });
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
  };
});

after(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
  globalThis.window = originalWindow;
});

test('Chrome Android utiliza menú, descarga y confirmación', () => {
  const flow = getPwaInstallFlow();
  assert.equal(flow.id, 'android-chrome');
  assert.deepEqual(flow.steps.map((step) => step.symbol), ['menu', 'download', 'check', 'universe']);
  assert.equal(flow.steps[0].text, 'Toca el menú ⋮ de Chrome.');
  assert.equal(flow.steps[3].text, 'Listo: un universo en tu bolsillo.');
});

test('Safari iPhone utiliza Compartir y la opción de app web', () => {
  setNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Version/26.0 Mobile Safari/604.1' });
  const flow = getPwaInstallFlow();
  assert.equal(flow.id, 'ios-safari');
  assert.equal(flow.steps[0].symbol, 'share');
  assert.match(flow.steps[1].text, /pantalla de inicio/);
  assert.match(flow.steps[2].text, /app web/);
});

test('iPad con user agent de escritorio conserva el recorrido de Safari', () => {
  setNavigator({ userAgent: 'Mozilla/5.0 (Macintosh) Version/26.0 Safari/605.1', platform: 'MacIntel', maxTouchPoints: 5 });
  assert.equal(getPwaInstallFlow().id, 'ios-safari');
});

test('Chrome iPhone utiliza Compartir y no el menú Android', () => {
  setNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0) CriOS/131.0 Mobile Safari/604.1' });
  const flow = getPwaInstallFlow();
  assert.equal(flow.id, 'ios-chrome');
  assert.equal(flow.steps[0].symbol, 'share');
  assert.match(flow.steps[2].text, /Añadir/);
});

test('Otros navegadores Android no se identifican como Chrome', () => {
  for (const browser of ['Firefox/131.0', 'SamsungBrowser/27.0', 'EdgA/131.0', 'OPR/80.0']) {
    setNavigator({ userAgent: `Mozilla/5.0 (Android 14) ${browser}` });
    const flow = getPwaInstallFlow();
    assert.equal(flow.id, 'android-other');
    assert.doesNotMatch(flow.steps[0].text, /Chrome/);
  }
});

test('La secuencia avanza hasta cuatro y permanece en su culminación', () => {
  let step = 0;
  for (let expected = 1; expected <= 4; expected++) {
    step = nextPwaInstallStep(step);
    assert.equal(step, expected);
  }
  for (let i = 0; i < 10; i++) assert.equal(nextPwaInstallStep(step), 4);
});

test('El paso se conserva al volver a leer la sesión y queda separado por navegador', () => {
  writePwaInstallStep('ios-safari', 3);
  assert.equal(readPwaInstallStep('ios-safari'), 3);
  assert.equal(readPwaInstallStep('android-chrome'), 0);
  writePwaInstallStep('ios-safari', 4);
  assert.equal(readPwaInstallStep('ios-safari'), 4);
});

test('Valores dañados y almacenamiento bloqueado tienen un inicio seguro', () => {
  for (const value of ['NaN', 'incorrecto', '1.5']) {
    writePwaInstallStep('android-chrome', value);
    assert.equal(readPwaInstallStep('android-chrome'), 0);
  }
  window.sessionStorage.getItem = () => { throw new Error('blocked'); };
  window.sessionStorage.setItem = () => { throw new Error('blocked'); };
  assert.equal(readPwaInstallStep('android-chrome'), 0);
  assert.doesNotThrow(() => writePwaInstallStep('android-chrome', 2));
});
