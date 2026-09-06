import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Pieza visual compartida por el salvaguarda real y su laboratorio.
const UmbralGoldenReveal = ({ centeredHalo = false }) => {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 h-72 w-72 -translate-x-1/2 ${centeredHalo ? 'top-1/2 -translate-y-1/2' : 'top-8'}`}
      >
        <span
          className="block h-full w-full rounded-full opacity-60 blur-[64px]"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.68) 0%, rgba(109,40,217,0.42) 42%, rgba(76,29,149,0.18) 62%, transparent 76%)' }}
        />
      </span>
      <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32 lg:h-44 lg:w-44 xl:h-52 xl:w-52" aria-hidden="true">
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
          initial={{ opacity: reducedMotion ? 1 : 0.2 }}
          animate={{ opacity: reducedMotion ? 1 : [0.2, 1, 0.2] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          draggable="false"
        />
      </div>
    </>
  );
};

export default UmbralGoldenReveal;
