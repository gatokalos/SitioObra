import { useEffect, useMemo, useRef, useState } from "react";

export default function MiniversoSonoro({
  title = "Miniverso Sonoro",
  subtitle = "",
  videoUrl,
  musicOptions = [],
  poems = [],
  highlights = [],
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [isVertical, setIsVertical] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedPoem, setSelectedPoem] = useState("");

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

  return (
    <div className="space-y-10">
      {/* ENCABEZADO */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Sala de escucha inmersiva
        </p>

        <h3 className="font-display text-4xl text-slate-50">{title}</h3>

        {subtitle && (
          <p className="max-w-2xl text-slate-300/80 leading-relaxed">{subtitle}</p>
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

      {/* VIDEO CON OVERLAY */}
      <div
        className={`relative mx-auto border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl transition-all duration-500 ${
          isVertical ? "w-[340px] h-[620px]" : "w-full max-w-5xl aspect-video"
        }`}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Overlay superior */}
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