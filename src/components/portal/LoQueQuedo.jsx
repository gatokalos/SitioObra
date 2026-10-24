// El acordeón de la Memoria (Carlos, 23 oct 2026): la visita ve los satélites,
// la línea de la forma y este bloque, cerrado y latiendo: «Dilo con tus
// palabras · El gato tiene una última pregunta para ti». Al abrirlo, adentro
// están las tres frases, lo que quedó —lo que dijo antes de entrar y lo que
// respondió al volver, con fechas, en plantilla (D-34)— y el paso al gato.
// Sustituye al acordeón «Llevarlo al acto final», que prometía mostrar lo
// escrito y solo lo mandaba crudo a La Réplica (prototipo aprobado el 22 oct).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

const CONFIRMA_RETIRO_REPLICA = 'Se retira tu réplica del acto final. Lo que escribiste en tu recorrido se queda. No se puede deshacer.';
const CONFIRMA_RETIRO_TODO = 'Se borra todo lo que escribiste en tu recorrido, aquí y en la investigación. No se puede deshacer.';

// En la vista previa DEV no hay registro de nadie: un ejemplo, marcado, para
// poder recorrer el beat completo (como en el prototipo).
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

const fechaCorta = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
};

// La sesión de esta forma con algo escrito; la más reciente.
const sesionDeLaForma = (sessions = [], portal = null) => {
  const conTexto = sessions.filter((s) => (
    (!portal || s.miniverso_id === portal) && (s.intuicion_answer || s.bitacora_completed_at)
  ));
  return conTexto[conTexto.length - 1] ?? null;
};

// Lo que viaja con el gato y a La Réplica: la última respuesta dada; si no la
// hay, la intuición. `campo` permite corregir o retirar lo guardado (D-38).
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

const LoQueQuedo = ({ portal, frase = null, late = false, onUltimaPregunta, onGoToSite }) => {
  const { isDevAuth } = useAuth();
  const anonId = useMemo(() => ensureAnonId(), []);
  const [sessions, setSessions] = useState(null);
  const [replicas, setReplicas] = useState([]);
  const [retirando, setRetirando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const seccionRef = useRef(null);

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

  // Al abrirse, el acordeón crece y el mapa deja de ser la medida: se trae a
  // la vista para que lo desplegado no quede debajo del doblez.
  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) {
      window.setTimeout(() => {
        seccionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }, 80);
    }
  };

  const escucharAlGato = () => {
    if (!palabra) return;
    onUltimaPregunta?.({
      anonId,
      sessionId: sesion.id,
      campo: palabra.campo,
      original: palabra.texto,
      texto: palabra.texto,
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

  const entrada = fechaCorta(sesion?.created_at);
  const regreso = fechaCorta(sesion?.bitacora_completed_at);
  const respuestas = sesion
    ? [sesion.bitacora_p1_response, sesion.bitacora_p2_response, sesion.bitacora_p3_response]
      .filter((v) => typeof v === 'string' && v.trim())
    : [];
  const dijoQueNo = sesion?.bitacora_p1_afirmativa === false && respuestas.length === 0;
  const cargando = sessions === null;

  return (
    <div className="flex flex-col gap-3">
      <section ref={seccionRef} className={`huella-acordeon${abierto ? ' huella-acordeon--abierto' : ''}`}>
        <button
          type="button"
          onClick={alternar}
          aria-expanded={abierto}
          aria-controls="memoria-acordeon-contenido"
          className={`huella-puerta huella-puerta--gato${late && !abierto ? ' huella-puerta--late' : ''}`}
        >
          <span className="huella-puerta__esfera" aria-hidden="true">
            <img src={PORTAL_EMBLEM_URL[portal] ?? PORTAL_EMBLEM_URL.obra} alt="" />
          </span>
          <span className="huella-puerta__texto">
            {replicaPublicada ? (
              <>
                <span className="huella-puerta__eyebrow">Tu réplica</span>
                <span className="huella-puerta__titulo">Ya está en el acto final</span>
                <span className="huella-puerta__pista">Firmada como la dejaste</span>
              </>
            ) : (
              <>
                <span className="huella-puerta__titulo">Dilo con tus palabras</span>
                <span className="huella-puerta__pista">El gato tiene una última pregunta para ti</span>
              </>
            )}
          </span>
          <ChevronDown size={17} className="huella-puerta__flecha" aria-hidden="true" />
        </button>

        <div id="memoria-acordeon-contenido" className="huella-acordeon__cuerpo" aria-hidden={!abierto}>
          <div className="huella-acordeon__interior">
            <div className="memoria-acordeon">
              {frase}

              {cargando ? (
                <p className="text-xs text-slate-400/70">Leyendo lo que dejaste…</p>
              ) : sesion ? (
                <div className="lo-que-quedo lo-que-quedo--en-acordeon">
                  {sesion.intuicion_answer ? (
                    <div className="lo-que-quedo__item">
                      <span className="lo-que-quedo__cuando">Antes de entrar{entrada ? ` · ${entrada}` : ''}</span>
                      <p className="lo-que-quedo__texto">«{sesion.intuicion_answer}»</p>
                    </div>
                  ) : null}
                  {(respuestas.length > 0 || dijoQueNo) ? (
                    <div className="lo-que-quedo__item">
                      <span className="lo-que-quedo__cuando">Al volver{regreso ? ` · ${regreso}` : ''}</span>
                      {dijoQueNo ? (
                        <p className="lo-que-quedo__texto lo-que-quedo__texto--nada">Nada había regresado todavía.</p>
                      ) : respuestas.map((texto, i) => (
                        <p key={i} className="lo-que-quedo__texto">«{texto}»</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-400/70">No encontramos lo que escribiste en este navegador.</p>
              )}

              {replicaPublicada ? (
                <button type="button" onClick={() => onGoToSite?.('#provoca')} className="ultima-pregunta__salida">
                  Ver el acto final
                </button>
              ) : palabra ? (
                <button type="button" onClick={escucharAlGato} className="ultima-pregunta__salida">
                  Escuchar al gato
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {(sesion || replicaPublicada) ? (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {replicaPublicada ? (
            <button type="button" onClick={() => void retirarReplica()} className="lo-que-quedo__enlace">
              Retirar mi réplica
            </button>
          ) : null}
          {sesion ? (
            <button type="button" disabled={retirando} onClick={() => void retirarTodo()} className="lo-que-quedo__enlace">
              {retirando ? 'Retirando…' : 'Retirar lo que escribí'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default LoQueQuedo;
