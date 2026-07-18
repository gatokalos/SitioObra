import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const GAT_BALANCE_KEY = 'gatoencerrado:gatokens-available';
const GAP_PX = 8;

const readBalance = () => {
  try {
    const v = Number(localStorage.getItem(GAT_BALANCE_KEY));
    return Number.isFinite(v) && v >= 0 ? Math.trunc(v) : 0;
  } catch {
    return 0;
  }
};

const GATChip = () => {
  const [balance, setBalance]     = useState(readBalance);
  const [isOpen, setIsOpen]       = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const rootRef  = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const sync = () => setBalance(readBalance());
    window.addEventListener('gatoencerrado:gatokens-balance-update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('gatoencerrado:gatokens-balance-update', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Calculates fixed position relative to the trigger button.
  // Runs in useLayoutEffect so the panel is positioned before first paint.
  const calcPosition = () => {
    if (!rootRef.current || typeof window === 'undefined') return;
    const rect    = rootRef.current.getBoundingClientRect();
    const panelW  = Math.min(window.innerWidth * 0.88, 272); // min(88vw, 17rem)
    const panelH  = panelRef.current
      ? Math.max(panelRef.current.scrollHeight, 120)
      : 160;

    const spaceBelow = window.innerHeight - rect.bottom;
    const below      = spaceBelow >= panelH + GAP_PX || spaceBelow >= rect.top;

    // Align right edge of tooltip with right edge of trigger; clamp to viewport.
    const rightFromEdge = Math.max(window.innerWidth - rect.right, 8);

    setPanelStyle({
      position: 'fixed',
      width:    panelW,
      right:    rightFromEdge,
      ...(below
        ? { top: rect.bottom + GAP_PX, bottom: 'auto' }
        : { bottom: window.innerHeight - rect.top + GAP_PX, top: 'auto' }),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    calcPosition();
    window.addEventListener('resize', calcPosition);
    document.addEventListener('scroll', calcPosition, true);
    return () => {
      window.removeEventListener('resize', calcPosition);
      document.removeEventListener('scroll', calcPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e) => {
      if (
        rootRef.current  && !rootRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    const onEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (balance <= 0 && isOpen) {
      setIsOpen(false);
    }
  }, [balance, isOpen]);

  if (balance <= 0) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      {/* Chip */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 pl-2 pr-1 py-1 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
        <img
          src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png"
          alt="GAToken"
          className="h-3.5 w-3.5 animate-[spin_8s_linear_0s_infinite_reverse]"
        />
        <span className="tabular-nums text-[0.68rem] font-semibold leading-none text-amber-200/90">
          {balance.toLocaleString('es-MX')} GAT
        </span>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="¿Qué son los GATokens?"
          aria-expanded={isOpen}
          className="flex h-5 w-5 items-center justify-center rounded-full text-amber-300/50 transition hover:text-amber-200"
        >
          <Info size={11} />
        </button>
      </div>

      {/* Tooltip — rendered in document.body so it never causes layout overflow */}
      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        >
          <div className="space-y-2 px-4 py-3.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-amber-600">
              GATokens · tu energía
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              Cada experiencia dentro del laboratorio requiere una cantidad limitada de GATokens.
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Cuando tus activaciones concluyen, nuevos recorridos de investigación pueden abrirse.
            </p>
          </div>
          <div className="border-t border-slate-100 bg-amber-50 px-4 py-2">
            <p className="text-[0.68rem] text-slate-500">
              Saldo actual:{' '}
              <span className="font-semibold text-amber-600">
                {balance.toLocaleString('es-MX')} GAT
              </span>
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GATChip;
