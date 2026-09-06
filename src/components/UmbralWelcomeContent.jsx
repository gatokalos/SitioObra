import React from 'react';
import UmbralGoldenReveal from '@/components/UmbralGoldenReveal';

const UmbralWelcomeContent = ({ onContinue, titleFirst = false }) => (
  <>
    {!titleFirst && <UmbralGoldenReveal />}
    <h2
      id="gatokens-modal-title"
      className={`font-display relative ${titleFirst ? '' : 'mt-9'} text-2xl font-medium leading-tight tracking-[-0.02em] text-slate-100 sm:text-3xl`}
    >
      Ahora tienes la energía para continuar
    </h2>
    {titleFirst && (
      <div className="relative mt-9 flex shrink-0 items-center justify-center">
        <UmbralGoldenReveal centeredHalo />
      </div>
    )}
    <button
      type="button"
      onClick={onContinue}
      className="relative mt-10 inline-flex min-h-11 items-center justify-center rounded-full border border-violet-200/25 bg-white/5 px-8 py-3 text-sm font-medium text-slate-100 transition hover:border-violet-200/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      Vayamos por el segundo acto
    </button>
  </>
);

export default UmbralWelcomeContent;
