import { useState, useEffect, useCallback } from 'react';
import { ORACULO_URL, CAUSE_SITE_URL } from '@/components/transmedia/transmediaConstants';

/**
 * Manages open/close state and keyboard interactions for the Oráculo and Causa Social iframe panels.
 *
 * @param {object}   deps
 * @param {Function} deps.requireShowcaseAuth
 * @param {Function} deps.toast
 */
const useExternalPanels = ({ requireShowcaseAuth, toast }) => {
  const [isOraculoOpen, setIsOraculoOpen] = useState(false);
  const [isCauseSiteOpen, setIsCauseSiteOpen] = useState(false);

  const handleOpenOraculo = useCallback(() => {
    if (!requireShowcaseAuth('Inicia sesión para abrir el Oráculo.', { action: 'open-oraculo' })) {
      return;
    }
    if (!ORACULO_URL) {
      toast({
        description: 'Falta configurar la URL del Oráculo (VITE_BIENVENIDA_URL o VITE_ORACULO_URL).',
      });
      return;
    }
    setIsOraculoOpen(true);
  }, [requireShowcaseAuth, toast]);

  const handleCloseOraculo = useCallback(() => {
    setIsOraculoOpen(false);
  }, []);

  const handleOpenCauseSite = useCallback(() => {
    if (!CAUSE_SITE_URL) {
      toast({
        description: 'Falta configurar la URL de la causa social.',
      });
      return;
    }
    setIsCauseSiteOpen(true);
  }, [toast]);

  const handleCloseCauseSite = useCallback(() => {
    setIsCauseSiteOpen(false);
  }, []);

  // Escape key closes oráculo panel
  useEffect(() => {
    if (!isOraculoOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        setIsOraculoOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOraculoOpen]);

  // Escape key closes causa social panel
  useEffect(() => {
    if (!isCauseSiteOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        setIsCauseSiteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isCauseSiteOpen]);

  return {
    isOraculoOpen,
    isCauseSiteOpen,
    handleOpenOraculo,
    handleCloseOraculo,
    handleOpenCauseSite,
    handleCloseCauseSite,
  };
};

export default useExternalPanels;
