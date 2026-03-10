import { useState, useCallback } from 'react';
import { startDirectMerchCheckout } from '@/lib/merchCheckout';

/**
 * Manages the merch/novela checkout flow.
 *
 * @param {object} deps
 * @param {string|null} deps.userEmail
 * @param {string|null} deps.activeShowcase
 * @param {Function} deps.toast
 */
const useMerchCheckout = ({ userEmail, activeShowcase, toast }) => {
  const [isMerchCheckoutLoading, setIsMerchCheckoutLoading] = useState(false);

  const handleOpenNovelaReserve = useCallback(
    async (initialPackages = ['novela-400']) => {
      if (isMerchCheckoutLoading) return;
      const normalized = Array.isArray(initialPackages) && initialPackages.length
        ? initialPackages
        : ['novela-400'];
      const packageId = normalized.includes('taza-250') ? 'taza-250' : 'novela-400';

      setIsMerchCheckoutLoading(true);
      try {
        await startDirectMerchCheckout({
          packageId,
          customerEmail: userEmail ?? '',
          metadata: {
            source: 'transmedia',
            package: packageId,
            showcase: activeShowcase ?? '',
          },
        });
      } catch (error) {
        console.error('[Transmedia] Checkout error:', error);
        toast({ description: 'No pudimos abrir el checkout. Intenta nuevamente.' });
      } finally {
        setIsMerchCheckoutLoading(false);
      }
    },
    [activeShowcase, isMerchCheckoutLoading, userEmail, toast]
  );

  return { isMerchCheckoutLoading, handleOpenNovelaReserve };
};

export default useMerchCheckout;
