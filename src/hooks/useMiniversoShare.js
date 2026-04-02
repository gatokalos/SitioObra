import { useCallback } from 'react';

/**
 * Manages share actions for miniverso showcases and the impact model.
 *
 * @param {object} deps
 * @param {string|null} deps.activeShowcase
 * @param {object|null} deps.activeDefinition
 * @param {Function}    deps.toast
 */
const useMiniversoShare = ({ activeShowcase, activeDefinition, toast }) => {
  const buildMiniverseShareUrl = useCallback((formatId) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('miniverso', formatId);
    url.hash = 'transmedia';
    return url.toString();
  }, []);

  const handleShareMiniverse = useCallback(async () => {
    if (!activeShowcase || !activeDefinition) return;
    const url = buildMiniverseShareUrl(activeShowcase);
    if (!url) return;

    const label = activeDefinition.shareLabel?.trim() || activeDefinition.label?.trim() || 'este miniverso';
    const sharePayload = {
      title: activeDefinition.shareLabel ?? activeDefinition.label ?? 'Miniverso',
      text: `Descubre ${label} en #GatoEncerrado.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast({ description: 'Enlace copiado. Compártelo con quien quieras.' });
        return;
      }
      toast({ description: 'No pudimos abrir el menú de compartir en este navegador.' });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast({ description: 'No pudimos compartir el enlace. Intenta de nuevo.' });
      }
    }
  }, [activeDefinition, activeShowcase, buildMiniverseShareUrl, toast]);

  const handleShareImpactModel = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('miniverso');
    url.hash = 'cta';
    const shareUrl = url.toString();
    const sharePayload = {
      title: 'Modelo anual por tramos',
      text: 'Mira cómo crece el impacto social de #GatoEncerrado.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ description: 'Enlace del modelo copiado. Ya puedes compartirlo.' });
        return;
      }
      toast({ description: 'No pudimos abrir el menú de compartir en este navegador.' });
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast({ description: 'No pudimos compartir el modelo. Intenta de nuevo.' });
      }
    }
  }, [toast]);

  return { buildMiniverseShareUrl, handleShareMiniverse, handleShareImpactModel };
};

export default useMiniversoShare;
