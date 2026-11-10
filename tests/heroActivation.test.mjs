import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

const local = new Map();
const session = new Map();
const events = [];
let installed = false;
let blocked = false;
let now = 1_800_000_000_000;
let instance = 0;
const originalNow = Date.now;
const originalWindow = globalThis.window;
const originalCustomEvent = globalThis.CustomEvent;
const storage = (values) => ({
  getItem(key) {
    if (blocked) throw new Error('Storage blocked');
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    if (blocked) throw new Error('Storage blocked');
    values.set(key, String(value));
  },
  removeItem(key) {
    if (blocked) throw new Error('Storage blocked');
    values.delete(key);
  },
});

globalThis.window = {
  localStorage: storage(local),
  sessionStorage: storage(session),
  location: { protocol: 'http:' },
  navigator: {},
  matchMedia: () => ({ matches: installed }),
  dispatchEvent: (event) => events.push(event.type),
};
globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
Date.now = () => now;

// Otra instancia del módulo representa una nueva carga del documento, con el
// mismo almacenamiento de navegador y sin conservar sus variables en memoria.
const loadVisit = () => import(`../src/lib/heroActivation.js?visit=${++instance}`);
const day = 24 * 60 * 60 * 1000;

beforeEach(() => {
  local.clear();
  session.clear();
  events.length = 0;
  installed = false;
  blocked = false;
  now = 1_800_000_000_000;
});

after(() => {
  Date.now = originalNow;
  globalThis.window = originalWindow;
  globalThis.CustomEvent = originalCustomEvent;
});

test('Una primera visita necesita el ritual y una visita sola no lo completa', async () => {
  const visit = await loadVisit();
  assert.equal(visit.readHeroActivatedFromSession(), false);
  assert.equal(visit.readIndexCueUsedFromSession(), false);
  visit.recordHeroBrowserActivity();
  assert.equal(local.has(visit.HERO_BROWSER_LAST_USE_KEY), false);
});

test('La activación revela el índice al completar el viaje; una recarga restaura ambos', async () => {
  const visit = await loadVisit();
  visit.writeHeroActivatedToSession(true);
  assert.equal(visit.readHeroActivatedFromSession(), true);
  assert.equal(visit.readIndexCueUsedFromSession(), false);
  visit.writeIndexCueUsedToSession();
  assert.equal(visit.readIndexCueUsedFromSession(), true);
  const reloaded = await loadVisit();
  assert.equal(reloaded.readHeroActivatedFromSession(), true);
  assert.equal(reloaded.readIndexCueUsedFromSession(), true);
});

test('Cerrar la pestaña conserva la escena en el mismo navegador', async () => {
  const visit = await loadVisit();
  visit.writeHeroActivatedToSession(true);
  session.clear();
  now += 2 * day;
  const returned = await loadVisit();
  assert.equal(returned.readHeroActivatedFromSession(), true);
  assert.equal(returned.readIndexCueUsedFromSession(), true);
});

test('A los siete días vencen juntos la escena y el índice, aun con banderas antiguas', async () => {
  const visit = await loadVisit();
  visit.writeHeroActivatedToSession(true);
  visit.writeIndexCueUsedToSession();
  now += visit.HERO_RETURN_WINDOW_MS;
  const returned = await loadVisit();
  assert.equal(returned.readIndexCueUsedFromSession(), false);
  assert.equal(returned.readHeroActivatedFromSession(), false);
  assert.equal(session.has(visit.HERO_ACTIVATED_SESSION_KEY), false);
  assert.equal(session.has(visit.HERO_INDEX_CUE_USED_SESSION_KEY), false);
  const reloadedAgain = await loadVisit();
  assert.equal(reloadedAgain.readHeroActivatedFromSession(), false);
});

test('El último uso renueva la ventana durante el recorrido', async () => {
  const visit = await loadVisit();
  visit.writeHeroActivatedToSession(true);
  now += 6 * day;
  visit.recordHeroBrowserActivity();
  assert.equal(Number(local.get(visit.HERO_BROWSER_LAST_USE_KEY)), now);
  now += 6 * day;
  session.clear();
  const returned = await loadVisit();
  assert.equal(returned.readHeroActivatedFromSession(), true);
});

test('Volver a una pestaña abandonada siete días restablece el ritual una sola vez', async () => {
  const visit = await loadVisit();
  visit.writeHeroActivatedToSession(true);
  visit.writeIndexCueUsedToSession();
  now += 8 * day;
  visit.recordHeroBrowserActivity();
  visit.recordHeroBrowserActivity();
  assert.equal(visit.readHeroActivatedFromSession(), false);
  assert.equal(visit.readIndexCueUsedFromSession(), false);
  assert.deepEqual(events, [visit.HERO_RITUAL_RESET_EVENT, 'gatoencerrado:audio-deactivated']);
  const returned = await loadVisit();
  assert.equal(returned.readHeroActivatedFromSession(), false);
});

test('Una sesión anterior completada migra una vez a la memoria con fecha', async () => {
  const visit = await loadVisit();
  session.set(visit.HERO_INDEX_CUE_USED_SESSION_KEY, 'true');
  assert.equal(visit.readHeroActivatedFromSession(), true);
  assert.equal(Number(local.get(visit.HERO_BROWSER_LAST_USE_KEY)), now);
});

test('Fechas inválidas o futuras no rescatan un índice antiguo', async () => {
  for (const value of ['incorrecta', String(now + day), '0']) {
    const visit = await loadVisit();
    local.set(visit.HERO_BROWSER_LAST_USE_KEY, value);
    session.set(visit.HERO_INDEX_CUE_USED_SESSION_KEY, 'true');
    assert.equal(visit.readHeroActivatedFromSession(), false);
    assert.equal(visit.readIndexCueUsedFromSession(), false);
  }
});

test('La PWA conserva las lecturas de sesión y no modifica la ventana del navegador', async () => {
  installed = true;
  const visit = await loadVisit();
  const expired = String(now - 20 * day);
  local.set(visit.HERO_BROWSER_LAST_USE_KEY, expired);
  assert.equal(visit.readHeroActivatedFromSession(), false);
  visit.writeHeroActivatedToSession(true);
  visit.writeIndexCueUsedToSession();
  now += 20 * day;
  visit.recordHeroBrowserActivity();
  assert.equal(visit.readHeroActivatedFromSession(), true);
  assert.equal(visit.readIndexCueUsedFromSession(), true);
  assert.equal(local.get(visit.HERO_BROWSER_LAST_USE_KEY), expired);
  assert.deepEqual(events, []);
});

test('Sin almacenamiento la entrada sigue funcionando en memoria', async () => {
  const visit = await loadVisit();
  blocked = true;
  assert.equal(visit.readHeroActivatedFromSession(), false);
  visit.writeHeroActivatedToSession(true);
  visit.writeIndexCueUsedToSession();
  assert.equal(visit.readHeroActivatedFromSession(), true);
  assert.equal(visit.readIndexCueUsedFromSession(), true);
  visit.writeHeroActivatedToSession(false);
  assert.equal(visit.readHeroActivatedFromSession(), false);
  assert.equal(visit.readIndexCueUsedFromSession(), false);
});
