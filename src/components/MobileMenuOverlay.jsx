import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MobileMenuOverlay = ({
  isOpen,
  menuItems,
  activeSectionHref = null,
  onNavigate,
  onClose,
}) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeFaqKey, setActiveFaqKey] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return undefined;
    if (typeof document === 'undefined') return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1280px)').matches) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Título y chevron son zonas de clic independientes cuando el ítem tiene
  // sub-secciones: el título siempre navega a item.href, el chevron siempre
  // expande/contrae — antes todo el renglón era un solo botón que solo
  // expandía, sin forma de navegar directo a la sección padre.
  const handleTitleClick = (item) => {
    onNavigate(item.href);
  };

  const handleToggleExpand = (item) => {
    setExpandedSection((current) => {
      const next = current === item.name ? null : item.name;
      if (item.name === 'FAQ') {
        setActiveFaqKey(next ? activeFaqKey : '');
      }
      return next;
    });
  };

  const handleSecondaryClick = (item, secondaryItem) => {
    if (item.name === 'FAQ') {
      setExpandedSection('FAQ');
      setActiveFaqKey(secondaryItem.href);
      return;
    }
    if (secondaryItem.action === 'show-buscador') {
      window.dispatchEvent(new CustomEvent('gatoencerrado:show-buscador'));
    }
    onNavigate(secondaryItem.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="pointer-events-none fixed inset-0 z-[80]"
    >
      <motion.aside
        initial={{ y: -12 }}
        animate={{ y: 0 }}
        exit={{ y: -12 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        id="site-index-menu"
        data-site-index-root
        className="hero-scene-glass-panel pointer-events-auto fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-10 mx-auto flex w-auto max-w-[22rem] flex-col overflow-hidden rounded-2xl border border-white/10 sm:left-6 sm:right-auto sm:mx-0 sm:w-[22rem] xl:w-[20rem] xl:max-w-[calc(100vw-2rem)] 2xl:left-[calc((100vw-1280px)/2+1.5rem)]"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 80px)' }}
        aria-modal="false"
        role="dialog"
        aria-label="Índice de navegación principal"
      >
        <div className="flex min-h-0 flex-col">
        <div className="shrink-0 border-b border-white/10 px-4 pb-3 pt-4">
          <div className="flex items-center">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-300/90">Programa de mano</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 xl:max-h-[calc(100vh-7rem)] xl:pb-2">


          <section className="rounded-2xl border border-white/10 bg-black/35 p-2">
            {menuItems.map((item) => (
              <div key={item.name} className="rounded-xl transition hover:bg-white/[0.04]">
                <div className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3">
                  <button
                    type="button"
                    onClick={() => handleTitleClick(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="font-display text-[1.08rem] leading-tight text-slate-100">{item.name}</p>
                    {item.description ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400/85">
                        {item.description}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {activeSectionHref === item.href ? (
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]"
                        aria-hidden="true"
                      />
                    ) : null}
                    {item.secondary?.length ? (
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(item)}
                        aria-label={expandedSection === item.name ? `Contraer ${item.name}` : `Expandir ${item.name}`}
                        aria-expanded={expandedSection === item.name}
                        className="-m-1.5 rounded-lg p-1.5 transition hover:bg-white/[0.08]"
                      >
                        <ChevronDown
                          size={16}
                          className={`text-slate-400/90 transition-transform ${
                            expandedSection === item.name ? 'rotate-180 text-slate-200' : ''
                          }`}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>

                {item.secondary?.length && expandedSection === item.name ? (
                  <div className="mb-2 mr-2 ml-3 rounded-xl border border-white/10 bg-black/35 p-2">
                    {item.secondary.map((secondaryItem) => (
                      <button
                        key={`${item.name}-${secondaryItem.label}`}
                        type="button"
                        onClick={() => handleSecondaryClick(item, secondaryItem)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          item.name === 'FAQ' && activeFaqKey === secondaryItem.href
                            ? 'bg-white/[0.08] text-white'
                            : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <span>{secondaryItem.label}</span>
                        <ChevronRight size={14} className="text-slate-400/90" />
                      </button>
                    ))}

                    {item.name === 'FAQ' && activeFaqKey ? (
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={activeFaqKey}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="mt-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-3 text-sm leading-relaxed text-slate-200/95"
                        >
                          {item.secondary.find((entry) => entry.href === activeFaqKey)?.answer || ''}
                        </motion.div>
                      </AnimatePresence>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </section>

        </div>
      </div>
      </motion.aside>
    </motion.div>
  );
};

export default MobileMenuOverlay;
