import React from 'react';
import { motion } from 'framer-motion';

// Vista rápida y aislada para revisar /assets/gato_enbolsa.png tal como se
// vería reemplazando la moneda en el salvaguarda "La obra ya sabe que estás
// aquí" (GatokensRevealModal.jsx, rama isUmbral) — mismas clases/estructura
// copiadas de ahí, sin depender de todo el estado real de Hero.jsx (sesión,
// GAT, recomendación, etc.) que ese modal necesita para abrirse de verdad.
// Solo vive detrás de ?Lab=HashtagDorado (ver main.jsx) — no se monta nunca
// en el sitio normal.
const HashtagDoradoLab = () => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#04020f] px-4 backdrop-blur-[18px]">
      <div className="font-display relative flex w-full max-w-md flex-col items-center px-5 py-10 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2"
        >
          <span
            className="block h-full w-full rounded-full opacity-60 blur-[64px]"
            style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.68) 0%, rgba(109,40,217,0.42) 42%, rgba(76,29,149,0.18) 62%, transparent 76%)' }}
          />
        </span>

        <div className="relative h-28 w-28 sm:h-32 sm:w-32" aria-hidden="true">
          <img
            src="/assets/gato_enbolsa2.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable="false"
          />
          <motion.img
            src="/assets/gato_enbolsa.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            draggable="false"
          />
        </div>

        <h2 className="relative mt-9 text-3xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-4xl">
          La obra ahora sabe<br />que estás aquí.
        </h2>

        <p className="relative mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
          Lab · gato_enbolsa × gato_enbolsa2 · 1086×1448
        </p>
      </div>
    </div>
  );
};

export default HashtagDoradoLab;
