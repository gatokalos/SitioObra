import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Compass, Feather, Search, Send, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  BLOG_CATEGORY_CONFIG,
  BLOG_CATEGORY_ORDER,
  deriveBlogCategory,
} from '@/lib/blogCategories';
import { recordArticleInteraction } from '@/services/articleInteractionService';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const MINIVERSE_HIERARCHY = {
  cine: {
    label: 'Miniverso Cine',
    views: 4320,
    subcategories: ['Quirón', 'Copycats', 'Campo expandido'],
  },
  expansiones: {
    label: 'Expansiones Narrativas',
    views: 3860,
    subcategories: ['Cartas', 'Bitácoras', 'Microrrelatos'],
  },
  curaduria: {
    label: 'Curaduría Reflexiva',
    views: 2780,
    subcategories: ['Ensayo crítico', 'Cartografías emocionales'],
  },
  apps: {
    label: 'Miniverso Apps',
    views: 2190,
    subcategories: ['Guardianes digitales', 'Glitches', 'Rituales móviles'],
  },
  sonoro: {
    label: 'Miniverso Sonoro',
    views: 2010,
    subcategories: ['Pistas', 'Field recordings', 'Ondas'],
  },
  bitacora: {
    label: 'Miniverso Bitácora',
    views: 1760,
    subcategories: ['Crónicas', 'Archivo vivo', 'Cartas'],
  },
  taza: {
    label: 'Miniverso Taza',
    views: 1630,
    subcategories: ['Objetos rituales', 'Memorias líquidas'],
  },
  otro: {
    label: 'Otra contribución',
    views: 1480,
    subcategories: ['Performance', 'Investigación híbrida'],
  },
};

const MINIVERSE_KEYWORDS = {
  cine: ['cine', 'quirón', 'copycats', 'film', 'película'],
  expansiones: ['expansiones', 'miniverso', 'novela', 'diario', 'microficción'],
  curaduria: ['curaduría', 'critica', 'analisis', 'ensayo'],
  apps: ['app', 'apps', 'digital', 'interactivo'],
  sonoro: ['sonoro', 'audio', 'música', 'sonidos'],
  bitacora: ['bitácora', 'bitacora', 'cronica', 'crónica'],
  taza: ['taza', 'objeto', 'cerámica', 'ritual'],
  otro: ['performance', 'híbrido', 'glitch', 'experimental'],
};

const STARTER_FAQ_PROMPTS = [
  '¿Cuál es la relación entre Es un gato encerrado y una causa social?',
  '¿Qué diferencia hay entre la obra de teatro y #GatoEncerrado?',
  '¿Tengo que ver la obra primero para entender este universo?',
  '¿El sitio continúa la historia o es otra cosa?',
  '¿Qué pasa si solo quiero curiosear sin registrarme?',
  '¿A alguien más le dio ansiedad esta obra… o solo a mí?',
  '¿Queda claro qué le pasa a Silvestre al final de la obra?',
  '¿Lo de las marcianas era literal o se me fue algo?',
  '¿Esto es arte, experimento o estrategia de marketing?',
  '¿Qué parte de lo que veo aquí fue escrita por una persona y qué parte por una máquina?',
  'Si la IA desapareciera mañana, ¿seguiría existiendo #GatoEncerrado?',
  '¿Qué tendría que pasar para que este proyecto florezca?',
  '¿Qué pasa después de que termina la función?'
];

const inferMiniverseFromPost = (post) => {
  const haystack = [
    post.category,
    post.slug,
    post.title,
    post.excerpt,
    ...(Array.isArray(post.tags) ? post.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const [key, keywords] of Object.entries(MINIVERSE_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return key;
    }
  }

  return 'curaduria';
};

const normalizeForSearch = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseReadMinutes = (value) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  return Math.round(minutes);
};

const markdownComponents = {
  p: ({ node: _node, ...props }) => (
    <p className="text-[1.02rem] md:text-[1.08rem] leading-8 font-light text-slate-200" {...props} />
  ),
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node: _node, ...props }) => <em className="italic text-slate-100" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="border-l-4 border-purple-400/60 pl-4 italic text-slate-200/90 bg-white/5 py-2 rounded-r-xl"
      {...props}
    />
  ),
  ul: ({ node: _node, ordered: _ordered, ...props }) => (
    <ul className="ml-6 list-disc space-y-2 text-[1rem] md:text-[1.04rem] text-slate-200" {...props} />
  ),
  ol: ({ node: _node, ordered: _ordered, ...props }) => (
    <ol className="ml-6 list-decimal space-y-2 text-[1rem] md:text-[1.04rem] text-slate-200" {...props} />
  ),
  li: ({ node: _node, ordered: _ordered, ...props }) => (
    // ReactMarkdown envía `ordered` como boolean; lo omitimos para evitar warnings en el DOM.
    <li className="leading-relaxed" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a
      className="text-purple-300 underline decoration-dotted hover:text-purple-200 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  img: ({ node: _node, src, alt, ...props }) => {
    const safeSrc = sanitizeExternalHttpUrl(src);
    if (!safeSrc) return null;
    return (
      <img
        src={safeSrc}
        alt={alt || ''}
        loading="lazy"
        className="my-4 w-full rounded-2xl border border-white/10 object-cover"
        {...props}
      />
    );
  },
};

const ArticleCard = ({ post, onSelect }) => {
  const publishedDate = post.published_at ? new Date(post.published_at) : null;
  const previewImage = sanitizeExternalHttpUrl(post.featured_image_url);
  const hasPreview = Boolean(previewImage);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-effect rounded-2xl p-8 md:p-10 flex flex-col hover-glow transition-shadow"
    >
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-slate-400">
        {publishedDate && (
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} />
            {publishedDate.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
        {post.read_time_minutes ? (
          <span className="inline-flex items-center gap-2">
            <Clock size={16} />
            {post.read_time_minutes} min lectura
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <Feather size={16} />
          {post.author}
          {post.author_role ? <span className="text-slate-500">/ {post.author_role}</span> : null}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-2xl md:text-3xl font-medium text-slate-100">{post.title}</h3>
        </div>
        <p
          className="text-slate-300/80 leading-relaxed font-light mt-4"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>
      </div>

      {Array.isArray(post.tags) && post.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs uppercase tracking-wider text-purple-200/80 bg-purple-500/10 border border-purple-400/20 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {hasPreview ? (
        <div className="hidden md:block mb-6">
          <div className="relative h-44 lg:h-64 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={previewImage}
              alt={post.title}
              className="h-full w-full object-cover saturate-50 contrast-125 opacity-[0.15]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/12 via-purple-500/18 to-indigo-500/14 mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(0,0,0,0.65),transparent_55%)] opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/75 backdrop-blur-sm" />
          </div>
        </div>
      ) : null}
      {hasPreview ? (
        <div className="md:hidden mb-6">
          <div className="relative h-44 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={previewImage}
              alt={post.title}
              className="h-full w-full object-cover saturate-50 contrast-125 opacity-[0.15]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/12 via-purple-500/18 to-indigo-500/14 mix-blend-screen" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(0,0,0,0.65),transparent_55%)] opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/75 backdrop-blur-sm" />
          </div>
        </div>
      ) : null}

      <Button
        onClick={() => onSelect(post)}
        variant="outline"
        className="self-start border-purple-400/40 text-purple-200 hover:bg-purple-500/20"
      >
        Leer artículo completo
      </Button>
    </motion.article>
  );
};

const ArticleCardSkeleton = () => (
  <motion.div
    variants={containerVariants}
    className="glass-effect rounded-2xl p-8 md:p-10 flex flex-col gap-4 animate-pulse"
  >
    <div className="h-4 bg-white/10 rounded w-1/3" />
    <div className="h-8 bg-white/10 rounded w-3/4" />
    <div className="h-20 bg-white/5 rounded" />
    <div className="flex gap-2 mt-auto">
      <span className="h-8 w-24 bg-white/10 rounded-full" />
      <span className="h-8 w-32 bg-white/10 rounded-full" />
    </div>
  </motion.div>
);

const FullArticle = ({ post, onClose }) => {
  const articleContent = useMemo(() => post?.content?.trim() ?? '', [post]);
  const articleImage = sanitizeExternalHttpUrl(post?.featured_image_url ?? null);
  const articleCaption = post?.image_caption?.trim?.() ?? '';
  const [showMobileCaption, setShowMobileCaption] = useState(false);

  const publishedDate = post.published_at ? new Date(post.published_at) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-[560px] glass-effect rounded-3xl border border-white/10 p-5 sm:p-7 md:p-10 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
        <div className="flex flex-col gap-2 text-sm text-slate-400">
          {publishedDate ? (
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} />
              {publishedDate.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <Feather size={16} />
            {post.author}
            {post.author_role ? <span className="text-slate-500">/ {post.author_role}</span> : null}
          </span>
          {post.read_time_minutes ? (
            <span className="inline-flex items-center gap-2">
              <Clock size={16} />
              {post.read_time_minutes} min lectura
            </span>
          ) : null}
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="text-slate-300 hover:text-white hover:bg-white/10 border border-white/10"
        >
          Cerrar artículo
        </Button>
      </div>

      <h3 className="mb-6 font-display text-2xl font-semibold text-slate-50 sm:text-3xl md:mb-8 md:text-4xl">
        {post.title}
      </h3>

      {articleImage ? (
        <button
          type="button"
          onClick={() => setShowMobileCaption((prev) => !prev)}
          className="md:hidden my-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 aspect-[16/9] relative text-left"
          aria-pressed={showMobileCaption}
        >
          <img
            src={articleImage}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {articleCaption ? (
            <div
              className={`absolute inset-x-0 bottom-0 px-4 py-3 text-xs text-slate-100 bg-black/60 backdrop-blur-sm transition-opacity ${
                showMobileCaption ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {articleCaption}
            </div>
          ) : null}
        </button>
      ) : null}
      {articleImage ? (
        <div className="mb-10 hidden md:block">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 aspect-[16/9]">
            <img
              src={articleImage}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/35 pointer-events-none" />
            {articleCaption ? (
              <div className="absolute inset-x-0 bottom-0 px-4 py-3 text-xs text-slate-100 bg-black/55 backdrop-blur-sm">
                {articleCaption}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {articleContent ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 text-slate-200 font-light">
          <ReactMarkdown components={markdownComponents} skipHtml={false} linkTarget="_blank">
            {articleContent}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-6 text-slate-200 leading-relaxed font-light">
          <p>
            Este artículo estará disponible muy pronto. Gracias por tu interés en la comunidad crítica de
            #GatoEncerrado.
          </p>
        </div>
      )}
      <ArticleInteractionPanel post={post} />
      <div className="mt-8 flex justify-center">
        <Button
          onClick={onClose}
          variant="outline"
          className="border-white/20 text-slate-200 hover:bg-white/10 hover:text-white"
        >
          Cerrar línea editorial
        </Button>
      </div>
    </motion.div>
  );
};

const ArticleInteractionPanel = ({ post }) => {
  const { user } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const openLoginOverlay = useCallback(() => setShowLoginOverlay(true), []);
  const closeLoginOverlay = useCallback(() => setShowLoginOverlay(false), []);

  const inferredMiniverseKey = useMemo(() => inferMiniverseFromPost(post), [post]);
  const miniverseInfo = MINIVERSE_HIERARCHY[inferredMiniverseKey] ?? MINIVERSE_HIERARCHY.curaduria;
  const [wantsNotification, setWantsNotification] = useState(false);
  const [status, setStatus] = useState({ share: 'idle', notify: 'idle' });
  const authorAvatar = sanitizeExternalHttpUrl(post?.author_avatar_url);
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const { origin, pathname } = window.location;
    if (!post?.slug) {
      return `${origin}${pathname}#dialogo-critico`;
    }
    return `${origin}${pathname}#blog/${encodeURIComponent(post.slug)}`;
  }, [post?.slug]);

  const handleNotify = async () => {
    const nextNotify = !wantsNotification;

    if (!user) {
      toast({
        description: 'Inicia sesión para recibir notificaciones y continuar en el Backstage.',
      });
      openLoginOverlay();
      return;
    }

    setStatus((prev) => ({ ...prev, notify: 'loading' }));

    const { success, error } = await recordArticleInteraction({
      post,
      action: 'notify',
      notify: nextNotify,
      miniverse: inferredMiniverseKey,
      mostViewedMiniverse: miniverseInfo.label,
      mostViewedMiniverseCount: miniverseInfo.views ?? null,
    });

    if (!success) {
      console.error('[ArticleInteraction] Error guardando interacción:', error);
      toast({ description: 'No pudimos guardar tu interacción. Intenta nuevamente.' });
    } else {
      setWantsNotification(nextNotify);
      toast({
        description: nextNotify
          ? 'Te avisaremos cuando haya novedades sobre este texto.'
          : 'Ya no recibes notificaciones de este artículo.',
      });
    }

    setStatus((prev) => ({ ...prev, notify: 'idle' }));
  };

  const handleShare = async () => {
    if (status.share === 'loading') {
      return;
    }

    setStatus((prev) => ({ ...prev, share: 'loading' }));

    const shareData = {
      title: post?.title || 'Es un gato encerrado',
      text: post?.title
        ? `Lee "${post.title}" en Es un gato encerrado.`
        : 'Lee este artículo en Es un gato encerrado.',
      url: shareUrl,
    };

    let didShare = false;
    let usedFallback = false;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        didShare = true;
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[ArticleInteraction] Error al compartir:', error);
        }
      }
    }

    if (!didShare) {
      try {
        if (navigator?.clipboard?.writeText && shareData.url) {
          await navigator.clipboard.writeText(shareData.url);
          didShare = true;
          usedFallback = true;
          toast({ description: 'Enlace copiado. Compártelo donde quieras.' });
        }
      } catch (error) {
        console.error('[ArticleInteraction] Error al copiar enlace:', error);
      }
    }

    if (!didShare) {
      toast({ description: 'No pudimos compartir el artículo. Intenta de nuevo.' });
      setStatus((prev) => ({ ...prev, share: 'idle' }));
      return;
    }

    const { success, error } = await recordArticleInteraction({
      post,
      action: 'share',
      shared: true,
      miniverse: inferredMiniverseKey,
      mostViewedMiniverse: miniverseInfo.label,
      mostViewedMiniverseCount: miniverseInfo.views ?? null,
    });

    if (!success) {
      console.error('[ArticleInteraction] Error guardando interacción:', error);
      toast({ description: 'No pudimos registrar tu interacción. Intenta nuevamente.' });
    } else if (!usedFallback) {
      toast({ description: 'Gracias por compartir este texto.' });
    }

    setStatus((prev) => ({ ...prev, share: 'idle' }));
  };

  return (
    <>
      <div className="mt-10 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <p className="text-base text-slate-200">¿La lectura te movió?</p>
      <p className="text-sm text-slate-400 mt-1">
        Clic en los botones para compartir este texto o seguir a su autor en el Backstage.
      </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <Button
            variant="default"
            size="lg"
            onClick={handleShare}
            disabled={status.share === 'loading'}
            className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 w-full sm:w-auto whitespace-normal break-words text-center leading-snug inline-flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Compartir este artículo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNotify}
            disabled={status.notify === 'loading'}
            className="border-slate-400/40 text-purple-200 hover:bg-purple-500/20 w-full sm:w-auto whitespace-normal break-words text-center leading-snug inline-flex items-center gap-3 pl-4"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-200/40 bg-purple-500/20 shadow-[0_0_16px_rgba(168,85,247,0.45)] overflow-hidden flex-shrink-0">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={post.author ? `Retrato de ${post.author}` : 'Autor'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-200/90" />
              )}
            </span>
            <span>{wantsNotification ? 'Te avisaremos de novedades' : 'Quiero leer más de este autor'}</span>
          </Button>
        </div>
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={closeLoginOverlay} /> : null}
    </>
  );
};

const Blog = ({ posts = [], isLoading = false, error = null }) => {
  const {
    query: faqQuery,
    setQuery: setFaqQuery,
    answer: faqAnswer,
    sources: faqSources,
    status: faqStatus,
    errorMessage: faqErrorMessage,
    search: faqSearch,
    reset: faqReset,
    isLoading: faqIsLoading,
  } = useSearch();
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [searchCompletions, setSearchCompletions] = useState(() => {
    try { return parseInt(localStorage.getItem('gato_faq_count') || '0', 10); } catch { return 0; }
  });
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const prevFaqStatus = useRef(null);
  const [activeCategory, setActiveCategory] = useState(BLOG_CATEGORY_ORDER[0]);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [isEditorialLineOpen, setIsEditorialLineOpen] = useState(false);
  const articlesRef = useRef(null);
  const faqInputRef = useRef(null);

  const categorizedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        category: deriveBlogCategory(post),
      })),
    [posts]
  );

  const sortedPosts = useMemo(
    () =>
      [...categorizedPosts].sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      }),
    [categorizedPosts]
  );

  const filteredPosts = useMemo(() => {
    return sortedPosts.filter((post) => {
      const matchesCategory = post.category === activeCategory;
      return matchesCategory;
    });
  }, [sortedPosts, activeCategory]);
  const visiblePosts = useMemo(
    () => (showAllPosts ? filteredPosts : filteredPosts.slice(0, 2)),
    [filteredPosts, showAllPosts]
  );
  const canShowAllPosts = !isLoading && !showAllPosts && filteredPosts.length > 2;
  const editorialReadMetrics = useMemo(() => {
    const metrics = BLOG_CATEGORY_ORDER.reduce((accumulator, category) => {
      accumulator[category] = { totalMinutes: 0, postCount: 0 };
      return accumulator;
    }, {});

    for (const post of sortedPosts) {
      const category = post.category;
      if (!BLOG_CATEGORY_ORDER.includes(category)) {
        continue;
      }

      const minutes = parseReadMinutes(post.read_time_minutes);
      if (minutes === null) {
        continue;
      }

      metrics[category].totalMinutes += minutes;
      metrics[category].postCount += 1;
    }

    return metrics;
  }, [sortedPosts]);
  const getCategoryReadTimeLabel = useCallback(
    (category) => {
      const metrics = editorialReadMetrics[category];
      if (metrics && metrics.totalMinutes > 0) {
        return `${metrics.totalMinutes} min total`;
      }
      return BLOG_CATEGORY_CONFIG[category]?.readingTime ?? 'Tiempo variable';
    },
    [editorialReadMetrics]
  );
  const showEditorialContent = !isMobileViewport || isEditorialLineOpen;
  const editorialCategories = useMemo(
    () =>
      BLOG_CATEGORY_ORDER.map((category) => ({
        key: category,
        ...BLOG_CATEGORY_CONFIG[category],
        readingTimeLabel: getCategoryReadTimeLabel(category),
      })),
    [getCategoryReadTimeLabel]
  );
  const featuredEditorialCategory = editorialCategories[0] ?? null;
  const secondaryEditorialCategories = editorialCategories.slice(1);

  const handleSelectPost = useCallback(
    (post) => {
      if (!post) return;
      if (post.category && BLOG_CATEGORY_ORDER.includes(post.category)) {
        setActiveCategory(post.category);
      }
      if (isMobileViewport) {
        setIsEditorialLineOpen(true);
      }
      setActivePost(post);
      // Espera a que el panel/artículo se pinte antes de hacer scroll.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const articleElement = document.getElementById('blog-article');
          articleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },
    [isMobileViewport]
  );

  const handleExploreCategory = useCallback((category) => {
    setActiveCategory(category);
    if (isMobileViewport) {
      setIsEditorialLineOpen(true);
    }
    requestAnimationFrame(() => {
      articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [isMobileViewport]);

  const handleCloseEditorialLine = useCallback(() => {
    setActivePost(null);
    setShowAllPosts(false);
    if (isMobileViewport) {
      setIsEditorialLineOpen(false);
      requestAnimationFrame(() => {
        document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [isMobileViewport]);

  const handleFaqPromptSelect = useCallback((prompt) => {
    setFaqQuery(prompt);
    faqSearch(prompt);
  }, [setFaqQuery, faqSearch]);

  useEffect(() => {
    if (prevFaqStatus.current !== 'done' && faqStatus === 'done') {
      setSearchCompletions((prev) => {
        const next = prev + 1;
        try { localStorage.setItem('gato_faq_count', String(next)); } catch {}
        return next;
      });
    }
    prevFaqStatus.current = faqStatus;
  }, [faqStatus]);

  useEffect(() => {
    if (pendingSlug && categorizedPosts.length > 0) {
      const target = categorizedPosts.find((item) => item.slug === pendingSlug);
      if (target) {
        handleSelectPost(target);
        setPendingSlug(null);
      }
    }
  }, [handleSelectPost, pendingSlug, categorizedPosts]);

  useEffect(() => {
    if (error) {
      toast({ description: 'No se pudieron cargar los artículos del blog.' });
    }
  }, [error]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setIsEditorialLineOpen(false);
      }
    };
    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setShowAllPosts(false);
  }, [activeCategory]);

  useEffect(() => {
    const handleNavigate = (event) => {
      const { slug } = event.detail || {};
      if (!slug) {
        return;
      }

      const target = categorizedPosts.find((item) => item.slug === slug);
      if (target) {
        handleSelectPost(target);
      } else {
        setPendingSlug(slug);
      }

      document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth' });
    };

    window.addEventListener('gatoencerrado:open-blog', handleNavigate);
    return () => window.removeEventListener('gatoencerrado:open-blog', handleNavigate);
  }, [handleSelectPost, categorizedPosts]);

  useEffect(() => {
    const extractSharedSlug = () => {
      if (typeof window === 'undefined') {
        return null;
      }

      const rawHash = window.location.hash || '';
      const match = rawHash.match(/^#?(?:blog|dialogo-critico)\/(.+)$/);
      if (!match) {
        return null;
      }

      try {
        return decodeURIComponent(match[1]);
      } catch (error) {
        return match[1];
      }
    };

    const openFromHash = () => {
      const slug = extractSharedSlug();
      if (!slug) {
        return;
      }

      const target = categorizedPosts.find((item) => item.slug === slug);
      if (target) {
        handleSelectPost(target);
      } else {
        setPendingSlug(slug);
      }

      document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth' });
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [handleSelectPost, categorizedPosts]);

  return (
    <>
      <section id="dialogo-critico" className="py-24 relative min-h-[900px]">
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Diálogo / Reflexión</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
              Curaduría, comunidad y resonancia
            </h2>
            <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
              Un espacio de pensamiento crítico, creatividad y poética donde convergen textos especializados, ficción expandida y
              noticias detrás de escena. Usa el Buscador Backstage, filtra por interés o explora las líneas editoriales.
            </p>
          </motion.div>

          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              {featuredEditorialCategory ? (
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.99 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  viewport={{ once: true, amount: 0.6 }}
                  className="relative overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/14 to-indigo-500/18 px-5 py-4 shadow-[0_20px_56px_rgba(76,29,149,0.28)]"
                >
                  <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-violet-300/20 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-20 left-12 h-40 w-40 rounded-full bg-cyan-300/10 blur-2xl" />
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-100/75 to-transparent" />

                  <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                    <div className="flex flex-col gap-3 p-1 lg:rounded-[1.4rem] lg:border lg:border-violet-100/18 lg:bg-black/20 lg:p-5 lg:backdrop-blur-sm">
                      <div className="space-y-3">
                        <span className="inline-flex items-center rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-violet-300">
                          Buscador Backstage
                        </span>
                        <p className="text-[1rem] font-semibold leading-snug text-white">
                         <em> ¿Primera vez en el sitio? ¿Ya viste la obra?</em><br /> Este es un espacio para explayarte y encontrar respuestas.
                        </p>
                      </div>
                      <div className="relative w-full">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-100/55" />
                        <input
                          ref={faqInputRef}
                          type="search"
                          value={faqQuery}
                          onChange={(event) => setFaqQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && faqQuery.trim().length >= 2) faqSearch();
                          }}
                          placeholder="A tus órdenes... 😸"
                          disabled={faqIsLoading}
                          className="form-surface form-surface--pill h-12 w-full border border-violet-100/45 bg-white/90 py-2 pl-11 pr-12 text-sm text-slate-900 placeholder:text-slate-500 disabled:opacity-60"
                        />
                        {faqQuery.trim().length >= 2 && !faqIsLoading && (
                          <button
                            type="button"
                            onClick={() => faqSearch()}
                            aria-label="Buscar"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-violet-500/80 p-1.5 text-white hover:bg-violet-500 transition"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        {faqIsLoading && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-violet-400/40 border-t-violet-500 animate-spin" aria-hidden="true" />
                        )}
                      </div>

                      {/* Panel de respuesta RAG */}
                      {(faqStatus === 'searching' || faqStatus === 'streaming' || faqStatus === 'done' || faqStatus === 'error') && (
                        <div className="mt-1 border-t border-violet-100/15 pt-3 text-sm text-violet-50/90 space-y-2">
                          {faqStatus === 'searching' && (
                            <p className="text-violet-200/70 animate-pulse">Buscando en el universo GatoEncerrado…</p>
                          )}
                          {(faqStatus === 'streaming' || faqStatus === 'done') && faqAnswer && (
                            <div className="leading-relaxed">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold text-violet-200">{children}</strong>,
                                  em: ({ children }) => <em className="italic text-violet-100/90">{children}</em>,
                                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>,
                                  li: ({ children }) => <li className="text-violet-50/90">{children}</li>,
                                }}
                              >
                                {faqAnswer}
                              </ReactMarkdown>
                              {faqStatus === 'streaming' && (
                                <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-violet-300 animate-pulse align-middle" aria-hidden="true" />
                              )}
                            </div>
                          )}
                          {faqStatus === 'done' && faqSources.length > 0 && (
                            <div className="pt-1 border-t border-violet-100/15 space-y-1">
                              <p className="text-[10px] uppercase tracking-[0.24em] text-violet-200/55">Artículos relacionados</p>
                              <ul className="space-y-0.5">
                                {faqSources.map((s) => (
                                  <li key={s.slug}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const post = posts.find((p) => p.slug === s.slug);
                                        if (post) handleSelectPost(post);
                                      }}
                                      className="text-violet-300 hover:text-violet-100 underline decoration-dotted transition text-left"
                                    >
                                      {s.title}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {faqStatus === 'error' && (
                            <p className="text-red-300/80">{faqErrorMessage || 'No se pudo completar la búsqueda.'}</p>
                          )}
                          {(faqStatus === 'done' || faqStatus === 'error') && (
                            <button
                              type="button"
                              onClick={faqReset}
                              className="text-[20px] uppercase tracking-[0.22em] text-violet-200/45 hover:text-violet-200/80 transition"
                            >
                              🔍
                            </button>
                          )}
                          <AnimatePresence>
                            {faqStatus === 'done' && searchCompletions >= 3 && !nudgeDismissed && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="relative mt-1 rounded-xl border border-violet-300/30 bg-violet-500/10 px-5 py-4"
                              >
                                <button
                                  type="button"
                                  onClick={() => setNudgeDismissed(true)}
                                  aria-label="Cerrar"
                                  className="absolute right-2.5 top-2.5 text-violet-200/40 hover:text-violet-200/80 transition"
                                >
                                  <X size={13} />
                                </button>
                                <p className="font-display text-lg leading-snug text-violet-100 pr-5">
                                  ¿Tienes curiosidad gatuna?
                                </p>
                      
                                <button
                                  type="button"
                                  onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/20 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-violet-200 hover:bg-violet-500/35 hover:text-white transition"
                                >
                                  Escríbenos algo de tu autoría →
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

      
                    </div>

                    <div className="space-y-3 lg:pl-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/45 bg-violet-400/12 px-3 py-1">
                        <Compass size={12} className="text-violet-100/95" aria-hidden="true" />
                        <p className="text-[10px] uppercase tracking-[0.34em] text-violet-100/90">Preguntas frecuentes</p>
                      </div>
                
                      <div className="grid gap-2">
                        {STARTER_FAQ_PROMPTS.slice(0, 3).map((prompt) => (
                          <button
                            type="button"
                            key={prompt}
                            onClick={() => handleFaqPromptSelect(prompt)}
                            className="rounded-2xl border border-violet-100/20 bg-white/8 px-4 py-3 text-left text-sm leading-relaxed text-violet-50 transition hover:border-violet-100/40 hover:bg-white/12"
                          >
                            {prompt}
                          </button>
                        ))}
                        <AnimatePresence>
                          {faqStatus === 'done' && STARTER_FAQ_PROMPTS.slice(3).map((prompt) => (
                            <motion.button
                              key={prompt}
                              type="button"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              onClick={() => handleFaqPromptSelect(prompt)}
                              className="rounded-2xl border border-violet-100/20 bg-white/8 px-4 py-3 text-left text-sm leading-relaxed text-violet-50 transition hover:border-violet-100/40 hover:bg-white/12"
                            >
                              {prompt}
                            </motion.button>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-3">
                {featuredEditorialCategory ? (
                  <article className="glass-effect rounded-2xl border border-violet-300/30 bg-gradient-to-br from-[#0a1127]/90 via-[#111735]/85 to-[#1a1340]/72 p-6 md:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.35em] text-violet-200/85">
                        {featuredEditorialCategory.label}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-slate-300/85">
                          {featuredEditorialCategory.readingTimeLabel}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-[1.02rem] font-medium leading-relaxed text-slate-100">
                      {featuredEditorialCategory.hook}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300/85">
                      {featuredEditorialCategory.summary}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => handleExploreCategory(featuredEditorialCategory.key)}
                      className="mt-3 px-0 text-violet-200 hover:text-white"
                    >
                      {featuredEditorialCategory.ctaLabel}
                    </Button>
                  </article>
                ) : null}

                {secondaryEditorialCategories.map((category) => (
                  <article
                    key={category.key}
                    className="glass-effect rounded-2xl border border-white/10 bg-black/25 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300/85">
                        {category.label}
                      </p>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.24em] text-slate-400/90">
                        {category.readingTimeLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-slate-100">
                      {category.hook}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                      {category.summary}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => handleExploreCategory(category.key)}
                      className="mt-3 self-start px-0 text-purple-300 hover:text-white"
                    >
                      {category.ctaLabel}
                    </Button>
                  </article>
                ))}
              </div>
            </motion.div>

            {showEditorialContent ? (
              <>
                <motion.div
                  ref={articlesRef}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => <ArticleCardSkeleton key={`skeleton-${index}`} />)
                  ) : filteredPosts.length === 0 ? (
                    <motion.div variants={containerVariants} className="md:col-span-2 text-center text-slate-400 py-12">
                      No encontramos textos con ese criterio. Ajusta el filtro o comparte un nuevo testimonio.
                    </motion.div>
                  ) : (
                    visiblePosts.map((post) => <ArticleCard key={post.id} post={post} onSelect={handleSelectPost} />)
                  )}
                </motion.div>

                {canShowAllPosts ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllPosts(true)}
                      className="border-white/20 text-slate-200 hover:bg-white/10"
                    >
                      Mostrar siguientes textos
                    </Button>
                  </div>
                ) : null}

                <div id="blog-article">
                  <AnimatePresence mode="wait">
                    {activePost ? (
                      <FullArticle
                        key={activePost.id}
                        post={activePost}
                        onClose={handleCloseEditorialLine}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {BLOG_CATEGORY_ORDER.map((category) => (
                      <button
                        type="button"
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          activeCategory === category
                            ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                            : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                        }`}
                      >
                        {BLOG_CATEGORY_CONFIG[category].label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 md:text-right">
                    Explora por línea editorial
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300/80">
                Elige una línea editorial para abrir sus textos.
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
};

export default Blog;
