// El bloque de la forma recorrida en la Memoria (Carlos, 27 y 28 oct 2026): su
// nombre y la fila «Lo que falta · Contestarle a la obra». Sin categoría ni
// verso («Simplifiqué el bloque, quitando la ceja y los tres versos», 28 oct).
// Al abrirla, el gato propone la palabra de la obra dentro de la frase («Falta
// una palabra para decirlo. / Por lo que dijiste, quizá sea …, / o ….»): las
// dos palabras se tocan ahí mismo, la primera viene marcada, y un solo botón,
// «Pasar al acto final», lleva a la cabina, donde el gato cuenta en tres
// momentos lo que dejó, lo que volvió y adónde va. Nada se escoge allá. Lo que
// quedó se lee después de las preguntas del regreso (D-34), y lo dice el gato.
// «Retirar lo que escribí» vive en La Réplica (D-38), no aquí.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PALABRAS_DE_LA_OBRA } from '@/lib/provocaDraft';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const CONFIRMA_RETIRO_REPLICA = 'Se retira tu réplica del acto final. Lo que escribiste en tu recorrido se queda. No se puede deshacer.';

// En la vista previa DEV no hay registro de nadie: un ejemplo, marcado, para
// poder recorrer el beat completo.
const SESION_DE_EJEMPLO = {
  id: 'ejemplo',
  created_at: '2026-10-12T18:00:00Z',
  bitacora_completed_at: '2026-10-16T19:30:00Z',
  intuicion_answer: 'Esperaba encontrar algo que me explicara por qué me cuesta tanto quedarme en un lugar.',
  bitacora_p1_afirmativa: true,
  bitacora_p1_response: 'Sí. Una frase del párrafo se me quedó pegada varios días.',
  bitacora_p2_response: 'En el camión, de regreso del trabajo, cuando no estaba pensando en nada.',
  bitacora_p3_response: 'Que no es que no quepa en ningún lado; es que no me quedo el tiempo suficiente.',
};
const PROPUESTA_DE_EJEMPLO = {
  terminos: ['la desconexión', 'la búsqueda de sentido'],
  respuestas: {
    'la desconexión': 'Quizá lo que me provoca la desconexión es no quedarme el tiempo suficiente en ningún lado.',
    'la búsqueda de sentido': 'Quizá lo que me provoca la búsqueda de sentido es no quedarme el tiempo suficiente en ningún lado.',
  },
  borradorId: null,
};

const fechaCorta = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
};

const sesionDeLaForma = (sessions = [], portal = null) => {
  const conTexto = sessions.filter((s) => (
    (!portal || s.miniverso_id === portal) && (s.intuicion_answer || s.bitacora_completed_at)
  ));
  return conTexto[conTexto.length - 1] ?? null;
};

// Lo que viaja a La Réplica si no hay propuesta: la última respuesta dada; si
// no la hay, la intuición. `campo` permite corregir o retirar lo guardado (D-38).
const ultimaPalabra = (sesion) => {
  if (!sesion) return null;
  const campos = [
    ['bitacora_p3_response', sesion.bitacora_p3_response],
    ['bitacora_p2_response', sesion.bitacora_p2_response],
    ['bitacora_p1_response', sesion.bitacora_p1_response],
    ['intuicion_answer', sesion.intuicion_answer],
  ];
  const elegido = campos.find(([, v]) => typeof v === 'string' && v.trim());
  if (!elegido) return null;
  return { campo: elegido[0], texto: elegido[1].trim() };
};

// Los tres momentos del gato, en plantilla: nada que no haya dicho la persona.
const momentosDe = (sesion, termino) => {
  const entrada = fechaCorta(sesion.created_at);
  const regreso = fechaCorta(sesion.bitacora_completed_at);
  const respuestas = [sesion.bitacora_p1_response, sesion.bitacora_p2_response, sesion.bitacora_p3_response]
    .filter((v) => typeof v === 'string' && v.trim());
  const dijoQueNo = sesion.bitacora_p1_afirmativa === false && respuestas.length === 0;
  // Sus palabras van entre comillas; el punto final lo pone la frase del gato.
  const cita = (s) => `«${s.trim().replace(/[.\s]+$/, '')}»`;
  const antes = sesion.intuicion_answer
    ? `${entrada ? `El ${entrada} entraste` : 'Entraste'} con esto: ${cita(sesion.intuicion_answer)}.`
    : `${entrada ? `El ${entrada} entraste` : 'Entraste'} con una intuición.`;
  const despues = dijoQueNo
    ? `${regreso ? `Volviste el ${regreso}` : 'Volviste días después'} y dijiste que nada había regresado todavía.`
    : respuestas.length
      ? `${regreso ? `Volviste el ${regreso}` : 'Volviste días después'} y dijiste: ${respuestas.map(cita).join(' ')}.`
      : `${regreso ? `Volviste el ${regreso}` : 'Volviste días después'}.`;
  const sigue = termino
    ? `Lo que te quedó quizá es ${termino}. Lo que sigue es el acto final: ahí le contestas a la obra con tus palabras. Te llevo.`
    : 'Lo que sigue es el acto final: ahí le contestas a la obra con tus palabras. Te llevo.';
  return [
    { preludio: 'Lo que dejaste', texto: antes },
    { preludio: 'Lo que volvió', texto: despues },
    { preludio: 'Lo que sigue', texto: sigue },
  ];
};

const LoQueQuedo = ({ portal, entry, chip = null, late = false, onUltimaPregunta, onGoToSite }) => {
  const { isDevAuth } = useAuth();
  const anonId = useMemo(() => ensureAnonId(), []);
  const [sessions, setSessions] = useState(null);
  const [replicas, setReplicas] = useState([]);
  // la fila cerrada → el paso previo abierto
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [propuesta, setPropuesta] = useState(null); // { terminos, respuestas, borradorId }
  const [termino, setTermino] = useState(null);

  const fetchHuella = useCallback(async () => {
    if (isDevAuth) { setSessions([{ ...SESION_DE_EJEMPLO, miniverso_id: portal }]); return; }
    try {
      const response = await fetch(`${OBRA_API_URL}/api/huella?anon_id=${encodeURIComponent(anonId)}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setSessions(data.sesiones ?? []);
    } catch {
      setSessions([]);
    }
  }, [anonId, isDevAuth, portal]);

  const fetchReplicas = useCallback(async () => {
    if (isDevAuth) return;
    try {
      const response = await fetch(`${OBRA_API_URL}/api/replica?anon_id=${encodeURIComponent(anonId)}`);
      const data = await response.json();
      if (response.ok && data.ok) setReplicas(data.replicas ?? []);
    } catch {}
  }, [anonId, isDevAuth]);

  useEffect(() => { void fetchHuella(); }, [fetchHuella]);
  useEffect(() => { void fetchReplicas(); }, [fetchReplicas]);

  const sesion = useMemo(() => sesionDeLaForma(sessions ?? [], portal), [sessions, portal]);
  const palabra = useMemo(() => ultimaPalabra(sesion), [sesion]);
  const replicaPublicada = replicas.length > 0;

  // Al abrir la fila, el gato lee el recorrido y propone una o dos palabras
  // (POST /api/huella/ultima-pregunta). Si falla, la frase no propone ninguna y
  // la palabra se pone en el acto final.
  const cargarPropuesta = async () => {
    if (propuesta || cargando) return;
    if (isDevAuth) { setPropuesta(PROPUESTA_DE_EJEMPLO); setTermino(PROPUESTA_DE_EJEMPLO.terminos[0]); return; }
    setCargando(true);
    try {
      const res = await fetch(`${OBRA_API_URL}/api/huella/ultima-pregunta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anon_id: anonId, miniverso_id: portal }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
      const terminos = Array.isArray(data.terminos) ? data.terminos.filter((t) => PALABRAS_DE_LA_OBRA.includes(t)) : [];
      setPropuesta({ terminos, respuestas: data.respuestas ?? {}, borradorId: data.borrador_id ?? null });
      setTermino(terminos[0] ?? null);
    } catch {
      setPropuesta({ terminos: [], respuestas: {}, borradorId: null });
      setTermino(null);
    } finally {
      setCargando(false);
    }
  };

  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) void cargarPropuesta();
  };

  const pasarAlActoFinal = () => {
    if (!sesion || !palabra) return;
    onUltimaPregunta?.({
      anonId,
      sessionId: sesion.id,
      campo: palabra.campo,
      original: palabra.texto,
      texto: palabra.texto,
      termino,
      respuestas: propuesta?.respuestas ?? {},
      borradorId: propuesta?.borradorId ?? null,
      momentos: momentosDe(sesion, termino),
    });
  };

  const retirarReplica = async () => {
    if (typeof window !== 'undefined' && !window.confirm(CONFIRMA_RETIRO_REPLICA)) return;
    try {
      const response = await fetch(`${OBRA_API_URL}/api/replica`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, anon_id: anonId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setReplicas([]);
    } catch {
      await fetchReplicas();
    }
  };

  const cargandoSesion = sessions === null;
  const terminos = propuesta?.terminos ?? [];

  // La palabra se toca dentro de la frase: sin chips (Carlos, 28 oct 2026).
  const palabraEnFrase = (p) => (
    <button type="button" aria-pressed={termino === p} onClick={() => setTermino(p)} className="palabra-en-frase">
      {p}
    </button>
  );

  return (
    <section className={`bloque-forma${abierto ? ' bloque-forma--abierto' : ''}`}>
      <div className="bloque-forma__cabecera">
        <h2 className={`min-w-0 font-display text-2xl leading-snug ${entry?.color ?? ''}`}>{entry?.form ?? entry?.name}</h2>
        {chip}
      </div>

      {replicaPublicada ? (
        <>
          <button type="button" className="huella-puerta" onClick={() => onGoToSite?.('#provoca')}>
            <span className="huella-puerta__texto">
              <span className="huella-puerta__eyebrow">Tu réplica</span>
              <span className="huella-puerta__titulo">Ya está en el acto final</span>
            </span>
            <ArrowRight size={17} className="huella-puerta__flecha huella-puerta__flecha--avanza" aria-hidden="true" />
          </button>
          <div className="flex justify-end pb-3">
            <button type="button" onClick={() => void retirarReplica()} className="lo-que-quedo__enlace">Retirar mi réplica</button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={alternar}
            aria-expanded={abierto}
            aria-controls="memoria-paso-previo"
            disabled={cargandoSesion || !sesion}
            className={`huella-puerta${late && !abierto ? ' huella-puerta--late' : ''}`}
          >
            <span className="huella-puerta__texto">
              <span className="huella-puerta__eyebrow">Lo que falta</span>
              <span className="huella-puerta__titulo">
                {cargandoSesion ? 'Leyendo lo que dejaste…' : sesion ? 'Contestarle a la obra' : 'No encontramos lo que escribiste en este navegador'}
              </span>
            </span>
            <ChevronDown size={17} className="huella-puerta__flecha" aria-hidden="true" />
          </button>

          {abierto ? (
            <div id="memoria-paso-previo" className="bloque-forma__abierto">
              {/* «Falta una palabra para decirlo. / Por lo que dijiste, quizá sea …, / o ….»
                  (Carlos, 27 oct: opción B). Las dos palabras se tocan en la frase. */}
              <p className="memoria-descripcion text-sm leading-relaxed text-slate-300/80">
                <span className="block">Falta una palabra para decirlo.</span>
                {cargando ? (
                  <span className="block">El gato está leyendo lo que dejaste…</span>
                ) : terminos.length === 2 ? (
                  <>
                    <span className="block">Por lo que dijiste, quizá sea {palabraEnFrase(terminos[0])},</span>
                    <span className="block">o {palabraEnFrase(terminos[1])}.</span>
                  </>
                ) : terminos.length === 1 ? (
                  <span className="block">Por lo que dijiste, quizá sea {palabraEnFrase(terminos[0])}.</span>
                ) : (
                  <span className="block">La pones tú en el acto final.</span>
                )}
              </p>
              {!cargando ? (
                <button type="button" onClick={pasarAlActoFinal} disabled={!sesion || !palabra} className="ultima-pregunta__salida">
                  Pasar al acto final
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default LoQueQuedo;
