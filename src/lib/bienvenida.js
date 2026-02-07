import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

const SEEN_PREFIX = 'bienvenida:seen:';
const RETURN_PATH_KEY = 'bienvenida:return-path';
const PENDING_KEY = 'bienvenida:pending';
const SKIP_KEY = 'bienvenida:skip';

export const hasSeenBienvenida = (userId) => {
  if (!userId) return false;
  return safeGetItem(`${SEEN_PREFIX}${userId}`) === 'true';
};

export const markBienvenidaSeen = (userId) => {
  if (!userId) return;
  safeSetItem(`${SEEN_PREFIX}${userId}`, 'true');
};

export const setBienvenidaPending = () => {
  safeSetItem(PENDING_KEY, 'true');
};

export const clearBienvenidaPending = () => {
  safeRemoveItem(PENDING_KEY);
};

export const isBienvenidaPending = () => safeGetItem(PENDING_KEY) === 'true';

export const setBienvenidaSkip = () => {
  safeSetItem(SKIP_KEY, 'true');
};

export const clearBienvenidaSkip = () => {
  safeRemoveItem(SKIP_KEY);
};

export const isBienvenidaSkip = () => safeGetItem(SKIP_KEY) === 'true';

export const setBienvenidaReturnPath = (path) => {
  if (!path) return;
  safeSetItem(RETURN_PATH_KEY, path);
};

export const getBienvenidaReturnPath = () => safeGetItem(RETURN_PATH_KEY);

export const clearBienvenidaReturnPath = () => safeRemoveItem(RETURN_PATH_KEY);
