// «Tu texto»: el otro lado de la ficha del acto final (Carlos, 19 nov 2026:
// «necesito toda la ficha… que se vea todo el protagonismo de ese otro lado»).
// Se abre con «Armar mi texto» y ocupa la ficha entera; «Volver» la regresa.
//
// Segunda versión, 19 nov 2026, noche (maqueta aprobada: «Lo único que no me
// gustó fue el botón kilométrico…», corregido). Carlos: «vamos a quitar las
// esferas de la ficha y las vamos a poner adentro de arma mi texto… ahí puede
// ver botón esfera por esfera, qué es lo que ha puesto, lo puede editar si
// quiere y ahí vamos a tener abajo la botón de pasarlo por la IA de gato
// encerrado y eso va a ser lo increíble». Tres momentos:
//   1. Sus réplicas: las nueve esferas; la que toca se ve y se edita aquí (la
//      publicada no cambia). Abajo, «Pasarlas por la IA de #GatoEncerrado» y
//      «Juntarlas yo».
//   2. La IA hilando: sus esferas unidas por el hilo dorado de la constelación.
//   3. El texto: título y género propuestos (con IA), el texto editable, el
//      contador de cuartillas (dos como máximo para proponerlo), las versiones
//      (tres por persona; agotadas, la invitación a dejar una huella con
//      palabras de Carlos) y las dos salidas: «Llevármelo» (PDF, privado) y
//      «Proponerlo para el blog» (con nombre, lo lee el equipo; D-76).
// Lo que es suyo se guarda solo, en el navegador y en su cuenta. De lo que no
// comparte queda solo el gesto, sin contenido (D-76). Textos de Claude, por
// revisar, salvo la invitación de la huella.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ChevronQueSigue from '@/components/ChevronQueSigue';
import { Download, HeartHandshake, PenLine, Sparkles } from 'lucide-react';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { CATALOG } from '@/lib/bitacoraShared';
import { leerTuTexto, guardarTuTexto, traerTuTextoDelServidor, guardarTuTextoEnElServidor, fechaCorta } from '@/lib/misReplicas';
import { hilarConLaIA, versionesDeLaIA, anotarGestoDeTuTexto, proponerParaElBlog } from '@/lib/tuTextoIA';
import { pdfDeTuTexto, llevarseElPdf } from '@/lib/pdfDeTuTexto';

const CUARTILLA = 1700;
const LIMITE_PARA_PROPONER = 2 * CUARTILLA;
const nombreDe = (portal) => CATALOG.find((f) => f.key === portal)?.form ?? null;
const claveDe = (r) => (r.perspectiveId ? `p-${r.perspectiveId}` : String(r.id));
const enLista = (nombres) => {
  try { return new Intl.ListFormat('es', { type: 'conjunction' }).format(nombres); } catch { return nombres.join(' y '); }
};
// Lo guardado antes del 19 nov en la noche traía las fuentes como lista de ids.
const desplegarFuentes = (fuentes) => (fuentes && !Array.isArray(fuentes) && typeof fuentes === 'object' ? fuentes : {});

const TuTexto = ({ replicas, user = null, onVolver, onSostener }) => {
  const userId = user?.id ?? null;
  const guardado = useMemo(() => leerTuTexto(), []);
  const [ediciones, setEdiciones] = useState(() => guardado?.ediciones ?? {});
  const [texto, setTexto] = useState(() => guardado?.texto ?? '');
  const [titulo, setTitulo] = useState(() => guardado?.titulo ?? '');
  const [genero, setGenero] = useState(() => guardado?.genero ?? null);
  const [conIA, setConIA] = useState(() => Boolean(guardado?.conIA));
  const [version, setVersion] = useState(() => guardado?.version ?? null);
  // Título y género de cada versión que ya le dio la IA: la siguiente no repite
  // ninguno (19 nov 2026: con solo la última, la tercera repetía la primera).
  const [vistas, setVistas] = useState(() => (Array.isArray(guardado?.vistas) ? guardado.vistas : []));
  const [limite, setLimite] = useState(3);
  const [usadas, setUsadas] = useState(null);
  const [etapa, setEtapa] = useState(() => (guardado?.texto?.trim() ? 'texto' : 'replicas'));
  const [panelAgotadas, setPanelAgotadas] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [estadoBlog, setEstadoBlog] = useState(() => (guardado?.compartidoAt ? 'propuesto' : 'listo'));
  const [nombreBlog, setNombreBlog] = useState(() => (
    user?.user_metadata?.alias || user?.user_metadata?.full_name || [...replicas].reverse().find((r) => r.nombre)?.nombre || ''
  ));
  const tocado = useRef(false);
  const abortRef = useRef(null);
  const tituloRef = useRef(null);
  const campoRef = useRef(null);
  const replicaRef = useRef(null);
  const raizRef = useRef(null);
  const [sigue, setSigue] = useState(false);
  const etapaAntes = useRef('replicas');

  // La esfera elegida: la última réplica, de entrada.
  const [elegida, setElegida] = useState(() => (replicas.length ? claveDe(replicas[replicas.length - 1]) : null));
  const replicaElegida = replicas.find((r) => claveDe(r) === elegida) ?? replicas[replicas.length - 1] ?? null;
  const formasConReplica = new Set(replicas.map((r) => r.portal).filter(Boolean));
  const enFrio = [...replicas].reverse().find((r) => !r.portal) ?? null;
  const textoDe = (r) => ediciones[claveDe(r)] ?? r.texto;
  const material = replicas
    .map((r) => ({ forma: nombreDe(r.portal), texto: String(textoDe(r) ?? '').trim() }))
    .filter((m) => m.texto.length >= 10)
    .slice(-9);
  const formasDelMaterial = [...new Set(material.map((m) => m.forma).filter(Boolean))];

  // Con cuenta, lo de la cuenta manda si es más reciente que lo del navegador.
  useEffect(() => {
    if (!userId) return undefined;
    let vigente = true;
    void traerTuTextoDelServidor().then((delServidor) => {
      if (!vigente || !delServidor?.texto || tocado.current) return;
      const local = leerTuTexto();
      if (local && String(delServidor.updatedAt) <= String(local.updatedAt)) return;
      const extra = desplegarFuentes(delServidor.fuentes);
      setTexto(delServidor.texto);
      setTitulo(extra.titulo ?? '');
      setGenero(extra.genero ?? null);
      setConIA(Boolean(extra.conIA));
      setVersion(extra.version ?? null);
      if (extra.ediciones) setEdiciones(extra.ediciones);
      if (delServidor.compartidoAt) setEstadoBlog('propuesto');
      setEtapa('texto');
    });
    void versionesDeLaIA().then((v) => {
      if (!vigente || !v) return;
      setUsadas(v.usadas);
      setLimite(v.limite);
    });
    return () => { vigente = false; };
  }, [userId]);

  // Se guarda solo: en el navegador siempre; en la cuenta cuando ella tocó algo.
  useEffect(() => {
    const ids = replicas.map((r) => r.perspectiveId ?? r.id);
    const extra = { titulo, genero, conIA, version, ediciones };
    const t = window.setTimeout(() => {
      guardarTuTexto(texto, ids, { ...extra, vistas, ...(estadoBlog === 'propuesto' ? { compartidoAt: leerTuTexto()?.compartidoAt ?? new Date().toISOString() } : {}) });
      if (userId && tocado.current) void guardarTuTextoEnElServidor(userId, texto, { ids, ...extra });
    }, 800);
    return () => window.clearTimeout(t);
  }, [texto, titulo, genero, conIA, version, vistas, ediciones, replicas, userId, estadoBlog]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Las cajas miden lo que su texto, para que se lea todo (Carlos, 20 nov
  // 2026: en escritorio el último párrafo quedaba escondido sin aviso). Si en
  // escritorio el marco de la ficha se queda corto, el marco se recorre y abajo
  // aparece el chevron de «la sección sigue».
  const medirMarco = useCallback(() => {
    const marco = raizRef.current?.closest('.provoca-stage-lado-texto');
    if (!marco) return;
    setSigue(marco.scrollHeight - marco.clientHeight - marco.scrollTop > 24);
  }, []);
  const medirCampos = useCallback(() => {
    // Se mide desde cero y sin crecer con el marco: medida sobre su propio
    // alto, la caja sumaba dos puntos en cada vuelta y llegaba a desbordar.
    for (const el of [campoRef.current, replicaRef.current]) {
      if (!el) continue;
      el.style.flex = '0 0 auto';
      el.style.height = '0px';
      const alto = el.scrollHeight + 2;
      el.style.flex = '';
      el.style.height = `${alto}px`;
    }
    medirMarco();
  }, [medirMarco]);
  useLayoutEffect(() => { medirCampos(); }, [texto, etapa, elegida, ediciones, panelAgotadas, estadoBlog, medirCampos]);
  useEffect(() => {
    const marco = raizRef.current?.closest('.provoca-stage-lado-texto');
    marco?.addEventListener('scroll', medirMarco, { passive: true });
    window.addEventListener('resize', medirCampos);
    return () => {
      marco?.removeEventListener('scroll', medirMarco);
      window.removeEventListener('resize', medirCampos);
    };
  }, [medirCampos, medirMarco]);

  // El campo del título mide lo que su texto.
  useEffect(() => {
    const el = tituloRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [titulo, etapa]);

  const juntarlasYo = () => {
    tocado.current = true;
    setTexto(material.map((m) => m.texto).join('\n\n'));
    setTitulo('');
    setGenero(null);
    setConIA(false);
    setVersion(null);
    setPanelAgotadas(false);
    setAviso(null);
    setEtapa('texto');
    void anotarGestoDeTuTexto(userId, 'juntado', { formas: formasDelMaterial, nReplicas: material.length });
  };

  const hilar = useCallback(async () => {
    if (!material.length) return;
    setAviso(null);
    etapaAntes.current = etapa;
    setEtapa('hilando');
    const control = new AbortController();
    abortRef.current = control;
    const respuesta = await hilarConLaIA({
      replicas: material,
      anteriores: vistas,
      signal: control.signal,
    });
    abortRef.current = null;
    if (respuesta?.ok) {
      tocado.current = true;
      setTitulo(respuesta.titulo ?? '');
      setGenero(respuesta.genero ?? null);
      setTexto(respuesta.texto ?? '');
      setConIA(true);
      setVersion(respuesta.version ?? null);
      setVistas((v) => [...v, { genero: respuesta.genero ?? null, titulo: respuesta.titulo ?? null }].slice(-3));
      if (respuesta.limite) setLimite(respuesta.limite);
      setUsadas(respuesta.version ?? null);
      setPanelAgotadas(Boolean(respuesta.version && respuesta.limite && respuesta.version >= respuesta.limite));
      setEtapa('texto');
      return;
    }
    setEtapa(etapaAntes.current);
    if (respuesta?.agotadas) {
      if (respuesta.limite) setLimite(respuesta.limite);
      setUsadas(respuesta.usadas ?? respuesta.limite ?? null);
      setPanelAgotadas(true);
      return;
    }
    if (respuesta?.error !== 'cancelado') setAviso('La IA no contestó esta vez. Inténtalo de nuevo en un momento.');
  }, [material, etapa, vistas]);

  const cancelar = () => abortRef.current?.abort();

  const llevarmelo = async () => {
    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    const blob = pdfDeTuTexto({ titulo, texto, pie: `#GatoEncerrado · universo.gatoencerrado.org · ${fecha}` });
    const como = await llevarseElPdf(blob);
    if (como !== 'cancelado') void anotarGestoDeTuTexto(userId, 'llevado', { conIA, version, formas: formasDelMaterial, nReplicas: material.length });
  };

  const mandarAlBlog = async () => {
    if (!nombreBlog.trim()) return;
    setEstadoBlog('enviando');
    const listo = await proponerParaElBlog({
      nombre: nombreBlog.trim().slice(0, 80),
      correo: user?.email ?? null,
      titulo: titulo.trim(),
      texto: texto.trim(),
      meta: {
        genero,
        con_ia: conIA,
        version,
        formas: formasDelMaterial,
        n_replicas: material.length,
        replicas: replicas.map((r) => r.perspectiveId).filter(Boolean),
        user_id: userId,
      },
    });
    if (!listo) {
      setEstadoBlog('consentimiento');
      setAviso('No se pudo mandar. Inténtalo de nuevo.');
      return;
    }
    setEstadoBlog('propuesto');
    setAviso(null);
    if (userId) void guardarTuTextoEnElServidor(userId, texto, { ids: replicas.map((r) => r.perspectiveId ?? r.id), titulo, genero, conIA, version, ediciones }, { compartido_at: new Date().toISOString() });
    void anotarGestoDeTuTexto(userId, 'propuesto', { conIA, version, formas: formasDelMaterial, nReplicas: material.length });
  };

  const largo = texto.trim().length;
  const pasado = largo > LIMITE_PARA_PROPONER;
  const sinMasVersiones = usadas != null && usadas >= limite;

  // ── Piezas ────────────────────────────────────────────────────────────────
  const esferas = (
    <div className="tu-texto__esferas" role="list">
      {CATALOG.map((forma) => {
        const encendida = formasConReplica.has(forma.key);
        const suya = encendida ? [...replicas].reverse().find((r) => r.portal === forma.key) : null;
        const activa = etapa === 'replicas' && suya && claveDe(suya) === elegida;
        return (
          <button
            key={forma.key}
            type="button"
            role="listitem"
            disabled={!encendida}
            onClick={encendida ? () => { setElegida(claveDe(suya)); setEtapa('replicas'); } : undefined}
            title={forma.form}
            aria-label={encendida ? `Tu réplica de ${forma.form}` : `${forma.form}: todavía sin réplica`}
            className={`tus-replicas__esfera${encendida ? ' tus-replicas__esfera--encendida' : ''}${activa ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
            data-esfera-de-tu-texto={forma.key}
          >
            <img src={PORTAL_EMBLEM_URL[forma.key]} alt="" aria-hidden="true" />
          </button>
        );
      })}
      {enFrio ? (
        <button
          type="button"
          role="listitem"
          onClick={() => { setElegida(claveDe(enFrio)); setEtapa('replicas'); }}
          title="Desde el acto final"
          aria-label="Tu réplica escrita desde el acto final"
          className={`tus-replicas__esfera tus-replicas__esfera--encendida tus-replicas__esfera--frio${etapa === 'replicas' && claveDe(enFrio) === elegida ? ' tus-replicas__esfera--en-el-recuadro' : ''}`}
        >
          <PenLine size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  const panelDeHuella = (seguir) => (
    <div className="tu-texto__agotadas" data-versiones-agotadas>
      {/* Palabras de Carlos (19 nov 2026). */}
      <p>Usaste tus {limite === 3 ? 'tres' : limite} versiones. Para que tú y otras personas puedan seguir usando esta IA sin costo, deja una huella. Con ella sostienes toda la causa.</p>
      <div className="tu-texto__acciones tu-texto__acciones--izquierda">
        <button type="button" className="tu-texto__huella" onClick={onSostener}>
          <HeartHandshake size={16} aria-hidden="true" />
          Sostener con mi huella
        </button>
        {seguir}
      </div>
    </div>
  );

  const botonIA = (etiqueta, alTocar) => (
    <button type="button" className="ultima-pregunta__salida ultima-pregunta__salida--cambia ultima-pregunta__salida--sesion tu-texto__boton-ia" onClick={alTocar} disabled={!material.length} data-pasar-por-la-ia>
      <Sparkles size={16} aria-hidden="true" />
      {etiqueta}
    </button>
  );

  let cuerpo = null;
  let pie = null;

  if (etapa === 'replicas') {
    cuerpo = replicaElegida ? (
      <div className="tu-texto__replica">
        <p className="tu-texto__etiqueta">{nombreDe(replicaElegida.portal) ?? 'Desde el acto final'} · {fechaCorta(replicaElegida.fecha)}</p>
        <textarea
          key={claveDe(replicaElegida)}
          value={textoDe(replicaElegida)}
          onChange={(e) => { tocado.current = true; const v = e.target.value; setEdiciones((prev) => ({ ...prev, [claveDe(replicaElegida)]: v })); }}
          rows={6}
          ref={replicaRef}
          aria-label={`Tu réplica de ${nombreDe(replicaElegida.portal) ?? 'el acto final'}`}
          className="tu-texto__campo tu-texto__campo--mide"
          data-replica-de-tu-texto
        />
        <p className="tu-texto__nota">Cámbiala si quieres. La que ya publicaste se queda como está.</p>
      </div>
    ) : null;
    pie = (
      <div className="tu-texto__pie-columna">
        {panelAgotadas ? panelDeHuella(
          <button type="button" className="tu-texto__volver" onClick={juntarlasYo} data-juntarlas-yo>Juntarlas yo</button>,
        ) : (
          <div className="tu-texto__acciones">
            {botonIA('Pasarlas por la IA de #GatoEncerrado', () => (sinMasVersiones ? setPanelAgotadas(true) : void hilar()))}
            <div className="tu-texto__acciones-par">
              <button type="button" className="tu-texto__volver" onClick={juntarlasYo} data-juntarlas-yo>Juntarlas yo</button>
              <button type="button" className="tu-texto__volver" onClick={onVolver} data-volver-de-tu-texto>Volver</button>
            </div>
          </div>
        )}
        <p className="tu-texto__nota">{aviso ?? 'La IA lee solo tus réplicas y te propone cómo se hilan: un título, un género y un texto. Tú decides qué se queda.'}</p>
      </div>
    );
  } else if (etapa === 'hilando') {
    const suyas = CATALOG.filter((f) => formasConReplica.has(f.key)).slice(0, 9);
    const n = Math.max(suyas.length, 1);
    const puntos = suyas.map((f, i) => ({ key: f.key, x: 30 + (n === 1 ? 120 : (i * 240) / (n - 1)), y: i % 2 === 0 ? 78 : 34 }));
    const camino = puntos.length > 1
      ? puntos.reduce((d, p, i) => (i === 0 ? `M${p.x} ${p.y}` : `${d} S ${p.x - 30} ${p.y + (i % 2 ? -26 : 26)}, ${p.x} ${p.y}`), '') + ` S ${puntos[puntos.length - 1].x + 20} 100, ${puntos[puntos.length - 1].x + 10} 104`
      : 'M150 56 C 190 20, 230 90, 260 70';
    cuerpo = (
      <div className="tu-texto__hilando" data-ia-hilando>
        <svg viewBox="0 0 300 120" className="tu-texto__hilo" aria-hidden="true">
          <path d={camino} />
          {puntos.map((p) => (
            <g key={p.key}>
              <clipPath id={`hilo-${p.key}`}><circle cx={p.x} cy={p.y} r="15" /></clipPath>
              <image href={PORTAL_EMBLEM_URL[p.key]} x={p.x - 15} y={p.y - 15} width="30" height="30" clipPath={`url(#hilo-${p.key})`} preserveAspectRatio="xMidYMid slice" />
              <circle cx={p.x} cy={p.y} r="15" className="tu-texto__hilo-aro" />
            </g>
          ))}
        </svg>
        <p className="tu-texto__hilando-titulo font-display italic">La IA de #GatoEncerrado está hilando tus réplicas…</p>
        <p className="tu-texto__nota">{enLista(formasDelMaterial.length ? formasDelMaterial : ['Tus réplicas'])}</p>
      </div>
    );
    pie = (
      <div className="tu-texto__acciones">
        <button type="button" className="tu-texto__volver" onClick={cancelar}>Cancelar</button>
      </div>
    );
  } else {
    cuerpo = (
      <div className="tu-texto__propuesta">
        <div className="tu-texto__titulo-fila">
          <span className="tu-texto__etiqueta">{conIA ? 'Título propuesto' : 'Título'}</span>
          {genero ? <span className="tu-texto__genero" data-genero>{genero}</span> : null}
        </div>
        {/* El título crece si no cabe en un renglón (en teléfono, sobre todo). */}
        <textarea
          ref={tituloRef}
          value={titulo}
          onChange={(e) => { tocado.current = true; setTitulo(e.target.value.replace(/\n/g, ' ').slice(0, 120)); }}
          rows={1}
          placeholder="Ponle un título, si quieres"
          aria-label="Título de tu texto"
          className="tu-texto__titulo-propio font-display italic"
          data-titulo-de-tu-texto
        />
        <textarea
          value={texto}
          onChange={(e) => { tocado.current = true; setTexto(e.target.value); }}
          rows={9}
          ref={campoRef}
          aria-label="Tu texto"
          className="tu-texto__campo tu-texto__campo--mide"
          data-texto-de-tu-texto
        />
        <div className="tu-texto__cuenta">
          <span className={pasado ? 'tu-texto__cuenta--pasado' : undefined} data-cuartillas>
            {(largo / CUARTILLA).toFixed(1)} de 2 cuartillas{pasado ? ' · recórtalo para proponerlo' : ''}
          </span>
          {conIA && version ? <span className={version >= limite ? 'tu-texto__cuenta--pasado' : undefined}>Versión {version} de {limite}</span> : null}
        </div>
      </div>
    );
    if (estadoBlog === 'consentimiento' || estadoBlog === 'enviando') {
      pie = (
        <div className="tu-texto__consentimiento" data-consentimiento-del-blog>
          <div className="tu-texto__consentimiento-texto">
            <p>Se lee antes de publicarse en el blog. Si se publica, va con este nombre:</p>
            <input value={nombreBlog} onChange={(e) => setNombreBlog(e.target.value)} aria-label="Tu nombre" className="tu-texto__nombre" />
            {aviso ? <p className="tu-texto__nota">{aviso}</p> : null}
          </div>
          <div className="tu-texto__acciones">
            <button type="button" className="tu-texto__volver" onClick={() => { setEstadoBlog('listo'); setAviso(null); }}>Todavía no</button>
            <button type="button" className="ultima-pregunta__salida tu-texto__principal" onClick={() => void mandarAlBlog()} disabled={!nombreBlog.trim() || estadoBlog === 'enviando'} data-mandar-al-blog>
              {estadoBlog === 'enviando' ? 'Mandando…' : 'Mandarlo'}
            </button>
          </div>
        </div>
      );
    } else if (panelAgotadas) {
      pie = panelDeHuella(
        <button type="button" className="tu-texto__volver" onClick={() => setPanelAgotadas(false)}>Seguir con esta versión</button>,
      );
    } else {
      const propuesto = estadoBlog === 'propuesto';
      pie = (
        <div className="tu-texto__pie-columna">
          <div className="tu-texto__acciones tu-texto__acciones--texto">
            <button type="button" className="tu-texto__volver" onClick={() => setEtapa('replicas')} data-volver-a-mis-replicas>Volver a mis réplicas</button>
            {conIA ? (
              <button type="button" className="tu-texto__volver" onClick={() => (sinMasVersiones ? setPanelAgotadas(true) : void hilar())} data-otra-version>
                {/* Carlos, 20 nov 2026: «Otro género» con una mano escribiendo, para
                    que se note que es otra forma de escribirlo y no otra versión
                    cualquiera. Lucide no trae la mano: es el emoji en gris. */}
                <span className="tu-texto__mano" aria-hidden="true">✍️</span>Otro género
              </button>
            ) : null}
            <button type="button" className="tu-texto__volver" onClick={() => void llevarmelo()} disabled={!largo} data-llevarmelo>
              <Download size={15} aria-hidden="true" />
              Llevármelo
            </button>
            <button
              type="button"
              className="ultima-pregunta__salida tu-texto__principal"
              onClick={() => setEstadoBlog('consentimiento')}
              disabled={!largo || pasado || propuesto}
              data-proponer-al-blog
            >
              {propuesto ? 'Propuesto' : 'Proponerlo para el blog'}
            </button>
          </div>
          <p className={`tu-texto__nota${propuesto ? ' tu-texto__nota--hecho' : ''}`}>
            {aviso ?? (propuesto
              ? 'Llegó. Se lee antes de publicarse en el blog.'
              : conIA
                ? 'Es una propuesta: edítala como quieras. Se guarda sola y no se publica hasta que lo propongas.'
                : 'Se guarda solo. No se publica hasta que lo propongas.')}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="tu-texto" data-tu-texto data-etapa={etapa} ref={raizRef}>
      <div className="tu-texto__cabecera tu-texto__cabecera--esferas">
        <div className="min-w-0">
          <p className="huella-puerta__eyebrow">Tus réplicas, juntas</p>
          <h3 className="tu-texto__titulo font-display italic">Tu texto</h3>
        </div>
        {esferas}
      </div>
      {cuerpo}
      <div className="tu-texto__pie">{pie}</div>
      {sigue ? <ChevronQueSigue className="tu-texto__sigue pointer-events-none" /> : null}
    </div>
  );
};

export default TuTexto;
