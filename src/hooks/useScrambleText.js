import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const INTERVAL_MS = 26;
const SPLIT_FLAP_HOLD_MS = 96;

const useScrambleText = (target, { active = true } = {}) => {
  const [display, setDisplay] = useState(target);
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    if (!active || !target || typeof window === 'undefined') {
      setDisplay(target);
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setDisplay(target);
      return undefined;
    }

    const chars = [...target];
    const nonSpaceIndices = chars.reduce((acc, ch, i) => {
      if (ch !== ' ') acc.push(i);
      return acc;
    }, []);
    const totalFrames = Math.max(nonSpaceIndices.length * 2, 10);
    let frame = 0;

    const getScrambleChar = () =>
      SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)].toLowerCase();

    const buildFrame = (revealedCount) => {
      const result = [...chars];
      nonSpaceIndices.forEach((idx, pos) => {
        result[idx] = pos < revealedCount ? chars[idx] : getScrambleChar();
      });
      return result.join('');
    };

    timerRef.current = window.setInterval(() => {
      frame += 1;
      const revealed = Math.min(
        nonSpaceIndices.length,
        Math.floor((frame / totalFrames) * nonSpaceIndices.length)
      );
      setDisplay(buildFrame(revealed));

      if (frame >= totalFrames) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        setDisplay(buildFrame(nonSpaceIndices.length - 1));
        timeoutRef.current = window.setTimeout(() => {
          setDisplay(target);
          timeoutRef.current = null;
        }, SPLIT_FLAP_HOLD_MS);
      }
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [target, active]);

  return display;
};

export default useScrambleText;
