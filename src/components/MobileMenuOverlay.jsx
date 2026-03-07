import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileMenuOverlay = ({
  isOpen,
  menuItems,
  authActionLabel,
  onNavigate,
  onClose,
  onAuthAction,
}) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeFaqKey, setActiveFaqKey] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return undefined;
    if (typeof document === 'undefined') return undefined;
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

  const handlePrimaryClick = (item) => {
    if (!item.secondary?.length) {
      onNavigate(item.href);
      return;
    }

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
    onNavigate(secondaryItem.href);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="fixed inset-0 z-[80] xl:hidden bg-gradient-to-b from-[#030615]/98 via-[#02040e]/98 to-[#02040e]/99 backdrop-blur-xl"
      aria-modal="true"
      role="dialog"
      aria-label="Índice de navegación principal"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+10px)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-300/90">Índice</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl border border-fuchsia-400/40 bg-black/25 text-slate-200 hover:bg-fuchsia-500/15 hover:text-white"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5">


          <section className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-2">
            {menuItems.map((item) => (
              <div key={item.name} className="rounded-xl transition hover:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => handlePrimaryClick(item)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition"
                >
                  <div className="min-w-0">
                    <p className="font-display text-[1.08rem] leading-tight text-slate-100">{item.name}</p>
                    {item.description ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400/85">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {item.secondary?.length ? (
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400/90 transition-transform ${
                        expandedSection === item.name ? 'rotate-180 text-slate-200' : ''
                      }`}
                    />
                  ) : null}
                </button>

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

          <section className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400/90">Cuenta</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.1]"
              onClick={onAuthAction}
            >
              {authActionLabel}
            </Button>
          </section>
        </div>
      </div>
    </motion.aside>
  );
};

export default MobileMenuOverlay;
