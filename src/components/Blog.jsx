import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Feather, PenLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import ContributionModal from '@/components/ContributionModal';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import {
  BLOG_CATEGORY_CONFIG,
  BLOG_CATEGORY_ORDER,
  deriveBlogCategory,
} from '@/lib/blogCategories';
import { recordArticleInteraction } from '@/services/articleInteractionService';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

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
    <p className="leading-relaxed font-light text-slate-200" {...props} />
  ),
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node: _node, ...props }) => <em className="italic text-slate-100" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="border-l-4 border-purple-400/60 pl-4 italic text-slate-200/90 bg-white/5 py-2 rounded-r-xl"
      {...props}
    />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="ml-6 list-disc space-y-2 text-slate-200" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="ml-6 list-decimal space-y-2 text-slate-200" {...props} />
  ),
  li: ({ node: _node, ...props }) => <li className="leading-relaxed" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a
      className="text-purple-300 underline decoration-dotted hover:text-purple-200 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

const ArticleCard = ({ post, onSelect }) => {
  const publishedDate = post.published_at ? new Date(post.published_at) : null;

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

      <h3 className="font-display text-2xl md:text-3xl font-medium text-slate-100 mb-4">{post.title}</h3>

      <p className="text-slate-300/80 leading-relaxed font-light mb-6">{post.excerpt}</p>

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

const FullArticle = ({ post, onClose }) => {
  const articleContent = useMemo(() => post?.content?.trim() ?? '', [post]);

  const publishedDate = post.published_at ? new Date(post.published_at) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-effect rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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

        <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
          Cerrar artículo
        </Button>
      </div>

      <h3 className="font-display text-3xl md:text-4xl font-semibold text-slate-50 mb-8">{post.title}</h3>

      {articleContent ? (
        <div className="flex flex-col gap-6 text-slate-200 leading-relaxed font-light">
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
  const [liked, setLiked] = useState(false);
  const [wantsNotification, setWantsNotification] = useState(false);
  const [status, setStatus] = useState({ like: 'idle', notify: 'idle' });

  const pushInteraction = async (action) => {
    const nextLiked = action === 'like' ? !liked : liked;
    const nextNotify = action === 'notify' ? !wantsNotification : wantsNotification;

    if (action === 'notify' && !user) {
      toast({
        description: 'Inicia sesión para recibir notificaciones y continuar en el Backstage.',
      });
      openLoginOverlay();
      return;
    }

    setStatus((prev) => ({ ...prev, [action]: 'loading' }));

    const { success, error } = await recordArticleInteraction({
      post,
      action,
      liked: nextLiked,
      notify: nextNotify,
      miniverse: inferredMiniverseKey,
      mostViewedMiniverse: miniverseInfo.label,
      mostViewedMiniverseCount: miniverseInfo.views ?? null,
    });

    if (!success) {
      console.error('[ArticleInteraction] Error guardando interacción:', error);
      toast({ description: 'No pudimos guardar tu interacción. Intenta nuevamente.' });
    } else {
      if (action === 'like') {
        setLiked(nextLiked);
        toast({ description: nextLiked ? 'Gracias por tu apoyo.' : 'Quitaste el Me gusta.' });
      } else {
        setWantsNotification(nextNotify);
        toast({
          description: nextNotify
            ? 'Te avisaremos cuando haya novedades sobre este texto.'
            : 'Ya no recibes notificaciones de este artículo.',
        });
      }
    }

    setStatus((prev) => ({ ...prev, [action]: 'idle' }));
  };

  return (
    <>
      <div className="mt-10 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <p className="text-base text-slate-200">¿La lectura te movió?</p>
      <p className="text-sm text-slate-400 mt-1">
        Clic en los botones y registramos la interacción para alimentar al gato del Backstage.
      </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <Button
            variant={liked ? 'secondary' : 'default'}
            size="lg"
            onClick={() => pushInteraction('like')}
            disabled={status.like === 'loading'}
            className="flex-1"
          >
            {liked ? 'Gracias por el Me gusta' : 'Me gustó este artículo'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => pushInteraction('notify')}
            disabled={status.notify === 'loading'}
            className="flex-1"
          >
            {wantsNotification ? 'Te avisaremos de novedades' : 'Quiero recibir notificaciones'}
          </Button>
        </div>
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={closeLoginOverlay} /> : null}
    </>
  );
};

const BLOG_ONBOARDING_KEY = 'gatoencerrado-blog-onboarding';

const Blog = ({ posts = [], isLoading = false, error = null }) => {
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const articlesRef = useRef(null);
  const onboardingStoredRef = useRef(false);
  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.email);
  const contributionButtonClassName = cn(
    'text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow transition mx-auto',
    isLoggedIn
      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-400/90 hover:to-emerald-500/90 shadow-[0_0_35px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/30'
      : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600'
  );

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
      const matchesCategory = activeCategory === 'all' ? true : post.category === activeCategory;
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

  const handleOpenContribution = useCallback(() => {
    setIsContributionOpen(true);
    setShowOnboardingHint(false);
    onboardingStoredRef.current = true;
    safeSetItem(BLOG_ONBOARDING_KEY, 'seen');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || onboardingStoredRef.current) {
      return;
    }
    const seen = safeGetItem(BLOG_ONBOARDING_KEY);
    if (seen === 'seen') {
      setShowOnboardingHint(false);
      onboardingStoredRef.current = true;
      return;
    }
    setShowOnboardingHint(true);
    const timeout = setTimeout(() => {
      setShowOnboardingHint(false);
      safeSetItem(BLOG_ONBOARDING_KEY, 'seen');
      onboardingStoredRef.current = true;
    }, 6000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleResumeContribution = () => {
      setIsContributionOpen(true);
    };
    window.addEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    return () => {
      window.removeEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    };
  }, []);

  return (
    <>
      <section id="dialogo-critico" className="py-24 relative">
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Diálogo Crítico</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
              Pensamiento crítico, comunidad y resonancia
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

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    activeCategory === 'all'
                      ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                      : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                  }`}
                >
                  Todas
                </button>
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
                  className="w-full rounded-full border border-white/10 bg-black/30 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>

            <motion.div
              ref={articlesRef}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
              className="grid md:grid-cols-2 gap-8"
            >
              {isLoading ? (
                <motion.div variants={containerVariants} className="md:col-span-2 text-center text-slate-400 py-12">
                  Cargando artículos…
                </motion.div>
              ) : filteredPosts.length === 0 ? (
                <motion.div variants={containerVariants} className="md:col-span-2 text-center text-slate-400 py-12">
                  No encontramos textos con ese criterio. Ajusta el filtro o comparte un nuevo testimonio.
                </motion.div>
              ) : (
                filteredPosts.map((post) => <ArticleCard key={post.id} post={post} onSelect={handleSelectPost} />)
              )}
            </motion.div>

            <div id="blog-article">
              <AnimatePresence mode="wait">
                {activePost ? <FullArticle key={activePost.id} post={activePost} onClose={() => setActivePost(null)} /> : null}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
  id="blog-contribuye"
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
  viewport={{ once: true }}
  className="relative mt-20 glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden"
>
  {/* HALO VIOLETA DELICADO (DETRÁS) */}
  <div
    aria-hidden="true"
    className="
      absolute inset-0
      pointer-events-none
      flex items-center justify-center
      z-0
    "
  >
    <motion.div
      initial={{ opacity: 0.35, scale: 0.9 }}
      animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      className="
        w-[85%] h-[85%]
        md:w-[70%] md:h-[70%]
        rounded-full
        bg-purple-600/30
        blur-[100px]
      "
    />
  </div>

  {/* CONTENIDO */}
  <div className="relative z-10">
    <h3 className="font-display text-3xl font-medium text-slate-100 mb-6">
      ¿Algo de la obra se quedó contigo?
    </h3>

    <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light whitespace-pre-line">
      {`Si algo de la obra se movió contigo, nos encantará saberlo.
    No buscamos “opiniones”: buscamos las huellas que dejó en tu manera de mirar, sentir o recordar.
    Lo que compartas ayuda a seguir construyendo este universo.`}

      <span className="block mt-4 text-sm text-slate-400/70 italic">
        (O si hubo algo más que te llamó la atención durante tu visita, también puedes contarlo.)
      </span>
    </p>

    <div className="relative inline-flex flex-col items-center gap-2">
      {showOnboardingHint ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-10 bg-purple-600/80 text-white text-xs px-3 py-1 rounded-full shadow-lg"
        >
          ¡Nuevo! Abre la bandeja lateral y comparte tu texto
        </motion.div>
      ) : null}

      <Button
        id="blog-submit-cta"
        onClick={handleOpenContribution}
        className={contributionButtonClassName}
      >
        <PenLine size={18} />
        Compartir lo que me dejó
      </Button>
    </div>
  </div>
</motion.div>
        </div>
      </section>

      <ContributionModal open={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </>
  );
};

export default Blog;
