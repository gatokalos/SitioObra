import { useState, useEffect, useRef } from 'react';

/**
 * Tracks GAT balance changes and surfaces a delta toast for 2.2 seconds.
 *
 * @param {number} safeAvailableGATokens - Clamped, finite GAT balance.
 * @returns {{ gatBalanceToast: {id: number, delta: number, balance: number} | null }}
 */
const useGatBalanceToast = (safeAvailableGATokens) => {
  const [gatBalanceToast, setGatBalanceToast] = useState(null);
  const gatBalanceToastTimeoutRef = useRef(null);
  const hasHydratedGatBalanceRef = useRef(false);
  const previousGatBalanceRef = useRef(null);

  useEffect(() => {
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
  }, [safeAvailableGATokens]);

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
