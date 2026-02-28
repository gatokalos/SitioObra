import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Feather, Search, Send } from 'lucide-react';
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
          Volver al listado
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
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [activeCategory, setActiveCategory] = useState(BLOG_CATEGORY_ORDER[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPosts, setShowAllPosts] = useState(false);
  const articlesRef = useRef(null);

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
    const query = searchQuery.trim().toLowerCase();
    return sortedPosts.filter((post) => {
      const matchesCategory = post.category === activeCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        post.title,
        post.author,
        post.excerpt,
        ...(Array.isArray(post.tags) ? post.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [sortedPosts, activeCategory, searchQuery]);
  const visiblePosts = useMemo(
    () => (showAllPosts ? filteredPosts : filteredPosts.slice(0, 2)),
    [filteredPosts, showAllPosts]
  );
  const canShowAllPosts = !isLoading && !showAllPosts && filteredPosts.length > 2;

  const handleSelectPost = useCallback((post) => {
    setActivePost(post);
    requestAnimationFrame(() => {
      const articleElement = document.getElementById('blog-article');
      articleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleExploreCategory = useCallback((category) => {
    setActiveCategory(category);
    requestAnimationFrame(() => {
      articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

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
    setShowAllPosts(false);
  }, [activeCategory, searchQuery]);

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
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Diálogo / Contribución</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
              Curaduría, comunidad y resonancia
            </h2>
            <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
              Un espacio de pensamiento crítico, creatividad y poética donde convergen curaduría, ficción expandida y
              noticias detrás de escena. Filtra por interés, busca autorías específicas o explora las líneas editoriales.
            </p>
          </motion.div>

          <div className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6"
            >
              {BLOG_CATEGORY_ORDER.map((category) => (
                <div key={category} className="glass-effect rounded-2xl p-6 border border-white/10 flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">
                    {BLOG_CATEGORY_CONFIG[category].label}
                  </p>
                  <p className="text-slate-300/80 text-sm leading-relaxed flex-1">
                    {BLOG_CATEGORY_CONFIG[category].summary}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => handleExploreCategory(category)}
                    className="text-purple-300 hover:text-white self-start px-0"
                  >
                    Leer esta línea editorial
                  </Button>
                </div>
              ))}
            </motion.div>

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
                {activePost ? <FullArticle key={activePost.id} post={activePost} onClose={() => setActivePost(null)} /> : null}
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

              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por título o autor"
                  className="form-surface form-surface--pill w-full py-2 pl-10 pr-4 text-sm"
                />
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default Blog;
