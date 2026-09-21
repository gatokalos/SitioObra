import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Flame,
  Sparkles,
  BookOpen,
  ChevronDown,
  Download,
} from 'lucide-react';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import HuellaView from '@/components/portal/HuellaView';
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
import IAInsightCard from '@/components/IAInsightCard';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { CATALOG, readResonanceProgress } from '@/lib/bitacoraShared';
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
const LineaDeLaForma = ({ portal, enFoco, focoCompleto, enEscena }) => {
  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const rotulo = (activo) => `text-[0.6rem] uppercase tracking-wide ${activo ? 'text-slate-300' : 'text-slate-600'}`;
  return (
    <div
      className="flex items-start justify-between gap-1 py-3"
      role="img"
      aria-label={
        enEscena
          ? 'En el foco, tres días entre bambalinas, En escena y Memoria: completo'
          : focoCompleto
            ? 'En el foco completo. En escena sigue abierta'
            : enFoco ? 'En el foco, en curso' : 'Sin empezar'
      }
    >
      {/* En el foco — el detonante */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
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
            <Eye size={14} className={focoCompleto ? 'text-white' : enFoco ? 'text-slate-300' : 'text-slate-600'} />
          </span>
        </span>
        <span className={rotulo(enFoco)}>En el foco</span>
      </div>

      {/* Entre bambalinas — la retención: tres días en los que no pasa nada */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <span className="flex h-12 w-full items-center">
          <span className={`w-full border-t-2 border-dotted ${focoCompleto ? 'border-white/35' : 'border-white/10'}`} />
        </span>
        <span className={`${rotulo(focoCompleto)} text-center leading-tight`}>
          Entre bambalinas
          <span className="block normal-case tracking-normal opacity-70">3 días</span>
        </span>
      </div>

      {/* En escena — el clímax. Si no ocurrió queda vacía, no apagada. */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
        <span className="relative flex h-12 w-12 items-center justify-center">
          {enEscena ? (
            <span aria-hidden className={`absolute -inset-1 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-md`} />
          ) : null}
          <span
            className={`relative flex h-12 w-12 items-center justify-center rounded-full transition ${
              enEscena
                ? `bg-gradient-to-br ${gradient} shadow-[0_6px_22px_rgba(0,0,0,0.45)]`
                : focoCompleto
                  ? 'border-2 border-white/40 bg-transparent'
                  : 'border border-dashed border-white/15 bg-white/[0.03]'
            }`}
          >
            <Flame size={20} className={enEscena ? 'text-white drop-shadow-sm' : focoCompleto ? 'text-slate-300' : 'text-slate-600'} />
          </span>
        </span>
        <span className={`${rotulo(enEscena || focoCompleto)} font-semibold`}>En escena</span>
      </div>

      <span className="flex h-12 w-5 shrink-0 items-center">
        <span className={`w-full border-t ${enEscena ? 'border-white/35' : 'border-white/10'}`} />
      </span>

      {/* Memoria — abierta: es donde la persona está parada ahora */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
        <span className="flex h-12 items-center">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              enEscena ? 'border-2 border-white/70' : 'border border-dashed border-white/15'
            }`}
          >
            <BookOpen size={13} className={enEscena ? 'text-white' : 'text-slate-600'} />
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

const FraseDeMemoria = ({ portal, enEscena }) => {
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

const LIBRETO_REENTRY_COPY =
  'Solo cambia la forma de abordarla. Explora los niveles a tu ritmo y deja que la Memoria holográfica conserve lo que permanezca contigo.';

const getVitrinaVerse = (showcaseId) =>
  formats.find((format) => format.id === showcaseId)?.vitrinaCopy ?? LIBRETO_REENTRY_COPY;

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

function Constellation({ centerKey, onSelect }) {
  const center = CATALOG.find(p => p.key === centerKey);
  const centerIconUrl = PORTAL_APP_ICON_URL[centerKey];
  const satellites = CATALOG.filter(p => p.key !== centerKey);
  const N = satellites.length;

  return (
    <div className="relative w-full h-full">
      {/* Líneas SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <radialGradient id="chLineGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {satellites.map((_, i) => {
          const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
          const r = 38;
          return (
            <line
              key={i}
              x1="50%" y1="50%"
              x2={`${50 + r * Math.cos(angle)}%`}
              y2={`${50 + r * Math.sin(angle)}%`}
              stroke="url(#chLineGrad)"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
          );
        })}
      </svg>

      {/* Centro — anima gradiente al cambiar */}
      <div
        className="absolute flex items-center justify-center"
        style={{ inset: 0, zIndex: 2, pointerEvents: 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={centerKey}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-full bg-black ring-2 ring-white/25 shadow-[0_0_60px_rgba(0,0,0,0.55)]"
            style={{ width: '32%', aspectRatio: '1' }}
            aria-label={center.form ?? center.name}
          >
            {centerIconUrl ? (
              <img
                src={centerIconUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-[1.03] object-cover"
              />
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-16px_-18px_28px_rgba(0,0,0,0.42),inset_10px_9px_18px_rgba(255,255,255,0.14)]"
              style={{ background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.20), transparent 30%)' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Satélites — transition CSS en posición para redistribución suave */}
      {satellites.map((sat, i) => {
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        const r = 38;
        const x = 50 + r * Math.cos(angle);
        const y = 50 + r * Math.sin(angle);
        const satProgress = readResonanceProgress(sat.key);
        const hasL1 = satProgress.l1Done;
        const hasL2 = satProgress.l2Done;
        const satelliteIconUrl = PORTAL_APP_ICON_URL[sat.key];

        return (
          <button
            key={sat.key}
            type="button"
            onClick={() => onSelect(sat.key)}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              width: '20%',
              aspectRatio: '1',
              zIndex: 3,
              transition: 'left 0.35s ease, top 0.35s ease',
            }}
            className="group overflow-hidden rounded-full border border-white/25 bg-black shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition duration-200 hover:scale-[1.04] hover:border-white/45"
            aria-label={`Abrir ${sat.form ?? sat.name}`}
            title={sat.form ?? sat.name}
          >
            {satelliteIconUrl ? (
              <img
                src={satelliteIconUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-[1.04] object-cover transition duration-300 group-hover:scale-[1.09]"
              />
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_-10px_-12px_20px_rgba(0,0,0,0.48),inset_7px_7px_13px_rgba(255,255,255,0.12)]"
              style={{ background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.18), transparent 32%)' }}
            />
            {hasL2 && <span className="absolute bottom-[8%] right-[10%] h-2 w-2 rounded-full border border-black/60 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
            {hasL1 && !hasL2 && <span className="absolute bottom-[8%] right-[10%] h-2 w-2 rounded-full border border-black/60 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Panel inferior ────────────────────────────────────────────────────── */

function CompletedScenePanel({
  portal,
  entry,
  onDownloadSouvenir,
  souvenirGenerando,
  huellaOpen,
  huellaMounted,
  onToggleHuella,
  recommendedFormatId,
  onNavigateToRecommendation,
  onGoToSite,
  accordionRef,
}) {
  const [replicaPublicada, setReplicaPublicada] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
        {/* El recuerdo comparte renglón con el nombre de la forma: en su propia
            fila robaba alto en pantalla chica y hacía saltar el bloque al
            cambiar de satélite, porque los satélites no lo llevan (Carlos,
            20 sep 2026). En escritorio vive al pie de la cabina. */}
        <div className="mt-1 flex items-center justify-between gap-3">
          <h2 className={`font-display text-2xl leading-snug ${entry.color}`}>
            {entry.form ?? entry.name}
          </h2>
          {onDownloadSouvenir ? (
            <button
              type="button"
              onClick={() => void onDownloadSouvenir()}
              disabled={souvenirGenerando}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[0.62rem] text-slate-200/90 transition hover:border-white/30 hover:text-white disabled:opacity-50 lg:hidden"
            >
              <Download size={12} aria-hidden="true" />
              {souvenirGenerando ? 'Preparando…' : 'Mi recuerdo'}
            </button>
          ) : null}
        </div>
        <FraseDeMemoria portal={portal} enEscena />
      </div>

      <LineaDeLaForma portal={portal} enFoco focoCompleto enEscena />

      {/* La huella ya no abre otra plantilla: explica el siguiente paso dentro
          del mapa y reserva el texto recuperado para La Réplica. */}
      {onToggleHuella ? (
        <section ref={accordionRef} className={`huella-acordeon${huellaOpen ? ' huella-acordeon--abierto' : ''}`}>
        <button
          type="button"
          onClick={onToggleHuella}
          aria-expanded={huellaOpen}
          aria-controls="huella-acordeon-contenido"
          className="huella-puerta"
        >
          <span className="huella-puerta__texto">
            <span className="huella-puerta__eyebrow">{replicaPublicada ? 'Tu réplica' : 'Lo que dijiste al volver'}</span>
            <span className="huella-puerta__titulo">{replicaPublicada ? 'Ya está en el acto final' : 'Llevarlo al acto final'}</span>
          </span>
          <ChevronDown size={17} className="huella-puerta__flecha" aria-hidden="true" />
        </button>
        <div
          id="huella-acordeon-contenido"
          className="huella-acordeon__cuerpo"
          aria-hidden={!huellaOpen}
        >
          <div className="huella-acordeon__interior">
            {huellaMounted ? (
              <HuellaView
                portal={portal}
                onReplicaPublicada={setReplicaPublicada}
                recommendedFormatId={recommendedFormatId}
                onNavigateToRecommendation={onNavigateToRecommendation}
                onGoToSite={onGoToSite}
              />
            ) : null}
          </div>
        </div>
        </section>
      ) : null}

    </div>
  );
}

function HolograficoPanel({
  centerKey,
  homeKey,
  onStartBitacora,
  huellaOpen,
  huellaMounted,
  onToggleHuella,
  recommendedFormatId,
  onNavigateToRecommendation,
  onGoToSite,
  accordionRef,
  onOpenVideo,
  onRequireLogin,
  readOnly = false,
  onDownloadSouvenir = null,
  souvenirGenerando = false,
}) {
  const isHome = centerKey === homeKey;
  const entry = CATALOG.find(p => p.key === centerKey);
  const progress = readResonanceProgress(centerKey);
  const hasL1 = progress.l1Done;
  const hasL2 = progress.l2Done;
  const hasL3 = progress.l3Done;
  const hasBitacora = progress.bitacoraDone;
  const verse = getVitrinaVerse(entry.showcase);

  const homeProgress = readResonanceProgress(homeKey);
  const homeL2 = homeProgress.l2Done;
  const homeL3 = homeProgress.l3Done;
  const homeBitacora = homeProgress.bitacoraDone;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={centerKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
      >
        {isHome ? (
          homeBitacora ? (
            <CompletedScenePanel
              portal={homeKey}
              onDownloadSouvenir={onDownloadSouvenir}
              souvenirGenerando={souvenirGenerando}
              entry={entry}
              huellaOpen={huellaOpen}
              huellaMounted={huellaMounted}
              onToggleHuella={onToggleHuella}
              recommendedFormatId={recommendedFormatId}
              onNavigateToRecommendation={onNavigateToRecommendation}
              onGoToSite={onGoToSite}
              accordionRef={accordionRef}
            />
          ) : (
            /* Compatibilidad con recorridos antiguos que aún no cierran su bitácora. */
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
                <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>
                  {entry.form ?? entry.name}
                </h2>
                <FraseDeMemoria portal={homeKey} enEscena={false} />
              </div>
              <LineaDeLaForma portal={homeKey} enFoco focoCompleto={homeL3} enEscena={false} />
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
            </div>
          )
        ) : hasBitacora ? (
          <CompletedScenePanel
            portal={centerKey}
            onDownloadSouvenir={onDownloadSouvenir}
            souvenirGenerando={souvenirGenerando}
            entry={entry}
            huellaOpen={huellaOpen}
            huellaMounted={huellaMounted}
            onToggleHuella={onToggleHuella}
            recommendedFormatId={progress.l3Recommendation?.recommended_format_id ?? null}
            onNavigateToRecommendation={onNavigateToRecommendation}
            onGoToSite={onGoToSite}
            accordionRef={accordionRef}
          />
        ) : (
          /* Satélite */
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
              <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>{entry.form ?? entry.name}</h2>
              <p className="memoria-descripcion mt-2 text-sm leading-relaxed text-slate-300/80">
                {verse}
              </p>
            </div>
            <LineaDeLaForma portal={centerKey} enFoco={hasL1} focoCompleto={hasL3} enEscena={hasBitacora} />
            {showcaseDefinitions[entry.showcase]?.iaProfile ? (
              <IAInsightCard
                {...showcaseDefinitions[entry.showcase].iaProfile}
                compact
                onRequireLogin={onRequireLogin}
                travelEyebrow={hasL1 ? 'Sigue donde quedaste' : 'Otra forma de la obra'}
                travelLabel={`${hasL1 ? 'Volver a' : 'Interpretar'} ${entry.form ?? entry.name}`}
                travelFormLabel={entry.form ?? entry.name}
                onTravel={() => onOpenVideo(entry.showcase)}
                travelCtaOnly={!hasBitacora}
              />
            ) : null}
          </div>
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
  huellaOpen = false,
  onHuellaOpenChange,
  recommendedFormatId,
  onNavigate,
  onGoToSite,
  onPosterChange,
  onRequireLogin,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileViewport } = useMobileVideoPresentation();
  const [centerKey, setCenterKey] = useState(portal);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoFormatId, setVideoFormatId] = useState(null);
  // Después de abrirse una vez conservamos montada la huella para no perder
  // una corrección sin guardar si la persona pliega el acordeón por accidente.
  const [huellaMounted, setHuellaMounted] = useState(huellaOpen);
  const scrollContainerRef = useRef(null);
  const huellaAccordionRef = useRef(null);
  const huellaScrollTimersRef = useRef([]);

  useEffect(() => { onPosterChange?.(portal); }, []);
  useEffect(() => {
    if (huellaOpen) setHuellaMounted(true);
  }, [huellaOpen]);
  useEffect(() => () => {
    huellaScrollTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const handleSelect = (key) => {
    if (key !== centerKey && huellaOpen) onHuellaOpenChange?.(false);
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

  const anchorHuellaInViewport = (behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    const accordion = huellaAccordionRef.current;
    if (!container || !accordion) return;
    const containerRect = container.getBoundingClientRect();
    const accordionRect = accordion.getBoundingClientRect();
    const top = Math.max(0, container.scrollTop + accordionRect.top - containerRect.top - 72);
    container.scrollTo({ top, behavior });
  };

  const handleToggleHuella = () => {
    const next = !huellaOpen;
    huellaScrollTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    huellaScrollTimersRef.current = [];
    if (next) {
      setHuellaMounted(true);
      // El layout cambia de flex fijo a contenido desplazable al abrirse. Un
      // primer anclaje acompaña el inicio y el segundo corrige la posición al
      // terminar la expansión, sin sacar el toggle del viewport.
      huellaScrollTimersRef.current.push(window.setTimeout(() => anchorHuellaInViewport(), 60));
      huellaScrollTimersRef.current.push(window.setTimeout(() => anchorHuellaInViewport(), 430));
    } else {
      // El cierre vuelve al mapa; el navegador recupera su encuadre natural
      // cuando desaparece el excedente vertical.
      huellaScrollTimersRef.current.push(window.setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 360));
    }
    onHuellaOpenChange?.(next);
  };

  return (
    <div ref={scrollContainerRef} className={`relative flex h-full flex-col ${huellaOpen ? 'overflow-y-auto' : 'overflow-hidden'}`}>

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

      {/* Constelación */}
      <div
        className={`relative p-4 lg:p-6 ${huellaOpen ? 'min-h-[28rem] flex-none lg:min-h-[24rem]' : 'min-h-0 flex-1'}`}
        style={{ zIndex: 3 }}
      >
        <Constellation
          centerKey={centerKey}
          onSelect={handleSelect}
        />
      </div>

      {/* Separador */}
      <div aria-hidden className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ zIndex: 3 }} />

      {/* Panel */}
      <div className="shrink-0" style={{ zIndex: 3 }}>
        <HolograficoPanel
          centerKey={centerKey}
          homeKey={portal}
          onDownloadSouvenir={onDownloadSouvenir}
          souvenirGenerando={souvenirGenerando}
          onStartBitacora={onStartBitacora}
          huellaOpen={huellaOpen}
          huellaMounted={huellaMounted}
          onToggleHuella={handleToggleHuella}
          recommendedFormatId={recommendedFormatId}
          onNavigateToRecommendation={onNavigate}
          onGoToSite={onGoToSite}
          accordionRef={huellaAccordionRef}
          onOpenVideo={handleOpenVideo}
          onRequireLogin={onRequireLogin}
          readOnly={readOnly}
        />
      </div>

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
