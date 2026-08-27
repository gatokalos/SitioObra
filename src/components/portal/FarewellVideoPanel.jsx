import React, { useRef, useState } from 'react';
import { resolveAuthorVideoUrl, AUTHOR_VIDEO_GENERAL_URL } from '@/lib/authorVideo';

// Panel embebido (no pantalla completa) para el video casero de despedida.
// Sin autoplay a propósito: arranca solo con un tap explícito. Si el archivo
// del portal no existe todavía, cae al general; si tampoco existe, no pinta
// nada roto — se oculta entero (Carlos va soltando los 9 videos + el general
// sin que este componente necesite cambios).
const FarewellVideoPanel = ({ portal, onSeen }) => {
  const videoRef = useRef(null);
  const [stage, setStage] = useState(0); // 0: video del portal, 1: general, 2: sin video disponible
  const [playing, setPlaying] = useState(false);

  if (stage >= 2) return null;

  const src = stage === 0 ? resolveAuthorVideoUrl(portal) : AUTHOR_VIDEO_GENERAL_URL;

  const handlePlay = () => {
    setPlaying(true);
    onSeen?.();
  };

  const handleError = () => setStage((s) => s + 1);

  const handleSkip = () => onSeen?.();

  return (
    <div className="space-y-1.5 overflow-hidden rounded-2xl border border-white/15 bg-black/35">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          key={src}
          src={src}
          controls={playing}
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onPlay={handlePlay}
          onError={handleError}
        />
        {!playing && (
          <button
            type="button"
            onClick={() => videoRef.current?.play?.().catch(() => {})}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/10"
            aria-label="Reproducir video del autor"
          >
            <span className="rounded-full bg-black/50 p-4 ring-1 ring-white/25 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6 translate-x-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {!playing && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[0.65rem] text-slate-400/80">Un mensaje del autor</span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-[0.65rem] text-slate-500/70 underline underline-offset-2 hover:text-slate-300/80"
          >
            Saltar →
          </button>
        </div>
      )}
    </div>
  );
};

export default FarewellVideoPanel;
