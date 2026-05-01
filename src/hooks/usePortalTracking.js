import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { trackPortalOpen } from '@/services/portalTrackingService';

/**
 * Registra una sola entrada al portal cuando el componente monta.
 * Llama desde el componente raíz de cada Portal*.jsx:
 *
 *   usePortalTracking('oraculo');
 *
 * @param {string} portal - nombre del portal
 */
export function usePortalTracking(portal) {
  const { user } = useAuth();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackPortalOpen(portal, user);
  }, [portal, user]);
}
