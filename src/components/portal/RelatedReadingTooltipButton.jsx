import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const TONE_STYLES = {
  cyan: {
    button: 'border-cyan-200/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 focus-visible:ring-cyan-300/50',
    panel: 'border-cyan-200/35 bg-slate-950/95',
    label: 'text-cyan-100',
    cta: 'border-cyan-200/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20',
    placeholder: 'bg-cyan-300/10 text-cyan-100',
  },
  violet: {
    button: 'border-violet-200/40 bg-violet-300/10 text-violet-100 hover:bg-violet-300/20 focus-visible:ring-violet-300/50',
    panel: 'border-violet-200/35 bg-slate-950/95',
    label: 'text-violet-100',
    cta: 'border-violet-200/40 bg-violet-300/10 text-violet-100 hover:bg-violet-300/20',
    placeholder: 'bg-violet-300/10 text-violet-100',
  },
};

const GAP_PX = 8;

const RelatedReadingTooltipButton = ({
  slug,
  authorLabel = 'autor invitado',
  thumbnailUrl = null,
  ariaLabel = 'Mostrar lectura relacionada',
  tone = 'cyan',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState('above');
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const styles = TONE_STYLES[tone] || TONE_STYLES.cyan;

  const hiddenTranslateClass = placement === 'above' ? 'translate-y-1' : '-translate-y-1';
  const positionClass = placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2';

  const readingHref = useMemo(() => {
    if (!slug) return '/#blog';
    return `/#blog/${encodeURIComponent(slug)}`;
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setIsOpen(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePlacement = () => {
      if (!rootRef.current || !panelRef.current || typeof window === 'undefined') return;
      const triggerRect = rootRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const panelHeight = Math.max(panelRect.height || 0, 220);
      const spaceAbove = triggerRect.top;
      const spaceBelow = window.innerHeight - triggerRect.bottom;

      if (spaceAbove >= panelHeight + GAP_PX) {
        setPlacement('above');
        return;
      }
      if (spaceBelow >= panelHeight + GAP_PX) {
        setPlacement('below');
        return;
      }
      setPlacement(spaceAbove >= spaceBelow ? 'above' : 'below');
    };

    const rafId = window.requestAnimationFrame(updatePlacement);
    document.addEventListener('scroll', updatePlacement, true);
    window.addEventListener('resize', updatePlacement);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('scroll', updatePlacement, true);
      window.removeEventListener('resize', updatePlacement);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!slug) return null;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${styles.button}`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <BookOpen size={16} />
      </button>
      <div
        ref={panelRef}
        className={`absolute right-0 z-20 w-[min(88vw,18rem)] sm:w-[min(76vw,18.5rem)] md:w-[19rem] lg:w-[20rem] xl:w-[21rem] overflow-hidden rounded-lg border shadow-[0_16px_36px_rgba(0,0,0,0.5)] transition duration-200 ${positionClass} ${styles.panel} ${
          isOpen ? 'pointer-events-auto opacity-100 translate-y-0' : `pointer-events-none opacity-0 ${hiddenTranslateClass}`
        }`}
      >
        <div className="space-y-2 px-3 py-2 text-center">
          <p className={`text-[11px] leading-snug ${styles.label}`}>Curaduría de {authorLabel} disponible</p>
          <div className="flex justify-center">
            <Link
              to={readingHref}
              className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em] transition ${styles.cta}`}
              onClick={() => setIsOpen(false)}
            >
              Ir a leer
            </Link>
          </div>
        </div>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Miniatura de lectura de ${authorLabel}`}
            className="h-28 w-full object-cover md:h-32"
            loading="lazy"
          />
        ) : (
          <div className={`inline-flex h-24 w-full items-center justify-center ${styles.placeholder}`}>
            <BookOpen size={16} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedReadingTooltipButton;
