// «Tus réplicas»: el mapa de lo que la persona ya dejó en el acto final
// (Carlos, 19 nov 2026, maqueta aprobada: «Ahora sí»). Va en la columna
// izquierda, debajo del formulario, cuando ya hay por lo menos una réplica.
//
// No repite el texto de la réplica (Carlos: «Lo que no me gusta es que se
// repita la información»): el texto vive solo en el recuadro de la derecha,
// donde se escucha con la voz de la obra. Aquí van las nueve formas, encendidas
// las que ya tienen réplica; lo que la persona hizo, dicho una vez; y un
// renglón por réplica que la lleva al recuadro.

import React from 'react';
import { Quote } from 'lucide-react';
import { CATALOG } from '@/lib/bitacoraShared';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { fechaCorta } from '@/lib/misReplicas';

const nombreDeLaForma = (portal) => CATALOG.find((f) => f.key === portal)?.form ?? null;
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
  const conRecorrido = formasConReplica.size;
  // Lo que hizo, dicho una vez (Carlos: «abajo tendría un copy donde diga lo
  // que antes decía el copy anterior, qué fue lo que hiciste. De modo que
  // siempre sea bien claro de que solo ese ha cumplido todo el recorrido»).
  const loQueHizo = conRecorrido === 0
    ? null
    : conRecorrido === 1
      ? 'Entraste con una intuición, volviste días después y la dejaste dicha.'
      : 'En estas formas entraste con una intuición, volviste días después y la dejaste dicha.';

  return (
    <div ref={ref} className="tus-replicas" data-tus-replicas tabIndex={-1}>
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
      </div>
      {loQueHizo ? <p className="tus-replicas__lo-que-hizo">{loQueHizo}</p> : null}
      <ul className="tus-replicas__lista">
        {replicas.map((replica) => {
          const forma = nombreDeLaForma(replica.portal);
          const enRecuadro = esLaMisma(enElRecuadro, replica);
          return (
            <li key={replica.id}>
              <button
                type="button"
                onClick={() => onLlevarAlRecuadro(replica)}
                className={`tus-replicas__renglon${enRecuadro ? ' tus-replicas__renglon--en-el-recuadro' : ''}`}
              >
                {replica.portal ? (
                  <img src={PORTAL_EMBLEM_URL[replica.portal]} alt="" aria-hidden="true" className="tus-replicas__mini" />
                ) : (
                  <span className="tus-replicas__mini tus-replicas__mini--frio" aria-hidden="true"><Quote size={12} /></span>
                )}
                <span className="tus-replicas__nombre">{forma ?? 'Desde el acto final'} · {fechaCorta(replica.fecha)}</span>
                <span className="tus-replicas__accion">{enRecuadro ? 'en el recuadro →' : 'escuchar →'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default TusReplicas;
