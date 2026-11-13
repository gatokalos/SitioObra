import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hand } from 'lucide-react';

// El verso fundacional de cada forma, en su portal y en su vitrina. Voltearlo
// ya no da nada: hasta el 13 nov 2026 registraba 25 GAT, lanzaba monedas y
// dejaba una moneda girando bajo el verso, y en la vitrina además cobraba la
// «energía» de esa vitrina. Era economía vieja (desde el 22 sep el GAToken es
// una estafeta). Carlos descartó también coleccionar los nueve versos, para
// no convertir las formas en un catálogo que se completa: queda solo el verso.
// Ver docs/propuesta-coleccion-de-versos-12nov2026.md.
const MiniVersoCard = ({
  title,
  verse,
  palette,
  effect = 'reveal',
  isTragedia = false,
}) => {
  const [isActive, setIsActive] = useState(() => {
    try { return window.localStorage.getItem('gatoencerrado:miniverso-verso:' + title) === '1'; } catch { return false; }
  });
  const textClass = isTragedia ? 'text-sm' : 'text-sm leading-relaxed';

  const handleCardToggle = () => {
    if (isActive) return;
    try { window.localStorage.setItem('gatoencerrado:miniverso-verso:' + title, '1'); } catch {}
    setIsActive(true);
  };

  const baseCard = (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl border min-h-[220px] flex flex-col justify-between relative overflow-hidden cursor-pointer ${textClass}`}
      style={{
        backgroundImage: palette.gradient,
        backgroundSize: '220% 220%',
        borderColor: palette.border,
        color: palette.text,
        boxShadow: isActive
          ? '0 10px 30px rgba(0,0,0,0.55)'
          : '0 0 25px rgba(0,0,0,0.35)',
      }}
      onClick={handleCardToggle}
    >
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)] pointer-events-none" />
      <div className="relative z-10 mb-3 flex justify-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg transition"
          style={{
            color: palette.accent,
            backgroundColor: `${palette.background}cc`,
            border: `1px solid ${palette.border}`,
          }}
        >
          {title}
        </span>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <p
          className={`leading-relaxed whitespace-pre-line text-center font-light transition-all duration-500 ${
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {verse}
        </p>
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.35em] text-white/70 transition-all duration-500 ${
            isActive ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white/85 shadow-[0_0_16px_rgba(255,255,255,0.18)]">
            <Hand size={16} className="animate-pulse" />
          </span>
        </div>
      </div>
    </motion.div>
  );

  if (effect === 'flip') {
    return (
      <div className="relative [perspective:1200px]" onClick={handleCardToggle}>
        <motion.div
          animate={{ rotateY: isActive ? 180 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="relative min-h-[220px] [transform-style:preserve-3d]"
        >
          {/* Safari dejaba ver en espejo, detrás del verso, el rótulo y la
              mano de esta cara: no oculta el revés de los hijos que tienen
              capa propia. Por eso la cara se apaga cuando el giro pasa la
              mitad (0.35 s de 0.7 s). */}
          <motion.div
            initial={false}
            animate={{ opacity: isActive ? 0 : 1 }}
            transition={{ duration: 0, delay: isActive ? 0.35 : 0 }}
            className={`absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-4 ${textClass} [backface-visibility:hidden]`}
            style={{
              backgroundImage: palette.gradient,
              borderColor: palette.border,
              color: palette.text,
              inset: 0,
            }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg"
              style={{
                color: palette.accent,
                backgroundColor: `${palette.background}cc`,
                border: `1px solid ${palette.border}`,
              }}
            >
              {title}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white/85 shadow-[0_0_16px_rgba(255,255,255,0.18)]">
              <Hand size={16} className="animate-pulse" />
            </span>
          </motion.div>
          <div
            className={`absolute inset-0 rounded-2xl border px-6 py-5 [backface-visibility:hidden] flex flex-col items-center justify-center gap-3 ${textClass}`}
            style={{
              backgroundImage: palette.gradient,
              borderColor: palette.border,
              color: palette.text,
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="leading-relaxed whitespace-pre-line text-center font-light">{verse}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return baseCard;
};

export default MiniVersoCard;
