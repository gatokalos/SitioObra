import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Feather, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPublishedBlogPosts } from '@/services/blogService';
import { toast } from '@/components/ui/use-toast';

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const ArticleCard = ({ post, onSelect }) => {
  const publishedDate = post.published_at ? new Date(post.published_at) : null;

  return (
    <motion.article
      variants={containerVariants}
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

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);

  const handleSelectPost = useCallback(
    (post) => {
      setActivePost(post);
      requestAnimationFrame(() => {
        const articleElement = document.getElementById('blog-article');
        if (articleElement) {
          articleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },
    [setActivePost]
  );

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoading(true);
      const data = await fetchPublishedBlogPosts();
      if (!isMounted) {
        return;
      }

      setPosts(data);
      setIsLoading(false);

      if (pendingSlug) {
        const target = data.find((item) => item.slug === pendingSlug);
        if (target) {
          handleSelectPost(target);
        }
        setPendingSlug(null);
      }
    };

    loadPosts().catch((err) => {
      console.error('[Blog] Error inesperado cargando posts:', err);
      toast({ description: 'No se pudieron cargar los artículos del blog.' });
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [handleSelectPost, pendingSlug]);

  useEffect(() => {
    const handleNavigate = (event) => {
      const { slug } = event.detail || {};
      if (slug && posts.length > 0) {
        const target = posts.find((item) => item.slug === slug);
        if (target) {
          handleSelectPost(target);
          return;
        }
      }

      if (slug) {
        setPendingSlug(slug);
      }
      const blogSection = document.getElementById('blog');
      if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('gatoencerrado:open-blog', handleNavigate);
    return () => window.removeEventListener('gatoencerrado:open-blog', handleNavigate);
  }, [handleSelectPost, posts]);

  const postsToDisplay = posts.slice(0, 4);

  return (
    <section id="blog" className="py-24 relative">
      <div className="section-divider mb-24"></div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">Blog / Diálogo vivo</h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Ensayos, crónicas y colaboraciones que expanden el universo #GatoEncerrado. Esta sección estará abierta a
            contribuciones curatoriales, investigación académica y testimonios de la comunidad.
          </p>
        </motion.div>

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
          ) : (
            postsToDisplay.map((post) => <ArticleCard key={post.id} post={post} onSelect={handleSelectPost} />)
          )}
        </motion.div>

        <div
          id="blog-article"
          className="mt-20"
        >
          <AnimatePresence mode="wait">
            {activePost ? <FullArticle key={activePost.id} post={activePost} onClose={() => setActivePost(null)} /> : null}
          </AnimatePresence>
        </div>

        <motion.div
          id="blog-contribute"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mt-20 glass-effect rounded-2xl p-8 md:p-12 text-center"
        >
          <h3 className="font-display text-3xl font-medium text-slate-100 mb-6">¿Quieres publicar en el blog?</h3>
          <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light">
            Estamos construyendo una red de voces. Comparte tu ensayo, bitácora o propuesta crítica y te contactaremos
            en cuanto abramos el flujo editorial completo.
          </p>
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('gatoencerrado:open-lead-modal', {
                    detail: { reason: 'blog-contribution' },
                  })
                );
              }
              toast({
                description: 'Muy pronto habilitaremos el formulario de contribuciones. Gracias por tu interés.',
              });
            }}
            className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow mx-auto"
          >
            <PenLine size={18} />
            Enviar Propuesta
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Blog;
