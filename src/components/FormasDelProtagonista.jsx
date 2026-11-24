import React from 'react';
import { CATALOG } from '@/lib/bitacoraShared';
import { sellos, artefactosACuestas } from '@/lib/gatPasaporte';
import { formats } from '@/components/transmedia/transmediaConstants';

// Los íconos de las formas en la tarjeta «Protagonista» (Carlos, 24 nov 2026):
// las que la persona terminó (los sellos del pasaporte), llenas y con brillo,
// y la que lleva a medias, punteada. Los íconos son los de las vitrinas del
// segundo acto y el color, el de cada forma en el catálogo. El pasaporte vive
// en este dispositivo (localStorage): en otro teléfono la tarjeta sale sin
// íconos hasta que el recorrido se guarde en la cuenta.
const COLOR_DE_LA_FORMA = {
  'text-purple-300': '#d8b4fe',
  'text-emerald-300': '#6ee7b7',
  'text-amber-300': '#fcd34d',
  'text-fuchsia-300': '#f0abfc',
  'text-rose-300': '#fda4af',
  'text-sky-300': '#7dd3fc',
  'text-cyan-300': '#67e8f9',
  'text-yellow-300': '#fde047',
  'text-indigo-300': '#a5b4fc',
};

const leerFormas = () => {
  let terminadas = [];
  let aMedias = [];
  try {
    terminadas = sellos();
    aMedias = artefactosACuestas();
  } catch {
    return [];
  }
  return CATALOG.flatMap((forma) => {
    const estado = terminadas.includes(forma.key)
      ? 'terminada'
      : aMedias.includes(forma.key)
        ? 'a-medias'
        : null;
    if (!estado) return [];
    const Icono = formats.find((f) => f.id === forma.showcase)?.icon;
    if (!Icono) return [];
    return [{ key: forma.key, nombre: forma.form, color: COLOR_DE_LA_FORMA[forma.color] ?? '#e2e8f0', Icono, estado }];
  });
};

const FormasDelProtagonista = ({ variante = 'telefono', className = '' }) => {
  const formas = leerFormas();
  if (formas.length === 0) return null;
  const tam = variante === 'barra' ? 15 : 18;
  const caja = tam + 10;
  const enRejilla = variante === 'telefono';
  return (
    <div
      className={`${enRejilla ? 'grid gap-1.5' : 'flex max-w-[15rem] flex-wrap gap-1.5'} ${className}`}
      style={enRejilla ? { gridTemplateColumns: `repeat(${formas.length > 4 ? 3 : 2}, ${caja}px)` } : undefined}
      aria-label="Tus formas"
    >
      {formas.map(({ key, nombre, color, Icono, estado }) => (
        <span
          key={key}
          title={estado === 'terminada' ? nombre : `${nombre} (en curso)`}
          aria-label={estado === 'terminada' ? `${nombre}: terminada` : `${nombre}: en curso`}
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: caja,
            height: caja,
            ...(estado === 'terminada'
              ? { background: 'rgba(6, 20, 28, 0.45)', border: `1px solid ${color}55` }
              : { border: `1px dashed ${color}88`, opacity: 0.75 }),
          }}
        >
          <Icono
            size={tam}
            strokeWidth={1.8}
            color={color}
            aria-hidden="true"
            style={estado === 'terminada' ? { filter: `drop-shadow(0 0 4px ${color}88)` } : undefined}
          />
        </span>
      ))}
    </div>
  );
};

export default FormasDelProtagonista;
