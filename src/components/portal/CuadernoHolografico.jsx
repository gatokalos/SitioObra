import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Flame,
  Sparkles,
  BookOpen,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
import IAInsightCard from '@/components/IAInsightCard';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { CATALOG } from '@/lib/bitacoraShared';
import {
  showcaseDefinitions,
  CUADERNO_HOLOGRAFICO_TRAVEL_GAT,
  formats,
} from '@/components/transmedia/transmediaConstants';

export { CATALOG };

// Vista reducida para un miniverso cuyo cuaderno holográfico todavía no se
// activó (bitacora_completed falso): sin pregunta ni CTA — esos exponían un
// loophole real (cualquiera podía recorrer las 9 esferas y usar el CTA de
// cada una para saltar a un portal no ganado). Solo las esferas de progreso,
// a modo de mapa de dónde quedó cada miniverso.
const PROGRESS_STAGES = [
  { key: 'l1', icon: Eye, label: 'Nivel 1' },
  { key: 'l2', icon: Flame, label: 'Nivel 2' },
  { key: 'l3', icon: Sparkles, label: 'Nivel 3' },
  { key: 'bitacora', icon: BookOpen, label: 'Bitácora' },
];

// Siempre las 4 esferas, completas o no — una etiqueta debajo de cada una
// (el ícono solo no significaba nada sin memorizarlo), y las que faltan se
// ven "apagadas" en vez de desaparecer: eso es justo lo que crea la
// sensación de querer completarlas.
const ProgressOrbsRow = ({ portal, hasL1, hasL2, hasL3, hasBitacora }) => {
  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';
  const doneByKey = { l1: hasL1, l2: hasL2, l3: hasL3, bitacora: hasBitacora };
  return (
    <div className="flex items-start justify-center gap-4 py-4">
      {PROGRESS_STAGES.map((stage) => {
        const StageIcon = stage.icon;
        const done = doneByKey[stage.key];
        return (
          <div key={stage.key} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_4px_18px_rgba(0,0,0,0.4)] transition ${
                done ? `bg-gradient-to-br ${gradient}` : 'border border-dashed border-white/15 bg-white/[0.03]'
              }`}
            >
              <StageIcon size={18} className={done ? 'text-white drop-shadow-sm' : 'text-slate-600'} />
            </span>
            <span className={`text-[0.6rem] uppercase tracking-wide ${done ? 'text-slate-300' : 'text-slate-600'}`}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// El miniverso principal ya recorrió las cuatro etapas. Conservamos el mismo
// lenguaje visual de los satélites, pero la Bitácora llama la atención hasta
// que la persona abre la explicación que aparece debajo.
const CompletedProgressOrbs = ({ portal, bitacoraNeedsAttention }) => {
  const gradient = PORTAL_GRADIENT[portal] ?? 'from-purple-400 via-fuchsia-500 to-rose-500';

  return (
    <div className="flex items-start justify-center gap-4 py-3" aria-label="Recorrido completado">
      {PROGRESS_STAGES.map((stage) => {
        const StageIcon = stage.icon;
        const isBitacora = stage.key === 'bitacora';

        return (
          <div key={stage.key} className="flex flex-col items-center gap-1.5">
            <span className="relative flex h-11 w-11 items-center justify-center">
              {isBitacora && bitacoraNeedsAttention ? (
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} animate-ping opacity-30`}
                />
              ) : null}
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-[0_4px_18px_rgba(0,0,0,0.4)]`}
              >
                <StageIcon size={18} className="text-white drop-shadow-sm" />
              </span>
            </span>
            <span className="text-[0.6rem] uppercase tracking-wide text-slate-300">
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
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
  'Solo cambia la forma de abordarla. Explora los niveles a tu ritmo y deja que el Libreto holográfico conserve lo que permanezca contigo.';

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

const lsRead = (portal) => {
  try { return JSON.parse(localStorage.getItem(`gatoencerrado:resonance:${portal}`)) ?? {}; }
  catch { return {}; }
};

const lsPatch = (portal, patch) => {
  try {
    const key = `gatoencerrado:resonance:${portal}`;
    const current = JSON.parse(localStorage.getItem(key)) ?? {};
    localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
  } catch {
    // La experiencia sigue funcionando aunque el navegador bloquee storage.
  }
};

const GATO_BITACORA_URL =
  import.meta.env.VITE_GATO_BITACORA_URL || 'https://gatoencerrado.org/mi-cuenta/acceso';

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
        const st = lsRead(sat.key);
        const hasL1 = !!st.l1;
        const hasL2 = !!st.l2_conv_done;
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

function CompletedHomePanel({ portal, entry, infoOpen, infoSeen, onToggleInfo }) {
  const verse = getVitrinaVerse(entry.showcase);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
        <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>
          {entry.form ?? entry.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
          {verse}
        </p>
      </div>

      <CompletedProgressOrbs portal={portal} bitacoraNeedsAttention={!infoSeen} />

      <section className="overflow-hidden rounded-xl border border-purple-400/25 bg-purple-950/25">
        <button
          type="button"
          onClick={onToggleInfo}
          aria-expanded={infoOpen}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-purple-400/[0.06]"
        >
          <span>
            <span className="block text-[0.62rem] uppercase tracking-[0.32em] text-purple-200/55">
              Resonancia colectiva
            </span>
            <span className="mt-1 block font-display text-lg text-purple-100">
              Conoce otras resonancias
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-purple-200/70 transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {infoOpen ? (
            <motion.div
              key="collective-resonance-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-purple-300/15 px-4 pb-5 pt-4">
                <p className="text-sm leading-relaxed text-slate-200/85">
                  Aquí podrás reconocer, mediante datos colectivos y anónimos, qué permanece en otras personas después de habitar la obra.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300/70">
                  Al conservar tu Huella podrás volver a tus respuestas, seguir su recorrido y descubrir nuevas relaciones dentro del universo.
                </p>
                <a
                  href={GATO_BITACORA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-purple-300/35 bg-purple-500/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-purple-50 transition hover:border-purple-200/60 hover:bg-purple-500/25"
                >
                  Abrir mi bitácora
                  <ExternalLink size={14} aria-hidden />
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  );
}

function HolograficoPanel({
  centerKey,
  homeKey,
  onStartBitacora,
  onOpenVideo,
  onRequireLogin,
  homeInfoOpen,
  homeInfoSeen,
  onToggleHomeInfo,
  readOnly = false,
}) {
  const isHome = centerKey === homeKey;
  const entry = CATALOG.find(p => p.key === centerKey);
  const st = lsRead(centerKey);
  const hasL1 = !!st.l1;
  const hasL2 = !!st.l2_option;
  const hasL3 = !!st.l3_recommendation?.step3;
  const hasBitacora = !!st.bitacora_completed;
  const verse = getVitrinaVerse(entry.showcase);

  const homeSt = lsRead(homeKey);
  const homeL2 = !!homeSt.l2_option;
  const homeL3 = !!homeSt.l3_recommendation?.step3;
  const homeBitacora = !!homeSt.bitacora_completed;

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
            <CompletedHomePanel
              portal={homeKey}
              entry={entry}
              infoOpen={homeInfoOpen}
              infoSeen={homeInfoSeen}
              onToggleInfo={onToggleHomeInfo}
            />
          ) : (
            /* Compatibilidad con recorridos antiguos que aún no cierran su bitácora. */
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
                <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>
                  {entry.form ?? entry.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                  {verse}
                </p>
              </div>
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
        ) : (
          /* Satélite */
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">{entry.eyebrow}</p>
              <h2 className={`font-display text-2xl leading-snug mt-1 ${entry.color}`}>{entry.form ?? entry.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                {verse}
              </p>
            </div>
            {hasBitacora ? (
              <VitranaQuestionReveal
                question={entry.q}
                portal={centerKey}
                autoReveal={hasL1}
                l2Done={hasL2}
                l3Done={hasL3}
                bitacoraCompleted={hasBitacora}
                label={null}
                buttonLabel={entry.cta}
                onAnswer={() => onOpenVideo(entry.showcase)}
              />
            ) : (
              <ProgressOrbsRow portal={centerKey} hasL1={hasL1} hasL2={hasL2} hasL3={hasL3} hasBitacora={hasBitacora} />
            )}
            {showcaseDefinitions[entry.showcase]?.iaProfile ? (
              <IAInsightCard
                {...showcaseDefinitions[entry.showcase].iaProfile}
                compact
                onRequireLogin={onRequireLogin}
                travelRequiredGat={CUADERNO_HOLOGRAFICO_TRAVEL_GAT}
                travelLabel="Viajar a esta escena"
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

const CuadernoHolografico = ({ portal, onStartBitacora, onNavigate, onPosterChange, onRequireLogin, readOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileViewport } = useMobileVideoPresentation();
  const [centerKey, setCenterKey] = useState(portal);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoFormatId, setVideoFormatId] = useState(null);
  const [homeInfoOpen, setHomeInfoOpen] = useState(false);
  const [homeInfoSeen, setHomeInfoSeen] = useState(
    () => !!lsRead(portal).libreto_collective_info_seen,
  );

  useEffect(() => { onPosterChange?.(portal); }, []);

  const handleSelect = (key) => {
    setCenterKey(key);
    onPosterChange?.(key);
  };

  const handleOpenVideo = (showcaseId) => {
    setVideoFormatId(showcaseId);
    setVideoOpen(true);
  };

  const handleToggleHomeInfo = () => {
    setHomeInfoOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen && !homeInfoSeen) {
        setHomeInfoSeen(true);
        lsPatch(portal, { libreto_collective_info_seen: true });
      }
      return willOpen;
    });
  };

  const handleVideoNavigate = () => {
    setVideoOpen(false);
    onNavigate(videoFormatId);
    const portalRoute = resolvePortalRoute({ formatId: videoFormatId });
    if (isMobileViewport && portalRoute) {
      window.setTimeout(() => navigate(portalRoute, {
        state: createPortalLaunchState(location, 'video-narrative-cta', { showcaseId: videoFormatId }),
      }), 80);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">

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
      <div className="relative min-h-0 flex-1 p-4 lg:p-6" style={{ zIndex: 3 }}>
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
          onStartBitacora={onStartBitacora}
          onOpenVideo={handleOpenVideo}
          onRequireLogin={onRequireLogin}
          homeInfoOpen={homeInfoOpen}
          homeInfoSeen={homeInfoSeen}
          onToggleHomeInfo={handleToggleHomeInfo}
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
