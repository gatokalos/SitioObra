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
  intuicion_question: '¿Qué cambia en ti cuando una experiencia personal se convierte en relato?',
  intuicion_answer: 'Esperaba encontrar algo que me explicara por qué me cuesta tanto quedarme en un lugar.',
  bitacora_p1_afirmativa: true,
  // En el sitio la primera respuesta del regreso es el botón, no palabras suyas.
  bitacora_p1_response: 'Sí, regresó algo',
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

// Los momentos del gato, en plantilla: nada que no haya dicho la persona, y
// cada respuesta en su propio globo, precedida de lo que se le preguntó
// (Carlos, 28 oct 2026: «dos respuestas del usuario se junten en un solo
// globo… se pierde el sentido si el gato no le da contexto»). Las preguntas
// segunda y tercera del regreso las redacta el modelo y no quedan guardadas, así
// que el gato las dice en su voz, por su tema: dónde lo encontró, qué se movió.
// La primera respuesta del regreso es el botón «Sí, regresó algo» / «Todavía
// no», no palabras suyas: el gato lo cuenta, no lo cita.
const ETIQUETA_SI = /^s[ií][.,]?\s*regres[oó] algo\.?$/i;
const momentosDe = (sesion, termino, nombreForma = 'la obra') => {
  const entrada = fechaCorta(sesion.created_at);
  const regreso = fechaCorta(sesion.bitacora_completed_at);
  const limpio = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  // Sus palabras van entre comillas; el punto final lo pone la frase del gato.
  const cita = (s) => `«${s.replace(/[.\s]+$/, '')}»`;
  const momentos = [];

  // Lo que dejaste: la pregunta que contestó antes de entrar, y su respuesta.
  const pregunta = limpio(sesion.intuicion_question);
  const intuicion = limpio(sesion.intuicion_answer);
  const antesDeEntrar = entrada ? `El ${entrada}, antes de entrar,` : 'Antes de entrar,';
  momentos.push({
    preludio: 'Lo que dejaste',
    texto: intuicion
      ? pregunta
        ? `${antesDeEntrar} te pregunté: ${cita(pregunta)}. Dijiste: ${cita(intuicion)}.`
        : `${antesDeEntrar} dejaste esto: ${cita(intuicion)}.`
      : `${antesDeEntrar} dejaste una intuición.`,
  });

  // Lo que volvió: la primera pregunta del regreso y, si hubo, las otras dos.
  const volviste = regreso ? `Volviste el ${regreso}.` : 'Volviste días después.';
  const preguntaP1 = `Te pregunté si algo de ${nombreForma} había regresado por su cuenta`;
  const p1 = limpio(sesion.bitacora_p1_response);
  const p2 = limpio(sesion.bitacora_p2_response);
  const p3 = limpio(sesion.bitacora_p3_response);
  if (sesion.bitacora_p1_afirmativa === false) {
    momentos.push({ preludio: 'Lo que volvió', texto: `${volviste} ${preguntaP1}, y dijiste que todavía no.` });
  } else if (sesion.bitacora_p1_afirmativa === true || p1 || p2 || p3) {
    momentos.push({
      preludio: 'Lo que volvió',
      texto: p1 && !ETIQUETA_SI.test(p1)
        ? `${volviste} ${preguntaP1}. Dijiste: ${cita(p1)}.`
        : `${volviste} ${preguntaP1}, y dijiste que sí.`,
    });
    if (p2) momentos.push({ preludio: 'Dónde te encontró', texto: `Te pregunté dónde te había encontrado. Dijiste: ${cita(p2)}.` });
    if (p3) momentos.push({ preludio: 'Lo que se movió', texto: `Te pregunté si ahora veías algo de otra manera. Dijiste: ${cita(p3)}.` });
  } else {
    momentos.push({ preludio: 'Lo que volvió', texto: volviste });
  }

  // Lo que sigue: la palabra, si la hay, y el acto final.
  momentos.push({
    preludio: 'Lo que sigue',
    texto: termino
      ? `Lo que te quedó quizá es ${termino}. Lo que sigue es el acto final: ahí le contestas a la obra con tus palabras. Te llevo.`
      : 'Lo que sigue es el acto final: ahí le contestas a la obra con tus palabras. Te llevo.',
  });
  return momentos;
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
      momentos: momentosDe(sesion, termino, entry?.form ?? entry?.name ?? 'la obra'),
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
