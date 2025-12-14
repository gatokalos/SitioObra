import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const shuffleArray = (items = []) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const normalizeKind = (kind) => (kind ? String(kind).toLowerCase().trim() : '');

const pickUrl = (item, candidates) => {
  for (const key of candidates) {
    if (item[key]) return item[key];
  }
  return '';
};

const normalizeAudio = (item, index) => ({
  id: item.id ?? `audio-${index}`,
  label: item.label ?? item.title ?? 'Pista',
  title: item.title ?? item.label ?? '',
  url_audio: pickUrl(item, ['url_audio', 'audio_url', 'audioUrl', 'url']),
});

const normalizePoem = (item, index) => ({
  id: item.id ?? `poema-${index}`,
  label: item.label ?? item.title ?? 'Poema ritual',
  title: item.title ?? item.label ?? '',
  poem_text: item.poem_text ?? item.text ?? item.poemText ?? '',
  poem_lines: item.poem_lines ?? null,
});

const normalizeVideo = (item, index) => ({
  id: item.id ?? `video-${index}`,
  url_video: pickUrl(item, ['url_video', 'video_url', 'videoUrl', 'url']),
  title: item.title ?? item.label ?? 'Video ritual',
  artist: item.artist ?? item.author ?? 'Residencia #GatoEncerrado',
});

const ensureSilenceOption = (tracks = []) => {
  const hasSilence = tracks.some((track) => track.id === 'silencio');
  if (hasSilence) return tracks;
  return [
    {
      id: 'silencio',
      label: 'Silencio',
      title: 'Silencio',
      url_audio: '',
    },
    ...tracks,
  ];
};

const pickInitialAudioId = (tracks = []) => {
  const silence = tracks.find((track) => track.id === 'silencio');
  if (silence) return silence.id;
  return tracks[0]?.id ?? '';
};

export const useSonoroPreview = ({
  fallbackVideoUrl,
  fallbackVideoTitle = 'Video ritual',
  fallbackVideoArtist = 'Residencia #GatoEncerrado',
  fallbackAudioOptions = [],
  fallbackPoemOptions = [],
  videoLimit = null,
  audioLimit = null,
  poemLimit = null,
  fragmentLines = null,
} = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoQueue, setVideoQueue] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [audioOptions, setAudioOptions] = useState([]);
  const [poemOptions, setPoemOptions] = useState([]);
  const [poemLines, setPoemLines] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSonoroMedia = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const { data, error } = await supabase.from('sonoro_media').select('*');
        if (cancelled) return;
        if (error) throw error;

        const records = data ?? [];
        const videos = records
          .filter((item) => {
            const kind = normalizeKind(item.kind || item.type);
            const url = pickUrl(item, ['url_video', 'video_url', 'videoUrl', 'url']);
            return kind === 'video' && !!url;
          })
          .map(normalizeVideo);
        const audios = records
          .filter((item) => {
            const kind = normalizeKind(item.kind || item.type);
            const url = pickUrl(item, ['url_audio', 'audio_url', 'audioUrl', 'url']);
            return kind === 'audio' && !!url;
          })
          .map(normalizeAudio);
        const poems = records
          .filter((item) => {
            const kind = normalizeKind(item.kind || item.type);
            const hasText =
              (typeof item.poem_text === 'string' && item.poem_text.trim() !== '') ||
              (Array.isArray(item.poem_lines) && item.poem_lines.length > 0) ||
              (typeof item.text === 'string' && item.text.trim() !== '') ||
              (typeof item.poemText === 'string' && item.poemText.trim() !== '');
            return (kind === 'poema' || kind === 'poem' || kind === 'poetry') && hasText;
          })
          .map((p, idx) => {
            const base = normalizePoem(p, idx);
            if (!base.poem_lines && base.poem_text) {
              const lines = base.poem_text.split('\n').map((l) => l.trim()).filter(Boolean);
              base.poem_lines = fragmentLines && Number.isFinite(fragmentLines) && fragmentLines > 0
                ? lines.slice(0, fragmentLines)
                : lines;
            }
            if (base.poem_lines && fragmentLines && Number.isFinite(fragmentLines) && fragmentLines > 0) {
              base.poem_lines = base.poem_lines.slice(0, fragmentLines);
            }
            return base;
          });

        const videoList =
          videos.length > 0
            ? shuffleArray(videoLimit ? videos.slice(0, videoLimit) : videos)
            : fallbackVideoUrl
              ? [normalizeVideo({ url_video: fallbackVideoUrl, title: fallbackVideoTitle, artist: fallbackVideoArtist }, 0)]
              : [];
        const audioList = ensureSilenceOption(
          audios.length > 0
            ? audioLimit
              ? audios.slice(0, audioLimit)
              : audios
            : (fallbackAudioOptions ?? []).map(normalizeAudio),
        );
        const poemList =
          poems.length > 0
            ? poemLimit
              ? poems.slice(0, poemLimit)
              : poems
            : (fallbackPoemOptions ?? []).map(normalizePoem);

        setVideoQueue(videoList);
        setCurrentVideoIndex(0);
        setAudioOptions(audioList);
        setPoemOptions(poemList);

        if (videos.length === 0 && audios.length === 0 && poems.length === 0) {
          setErrorMessage('Cargando con datos de respaldo. No hay registros recientes en sonoro_media.');
        }
      } catch (error) {
        const videoList = fallbackVideoUrl
          ? [normalizeVideo({ url_video: fallbackVideoUrl, title: fallbackVideoTitle, artist: fallbackVideoArtist }, 0)]
          : [];
        const audioList = ensureSilenceOption((fallbackAudioOptions ?? []).map(normalizeAudio));
        const poemList = (fallbackPoemOptions ?? []).map(normalizePoem);

        setVideoQueue(videoList);
        setCurrentVideoIndex(0);
        setAudioOptions(audioList);
        setPoemOptions(poemList);
        setErrorMessage(error?.message ?? 'No pudimos cargar el miniverso sonoro.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSonoroMedia();
    return () => {
      cancelled = true;
    };
  }, [fallbackAudioOptions, fallbackPoemOptions, fallbackVideoArtist, fallbackVideoTitle, fallbackVideoUrl]);

  const currentVideo = useMemo(
    () => (videoQueue.length > 0 ? videoQueue[currentVideoIndex % videoQueue.length] : null),
    [videoQueue, currentVideoIndex],
  );

  const initialAudioId = useMemo(() => pickInitialAudioId(audioOptions), [audioOptions]);
  // Arrancar poemas en "ninguno" por defecto
  const initialPoemId = useMemo(() => '', [poemOptions]);

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => {
      if (videoQueue.length === 0) return prev;
      return (prev + 1) % videoQueue.length;
    });
  };

  return {
    videoQueue,
    currentVideoIndex,
    currentVideo,
    audioOptions,
    poemOptions,
    initialAudioId,
    initialPoemId,
    isLoading,
    errorMessage,
    nextVideo,
  };
};
