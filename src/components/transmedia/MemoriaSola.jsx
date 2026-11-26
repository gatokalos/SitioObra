import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ResonanceModal from '@/components/portal/ResonanceModal';

// La Memoria por sí sola (Carlos, 24 nov 2026). «Hilar mi memoria», en el
// bloque de bambalinas de la tarjeta, abre la Memoria con la constelación en
// su propia capa, sin pasar por la ficha.
//
// Desde el 26 nov 2026 es el cuaderno en el vestíbulo sideral (maqueta
// «Cuaderno en el vestíbulo sideral», aprobada por Carlos): el proscenio se
// aleja y se desenfoca, queda el manto estelar a pantalla completa y el
// cuaderno vive dentro del perímetro de la ficha, sin marco: las esferas, el
// bloque morado al centro y la línea de la forma abajo. La flecha de regreso
// cierra el cuaderno y baja al proscenio, donde solo queda su tarjeta.

// El manto: puntos fijos (la misma figura en cada visita) que titilan.
const ESTRELLAS = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  left: ((i * 61 + 17) % 997) / 9.97,
  top: ((i * 89 + 31) % 991) / 9.91,
  size: i % 7 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  opacity: 0.25 + ((i * 13) % 7) * 0.1,
  delay: ((i * 37) % 50) / 10,
  duration: 3 + ((i * 17) % 40) / 10,
}));

function MantoEstelar() {
  const estrellas = useMemo(() => ESTRELLAS, []);
  return (
    <div aria-hidden="true" className="vestibulo-sideral__manto">
      {estrellas.map((s) => (
        <span
          key={s.id}
          className="vestibulo-sideral__estrella"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            '--star-opacity': s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Al abrir el miniverso (escritorio): el contenido se apaga, el perímetro se
// dibuja con el trazo del título, la esfera elegida viaja al emblema de la
// ficha (que ya se abrió debajo, en su lugar) y el vestíbulo se desvanece.
const CURVA_DEL_VIAJE = [0.65, 0, 0.25, 1];

export default function MemoriaSola({
  portal,
  question,
  isMobileViewport,
  onCerrar,
  onAbrirMiniverso,
  onTransicionHecha,
  onRequireLogin,
}) {
  const capaRef = useRef(null);
  const [viaje, setViaje] = useState(null);
  const [retirandose, setRetirandose] = useState(false);
  const relojes = useRef([]);
  useEffect(() => () => relojes.current.forEach((t) => window.clearTimeout(t)), []);
  const abrirMiniverso = (showcaseId = null) => {
    if (viaje) return;
    const esfera = capaRef.current?.querySelector('[data-cuaderno-en-el-vestibulo] button[aria-current="true"]');
    const caja = esfera?.getBoundingClientRect();
    const src = esfera?.querySelector('img')?.getAttribute('src') ?? null;
    if (!onAbrirMiniverso?.(showcaseId)) return;
    setViaje({ src, desde: caja ? { left: caja.left, top: caja.top, width: caja.width } : null, hasta: null });
    let intentos = 0;
    const buscar = () => {
      const destino = document.querySelector('[data-emblema-de-la-ficha]');
      const r = destino?.getBoundingClientRect();
      if (r && r.width > 0) {
        setViaje((v) => (v ? { ...v, hasta: { left: r.left, top: r.top, width: r.width } } : v));
        return;
      }
      intentos += 1;
      if (intentos < 60) window.requestAnimationFrame(buscar);
    };
    relojes.current.push(window.setTimeout(() => window.requestAnimationFrame(buscar), 350));
    relojes.current.push(window.setTimeout(() => setRetirandose(true), 1900));
    relojes.current.push(window.setTimeout(() => onTransicionHecha?.(), 2500));
  };
  // El proscenio se aleja hacia el centro de lo que se está viendo.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const raiz = document.documentElement;
    raiz.style.setProperty('--vestibulo-origen-y', `${window.scrollY + window.innerHeight / 2}px`);
    raiz.setAttribute('data-vestibulo', '');
    return () => raiz.removeAttribute('data-vestibulo');
  }, []);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <motion.div
      ref={capaRef}
      className={`vestibulo-sideral fixed inset-0 z-[150]${viaje ? ' vestibulo-sideral--abriendo' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: retirandose ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: retirandose ? 0.55 : 0.9, ease: 'easeOut' }}
      style={{ pointerEvents: retirandose ? 'none' : undefined }}
      data-memoria-sola
      data-vestibulo-sideral
    >
      <MantoEstelar />
      <div className="vestibulo-sideral__perimetro">
        <motion.div
          className="vestibulo-sideral__contenido h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <ResonanceModal
            open
            portal={portal}
            question={question}
            startInHolografico
            enElVestibulo
            isMobileViewport={isMobileViewport}
            onClose={onCerrar}
            onExplorarMiniverso={() => abrirMiniverso(null)}
            onNavigateToRecommendation={(showcaseId) => abrirMiniverso(showcaseId)}
            onBeforeNavigate={onCerrar}
            onRequireLogin={onRequireLogin}
          />
        </motion.div>
        <motion.button
          type="button"
          onClick={onCerrar}
          className="vestibulo-sideral__volver"
          aria-label="Volver"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </motion.button>
        {viaje ? (
          <svg className="vestibulo-sideral__marco" aria-hidden="true">
            <rect x="0" y="0" width="100%" height="100%" rx="28" ry="28" pathLength="1" />
          </svg>
        ) : null}
      </div>
      {viaje?.desde && viaje.src ? (
        <motion.span
          aria-hidden="true"
          className="vestibulo-sideral__viajera"
          initial={viaje.desde}
          animate={viaje.hasta ?? viaje.desde}
          transition={{ duration: 0.95, ease: CURVA_DEL_VIAJE }}
          style={{ height: 'auto' }}
        >
          <img src={viaje.src} alt="" />
        </motion.span>
      ) : null}
    </motion.div>,
    document.body,
  );
}
