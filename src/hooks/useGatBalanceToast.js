import { useState, useEffect, useRef } from 'react';

/**
 * Tracks GAT balance changes and surfaces a delta toast for 2.2 seconds.
 *
 * @param {number} safeAvailableGATokens - Clamped, finite GAT balance.
 * @param {boolean} [isReady=true] - False while the balance is still the
 *   localStorage-cached guess from mount, before the first real server sync
 *   resolves (useTransmediaCredits' `hasSyncedOnce`). Changes while not
 *   ready are absorbed silently — otherwise the jump from a stale cached
 *   number to the true synced balance gets celebrated as if the user had
 *   just earned the difference (diagnosed 2026-08-05: a session with GAT
 *   earned across tabs/devices showed a misleading "+745 GAT" toast that
 *   was really just the cache catching up, not a single earn event).
 * @returns {{ gatBalanceToast: {id: number, delta: number, balance: number} | null }}
 */
const useGatBalanceToast = (safeAvailableGATokens, isReady = true) => {
  const [gatBalanceToast, setGatBalanceToast] = useState(null);
  const gatBalanceToastTimeoutRef = useRef(null);
  const hasHydratedGatBalanceRef = useRef(false);
  const previousGatBalanceRef = useRef(null);

  useEffect(() => {
    if (!isReady) {
      // Sigue el valor sin marcar hidratación — cuando isReady pase a true,
      // el primer render con el balance ya confirmado se toma como línea
      // base silenciosa, no como un delta a celebrar.
      previousGatBalanceRef.current = safeAvailableGATokens;
      return;
    }
    if (!hasHydratedGatBalanceRef.current) {
      hasHydratedGatBalanceRef.current = true;
      previousGatBalanceRef.current = safeAvailableGATokens;
      return;
    }
    const previousBalance = Number.isFinite(previousGatBalanceRef.current)
      ? Number(previousGatBalanceRef.current)
      : safeAvailableGATokens;
    if (previousBalance === safeAvailableGATokens) return;

    const delta = safeAvailableGATokens - previousBalance;
    previousGatBalanceRef.current = safeAvailableGATokens;
    if (!delta) return;

    setGatBalanceToast({ id: Date.now(), delta, balance: safeAvailableGATokens });
    if (gatBalanceToastTimeoutRef.current) {
      clearTimeout(gatBalanceToastTimeoutRef.current);
    }
    gatBalanceToastTimeoutRef.current = setTimeout(() => {
      setGatBalanceToast(null);
    }, 2200);
  }, [safeAvailableGATokens, isReady]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gatBalanceToastTimeoutRef.current) {
        clearTimeout(gatBalanceToastTimeoutRef.current);
      }
    };
  }, []);

  return { gatBalanceToast };
};

export default useGatBalanceToast;
