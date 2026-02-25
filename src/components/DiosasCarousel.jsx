import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';

const DiosasCarousel = ({ items = [], label = 'Swipe horizontal', caption = 'Galería 360°' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [activeVideoCardId, setActiveVideoCardId] = useState(null);
  const carouselRootRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const previewVideoRefs = useRef(new Map());
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const fullscreenSizes = useMemo(() => {
    const maxWidth = Math.min(viewportWidth - 24, 520);
    const maxHeight = Math.min(viewportHeight - 48, 720);
    const widthFromHeight = maxHeight * (9 / 16);
    const width = Math.min(maxWidth, widthFromHeight);
    const height = Math.min(maxHeight, width * (16 / 9));
    return { width, height };
  }, [viewportHeight, viewportWidth]);

  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item && item.videoUrl);
  }, [items]);

  const total = safeItems.length;
  const visibleCount = useMemo(() => {
    if (!total) return 0;
    if (viewportWidth < 640) return 1;
    if (viewportWidth < 1024) return Math.min(2, total);
    return Math.min(3, total);
  }, [total, viewportWidth]);
  const windowItems = useMemo(() => {
    if (visibleCount === 0) return [];
    return Array.from({ length: visibleCount }, (_, offset) => {
      const index = (activeIndex + offset + total) % total;
      return { item: safeItems[index], index };
    });
  }, [activeIndex, visibleCount, total, safeItems]);

  const setNextIndex = (direction) => {
    if (!total) return;
    setActiveIndex((prev) => {
      const next = (prev + direction + total) % total;
      return next;
    });
  };

  const handleDragEnd = (_event, info) => {
    if (!total) return;
    const offsetX = info?.offset?.x ?? 0;
    const threshold = 40;
    if (offsetX < -threshold) {
      setNextIndex(1);
    } else if (offsetX > threshold) {
      setNextIndex(-1);
    }
  };

  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, total]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const touchCapable =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;
    setIsTouchDevice(touchCapable);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (fullscreenItem) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [fullscreenItem]);

  const stopCarouselMediaPlayback = useCallback(() => {
    const root = carouselRootRef.current;
    if (root) {
      root.querySelectorAll('video').forEach((videoNode) => {
        try {
          videoNode.pause?.();
        } catch (error) {
          // noop
        }
      });
    }

    if (fullscreenVideoRef.current) {
      try {
        fullscreenVideoRef.current.pause?.();
      } catch (error) {
        // noop
      }
    }

    if (typeof document === 'undefined') return;
    const pipNode = document.pictureInPictureElement;
    if (pipNode instanceof HTMLVideoElement && typeof document.exitPictureInPicture === 'function') {
      document.exitPictureInPicture().catch(() => {});
    }
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleCloseDiosasVideo = useCallback(() => {
    stopCarouselMediaPlayback();
    setFullscreenItem(null);
  }, [stopCarouselMediaPlayback]);

  const registerPreviewVideo = useCallback((itemId, node) => {
    if (!itemId) return;
    if (!node) {
      previewVideoRefs.current.delete(itemId);
      return;
    }
    previewVideoRefs.current.set(itemId, node);
  }, []);

  const stopPreviewVideo = useCallback((video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    try {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    } catch {
      // noop
    }
  }, []);

  const handleCardHoverStart = useCallback((itemId) => {
    if (isMobileViewport) return;
    const target = previewVideoRefs.current.get(itemId);
    if (!(target instanceof HTMLVideoElement)) return;
    setActiveVideoCardId(itemId);
    previewVideoRefs.current.forEach((video, key) => {
      if (key === itemId) return;
      stopPreviewVideo(video);
    });
    try {
      target.currentTime = 0;
      target.muted = false;
      const playAttempt = target.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {
          target.muted = true;
          target.play().catch(() => {});
        });
      }
    } catch {
      // noop
    }
  }, [isMobileViewport, stopPreviewVideo]);

  const handleCardHoverEnd = useCallback((itemId) => {
    if (isMobileViewport) return;
    const target = previewVideoRefs.current.get(itemId);
    setActiveVideoCardId((prev) => (prev === itemId ? null : prev));
    stopPreviewVideo(target);
  }, [isMobileViewport, stopPreviewVideo]);

  useEffect(() => () => {
    stopCarouselMediaPlayback();
  }, [stopCarouselMediaPlayback]);

  useEffect(() => {
    if (isMobileViewport) return;
    previewVideoRefs.current.forEach((video) => stopPreviewVideo(video));
    setActiveVideoCardId(null);
  }, [activeIndex, isMobileViewport, stopPreviewVideo]);

  if (total === 0) {
    return null;
  }

  const resolvedLabel = isTouchDevice ? label : 'Galería divina';
  const fullscreenId = fullscreenItem?.id || fullscreenItem?.videoUrl;

  return (
    <div ref={carouselRootRef} className="space-y-3">
      <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.35em] text-emerald-100/80">
        <span>{resolvedLabel}</span>
        <span className="text-emerald-50">
          {activeIndex + 1}/{total}
        </span>
      </div>
      <div className="relative">
        <motion.div
          className="mx-auto flex max-w-5xl items-stretch justify-center gap-3 overflow-hidden px-3 sm:px-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {windowItems.map(({ item, index: realIndex }, windowIdx) => {
            const itemId = item.id || item.videoUrl;
            const isDesktopVideoMode = !isMobileViewport && activeVideoCardId === itemId;
            return (
            <motion.button
              key={itemId || `diosa-${realIndex}`}
              type="button"
              onClick={() => {
                if (isMobileViewport) {
                  setFullscreenItem(item);
                }
              }}
              onMouseEnter={() => handleCardHoverStart(itemId)}
              onMouseLeave={() => handleCardHoverEnd(itemId)}
              className={`group relative overflow-hidden rounded-2xl border border-emerald-200/40 bg-slate-900/60 shadow-[0_15px_45px_rgba(0,0,0,0.45)] aspect-[9/16] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                visibleCount === 1
                  ? 'w-[90vw] max-w-[200px] sm:max-w-[340px]'
                  : 'w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              style={{
                opacity: windowIdx === 1 || visibleCount < 3 ? 1 : 0.9,
                transformOrigin: 'center',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    item?.gradient ||
                    'linear-gradient(165deg, rgba(16,185,129,0.55), rgba(59,130,246,0.45), rgba(168,85,247,0.45))',
                }}
              >
                <video
                  ref={(node) => registerPreviewVideo(itemId, node)}
                  src={item.videoUrl}
                  poster={item.poster}
                  muted={isMobileViewport}
                  loop={false}
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-100/35" />
              <div
                className={`absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-black/25 to-black/70 transition-opacity duration-200 ${
                  isDesktopVideoMode ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <div
                className={`relative z-10 flex h-full flex-col justify-between p-4 text-emerald-50 transition-opacity duration-200 ${
                  isDesktopVideoMode ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.35em] text-emerald-100/85">
                  <span>{item.badge || 'Portal AR'}</span>
                  {item.meta ? <span className="text-emerald-100/70">{item.meta}</span> : null}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-100">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-emerald-100/80 leading-relaxed">{item.description}</p>
                  ) : null}
                  {item.location ? (
                    <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-100/70">{item.location}</p>
                  ) : null}
                </div>
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-emerald-900/50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:bg-emerald-800/60">
                    <Play size={14} className="text-emerald-100" />
                    {isMobileViewport ? 'Ver 360°' : 'Hover para escuchar'}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
        </motion.div>
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setNextIndex(-1)}
              disabled={total === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-emerald-200/40 bg-emerald-900/60 p-2 text-emerald-50 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition disabled:opacity-40 hover:bg-emerald-800/60"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setNextIndex(1)}
              disabled={total === 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-emerald-200/40 bg-emerald-900/60 p-2 text-emerald-50 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition disabled:opacity-40 hover:bg-emerald-800/60"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : null}
      </div>
      <p className="text-[11px] text-emerald-100/70 text-center">{caption}</p>
      {fullscreenItem && typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              <motion.div
                key="diosa-fullscreen"
                className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseDiosasVideo}
              >
                <div className="relative h-[100svh] w-full overflow-hidden" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleCloseDiosasVideo}
                    className="absolute right-4 top-4 z-20 rounded-full border border-emerald-200/50 bg-emerald-900/70 p-2 text-emerald-50 hover:bg-emerald-800/70"
                    aria-label="Cerrar video"
                  >
                    <X size={16} />
                  </button>
                  <video
                    ref={fullscreenVideoRef}
                    key={fullscreenId}
                    src={fullscreenItem.videoUrl}
                    poster={fullscreenItem.poster}
                    controls={canUseInlinePlayback(fullscreenId)}
                    autoPlay
                    playsInline
                    loop
                    className="h-[100svh] w-auto max-w-none object-cover mx-auto"
                    onClick={(event) => requestMobileVideoPresentation(event, fullscreenId)}
                  />
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
};

export default DiosasCarousel;
