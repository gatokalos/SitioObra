import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useActiveSubscription = (userId) => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  useEffect(() => {
    if (!userId) {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return undefined;
    }

    let isMounted = true;
    setIsCheckingSubscription(true);

    supabase
      .from('suscriptores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .then(({ count, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[useActiveSubscription] No se pudo validar huella:', error);
          setHasActiveSubscription(false);
          return;
        }
        setHasActiveSubscription((count ?? 0) > 0);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSubscription(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { hasActiveSubscription, isCheckingSubscription };
};

export default useActiveSubscription;
