// «Tu texto»: el otro lado de la ficha del acto final (Carlos, 19 nov 2026:
// «necesito toda la ficha… No quiero que sea una tarjeta dentro de la gran
// ficha. Sino que se vea todo el protagonismo de ese otro lado»). Se abre con
// «Armar mi texto» y ocupa la ficha entera; «Volver» la regresa.
//
// Arranca con sus réplicas juntas; ella las corta, las ordena y escribe entre
// una y otra. Se guarda solo, en este navegador (con cuenta, después también
// en el servidor). Compartirlo es un gesto aparte (guardar y compartir son dos
// consentimientos, como en D-53) y pasa por la misma revisión que las réplicas.
// La casilla para que la IA de #GatoEncerrado sugiera cómo se hilan llega en
// otra fase: necesita su entrada en el registro de decisiones.

import React, { useEffect, useRef, useState } from 'react';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { CATALOG } from '@/lib/bitacoraShared';
import { leerTuTexto, guardarTuTexto, traerTuTextoDelServidor, guardarTuTextoEnElServidor } from '@/lib/misReplicas';

const TuTexto = ({ replicas, userId = null, onVolver, onCompartir, estadoCompartir = 'listo' }) => {
  const [texto, setTexto] = useState(() => leerTuTexto()?.texto ?? replicas.map((r) => r.texto).join('\n\n'));
  const campoRef = useRef(null);
  const tocado = useRef(false);
  const formas = [...new Set(replicas.map((r) => r.portal).filter(Boolean))];

  // Con cuenta, el texto vive en la cuenta: si allá hay uno más reciente que
  // el de este navegador, manda ese (19 nov 2026).
  useEffect(() => {
    if (!userId) return undefined;
    let vigente = true;
    void traerTuTextoDelServidor().then((guardado) => {
      if (!vigente || !guardado?.texto || tocado.current) return;
      const local = leerTuTexto();
      if (!local || String(guardado.updatedAt) > String(local.updatedAt)) setTexto(guardado.texto);
    });
    return () => { vigente = false; };
  }, [userId]);

  useEffect(() => {
    const fuentes = replicas.map((r) => r.perspectiveId ?? r.id);
    const t = window.setTimeout(() => {
      guardarTuTexto(texto, fuentes);
      if (userId && tocado.current) void guardarTuTextoEnElServidor(userId, texto, fuentes);
    }, 800);
    return () => window.clearTimeout(t);
  }, [texto, replicas, userId]);

  useEffect(() => {
    campoRef.current?.focus({ preventScroll: true });
  }, []);

  const compartido = estadoCompartir === 'compartido';
  return (
    <div className="tu-texto" data-tu-texto>
      <div className="tu-texto__cabecera">
        <div className="min-w-0">
          {/* Textos de Claude, por revisar con Carlos. */}
          <p className="huella-puerta__eyebrow">Tus réplicas, juntas</p>
          <h3 className="tu-texto__titulo font-display italic">Tu texto</h3>
        </div>
        <div className="tu-texto__formas">
          {formas.map((portal) => (
            <img
              key={portal}
              src={PORTAL_EMBLEM_URL[portal]}
              alt={CATALOG.find((f) => f.key === portal)?.form ?? ''}
              title={CATALOG.find((f) => f.key === portal)?.form ?? ''}
            />
          ))}
        </div>
      </div>
      <textarea
        ref={campoRef}
        value={texto}
        onChange={(e) => { tocado.current = true; setTexto(e.target.value); }}
        rows={9}
        aria-label="Tu texto"
        className="tu-texto__campo"
        disabled={compartido}
      />
      <div className="tu-texto__pie">
        <p className="tu-texto__nota">
          {/* Carlos, 19 nov 2026: guardado en la cuenta, «Nadie más lo ve» ya no
              era del todo cierto (quien administra la base podría leerlo). */}
          {compartido ? 'Compartido. Queda en revisión, como tus réplicas.' : 'Se guarda solo. No se publica hasta que lo compartas.'}
        </p>
        <div className="tu-texto__botones">
          <button
            type="button"
            className="ultima-pregunta__salida"
            onClick={() => void onCompartir(texto.trim())}
            disabled={!texto.trim() || estadoCompartir === 'enviando' || compartido}
            data-compartir-tu-texto
          >
            {estadoCompartir === 'enviando' ? 'Compartiendo…' : compartido ? 'Compartido' : 'Compartirlo'}
          </button>
          <button type="button" className="tu-texto__volver" onClick={onVolver} data-volver-de-tu-texto>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default TuTexto;
