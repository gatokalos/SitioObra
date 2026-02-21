import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

const SEEN_PREFIX = 'bienvenida:seen:';
const RETURN_PATH_KEY = 'bienvenida:return-path';
const PENDING_KEY = 'bienvenida:pending';
const SKIP_KEY = 'bienvenida:skip';
const FORCE_ON_LOGIN_KEY = 'bienvenida:force-on-login';
const TRANSMEDIA_INTENT_KEY = 'bienvenida:transmedia-intent';
const FLOW_GOAL_KEY = 'bienvenida:flow-goal';

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

export const setBienvenidaForceOnLogin = () => {
  safeSetItem(FORCE_ON_LOGIN_KEY, 'true');
};

export const clearBienvenidaForceOnLogin = () => {
  safeRemoveItem(FORCE_ON_LOGIN_KEY);
};

export const isBienvenidaForceOnLogin = () => safeGetItem(FORCE_ON_LOGIN_KEY) === 'true';

export const setBienvenidaReturnPath = (path) => {
  if (!path) return;
  safeSetItem(RETURN_PATH_KEY, path);
};

export const getBienvenidaReturnPath = () => safeGetItem(RETURN_PATH_KEY);

export const clearBienvenidaReturnPath = () => safeRemoveItem(RETURN_PATH_KEY);

export const setBienvenidaFlowGoal = (goal) => {
  if (!goal || typeof goal !== 'string') return;
  safeSetItem(FLOW_GOAL_KEY, goal);
};

export const getBienvenidaFlowGoal = () => safeGetItem(FLOW_GOAL_KEY);

export const clearBienvenidaFlowGoal = () => safeRemoveItem(FLOW_GOAL_KEY);

export const setBienvenidaTransmediaIntent = (intent) => {
  if (!intent || typeof intent !== 'object') return;
  try {
    safeSetItem(TRANSMEDIA_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // Ignore malformed payloads; this key is only a best-effort handoff.
  }
};

export const consumeBienvenidaTransmediaIntent = () => {
  const raw = safeGetItem(TRANSMEDIA_INTENT_KEY);
  if (!raw) return null;
  safeRemoveItem(TRANSMEDIA_INTENT_KEY);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};
