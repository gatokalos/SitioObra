import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MINIVERSE_CARDS, IncendioVideoPlaceholder } from '@/components/MiniverseModal';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';

const VideoNarrativeAutoplay = ({ open, onClose, formatId, isMobileViewport }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const GENERIC_VIDEO_URL = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/fragmento_en_produccion_web.mp4';

  const card = MINIVERSE_CARDS.find((c) => c.formatId === formatId) ?? null;
  const videoUrl = card?.videoUrl ?? GENERIC_VIDEO_URL;

  useEffect(() => {
    if (!open) {
      videoRef.current?.pause();
      setIsPlaying(false);
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
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleIntuyeRespuesta = () => {
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
          className="fixed inset-0 z-[800] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Video narrativo: ${card.title}`}
            className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/92 shadow-[0_35px_120px_rgba(0,0,0,0.7)]"
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">
                  Video narrativo
                </p>
                <h3 className="font-display text-xl text-slate-100">{card.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                Cerrar ✕
              </button>
            </div>

            <div
              className="relative w-full bg-black aspect-video cursor-pointer select-none"
              onClick={handleVideoToggle}
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <IncendioVideoPlaceholder />
              )}

              {videoUrl && !isPlaying && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/50 p-5 ring-1 ring-white/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="h-8 w-8 translate-x-0.5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center px-5 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleIntuyeRespuesta}
                className="rounded-full border border-purple-500/70 px-6 py-2.5 text-xs uppercase tracking-[0.25em] text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] transition hover:bg-purple-500/20"
              >
                Intuye tu respuesta →
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export default VideoNarrativeAutoplay;
