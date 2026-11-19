// «Tus réplicas»: las nueve formas, encendidas las que ya tienen réplica.
// Primera versión (Carlos, 19 nov 2026, maqueta aprobada: «Ahora sí») en la
// columna izquierda, debajo del formulario, con lo que hizo y un renglón por
// réplica.
//
// Segunda versión, el mismo 19 nov (Carlos: «Me sacó de onda que la pregunta
// ya no se rotara. Pero podría solucionarse si subimos al renglón de arriba
// todas las esferas… En lugar de cambiar la pregunta para cada forma,
// simplemente se cambia el recuadro. Y abajo limpiamos, lo dejamos otra vez
// como estaba, oscuro, porque se me hizo que saturaba»): solo las esferas,
// encima de la pregunta. Tocar una encendida lleva su réplica al recuadro de
// la derecha. La pregunta vuelve a rotar. Sin renglones ni la frase de lo que
// hizo. Las réplicas escritas en frío, sin forma, tienen una esfera aparte, con
// comillas, al final (decisión de Claude, por revisar con Carlos).

import React from 'react';
import { Quote } from 'lucide-react';
import { CATALOG } from '@/lib/bitacoraShared';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';

// La misma réplica puede llegar del navegador y del servidor con ids distintos.
const normal = (t) => String(t || '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const esLaMisma = (a, b) => Boolean(a && b) && (
  a.id === b.id
  || (a.perspectiveId && b.perspectiveId && String(a.perspectiveId) === String(b.perspectiveId))
  || normal(a.texto) === normal(b.texto)
);

const TusReplicas = React.forwardRef(function TusReplicas({ replicas, enElRecuadro, onLlevarAlRecuadro }, ref) {
  if (!replicas.length) return null;
  const formasConReplica = new Set(replicas.map((r) => r.portal).filter(Boolean));
  const enFrio = [...replicas].reverse().find((r) => !r.portal) ?? null;

  return (
    <div ref={ref} className="tus-replicas tus-replicas--arriba" data-tus-replicas tabIndex={-1}>
      <p className="huella-puerta__eyebrow">Tus réplicas</p>
      <div className="tus-replicas__formas" role="list">
        {CATALOG.map((forma) => {
          const encendida = formasConReplica.has(forma.key);
          const suya = encendida ? [...replicas].reverse().find((r) => r.portal === forma.key) : null;
          return (
            <button
              key={forma.key}
              type="button"
              role="listitem"
              disabled={!encendida}
              onClick={encendida ? () => onLlevarAlRecuadro(suya) : undefined}
              title={forma.form}
              aria-label={encendida ? `Escuchar tu réplica de ${forma.form}` : `${forma.form}: todavía sin réplica`}
              className={`tus-replicas__esfera${encendida ? ' tus-replicas__esfera--encendida' : ''}${suya && esLaMisma(enElRecuadro, suya) ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
            >
              <img src={PORTAL_EMBLEM_URL[forma.key]} alt="" aria-hidden="true" />
            </button>
          );
        })}
        {enFrio ? (
          <button
            type="button"
            role="listitem"
            onClick={() => onLlevarAlRecuadro(enFrio)}
            title="Desde el acto final"
            aria-label="Escuchar tu réplica escrita desde el acto final"
            className={`tus-replicas__esfera tus-replicas__esfera--encendida tus-replicas__esfera--frio${esLaMisma(enElRecuadro, enFrio) ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
          >
            <Quote size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

export default TusReplicas;
