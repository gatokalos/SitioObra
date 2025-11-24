const memoryStore = new Map();

const memoryStorage = {
  type: 'memory',
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
  clear: () => memoryStore.clear(),
  key: (index) => Array.from(memoryStore.keys())[index] ?? null,
  get length() {
    return memoryStore.size;
  },
};

const cookieStorage = {
  type: 'cookie',
  getItem: (key) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (key, value) => {
    if (typeof document === 'undefined') return;
    const encoded = encodeURIComponent(value);
    document.cookie = `${key}=${encoded}; path=/; SameSite=Lax`;
  },
  removeItem: (key) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  },
  clear: () => {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; path=/; max-age=0; SameSite=Lax`;
    });
  },
  key: () => null,
  get length() {
    if (typeof document === 'undefined' || !document.cookie) return 0;
    return document.cookie.split(';').length;
  },
};

const tryStorage = (candidate) => {
  if (!candidate) return null;
  try {
    const probeKey = `safe-storage-probe-${Math.random().toString(36).slice(2)}`;
    candidate.setItem(probeKey, 'ok');
    const ok = candidate.getItem(probeKey) === 'ok';
    candidate.removeItem(probeKey);
    return ok ? candidate : null;
  } catch (err) {
    return null;
  }
};

const detectSafeStorage = () => {
  if (typeof window === 'undefined') {
    return { storage: memoryStorage, type: 'memory' };
  }

  const candidates = [
    { type: 'local', ref: window.localStorage },
    { type: 'session', ref: window.sessionStorage },
  ];

  for (const candidate of candidates) {
    const working = tryStorage(candidate.ref);
    if (working) {
      return { storage: working, type: candidate.type };
    }
  }

  const cookieWorking = tryStorage(cookieStorage);
  if (cookieWorking) {
    return { storage: cookieStorage, type: 'cookie' };
  }

  return { storage: memoryStorage, type: 'memory' };
};

const detected = detectSafeStorage();
export const safeStorage = detected.storage;
export const safeStorageType = detected.type;

export const safeGetItem = (key) => {
  try {
    return safeStorage.getItem(key);
  } catch (err) {
    return null;
  }
};

export const safeSetItem = (key, value) => {
  try {
    safeStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
};

export const safeRemoveItem = (key) => {
  try {
    safeStorage.removeItem(key);
  } catch (err) {
    // ignore
  }
};
