import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Feather, PenLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ContributionModal from '@/components/ContributionModal';
import {
  BLOG_CATEGORY_CONFIG,
  BLOG_CATEGORY_ORDER,
  deriveBlogCategory,
} from '@/lib/blogCategories';

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
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
  const paragraphs = useMemo(() => {
    if (!post?.content) {
      return [];
    }
    return post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  }, [post]);

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

      <div className="space-y-6 text-slate-200 leading-relaxed font-light">
        {paragraphs.length === 0 ? (
          <p>
            Este artículo estará disponible muy pronto. Gracias por tu interés en la comunidad crítica de
            #GatoEncerrado.
          </p>
        ) : (
          paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        )}
      </div>
    </motion.div>
  );
};

const Blog = ({ posts = [], isLoading = false, error = null }) => {
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const featuredPosts = useMemo(() => sortedPosts.slice(0, 3), [sortedPosts]);
  const featuredIds = useMemo(() => new Set(featuredPosts.map((item) => item.id)), [featuredPosts]);

  const libraryPosts = useMemo(
    () => sortedPosts.filter((post) => !featuredIds.has(post.id)),
    [sortedPosts, featuredIds]
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return libraryPosts.filter((post) => {
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
  }, [libraryPosts, activeCategory, searchQuery]);

  const handleSelectPost = useCallback((post) => {
    setActivePost(post);
    requestAnimationFrame(() => {
      const articleElement = document.getElementById('blog-article');
      articleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              noticias detrás de escena. Filtra por interés, busca autorías específicas o abre los textos destacados.
            </p>
          </motion.div>

          <div className="space-y-16">
            {isLoading ? null : featuredPosts.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80">Textos destacados</p>
                  <span className="text-xs text-slate-500">
                    Elegidos por impacto y lectura dentro de la comunidad
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <ArticleCard key={post.id} post={post} onSelect={handleSelectPost} />
                  ))}
                </div>
              </motion.div>
            ) : null}

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
                    onClick={() => setActiveCategory(category)}
                    className="text-purple-300 hover:text-white self-start px-0"
                  >
                    Leer esta línea editorial
                  </Button>
                </div>
              ))}
            </motion.div>

            <div id="blog-article">
              <AnimatePresence mode="wait">
                {activePost ? <FullArticle key={activePost.id} post={activePost} onClose={() => setActivePost(null)} /> : null}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="mt-20 glass-effect rounded-2xl p-8 md:p-12 text-center"
          >
            <h3 className="font-display text-3xl font-medium text-slate-100 mb-6">¿Quieres publicar en el blog?</h3>
            <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light">
              Ensayos, bitácoras, crítica y testimonios son bienvenidos. Recibimos propuestas curatoriales y
              comunitarias, y damos seguimiento personal.
            </p>
            <Button
              onClick={() => setIsContributionOpen(true)}
              className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow mx-auto"
            >
              <PenLine size={18} />
              ✍️ Enviar propuesta
            </Button>
          </motion.div>
        </div>
      </section>

      <ContributionModal open={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </>
  );
};

export default Blog;
