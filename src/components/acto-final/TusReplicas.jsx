// «Tus réplicas»: las nueve formas, encendidas las que ya tienen réplica.
// Primera versión (Carlos, 19 nov 2026, maqueta aprobada: «Ahora sí») en la
// columna izquierda, debajo del formulario, con lo que hizo y un renglón por
// réplica.
//
// Segunda versión, el mismo 19 nov (Carlos: «Me sacó de onda que la pregunta
// ya no se rotara… En lugar de cambiar la pregunta para cada forma,
// simplemente se cambia el recuadro. Y abajo limpiamos»): solo las esferas.
// Tocar una encendida lleva su réplica al recuadro de la derecha.
//
// Tercera, esa misma tarde (Carlos: «en los móviles, no nos va a servir que
// esté tan lejos las esferas. Hay que ponerlas… arriba de la pleca y abajo del
// mensaje de si te movió algo. Y en móvil y en escritorio hay que ponerlas
// abajo del título»): About.jsx las pone debajo de la pregunta en escritorio y
// al pie de la columna en teléfono. La esfera de comillas ya no es la réplica
// escrita en frío: abre las de los demás, y el recuadro dice solo «Réplicas
// de la comunidad», sin «tu réplica» ni de dónde viene.
// Solo con cuenta: sin ella se interpreta una sola forma.

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

const TusReplicas = React.forwardRef(function TusReplicas(
  { replicas, enElRecuadro, onLlevarAlRecuadro, enComunidad = false, onComunidad },
  ref,
) {
  if (!replicas.length) return null;
  const formasConReplica = new Set(replicas.map((r) => r.portal).filter(Boolean));

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
              className={`tus-replicas__esfera${encendida ? ' tus-replicas__esfera--encendida' : ''}${!enComunidad && suya && esLaMisma(enElRecuadro, suya) ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
            >
              <img src={PORTAL_EMBLEM_URL[forma.key]} alt="" aria-hidden="true" />
            </button>
          );
        })}
        <button
          type="button"
          role="listitem"
          onClick={onComunidad}
          title="Réplicas de la comunidad"
          aria-label="Escuchar réplicas de la comunidad"
          aria-pressed={enComunidad}
          className={`tus-replicas__esfera tus-replicas__esfera--encendida tus-replicas__esfera--frio${enComunidad ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
          data-replicas-de-la-comunidad
        >
          <Quote size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

export default TusReplicas;
