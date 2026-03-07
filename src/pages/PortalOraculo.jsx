import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, Coins, Hand, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { fetchApprovedContributions } from '@/services/contributionService';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';

const ORACULO_TITLE = 'Oraculo';
const ORACULO_INTRO =
  'Alimenta la mente del Gato y gana GATokens por compartir tu pensamiento. El Oraculo no da respuestas, pero si recompensa tu curiosidad.';
const ORACULO_TAGLINE = 'Interaccion que deja huella. Reflexion que te recompensa.';
const ORACULO_MINING_LOOPS = [
  'Responde preguntas simbolicas, filosoficas, existenciales, absurdas o personales.',
  'Cada respuesta se guarda como semilla de conocimiento simbolico para IA, literatura y obra interactiva.',
  'Mientras mas participas, mas GATokens generas (proof-of-resonance con limites diarios anti-spam).',
];
const ORACULO_REWARDS = [
  {
    id: 'reward-answer',
    title: 'Responder a una pregunta profunda',
    tokens: '+20 GAT',
    description: 'Comparte una reflexion que vibre en lo simbolico o emocional.',
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
    title: 'Invitar a alguien con su primera reflexion',
    tokens: '+50 GAT',
    description: 'Trae otra mente al Oraculo. Recompensa unica por invitacion.',
  },
];
const ORACULO_LIMITS_NOTE = 'Limites por dia para evitar spam y mantener el valor simbolico.';
const ORACULO_SEED_NOTES = [
  'Las respuestas se almacenan como semillas de conocimiento simbolico.',
  'Enriquecen una base de datos viviente para literatura, IA personalizada y obra interactiva.',
  'Cada huella deja senal en la mente del Gato.',
];
const ORACULO_CTA_LABEL = 'Pregunta, responde y mintea';
const ORACULO_CTA_DESCRIPTION = 'Tu pensamiento tambien construye este universo.';
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
  type: 'GPT-4o + embeddings simbolicos curados por la comunidad.',
  interaction: '1-3 reflexiones cortas por sesion; foro breve guiado.',
  tokensRange: '20-120 tokens por reflexion (promedio ~20 GAT).',
  coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
  footnote: 'El minado es simbolico y humano: no es financiero, es resonancia.',
};
const ORACULO_FALLBACK_COMMENTS = [
  {
    id: 'oraculo-comment-1',
    proposal: 'Una pregunta buena me desarmo mas que un consejo.',
    name: 'Semilla activa',
  },
  {
    id: 'oraculo-comment-2',
    proposal: 'Volvi por mis +30 GAT, pero me quede por la conversacion.',
    name: 'Comunidad #GatoEncerrado',
  },
];
const ORACULO_BLOG_KEYS = [
  'oraculo',
  'oracle',
  'miniverso-oraculo',
  'miniverso_oraculo',
  'miniversooraculo',
];
const ORACULO_BLOG_KEY_SET = new Set(ORACULO_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const MiniVersoCard = ({ title, verse, palette }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative [perspective:1200px]" onClick={() => setIsActive((prev) => !prev)}>
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
  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Resonancia colectiva</p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Deja un pulso para sostener la mente viva del Oraculo.
        </p>
      </div>
      <button
        type="button"
        onClick={onReact}
        className={`rounded-full p-3 transition ${
          status === 'success'
            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 shadow-[0_0_25px_rgba(244,114,182,0.6)] text-white border border-transparent'
            : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white hover:from-purple-500 hover:to-indigo-500'
        }`}
        disabled={status === 'loading'}
      >
        <Heart size={20} />
      </button>
    </div>
    <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
      {status === 'loading' ? 'Enviando...' : 'Hacer latir el Oraculo'}
    </p>
  </div>
);

const PortalOraculo = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [communityComments, setCommunityComments] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [latestOraculoReading, setLatestOraculoReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
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

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);

  useEffect(() => {
    let isCancelled = false;
    const loadComments = async () => {
      setCommunityLoading(true);
      setCommunityError('');
      const topics = ['oraculo', 'oracle', 'miniverso-oraculo'];
      let resolvedData = [];
      let resolvedError = null;
      for (const topic of topics) {
        const { data, error } = await fetchApprovedContributions(topic);
        if (isCancelled) return;
        if (error) {
          resolvedError = error;
          continue;
        }
        if (Array.isArray(data) && data.length) {
          resolvedData = data;
          resolvedError = null;
          break;
        }
      }
      if (isCancelled) return;
      if (resolvedError && !resolvedData.length) {
        setCommunityError('No pudimos cargar comentarios.');
      }
      setCommunityComments(resolvedData);
      setCommunityLoading(false);
    };

    loadComments();
    return () => {
      isCancelled = true;
    };
  }, []);

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
        description: 'Falta configurar la URL del Oraculo (VITE_BIENVENIDA_URL o VITE_ORACULO_URL).',
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

  const hasCommunityComments = useMemo(() => communityComments.length > 0, [communityComments]);
  const visibleComments = hasCommunityComments ? communityComments : ORACULO_FALLBACK_COMMENTS;
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
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/35 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{ORACULO_TITLE}</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{ORACULO_INTRO}</p>
                  <p className="text-violet-200/90">{ORACULO_TAGLINE}</p>
                </div>
                <IAInsightCard {...ORACULO_IA_PROFILE} compact />
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={ORACULO_NOTA_AUTORAL.title}
                    verse={ORACULO_NOTA_AUTORAL.verse}
                    palette={ORACULO_TILE}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Minado simbolico</p>
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {ORACULO_MINING_LOOPS.map((step, index) => (
                    <li key={`oraculo-loop-${index}`} className="flex items-start gap-2">
                      <span className="text-purple-300 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                    onClick={handleOpenOraculo}
                  >
                    {ORACULO_CTA_LABEL}
                  </Button>
                  <p className="text-xs text-slate-400 leading-relaxed">{ORACULO_CTA_DESCRIPTION}</p>
                </div>
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
                  <p className="text-sm text-slate-200 font-semibold">Interaccion que deja huella</p>
                </div>
                <p className="text-sm text-slate-300/85 leading-relaxed">
                  Tus reflexiones afinan la mente del Gato: entrenamiento simbolico, no binario y emocional. Cada
                  participacion se audita para evitar ruido.
                </p>
                <p className="text-xs text-slate-500">El Oraculo es un espacio curado; el minado es resonancia, no dinero.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Voces de la comunidad</p>
              <RelatedReadingTooltipButton
                slug={latestOraculoReading?.slug}
                authorLabel={oraculoReadingAuthorLabel}
                thumbnailUrl={oraculoReadingThumbnailUrl}
                ariaLabel="Mostrar lectura relacionada de Oráculo"
                tone="violet"
              />
            </div>
            <div className="max-h-[240px] form-surface relative overflow-y-auto px-3 py-3 pr-2">
              {communityLoading ? (
                <p className="px-1 py-2 text-sm text-slate-600/85">Cargando comentarios...</p>
              ) : communityError && !hasCommunityComments ? (
                <p className="px-1 py-2 text-sm text-rose-700/85">{communityError}</p>
              ) : (
                <div className="space-y-2.5">
                  {visibleComments.map((comment) => (
                    <div
                      key={`portal-oraculo-comment-${comment.id}`}
                      className="rounded-xl border border-indigo-200/70 bg-white/72 p-3 shadow-[0_6px_18px_rgba(80,120,255,0.08)]"
                    >
                      <p className="mb-1.5 text-[0.96rem] font-light leading-relaxed text-slate-800">{comment.proposal}</p>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500/85">{comment.name || 'Anonimo'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500/85">Desliza para leer mas voces</p>
            <div className="pt-4 mt-1 border-t border-white/10">
              <div className="mx-auto w-full max-w-md">
                <button
                  type="button"
                  className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                  onClick={handleOpenCommunityComposer}
                >
                  coméntanos algo aqui
                </button>
              </div>
            </div>

            <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
          </div>
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
