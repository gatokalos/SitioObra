import { useEffect, useState } from 'react';
import { CATALOG } from '@/lib/bitacoraShared';
import { LEVEL2_QUESTIONS } from '@/components/portal/ResonanceModal';

// Panel de ensayo, solo en Vite DEV (Carlos, 14 nov 2026). Con `?devAuth=1`
// se entra como cuenta y se ve todo abierto, pero lo nuevo del segundo acto es
// para el visitante que llega del primer acto con su pase y sin sesión: la
// tarjeta que gira, el tablero en la tarjeta, En el foco, la ficha que se
// revela y el libreto. Este panel pone al navegador en ese lugar y salta a
// cualquier paso del recorrido sin tener que vivir los anteriores.
// Los saltos no tocan nada fuera de este navegador: escriben en localStorage
// lo mismo que el recorrido real escribiría y recargan. El método queda en
// vista previa (isDevAuth), así que no manda respuestas. Lo que sí sale: el
// artefacto es el real (el Marcador registra lo que se haga dentro) y el
// sitio anota la entrada a la forma, como con cualquier visitante.
const DEV_AUTH_KEY = 'gatoencerrado:dev-auth';
const FORMA_KEY = 'gatoencerrado:dev-ensayo-forma';
// Marca de un salto recién hecho: al recargar, la página baja sola hasta la
// tarjeta recomendada, que es donde ocurre lo que se quiere ver.
const IR_A_LA_TARJETA_KEY = 'gatoencerrado:dev-ensayo-ir';
// En teléfono el recorrido en la tarjeta sigue en prueba (Transmedia.jsx lo lee).
const DORSO_MOVIL_KEY = 'gatoencerrado:dev-dorso-movil';
// Las formas cuyo artefacto ya se abre en su propia ventana y vuelve a la
// tarjeta (ARTEFACTO_EN_VENTANA en Transmedia.jsx).
const RECORRIDO_EN_TARJETA = new Set(['miniversoNovela']);

// Respuestas de relleno para la primera intuición. En ensayo no hay servidor
// que ajuste el eco (el que cambia «de mí» por «de ti»): se ve el eco crudo,
// que pega la respuesta tal cual en la frase de cada forma. Por eso el relleno
// va sin primera persona, para que el eco se lea bien (Carlos, 14 nov 2026).
const RESPUESTA_DE_ENSAYO = {
  obra: 'dejar de fingir',
  literatura: 'un recuerdo que estaba dormido',
  artesanias: 'guarda una historia',
  grafico: 'una mirada conocida',
  cine: 'la torpeza de siempre',
  sonoridades: 'un eco lejano',
  movimiento: 'algo aprieta en el pecho',
  juegos: 'dudar',
  oraculo: 'no contestarla de inmediato',
};

const leer = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const poner = (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
const quitar = (k) => { try { window.localStorage.removeItem(k); } catch { /* sin almacenamiento */ } };

const recargar = (hash = '#transmedia') => {
  const url = new URL(window.location.href);
  url.searchParams.delete('devAuth');
  window.location.assign(`${url.origin}/${url.search}${hash}`);
  // Mismo documento y solo cambió el hash: hay que recargar a mano.
  window.setTimeout(() => window.location.reload(), 60);
};

const PASOS = [
  { id: 'pregunta', titulo: 'La pregunta', nota: 'La tarjeta gira y pide la primera intuición.' },
  { id: 'preparacion', titulo: 'Preparación', nota: 'Ya contestó; elige qué busca.' },
  { id: 'habitar', titulo: 'Habitar la forma', nota: 'Ya eligió; falta entrar al artefacto.' },
  { id: 'sin-gesto', titulo: 'Salió sin gesto', nota: 'Entró y salió antes de terminar.' },
  { id: 'foco', titulo: 'En el foco', nota: 'Terminó la escena; el autor entra a cuadro.' },
  { id: 'bambalinas', titulo: 'Entre bambalinas', nota: 'Ya vio el video; las tres filas.' },
  { id: 'ficha', titulo: 'Ficha revelada', nota: 'Tocó «Mientras tanto»; la tarjeta abre la ficha y el método, el libreto.' },
  { id: 'regreso', titulo: 'El día del regreso', nota: 'La pregunta ya volvió.' },
];

const registroDelPaso = (paso, forma) => {
  const ahora = Date.now();
  const enTarjeta = RECORRIDO_EN_TARJETA.has(forma.showcase);
  const opcion = LEVEL2_QUESTIONS[forma.key]?.options?.[0] ?? null;
  const r = {};
  if (paso === 'pregunta') return null;
  Object.assign(r, { l1: ahora, l1_answer: RESPUESTA_DE_ENSAYO[forma.key] ?? 'algo que estaba dormido' });
  if (paso === 'preparacion') return r;
  Object.assign(r, { l2_option: opcion, l2_ts: ahora });
  if (paso === 'habitar') return r;
  Object.assign(r, { l2_narrative_opened: true, dashboard_active_level: 2, ...(enTarjeta ? { recorrido_en_tarjeta: true } : { ficha_revelada: true }) });
  if (paso === 'sin-gesto') return r;
  Object.assign(r, {
    experience_ts: ahora,
    l2_conv_done: true,
    l2_escena_terminada: true,
    dashboard_active_level: 3,
    l3_recommendation: {
      step1: 'Tu recorrido de prueba ya tiene suficiente información para continuar.',
      step2: 'La siguiente forma puede ayudarte a contrastar lo que apareció aquí.',
      step3: 'Vista previa completada. Este resultado solo existe en tu navegador.',
      forma: 'otro miniverso',
      recommended_format_id: forma.key === 'obra' ? 'literatura' : 'obra',
    },
  });
  if (paso === 'foco') return r;
  Object.assign(r, { farewell_video_seen: true, farewell_video_seen_at: new Date(ahora).toISOString() });
  if (paso === 'bambalinas') return r;
  Object.assign(r, { ficha_revelada: true });
  if (paso === 'ficha') return { ...r, bitacora_available_at: new Date(ahora + 3 * 864e5).toISOString() };
  return { ...r, bitacora_consented: true, bitacora_available_at: new Date(ahora - 36e5).toISOString() };
};

const EnsayoDeVisitante = () => {
  const [abierto, setAbierto] = useState(false);
  const modo = leer(DEV_AUTH_KEY);
  const [showcase, setShowcase] = useState(() => leer(FORMA_KEY) || leer('gatoencerrado:oraculo-recommended-showcase') || 'miniversoNovela');
  const forma = CATALOG.find((f) => f.showcase === showcase) ?? CATALOG[1];

  useEffect(() => {
    let pendiente = false;
    try { pendiente = window.sessionStorage.getItem(IR_A_LA_TARJETA_KEY) === '1'; } catch { /* sin almacenamiento */ }
    if (!pendiente) return undefined;
    let intentos = 0;
    const vigia = window.setInterval(() => {
      intentos += 1;
      const forma = leer(FORMA_KEY);
      const visible = (el) => el.getBoundingClientRect().height > 0;
      const tarjeta = [...document.querySelectorAll(`[data-tarjeta-forma="${forma}"]`)].find(visible)
        ?? [...document.querySelectorAll('[data-tarjeta-recomendada]')].find(visible);
      if (tarjeta || intentos > 60) {
        window.clearInterval(vigia);
        try { window.sessionStorage.removeItem(IR_A_LA_TARJETA_KEY); } catch { /* sin almacenamiento */ }
        tarjeta?.scrollIntoView({ block: 'center' });
      }
    }, 300);
    return () => window.clearInterval(vigia);
  }, []);

  const entrarComo = (nuevo) => {
    if (nuevo) poner(DEV_AUTH_KEY, nuevo); else quitar(DEV_AUTH_KEY);
    recargar(window.location.hash || '');
  };

  const saltar = (paso) => {
    // El salto conserva la identidad elegida: cuenta de prueba o visitante con
    // pase (la de siempre si no hay ninguna). Con cuenta, las nueve tarjetas
    // giran; sin cuenta, solo la recomendada.
    poner(DEV_AUTH_KEY, modo === '1' ? '1' : 'pase');
    poner(FORMA_KEY, forma.showcase);
    // Lo que deja el primer acto: el pase, la galería abierta y la forma recomendada.
    poner('gatoencerrado:bienvenida-completed', '1');
    poner('gatoencerrado:transmedia-unlocked:v1', '1');
    poner('gatoencerrado:oraculo-recommended-showcase', forma.showcase);
    try {
      window.sessionStorage.removeItem('gatoencerrado:dorso-cerrado-session');
      window.sessionStorage.setItem(IR_A_LA_TARJETA_KEY, '1');
    } catch { /* sin almacenamiento */ }
    const registro = registroDelPaso(paso, forma);
    const clave = `gatoencerrado:resonance:${forma.key}`;
    if (registro) poner(clave, JSON.stringify(registro)); else quitar(clave);
    recargar('#transmedia');
  };

  const etiqueta = modo === 'pase' ? 'visitante con pase' : modo === '1' ? 'cuenta de prueba' : 'sin ensayo';
  const chip = 'rounded-full border px-3 py-1 text-[0.68rem] transition';

  return (
    <div data-ensayo className="fixed bottom-4 left-4 z-[190] max-w-[19rem] text-left font-sans max-lg:bottom-12 max-lg:left-2 max-lg:max-w-[15.5rem]">
      {abierto ? (
        <div className="mb-2 max-h-[78vh] space-y-3 overflow-y-auto rounded-2xl border border-amber-300/30 bg-[#0d0a14]/95 p-4 text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
          <div className="space-y-1.5">
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-amber-200/80">Entrar como</p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => entrarComo('pase')} className={`${chip} ${modo === 'pase' ? 'border-amber-300/70 bg-amber-400/15 text-amber-100' : 'border-white/15 text-slate-300 hover:border-white/35'}`}>Visitante con pase</button>
              <button type="button" onClick={() => entrarComo('1')} className={`${chip} ${modo === '1' ? 'border-amber-300/70 bg-amber-400/15 text-amber-100' : 'border-white/15 text-slate-300 hover:border-white/35'}`}>Cuenta de prueba</button>
              <button type="button" onClick={() => entrarComo(null)} className={`${chip} ${!modo ? 'border-amber-300/70 bg-amber-400/15 text-amber-100' : 'border-white/15 text-slate-300 hover:border-white/35'}`}>Nada</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ensayo-forma" className="block text-[0.6rem] uppercase tracking-[0.3em] text-amber-200/80">{modo === '1' ? 'Forma' : 'Forma recomendada'}</label>
            <select
              id="ensayo-forma"
              value={forma.showcase}
              onChange={(e) => setShowcase(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-slate-100"
            >
              {CATALOG.map((f) => (
                <option key={f.showcase} value={f.showcase}>{f.form}</option>
              ))}
            </select>
            {!RECORRIDO_EN_TARJETA.has(forma.showcase) ? (
              <p className="text-[0.66rem] leading-snug text-slate-400">
                Esta forma todavía abre la ficha al entrar al artefacto; el recorrido en la tarjeta por ahora es de La escritura.
              </p>
            ) : null}
          </div>

          <label className="flex items-start gap-2 text-[0.7rem] leading-snug text-slate-300">
            <input
              type="checkbox"
              data-ensayo-telefono
              checked={leer(DORSO_MOVIL_KEY) === '1'}
              onChange={(e) => {
                if (e.target.checked) poner(DORSO_MOVIL_KEY, '1'); else quitar(DORSO_MOVIL_KEY);
                recargar(window.location.hash || '');
              }}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-amber-400"
            />
            <span>En teléfono, el recorrido en la tarjeta (en prueba; apagado, el teléfono abre el portal como hoy).</span>
          </label>

          <div className="space-y-1.5">
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-amber-200/80">Saltar a</p>
            <div className="flex flex-col gap-1">
              {PASOS.map((paso, i) => (
                <button
                  key={paso.id}
                  type="button"
                  data-ensayo-paso={paso.id}
                  onClick={() => saltar(paso.id)}
                  title={paso.nota}
                  className="flex items-baseline gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-left text-sm text-slate-100 transition hover:border-amber-300/50 hover:bg-amber-400/10"
                >
                  <span className="w-3 shrink-0 text-[0.62rem] text-slate-500">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block leading-tight">{paso.titulo}</span>
                    <span className="block text-[0.64rem] leading-snug text-slate-400">{paso.nota}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[0.64rem] leading-snug text-slate-500">
              Cada salto reescribe el recorrido de esta forma en este navegador y recarga. El método no envía respuestas; el artefacto sí es el real y registra lo que hagas dentro.
            </p>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        data-ensayo-abrir
        onClick={() => setAbierto((v) => !v)}
        className="rounded-full border border-amber-300/40 bg-[#0d0a14]/90 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:bg-amber-500/20 max-lg:px-2 max-lg:text-[0.55rem] max-lg:tracking-[0.18em] max-lg:opacity-70"
      >
        Ensayo · {etiqueta}
      </button>
    </div>
  );
};

export default EnsayoDeVisitante;
