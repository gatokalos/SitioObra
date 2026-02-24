import React from 'react';

const ObraQuestionList = ({
  starters = [],
  spentSet = new Set(),
  onSelect,
  variant = 'marquee',
  className = '',
  tone = null,
  eyebrowChip = '',
}) => {
  if (!starters.length) return null;
  const headingStyle = tone?.headingColor || tone?.dotColor ? { color: tone?.headingColor || tone?.dotColor } : undefined;
  const itemStyle = tone?.itemBorderColor ? { borderColor: tone.itemBorderColor } : undefined;
  const bulletStyle = tone?.dotColor ? { color: tone.dotColor } : undefined;
  const eyebrowStyle = tone?.dotColor ? { color: tone.dotColor } : undefined;

  if (variant === 'stack') {
    return (
      <div className={`space-y-3 ${className}`}>
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
        <p className="text-sm text-slate-200/80 leading-relaxed">Elige una pregunta y envíala tal cual.</p>
        <div className="space-y-2">
          {starters.map((starter, idx) => (
            <button
              key={`stack-starter-${starter}-${idx}`}
              type="button"
              onClick={() => onSelect?.(starter)}
              disabled={spentSet.has(starter)}
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left text-sm text-purple-50/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              style={itemStyle}
            >
              <span className="text-purple-200 font-semibold" style={bulletStyle}>•</span>{' '}
              <span className="leading-relaxed">{starter}</span>
              {spentSet.has(starter) ? (
                <span className="ml-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Gastada
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const marqueeStarters = [...starters, ...starters];
  return (
    <div className={className}>
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
      <p className="text-sm text-slate-200/80 leading-relaxed">Elige una pregunta y envíala tal cual.</p>
      <div className="starter-marquee">
        <ul className="starter-marquee__list text-sm text-purple-50/90">
          {marqueeStarters.map((starter, idx) => (
            <li
              key={`marquee-starter-${starter}-${idx}`}
              className="rounded-2xl border border-white/10 bg-black/15"
              style={itemStyle}
            >
              <button
                type="button"
                onClick={() => onSelect?.(starter)}
                className="flex w-full items-start gap-2 px-4 py-2 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={spentSet.has(starter)}
              >
                <span className="text-purple-200 font-semibold" style={bulletStyle}>•</span>
                <span className="leading-relaxed">{starter}</span>
                {spentSet.has(starter) ? (
                  <span className="ml-auto text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    Gastada
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ObraQuestionList;
