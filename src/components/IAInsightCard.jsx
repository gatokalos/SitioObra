import React, { useState } from 'react';
import { ChevronDown, Cpu, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

const IAInsightCard = ({
  title = 'Lleva la experiencia completa a gatoencerrado.ai',
  type,
  interaction,
  tokensRange,
  coverage,
  footnote,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(!compact);
  const hasBody = type || interaction || tokensRange || coverage;

  if (!hasBody && !footnote) {
    return null;
  }

  return (
    <div className="rounded-xl border border-purple-700/30 bg-purple-950/25 p-5 text-sm text-purple-100 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-200" />
          <h4 className="text-base font-semibold text-purple-200">{title}</h4>
        </div>
        <ChevronDown
          size={18}
          className={`text-purple-200 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-2 text-purple-100/90">
          {type ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Cpu size={16} className="mt-0.5 text-purple-200" />
              <p>
                <strong>Tipo de IA:</strong> {type}
              </p>
            </div>
          ) : null}
          {interaction ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <MessageCircle size={16} className="mt-0.5 text-purple-200" />
              <p>
                <strong>Interacción esperada:</strong> {interaction}
              </p>
            </div>
          ) : null}
          {tokensRange ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Sparkles size={16} className="mt-0.5 text-amber-200" />
              <p>
                <strong>Tokens estimados:</strong> {tokensRange}
              </p>
            </div>
          ) : null}
          {coverage ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <ShieldCheck size={16} className="mt-0.5 text-emerald-200" />
              <p>
                <strong>Costos cubiertos:</strong> {coverage}
              </p>
            </div>
          ) : null}

          {footnote ? <p className="pt-1 text-purple-300/85 italic">{footnote}</p> : null}
        </div>
      ) : null}
    </div>
  );
};

export default IAInsightCard;
