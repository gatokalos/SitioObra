import { useState, useRef, useCallback, useEffect } from 'react';

const CAUSE_TO_BAR_KEY = {
  tratamientos: 'terapias',
  residencias: 'residencias',
  'app-escolar': 'implementacionEscuelas',
};
const IMPACT_SYNC_MEDIA_QUERY =
  '(min-width: 1024px), ((min-width: 768px) and (orientation: landscape))';
const DEFAULT_CAUSE_OPEN_ID = 'residencias';

const resolveDefaultCauseId = (items = []) =>
  items.find((item) => item?.id === DEFAULT_CAUSE_OPEN_ID)?.id ?? items?.[0]?.id ?? null;

const CauseImpactAccordion = ({ items, onOpenImagePreview }) => {
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [isImpactSyncViewport, setIsImpactSyncViewport] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(IMPACT_SYNC_MEDIA_QUERY).matches
  );
  const [openCauseId, setOpenCauseId] = useState(() => resolveDefaultCauseId(items));
  const [activeSlideById, setActiveSlideById] = useState({});
  const hasAutoOpenedOnceRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktopViewport(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia(IMPACT_SYNC_MEDIA_QUERY);
    const handleChange = (event) => setIsImpactSyncViewport(event.matches);

    setIsImpactSyncViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    const defaultId = resolveDefaultCauseId(items);
    if (!defaultId) return;
    if (hasAutoOpenedOnceRef.current) return;
    setOpenCauseId(defaultId);
    hasAutoOpenedOnceRef.current = true;
  }, [items]);

  const handleCarouselScroll = (itemId, event, total) => {
    const target = event.currentTarget;
    if (!target || !total) {
      return;
    }
    const nextIndex = Math.round(target.scrollLeft / target.offsetWidth);
    setActiveSlideById((prev) => {
      if (prev[itemId] === nextIndex) {
        return prev;
      }
      return { ...prev, [itemId]: nextIndex };
    });
  };

  const handleCauseToggle = useCallback(
    (itemId) => {
      const nextOpenCauseId = openCauseId === itemId ? (isDesktopViewport ? itemId : null) : itemId;
      setOpenCauseId(nextOpenCauseId);

      if (!isImpactSyncViewport || nextOpenCauseId !== itemId || typeof window === 'undefined') {
        return;
      }

      const barKey = CAUSE_TO_BAR_KEY[itemId];
      if (!barKey) return;

      window.dispatchEvent(
        new CustomEvent('gatoencerrado:impact-accordion-toggle', {
          detail: { causeId: itemId, barKey },
        })
      );
    },
    [isDesktopViewport, isImpactSyncViewport, openCauseId]
  );

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isOpen = openCauseId === item.id;
        const images = Array.isArray(item.imageUrls)
          ? item.imageUrls.filter(Boolean)
          : [];
        const fullImages = Array.isArray(item.imageUrlsFull)
          ? item.imageUrlsFull.filter(Boolean)
          : [];
        const primaryImage = images[0];
        const getFullImage = (index) => fullImages[index] || images[index];
        return (
          <div
            key={item.id}
            className="border border-white/10 rounded-2xl bg-black/20 overflow-hidden transition"
          >
            <button
              type="button"
              onClick={() => handleCauseToggle(item.id)}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/15 text-purple-200">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.metric}</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {isOpen ? (isDesktopViewport ? '...' : 'x') : (item.tramo ?? '—')}
              </span>
            </button>
            {isOpen ? (
              <div className="px-4 pb-4 text-sm text-slate-300/90">
                <div className="flex flex-col gap-3">
                  <div className="md:pr-4">
                    <p>{item.description}</p>
                    <div className="mt-4 hidden md:block">
                      {primaryImage ? (
                        <div className="grid grid-cols-4 gap-3">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <button
                              key={`${item.id}-desk-img-${index}`}
                              type="button"
                              onClick={() =>
                                onOpenImagePreview({
                                  src: getFullImage(index) || getFullImage(0),
                                  title: item.title,
                                  description: item.description,
                                  label: item.imageLabel,
                                }, { requiresAuth: false })
                              }
                              className="rounded-xl border border-white/10 bg-black/20 hover:border-purple-300/60 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]"
                              aria-label="Abrir foto de archivo"
                            >
                              <img
                                src={images[index] || images[0]}
                                alt={item.imageAlt || `Foto de ${item.title}`}
                                className="h-[90px] w-full rounded-xl object-cover opacity-80"
                                loading="lazy"
                                decoding="async"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div
                              key={`${item.id}-desk-placeholder-${index}`}
                              className="rounded-xl border border-white/10 bg-black/20"
                            >
                              <div className="flex h-[90px] w-full items-center justify-center rounded-xl text-[10px] uppercase tracking-[0.3em] text-slate-500/80">
                                Foto
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 md:hidden">
                      {images.length ? (
                        <>
                          <div
                            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3"
                            onScroll={(event) =>
                              handleCarouselScroll(item.id, event, images.length)
                            }
                            style={{ minHeight: '256px' }}
                          >
                            {images.map((imageUrl, index) => (
                              <button
                                key={`${item.id}-mobile-img-${index}`}
                                type="button"
                                onClick={() =>
                                  onOpenImagePreview({
                                    src: getFullImage(index),
                                    title: item.title,
                                    description: item.description,
                                    label: item.imageLabel,
                                  }, { requiresAuth: false })
                                }
                                className="w-full shrink-0 snap-start rounded-xl border border-white/10 bg-black/20 hover:border-purple-300/60 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]"
                                aria-label="Abrir foto de archivo"
                                style={{ minWidth: '100%', aspectRatio: '1 / 1' }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.imageAlt || `Foto de ${item.title}`}
                                  className="w-full h-full rounded-xl object-cover opacity-80"
                                  loading="lazy"
                                  decoding="async"
                                />
                              </button>
                            ))}
                          </div>
                          {images.length > 1 ? (
                            <div className="mt-2 flex items-center justify-center gap-2">
                              {images.map((_, index) => (
                                <span
                                  key={`${item.id}-dot-${index}`}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    (activeSlideById[item.id] ?? 0) === index
                                      ? 'bg-purple-200'
                                      : 'bg-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-black/20">
                          <div className="flex aspect-square items-center justify-center rounded-xl text-[10px] uppercase tracking-[0.3em] text-slate-500/80">
                            Foto
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default CauseImpactAccordion;
