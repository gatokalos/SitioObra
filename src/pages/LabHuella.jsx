import React, { useState } from 'react';
import HuellaEmbeddedCheckout from '@/components/HuellaEmbeddedCheckout';

const LabHuella = () => {
  const [result, setResult] = useState('');
  const [labWidth, setLabWidth] = useState(360);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0a14] px-4 py-12 text-slate-100 sm:px-6">

      {/* Fondo energético */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 
        [background:
          radial-gradient(60%_40%_at_15%_10%,rgba(251,146,60,0.25),transparent_60%),
          radial-gradient(50%_35%_at_85%_15%,rgba(244,114,182,0.22),transparent_60%),
          radial-gradient(70%_50%_at_50%_100%,rgba(236,72,153,0.18),transparent_70%)
        ]"
      />

      <div className="relative mx-auto w-full max-w-xl space-y-6">

        {/* Header Lab */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(251,146,60,0.15)]">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-300/80">
            UI Lab
          </p>

          <h1 className="mt-2 text-2xl font-semibold bg-gradient-to-r from-orange-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">
            Huella Embedded Checkout
          </h1>

          <p className="mt-2 text-sm text-slate-200/85">
            Laboratorio visual seguro. Aquí iteramos diseño sin cobros reales.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[320, 360, 420].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setLabWidth(size)}
                className={`rounded-full border px-3 py-1 text-xs transition-all
                  ${
                    labWidth === size
                      ? 'border-orange-400 bg-orange-400/20 text-orange-100 shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                      : 'border-white/20 bg-white/5 text-slate-300 hover:border-rose-300/60 hover:text-rose-200'
                  }`}
              >
                {size === 320 && 'Móvil angosto'}
                {size === 360 && 'Móvil real'}
                {size === 420 && 'CTA amplio'} ({size})
              </button>
            ))}
          </div>
        </div>

        {/* Marco de prueba */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_25px_80px_rgba(236,72,153,0.18)]">
          <p className="mb-3 text-xs text-rose-200/80">
            Marco de prueba: {labWidth}px
          </p>

          <div
            className="mx-auto transition-all duration-300"
            style={{ width: `${labWidth}px`, maxWidth: '100%' }}
          >
            <div className="relative rounded-3xl border border-white/10 bg-slate-950/60 p-3 shadow-[0_0_60px_rgba(244,114,182,0.25)]">
              <HuellaEmbeddedCheckout
                previewMode
                onDone={({ ok, message }) =>
                  setResult(
                    ok
                      ? `Simulación: ${message || 'ok'}`
                      : `Error: ${message || 'unknown'}`
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-lg">
          Resultado:
          <span className="ml-2 font-semibold text-orange-200">
            {result || 'Sin interacción aún.'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default LabHuella;