import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Gamepad2, Hand, Heart, Sparkles, User } from 'lucide-react';
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

const JUEGOS_TAGLINE = 'Juegos como portales • Apps como rituales felinos.';
const JUEGOS_INTRO =
  'Demos jugables del tablero TRAZO: eliges avatar (Maestra, Saturnina, Don Polo...) y el gato anfitrion te abre el telon en 3 taps.';
const JUEGOS_NOTA_AUTORAL = {
  title: '#NoHayDesandar',
  verse: 'Elegi un camino pequeno.\nAhora no lo puedo desandar.\nEl juego me jugo.',
};
const JUEGOS_TILE = {
  gradient: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(22,163,74,0.75), rgba(34,211,238,0.65))',
  border: 'rgba(110,231,183,0.35)',
  text: '#d1fae5',
  accent: '#a7f3d0',
  background: 'rgba(30,41,59,0.72)',
};
const JUEGOS_IA_PROFILE = {
  type: 'IA para misiones y ritmo de juego felino.',
  interaction: 'Tap / swipe progresivo; sugiere palabras en la voz del personaje.',
  tokensRange: '90-180 tokens por sesion.',
  coverage: 'Incluido en la huella transmedia (no gasta tus GAT).',
  footnote: 'La IA propone el siguiente giro; tu das el tap y decides cuando cerrar el telon.',
};
const JUEGOS_STEPS = [
  {
    id: 'step-1',
    title: 'Elige tu avatar',
    description:
      'La Maestra afila tiza, Saturnina trae glitch, Don Polo cobra peaje. Cada uno cambia el tono y las casillas.',
  },
  {
    id: 'step-2',
    title: 'Desbloquea el portal',
    description: 'Toca para abrir la escena: el gato suelta prefijos, el telon sube y aparece la siguiente casilla.',
  },
  {
    id: 'step-3',
    title: 'Recompensa',
    description: 'Guardas la gatologia, desbloqueas la siguiente ronda y sumas +20 GAT para seguir improvisando.',
  },
];
const JUEGOS_ACTIONS = [
  {
    id: 'download',
    label: 'Descargar app',
    description: 'APK / TestFlight / PWA con tablero, camerino y gatologias offline.',
    buttonLabel: 'Descargar',
  },
  {
    id: 'watch',
    label: 'Ver walkthrough',
    description: 'Video corto: splash -> selector de personaje -> telon -> gatologia guardada.',
    buttonLabel: 'Ver video',
  },
];
const JUEGOS_FALLBACK_COMMENTS = [
  {
    id: 'apps-comment-1',
    proposal: 'El tap demo se siente como abrir un telon diminuto cada vez.',
    name: 'Laboratorio ludico',
  },
  {
    id: 'apps-comment-2',
    proposal: 'Quiero jugar la version completa con mas avatares.',
    name: 'Comunidad #GatoEncerrado',
  },
];
const JUEGOS_DEMO_STEP_STORAGE_KEY = 'gatoencerrado:portal-juegos-step';
const JUEGOS_BLOG_KEYS = ['apps', 'juegos', 'miniversoapps', 'miniverso_apps', 'miniverso-apps'];
const JUEGOS_BLOG_KEY_SET = new Set(JUEGOS_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

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
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Resonancia ludica</p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Deja un pulso para que el gato anfitrion abra mas telones.
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
      {status === 'loading' ? 'Enviando...' : 'Hacer vibrar este miniverso'}
    </p>
  </div>
);

const PortalJuegos = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [communityComments, setCommunityComments] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [latestJuegosReading, setLatestJuegosReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [tapIndex, setTapIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage?.getItem(JUEGOS_DEMO_STEP_STORAGE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : 0;
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, JUEGOS_STEPS.length - 1));
  });
  const readingTooltipRef = useRef(null);

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
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(JUEGOS_DEMO_STEP_STORAGE_KEY, String(tapIndex));
  }, [tapIndex]);

  useEffect(() => {
    let isCancelled = false;
    const loadComments = async () => {
      setCommunityLoading(true);
      setCommunityError('');
      const topics = ['apps', 'juegos'];
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
    const loadLatestJuegosReading = async () => {
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
        console.warn('[PortalJuegos] No se pudo detectar lectura relacionada:', error);
        setLatestJuegosReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return JUEGOS_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestJuegosReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestJuegosReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestJuegosReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestJuegosReading?.slug]);

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

  const handleTapAdvance = useCallback(() => {
    if (!requireAuth()) return;
    setTapIndex((prev) => (prev + 1) % JUEGOS_STEPS.length);
  }, [requireAuth]);

  const handleActionPlaceholder = useCallback(
    (action) => {
      if (!requireAuth()) return;
      toast({ description: `Muy pronto liberaremos: ${action?.label || 'esta accion'}.` });
    },
    [requireAuth],
  );

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'apps', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const hasCommunityComments = useMemo(() => communityComments.length > 0, [communityComments]);
  const visibleComments = hasCommunityComments ? communityComments : JUEGOS_FALLBACK_COMMENTS;
  const juegosReadingAuthorLabel = (latestJuegosReading?.author || '').trim() || 'autor invitado';
  const juegosReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestJuegosReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.image_url) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.author_avatar_url) ||
    null;
  const currentStep = JUEGOS_STEPS[tapIndex % JUEGOS_STEPS.length];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-emerald-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Juegos</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{JUEGOS_TAGLINE}</p>
                  <p>{JUEGOS_INTRO}</p>
                </div>
                <IAInsightCard {...JUEGOS_IA_PROFILE} compact />
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={JUEGOS_NOTA_AUTORAL.title}
                    verse={JUEGOS_NOTA_AUTORAL.verse}
                    palette={JUEGOS_TILE}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Tap-to-advance demo</p>
                  <h4 className="font-display text-xl text-slate-100">Jugar demo</h4>
                </div>
                <span className="rounded-full border border-emerald-200/40 bg-emerald-500/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-emerald-100">
                  {tapIndex + 1}/{JUEGOS_STEPS.length}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-slate-900/60 via-black/40 to-purple-900/30 p-5 space-y-3 shadow-[0_15px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-emerald-100/80">Paso {tapIndex + 1}</p>
                <h5 className="text-lg font-semibold text-slate-100">{currentStep.title}</h5>
                <p className="text-sm text-slate-200/85 leading-relaxed">{currentStep.description}</p>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleTapAdvance}
                    className="w-full justify-center bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/80 hover:to-emerald-500/80 text-white"
                  >
                    Tap siguiente
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {JUEGOS_STEPS.map((step, index) => (
                    <span
                      key={step.id}
                      className={`h-2 w-2 rounded-full transition ${
                        index === tapIndex ? 'bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-emerald-300/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Acciones</p>
                <div className="space-y-3">
                  {JUEGOS_ACTIONS.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3"
                    >
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400/70">{action.label}</p>
                        <p className="text-sm text-slate-200/85 leading-relaxed">{action.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center border-emerald-300/40 text-emerald-100 hover:bg-emerald-500/10"
                        onClick={() => handleActionPlaceholder(action)}
                      >
                        <Gamepad2 size={15} className="mr-2" />
                        {action.buttonLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
            <div className="mb-1 flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Voces de la comunidad</p>
              <RelatedReadingTooltipButton
                slug={latestJuegosReading?.slug}
                authorLabel={juegosReadingAuthorLabel}
                thumbnailUrl={juegosReadingThumbnailUrl}
                ariaLabel="Mostrar lectura relacionada de Juegos"
                tone="cyan"
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
                      key={`portal-juegos-comment-${comment.id}`}
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
          initialCategoryId="apps"
        />
      </div>
    </div>
  );
};

export default PortalJuegos;
