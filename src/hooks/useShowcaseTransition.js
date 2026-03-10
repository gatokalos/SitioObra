import { useState, useCallback, useEffect, useRef } from 'react';
import { showcaseDefinitions, SHOWCASE_OPEN_TRANSITION } from '@/components/transmedia/transmediaConstants';

/**
 * Manages the showcase open animation (dim → blackout → reveal).
 *
 * @param {object} deps
 * @param {Function} deps.openMiniverseById
 */
const useShowcaseTransition = ({ openMiniverseById }) => {
  const [showcaseOpenTransition, setShowcaseOpenTransition] = useState({ phase: 'idle', targetId: null });
  const showcaseOpenTransitionTimersRef = useRef([]);

  const clearShowcaseOpenTransitionTimers = useCallback(() => {
    if (typeof window === 'undefined') return;
    showcaseOpenTransitionTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    showcaseOpenTransitionTimersRef.current = [];
  }, []);

  const resetShowcaseOpenTransition = useCallback(() => {
    clearShowcaseOpenTransitionTimers();
    setShowcaseOpenTransition({ phase: 'idle', targetId: null });
  }, [clearShowcaseOpenTransitionTimers]);

  const runShowcaseOpenTransition = useCallback(
    (formatId) => {
      if (!formatId || !showcaseDefinitions[formatId]) return;
      if (showcaseOpenTransition.phase !== 'idle') return;

      const prefersReducedMotion =
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const connection =
        typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null;
      const isSlowConnection = Boolean(connection?.saveData) || /(^|-)2g/.test(connection?.effectiveType || '');
      if (prefersReducedMotion || isSlowConnection) {
        openMiniverseById(formatId);
        return;
      }

      clearShowcaseOpenTransitionTimers();
      setShowcaseOpenTransition({ phase: 'dimming', targetId: formatId });

      const dimTimerId = window.setTimeout(() => {
        setShowcaseOpenTransition((prev) =>
          prev.targetId === formatId ? { phase: 'blackout', targetId: formatId } : prev
        );
      }, SHOWCASE_OPEN_TRANSITION.dimMs);

      const openTimerId = window.setTimeout(() => {
        openMiniverseById(formatId);
        setShowcaseOpenTransition((prev) =>
          prev.targetId === formatId ? { phase: 'revealing', targetId: formatId } : prev
        );
      }, SHOWCASE_OPEN_TRANSITION.dimMs + SHOWCASE_OPEN_TRANSITION.blackoutMs);

      const resetTimerId = window.setTimeout(() => {
        setShowcaseOpenTransition((prev) =>
          prev.targetId === formatId ? { phase: 'idle', targetId: null } : prev
        );
      }, SHOWCASE_OPEN_TRANSITION.dimMs + SHOWCASE_OPEN_TRANSITION.blackoutMs + SHOWCASE_OPEN_TRANSITION.revealMs);

      showcaseOpenTransitionTimersRef.current = [dimTimerId, openTimerId, resetTimerId];
    },
    [clearShowcaseOpenTransitionTimers, openMiniverseById, showcaseOpenTransition.phase]
  );

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      clearShowcaseOpenTransitionTimers();
    },
    [clearShowcaseOpenTransitionTimers]
  );

  return {
    showcaseOpenTransition,
    clearShowcaseOpenTransitionTimers,
    resetShowcaseOpenTransition,
    runShowcaseOpenTransition,
  };
};

export default useShowcaseTransition;
