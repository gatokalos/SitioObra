import React from 'react';
import { Heart } from 'lucide-react';

const PulseReactionCard = ({
  title,
  description,
  buttonLabel,
  status = 'idle',
  onReact,
  className = '',
}) => {
  const label = status === 'loading'
    ? 'Enviando...'
    : buttonLabel || title || '¡Déjanos un pulso!';
  const isSuccess = status === 'success';
  const questionBreakIndex = label?.indexOf('?') ?? -1;
  const labelLines =
    questionBreakIndex > 0 && /d[eé]janos/i.test(label)
      ? [label.slice(0, questionBreakIndex + 1).trim(), label.slice(questionBreakIndex + 1).trim()]
      : null;

  return (
    <div
      className={`mt-4 rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_88%_50%,rgba(124,58,237,0.18),transparent_32%),linear-gradient(135deg,rgba(0,0,0,0.42),rgba(12,8,20,0.38)_52%,rgba(88,10,56,0.24))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-6 ${className}`}
    >
      <div className="space-y-5">
        {label ? (
          <p className="max-w-full text-[0.68rem] uppercase leading-[1.45] tracking-[0.24em] text-purple-200/90 [text-shadow:0_0_14px_rgba(216,180,254,0.38)]">
            {labelLines ? (
              <>
                {labelLines[0]}
                <br />
                {labelLines[1]}
              </>
            ) : (
              label
            )}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-5">
          {description ? (
            <p className="min-w-0 flex-1 text-[0.95rem] font-semibold leading-relaxed text-slate-100/90 sm:text-base">
              {description}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onReact}
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition sm:h-16 sm:w-16 ${
              isSuccess
                ? 'border border-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 text-white shadow-[0_0_25px_rgba(244,114,182,0.6)]'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_14px_34px_rgba(88,28,135,0.42)] hover:from-purple-500 hover:to-indigo-500'
            }`}
            disabled={status === 'loading'}
            aria-label={isSuccess ? 'Pulso registrado' : label}
          >
            <Heart size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PulseReactionCard;
