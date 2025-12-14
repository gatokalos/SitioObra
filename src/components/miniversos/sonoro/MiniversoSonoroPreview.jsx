// MiniversoSonoroPreview.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSonoroPreview } from '@/hooks/useSonoroPreview';
import '@/components/miniversos/sonoro/MiniversoSonoroPreview.css';
import '@/styles/dreamModes.css';

const DREAM_MODES = [
  {
    id: 'neblina',
    label: 'Modo',
    short: 'Neblina-Suave',
    copy: 'Neblina suave que difumina los bordes del sueño.',
  },
  {
    id: 'lucid',
    label: 'Modo',
    short: 'Lucid-Dream',
    copy: 'Contrastes profundos y luz que late con la escena, como si el sueño respirara.',
  },
  {
    id: 'umbral',
    label: 'Modo',
    short: 'Umbral-Deep',
    copy: 'Un túnel suave y profundo que suspende la temporalidad.',
  },
];

/**
 * Props:
 * - videoUrl: string
 * - videoTitle?: string
 * - videoArtist?: string
 * - audioOptions?: Array<{ id: string; label?: string; title?: string; url_audio?: string; url?: string }>
 * - poemOptions?: Array<{ id: string; label?: string; title?: string; text?: string }>
 * - initialAudioId?: string
 * - initialPoemId?: string
 * - isLoading?: boolean
 * - errorMessage?: string
 * - showHeader?: boolean
 * - showCTA?: boolean
 * - onEnterExperience?: () => void
 *      → se llama en móvil al tocar "ABRIR CÁMARA DE RESONANCIA"
 * - experienceHref?: string
 *      → si no hay onEnterExperience, se hace window.location.href = experienceHref
 */
function MiniversoSonoroPreview({
  videoUrl: fallbackVideoUrl,
  videoTitle: fallbackVideoTitle = 'Video ritual',
  videoArtist: fallbackVideoArtist = 'Residencia #GatoEncerrado',
  audioOptions: fallbackAudioOptions = [],
  poemOptions: fallbackPoemOptions = [],
  initialAudioId = '',
  initialPoemId = '',
  isLoading: externalLoading = false,
  errorMessage: externalError,
  showHeader = true,
  showCTA = true,
  onEnterExperience,
  experienceHref = '/miniverso-sonoro',
  isSpent = false,
  coinBlast = false,
  costLabel = '130 gatokens',
}) {
  const {
    currentVideo,
    audioOptions,
    poemOptions,
    initialAudioId: resolvedInitialAudioId,
    initialPoemId: resolvedInitialPoemId,
    videoQueue,
    isLoading: hookLoading,
    errorMessage: hookError,
    nextVideo,
  } = useSonoroPreview({
    fallbackVideoUrl,
    fallbackVideoTitle,
    fallbackVideoArtist,
    fallbackAudioOptions,
    fallbackPoemOptions,
  });

  const [dreamMode, setDreamMode] = useState('neblina');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAudioId, setSelectedAudioId] = useState(
    resolvedInitialAudioId || initialAudioId || '',
  );
  const [selectedPoemId, setSelectedPoemId] = useState(initialPoemId || resolvedInitialPoemId || '');
  const [poemLines, setLocalPoemLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(null);
  const [isPoemVisible, setIsPoemVisible] = useState(false);
  const [isFullExperience, setIsFullExperience] = useState(false);
  const [isEnteringExperience, setIsEnteringExperience] = useState(false);
  const isSelectionReady = Boolean(selectedAudioId) && Boolean(selectedPoemId);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const previousScrollYRef = useRef(0);
  const isLoading = hookLoading || externalLoading;

  const selectedAudio = useMemo(
    () => audioOptions.find((track) => track.id === selectedAudioId),
    [audioOptions, selectedAudioId],
  );

  const selectedPoem = useMemo(
    () => poemOptions.find((poem) => poem.id === selectedPoemId),
    [poemOptions, selectedPoemId],
  );

  const poemText = selectedPoem?.poem_text || selectedPoem?.text || '';

  const currentMode = useMemo(
    () => DREAM_MODES.find((mode) => mode.id === dreamMode) || DREAM_MODES[0],
    [dreamMode],
  );

  // Alinear selección cuando cambian las opciones
  useEffect(() => {
    if (!selectedAudioId && resolvedInitialAudioId) {
      setSelectedAudioId(resolvedInitialAudioId);
      return;
    }
    if (!audioOptions.find((track) => track.id === selectedAudioId)) {
      setSelectedAudioId(audioOptions[0]?.id || resolvedInitialAudioId || '');
    }
  }, [audioOptions, resolvedInitialAudioId, selectedAudioId]);

  useEffect(() => {
    if (!selectedPoemId && resolvedInitialPoemId) {
      setSelectedPoemId(resolvedInitialPoemId);
      return;
    }
    if (selectedPoemId === '') return;
    if (!poemOptions.find((poem) => poem.id === selectedPoemId)) {
      setSelectedPoemId('');
    }
  }, [poemOptions, resolvedInitialPoemId, selectedPoemId]);

  useEffect(() => {
    if (!selectedPoem) {
      setLocalPoemLines([]);
      setCurrentLineIndex(0);
      return;
    }
    const lines =
      (selectedPoem.poem_lines && Array.isArray(selectedPoem.poem_lines) && selectedPoem.poem_lines.length > 0)
        ? selectedPoem.poem_lines
        : typeof poemText === 'string'
          ? poemText.split('\n').map((l) => l.trim()).filter(Boolean)
          : [];
    setLocalPoemLines(lines);
    setCurrentLineIndex(lines.length > 0 ? 0 : null);
    setIsPoemVisible(lines.length > 0);
  }, [selectedPoem, poemText]);

  useEffect(() => {
    if (!poemLines || poemLines.length === 0 || currentLineIndex === null) return undefined;
    const isLast = currentLineIndex === poemLines.length - 1;
    const timeout = setTimeout(() => {
      if (isLast) {
        setIsPoemVisible(false);
      } else {
        setCurrentLineIndex((i) => (i === null ? 0 : i + 1));
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [poemLines, currentLineIndex, isFullExperience]);

  // Detectar móvil
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isFullExperience) {
      document.body.classList.add('overflow-hidden');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isFullExperience]);

  // Desktop: autoplay de video (silencioso) cuando hay URL
  useEffect(() => {
    if (isMobile && !isFullExperience) return; // en móvil solo en full experience
    const video = videoRef.current;
    if (!video || !currentVideo?.url_video) return;

    video.play().catch(() => {
      // Si el navegador bloquea autoplay, no hacemos nada.
    });
  }, [isMobile, currentVideo]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isMobile && !isFullExperience) {
      videoRef.current.pause();
      return;
    }
    const v = videoRef.current;
    const attempt = v.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        setTimeout(() => v.play().catch(() => {}), 250);
      });
    }
  }, [currentVideo?.url_video, isFullExperience, isMobile]);

  // Reproducir audio cuando cambia la selección
  useEffect(() => {
    if (!audioRef.current) return;
    if (isFullExperience && selectedAudio && selectedAudio.url_audio) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [selectedAudio, isFullExperience]);

  const handleAudioChange = (event) => {
    setSelectedAudioId(event.target.value);
    // activamos audio solo tras interacción explícita
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {});
    }
  };

  const handlePoemChange = (event) => {
    setSelectedPoemId(event.target.value);
  };

  const handleVideoEnd = () => {
    if (videoQueue.length > 1) {
      nextVideo();
      return;
    }
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const handleEnterExperience = () => {
    if (!isSelectionReady || isSpent || isEnteringExperience) return;
    setIsEnteringExperience(true);
    if (typeof window !== 'undefined') {
      previousScrollYRef.current = window.scrollY || 0;
    }
    if (onEnterExperience) {
      onEnterExperience();
    }
    setTimeout(() => {
      setIsFullExperience(true);
      setIsEnteringExperience(false);
    }, 900);
  };

  const handleExitExperience = () => {
    setIsFullExperience(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: previousScrollYRef.current || 0, behavior: 'auto' });
    }
  };

  // Al cambiar a full experience, reiniciar/reproducir medios; al salir, pausar y ocultar poema
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (isFullExperience) {
      if (video) {
        try {
          video.currentTime = 0;
        } catch (e) { /* noop */ }
        video.play().catch(() => {});
      }
      if (audio && selectedAudio?.url_audio) {
        try {
          audio.currentTime = 0;
        } catch (e) { /* noop */ }
        audio.play().catch(() => {});
      }
      if (poemLines.length > 0) {
        setCurrentLineIndex(0);
        setIsPoemVisible(true);
      }
    } else {
      if (video && isMobile) {
        video.pause();
      }
      if (audio) {
        audio.pause();
      }
      setIsPoemVisible(false);
      setCurrentLineIndex(poemLines.length > 0 ? 0 : null);
    }
  }, [isFullExperience, isMobile, poemLines.length, selectedAudio?.url_audio]);

  const overlayVisible = !isMobile && !isFullExperience && !isEnteringExperience;

  const renderHudInfo = ({ variant = 'default' } = {}) => (
    <div className={`sonoro-preview-hud ${variant === 'overlay' ? 'sonoro-preview-hud--overlay' : ''}`}>
      <div className="sonoro-preview-hud__body">
        <p className="sonoro-preview-hud__kicker">Cámara de resonancia</p>
        <p className="sonoro-preview-hud__title">
          {currentVideo?.title || fallbackVideoTitle || 'Video ritual'}
        </p>
        <p className="sonoro-preview-hud__artist">
          {currentVideo?.artist || fallbackVideoArtist || 'Residencia #GatoEncerrado'}
        </p>
      </div>
      <div className="sonoro-preview-hud__mode">
        <span className="sonoro-preview-pill">{currentMode.label}</span>
        <small>{currentMode.short}</small>
      </div>
    </div>
  );

  const renderCostBadge = (extraClass = '') => (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
        isSpent
          ? 'border-emerald-200/70 bg-emerald-500/25 text-emerald-50'
          : 'border-amber-200/80 bg-amber-500/30 text-amber-50'
      } ${extraClass}`}
    >
      <span className="text-amber-50">◎</span>
      {isSpent ? '0 gatokens' : costLabel}
    </span>
  );

  const renderVideoCard = (extraClass = '') => (
    <div className={`sonoro-preview-video-card mode-${dreamMode} ${extraClass}`}>
      {isMobile ? renderHudInfo() : null}

      <div className="sonoro-ambient">
        <div className="sonoro-ambient-video">
          {currentVideo?.url_video ? (
            <video
              key={currentVideo?.id || currentVideo?.url_video}
              ref={videoRef}
              className="sonoro-preview-video"
              src={currentVideo?.url_video}
              muted
              autoPlay={!isMobile || isFullExperience}
              playsInline
              loop={!isMobile || isFullExperience}
              onEnded={handleVideoEnd}
            />
          ) : (
            <div className="sonoro-preview-video-placeholder">
              <p>{isLoading ? 'Cargando el archivo sonoro…' : 'Pronto se abrirá un video ritual.'}</p>
            </div>
          )}
          <div className={`dream-overlay dream-${dreamMode}`} aria-hidden="true" />
        </div>

        {/* Overlays y ambientación */}
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

      {(poemLines?.length || poemText) && (
        <div className="sonoro-preview-poem-overlay poem-overlay">
          {poemLines?.length ? (
            poemLines.map((line, idx) => (
              <p
                key={`${selectedPoem?.id || 'poema'}-${idx}`}
                className={`poem-line ${idx === currentLineIndex && isPoemVisible ? 'is-visible' : ''}`}
                style={{ zIndex: idx === currentLineIndex ? 2 : 1 }}
              >
                {line}
              </p>
            ))
          ) : (
            <p className="poem-line is-visible">{poemText}</p>
          )}
        </div>
      )}
      {!isMobile ? (
        <motion.div
          className="sonoro-preview-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: overlayVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}
        >
          <div className="sonoro-preview-overlay-panel">
            <div className="sonoro-overlay-head">
              {renderHudInfo({ variant: 'overlay' })}
              <div className="sonoro-overlay-cost">{renderCostBadge('sonoro-cost-chip--overlay')}</div>
            </div>
            {overlayControls}
          </div>
        </motion.div>
      ) : null}
    </div>
  );

  const renderCTAButton = (customClass = 'sonoro-preview-cta') => (
    <div className="sonoro-preview-cta-wrapper">
      {coinBlast ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: -6 }}
          exit={{ opacity: 0, y: -10 }}
          className="sonoro-preview-cta-badge"
        >
          -{costLabel}
        </motion.div>
      ) : null}
      <button
        type="button"
        className={`${customClass} relative`}
        onClick={handleEnterExperience}
        disabled={!isSelectionReady || isSpent || isEnteringExperience}
      >
        <span className="relative z-10">
          {isSpent ? 'Créditos aplicados' : isEnteringExperience ? 'Entrando…' : 'Entrar a la cámara de resonancia'}
        </span>
        {coinBlast ? (
          <span className="pointer-events-none absolute inset-0">
            {Array.from({ length: 7 }).map((_, index) => {
              const endX = 140 + index * 12;
              const endY = -130 - index * 14;
              return (
                <motion.span
                  key={`sonoro-coin-${index}`}
                  className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                  initial={{ opacity: 0.9, scale: 0.7, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1, x: endX, y: endY, rotate: 120 + index * 22 }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
                />
              );
            })}
          </span>
        ) : null}
      </button>
    </div>
  );

  const renderModeControls = () => (
    <div className="sonoro-preview-control-group sonoro-preview-control-group--modes">
      <p className="sonoro-preview-control-label">Modos de sueño</p>
      <div className="sonoro-preview-mode-pills">
        {DREAM_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`sonoro-preview-mode-pill ${dreamMode === mode.id ? 'is-active' : ''}`}
            onClick={() => setDreamMode(mode.id)}
            aria-pressed={dreamMode === mode.id}
          >
            <div className="sonoro-preview-mode-pill__header">
              <span>{mode.label}</span>
              <small>{mode.short}</small>
            </div>
            <p>{mode.copy}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMusicControl = () => (
    <div className="sonoro-preview-control-group">
      <p className="sonoro-preview-control-label">Elige la música</p>
      <select
        value={selectedAudio?.id ?? ''}
        onChange={handleAudioChange}
        className="sonoro-preview-select"
      >
        {audioOptions.map((track) => (
          <option key={track.id} value={track.id}>
            {track.label || track.title}
          </option>
        ))}
      </select>
    </div>
  );

  const renderPoemControl = () => (
    <div className="sonoro-preview-control-group">
      <p className="sonoro-preview-control-label">Elige un poema</p>
      <select
        value={selectedPoem?.id ?? ''}
        onChange={handlePoemChange}
        className="sonoro-preview-select"
      >
        <option value="">Ninguno</option>
        {poemOptions.map((poem) => (
          <option key={poem.id} value={poem.id}>
            {poem.label || poem.title || 'Poema ritual'}
          </option>
        ))}
      </select>
    </div>
  );

  const controlsBlock = (
    <>
      {renderModeControls()}
      {renderMusicControl()}
      {renderPoemControl()}
    </>
  );

  const overlayControls = (
    <div className="sonoro-overlay-controls">
      <div className="sonoro-overlay-modes">{renderModeControls()}</div>
      <div className="sonoro-overlay-meta">
        {renderMusicControl()}
        {renderPoemControl()}
        {showCTA ? renderCTAButton('sonoro-preview-cta sonoro-preview-cta--overlay') : null}
        <p className="sonoro-preview-overlay-hint">Necesitas {costLabel}</p>
      </div>
    </div>
  );

  const mobileLayout = (
    <div className="sonoro-preview-layout is-mobile">
      <aside className="sonoro-preview-controls">{controlsBlock}</aside>
      <section className="sonoro-preview-stage">
        {renderVideoCard()}
        {showCTA ? renderCTAButton() : null}
      </section>
    </div>
  );

  const desktopLayout = (
    <div className="sonoro-preview-layout is-single">
      <section className="sonoro-preview-stage sonoro-preview-stage--wide">
        {renderVideoCard('sonoro-preview-video-card--hero')}
      </section>
    </div>
  );

  const fullscreenLayer =
    typeof document !== 'undefined' && isFullExperience
      ? createPortal(
          <div className="sonoro-fullscreen-layer">
            <div className="sonoro-fullscreen-header">
              <p className="sonoro-fullscreen-kicker">Cámara de resonancia</p>
              <button type="button" className="sonoro-fullscreen-close" onClick={handleExitExperience}>
                Cerrar experiencia
              </button>
            </div>
            <div className="sonoro-fullscreen-body">
              {renderVideoCard('is-full-experience')}
            </div>
          </div>,
          document.body,
        )
      : null;

  const previewLayout = (
    <>
      {showHeader && isMobile ? (
        <div className="sonoro-preview-header">
          <div className="sonoro-preview-header__top">
            {renderCostBadge()}
          </div>
        </div>
      ) : null}
      {isMobile ? mobileLayout : desktopLayout}
    </>
  );

  return (
    <div className={`sonoro-preview root-mode-${dreamMode}`}>
      {!isFullExperience && previewLayout}
      {fullscreenLayer}

      <audio
        ref={audioRef}
        src={selectedAudio?.url_audio || selectedAudio?.url || undefined}
        loop
      />

      {(hookError || externalError) && (
        <p className="sonoro-preview-error">{hookError || externalError}</p>
      )}
    </div>
  );
}

export default MiniversoSonoroPreview;
