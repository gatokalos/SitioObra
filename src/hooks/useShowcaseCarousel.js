import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  formats,
  ENABLE_SHOWCASE_AUTO_CYCLE,
  SHOWCASE_AUTO_CYCLE_INTERVAL_MS,
} from '@/components/transmedia/transmediaConstants';

/**
 * Manages showcase carousel position and mobile swipe gestures.
 *
 * @param {object} deps
 * @param {boolean} deps.isMobileViewport
 * @param {string|null} deps.focusLockShowcaseId
 * @param {Function} deps.releaseDesktopFocusLock
 * @param {object} deps.location - react-router location
 */
const useShowcaseCarousel = ({
  isMobileViewport,
  focusLockShowcaseId,
  releaseDesktopFocusLock,
  location,
}) => {
  const isDesktopFocusLockActive = Boolean(focusLockShowcaseId) && !isMobileViewport;
  const [showcaseCarouselIndex, setShowcaseCarouselIndex] = useState(0);
  const [mobileShowcaseIndex, setMobileShowcaseIndex] = useState(0);

  const lastAppliedPortalRestoreTokenRef = useRef('');
  const mobileSwipeStateRef = useRef({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    tracking: false,
  });
  const mobileSwipeBlockTapRef = useRef(false);

  const visibleShowcases = useMemo(() => {
    if (formats.length <= 3) return formats;
    return Array.from({ length: 3 }, (_, idx) => formats[(showcaseCarouselIndex + idx) % formats.length]);
  }, [showcaseCarouselIndex]);

  // Auto-cycle desktop carousel
  useEffect(() => {
    if (!ENABLE_SHOWCASE_AUTO_CYCLE || isMobileViewport || isDesktopFocusLockActive) return undefined;
    const intervalId = window.setInterval(() => {
      setShowcaseCarouselIndex((prev) => (prev + 1) % formats.length);
    }, SHOWCASE_AUTO_CYCLE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isDesktopFocusLockActive, isMobileViewport]);

  // Restore mobile carousel position from portal navigation state
  useEffect(() => {
    if (!isMobileViewport) return;
    const restoreShowcaseId =
      typeof location.state?.portalRestoreShowcaseId === 'string'
        ? location.state.portalRestoreShowcaseId
        : '';
    if (!restoreShowcaseId) return;

    const restoreToken =
      typeof location.state?.portalRestoreToken === 'string' && location.state.portalRestoreToken.trim()
        ? location.state.portalRestoreToken
        : `${location.pathname}${location.search}:${restoreShowcaseId}`;
    if (lastAppliedPortalRestoreTokenRef.current === restoreToken) return;

    const targetIndex = formats.findIndex((item) => item.id === restoreShowcaseId);
    if (targetIndex < 0) return;

    lastAppliedPortalRestoreTokenRef.current = restoreToken;
    setMobileShowcaseIndex(targetIndex);
  }, [isMobileViewport, location.pathname, location.search, location.state]);

  const handleShowcaseNextBatch = useCallback(() => {
    if (focusLockShowcaseId) releaseDesktopFocusLock();
    setShowcaseCarouselIndex((prev) => (prev + 3) % formats.length);
  }, [focusLockShowcaseId, releaseDesktopFocusLock]);

  const handleShowcasePrevBatch = useCallback(() => {
    if (focusLockShowcaseId) releaseDesktopFocusLock();
    setShowcaseCarouselIndex((prev) => (prev - 3 + formats.length) % formats.length);
  }, [focusLockShowcaseId, releaseDesktopFocusLock]);

  const handleMobileShowcaseNext = useCallback(() => {
    setMobileShowcaseIndex((prev) => (prev + 1) % formats.length);
  }, []);

  const handleMobileShowcasePrev = useCallback(() => {
    setMobileShowcaseIndex((prev) => (prev - 1 + formats.length) % formats.length);
  }, []);

  const handleMobileShowcaseTouchStart = useCallback((event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    mobileSwipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      tracking: true,
    };
  }, []);

  const handleMobileShowcaseTouchMove = useCallback((event) => {
    const touch = event.touches?.[0];
    if (!touch || !mobileSwipeStateRef.current.tracking) return;
    mobileSwipeStateRef.current.deltaX = touch.clientX - mobileSwipeStateRef.current.startX;
    mobileSwipeStateRef.current.deltaY = touch.clientY - mobileSwipeStateRef.current.startY;
  }, []);

  const handleMobileShowcaseTouchEnd = useCallback(() => {
    const { deltaX, deltaY, tracking } = mobileSwipeStateRef.current;
    mobileSwipeStateRef.current.tracking = false;
    if (!tracking) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const isHorizontalSwipe = absX > 56 && absX > absY + 10;
    if (!isHorizontalSwipe) return;

    mobileSwipeBlockTapRef.current = true;
    window.setTimeout(() => {
      mobileSwipeBlockTapRef.current = false;
    }, 240);

    if (deltaX < 0) {
      handleMobileShowcaseNext();
    } else {
      handleMobileShowcasePrev();
    }
  }, [handleMobileShowcaseNext, handleMobileShowcasePrev]);

  return {
    showcaseCarouselIndex,
    setShowcaseCarouselIndex,
    mobileShowcaseIndex,
    setMobileShowcaseIndex,
    mobileSwipeBlockTapRef,
    visibleShowcases,
    handleShowcaseNextBatch,
    handleShowcasePrevBatch,
    handleMobileShowcaseNext,
    handleMobileShowcasePrev,
    handleMobileShowcaseTouchStart,
    handleMobileShowcaseTouchMove,
    handleMobileShowcaseTouchEnd,
  };
};

export default useShowcaseCarousel;