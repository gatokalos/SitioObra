import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { MessageCircle, Sparkles, BookOpen, Download, Bell, Check } from 'lucide-react';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import LoQueQuedo from '@/components/portal/LoQueQuedo';
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
import IAInsightCard from '@/components/IAInsightCard';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { CATALOG, readResonanceProgress, momentoDeLaForma } from '@/lib/bitacoraShared';
import { acomodarEnOndas } from '@/lib/constelacionEnOndas';
import { PORTAL_EMBLEM_URL } from '@/lib/resonanceDramaturgy';
import { trazarGarabato } from '@/lib/constelacionGarabato';
import { writePendingContinuation } from '@/lib/pendingContinuation';
import { ensureAnonId } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  showcaseDefinitions,
  formats,
  RESONANCE_BRIDGE_VIDEO_ENABLED,
} from '@/components/transmedia/transmediaConstants';

export { CATALOG };

// Vista reducida para un miniverso cuyo cuaderno holográfico todavía no se
// activó (bitacora_completed falso): sin pregunta ni CTA — esos exponían un
// loophole real (cualquiera podía recorrer las 9 esferas y usar el CTA de
// cada una para saltar a un portal no ganado). Solo las esferas de progreso,
// a modo de mapa de dónde quedó cada miniverso.
// La línea de la forma (D-42). Antes eran cuatro esferas iguales rotuladas
// "Nivel 1 · Nivel 2 · Nivel 3 · En escena": tres nombres de arquitectura
// interna y uno de la convención, sin que ninguno pesara más. Ahora se dibuja
// lo que a la persona le ocurrió: entró (En el foco), esperó (Entre bambalinas,
// tres días: un tramo punteado, vacío a propósito), respondió (En escena, el
// clímax: la única esfera que pesa) y lo que queda (Memoria, abierta porque de
// aquí se sale al acto final). Los tres niveles quedan plegados en el foco:
// para quien recorre fueron una sola cosa.
// Iconos (Carlos, 27 oct 2026: «¿Te cuadra el timeline con el dashboard?»; no
// cuadraba): cada nodo lleva el icono que ese momento ya tiene en el libreto y
// en las insignias de la vitrina —chispas para En el foco, libro para Memoria—
// y En escena recibe uno propio, la burbuja de la cabina, donde ocurre. Antes
// el ojo era el de Primera intuición y la llama la de Sentir la escena.
// 18 nov 2026 (Carlos): la línea es «el paréntesis entre el tercer momento y»
// lo que sigue; Entre bambalinas y el regreso son estados de la línea temporal,
// no fases adicionales. Dos rótulos cambian y nada más: el primer nodo decía
// «En el foco» (título que ese día pasó a «El foco cambia») y ahora lleva la
// ceja del tercer momento, «Al salir de escena»; el aro decía «En escena»,
// que nombraba un lugar y no decía que algo vuelve, y ahora dice «El Regreso»
// (palabra de Carlos). Los props conservan sus nombres de antes.
// El día del regreso el aro se enciende (Carlos, 18 nov 2026: «en el timeline
// sigue estando llamativo al salir de escena en vez de el regreso»): pesa como
// pesa la Memoria cuando la persona está en ella. La regla del 23 oct se
// cumple también aquí: encendido lo que está pasando.
const LineaDeLaForma = ({ portal, enFoco, focoCompleto, enEscena, regresoAbierto = false }) => {
  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const rotulo = (activo) => `text-[0.6rem] uppercase tracking-wide ${activo ? 'text-slate-300' : 'text-slate-600'}`;
  const regresoVivo = regresoAbierto && !enEscena;
  // Dónde está la persona ahora, con algo de movimiento (Carlos, 24 nov 2026:
  // «necesito que haga algo de movimiento… para que refuerce detrás de la
  // bandeja morada que hay algo atrás. Y cuando lo revele, sepa que… en ese
  // lugar está ahorita»). Esperando, una luz recorre los puntitos hacia el
  // regreso; el regreso o la Memoria, cuando es su momento, laten con una onda.
  const esperando = focoCompleto && !regresoVivo && !enEscena;
  return (
    <div
      className="flex items-start justify-between gap-1 py-3"
      role="img"
      data-linea-de-la-forma
      data-regreso-vivo={regresoVivo ? '' : undefined}
      aria-label={
        enEscena
          ? 'Al salir de escena y El Regreso ya ocurrieron; estás en la Memoria'
          : regresoVivo
            ? 'Al salir de escena, completo. La pregunta volvió: estás en El Regreso'
            : focoCompleto
              ? 'Al salir de escena, completo. El Regreso sigue abierto'
              : enFoco ? 'Recorrido en curso' : 'Sin empezar'
      }
    >
      {/* Al salir de escena — el detonante (En el foco, en D-42) */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
        <span className="flex h-12 items-center">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              focoCompleto
                ? `bg-gradient-to-br ${gradient} shadow-[0_4px_14px_rgba(0,0,0,0.4)]`
                : enFoco
                  ? 'border border-white/40 bg-white/[0.06]'
                  : 'border border-dashed border-white/15 bg-white/[0.03]'
            }`}
          >
            <Sparkles size={14} className={focoCompleto ? 'text-white' : enFoco ? 'text-slate-300' : 'text-slate-600'} />
          </span>
        </span>
        <span className={`${rotulo(enFoco)} text-center leading-tight`}>Al salir de escena</span>
      </div>

      {/* Entre bambalinas — la retención: tres días en los que no pasa nada */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <span className="flex h-12 w-full items-center">
          <span className="relative w-full">
            <span className={`block w-full border-t-2 border-dotted ${focoCompleto ? 'border-white/35' : 'border-white/10'}`} />
            {esperando ? <span aria-hidden className="linea-espera__luz" /> : null}
          </span>
        </span>
        <span className={`${rotulo(focoCompleto)} text-center leading-tight`}>
          Entre bambalinas
          <span className="block normal-case tracking-normal opacity-70">3 días</span>
        </span>
      </div>

      {/* El Regreso — el clímax (En escena, en D-42). Si no ocurrió queda vacía, no apagada. Encendido
          lo que está pasando, no lo que ya pasó (Carlos, 23 oct 2026): cuando el
          regreso ya ocurrió, En escena queda cerrada y el punto vivo es Memoria. */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
        <span className="relative flex h-12 w-12 items-center justify-center">
          {regresoVivo ? (
            <>
              <span aria-hidden className={`absolute -inset-1 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-md`} />
              <span aria-hidden className="linea-onda" />
            </>
          ) : null}
          <span
            className={`relative flex items-center justify-center rounded-full transition ${
              enEscena
                ? `h-9 w-9 bg-gradient-to-br ${gradient} shadow-[0_4px_14px_rgba(0,0,0,0.4)]`
                : regresoVivo
                  ? `h-12 w-12 bg-gradient-to-br ${gradient} shadow-[0_6px_22px_rgba(0,0,0,0.45)]`
                  : focoCompleto
                    ? 'h-12 w-12 border-2 border-white/40 bg-transparent'
                    : 'h-12 w-12 border border-dashed border-white/15 bg-white/[0.03]'
            }`}
          >
            <MessageCircle size={enEscena ? 15 : 20} className={enEscena || regresoVivo ? 'text-white' : focoCompleto ? 'text-slate-300' : 'text-slate-600'} />
          </span>
        </span>
        <span className={`${regresoVivo ? 'text-[0.6rem] uppercase tracking-wide text-slate-100' : rotulo(enEscena || focoCompleto)} whitespace-nowrap ${enEscena ? '' : 'font-semibold'}`}>El Regreso</span>
      </div>

      <span className="flex h-12 w-5 shrink-0 items-center">
        <span className={`w-full border-t ${enEscena ? 'border-white/35' : 'border-white/10'}`} />
      </span>

      {/* Memoria — donde la persona está parada ahora: el punto vivo. */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
        <span className="relative flex h-12 w-12 items-center justify-center">
          {enEscena ? (
            <>
              <span aria-hidden className={`absolute -inset-1 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-md`} />
              <span aria-hidden className="linea-onda" />
            </>
          ) : null}
          <span
            className={`relative flex items-center justify-center rounded-full transition ${
              enEscena
                ? `h-12 w-12 bg-gradient-to-br ${gradient} shadow-[0_6px_22px_rgba(0,0,0,0.45)]`
                : 'h-8 w-8 border border-dashed border-white/15'
            }`}
          >
            <BookOpen size={enEscena ? 20 : 13} className={enEscena ? 'text-white drop-shadow-sm' : 'text-slate-600'} />
          </span>
        </span>
        <span className={rotulo(enEscena)}>Memoria</span>
      </div>
    </div>
  );
};

// ── La frase de memoria ─────────────────────────────────────────────────────
// Sustituye al verso de la vitrina en la forma ya recorrida: el verso invita,
// y aquí ya no hay a qué invitar. La memoria dice qué le pasó a la persona, con
// sus fechas. Las fechas vienen del servidor (el registro local no guarda
// cuándo se respondió); si no llegan, la frase se dice sin ellas. Nunca se
// vuelve al verso.
const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const VENTANA_MAXIMA_DIAS = 7;

const fechaCorta = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
};

const useFechasDeLaForma = (portal, activo) => {
  const { isDevAuth } = useAuth();
  const [fechas, setFechas] = useState(null);
  useEffect(() => {
    if (!activo || !portal || isDevAuth) { setFechas(null); return undefined; }
    let vigente = true;
    (async () => {
      try {
        const res = await fetch(`${OBRA_API_URL}/api/huella?anon_id=${encodeURIComponent(ensureAnonId())}`);
        const data = await res.json();
        if (!vigente || !res.ok || !data.ok) return;
        const deEstaForma = (data.sesiones ?? []).filter((sesion) => sesion.miniverso_id === portal);
        const ultima = deEstaForma[deEstaForma.length - 1];
        if (!ultima) return;
        setFechas({
          entrada: ultima.created_at ?? null,
          regreso: ultima.bitacora_completed_at ?? null,
          disponible: ultima.bitacora_available_at ?? null,
        });
      } catch {}
    })();
    return () => { vigente = false; };
  }, [portal, activo, isDevAuth]);
  return fechas;
};

const diasEntre = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
const enPalabras = (n) => (['', 'un día', 'dos días', 'tres días', 'cuatro días', 'cinco días', 'seis días', 'siete días'][n] ?? `${n} días`);

const FraseDeMemoria = ({ portal, enEscena, sinCierre = false }) => {
  const fechas = useFechasDeLaForma(portal, true);
  const entrada = fechaCorta(fechas?.entrada);
  let lineas;
  if (enEscena) {
    const espera = fechas?.entrada && fechas?.regreso ? enPalabras(diasEntre(fechas.entrada, fechas.regreso)) : null;
    lineas = [
      entrada ? `Entraste el ${entrada} con una intuición.` : 'Entraste con una intuición.',
      espera ? `Volviste ${espera} después y la respondiste.` : 'Volviste días después y la respondiste.',
      'Esto es lo que quedó.',
    ];
    // En escritorio lo que quedó está del otro lado, en el pozo.
    if (sinCierre) lineas.pop();
  } else {
    const cerrada = fechas?.disponible
      && Date.now() > new Date(fechas.disponible).getTime() + VENTANA_MAXIMA_DIAS * 86400000;
    lineas = [
      entrada ? `Entraste el ${entrada}.` : 'Entraste con una intuición.',
      cerrada ? 'La escena quedó abierta.' : 'La escena sigue abierta.',
    ];
  }
  return (
    <p className="memoria-descripcion mt-2 text-sm leading-relaxed text-slate-300/80">
      {lineas.map((linea) => <span key={linea} className="block">{linea}</span>)}
    </p>
  );
};

/* ─── Constantes ───────────────────────────────────────────────────────── */

const MERCH_BASE = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch';
const BASE_POSTER = `${MERCH_BASE}/posters`;

const PORTAL_GRADIENT = {
  obra:        'from-purple-400 via-fuchsia-500 to-rose-500',
  literatura:  'from-emerald-400 via-teal-500 to-cyan-500',
  artesanias:  'from-amber-400 via-orange-500 to-rose-500',
  grafico:     'from-fuchsia-400 via-purple-500 to-indigo-500',
  cine:        'from-rose-500 via-red-500 to-fuchsia-500',
  sonoridades: 'from-sky-400 via-cyan-500 to-indigo-500',
  movimiento:  'from-sky-400 via-emerald-500 to-cyan-500',
  juegos:      'from-amber-400 via-yellow-500 to-orange-500',
  oraculo:     'from-indigo-400 via-violet-500 to-purple-500',
};

// Emblemas de app ya presentados en la introducción de cada portal. Se cargan
// completos con object-contain: la esfera funciona como marco, no como máscara.
const PORTAL_APP_ICON_URL = {
  obra:        `${MERCH_BASE}/la_obra.png`,
  literatura:  `${MERCH_BASE}/literatura.png`,
  artesanias:  `${MERCH_BASE}/la_taza.png`,
  grafico:     `${MERCH_BASE}/los_graficos.png`,
  cine:        `${MERCH_BASE}/cortos.png`,
  sonoridades: `${MERCH_BASE}/sonoridades.png`,
  movimiento:  `${MERCH_BASE}/lasdiosas.png`,
  juegos:      `${MERCH_BASE}/juegos.png`,
  oraculo:     `${MERCH_BASE}/el_oraculo.png`,
};

const PORTAL_POSTER = {
  obra:        `${BASE_POSTER}/poster_obra.png`,
  artesanias:  `${BASE_POSTER}/poster_artesanias.png`,
  literatura:  `${BASE_POSTER}/poster_literatura.png`,
  grafico:     `${BASE_POSTER}/poster_graficos.png`,
  cine:        `${BASE_POSTER}/cine.png`,
  sonoridades: `${BASE_POSTER}/poster_sonoridades.png`,
  movimiento:  `${BASE_POSTER}/poster_movimiento.png`,
  juegos:      `${BASE_POSTER}/poster_juegos.png`,
  oraculo:     `${BASE_POSTER}/poster_oraculo.png`,
};

const HOLISTIC_QUESTION = '¿Qué le responderías, con tus propias palabras, a lo que esta obra cree saber de tus emociones?';

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 13) % 97) + 1.5,
  top:  ((i * 53 + 7)  % 93) + 2,
  size: i % 5 === 0 ? 2 : 1,
  opacity: 0.1 + (i % 5) * 0.08,
}));

/* ─── Constelación ──────────────────────────────────────────────────────── */

// La figura del render de Carlos (14 nov 2026): «ya no es un centro y sus
// satélites. De hecho así sí parece una verdadera constelación que al clicar
// una forma, esta se pasa al primer plano (la esquina inferior derecha)».
// Nueve lugares sobre dos brazos que se enroscan; la forma elegida va al
// primer plano y las demás conservan el orden del catálogo y se recorren por
// la figura. Es un concepto a prueba (Carlos: «lo vamos a probar»): los
// brazos están dibujados aquí, no son su render.
// Cada lugar: centro (x, y) en % de la caja 4:3 y diámetro en % de su ancho.
const LUGARES = [
  { x: 85, y: 79, d: 21 },    // primer plano
  { x: 60.3, y: 78, d: 10.5 },
  { x: 44.7, y: 73.5, d: 11 },
  { x: 31.7, y: 62.5, d: 11 },
  { x: 25.7, y: 43.5, d: 11.5 },
  { x: 64.7, y: 50, d: 10.5 },
  { x: 69, y: 21.5, d: 11.5 },
  { x: 48.5, y: 15.5, d: 10.5 },
  { x: 16.5, y: 15, d: 13 },
];
const BRAZOS = [
  // brazo de arriba: del fondo al primer plano
  'M66,45 C108,62 150,30 194,46 S252,40 276,64 C312,96 300,132 259,150 C214,172 246,206 296,200 C328,196 352,214 340,238',
  // brazo de abajo
  'M103,130 C88,160 104,180 127,187 S160,214 179,220 S220,237 241,234 S300,252 340,238',
  // hebra exterior
  'M66,45 C14,84 26,146 103,130',
  // el rizo junto al primer plano
  'M340,238 C318,236 306,218 316,206 C324,197 338,202 336,212 C335,218 328,219 326,214',
];

// En pantallas angostas la figura no es este dibujo: las esferas se acomodan
// por regla en el marco que haya y el hilo se traza por donde quedaron
// (constelacionEnOndas.js; Carlos, 18 nov 2026). Antes, ese mismo día, hubo
// tres intentos con figuras dibujadas para teléfono —una serpentina que se
// leía como un 8, una espiral y esta misma figura volteada y estirada—; la
// volteada no servía en pantallas chicas, donde el marco no alcanza la altura.
// Al abrir, la figura de siempre: la del render en escritorio, las ondas en
// teléfono. Con cada clic en otra forma, un garabato nuevo
// (constelacionGarabato.js; Carlos, 18 nov 2026: «siempre diferentes maneras
// de hacer las conexiones»). El hilo nuevo se dibuja de punta a punta.
// Los dos botones de ensayo, solo en local: en escritorio llevan texto y son más anchos.
const izquierdaReservada = (ancho) => (import.meta.env.DEV ? (ancho >= 560 ? 320 : 96) : 0);

// Al fondo del pozo (Carlos, 18 nov 2026: «cuando llegue al fondo del pozo,
// desaparezcan las constelaciones y aparezca más nítida la imagen de fondo que
// corresponde a la forma»), el hilo y las esferas se apagan. Primero se quedó
// la esfera de la forma; esa misma noche se fue también (Carlos: «quizás se
// vería mejor sin el icono»).
function Constellation({ centerKey, onSelect, marco = null, enOndas = false, sinConstelacion = false }) {
  const i0 = Math.max(0, CATALOG.findIndex(p => p.key === centerKey));
  const N = CATALOG.length;
  // Cada cambio de forma cuenta. La semilla base cambia en cada visita, así
  // que tampoco se repite la serie de figuras.
  const cambios = useRef(0);
  const formaPrevia = useRef(centerKey);
  const semillaBase = useRef(1 + Math.floor(Math.random() * 100000));
  if (formaPrevia.current !== centerKey) {
    formaPrevia.current = centerKey;
    cambios.current += 1;
  }
  const W = marco?.ancho ?? 0;
  const H = marco?.alto ?? 0;
  const vuelta = cambios.current;
  // La figura se traza una vez por forma elegida y por ancho de pantalla. Si
  // solo cambia el alto —el bloque morado que se abre o se cierra—, la misma
  // figura se estira o se encoge, sin volver a trazarse (Carlos, 18 nov 2026:
  // «todo se reacomoda y eso es molesto. Se pierde la atención lo que
  // sucedió»). Hasta ese día, abrir el bloque sembraba otro garabato.
  const disposicion = useRef({ clave: null });
  const clave = `${enOndas ? 'ondas' : 'acostada'}|${vuelta}|${marco?.clave ?? W}`;
  if (W > 0 && H > 0 && disposicion.current.clave !== clave) {
    const ondasNuevas = enOndas ? acomodarEnOndas(W, H, 0, N - 1, izquierdaReservada(W)) : null;
    let garabatoNuevo = null;
    if (vuelta > 0) {
      // Las esferas conservan el tamaño que tenían en la figura de siempre.
      const D = ondasNuevas ? ondasNuevas.ancla.d : Math.round(0.21 * W);
      const d = ondasNuevas ? ondasNuevas.lugares[0].d : Math.max(44, Math.round(0.115 * W));
      garabatoNuevo = trazarGarabato(W, H, semillaBase.current + vuelta, { D, d, cuantas: N - 1, izquierda: izquierdaReservada(W) });
    }
    disposicion.current = { clave, ondas: ondasNuevas, garabato: garabatoNuevo, W0: W, H0: H };
  }
  const { ondas = null, garabato = null, W0 = W, H0 = H } = disposicion.current;
  const enPixeles = garabato ?? ondas;
  // Los lugares van en proporción del marco en que se trazaron; si el marco
  // se achica, las esferas se achican en la misma medida y no se enciman.
  const escala = W0 > 0 && H0 > 0 ? Math.min(1, W / W0, H / H0) : 1;
  const figura = garabato ? 'garabato' : ondas ? 'en-ondas' : 'acostada';
  const trazos = garabato
    ? [{ d: garabato.hilo }]
    : ondas
      // El cierre va tenue, como la hebra exterior que cierra la figura de escritorio.
      ? [{ d: ondas.hilo }, { d: ondas.cierre, tenue: true }].filter((t) => t.d)
      : BRAZOS.map((d, i) => ({ d, tenue: i === 2 }));

  // Al llegar, la figura ya no se dibuja provisional y luego se acomoda: hasta
  // saber el tamaño de su marco no hay constelación, y la primera colocación
  // aparece en su lugar, con un fundido; el viaje de las esferas (0.6 s) queda
  // para cuando se toca otra forma (Carlos, 24 nov 2026: «se acomoda 3 veces»).
  const medida = W > 0 && H > 0;
  const [colocada, setColocada] = useState(false);
  useEffect(() => {
    if (!medida || colocada) return undefined;
    const cuadro = window.requestAnimationFrame(() => window.requestAnimationFrame(() => setColocada(true)));
    return () => window.cancelAnimationFrame(cuadro);
  }, [medida, colocada]);
  if (!medida) return <div className="relative w-full h-full" />;

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <svg data-figura={figura} data-estilo={garabato?.estilo} viewBox={enPixeles ? `0 0 ${W0} ${H0}` : '0 0 400 300'} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" style={{ zIndex: 1, opacity: sinConstelacion ? 0 : 1, transition: 'opacity 0.9s ease' }} aria-hidden="true">
        <defs>
          <filter id="chHalo" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="16" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="chHebra" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="9" xChannelSelector="G" yChannelSelector="R" />
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id="chBrillo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
        </defs>
        {trazos.map(({ d, tenue }, i) => {
          // El garabato se dibuja de punta a punta mientras las esferas viajan.
          const dibujo = garabato
            ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.3, ease: [0.45, 0, 0.2, 1] } }
            : { initial: false };
          return (
            <g key={`${figura}-${vuelta}-${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={tenue ? 0.45 : 1}>
              {/* Sin engrosarse ni adelgazarse cuando la figura se estira. */}
              <motion.path d={d} stroke="rgba(214,150,70,0.42)" strokeWidth="13" filter="url(#chHalo)" vectorEffect={enPixeles ? 'non-scaling-stroke' : undefined} {...dibujo} />
              <motion.path d={d} stroke="rgba(236,180,100,0.45)" strokeWidth="4" filter="url(#chHebra)" vectorEffect={enPixeles ? 'non-scaling-stroke' : undefined} {...dibujo} />
              <motion.path d={d} stroke="rgba(240,190,110,0.55)" strokeWidth="2" filter="url(#chBrillo)" vectorEffect={enPixeles ? 'non-scaling-stroke' : undefined} {...dibujo} />
              <motion.path d={d} stroke="rgba(255,230,180,0.55)" strokeWidth="0.6" vectorEffect={enPixeles ? 'non-scaling-stroke' : undefined} {...dibujo} />
            </g>
          );
        })}
      </svg>

      {CATALOG.map((forma, i) => {
        const turno = (i - i0 + N) % N;
        const lugar = enPixeles ? (turno === 0 ? enPixeles.ancla : enPixeles.lugares[turno - 1]) : LUGARES[turno];
        if (!lugar) return null;
        const alFrente = forma.key === centerKey;
        const apagada = sinConstelacion;
        const avance = readResonanceProgress(forma.key);
        // Los emblemas recortados de las esferas (lib/resonanceDramaturgy.js,
        // 24 nov 2026): los originales traen una orilla semitransparente que
        // asomaba como franja oscura dentro del círculo.
        const icono = PORTAL_EMBLEM_URL[forma.key] ?? PORTAL_APP_ICON_URL[forma.key];
        return (
          <button
            key={forma.key}
            type="button"
            onClick={alFrente || apagada ? undefined : () => onSelect(forma.key)}
            aria-current={alFrente ? 'true' : undefined}
            aria-hidden={apagada ? 'true' : undefined}
            tabIndex={apagada ? -1 : undefined}
            style={{
              position: 'absolute',
              left: enPixeles ? `${(lugar.x / W0) * 100}%` : `${lugar.x}%`,
              top: enPixeles ? `${(lugar.y / H0) * 100}%` : `${lugar.y}%`,
              transform: 'translate(-50%, -50%)',
              width: enPixeles ? `${lugar.d * escala}px` : `${lugar.d}%`,
              // En la figura dibujada las esferas chicas no bajan del tamaño
              // de un dedo; en ondas, la regla ya lo cuida.
              minWidth: enPixeles || alFrente ? undefined : '2.75rem',
              aspectRatio: '1',
              zIndex: alFrente ? 4 : 3,
              cursor: alFrente || apagada ? 'default' : 'pointer',
              opacity: apagada ? 0 : 1,
              pointerEvents: apagada ? 'none' : undefined,
              transition: colocada
                ? 'left 0.6s cubic-bezier(.5,.05,.2,1), top 0.6s cubic-bezier(.5,.05,.2,1), width 0.6s cubic-bezier(.5,.05,.2,1), opacity 0.9s ease'
                : 'none',
            }}
            className={`group overflow-hidden rounded-full bg-black ${alFrente
              ? 'ring-2 ring-white/30 shadow-[0_0_60px_rgba(240,190,110,0.28)]'
              : 'border border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:border-white/45'}`}
            aria-label={alFrente ? (forma.form ?? forma.name) : `Abrir ${forma.form ?? forma.name}`}
            title={forma.form ?? forma.name}
          >
            {icono ? (
              <img
                src={icono}
                alt=""
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full scale-[1.04] object-cover transition duration-300 ${alFrente ? '' : 'group-hover:scale-[1.09]'}`}
              />
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-10px_-12px_20px_rgba(0,0,0,0.48),inset_7px_7px_13px_rgba(255,255,255,0.12)]"
              style={{ background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.18), transparent 32%)' }}
            />
            {!alFrente && avance.l2Done && <span className="absolute bottom-[8%] right-[10%] h-2 w-2 rounded-full border border-black/60 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
            {!alFrente && avance.l1Done && !avance.l2Done && <span className="absolute bottom-[8%] right-[10%] h-2 w-2 rounded-full border border-black/60 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />}
          </button>
        );
      })}
    </motion.div>
  );
}

/* ─── Panel inferior ────────────────────────────────────────────────────── */

// Un solo bloque por forma al centro (Carlos, 27 oct 2026): su nombre y una
// fila de acción. Sin categoría ni verso (Carlos, 28 oct 2026: «Simplifiqué el
// bloque, quitando la ceja y los tres versos»). Nada queda suelto entre la
// constelación y el bloque; la línea de la forma va arriba de él.
// Desde el 18 nov 2026 (Carlos: «necesito que el chevron esté en el renglón
// de arriba, donde está la ceja y el título. Y luego borras el mensaje de al
// entrar en escena… Y ya así, ya los dos son iguales») la cabecera misma es
// el renglón que despliega: un solo renglón cerrado, para no apretar la
// constelación en pantallas chicas. Igual en el bloque de la espera.
// La bandeja (Carlos, 24 nov 2026): en pantallas chicas el bloque morado ya
// no se despliega empujando la constelación, que se encogía y volvía a trazar
// el lazo. Cerrado se queda en su lugar; abierto, su contenido sube encima, en
// vidrio, desde la orilla de abajo, y nada de atrás se mueve. `anclaRef` es el
// bloque cerrado: la bandeja toma su ancho y su pie.
// Deslizar el dedo (Carlos, 24 nov 2026: «le estoy haciendo swipe y no
// obedece»): hacia arriba sobre el bloque cerrado lo abre; hacia abajo sobre la
// bandeja la cierra. Un deslizamiento no cuenta como toque.
const gestosDeDeslizar = ({ alSubir = null, alBajar = null }) => {
  let inicio = null;
  return {
    onTouchStart: (e) => { const t = e.touches[0]; inicio = t ? { x: t.clientX, y: t.clientY } : null; },
    onTouchEnd: (e) => {
      const t = e.changedTouches[0];
      if (!inicio || !t) return;
      const dy = t.clientY - inicio.y;
      const dx = t.clientX - inicio.x;
      inicio = null;
      if (Math.abs(dy) < 28 || Math.abs(dy) < Math.abs(dx)) return;
      if (dy < 0 && alSubir) { e.preventDefault(); alSubir(); }
      if (dy > 0 && alBajar) { e.preventDefault(); alBajar(); }
    },
  };
};

const CURVA = [0.2, 0.8, 0.2, 1];

// El alto de una caja que cambia de contenido: la primera vez se fija sin
// moverse; después llega a su nuevo alto despacio. Con `animate={{ height }}`
// framer leía el alto ya cambiado y no animaba nada.
function useAltoQueRespira() {
  const alto = useMotionValue('auto');
  const fijado = useRef(false);
  const llevarA = (px) => {
    if (!fijado.current) { fijado.current = true; alto.set(px); return; }
    animate(alto, px, { duration: 0.4, ease: CURVA });
  };
  return [alto, llevarA];
}

// Un contenido que cambia sin desaparecer (Carlos, 24 nov 2026: «no me gusta
// que desaparezca el bloque morado y el timeline cada vez que cambia la
// constelación… que el bloque morado refleje lo que se va cambiando»). La
// caja se queda; lo de adentro se funde con lo nuevo y la caja toma su nuevo
// alto despacio, así nada de abajo brinca.
function Fundido({ k, children }) {
  const medida = useRef(null);
  const [alto, llevarA] = useAltoQueRespira();
  useLayoutEffect(() => {
    const el = medida.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const medir = () => llevarA(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div style={{ height: alto }}>
      <div ref={medida} className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// El bloque morado en escritorio: siempre abierto, una sola caja que se queda
// mientras cambia la forma del centro.
function CajaQueRespira({ k, className, children, ...resto }) {
  const caja = useRef(null);
  const contenido = useRef(null);
  const [alto, llevarA] = useAltoQueRespira();
  useLayoutEffect(() => {
    const s = caja.current;
    const c = contenido.current;
    if (!s || !c || typeof ResizeObserver === 'undefined') return undefined;
    const medir = () => {
      const cs = window.getComputedStyle(s);
      const orillas = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
        .reduce((n, p) => n + (parseFloat(cs[p]) || 0), 0);
      llevarA(c.offsetHeight + orillas);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.section
      ref={caja}
      className={className}
      style={{ overflow: 'hidden', height: alto }}
      {...resto}
    >
      <div ref={contenido} className="relative shrink-0">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={k}
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

// La bandeja en pantallas chicas (Carlos, 24 nov 2026: «debería de verse como
// una bandeja en realidad que empiece desde afuera del viewport… que se vea la
// animación en cuanto entre… y que quede abierta desde el inicio, que el
// usuario pueda bajarla… o incluso si interactúa con otra esfera se vuelve a
// bajar… no como un botón flotante»). Nace debajo de la orilla de la
// pantalla y sube; cerrada, enseña solo su cabecera en el lugar del bloque;
// abierta, sube en vidrio sobre la constelación. `anclaRef` es el bloque
// cerrado (invisible) que le guarda su lugar en la página.
const SANGRIA = 28;
function Hoja({ nodo, anclaRef, abierto, onAbrir = null, onCerrar = null, k, children }) {
  const [caja, setCaja] = useState(null);
  useLayoutEffect(() => {
    const ancla = anclaRef.current;
    if (!nodo || !ancla || typeof ResizeObserver === 'undefined') return undefined;
    const medir = () => {
      const a = ancla.getBoundingClientRect();
      const n = nodo.getBoundingClientRect();
      setCaja({ left: a.left - n.left, width: a.width, cerrada: Math.round(n.bottom - a.top) + SANGRIA });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(ancla);
    ro.observe(nodo);
    return () => ro.disconnect();
  }, [nodo, anclaRef]);
  if (!nodo || !caja) return null;
  return createPortal(
    <motion.div
      className="bandeja-de-vidrio bandeja-de-vidrio--hoja pointer-events-auto absolute overflow-hidden"
      style={{ left: caja.left, width: caja.width, bottom: -SANGRIA }}
      initial={{ y: '100%', height: abierto ? 'auto' : caja.cerrada }}
      animate={{ y: 0, height: abierto ? 'auto' : caja.cerrada }}
      transition={{
        y: { duration: 0.7, ease: CURVA, delay: 0.35 },
        height: { duration: 0.45, ease: CURVA },
      }}
      data-bandeja-abierta={abierto ? 'true' : 'false'}
      {...gestosDeDeslizar({ alSubir: abierto ? null : onAbrir, alBajar: abierto ? onCerrar : null })}
    >
      <div style={{ paddingBottom: `calc(${SANGRIA}px + max(1rem, env(safe-area-inset-bottom, 0px)))` }}>
        <div className="relative">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>,
    nodo,
  );
}

function CompletedScenePanel({
  portal,
  entry,
  onDownloadSouvenir,
  souvenirGenerando,
  onGoToSite,
  onUltimaPregunta,
  ultimaPreguntaVista,
  regresoRecien = false,
  bloqueEnLaCabina = false,
  sinLinea = false,
}) {
  // El recuerdo comparte renglón con el nombre de la forma (Carlos, 20 sep
  // 2026). En escritorio vive al pie de la cabina.
  const chip = onDownloadSouvenir ? (
    <button
      type="button"
      onClick={() => void onDownloadSouvenir()}
      disabled={souvenirGenerando}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[0.62rem] text-slate-200/90 transition hover:border-white/30 hover:text-white disabled:opacity-50 lg:hidden"
    >
      <Download size={12} aria-hidden="true" />
      {souvenirGenerando ? 'Preparando…' : 'Mi recuerdo'}
    </button>
  ) : null;

  return (
    <div className={`flex flex-col ${bloqueEnLaCabina ? 'gap-5' : 'gap-4'}`}>
      {/* En escritorio el nombre de la forma se queda de este lado, donde
          estuvo durante la espera y el regreso (Carlos, 14 nov 2026: «no tiene
          razón de ser en el lado derecho, debería de quedarse en el lado
          izquierdo como siempre estuvo»). Debajo, las dos fechas del recorrido. */}
      {bloqueEnLaCabina ? (
        <div data-titulo-de-la-memoria>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
          <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>{entry.form ?? entry.name}</h2>
          <FraseDeMemoria portal={portal} enEscena sinCierre />
        </div>
      ) : null}
      {/* Al fondo del pozo la línea se retira: de este lado quedan la ceja, el
          nombre y la frase (Carlos, 18 nov 2026: «quitas la línea de
          tiempo»). */}
      {sinLinea ? null : <LineaDeLaForma portal={portal} enFoco focoCompleto enEscena />}
      {/* El bloque: su nombre y la fila «Lo que falta · Contestarle a la obra».
          Al abrirla, el gato propone la palabra dentro de la frase y «Pasar al
          acto final» lleva a la cabina. */}
      {/* En escritorio el bloque va al panel derecho, al fondo del pozo
          (ResonanceModal lo monta ahí): de este lado queda la línea. */}
      {bloqueEnLaCabina ? null : (
        <LoQueQuedo
          portal={portal}
          entry={entry}
          chip={chip}
          late={!ultimaPreguntaVista}
          regresoRecien={regresoRecien}
          onUltimaPregunta={onUltimaPregunta}
          onGoToSite={onGoToSite}
        />
      )}
    </div>
  );
}

function HolograficoPanel({
  centerKey,
  homeKey,
  onStartBitacora,
  onUltimaPregunta,
  ultimaPreguntaVista,
  regresoRecien = false,
  recommendedFormatId,
  onNavigateToRecommendation,
  onGoToSite,
  onOpenVideo,
  onRequireLogin,
  readOnly = false,
  bloqueEnLaCabina = false,
  avisoDeEspera = null,
  onDownloadSouvenir = null,
  souvenirGenerando = false,
  alFondoDelPozo = false,
  soloElTitulo = false,
  nodoBandeja = null,
  onExplorarMiniverso = null,
}) {
  const isHome = centerKey === homeKey;
  const entry = CATALOG.find(p => p.key === centerKey);
  const progress = readResonanceProgress(centerKey);
  const hasL1 = progress.l1Done;
  const hasL2 = progress.l2Done;
  const hasL3 = progress.l3Done;
  const hasBitacora = progress.bitacoraDone;

  // El bloque morado —el de la espera con la propia forma al centro, el de
  // «Al entrar en escena…» con otra—: en pantallas chicas es la bandeja (ver
  // Hoja), que llega abierta con la espera y se baja al tocar otra esfera.
  const [alEntrarAbierto, setAlEntrarAbierto] = useState(() => !bloqueEnLaCabina && isHome && Boolean(avisoDeEspera));
  const claveAnterior = useRef(centerKey);
  useEffect(() => {
    if (claveAnterior.current === centerKey) return;
    claveAnterior.current = centerKey;
    setAlEntrarAbierto(false);
  }, [centerKey]);
  // En escritorio el bloque morado va siempre desplegado y sin chevron
  // (Carlos, 18 nov 2026): ahí sobra espacio y abrir y cerrar solo movía la
  // constelación.
  const siempreAbierto = bloqueEnLaCabina;
  const bloqueRef = useRef(null);

  // La invitación a la cuenta (Carlos, 18 nov 2026: «el momento donde un
  // usuario se puede dar cuenta de lo que se trata este método es justo
  // cuando está viendo la constelación e interactúa con ella. En ese momento
  // se puede aprovechar para dar este aviso, en vez de que salga un toast»).
  // Sin sesión, tocar «Interpretar…» en otra forma ya no avisa con un toast:
  // el bloque morado de esa forma se vuelve la invitación. Elegir la forma y
  // entrar quedan en un mismo gesto; al entrar, la continuación lleva a ella
  // y deja anotado desde dónde llegó la persona a su cuenta.
  const [invitacion, setInvitacion] = useState(false);
  useEffect(() => { setInvitacion(false); }, [centerKey]);
  const entrarConCorreo = () => {
    writePendingContinuation({
      source: 'constelacion-de-la-memoria',
      showcaseId: entry?.showcase,
      forma: entry?.form ?? entry?.name ?? null,
      presentation: 'narrative-video',
    });
    onRequireLogin?.();
  };

  const homeProgress = readResonanceProgress(homeKey);
  const homeL2 = homeProgress.l2Done;
  const homeL3 = homeProgress.l3Done;
  const homeBitacora = homeProgress.bitacoraDone;

  // El recorrido —la espera de la propia forma y las demás formas sin
  // terminar— comparte la misma línea y el mismo bloque: al cambiar la forma
  // del centro, la caja se queda y su contenido se funde (24 nov 2026). Lo
  // demás (la escena terminada, el título del regreso) cambia entero.
  const esEspera = isHome && !homeBitacora && !soloElTitulo && Boolean(avisoDeEspera);
  const esOtra = !isHome && !hasBitacora;
  const familia = esEspera || esOtra ? 'recorrido' : `pieza-${centerKey}`;

  const recorrido = () => {
    const nombre = entry.form ?? entry.name;
    const conNotas = esOtra && Boolean(showcaseDefinitions[entry.showcase]?.iaProfile);
    const conCuerpo = esEspera || conNotas;
    const abierto = !siempreAbierto && conCuerpo && alEntrarAbierto;
    const cerrar = () => { setAlEntrarAbierto(false); setInvitacion(false); };

    const linea = esEspera ? (
      <LineaDeLaForma
        portal={homeKey}
        enFoco
        focoCompleto={homeL3}
        enEscena={false}
        regresoAbierto={!!avisoDeEspera?.regreso || momentoDeLaForma(homeKey) === 'regreso'}
      />
    ) : (
      <LineaDeLaForma portal={centerKey} enFoco={hasL1} focoCompleto={hasL3} enEscena={hasBitacora} regresoAbierto={momentoDeLaForma(centerKey) === 'regreso'} />
    );

    // La ceja dice el momento, con la palabra de la línea: esperando, «Entre
    // bambalinas»; con la pregunta de vuelta, «El Regreso» (18 nov 2026).
    const ceja = esEspera
      ? (avisoDeEspera.regreso ? 'El Regreso' : 'Entre bambalinas')
      : (hasL1 ? 'Sigue donde quedaste' : 'Otra forma de la obra');
    const titulo = (
      <div className="min-w-0">
        <p className="huella-puerta__eyebrow" data-ceja-del-bloque>{ceja}</p>
        <h2 className={`min-w-0 font-display text-2xl leading-snug ${entry.color}`}>{nombre}</h2>
      </div>
    );

    const cuerpoDeEspera = esEspera ? (
      <>
        <div className="bloque-forma__abierto" data-espera-desplegada>
          <p className="huella-puerta__titulo text-slate-100">{avisoDeEspera.titulo.replace(/…$/, '.')}</p>
          {/* En la espera, la instrucción y el aviso, en teléfono y en
              escritorio (el globo del gato queda para el regreso, 18 nov
              2026). El día del regreso ya no hay nada que anunciar: el bloque
              guarda cómo quedó la escena. */}
          {avisoDeEspera.instruccion
            ? <p className="memoria-descripcion text-sm leading-relaxed text-slate-300/80">{avisoDeEspera.instruccion}</p>
            : <FraseDeMemoria portal={homeKey} enEscena={false} />}
          {avisoDeEspera.telefono ? (
            <form
              className="caja-de-bambalinas__aviso"
              data-aviso-en-la-memoria
              onSubmit={(e) => { e.preventDefault(); avisoDeEspera.telefono.onEnviar(); }}
            >
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={avisoDeEspera.telefono.valor}
                onChange={(e) => avisoDeEspera.telefono.onCambio(e.target.value)}
                placeholder={avisoDeEspera.telefono.placeholder}
                aria-label={avisoDeEspera.telefono.placeholder}
                className="caja-de-bambalinas__campo"
              />
              <button type="submit" disabled={avisoDeEspera.telefono.valor.trim().length < 8} className="caja-de-bambalinas__avisar">
                {avisoDeEspera.telefono.boton}
              </button>
            </form>
          ) : null}
          {avisoDeEspera.recuerdo ? (
            <button
              type="button"
              onClick={() => void avisoDeEspera.recuerdo.onRecuerdo()}
              disabled={avisoDeEspera.recuerdo.ocupado}
              data-recuerdo-en-la-memoria
              className="caja-de-bambalinas__recuerdo"
            >
              <Download size={15} aria-hidden="true" />
              {avisoDeEspera.recuerdo.titulo}
            </button>
          ) : null}
        </div>
        {/* La salida a la ficha (Carlos, 24 nov 2026), con el mismo botón que
            «Interpretar …» del bloque de otra forma. «Conoce este miniverso»
            y no «Explorar»: explorar exige más energía (Carlos, 24 nov). */}
        {onExplorarMiniverso ? (
          <button type="button" onClick={onExplorarMiniverso} className="ultima-pregunta__salida" data-explorar-miniverso>
            Conoce este miniverso
          </button>
        ) : null}
      </>
    ) : null;

    const cuerpoDeOtra = conNotas ? (
      <IAInsightCard
        {...showcaseDefinitions[entry.showcase].iaProfile}
        compact
        onRequireLogin={onRequireLogin}
        travelEyebrow={null}
        isOpen={siempreAbierto || alEntrarAbierto}
        onToggle={() => setAlEntrarAbierto((v) => !v)}
        travelLabel={`${hasL1 ? 'Volver a' : 'Interpretar'} ${nombre}`}
        travelFormLabel={nombre}
        onTravel={() => onOpenVideo(entry.showcase)}
        onSinSesion={() => setInvitacion(true)}
        /* Texto C, elegido por Carlos (18 nov 2026): la convención teatral
           (interpretar, acto final) y lo que de verdad pasa (se guarda, un
           texto tuyo). Antes de La Réplica no se dice «réplica». */
        alterno={(
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed text-slate-200/90">
              Si interpretas otra forma, guardamos lo que digas en cada una. En el acto final puedes juntarlo en un texto tuyo y decidir si lo compartes.
            </p>
            <p className="text-xs leading-relaxed text-slate-400/80">Para guardarlo, tu correo.</p>
          </div>
        )}
        alternoActivo={invitacion}
        /* El mismo botón, que cambia (Carlos, 18 nov 2026). Al cerrar el
           bloque, vuelven las notas. */
        alternoBoton={{ label: 'Iniciar sesión', onClick: entrarConCorreo }}
        enBloque
      />
    ) : null;
    const cuerpo = esEspera ? cuerpoDeEspera : cuerpoDeOtra;
    const marcas = esEspera ? { 'data-aviso-de-espera': true } : { 'data-bloque-de-otra-forma': true };

    return (
      <div className="flex flex-col gap-5">
        {/* Con la bandeja abierta la línea se desvanece en su lugar (no se
            quita: nada se mueve) para que su texto no se lea a través del
            vidrio (24 nov 2026). */}
        <div
          className={`transition-opacity duration-300 ${abierto ? 'pointer-events-none opacity-0' : ''}`}
          {...(esEspera ? { 'data-linea-de-la-espera': true } : { 'data-linea-de-otra-forma': true })}
        >
          <Fundido k={centerKey}>{linea}</Fundido>
        </div>
        {/* Antes del regreso el libreto no pregunta nada: lo que pasa lo dice
            el bloque morado. La pregunta y «Es tu turno» aparecen cuando la
            pregunta ya volvió. */}
        {esEspera && !readOnly ? (
          <VitranaQuestionReveal
            question={HOLISTIC_QUESTION}
            portal={homeKey}
            autoReveal
            l2Done={homeL2}
            l3Done={homeL3}
            bitacoraCompleted={homeBitacora}
            label={null}
            buttonLabel="Es tu turno"
            onAnswer={onStartBitacora}
            showAction={!readOnly}
          />
        ) : null}
        {siempreAbierto ? (
          <CajaQueRespira k={centerKey} className="bloque-forma bloque-forma--abierto" {...marcas}>
            <div className="bloque-forma__cabecera">{titulo}</div>
            {cuerpo}
          </CajaQueRespira>
        ) : (
          <>
            {/* El lugar de la bandeja cerrada: invisible, guarda su alto. */}
            <section ref={bloqueRef} className="bloque-forma" style={{ visibility: 'hidden' }} aria-hidden="true">
              <div className={`bloque-forma__cabecera${conCuerpo ? ' bloque-forma__cabecera--plegable' : ''}`}>{titulo}</div>
            </section>
            <Hoja
              nodo={nodoBandeja}
              anclaRef={bloqueRef}
              abierto={abierto}
              onAbrir={conCuerpo ? () => setAlEntrarAbierto(true) : null}
              onCerrar={cerrar}
              k={centerKey}
            >
              <section className={`bloque-forma${abierto ? ' bloque-forma--abierto' : ''}`} {...marcas} data-en-bandeja>
                {conCuerpo ? (
                  <button
                    type="button"
                    onClick={() => (abierto ? cerrar() : setAlEntrarAbierto(true))}
                    aria-expanded={abierto}
                    className="bloque-forma__cabecera bloque-forma__cabecera--plegable"
                    {...(esEspera ? { 'data-renglon-de-espera': true } : { 'data-al-entrar': true })}
                  >
                    <span aria-hidden="true" className="bloque-forma__asa" />
                    {titulo}
                  </button>
                ) : (
                  <div className="bloque-forma__cabecera">{titulo}</div>
                )}
                {/* Cerrada, la bandeja enseña solo su cabecera: lo de abajo no
                    se asoma (Carlos, 24 nov 2026). */}
                {cuerpo ? (
                  <motion.div
                    className="flex flex-col gap-3"
                    initial={false}
                    animate={{ opacity: abierto ? 1 : 0 }}
                    transition={{ duration: abierto ? 0.35 : 0.15, delay: abierto ? 0.1 : 0 }}
                    aria-hidden={abierto ? undefined : 'true'}
                    style={{ pointerEvents: abierto ? 'auto' : 'none' }}
                  >
                    {cuerpo}
                  </motion.div>
                ) : null}
              </section>
            </Hoja>
          </>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={familia}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
      >
        {familia === 'recorrido' ? recorrido() : isHome ? (
          homeBitacora ? (
            <CompletedScenePanel
              portal={homeKey}
              onDownloadSouvenir={onDownloadSouvenir}
              souvenirGenerando={souvenirGenerando}
              entry={entry}
              onUltimaPregunta={onUltimaPregunta}
              ultimaPreguntaVista={ultimaPreguntaVista}
              regresoRecien={regresoRecien}
              bloqueEnLaCabina={bloqueEnLaCabina}
              sinLinea={alFondoDelPozo}
              recommendedFormatId={recommendedFormatId}
              onNavigateToRecommendation={onNavigateToRecommendation}
              onGoToSite={onGoToSite}
            />
          ) : soloElTitulo ? (
            /* El día del regreso, en escritorio, de este lado solo queda el
               título, como al fondo del pozo pero con el póster todavía oscuro
               (Carlos, 19 nov 2026). Sin constelación, sin línea y sin bloque
               morado. */
            <div data-titulo-de-la-memoria data-titulo-del-regreso>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
              <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>{entry.form ?? entry.name}</h2>
              <FraseDeMemoria portal={homeKey} enEscena={false} />
            </div>
          ) : (
            /* Sin aviso de la espera: el nombre arriba y la línea. */
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
                <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>{entry.form ?? entry.name}</h2>
                <FraseDeMemoria portal={homeKey} enEscena={false} />
              </div>
              <LineaDeLaForma
                portal={homeKey}
                enFoco
                focoCompleto={homeL3}
                enEscena={false}
                regresoAbierto={momentoDeLaForma(homeKey) === 'regreso'}
              />
              {readOnly ? null : <VitranaQuestionReveal
                question={HOLISTIC_QUESTION}
                portal={homeKey}
                autoReveal
                l2Done={homeL2}
                l3Done={homeL3}
                bitacoraCompleted={homeBitacora}
                label={null}
                buttonLabel="Es tu turno"
                onAnswer={onStartBitacora}
                showAction={!readOnly}
              />}
            </div>
          )
        ) : (
          <CompletedScenePanel
            portal={centerKey}
            onDownloadSouvenir={onDownloadSouvenir}
            souvenirGenerando={souvenirGenerando}
            entry={entry}
            onUltimaPregunta={onUltimaPregunta}
            ultimaPreguntaVista={ultimaPreguntaVista}
            regresoRecien={regresoRecien}
            bloqueEnLaCabina={bloqueEnLaCabina}
            recommendedFormatId={progress.l3Recommendation?.recommended_format_id ?? null}
            onNavigateToRecommendation={onNavigateToRecommendation}
            onGoToSite={onGoToSite}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Componente principal ──────────────────────────────────────────────── */

const CuadernoHolografico = ({
  portal,
  onDownloadSouvenir = null,
  souvenirGenerando = false,
  onStartBitacora,
  onUltimaPregunta,
  ultimaPreguntaVista = true,
  regresoRecien = false,
  recommendedFormatId,
  onNavigate,
  onGoToSite,
  onPosterChange,
  onRequireLogin,
  readOnly = false,
  bloqueEnLaCabina = false,
  avisoDeEspera = null,
  alFondoDelPozo = false,
  soloElTitulo = false,
  onExplorarMiniverso = null,
}) => {
  const navigate = useNavigate();
  const [nodoBandeja, setNodoBandeja] = useState(null);
  const location = useLocation();
  const { isMobileViewport } = useMobileVideoPresentation();
  const [centerKey, setCenterKey] = useState(portal);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoFormatId, setVideoFormatId] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => { onPosterChange?.(portal); }, []);

  // Al fondo del pozo solo queda la esfera propia: si otra forma estaba al
  // frente, vuelve la de la persona (y su fondo).
  useEffect(() => {
    if (!alFondoDelPozo && !soloElTitulo) return;
    setCenterKey(portal);
    onPosterChange?.(portal);
  }, [alFondoDelPozo, soloElTitulo, portal]);

  const handleSelect = (key) => {
    setCenterKey(key);
    onPosterChange?.(key);
  };

  // Compartido entre "vi el video, continúa" y el caso de bandera apagada
  // (RESONANCE_BRIDGE_VIDEO_ENABLED) — mismo destino, con o sin video de por
  // medio.
  const proceedToShowcase = (formatId) => {
    setVideoOpen(false);
    onNavigate(formatId);
    const portalRoute = resolvePortalRoute({ formatId });
    if (isMobileViewport && portalRoute) {
      window.setTimeout(() => navigate(portalRoute, {
        state: createPortalLaunchState(location, 'video-narrative-cta', { showcaseId: formatId }),
      }), 80);
    }
  };

  const handleOpenVideo = (showcaseId) => {
    if (!RESONANCE_BRIDGE_VIDEO_ENABLED) {
      proceedToShowcase(showcaseId);
      return;
    }
    setVideoFormatId(showcaseId);
    setVideoOpen(true);
  };

  const handleVideoNavigate = () => proceedToShowcase(videoFormatId);

  // La constelación ocupa lo que el bloque deja libre, en una caja de
  // proporción acotada, para que las nueve esferas no se aplasten cuando el
  // bloque se abre y le quita altura (Carlos, 28 oct 2026: «se aplasta la
  // constelación»). Hasta el 14 nov 2026 la caja era un cuadrado.
  const marcoRef = useRef(null);
  const [lado, setLado] = useState(0);
  const [alto, setAlto] = useState(0);
  const [enOndas, setEnOndas] = useState(false);
  // El ancho de la caja decide cuándo se vuelve a trazar la figura; el alto,
  // no (18 nov 2026).
  const [anchoDeLaCaja, setAnchoDeLaCaja] = useState(0);
  // La caja no se anima en su primera medida (pasar de «100 %» a píxeles
  // estiraba el lazo al llegar); después sí, cuando cambia (24 nov 2026).
  const [cajaMedida, setCajaMedida] = useState(false);
  useEffect(() => {
    if (!lado || cajaMedida) return undefined;
    const cuadro = window.requestAnimationFrame(() => window.requestAnimationFrame(() => setCajaMedida(true)));
    return () => window.cancelAnimationFrame(cuadro);
  }, [lado, cajaMedida]);
  useEffect(() => {
    const el = marcoRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const caja = entries[0]?.contentRect;
      if (!caja) return;
      setAnchoDeLaCaja(Math.floor(caja.width));
      // La figura es 4:3 y se deja achatar hasta 2:1 cuando el bloque se abre
      // y le quita altura: así las esferas no se encogen (14 nov 2026).
      // En pantallas angostas las esferas se acomodan por regla en todo el
      // marco, tenga la proporción que tenga (18 nov 2026).
      if (caja.width < 560) {
        setEnOndas(true);
        setLado(Math.max(0, Math.floor(caja.width)));
        setAlto(Math.max(0, Math.floor(caja.height)));
        return;
      }
      setEnOndas(false);
      const ancho = Math.max(0, Math.floor(Math.min(caja.width, caja.height * 2)));
      setLado(ancho);
      setAlto(Math.max(0, Math.floor(Math.min(caja.height, ancho * 3 / 4))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={scrollContainerRef} className="relative flex h-full touch-manipulation flex-col overflow-hidden">

      {/* Poster como fondo — mobile: visible, desktop: oculto (el modal ya lo muestra) */}
      <AnimatePresence>
        <motion.img
          key={centerKey}
          src={PORTAL_POSTER[centerKey] ?? PORTAL_POSTER.obra}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top lg:hidden"
          style={{ mixBlendMode: 'plus-lighter', zIndex: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
      </AnimatePresence>

      {/* Overlay oscuro sobre el poster (preserva estética) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 0%, rgba(5,3,9,0.35) 0%, rgba(5,3,9,0.75) 60%, rgba(5,3,9,0.92) 100%)',
          zIndex: 1,
        }}
      />

      {/* Estrellas */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
        {STARS.map(s => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.opacity }}
          />
        ))}
      </div>

      {/* Constelación: un cuadrado centrado en el espacio que queda */}
      <div
        ref={marcoRef}
        className="relative flex min-h-[8rem] flex-1 items-center justify-center p-4 lg:p-6"
        style={{ zIndex: 3 }}
      >
        <div
          className="relative"
          style={{ width: lado || '100%', height: alto || '100%', transition: cajaMedida ? 'width 0.3s ease, height 0.3s ease' : 'none' }}
        >
          <Constellation
            centerKey={centerKey}
            onSelect={handleSelect}
            marco={lado > 0 && alto > 0 ? { ancho: lado, alto, clave: anchoDeLaCaja } : null}
            enOndas={enOndas}
            sinConstelacion={alFondoDelPozo || soloElTitulo}
          />
        </div>
      </div>

      {/* Separador */}
      <div aria-hidden className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ zIndex: 3 }} />

      {/* Panel */}
      <div className="min-h-0 overflow-y-auto" style={{ zIndex: 3 }}>
        <HolograficoPanel
          centerKey={centerKey}
          homeKey={portal}
          onDownloadSouvenir={onDownloadSouvenir}
          souvenirGenerando={souvenirGenerando}
          onStartBitacora={onStartBitacora}
          onUltimaPregunta={onUltimaPregunta}
          ultimaPreguntaVista={ultimaPreguntaVista}
          regresoRecien={regresoRecien}
          recommendedFormatId={recommendedFormatId}
          onNavigateToRecommendation={onNavigate}
          onGoToSite={onGoToSite}
          onOpenVideo={handleOpenVideo}
          onRequireLogin={onRequireLogin}
          readOnly={readOnly}
          bloqueEnLaCabina={bloqueEnLaCabina}
          avisoDeEspera={avisoDeEspera}
          alFondoDelPozo={alFondoDelPozo}
          soloElTitulo={soloElTitulo}
          nodoBandeja={nodoBandeja}
          onExplorarMiniverso={onExplorarMiniverso}
        />
      </div>

      {/* Donde se abre la bandeja del bloque morado: encima de todo, sin
          tapar los toques mientras está cerrada. */}
      <div ref={setNodoBandeja} className="pointer-events-none absolute inset-0" style={{ zIndex: 20 }} />

      <VideoNarrativeAutoplay
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        onNavigate={handleVideoNavigate}
        formatId={videoFormatId}
        isMobileViewport={isMobileViewport}
      />
    </div>
  );
};

export default CuadernoHolografico;
