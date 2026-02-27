import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Scan,
  CheckCheck,
  Drama,
  HeartHandshake,
  Heart,
  RadioTower,
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';
import { PORTAL_VOZ_MODE_QUESTIONS } from '@/lib/obraConversation';
import { useSilvestreVoice } from '@/hooks/useSilvestreVoice';
import ObraConversationControls from '@/components/miniversos/obra/ObraConversationControls';
import ObraQuestionList from '@/components/miniversos/obra/ObraQuestionList';

const VOICE_MODES = [
  {
    id: 'confusion-lucida',
    title: 'Confusión lúcida',
    description: 'Sueño y realidad mezclados; claridad sin cierre.',
    accent: 'from-violet-200/20 via-purple-300/10 to-transparent',
    icon: Brain,
    tint: {
      border: 'rgba(196,181,253,0.5)',
      glow: '0 20px 60px rgba(139,92,246,0.25)',
      dot: 'rgba(196,181,253,0.9)',
    },
  },
  {
    id: 'sospecha-doctora',
    title: 'Sospecha Doctora',
    description: 'Duda directa: ¿acompaña o controla?',
    accent: 'from-cyan-200/20 via-sky-300/10 to-transparent',
    icon: Scan,
    tint: {
      border: 'rgba(125,211,252,0.45)',
      glow: '0 18px 55px rgba(14,165,233,0.2)',
      dot: 'rgba(125,211,252,0.9)',
    },
  },
  {
    id: 'necesidad-orden',
    title: 'Necesidad de orden',
    description: 'Una versión clara y breve, sin adornos.',
    accent: 'from-amber-200/20 via-orange-300/10 to-transparent',
    icon: CheckCheck,
    tint: {
      border: 'rgba(251,191,36,0.45)',
      glow: '0 18px 55px rgba(251,191,36,0.2)',
      dot: 'rgba(251,191,36,0.9)',
    },
  },
  {
    id: 'humor-negro',
    title: 'Humor negro',
    description: 'Ironía filosa, corta y sin explicación.',
    accent: 'from-fuchsia-200/20 via-pink-300/10 to-transparent',
    icon: Drama,
    tint: {
      border: 'rgba(244,114,182,0.45)',
      glow: '0 18px 55px rgba(236,72,153,0.2)',
      dot: 'rgba(244,114,182,0.9)',
    },
  },
  {
    id: 'cansancio-mental',
    title: 'Cansancio mental',
    description: 'Aterrizar hoy: idea, acción y pregunta.',
    accent: 'from-emerald-200/20 via-teal-300/10 to-transparent',
    icon: HeartHandshake,
    tint: {
      border: 'rgba(110,231,183,0.45)',
      glow: '0 18px 55px rgba(16,185,129,0.2)',
      dot: 'rgba(110,231,183,0.9)',
    },
  },
  {
    id: 'atraccion-incomoda',
    title: 'Atracción incómoda',
    description: 'Enganche y molestia en la misma frase.',
    accent: 'from-rose-200/20 via-pink-300/10 to-transparent',
    icon: Heart,
    tint: {
      border: 'rgba(251,113,133,0.45)',
      glow: '0 18px 55px rgba(244,114,182,0.2)',
      dot: 'rgba(251,113,133,0.9)',
    },
  },
  {
    id: 'vertigo',
    title: 'Vértigo',
    description: 'No hay cierre: la caída sigue abierta.',
    accent: 'from-violet-200/20 via-indigo-300/10 to-transparent',
    icon: RadioTower,
    tint: {
      border: 'rgba(165,180,252,0.45)',
      glow: '0 18px 55px rgba(129,140,248,0.2)',
      dot: 'rgba(165,180,252,0.9)',
    },
  },
];

const PORTAL_VOZ_BRAND = {
  gradient:
    'linear-gradient(135deg, rgba(31,21,52,0.95), rgba(64,36,93,0.85), rgba(122,54,127,0.65))',
  border: 'rgba(186,131,255,0.35)',
  glow: '0 30px 90px rgba(122,54,127,0.35)',
  dot: 'rgba(186,131,255,0.55)',
};

const DEFAULT_VOICE_MODE_ID = VOICE_MODES[0].id;

const shuffleArray = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const PortalVoz = () => {
  const { user } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const isAuthenticated = Boolean(user);
  const {
    micPromptVisible,
    transcript,
    micError,
    isListening,
    showSilvestreCoins,
    isSilvestreResponding,
    isSilvestreFetching,
    isSilvestrePlaying,
    pendingSilvestreAudioUrl,
    silvestreThinkingMessage,
    isSilvestreThinkingPulse,
    spentSilvestreSet,
    markSilvestreQuestionSpent,
    handleOpenSilvestreChat,
    handleSendSilvestrePreset,
    handlePlayPendingAudio,
  } = useSilvestreVoice();

  const [activeModeId, setActiveModeId] = useState(DEFAULT_VOICE_MODE_ID);
  const [starterPool, setStarterPool] = useState(() => {
    const base = PORTAL_VOZ_MODE_QUESTIONS[DEFAULT_VOICE_MODE_ID] ?? [];
    return shuffleArray(base);
  });
  const activeMode = useMemo(
    () => VOICE_MODES.find((mode) => mode.id === activeModeId) ?? VOICE_MODES[0],
    [activeModeId]
  );
  const activeTint = activeMode?.tint ?? VOICE_MODES[0].tint;

  useEffect(() => {
    const base = PORTAL_VOZ_MODE_QUESTIONS[activeModeId] ?? [];
    setStarterPool(shuffleArray(base));
  }, [activeModeId]);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);

  const handleMicClick = useCallback(() => {
    if (!requireAuth()) return;
    handleOpenSilvestreChat({ modeId: activeModeId });
  }, [activeModeId, handleOpenSilvestreChat, requireAuth]);

  const portalTopRef = useRef(null);

  const handleSelectMode = useCallback((modeId) => {
    setActiveModeId(modeId);
    if (typeof window === 'undefined') return;
    portalTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={12} />
            Volver al sitio
          </Link>
        </div>

      <div
        className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-10 shadow-[0_35px_120px_rgba(0,0,0,0.65)] space-y-8"
        ref={portalTopRef}
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-purple-300">Portal de voz</p>
          <h1 className="font-display text-3xl md:text-4xl text-white">Habla con la obra</h1>
          <p className="text-slate-300/85 leading-relaxed">
            Aquí la obra se vuelve conversación. Puedes hablar, elegir una pregunta guía o escuchar la voz que
            responde desde el universo de #GatoEncerrado.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8"
          style={{
            borderColor: PORTAL_VOZ_BRAND.border,
            boxShadow: PORTAL_VOZ_BRAND.glow,
            backgroundImage: PORTAL_VOZ_BRAND.gradient,
          }}
        >
          {activeMode?.icon ? (
            <div
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-black/60 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
              style={{ borderColor: activeTint?.border }}
              aria-label={`Perfil: ${activeMode.title}`}
            >
              <activeMode.icon size={18} style={{ color: activeTint?.dot }} />
            </div>
          ) : null}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at top, ${PORTAL_VOZ_BRAND.dot}, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            <ObraConversationControls
              ctaLabel="Pulsa para hablar"
              isSilvestrePlaying={isSilvestrePlaying}
              pendingSilvestreAudioUrl={pendingSilvestreAudioUrl}
              isSilvestreFetching={isSilvestreFetching}
              isSilvestreResponding={isSilvestreResponding}
              silvestreThinkingMessage={silvestreThinkingMessage}
              isSilvestreThinkingPulse={isSilvestreThinkingPulse}
              isListening={isListening}
              micPromptVisible={micPromptVisible}
              showSilvestreCoins={showSilvestreCoins}
              micError={micError}
              transcript={transcript}
              onMicClick={handleMicClick}
              onPlayPending={handlePlayPendingAudio}
              className="py-4"
            />
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-6"
          style={{ borderColor: activeTint?.border, boxShadow: activeTint?.glow }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage: `radial-gradient(circle at top, ${activeTint?.dot || 'rgba(196,181,253,0.6)'}, transparent 65%)`,
            }}
          />
          <div className="relative z-10">
            <ObraQuestionList
              starters={starterPool}
              spentSet={spentSilvestreSet}
              onSelect={(starter) => {
                if (!requireAuth()) return;
                if (spentSilvestreSet.has(starter)) return;
                markSilvestreQuestionSpent(starter);
                handleSendSilvestrePreset(starter, { modeId: activeModeId });
              }}
              variant="stack"
              tone={{
                borderColor: activeTint?.border,
                dotColor: activeTint?.dot,
                headingColor: activeTint?.dot,
              }}
              cornerIcon={activeMode?.icon || null}
              cornerIconLabel={`Perfil activo: ${activeMode?.title || ''}`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Perfiles</p>
              <h2 className="font-display text-2xl text-white">¿Con qué perfil entras hoy?</h2>
              <p className="text-sm text-slate-300/80">
                No es quién eres, es cómo quieres escuchar ahora.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {VOICE_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectMode(mode.id)}
                aria-pressed={activeModeId === mode.id}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/5 to-black/30 p-4 text-left transition ${
                  activeModeId === mode.id
                    ? 'border-white/40 shadow-[0_18px_55px_rgba(124,58,237,0.2)]'
                    : 'border-white/10 hover:border-purple-300/50 hover:shadow-[0_12px_40px_rgba(124,58,237,0.18)]'
                }`}
                style={
                  activeModeId === mode.id
                    ? { borderColor: mode.tint?.border, boxShadow: mode.tint?.glow }
                    : undefined
                }
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 opacity-70 bg-gradient-to-br ${mode.accent}`}
                />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-black/40"
                        style={{ borderColor: mode.tint?.border }}
                      >
                        {mode.icon ? (
                          <mode.icon size={18} style={{ color: mode.tint?.dot }} />
                        ) : null}
                      </span>
                      <p className="text-lg font-semibold text-white">{mode.title}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">
                      Demo
                    </span>
                  </div>
                  <p className="text-sm text-slate-300/85">{mode.description}</p>
               
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
    </div>
  </div>
  );
};

export default PortalVoz;
