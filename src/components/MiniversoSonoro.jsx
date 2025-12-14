import { useEffect, useMemo, useRef, useState } from "react";
import "@/components/miniversos/sonoro/MiniversoSonoroPreview.css";

const VISUAL_MODES = [
  { id: "neblina", label: "Neblina" },
  { id: "lucid", label: "Lucid Dream" },
  { id: "umbral", label: "Umbral" },
];

export default function MiniversoSonoro({
  title = "Miniverso Sonoro",
  subtitle = "",
  videoUrl,
  videoTitle = "Video ritual",
  videoArtist = "Residencia #GatoEncerrado",
  musicOptions = [],
  poems = [],
  highlights = [],
  showHeader = true,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [isVertical, setIsVertical] = useState(false);
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [selectedPoemId, setSelectedPoemId] = useState("");
  const [visualMode, setVisualMode] = useState("neblina");
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const [isRitualOpen, setIsRitualOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleMetadata = () => setIsVertical(video.videoHeight > video.videoWidth);
    video.addEventListener("loadedmetadata", handleMetadata);
    return () => video.removeEventListener("loadedmetadata", handleMetadata);
  }, [videoUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const updateViewport = () => setIsDesktopViewport(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const audioOptions = useMemo(() => {
    if (musicOptions.length > 0) return musicOptions;
    return [{ id: "silencio", label: "Silencio", url: "" }];
  }, [musicOptions]);

  const selectedAudio = useMemo(
    () => audioOptions.find((a) => a.id === selectedAudioId) || null,
    [audioOptions, selectedAudioId],
  );

  const selectedPoem = useMemo(
    () => poems.find((p) => p.id === selectedPoemId) || null,
    [poems, selectedPoemId],
  );

  const poemText = selectedPoem?.text ?? "";

  useEffect(() => {
    if (!audioRef.current) return;
    if (selectedAudio?.url) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [selectedAudio]);

  useEffect(() => {
    if (!selectedAudioId && audioOptions[0]) {
      setSelectedAudioId(audioOptions[0].id);
    }
    if (!selectedPoemId && poems[0]) {
      setSelectedPoemId(poems[0].id);
    }
  }, [audioOptions, poems, selectedAudioId, selectedPoemId]);

  const SonoroPlayer = ({ isFullscreen = false }) => {
    const poemLines = useMemo(
      () => (poemText ? poemText.split("\n").map((l) => l.trim()).filter(Boolean) : []),
      [poemText],
    );
    const [currentLineIndex, setCurrentLineIndex] = useState(null);
    const [poemVisible, setPoemVisible] = useState(false);

    useEffect(() => {
      if (!poemLines.length) {
        setCurrentLineIndex(null);
        setPoemVisible(false);
        return;
      }
      setCurrentLineIndex(0);
      setPoemVisible(true);
    }, [poemLines]);

    useEffect(() => {
      if (currentLineIndex === null) return undefined;
      const isLast = poemLines.length > 0 && currentLineIndex === poemLines.length - 1;
      const t = setTimeout(() => {
        if (isLast) {
          setPoemVisible(false);
        } else {
          setCurrentLineIndex((i) => (i === null ? 0 : i + 1));
        }
      }, 3200);
      return () => clearTimeout(t);
    }, [currentLineIndex, poemLines.length]);

    useEffect(() => {
      const videoEl = videoRef.current;
      if (!videoEl || !videoUrl) return;
      videoEl.muted = true;
      const attempt = videoEl.play();
      if (attempt?.catch) {
        attempt.catch(() => {
          videoEl.muted = true;
          setTimeout(() => videoEl.play().catch(() => {}), 200);
        });
      }
    }, [videoUrl]);

    return (
      <div className={`sonoro-preview root-mode-${visualMode}`}>
        <div className={`sonoro-preview-video-card mode-${visualMode} ${isFullscreen ? "is-full-experience" : ""}`}>
          <div className="sonoro-preview-hud">
            <div>
              <p className="sonoro-preview-hud__kicker">Cámara de resonancia</p>
              <p className="sonoro-preview-hud__title">{videoTitle}</p>
              <p className="sonoro-preview-hud__artist">{videoArtist}</p>
            </div>
            <div className="sonoro-preview-hud__mode">
              <span className="sonoro-preview-pill">{visualMode}</span>
            </div>
          </div>

          <div className="sonoro-ambient">
            <div className="sonoro-ambient-video">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  ref={videoRef}
                  className="sonoro-preview-video"
                  src={videoUrl}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <div className="sonoro-preview-video-placeholder">
                  <p>{"Pronto se abrirá un video ritual."}</p>
                </div>
              )}
            </div>

            <div className="sonoro-ambient-fog" aria-hidden="true" />
            <div className="sonoro-ambient-shadow" aria-hidden="true" />
            <div className="sonoro-ambient-breath" aria-hidden="true" />
            <div className="sonoro-ambient-grain" aria-hidden="true" />

            <div className="sonoro-video-overlay" aria-hidden="true">
              <span className="sonoro-video-overlay__layer layer-1" />
              <span className="sonoro-video-overlay__layer layer-2" />
              <span className="sonoro-video-overlay__layer layer-3" />
              <span className="sonoro-video-overlay__layer layer-4" />
            </div>
          </div>

          {poemLines.length > 0 && (
            <div className="sonoro-preview-poem-overlay">
              {poemLines.map((line, idx) => (
                <p
                  key={`poem-${idx}`}
                  className={`poem-line ${poemVisible && idx === currentLineIndex ? "is-visible" : ""}`}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="sonoro-preview-controls">
          <div className="sonoro-preview-control-group">
            <p className="sonoro-preview-control-label">Modos</p>
            <div className="sonoro-radio-group">
              {VISUAL_MODES.map((mode) => (
                <label key={mode.id} className="sonoro-radio-option">
                  <input
                    type="radio"
                    name="sonoro-mode"
                    value={mode.id}
                    checked={visualMode === mode.id}
                    onChange={() => setVisualMode(mode.id)}
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sonoro-preview-control-group">
            <p className="sonoro-preview-control-label">Música</p>
            <div className="sonoro-radio-group">
              {audioOptions.map((track) => (
                <label key={track.id} className="sonoro-radio-option">
                  <input
                    type="radio"
                    name="sonoro-audio"
                    value={track.id}
                    checked={selectedAudio?.id === track.id}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                  />
                  <span>{track.label || track.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sonoro-preview-control-group">
            <p className="sonoro-preview-control-label">Poema</p>
            <div className="sonoro-radio-group">
              <label className="sonoro-radio-option">
                <input
                  type="radio"
                  name="sonoro-poem"
                  value=""
                  checked={!selectedPoem}
                  onChange={() => setSelectedPoemId("")}
                />
                <span>Ninguno</span>
              </label>
              {poems.map((poem) => (
                <label key={poem.id} className="sonoro-radio-option">
                  <input
                    type="radio"
                    name="sonoro-poem"
                    value={poem.id}
                    checked={selectedPoem?.id === poem.id}
                    onChange={(e) => setSelectedPoemId(e.target.value)}
                  />
                  <span>{poem.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="space-y-10 relative">
      {renderHeaderSection}

      {isDesktopViewport ? (
        <SonoroPlayer isFullscreen />
      ) : (
        <>
          {!isRitualOpen && (
            <button
              type="button"
              className="w-full rounded-full border border-white/15 bg-gradient-to-r from-purple-600/80 to-blue-500/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg hover:from-purple-500 hover:to-blue-400 transition"
              onClick={() => setIsRitualOpen(true)}
            >
              Entrar a Cámara de Resonancias
            </button>
          )}
          {isRitualOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.4em] text-purple-200">
                  Cámara de resonancia
                </p>
                <button
                  type="button"
                  className="text-sm font-semibold text-purple-100 underline-offset-4"
                  onClick={() => setIsRitualOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center">
                <div className="w-full max-w-3xl">
                  <SonoroPlayer isFullscreen />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <audio ref={audioRef} src={selectedAudio?.url || ""} loop />
    </div>
  );
}
