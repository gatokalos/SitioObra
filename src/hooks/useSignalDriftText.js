import { useEffect, useMemo, useRef, useState } from 'react';

const FRAME_MS = 52;
const FRAMES_PER_BURST = 4;
const FIRST_BURST_DELAY_MS = 650;
const MIN_IDLE_MS = 1200;
const MAX_IDLE_MS = 2400;

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const uniqueChars = (value) => [...new Set([...value].filter((char) => char !== ' '))];

const useSignalDriftText = (target, { active = true } = {}) => {
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

    const randomIdleDelay = () => MIN_IDLE_MS + Math.floor(Math.random() * (MAX_IDLE_MS - MIN_IDLE_MS));

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

    const schedule = (delay) => {
      timeoutRef.current = window.setTimeout(runBurst, delay);
    };

    function runBurst() {
      let frame = 0;

      const step = () => {
        if (cancelled) return;
        if (frame >= FRAMES_PER_BURST) {
          setDisplay(target);
          schedule(randomIdleDelay());
          return;
        }

        setDisplay(buildFrame());
        frame += 1;
        timeoutRef.current = window.setTimeout(step, FRAME_MS);
      };

      step();
    }

    schedule(FIRST_BURST_DELAY_MS);

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, charPool, target]);

  return display;
};

export default useSignalDriftText;
