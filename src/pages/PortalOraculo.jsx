import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Coins, Hand, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import ResonanceModal from '@/components/portal/ResonanceModal';
import PulseReactionCard from '@/components/portal/PulseReactionCard';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';

const ORACULO_TITLE = 'Oráculo';
const ORACULO_INTRO =
  (
  <>
    Este miniverso existe para mirar lo que <strong>#GatoEncerrado</strong> despierta en ti.
    <br />
    A través de preguntas breves, el <strong>Oráculo</strong> abre un espacio para observar tus propias respuestas:
    emociones, intuiciones y pensamientos que aparecen después de la experiencia.
  
  </>
);
const ORACULO_TAGLINE =  (
  <>
    <strong>Aquí no se interpreta la mente.</strong>
    <br />
    Se aprende a <em>observar al observador</em>.
  </>
);
const ORACULO_MINING_LOOPS = [
  'Responde preguntas simbólicas, filosóficas, existenciales o absurdas.',
  'Cada respuesta se guarda como semilla de conocimiento para IA, literatura y obra interactiva.',
  'Mientras más participas, más GATokens generas: prueba de resonancia con límites diarios.',
];
const ORACULO_REWARDS = [
  {
    id: 'reward-answer',
    title: 'Responder a una pregunta profunda',
    tokens: '+20 GAT',
    description: 'Comparte una reflexión que vibre en lo simbólico o emocional.',
  },
  {
    id: 'reward-comment',
    title: 'Elegir y comentar reflexiones de otrxs',
    tokens: '+30 GAT',
    description: 'Modo foro: amplifica ideas y suma tu mirada.',
  },
  {
    id: 'reward-return',
    title: 'Volver tras una semana',
    tokens: '+30 GAT',
    description: 'Retorno que sostiene el hilo y da seguimiento a tu huella.',
  },
  {
    id: 'reward-invite',
    title: 'Invitar a alguien con su primera reflexión',
    tokens: '+50 GAT',
    description: 'Trae otra mente al Oráculo. Recompensa única por invitación.',
  },
];
const ORACULO_LIMITS_NOTE = 'Límites diarios para evitar spam y preservar el valor simbólico de cada respuesta.';
const ORACULO_SEED_NOTES = [
  'Las respuestas se almacenan como semillas de conocimiento simbólico.',
  'Enriquecen una base de datos viviente para literatura, IA personalizada y obra interactiva.',
  'Cada huella deja señal en la mente del Gato.',
];
const ORACULO_NOTA_AUTORAL = {
  title: '#CambiarSinCambiar',
  verse: 'Mire el espejo.\nNo dijo nada.\nEramos dos... y no.',
};
const ORACULO_TILE = {
  gradient: 'linear-gradient(135deg, rgba(38,18,56,0.95), rgba(86,33,115,0.85), rgba(168,68,139,0.65))',
  border: 'rgba(216,180,254,0.42)',
  text: '#f5e8ff',
  accent: '#e9d5ff',
  background: 'rgba(38,18,56,0.72)',
};
const ORACULO_IA_PROFILE = {
  type: 'GPT-4o + embeddings simbólicos curados por la comunidad.',
  interaction: '1-3 reflexiones cortas por sesion; foro breve guiado.',
  tokensRange: '20-120 tokens por reflexion (promedio ~20 GAT).',
  coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
  footnote: 'El minado es simbólico y humano: no es financiero, es resonancia.',
};
const ORACULO_BLOG_KEYS = [
  'oraculo',
  'oracle',
  'miniverso-oraculo',
  'miniverso_oraculo',
  'miniversooraculo',
];
const ORACULO_BLOG_KEY_SET = new Set(ORACULO_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const MiniVersoCard = ({ title, verse, palette }) => {
  const [isActive, setIsActive] = useState(() => {
    try { return window.localStorage.getItem('gatoencerrado:miniverso-verso:' + title) === '1'; } catch { return false; }
  });
  const reveal = () => setIsActive((prev) => {
    if (prev) return prev;
    try { window.localStorage.setItem('gatoencerrado:miniverso-verso:' + title, '1'); } catch {}
    return true;
  });

  return (
    <div className="relative [perspective:1200px]" onClick={reveal}>
      <motion.div
        animate={{ rotateY: isActive ? 180 : 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="relative min-h-[220px] [transform-style:preserve-3d]"
      >
        <div
          className="absolute inset-0 rounded-2xl border flex flex-col items-center justify-center gap-4 text-sm [backface-visibility:hidden]"
          style={{
            backgroundImage: palette.gradient,
            borderColor: palette.border,
            color: palette.text,
          }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.6rem] uppercase tracking-[0.35em] shadow-lg"
            style={{
              color: palette.accent,
              backgroundColor: `${palette.background}cc`,
              border: `1px solid ${palette.border}`,
            }}
          >
            {title}
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/15 text-white/85 shadow-[0_0_16px_rgba(255,255,255,0.18)]">
            <Hand size={16} className="animate-pulse" />
          </span>
        </div>
        <div
          className="absolute inset-0 rounded-2xl border px-6 py-5 [backface-visibility:hidden] flex items-center justify-center text-sm"
          style={{
            backgroundImage: palette.gradient,
            borderColor: palette.border,
            color: palette.text,
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="leading-relaxed whitespace-pre-line text-center font-light">{verse}</p>
        </div>
      </motion.div>
    </div>
  );
};

const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos explorando las emociones contemporáneas a través de preguntas y experiencias narrativas."
    buttonLabel="¿no te salen las palabras? ¡déjanos un pulso!"
  />
);

const PortalOraculo = () => {
  const { user } = useAuth();
  usePortalTracking('oraculo');
  const { question: vitranaQuestion } = useVitranaQuestion('oraculo');
  const titleDisplay = useScrambleText(ORACULO_TITLE);
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestOraculoReading, setLatestOraculoReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const readingTooltipRef = useRef(null);

  const oraculoUrl = useMemo(() => {
    const raw = import.meta.env.VITE_BIENVENIDA_URL ?? import.meta.env.VITE_ORACULO_URL ?? '';
    if (raw) return raw.replace(/\/+$/, '');
    return import.meta.env.DEV ? 'http://localhost:5174' : '';
  }, []);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback((forceAuth = false) => {
    if (isAuthenticated) return true;
    if (!forceAuth && hasEnoughGAT()) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);


  useEffect(() => {
    let cancelled = false;
    const loadLatestOraculoReading = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .not('slug', 'is', null)
        .not('miniverso', 'is', null)
        .order('published_at', { ascending: false })
        .limit(60);

      if (cancelled) return;
      if (error) {
        console.warn('[PortalOraculo] No se pudo detectar lectura relacionada:', error);
        setLatestOraculoReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return ORACULO_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestOraculoReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestOraculoReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestOraculoReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestOraculoReading?.slug]);

  useEffect(() => {
    if (!isReadingTooltipOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!readingTooltipRef.current) return;
      if (!readingTooltipRef.current.contains(event.target)) {
        setIsReadingTooltipOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsReadingTooltipOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isReadingTooltipOpen]);

  const handleOpenOraculo = useCallback(() => {
    if (!requireAuth()) return;
    if (!oraculoUrl) {
      toast({
        description: 'Falta configurar la URL del Oráculo (VITE_BIENVENIDA_URL o VITE_ORACULO_URL).',
      });
      return;
    }
    window.open(oraculoUrl, '_blank', 'noopener,noreferrer');
  }, [oraculoUrl, requireAuth]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'oraculo', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const oraculoReadingAuthorLabel = (latestOraculoReading?.author || '').trim() || 'autor invitado';
  const oraculoReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestOraculoReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.image_url) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-violet-300/60 bg-violet-500/10 px-3 py-2 text-xs text-violet-100 shadow-[0_10px_30px_rgba(139,92,246,0.25)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/35 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestOraculoReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestOraculoReading.slug}
                  authorLabel={oraculoReadingAuthorLabel}
                  thumbnailUrl={oraculoReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Oráculo"
                  tone="violet"
                />
              </div>
            ) : null}
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{ORACULO_INTRO}</p>
                  <p className="text-violet-200/90">{ORACULO_TAGLINE}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Ritual simbólico</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Pregunta abierta</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Huella viviente</span>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <VitranaQuestionReveal question={vitranaQuestion} onAnswer={() => setIsResonanceOpen(true)} />
                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => setIsResonanceOpen(false)}
                question={vitranaQuestion}
                portal="oraculo"
              />
            )}
          </div>

          <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Minado simbólico</p>
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {ORACULO_MINING_LOOPS.map((step, index) => (
                    <li key={`oraculo-loop-${index}`} className="flex items-start gap-2">
                      <span className="text-purple-300 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Sistema de recompensas</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {ORACULO_REWARDS.map((reward) => (
                    <div
                      key={reward.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-100">{reward.title}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200">
                          <Coins size={14} className="text-amber-200" />
                          {reward.tokens}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300/90 leading-relaxed">{reward.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">{ORACULO_LIMITS_NOTE}</p>
              </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Semillas de conocimiento</p>
                <ul className="space-y-2 text-sm text-slate-300/85 leading-relaxed">
                  {ORACULO_SEED_NOTES.map((seed, index) => (
                    <li key={`oraculo-seed-${index}`} className="flex items-start gap-2">
                      <Sparkles size={14} className="mt-1 text-amber-200" />
                      <span>{seed}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Brain size={18} className="text-purple-200" />
                  <p className="text-sm text-slate-200 font-semibold">Interacción que deja huella</p>
                </div>
                <p className="text-sm text-slate-300/85 leading-relaxed">
                  Tus reflexiones afinan la mente del Gato: entrenamiento simbólico, no binario y emocional. Cada
                  participación se audita para evitar ruido.
                </p>
                <p className="text-xs text-slate-500">El Oráculo es un espacio curado; el minado es resonancia, no dinero.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard
                title={ORACULO_NOTA_AUTORAL.title}
                verse={ORACULO_NOTA_AUTORAL.verse}
                palette={ORACULO_TILE}
              />
            </div>
          </div>
          <IAInsightCard {...ORACULO_IA_PROFILE} compact />
          <button
            type="button"
            onClick={handleOpenOraculo}
            className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
          >
            ✦ Pregunta, responde y mintea
          </button>
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="oraculo"
        />
      </div>
    </div>
  );
};

export default PortalOraculo;
