// El chevron triple que dice «la sección sigue abajo»: el mismo que va encima
// de la tarjeta recomendada en la galería (Transmedia). Carlos, 19 nov 2026,
// para la ficha en teléfono: «pongas el chevron que hemos estado usando cuando
// la sección continúa. Para que el usuario no se vaya con la finta».
import React, { useId } from 'react';
import { motion } from 'framer-motion';

const ChevronQueSigue = ({ className = '' }) => {
  const id = `chevron-que-sigue-${useId().replace(/:/g, '')}`;
  return (
    <div className={`flex justify-center py-1 ${className}`} data-chevron-que-sigue aria-hidden="true">
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: [0, 3, 0], opacity: [0.72, 0.3, 0.72] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
        className="h-10 w-10"
        style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3)) drop-shadow(0 0 10px rgba(189,189,189,0.26))' }}
      >
        <defs>
          <linearGradient id={id} x1="3" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2d2d2d" />
            <stop offset="0.55" stopColor="#bdbdbd" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <path d="M7 9.5L17 15.5L27 9.5" stroke={`url(#${id})`} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.58" />
        <path d="M7 16L17 22L27 16" stroke={`url(#${id})`} strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.74" />
        <path d="M7 22.5L17 28.5L27 22.5" stroke={`url(#${id})`} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.66" />
      </motion.svg>
    </div>
  );
};

export default ChevronQueSigue;
