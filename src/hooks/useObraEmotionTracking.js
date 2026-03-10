import { useState, useEffect, useCallback } from 'react';
import { safeSetItem } from '@/lib/safeStorage';
import {
  OBRA_EMOTION_LOG_STORAGE_KEY,
  OBRA_EMOTION_ORBS_STORAGE_KEY,
  OBRA_EMOTION_MAX_ORBS,
  OBRA_VOICE_MODES,
  DEFAULT_OBRA_VOICE_MODE_ID,
  readStoredJson,
  createEmotionOrb,
  normalizeStoredEmotionOrbs,
} from '@/components/transmedia/transmediaConstants';

const useObraEmotionTracking = () => {
  const [obraModeUsage, setObraModeUsage] = useState(() => {
    const raw = readStoredJson(OBRA_EMOTION_LOG_STORAGE_KEY, {});
    return OBRA_VOICE_MODES.reduce((acc, mode) => {
      const value = Number(raw?.[mode.id] ?? 0);
      acc[mode.id] = Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
      return acc;
    }, {});
  });

  const [obraEmotionOrbs, setObraEmotionOrbs] = useState(() => {
    const raw = readStoredJson(OBRA_EMOTION_ORBS_STORAGE_KEY, []);
    return normalizeStoredEmotionOrbs(raw);
  });

  useEffect(() => {
    safeSetItem(OBRA_EMOTION_LOG_STORAGE_KEY, JSON.stringify(obraModeUsage));
  }, [obraModeUsage]);

  useEffect(() => {
    safeSetItem(OBRA_EMOTION_ORBS_STORAGE_KEY, JSON.stringify(obraEmotionOrbs));
  }, [obraEmotionOrbs]);

  const incrementObraModeUsage = useCallback((modeId) => {
    const normalized = OBRA_VOICE_MODES.some((mode) => mode.id === modeId)
      ? modeId
      : DEFAULT_OBRA_VOICE_MODE_ID;
    setObraModeUsage((prev) => ({
      ...prev,
      [normalized]: (Number(prev?.[normalized] ?? 0) || 0) + 1,
    }));
    setObraEmotionOrbs((prev) => {
      const nextSeed = Date.now() + prev.length * 37;
      const next = [...prev, createEmotionOrb(normalized, nextSeed, prev.length)];
      return next.slice(-OBRA_EMOTION_MAX_ORBS);
    });
  }, []);

  return { obraModeUsage, obraEmotionOrbs, setObraEmotionOrbs, incrementObraModeUsage };
};

export default useObraEmotionTracking;
