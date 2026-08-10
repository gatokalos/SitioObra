import { useEffect, useMemo, useRef, useState } from 'react';

const FRAME_MS = 52;
const FRAMES_PER_BURST = 4;

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const uniqueChars = (value) => [...new Set([...value].filter((char) => char !== ' '))];

const useSignalDriftText = (target, { active = true, triggerKey = null } = {}) => {
  const [display, setDisplay] = useState(target);
  const timeoutRef = useRef(null);

  const charPool = useMemo(() => uniqueChars(target), [target]);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setDisplay(target);

    if (!active || !target || typeof window === 'undefined') {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      return undefined;
    }

    const chars = [...target];
    const mutableIndices = chars.reduce((indices, char, index) => {
      if (char !== ' ') indices.push(index);
      return indices;
    }, []);
    const hashIndex = chars.indexOf('#');
    const nonHashPool = charPool.filter((char) => char !== '#');
    let cancelled = false;

    const buildFrame = () => {
      const result = [...chars];
      const shouldMoveHash = hashIndex >= 0 && nonHashPool.length > 0 && Math.random() < 0.52;

      if (shouldMoveHash) {
        const targetIndex = pick(mutableIndices.filter((index) => index !== hashIndex));
        result[hashIndex] = pick(nonHashPool);
        result[targetIndex] = '#';
        return result.join('');
      }

      const mutationCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < mutationCount; i += 1) {
        const targetIndex = pick(mutableIndices);
        result[targetIndex] = pick(charPool);
      }

      return result.join('');
    };

    function runBurst() {
      let frame = 0;

      const step = () => {
        if (cancelled) return;
        if (frame >= FRAMES_PER_BURST) {
          setDisplay(target);
          return;
        }

        setDisplay(buildFrame());
        frame += 1;
        timeoutRef.current = window.setTimeout(step, FRAME_MS);
      };

      step();
    }

    // Un solo burst por señal externa. En el Hero, triggerKey es exactamente
    // el subtítulo que también remonta el pulso luminoso del emblema.
    runBurst();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, charPool, target, triggerKey]);

  return display;
};

export default useSignalDriftText;
