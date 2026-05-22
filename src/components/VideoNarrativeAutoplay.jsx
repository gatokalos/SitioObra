import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MINIVERSE_CARDS } from '@/components/MiniverseModal';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { resolveNarrativeVideoUrl } from '@/lib/narrativeVideo';

const VideoNarrativeAutoplay = ({ open, onClose, formatId, isMobileViewport, videoUrl: videoUrlProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const card = MINIVERSE_CARDS.find((c) => c.formatId === formatId) ?? null;
  const ctaLabel = card?.narrativeCtaLabel ?? 'Continuar experiencia';
  const videoUrl = resolveNarrativeVideoUrl({
    card,
    isMobileViewport,
    videoUrl: videoUrlProp,
  });

  useEffect(() => {
    if (!open) {
      videoRef.current?.pause();
      setIsPlaying(false);
      setHasEnded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleVideoToggle = () => {
    const v = videoRef.current;
    if (!v || hasEnded) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleContinuar = () => {
    onClose?.();
    const portalRoute = resolvePortalRoute({ formatId });
    if (isMobileViewport && portalRoute) {
      navigate(portalRoute, {
        state: createPortalLaunchState(location, 'video-narrative-cta', { showcaseId: formatId }),
      });
      return;
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gatoencerrado:auto-open-resonance', { detail: { formatId } }));
      window.dispatchEvent(new CustomEvent('gatoencerrado:select-miniverse-format', { detail: { formatId } }));
    }, 80);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && card ? (
        <motion.div
          className="fixed inset-0 z-[800] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Video edge-to-edge */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={handleVideoToggle}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-cover"
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => { setIsPlaying(false); setHasEnded(true); }}
            />
          </div>

          {/* Play overlay — visible while paused and not ended */}
          <AnimatePresence>
            {!isPlaying && !hasEnded && (
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-full bg-black/50 p-6 ring-1 ring-white/20 backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="h-10 w-10 translate-x-0.5"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA — aparece solo al terminar el video */}
          <AnimatePresence>
            {hasEnded && (
              <motion.div
                className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-14 pt-20"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                <button
                  type="button"
                  onClick={handleContinuar}
                  className="w-full max-w-xs rounded-full border border-purple-500/70 bg-purple-600/20 px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.5)] backdrop-blur-sm transition hover:bg-purple-500/30"
                >
                  {ctaLabel} →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button flotante */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/70 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default VideoNarrativeAutoplay;
