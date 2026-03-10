import { useState, useEffect, useCallback, useRef } from 'react';
import { GAT_COSTS } from '@/components/transmedia/transmediaConstants';

/**
 * Manages image and PDF preview state, refs, and related effects
 * (escape-to-close, container resize, end-of-document GAT notice).
 *
 * @param {object} deps
 * @param {Function} deps.requireShowcaseAuth
 * @param {number}   deps.availableGATokens
 * @param {boolean}  deps.isAuthenticated
 * @param {Function} deps.setTokenPrecareContext
 * @param {Function} deps.toast
 */
const usePdfPreview = ({
  requireShowcaseAuth,
  availableGATokens,
  isAuthenticated,
  setTokenPrecareContext,
  toast,
}) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(0);

  const pdfContainerRef = useRef(null);
  const pdfEndSentinelRef = useRef(null);
  const hasShownPdfEndNoticeRef = useRef(false);

  const pdfPageWidth = Math.max(pdfContainerWidth - 48, 320);

  const handleOpenImagePreview = useCallback(
    (payload, options = {}) => {
      if (!payload?.src) return;
      const {
        requiresAuth = true,
        loginMessage = 'Inicia sesión para abrir este fragmento.',
        loginPayload = { action: 'preview-image' },
      } = options;
      if (requiresAuth && !requireShowcaseAuth(loginMessage, loginPayload)) return;
      setImagePreview({
        src: payload.src,
        title: payload.title ?? '',
        description: payload.description ?? '',
        label: payload.label ?? '',
      });
    },
    [requireShowcaseAuth]
  );

  const handleCloseImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  const handleOpenPdfPreview = useCallback((payload) => {
    if (!payload?.src) return;
    const parsedNextCost = Number(payload.nextChapterCost);
    const nextChapterCost =
      Number.isFinite(parsedNextCost) && parsedNextCost > 0
        ? parsedNextCost
        : GAT_COSTS.novelaChapter;
    setPdfPreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
      nextChapterCost,
      nextChapterLabel: payload.nextChapterLabel ?? 'siguiente capítulo',
    });
    setPdfNumPages(null);
    setPdfLoadError(null);
    hasShownPdfEndNoticeRef.current = false;
  }, []);

  const handleClosePdfPreview = useCallback(() => {
    setPdfPreview(null);
    setPdfNumPages(null);
    setPdfLoadError(null);
    hasShownPdfEndNoticeRef.current = false;
  }, []);

  const handlePdfLoadSuccess = useCallback(({ numPages }) => {
    setPdfNumPages(numPages);
  }, []);

  // Escape key closes image or PDF preview
  useEffect(() => {
    if (!imagePreview && !pdfPreview) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (imagePreview) handleCloseImagePreview();
        if (pdfPreview) handleClosePdfPreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePreview, pdfPreview, handleCloseImagePreview, handleClosePdfPreview]);

  // Track PDF container width for responsive page rendering
  useEffect(() => {
    if (!pdfPreview) return undefined;
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setPdfContainerWidth(pdfContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [pdfPreview]);

  // Show end-of-document GAT notice via IntersectionObserver
  useEffect(() => {
    if (!pdfPreview || pdfLoadError || !pdfNumPages) return undefined;
    if (typeof window === 'undefined') return undefined;
    if (typeof window.IntersectionObserver !== 'function') return undefined;

    const root = pdfContainerRef.current;
    const target = pdfEndSentinelRef.current;
    if (!root || !target) return undefined;

    const observer = new window.IntersectionObserver(
      (entries) => {
        const reachedEnd = entries.some((entry) => entry.isIntersecting);
        if (!reachedEnd || hasShownPdfEndNoticeRef.current) return;
        hasShownPdfEndNoticeRef.current = true;

        const required = Number.isFinite(pdfPreview.nextChapterCost)
          ? Number(pdfPreview.nextChapterCost)
          : GAT_COSTS.novelaChapter;
        const label = pdfPreview.nextChapterLabel || 'siguiente capítulo';
        const missing = Math.max(required - availableGATokens, 0);

        if (missing > 0) {
          if (!isAuthenticated) {
            setTokenPrecareContext({ required, missing, actionLabel: `El ${label}` });
            return;
          }
          toast({
            description: `Llegaste al final. El ${label} requiere ${required} GATokens. Te faltan ${missing}.`,
          });
          return;
        }

        toast({
          description: `Llegaste al final. El ${label} requiere ${required} GATokens. Ya tienes saldo suficiente.`,
        });
      },
      { root, threshold: 0.9 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [availableGATokens, isAuthenticated, pdfLoadError, pdfNumPages, pdfPreview, setTokenPrecareContext, toast]);

  return {
    imagePreview,
    pdfPreview,
    pdfNumPages,
    setPdfNumPages,
    pdfLoadError,
    setPdfLoadError,
    pdfContainerWidth,
    pdfPageWidth,
    pdfContainerRef,
    pdfEndSentinelRef,
    handleOpenImagePreview,
    handleCloseImagePreview,
    handleOpenPdfPreview,
    handleClosePdfPreview,
    handlePdfLoadSuccess,
  };
};

export default usePdfPreview;
