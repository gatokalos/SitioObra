import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Feather, FileSearch, RefreshCw, Send } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  BLOG_CATEGORY_CONFIG,
  BLOG_CATEGORY_ORDER,
  deriveBlogCategory,
} from '@/lib/blogCategories';
import { recordArticleInteraction } from '@/services/articleInteractionService';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import ObraConversationControls from '@/components/miniversos/obra/ObraConversationControls';

const CONTACT_PREFILL_KEY = 'gatoencerrado:contact-prefill';
const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';

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
  '¿Se puede cambiar algo con tan solo observarlo — incluyéndome a mí misma?',
  '¿Qué hay realmente detrás de las nueve formas de esta obra transmedia?',
  '¿En qué momento el peso de lo real se vuelve más de lo que puedes sostener?',
  '¿Por qué a veces es más fácil aislarse que admitir que necesitamos ayuda?',
  '¿Cómo se empieza a sanar una herida que viene de herecia familiar?',
  '¿Qué diferencia hay entre medir cuánta gente ve una obra y saber si cambió algo en el público?',
  '¿Qué pasa cuando las mismas personas que nos quieren también nos lastiman?',
  '¿Quién es Silvestre y qué le pasa en la obra?',
  '¿Se puede vivir con depresión durante años sin darse cuenta?',
  '¿Qué se hace con la voz que insiste en que uno no es suficiente?',
  '¿Qué se esconde detrás de la persona que parece estar bien todo el tiempo?',
  '¿En qué momento cuidar a alguien se vuelve querer controlarlo?',
    
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
  h1: ({ node: _node, ...props }) => (
    <h1
      className="mt-12 mb-6 border-b border-white/10 pb-4 font-display text-3xl font-semibold leading-tight text-white md:text-4xl"
      {...props}
    />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2
      className="mt-10 mb-5 border-b border-white/10 pb-3 font-display text-2xl font-semibold leading-tight text-white md:text-3xl"
      {...props}
    />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3
      className="mt-8 mb-3 font-display text-xl font-semibold leading-snug text-slate-50 md:text-2xl"
      {...props}
    />
  ),
  h4: ({ node: _node, ...props }) => (
    <h4
      className="mt-7 mb-3 text-sm font-semibold uppercase leading-snug tracking-[0.22em] text-purple-200"
      {...props}
    />
  ),
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
              className="ge-tag"
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
        className="ge-chip-action ge-chip-action--secondary ge-chip-action--compact self-start"
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
          className="ge-chip-action ge-chip-action--secondary ge-chip-action--compact"
        >
          Cerrar línea editorial
        </Button>
      </div>
    </motion.div>
  );
};

const ArticleInteractionPanel = ({ post }) => {
  const { user } = useAuth();

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
    return `${origin}/blog/${encodeURIComponent(post.slug)}`;
  }, [post?.slug]);

  const handleNotify = async () => {
    const nextNotify = !wantsNotification;
    const authorName = post?.author?.trim() || 'este autor';
    const articleTitle = post?.title?.trim() || 'este texto';
    const message = `Hola, quiero recibir más información sobre ${authorName} en el Backstage.\n\nVengo de leer "${articleTitle}" y me interesa saber cómo seguir su trabajo dentro del universo #GatoEncerrado.`;

    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(
        CONTACT_PREFILL_KEY,
        JSON.stringify({
          source: 'blog-author-backstage',
          articleSlug: post?.slug ?? null,
          articleTitle,
          author: authorName,
          message,
          createdAt: Date.now(),
        })
      );
      window.localStorage?.setItem(
        LOGIN_RETURN_KEY,
        JSON.stringify({
          anchor: '#contact',
          action: 'blog-author-backstage',
          source: 'blog',
          articleSlug: post?.slug ?? null,
        })
      );
      window.dispatchEvent(new CustomEvent('gatoencerrado:contact-prefill'));
    }

    setStatus((prev) => ({ ...prev, notify: 'loading' }));

    if (user) {
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
        toast({ description: 'No pudimos guardar tu interacción, pero puedes escribir desde contacto.' });
      } else {
        setWantsNotification(nextNotify);
      }
    }

    setStatus((prev) => ({ ...prev, notify: 'idle' }));

    if (typeof document !== 'undefined') {
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    toast({ description: 'Te llevé a contacto con el mensaje preparado.' });
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
            className="ge-chip-action ge-chip-action--primary ge-chip-action--wrap w-full sm:w-auto"
          >
            <Send size={18} />
            Compartir este artículo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNotify}
            disabled={status.notify === 'loading'}
            className="ge-chip-action ge-chip-action--secondary ge-chip-action--wrap w-full sm:w-auto"
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
    </>
  );
};

const Blog = ({ posts = [], isLoading = false, error = null, showBuscador = false }) => {
  const location = useLocation();
  const {
    query: faqQuery,
    setQuery: setFaqQuery,
    answer: faqAnswer,
    sources: faqSources,
    archive: faqArchive,
    status: faqStatus,
    errorMessage: faqErrorMessage,
    search: faqSearch,
    isLoading: faqIsLoading,
  } = useSearch();
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [searchCompletions, setSearchCompletions] = useState(() => {
    try { return parseInt(localStorage.getItem('gato_faq_count') || '0', 10); } catch { return 0; }
  });
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
  const faqRecognitionRef = useRef(null);
  const faqMicTimeoutRef = useRef(null);
  const faqTranscriptRef = useRef('');
  const [faqInputMode, setFaqInputMode] = useState('voice');
  const [faqIsListening, setFaqIsListening] = useState(false);
  const [faqMicError, setFaqMicError] = useState('');
  const [faqMicPromptVisible, setFaqMicPromptVisible] = useState(false);
  const [faqPage, setFaqPage] = useState(0);
  const FAQ_PAGE_SIZE = 3;
  const faqPageCount = Math.ceil(STARTER_FAQ_PROMPTS.length / FAQ_PAGE_SIZE);
  const faqVisiblePrompts = STARTER_FAQ_PROMPTS.slice(faqPage * FAQ_PAGE_SIZE, (faqPage + 1) * FAQ_PAGE_SIZE);

  useEffect(() => {
    if (!showBuscador || faqInputMode !== 'text') return undefined;
    const timer = setTimeout(() => { faqInputRef.current?.focus(); }, 520);
    return () => clearTimeout(timer);
  }, [faqInputMode, showBuscador]);

  const stopFaqListening = useCallback(({ discard = false } = {}) => {
    if (faqMicTimeoutRef.current) {
      window.clearTimeout(faqMicTimeoutRef.current);
      faqMicTimeoutRef.current = null;
    }
    if (discard) faqTranscriptRef.current = '';
    try {
      faqRecognitionRef.current?.stop?.();
    } catch {
      setFaqIsListening(false);
    }
  }, []);

  const handleFaqMicClick = useCallback(() => {
    if (typeof window === 'undefined') return;
    setFaqMicPromptVisible(true);

    if (faqIsListening) {
      stopFaqListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFaqMicError('Tu navegador no permite dictar. Puedes escribirle al apuntador.');
      setFaqInputMode('text');
      return;
    }

    if (!faqRecognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const text = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join(' ')
          .trim();
        faqTranscriptRef.current = text;
        setFaqQuery(text);
      };
      recognition.onerror = (event) => {
        console.error('[Archivo vivo] recognition error:', event);
        setFaqMicError('El apuntador no pudo escucharte. Intenta otra vez o escribe tu pregunta.');
        setFaqIsListening(false);
      };
      recognition.onend = () => {
        setFaqIsListening(false);
        if (faqMicTimeoutRef.current) {
          window.clearTimeout(faqMicTimeoutRef.current);
          faqMicTimeoutRef.current = null;
        }
        if (faqTranscriptRef.current.trim()) setFaqInputMode('text');
      };
      faqRecognitionRef.current = recognition;
    }

    faqTranscriptRef.current = '';
    setFaqQuery('');
    try {
      faqRecognitionRef.current.start();
      setFaqIsListening(true);
      setFaqMicError('');
      faqMicTimeoutRef.current = window.setTimeout(() => stopFaqListening(), 45000);
    } catch (error) {
      console.error('[Archivo vivo] microphone start error:', error);
      setFaqMicError('No pudimos abrir el micrófono. Intenta otra vez o escribe tu pregunta.');
      setFaqInputMode('text');
    }
  }, [faqIsListening, setFaqQuery, stopFaqListening]);

  const handleFaqInputModeToggle = useCallback(() => {
    if (faqInputMode === 'voice') {
      if (faqIsListening) stopFaqListening();
      setFaqInputMode('text');
      return;
    }
    setFaqMicError('');
    setFaqInputMode('voice');
  }, [faqInputMode, faqIsListening, stopFaqListening]);

  useEffect(() => () => {
    if (faqMicTimeoutRef.current) window.clearTimeout(faqMicTimeoutRef.current);
    try { faqRecognitionRef.current?.abort?.(); } catch {}
    faqRecognitionRef.current = null;
  }, []);

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
  const showEditorialContent = true;
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
      requestAnimationFrame(() => {
        articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [isMobileViewport]);

  useEffect(() => {
    const rawHash = String(location.hash || '');
    if (!rawHash.startsWith('#dialogo-critico')) return;
    const [, hashQuery = ''] = rawHash.split('?');
    if (!hashQuery) return;
    const focus = new URLSearchParams(hashQuery).get('focus');
    if (focus && BLOG_CATEGORY_ORDER.includes(focus)) {
      handleExploreCategory(focus);
    }
  }, [location.hash, location.key, handleExploreCategory]);

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
    if (faqIsListening) stopFaqListening({ discard: true });
    setFaqInputMode('text');
    setFaqMicError('');
    setFaqQuery(prompt);
    faqSearch(prompt);
  }, [faqIsListening, setFaqQuery, faqSearch, stopFaqListening]);

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
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">#PENSAMIENTOCRÍTICO</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
              Curaduría, comunidad<br />y resonancia
            </h2>
            <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
              Un espacio de diálogo reflexivo, creatividad y poética donde convergen textos especializados, ficción expandida y
              noticias detrás de escena.
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
              <AnimatePresence>
              {showBuscador && featuredEditorialCategory ? (
                <motion.div
                  key="buscador-reveal"
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
                    className="camerino-panel relative overflow-hidden rounded-2xl border p-5 md:p-8"
                  >
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-100/60 to-transparent" />

                    <div className="relative z-10 space-y-7">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <img
                            src="/assets/header-logo.png"
                            alt="Es un gato encerrado"
                            className="h-12 w-12 shrink-0 object-contain opacity-90 drop-shadow-[0_0_20px_rgba(167,139,250,0.8)] md:h-14 md:w-14"
                          />
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.32em] text-violet-300/65">
                              Entre actos
                            </p>
                            <h3 className="mt-2 font-display text-2xl text-slate-50 md:text-3xl">
                              Entra al camerino
                            </h3>
                          </div>
                        </div>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/5 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-emerald-200/75">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
                          Archivo vivo
                        </span>
                      </div>

                      <p className="max-w-3xl text-sm leading-relaxed text-slate-300/80 md:text-base">
                        Consulta al apuntador para explorar, contrastar y encontrar respuestas a preguntas que quizá aún no te has hecho.
                      </p>

                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400/70">Archivos disponibles</p>
                        <div className="flex flex-wrap gap-2">
                          {['Curaduría editorial', 'Memoria escénica', 'Obras narrativas', 'Canon del universo'].map((fund) => (
                            <span key={fund} className="rounded-full border border-violet-200/15 bg-white/[0.035] px-3 py-1.5 text-[10px] tracking-wide text-violet-100/75">
                              {fund}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-[minmax(300px,0.88fr)_minmax(0,1.12fr)]">
                        <section className="camerino-apuntador-panel rounded-2xl border p-5 backdrop-blur-sm">
                          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-violet-200/65">
                            El apuntador
                          </p>

                          {faqInputMode === 'voice' ? (
                            <ObraConversationControls
                              ctaLabel="Pregunta / Comenta"
                              listeningLabel="Pulsa otra vez para terminar"
                              promptLabel="Pulsa y habla con el apuntador"
                              errorTitle="El apuntador no pudo escucharte"
                              isListening={faqIsListening}
                              micPromptVisible={faqMicPromptVisible}
                              micError={faqMicError}
                              secondaryCtaVisible
                              secondaryCtaCopy="Prefiero escribir"
                              onMicClick={handleFaqMicClick}
                              onSecondaryCtaClick={handleFaqInputModeToggle}
                              tone={{
                                border: 'rgba(196,181,253,0.62)',
                                dot: 'rgba(221,214,254,0.96)',
                                glow: '0 0 38px rgba(139,92,246,0.5)',
                              }}
                            />
                          ) : (
                            <div className="space-y-3">
                              <label htmlFor="archivo-vivo-query" className="text-[10px] uppercase tracking-[0.26em] text-violet-200/55">
                                {faqQuery.trim() ? 'Esto entendí · puedes editarlo' : 'Escribe una pregunta para el apuntador'}
                              </label>
                              <textarea
                                id="archivo-vivo-query"
                                ref={faqInputRef}
                                rows={3}
                                value={faqQuery}
                                onChange={(event) => setFaqQuery(event.target.value)}
                                onKeyDown={(event) => {
                                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && faqQuery.trim().length >= 2) faqSearch();
                                }}
                                placeholder="¿Qué quieres preguntarle al apuntador?"
                                disabled={faqIsLoading}
                                className="w-full resize-none rounded-2xl border border-violet-100/30 bg-white/90 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 disabled:opacity-60"
                              />
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  onClick={handleFaqInputModeToggle}
                                  className="text-xs text-violet-200/65 underline decoration-dotted underline-offset-4 transition hover:text-violet-100"
                                >
                                  Prefiero hablar
                                </button>
                                <Button
                                  type="button"
                                  onClick={() => faqSearch()}
                                  disabled={faqIsLoading || faqQuery.trim().length < 2}
                                  className="ge-chip-action ge-chip-action--primary ge-chip-action--compact"
                                >
                                  {faqIsLoading ? 'Consultando…' : 'Preguntar al apuntador'}
                                  {faqIsLoading ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
                                  ) : (
                                    <FileSearch size={14} aria-hidden="true" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </section>

                        <section className="rounded-2xl border border-white/10 bg-black/15 p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/65">Mesa de notas</p>
                              <p className="mt-1 text-xs text-slate-400">Preguntas de la comunidad para dialogar, recordar y continuar con la función.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFaqPage((p) => (p + 1) % faqPageCount)}
                              aria-label="Mostrar otras rutas"
                              className="group rounded-full border border-violet-200/20 p-2 text-violet-200/70 transition hover:border-violet-200/45 hover:text-violet-100"
                            >
                              <RefreshCw size={14} className="transition duration-300 group-hover:rotate-180" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {faqVisiblePrompts.map((prompt, index) => (
                              <button
                                type="button"
                                key={prompt}
                                onClick={() => handleFaqPromptSelect(prompt)}
                                className="group flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left transition hover:border-violet-300/35 hover:bg-violet-400/[0.07]"
                              >
                                <span className="pt-0.5 font-mono text-[10px] text-violet-300/55">{String(index + 1).padStart(2, '0')}</span>
                                <span className="text-sm leading-snug text-slate-200/90 group-hover:text-white">{prompt}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      </div>

                      {(faqStatus === 'searching' || faqStatus === 'streaming' || faqStatus === 'done' || faqStatus === 'error') && (
                        <section className="overflow-hidden rounded-2xl border border-violet-200/25 bg-black/35">
                          {faqStatus === 'searching' && (
                            <div className="flex items-center gap-3 px-5 py-6 text-sm text-violet-100/70 md:px-6">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-300" aria-hidden="true" />
                              Abriendo archivos y contrastando fragmentos…
                            </div>
                          )}

                          {(faqStatus === 'streaming' || faqStatus === 'done') && faqAnswer && (
                            <div className="space-y-5 px-5 py-6 md:px-6">
                              <div>
                                <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-violet-200/65">Nota del apuntador</p>
                                <div className="max-w-4xl text-sm leading-relaxed text-violet-100/85 md:text-[0.95rem]">
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold text-violet-200">{children}</strong>,
                                      em: ({ children }) => <em className="italic text-violet-100/90">{children}</em>,
                                      ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                                      li: ({ children }) => <li className="text-violet-100/85">{children}</li>,
                                    }}
                                  >
                                    {faqAnswer}
                                  </ReactMarkdown>
                                  {faqStatus === 'streaming' && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-violet-300 align-middle" aria-hidden="true" />}
                                </div>
                              </div>

                              {faqStatus === 'done' && faqArchive.length > 0 && (
                                <div className="border-t border-white/10 pt-4">
                                  <p className="mb-2 text-[9px] uppercase tracking-[0.28em] text-slate-400/70">Archivo consultado</p>
                                  <div className="flex flex-wrap gap-2">
                                    {faqArchive.map((fund) => (
                                      <span key={fund.id} className="rounded-full border border-violet-200/15 bg-violet-400/5 px-3 py-1.5 text-[10px] text-violet-100/75">
                                        {fund.label} · {fund.fragments} {fund.fragments === 1 ? 'fragmento' : 'fragmentos'}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {faqStatus === 'done' && faqSources.length > 0 && (
                                <div className="border-t border-white/10 pt-4">
                                  <p className="mb-2 text-[9px] uppercase tracking-[0.28em] text-slate-400/70">Huella documental pública</p>
                                  <ul className="space-y-1">
                                    {faqSources.map((source) => (
                                      <li key={source.slug}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const post = posts.find((item) => item.slug === source.slug);
                                            if (post) handleSelectPost(post);
                                          }}
                                          className="text-left text-sm text-violet-300 underline decoration-dotted underline-offset-4 transition hover:text-violet-100"
                                        >
                                          {source.title}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {faqStatus === 'error' && (
                            <p className="px-5 py-6 text-sm text-red-300/85 md:px-6">{faqErrorMessage || 'No se pudo completar la consulta.'}</p>
                          )}

                          {faqStatus === 'done' && searchCompletions >= 1 && (
                            <div className="flex justify-end border-t border-white/10 px-5 py-4 md:px-6">
                              <button
                                type="button"
                                onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                className="ge-chip-action ge-chip-action--secondary ge-chip-action--compact"
                              >
                                Compartir algo de tu autoría →
                              </button>
                            </div>
                          )}
                        </section>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
              </AnimatePresence>

              <div className="grid gap-6 md:grid-cols-3">
                {editorialCategories.map((category) => (
                  <article
                    key={category.key}
                    className={`glass-effect relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-6 transition-colors duration-300 ${
                      activeCategory === category.key ? 'hover-glow--selected' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300/85">
                        {category.label}
                      </p>
                      <span className="ge-tag ge-tag--meta">
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
                      className="mt-3 self-start px-0 inline-flex items-center gap-1 text-purple-300 hover:text-white"
                    >
                      {category.ctaLabel}
                      <ArrowRight size={14} />
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
                  className="grid scroll-mt-24 gap-8 md:grid-cols-2 md:scroll-mt-28"
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
                      className="ge-chip-action ge-chip-action--secondary ge-chip-action--compact"
                    >
                      Mostrar el resto de los textos
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
                        onClick={() => handleExploreCategory(category)}
                        className={`ge-chip-filter ${
                          activeCategory === category
                            ? 'ge-chip-filter--active'
                            : 'ge-chip-filter--idle'
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
