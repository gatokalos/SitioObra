import React from 'react';

// Vista rápida y aislada para revisar /assets/laObraDorada.png tal como se
// vería reemplazando la moneda en el salvaguarda "La obra ya sabe que estás
// aquí" (GatokensRevealModal.jsx, rama isUmbral) — mismas clases/estructura
// copiadas de ahí, sin depender de todo el estado real de Hero.jsx (sesión,
// GAT, recomendación, etc.) que ese modal necesita para abrirse de verdad.
// Solo vive detrás de ?Lab=HashtagDorado (ver main.jsx) — no se monta nunca
// en el sitio normal.
const HashtagDoradoLab = () => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#04020f] px-4 backdrop-blur-[18px]">
      <div className="relative flex w-full max-w-md flex-col items-center px-5 py-10 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full blur-[72px]"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.34) 0%, rgba(217,31,139,0.12) 48%, transparent 72%)' }}
        />

        <div className="relative" aria-hidden="true">
          <img
            src="/assets/laObraDorada.png"
            alt=""
            className="h-28 w-28 sm:h-32 sm:w-32 object-contain"
            draggable="false"
          />
        </div>

        <h2 className="relative mt-9 text-3xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-4xl">
          La obra ahora sabe<br />que estás aquí.
        </h2>

        <button
          type="button"
          disabled
          className="
            group relative mt-10 inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-3 overflow-hidden rounded-full
            border border-violet-200/25 bg-white/[0.06] px-7 py-4 text-base font-semibold text-white
            shadow-[0_16px_50px_rgba(109,40,217,0.28)] backdrop-blur-md
            transition-all duration-300 disabled:cursor-default disabled:opacity-100
          "
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#1f2f63]/55 via-[#6e30ab]/55 to-[#d91f8b]/55 opacity-80"
          />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-px" focusable="false">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="relative">Esta escena es tuya</span>
        </button>

        <p className="relative mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
          Lab · laObraDorada.png · 458×444
        </p>
      </div>
    </div>
  );
};

export default HashtagDoradoLab;
