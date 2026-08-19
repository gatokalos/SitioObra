import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const TONE_STYLES = {
  cyan: {
    button: 'border-cyan-200/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 focus-visible:ring-cyan-300/50',
  },
  violet: {
    button: 'border-violet-200/40 bg-violet-300/10 text-violet-100 hover:bg-violet-300/20 focus-visible:ring-violet-300/50',
  },
};

const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 16;

const RelatedReadingTooltipButton = ({
  ariaLabel = 'Mostrar lectura relacionada',
  tone = 'cyan',
  miniversoLabel = null,
  onBeforeNavigate = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState('above');
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const styles = TONE_STYLES[tone] || TONE_STYLES.cyan;

  const hiddenTranslateClass = placement === 'above' ? 'translate-y-1' : '-translate-y-1';
  const [panelStyle, setPanelStyle] = useState(null);

  const apuntadorHref = useMemo(() => {
    const lowerLabel = miniversoLabel
      ? miniversoLabel.charAt(0).toLowerCase() + miniversoLabel.slice(1)
      : '';
    const question = lowerLabel
      ? `¿Qué ocurre cuando ${lowerLabel} intenta sostener todo un universo sin que se rompa?`
      : '';
    const params = question ? `?apuntador_q=${encodeURIComponent(question)}` : '';
    return `/${params}#dialogo-critico`;
  }, [miniversoLabel]);

  const handleAskApuntador = () => {
    setIsOpen(false);
    // En Desktop este botón vive dentro de MiniverseModal: si no se cierra
    // primero, la vitrina se queda abierta con el scroll del body bloqueado
    // (overflow-hidden) y el salto a #dialogo-critico no se ve. onBeforeNavigate
    // (handleCloseShowcase) libera ese lock antes de navegar.
    onBeforeNavigate?.();
    navigate(apuntadorHref);
  };

  useEffect(() => {
    if (!isOpen) {
      setPanelStyle(null);
      return undefined;
    }

    const updatePlacement = () => {
      if (!rootRef.current || !panelRef.current || typeof window === 'undefined') return;
      const triggerRect = rootRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const panelWidth = Math.min(
        panelRect.width || 320,
        window.innerWidth - VIEWPORT_MARGIN_PX * 2,
      );
      const panelHeight = Math.min(
        Math.max(panelRect.height || 0, 220),
        window.innerHeight - VIEWPORT_MARGIN_PX * 2,
      );
      const spaceAbove = triggerRect.top - VIEWPORT_MARGIN_PX;
      const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN_PX;
      const canOpenAbove = spaceAbove >= panelHeight + GAP_PX;
      const canOpenBelow = spaceBelow >= panelHeight + GAP_PX;
      const nextPlacement = canOpenBelow || (!canOpenAbove && spaceBelow >= spaceAbove)
        ? 'below'
        : 'above';
      const rawTop = nextPlacement === 'above'
        ? triggerRect.top - (panelRect.height || panelHeight) - GAP_PX
        : triggerRect.bottom + GAP_PX;
      const maxTop = Math.max(
        VIEWPORT_MARGIN_PX,
        window.innerHeight - (panelRect.height || panelHeight) - VIEWPORT_MARGIN_PX,
      );
      const rawLeft = triggerRect.right - panelWidth;
      const maxLeft = Math.max(
        VIEWPORT_MARGIN_PX,
        window.innerWidth - panelWidth - VIEWPORT_MARGIN_PX,
      );

      setPlacement(nextPlacement);
      setPanelStyle({
        top: `${Math.min(Math.max(rawTop, VIEWPORT_MARGIN_PX), maxTop)}px`,
        left: `${Math.min(Math.max(rawLeft, VIEWPORT_MARGIN_PX), maxLeft)}px`,
      });
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
      if (!rootRef.current.contains(event.target) && !panelRef.current?.contains(event.target)) {
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

  const tooltipPanel = typeof document === 'undefined'
    ? null
    : createPortal(
      <div
        ref={panelRef}
        className={`fixed z-[510] w-[min(88vw,18rem)] sm:w-[min(76vw,18.5rem)] md:w-[19rem] lg:w-[20rem] xl:w-[21rem] h-44 md:h-48 overflow-hidden rounded-2xl border shadow-[0_16px_36px_rgba(0,0,0,0.5)] transition duration-200 camerino-apuntador-panel ${
          isOpen ? 'pointer-events-auto opacity-100 translate-y-0' : `pointer-events-none opacity-0 ${hiddenTranslateClass}`
        }`}
        style={{
          ...(panelStyle || { top: 0, left: 0, visibility: 'hidden' }),
          // El tooltip flota por encima de otro contenido (createPortal a
          // document.body): el degradado translúcido de .camerino-apuntador-panel
          // deja que ese fondo se cuele y afecta la lectura. Aquí sube la
          // opacidad casi al máximo para que quede sólido.
          background:
            'radial-gradient(circle at 12% 8%, rgba(115, 48, 91, 0.35), transparent 42%), linear-gradient(145deg, rgba(49, 19, 42, 0.98), rgba(24, 12, 28, 0.97) 58%, rgba(12, 10, 20, 0.97))',
        }}
      >
        {/* Un solo camino, siempre: el Apuntador (RAG) ya cita los artículos
            reales de Carlos cuando aplica dentro de su propia respuesta, así
            que la rama "Leer ahora" (artículo directo) dejó de tener razón
            de ser — confirmado con Carlos 2026-08-19. */}
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-[11px] leading-snug text-violet-100/90">Consulta más sobre este miniverso en el Camerino.</p>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-violet-200/40 bg-violet-300/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em] text-violet-100 transition hover:bg-violet-300/20"
            onClick={handleAskApuntador}
          >
            Preguntar al Apuntador →
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${styles.button}`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        title={ariaLabel}
      >
        <BookOpen size={16} />
      </button>
      {tooltipPanel}
    </div>
  );
};

export default RelatedReadingTooltipButton;
