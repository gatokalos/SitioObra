import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Hand, Heart, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import AutoficcionPreviewOverlay from '@/components/novela/AutoficcionPreviewOverlay';
import { fetchApprovedContributions } from '@/services/contributionService';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { startDirectMerchCheckout } from '@/lib/merchCheckout';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';

const LITERATURA_INTRO =
  'En este miniverso literario se entiende la escritura como una forma de expansion. No es un complemento de la obra escénica, sino un espacio propio donde fragmentos, voces, poemas y apuntes dialogan entre si y amplian el universo #Gato Encerrado.';
const LITERATURA_NOTA_AUTORAL = {
  title: '#LaPreguntaInsiste',
  verse: 'Escribí para entender\ny la página me abrió otra pregunta.',
};
const LITERATURA_TILE = {
  gradient: 'linear-gradient(135deg, rgba(26,24,60,0.95), rgba(59,43,95,0.85), rgba(108,56,118,0.7))',
  border: 'rgba(196,181,253,0.38)',
  text: '#ede9fe',
  accent: '#ddd6fe',
  background: 'rgba(26,24,60,0.74)',
};
const LITERATURA_IA_PROFILE = {
  type: 'GPT-4o mini + voz sintética para fragmentos.',
  interaction: 'Guía de lectura y acompañamiento breve por capítulo.',
  tokensRange: '150-320 tokens por fragmento leído.',
  coverage: 'Cubierto por suscriptores; lectura sin costo adicional.',
  footnote: 'La IA susurra; la historia sigue siendo tuya.',
};
const LITERATURA_COLLABORATORS = [
  {
    id: 'pepe-rojo',
    name: 'Pepe Rojo',
    role: 'Escritor y crítico cultural',
    bio: 'Acompano la literatura de este miniverso con una lectura precisa y generosa. Su intervención dio claridad y ruta al futuro de la obra.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/peperojo.jpeg',
  },
  {
    id: 'groppe-imprenta',
    name: 'Groppe Libros',
    role: 'Edición física',
    bio: 'Acompano la primera edición física de Mi Gato Encerrado con oficio paciente y preciso, dando cuerpo de libro a este universo.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/groppelibros.png',
  },
];
const LITERATURA_ENTRY = {
  title: 'Despierta dentro del libro',
  description: 'Lectura como acto de conciencia: cruzar sus páginas es recorrer la mente misma.',
  image: '/assets/edicion-fisica.png',
  snippetTitle: 'Tu ejemplar como portal',
  snippetText:
    'Escanea el QR de tu libro para acceder a lecturas ocultas y conversaciones con otros lectores del universo #GatoEncerrado.',
};
const LITERATURA_QUOTES = [
  {
    id: 'comentarios-lectores-1',
    quote: 'No sabía que un libro podia hablarme a mitad de la página.',
    author: 'Lectora anonima',
  },
  {
    id: 'comentarios-lectores-2',
    quote: 'Volví a subrayar y entendí que la obra también estaba escribiendo mi propia memoria.',
    author: 'Club de Lectura Frontera',
  },
];
const LITERATURA_BLOG_KEYS = [
  'miniversonovela',
  'novela',
  'literatura',
  'miniverso_novela',
  'miniverso-novela',
];
const LITERATURA_BLOG_KEY_SET = new Set(LITERATURA_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

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
          Haz clic para guardar un like y amplificar las conversaciones que la novela susurra.
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
      {status === 'loading' ? 'Enviando...' : 'Apoyar la novela'}
    </p>
  </div>
);

const PortalLiteratura = () => {
  const { user } = useAuth();
  usePortalTracking('literatura');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [communityComments, setCommunityComments] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [latestLiteraturaReading, setLatestLiteraturaReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [showAutoficcionPreview, setShowAutoficcionPreview] = useState(false);
  const [isNovelaCheckoutLoading, setIsNovelaCheckoutLoading] = useState(false);
  const readingTooltipRef = useRef(null);

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
    let isCancelled = false;
    const loadComments = async () => {
      setCommunityLoading(true);
      setCommunityError('');
      const topics = ['miniversoNovela', 'novela', 'literatura'];
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
    const loadLatestLiteraturaReading = async () => {
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
        console.warn('[PortalLiteratura] No se pudo detectar lectura relacionada:', error);
        setLatestLiteraturaReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return LITERATURA_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestLiteraturaReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestLiteraturaReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestLiteraturaReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestLiteraturaReading?.slug]);

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

  const handleOpenNovelaCheckout = useCallback(async () => {
    if (!requireAuth()) return;
    if (isNovelaCheckoutLoading) return;

    setIsNovelaCheckoutLoading(true);
    try {
      await startDirectMerchCheckout({
        packageId: 'novela-400',
        customerEmail: user?.email ?? '',
        metadata: {
          source: 'portal-literatura',
          package: 'novela-400',
        },
      });
    } catch (error) {
      console.error('[PortalLiteratura] Checkout error:', error);
      toast({ description: 'No pudimos abrir el checkout. Intenta nuevamente.' });
    } finally {
      setIsNovelaCheckoutLoading(false);
    }
  }, [isNovelaCheckoutLoading, requireAuth, user?.email]);

  const handleOpenAutoficcionPreview = useCallback(() => {
    if (!requireAuth()) return;
    setShowAutoficcionPreview(true);
  }, [requireAuth]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversoNovela', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const hasCommunityComments = useMemo(() => communityComments.length > 0, [communityComments]);
  const fallbackComments = useMemo(
    () =>
      LITERATURA_QUOTES.map((item) => ({
        id: item.id,
        proposal: item.quote,
        name: item.author,
      })),
    [],
  );
  const visibleComments = hasCommunityComments ? communityComments : fallbackComments;
  const literaturaReadingAuthorLabel = (latestLiteraturaReading?.author || '').trim() || 'autor invitado';
  const literaturaReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestLiteraturaReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.image_url) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Literatura</h3>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{LITERATURA_INTRO}</p>
                </div>
                <div className="hidden lg:block">
                  <IAInsightCard {...LITERATURA_IA_PROFILE} compact />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="lg:hidden">
                  <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" />
                </div>
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={LITERATURA_NOTA_AUTORAL.title}
                    verse={LITERATURA_NOTA_AUTORAL.verse}
                    palette={LITERATURA_TILE}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" />
          </div>
          <div className="lg:hidden">
            <IAInsightCard {...LITERATURA_IA_PROFILE} compact />
          </div>

          <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4">
                <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 h-52 sm:h-64">
                  <img
                    src={LITERATURA_ENTRY.image}
                    alt={LITERATURA_ENTRY.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <h5 className="font-display text-xl text-slate-100">{LITERATURA_ENTRY.title}</h5>
                  <p className="text-sm text-slate-300/80 leading-relaxed">{LITERATURA_ENTRY.description}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{LITERATURA_ENTRY.snippetTitle}</p>
                  <p className="text-sm text-slate-200/90 leading-relaxed">{LITERATURA_ENTRY.snippetText}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleOpenNovelaCheckout}
                    disabled={isNovelaCheckoutLoading}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
                  >
                    {isNovelaCheckoutLoading ? 'Abriendo checkout...' : 'Comprar edicion fisica'}
                  </button>
                  <Button
                    onClick={handleOpenAutoficcionPreview}
                    className="w-full sm:w-auto justify-center bg-purple-600/80 hover:bg-purple-600 text-white rounded-full"
                  >
                    <PenLine size={15} className="mr-2" />
                    Leer fragmentos
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4">
                <h5 className="font-display text-xl text-slate-100">Ecos del Club de Lectura</h5>
                <div className="space-y-3">
                  {LITERATURA_QUOTES.map((entry) => (
                    <blockquote key={entry.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-sm text-slate-200/90 leading-relaxed">"{entry.quote}"</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">{entry.author}</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Voces de la comunidad</p>
                  <RelatedReadingTooltipButton
                    slug={latestLiteraturaReading?.slug}
                    authorLabel={literaturaReadingAuthorLabel}
                    thumbnailUrl={literaturaReadingThumbnailUrl}
                    ariaLabel="Mostrar lectura relacionada de Literatura"
                    tone="cyan"
                  />
                </div>
                <div className="max-h-[260px] form-surface relative overflow-y-auto px-3 py-3 pr-2">
                  {communityLoading ? (
                    <p className="px-1 py-2 text-sm text-slate-600/85">Cargando comentarios...</p>
                  ) : communityError && !hasCommunityComments ? (
                    <p className="px-1 py-2 text-sm text-rose-700/85">{communityError}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {visibleComments.map((comment) => (
                        <div
                          key={`portal-literatura-comment-${comment.id}`}
                          className="rounded-xl border border-indigo-200/70 bg-white/72 p-3 shadow-[0_6px_18px_rgba(80,120,255,0.08)]"
                        >
                          <p className="mb-1.5 text-[0.96rem] font-light leading-relaxed text-slate-800">
                            {comment.proposal}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500/85">
                            {comment.name || 'Anonimo'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500/85">
                  Desliza para leer mas voces
                </p>
                <div className="pt-4 mt-1 border-t border-white/10">
                  <div className="mx-auto w-full max-w-md">
                    <button
                      type="button"
                      className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                      onClick={handleOpenCommunityComposer}
                    >
                      coméntanos algo aquí
                    </button>
                  </div>
                </div>

                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          </div>
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="miniverso_novela"
        />
      </div>

      <AutoficcionPreviewOverlay
        open={showAutoficcionPreview}
        onClose={() => setShowAutoficcionPreview(false)}
      />
    </div>
  );
};

export default PortalLiteratura;
