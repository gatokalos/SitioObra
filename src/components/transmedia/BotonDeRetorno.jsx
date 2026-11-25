import { X } from 'lucide-react';

// El retorno del dorso de la tarjeta (Carlos, 24 nov 2026): en vez de la ceja
// «#Miniversos · forma» y el enlace «Volver», el mismo botón redondo con la X
// que cierra las fichas, en la esquina superior derecha. Va encima del dorso,
// fuera de lo que se desliza, para que siempre esté a la vista.
const BotonDeRetorno = ({ onClick, etiqueta = 'Volver a la tarjeta' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={etiqueta}
    title={etiqueta}
    className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-slate-200/90 backdrop-blur-sm transition hover:border-purple-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
  >
    <X size={14} />
  </button>
);

export default BotonDeRetorno;
