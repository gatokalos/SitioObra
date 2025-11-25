import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMobileVideoPresentation } from "@/hooks/useMobileVideoPresentation";

export default function MiniversoSonoro({
  title = "Miniverso Sonoro",
  subtitle = "",
  videoUrl,
  musicOptions = [],
  poems = [],
  highlights = [],
  showHeader = true,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const { requestMobileVideoPresentation } = useMobileVideoPresentation();
  const videoPresentationId = videoUrl || "miniverso-sonoro-video";

  const noisePattern =
    'data:image/svg+xml;utf8,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="120"%20height="120"><filter%20id="n"><feTurbulence%20type="fractalNoise"%20baseFrequency="0.7"%20numOctaves="2"%20stitchTiles="stitch"/></filter><rect%20width="120"%20height="120"%20filter="url(%23n)"%20opacity="0.2"/></svg>';

  const [isVertical, setIsVertical] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedPoem, setSelectedPoem] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  // ——————————————
  // Detecta orientación del video automáticamente
  // ——————————————
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      setIsVertical(video.videoHeight > video.videoWidth);
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    return () => video.removeEventListener("loadedmetadata", handleMetadata);
  }, [videoUrl]);

  // ——————————————
  // Poema seleccionado (overlay)
  // ——————————————
  const poemText = useMemo(() => {
    const match = poems.find((item) => item.id === selectedPoem);
    return match?.text ?? "";
  }, [poems, selectedPoem]);

  // ——————————————
  // Música (o silencio)
  // ——————————————
  const availableMusic = useMemo(() => {
    if (musicOptions.length > 0) return musicOptions;
    return [{ id: "silencio", label: "Silencio", url: "" }];
  }, [musicOptions]);

  // ——————————————
  // Reproducir música cuando se selecciona
  // ——————————————
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioUrl) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl]);

  useEffect(() => {
    setVideoError(false);
  }, [videoUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const updateViewport = () => {
      setIsDesktopViewport(window.innerWidth >= 1024);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isAudioSource = useMemo(() => {
    if (!videoUrl) {
      return false;
    }
    return /\.(m4a|mp3|wav|aac|flac|ogg)(\?.*)?$/i.test(videoUrl);
  }, [videoUrl]);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  const renderHeaderSection =
    showHeader || highlights.length > 0
      ? (
        <div className="space-y-4">
          {showHeader && (
            <>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Sala de escucha inmersiva
              </p>

              <h3 className="font-display text-4xl text-slate-50">{title}</h3>

              {subtitle && (
                <p className="max-w-2xl text-slate-300/80 leading-relaxed">{subtitle}</p>
              )}
            </>
          )}

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              {highlights.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )
      : null;

  return (
    <div className="space-y-10">
      {/* ENCABEZADO */}
      {renderHeaderSection}

      {/* VIDEO CON OVERLAY */}
      <div
        className={`relative mx-auto border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl transition-all duration-500 ${
          isDesktopViewport
            ? "w-full max-w-5xl aspect-[16/9]"
            : isVertical
            ? "w-[340px] h-[620px]"
            : "w-full max-w-5xl aspect-video"
        }`}
      >
        {!videoError ? (
          <video
            key={videoUrl ?? "miniverso-sonoro-video"}
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onClick={(event) => requestMobileVideoPresentation(event, videoPresentationId)}
            onError={handleVideoError}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black/60 px-6 py-8 text-center">
            <p className="text-sm text-slate-300">
              No pudimos cargar este {isAudioSource ? "audio" : "video"} en esta vista.
            </p>
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-purple-200 transition hover:text-purple-100 underline-offset-4"
              >
                {isAudioSource ? "Escuchar en nueva pestaña" : "Abrir en nueva pestaña"}
              </a>
            ) : (
              <p className="text-xs text-slate-500">Revisa la fuente del archivo.</p>
            )}
          </div>
        )}

        {!videoError && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(15,23,42,0.7)), url("${noisePattern}")`,
              backgroundSize: "cover",
              backgroundBlendMode: "screen, overlay",
              opacity: 0.85,
            }}
          />
        )}

        {/* Overlay superior */}
        {!videoError && (
          <>
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                Cámara de resonancia
              </p>
              <p className="text-sm text-slate-100 opacity-90">Video ritual errante</p>
            </div>

            {/* Poema */}
            {poemText && (
              <div className="absolute bottom-0 left-0 right-0 p-8 text-center bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-lg leading-relaxed font-light text-slate-100 drop-shadow-xl">
                  {poemText}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CONTROLES */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* Música */}
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Elige la música</p>

          <select
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-white"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          >
            {availableMusic.map((track) => (
              <option key={track.id} value={track.url}>
                {track.label}
              </option>
            ))}
          </select>

          <audio ref={audioRef} src={audioUrl} loop />
        </div>

        {/* Poema */}
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Elige un poema</p>

          <select
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-white"
            value={selectedPoem}
            onChange={(e) => setSelectedPoem(e.target.value)}
          >
            <option value="">Ninguno</option>
            {poems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
