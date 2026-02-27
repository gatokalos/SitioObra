import React, { useEffect, useMemo, useState } from 'react';

const ObraQuestionList = ({
  starters = [],
  spentSet = new Set(),
  questionProgressMap = null,
  questionProgressTotal = 0,
  pageSize = 8,
  elevatedStarter = null,
  elevatedCopy = 'Pruébala con otra emoción',
  onSelect,
  variant = 'marquee',
  className = '',
  tone = null,
  eyebrowChip = '',
  cornerIcon: CornerIcon = null,
  cornerIconLabel = 'Perfil activo',
}) => {
  if (!starters.length) return null;
  const headingStyle = tone?.headingColor || tone?.dotColor ? { color: tone?.headingColor || tone?.dotColor } : undefined;
  const itemStyle = tone?.itemBorderColor ? { borderColor: tone.itemBorderColor } : undefined;
  const bulletStyle = tone?.dotColor ? { color: tone.dotColor } : undefined;
  const eyebrowStyle = tone?.dotColor ? { color: tone.dotColor } : undefined;
  const iconBorderStyle = tone?.borderColor ? { borderColor: tone.borderColor } : undefined;
  const iconColorStyle = tone?.dotColor ? { color: tone.dotColor } : undefined;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 6;
  const normalizeStarterKey = (value) => (typeof value === 'string' ? value.trim() : '');
  const elevatedStarterKey = normalizeStarterKey(elevatedStarter);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(starters.length / safePageSize));
  const visibleStarters = useMemo(() => {
    if (variant !== 'stack') return starters;
    const start = (currentPage - 1) * safePageSize;
    return starters.slice(start, start + safePageSize);
  }, [currentPage, safePageSize, starters, variant]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const resolveProgressLabel = (starter) => {
    if (!questionProgressMap || !Number.isFinite(questionProgressTotal) || questionProgressTotal <= 0) {
      return null;
    }
    const raw = Number(questionProgressMap[starter]);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const count = Math.max(0, Math.min(Math.trunc(raw), Math.trunc(questionProgressTotal)));
    if (count <= 0) return null;
    return `${count}/${Math.trunc(questionProgressTotal)} emociones`;
  };

  if (variant === 'stack') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-200" style={headingStyle}>
              Detonadores escénicos
            </p>
            {eyebrowChip ? (
              <p className="text-xs text-slate-300/75 font-medium" style={eyebrowStyle}>
                {eyebrowChip}
              </p>
            ) : null}
          </div>
          {CornerIcon ? (
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
              style={iconBorderStyle}
              aria-label={cornerIconLabel}
              title={cornerIconLabel}
            >
              <CornerIcon size={16} style={iconColorStyle} />
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-200/80 leading-relaxed">Toma una frase y luego habítala desde una emoción.</p>
        {totalPages > 1 ? (
          <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Página anterior"
            >
              <span className="sm:hidden">←</span>
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300/85">
              <span className="sm:hidden normal-case tracking-[0.12em]">Pág. {currentPage}/{totalPages}</span>
              <span className="hidden sm:inline">Página {currentPage} de {totalPages}</span>
            </p>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Página siguiente"
            >
              <span className="sm:hidden">→</span>
              <span className="hidden sm:inline">Siguiente</span>
            </button>
          </div>
        ) : null}
        <div className="space-y-2">
          {visibleStarters.map((starter, idx) => {
            const starterKey = normalizeStarterKey(starter);
            const progressLabel = resolveProgressLabel(starter);
            const isSpent = spentSet.has(starter);
            const isElevated = Boolean(elevatedStarterKey) && starterKey === elevatedStarterKey;
            return (
              <div
                key={`stack-starter-${starter}-${idx}`}
                className={`w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left text-sm text-purple-50/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isElevated
                    ? 'border-amber-200/55 bg-gradient-to-br from-amber-300/12 via-fuchsia-400/10 to-violet-400/12 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_28px_rgba(196,181,253,0.24)]'
                    : ''
                }`}
                style={itemStyle}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(starter)}
                  disabled={isSpent}
                  className="w-full text-left"
                >
                  <span className="flex items-start gap-2">
                    <span className="text-purple-200 font-semibold" style={bulletStyle}>
                      •
                    </span>
                    <span className="min-w-0 flex-1 leading-relaxed">
                      <span className="inline-flex max-w-full flex-wrap items-center gap-2 align-top">
                        <span>{starter}</span>
                        {isElevated ? (
                          <span className="rounded-full border border-amber-200/65 bg-gradient-to-r from-amber-300/25 via-fuchsia-300/25 to-violet-300/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.32)] animate-pulse">
                            {elevatedCopy}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </span>
                </button>
                {!isElevated || isSpent ? (
                  <div className="mt-2 pl-6 flex flex-wrap items-center gap-2">
                    {!isElevated && progressLabel ? (
                      <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400/85">
                        {progressLabel}
                      </span>
                    ) : null}
                    {isSpent ? (
                      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        Gastada
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const marqueeStarters = [...starters, ...starters];
  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-200" style={headingStyle}>
            ¿No sabes qué decir?
          </p>
          {eyebrowChip ? (
            <p className="text-xs text-slate-300/75 font-medium" style={eyebrowStyle}>
              {eyebrowChip}
            </p>
          ) : null}
        </div>
        {CornerIcon ? (
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
            style={iconBorderStyle}
            aria-label={cornerIconLabel}
            title={cornerIconLabel}
          >
            <CornerIcon size={16} style={iconColorStyle} />
          </span>
        ) : null}
      </div>
      <p className="text-sm text-slate-200/80 leading-relaxed">Toma una frase y habítala desde una emoción.</p>
      <div className="starter-marquee">
        <ul className="starter-marquee__list text-sm text-purple-50/90">
          {marqueeStarters.map((starter, idx) => {
            const starterKey = normalizeStarterKey(starter);
            const progressLabel = resolveProgressLabel(starter);
            const isSpent = spentSet.has(starter);
            const isElevated = Boolean(elevatedStarterKey) && starterKey === elevatedStarterKey;
            return (
              <li
                key={`marquee-starter-${starter}-${idx}`}
                className={`rounded-2xl border border-white/10 bg-black/15 ${
                  isElevated
                    ? 'border-amber-200/55 bg-gradient-to-br from-amber-300/12 via-fuchsia-400/10 to-violet-400/12 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_28px_rgba(196,181,253,0.24)]'
                    : ''
                }`}
                style={itemStyle}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(starter)}
                  className="flex w-full items-start gap-2 px-4 py-2 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSpent}
                >
                  <span className="text-purple-200 font-semibold" style={bulletStyle}>•</span>
                  <span className="min-w-0 flex-1 leading-relaxed">
                    <span className="inline-flex max-w-full flex-wrap items-center gap-2 align-top">
                      <span>{starter}</span>
                      {isElevated ? (
                        <span className="rounded-full border border-amber-200/65 bg-gradient-to-r from-amber-300/25 via-fuchsia-300/25 to-violet-300/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.32)] animate-pulse">
                          {elevatedCopy}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
                {!isElevated || isSpent ? (
                  <div className="px-4 pb-2 pl-10 flex flex-wrap items-center gap-2">
                    {!isElevated && progressLabel ? (
                      <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400/85">
                        {progressLabel}
                      </span>
                    ) : null}
                    {isSpent ? (
                      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        Gastada
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ObraQuestionList;
