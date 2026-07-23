import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { createPortalLaunchState } from '@/lib/portalNavigation';

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

const CATALOG = [
  { key: 'obra',        name: 'Obra Escénica',  showcase: 'miniversos',          color: 'text-purple-300',  q: '¿Qué significa para ti habitar una emoción delante de otros?',          cta: 'Sigue la obra' },
  { key: 'literatura',  name: 'Literatura',     showcase: 'miniversoNovela',     color: 'text-emerald-300', q: '¿Qué cambia en ti cuando una experiencia personal se convierte en relato?', cta: 'Sigue la literatura' },
  { key: 'artesanias',  name: 'Artesanías',     showcase: 'lataza',              color: 'text-amber-300',   q: '¿Cuándo un objeto deja de ser para ti solo un objeto?',                  cta: 'Sigue las artesanías' },
  { key: 'grafico',     name: 'Gráficos',       showcase: 'miniversoGrafico',    color: 'text-fuchsia-300', q: '¿Qué te ocurre cuando alguien más interpreta tu apariencia?',            cta: 'Sigue los gráficos' },
  { key: 'cine',        name: 'Cine',           showcase: 'copycats',            color: 'text-rose-300',    q: '¿Qué significa para ti verte fallar desde afuera?',                      cta: 'Sigue el cine' },
  { key: 'sonoridades', name: 'Sonoridades',    showcase: 'miniversoSonoro',     color: 'text-sky-300',     q: '¿Por qué algunos sonidos duran más que las imágenes?',                  cta: 'Sigue las sonoridades' },
  { key: 'movimiento',  name: 'Movimiento',     showcase: 'miniversoMovimiento', color: 'text-cyan-300',    q: '¿Qué cosas sabe tu cuerpo antes que tu pensamiento?',                   cta: 'Sigue el movimiento' },
  { key: 'juegos',      name: 'Juegos',         showcase: 'apps',                color: 'text-yellow-300',  q: '¿Qué cambia en ti cuando una historia depende de las decisiones de otros?',      cta: 'Sigue la ventura' },
  { key: 'oraculo',     name: 'Oráculo',        showcase: 'oraculo',             color: 'text-indigo-300',  q: '¿Cuándo una experiencia deja de sentirse individual?',                   cta: 'Sigue el oráculo' },
];

const HOLISTIC_QUESTION = '¿Qué parte de este viaje volvió a ti sin que la buscaras?';

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
            className={`rounded-full bg-gradient-to-br ${PORTAL_GRADIENT[centerKey]} flex flex-col items-center justify-center ring-2 ring-white/20 shadow-[0_0_60px_rgba(0,0,0,0.55)]`}
            style={{ width: '32%', aspectRatio: '1', padding: '4%' }}
          >
            <p
              className="text-center leading-none text-white/60"
              style={{ fontSize: 'clamp(0.38rem, 1.2vw, 0.56rem)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              {center.eyebrow}
            </p>
            <p
              className="font-display text-white text-center leading-tight mt-0.5"
              style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.95rem)' }}
            >
              {center.name}
            </p>
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
            className="rounded-full flex flex-col items-center justify-center border border-white/12 bg-black/55 hover:bg-white/6 hover:border-white/22 transition-colors duration-200"
          >
            <p
              className="text-white/35 leading-none"
              style={{ fontSize: 'clamp(0.34rem, 0.9vw, 0.44rem)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Miniverso
            </p>
            <p
              className={`font-bold text-center leading-tight px-1 mt-0.5 ${sat.color}`}
              style={{ fontSize: 'clamp(0.42rem, 1.1vw, 0.54rem)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              {sat.name}
            </p>
            {hasL2 && <span className="mt-0.5 block h-1 w-1 rounded-full bg-emerald-400/75" />}
            {hasL1 && !hasL2 && <span className="mt-0.5 block h-1 w-1 rounded-full bg-amber-400/60" />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Panel inferior ────────────────────────────────────────────────────── */

function HolograficoPanel({ centerKey, homeKey, onStartBitacora, onOpenVideo }) {
  const isHome = centerKey === homeKey;
  const entry = CATALOG.find(p => p.key === centerKey);
  const st = lsRead(centerKey);
  const hasL1 = !!st.l1;
  const hasL2 = !!st.l2_option;
  const hasL3 = !!st.l3_recommendation?.step3;
  const hasBitacora = !!st.bitacora_completed;

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
          /* Estado inicio: pregunta holística con título prominente */
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Días después</p>
              <h2 className="font-display text-2xl leading-snug text-amber-300 mt-1">
                Cuaderno holográfico
              </h2>
            </div>
            <VitranaQuestionReveal
              question={HOLISTIC_QUESTION}
              portal={homeKey}
              autoReveal
              l2Done={homeL2}
              l3Done={homeL3}
              bitacoraCompleted={homeBitacora}
              label={null}
              buttonLabel="Concluye tu narrativa personal"
              onAnswer={onStartBitacora}
            />
          </div>
        ) : (
          /* Satélite */
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
              <h2 className="font-display text-2xl leading-snug question-heading-voice mt-1">Resonancia colectiva</h2>
            </div>
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
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Componente principal ──────────────────────────────────────────────── */

const CuadernoHolografico = ({ portal, onStartBitacora, onNavigate, onPosterChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileViewport } = useMobileVideoPresentation();
  const [centerKey, setCenterKey] = useState(portal);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoFormatId, setVideoFormatId] = useState(null);

  useEffect(() => { onPosterChange?.(portal); }, []);

  const handleSelect = (key) => {
    setCenterKey(key);
    onPosterChange?.(key);
  };

  const handleOpenVideo = (showcaseId) => {
    setVideoFormatId(showcaseId);
    setVideoOpen(true);
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
