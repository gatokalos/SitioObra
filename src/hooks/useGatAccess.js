import { useCallback, useState } from 'react';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useGatAccess() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const debit = useCallback(async ({ miniversoId, action, cost }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Stub: simula un cobro exitoso en lo que se integra el endpoint real.
      await delay(700);

      return {
        success: true,
        transactionId: `stub-${miniversoId}-${action}-${Date.now()}`,
        charged: { amount: cost, currency: 'GAT' },
        balanceAfter: Math.max(0, 1200 - (cost ?? 0)),
        coverage: null,
      };
    } catch (stubError) {
      setError(stubError);
      return { success: false, error: stubError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    debit,
    isLoading,
    error,
  };
}
