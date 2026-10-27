// El bloque de la forma recorrida en la Memoria (Carlos, 27 oct 2026): su
// categoría y su nombre, su verso en tres renglones, y la fila «Lo que falta ·
// Contestarle a la obra». Al abrirla, el paso previo elige la palabra de la
// obra con la que se va a decir («Falta una palabra para decirlo. / Por lo que
// dijiste, quizá sea …, / o ….») y «Escuchar al gato» lleva a la cabina, donde
// el gato cuenta en tres momentos lo que dejó, lo que volvió y adónde va. Nada
// se escoge allá. Lo que quedó se lee después de las preguntas del regreso
// (D-34), y lo dice el gato.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PALABRAS_DE_LA_OBRA } from '@/lib/provocaDraft';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const CONFIRMA_RETIRO_REPLICA = 'Se retira tu réplica del acto final. Lo que escribiste en tu recorrido se queda. No se puede deshacer.';
const CONFIRMA_RETIRO_TODO = 'Se borra todo lo que escribiste en tu recorrido, aquí y en la investigación. No se puede deshacer.';

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

const LoQueQuedo = ({ portal, entry, chip = null, verso = null, late = false, onUltimaPregunta, onGoToSite, onAbiertoChange }) => {
  const { isDevAuth } = useAuth();
  const anonId = useMemo(() => ensureAnonId(), []);
  const [sessions, setSessions] = useState(null);
  const [replicas, setReplicas] = useState([]);
  const [retirando, setRetirando] = useState(false);
  // la fila cerrada → el paso previo abierto
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [propuesta, setPropuesta] = useState(null); // { terminos, respuestas, borradorId }
  const [termino, setTermino] = useState(null);
  const [otras, setOtras] = useState(false);

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
  // (POST /api/huella/ultima-pregunta). Si falla, las siete palabras y nada más.
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
      if (terminos.length === 0) setOtras(true);
    } catch {
      setPropuesta({ terminos: [], respuestas: {}, borradorId: null });
      setOtras(true);
    } finally {
      setCargando(false);
    }
  };

  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    onAbiertoChange?.(siguiente);
    if (siguiente) void cargarPropuesta();
  };

  const escucharAlGato = () => {
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

  // Retirar saca el recorrido de todas las tablas y revoca el seguimiento
  // (D-38). Lo guardado en este navegador se va con él.
  const retirarTodo = async () => {
    if (typeof window !== 'undefined' && !window.confirm(CONFIRMA_RETIRO_TODO)) return;
    setRetirando(true);
    try {
      if (!isDevAuth) {
        const res = await fetch(`${OBRA_API_URL}/api/huella`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anon_id: anonId }),
        });
        if (!res.ok) throw new Error();
      }
      try {
        const claves = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('gatoencerrado:resonance:') || k === 'gatoencerrado:provoca-draft')) claves.push(k);
        }
        claves.forEach((k) => localStorage.removeItem(k));
      } catch {}
      window.location.assign('/');
    } catch {
      setRetirando(false);
    }
  };

  const cargandoSesion = sessions === null;
  const terminosPropuestos = propuesta?.terminos ?? [];
  const terminosVisibles = otras || terminosPropuestos.length === 0 ? PALABRAS_DE_LA_OBRA : terminosPropuestos;

  // «Falta una palabra para decirlo. / Por lo que dijiste, quizá sea …, / o ….»
  // Sigue el verso de arriba (Carlos, 27 oct: opción B).
  const lineasDelPaso = cargando
    ? ['Falta una palabra para decirlo.', 'El gato está leyendo lo que dejaste…']
    : terminosPropuestos.length === 2
      ? ['Falta una palabra para decirlo.', `Por lo que dijiste, quizá sea ${terminosPropuestos[0]},`, `o ${terminosPropuestos[1]}.`]
      : terminosPropuestos.length === 1
        ? ['Falta una palabra para decirlo.', `Por lo que dijiste, quizá sea ${terminosPropuestos[0]}.`]
        : ['Falta una palabra para decirlo.', 'Elige con cuál.'];

  return (
    <section className={`bloque-forma${abierto ? ' bloque-forma--abierto' : ''}`}>
      <div className="bloque-forma__cabecera">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry?.eyebrow}</p>
          <h2 className={`font-display text-2xl leading-snug mt-1 ${entry?.color ?? ''}`}>{entry?.form ?? entry?.name}</h2>
        </div>
        {chip}
      </div>
      {verso}

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
              <p className="memoria-descripcion text-sm leading-relaxed text-slate-300/80">
                {lineasDelPaso.map((linea) => <span key={linea} className="block">{linea}</span>)}
              </p>
              {!cargando ? (
                <>
                  <div className="ultima-pregunta__palabras" role="group" aria-label="Las palabras de la obra">
                    {terminosVisibles.map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={termino === p}
                        data-quiza={terminosPropuestos.includes(p) ? 1 : 0}
                        onClick={() => setTermino(p)}
                        className="palabra-de-la-obra"
                      >
                        {p}
                      </button>
                    ))}
                    {!otras && terminosPropuestos.length > 0 ? (
                      <button type="button" onClick={() => setOtras(true)} className="palabra-de-la-obra palabra-de-la-obra--otra">
                        otra palabra…
                      </button>
                    ) : null}
                  </div>
                  <button type="button" onClick={escucharAlGato} disabled={!termino} className="ultima-pregunta__salida">
                    Escuchar al gato
                  </button>
                </>
              ) : null}
              {sesion ? (
                <div className="flex justify-end">
                  <button type="button" disabled={retirando} onClick={() => void retirarTodo()} className="lo-que-quedo__enlace">
                    {retirando ? 'Retirando…' : 'Retirar lo que escribí'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default LoQueQuedo;
