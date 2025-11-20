import { useEffect, useMemo, useRef, useState } from 'react';

const MiniversoSonoro = ({
  title,
  subtitle,
  videoUrl,
  musicOptions = [],
  poems = [],
  highlights = [],
}) => {
  const videoRef = useRef(null);
  const [isVertical, setIsVertical] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedPoem, setSelectedPoem] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }
    const handleMetadata = () => {
      const { videoWidth, videoHeight } = video;
      setIsVertical(videoHeight > videoWidth);
    };
    video.addEventListener('loadedmetadata', handleMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [videoUrl]);

  const poemText = useMemo(() => {
    const match = poems.find((item) => item.id === selectedPoem);
    return match?.text ?? '';
  }, [poems, selectedPoem]);

  const availableMusic = useMemo(() => {
    if (musicOptions.length > 0) {
      return musicOptions;
    }
    return [{ id: 'silencio', label: 'Silencio', url: '' }];
  }, [musicOptions]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Miniverso Sonoro</p>
        <h3 className="font-display text-3xl text-slate-50">{title}</h3>
        {subtitle ? <p className="text-slate-300/80 leading-relaxed">{subtitle}</p> : null}
        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
            {highlights.map((item, index) => (
              <span key={index} className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem]">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={`relative mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ${
          isVertical
            ? 'w-[320px] h-[620px]'
            : 'w-full max-w-4xl aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          loop
          muted={!audioUrl}
        />
        <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-300">
            Cámara de Resonancia
          </p>
          <p className="text-base font-light text-slate-100">Video errante del sueño</p>
        </div>
        {poemText ? (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-lg font-light leading-relaxed">{poemText}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Elige la música</p>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
            value={audioUrl ?? ''}
            onChange={(event) =>
              setAudioUrl(event.target.value ? event.target.value : '')
            }
          >
            {availableMusic.map((option) => (
              <option key={option.id} value={option.url}>
                {option.label}
              </option>
            ))}
          </select>
          {audioUrl ? (
            <audio className="w-full" src={audioUrl} autoPlay loop controls />
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-400">Elige un poema</p>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
            value={selectedPoem}
            onChange={(event) => setSelectedPoem(event.target.value)}
          >
            <option value="">Ninguno</option>
            {poems.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MiniversoSonoro;
