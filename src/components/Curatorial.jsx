import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Quote, User, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ContributionModal from '@/components/ContributionModal';

const CURATORIAL_SOURCES = [
  {
    slug: 'cartografia-emocional-gato-encerrado',
    fallback: {
      title: 'El Encierro Como Metáfora',
      author: 'Dr. María Elena Rodríguez',
      role: 'Crítica Teatral',
      date: 'Marzo 2024',
      excerpt:
        'En #GatoEncerrado encontramos una reflexión profunda sobre los múltiples encierros que caracterizan la experiencia humana contemporánea. La obra trasciende la literalidad del espacio físico para explorar las prisiones mentales, sociales y emocionales que habitamos...',
    },
  },
  {
    slug: 'practicas-transmedia-teatro',
    fallback: {
      title: 'Narrativas Transmedia en el Teatro',
      author: 'Prof. Carlos Mendoza',
      role: 'Investigador en Artes Escénicas',
      date: 'Febrero 2024',
      excerpt:
        'La integración de múltiples plataformas narrativas en #GatoEncerrado representa un paradigma emergente en las artes escénicas. Esta obra no solo utiliza el teatro como medio principal, sino que expande su universo narrativo...',
    },
  },
  {
    slug: 'narrativas-transmedia-teatro',
  },
];

const Curatorial = ({ posts = [], isLoading = false }) => {
  const [isContributionOpen, setIsContributionOpen] = useState(false);

  const curatedTexts = useMemo(() => {
    const curated = CURATORIAL_SOURCES.map((source) => {
      const post = posts.find((item) => item.slug === source.slug);
      if (!post && !source.fallback) {
        return null;
      }

      const excerpt =
        post?.excerpt ||
        source.fallback?.excerpt ||
        (post?.content ? post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean)[0] : '');

      const formattedDate = post?.published_at
        ? new Date(post.published_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
          })
        : source.fallback?.date;

      return {
        slug: source.slug,
        title: post?.title ?? source.fallback?.title ?? 'Texto curatorial',
        author: post?.author ?? source.fallback?.author ?? 'Autoría por confirmar',
        role: post?.author_role ?? source.fallback?.role ?? '',
        date: formattedDate,
        excerpt: excerpt || 'Muy pronto compartiremos este texto.',
      };
    }).filter(Boolean);

    // Agrega automáticamente artículos etiquetados como "Curatorial" que no estén en la lista.
    const taggedPosts =
      posts
        .filter(
          (post) =>
            Array.isArray(post.tags) &&
            post.tags.includes('Curatorial') &&
            !curated.some((item) => item.slug === post.slug)
        )
        .map((post) => ({
          slug: post.slug,
          title: post.title,
          author: post.author ?? 'Autoría por confirmar',
          role: post.author_role ?? '',
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
            : undefined,
          excerpt:
            post.excerpt ||
            (post.content ? post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean)[0] : ''),
        })) ?? [];

    return [...curated, ...taggedPosts];
  }, [posts]);

  const handleReadMore = useCallback((slug) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:open-blog', {
          detail: { slug },
        })
      );
    }

    const blogSection = document.getElementById('blog');

    if (blogSection) {
      blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      toast({
        description: 'El blog se abrirá en cuanto esté disponible.',
      });
    }
  }, []);

  return (
    <section id="curatorial" className="py-24 relative">
      <div className="section-divider mb-24"></div>
      
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            Textos Curatoriales
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Reflexiones críticas y análisis profundos sobre #GatoEncerrado 
            desde diferentes perspectivas académicas y curatoriales.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {isLoading ? (
            <motion.div
              className="md:col-span-2 text-center text-slate-400 py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Cargando textos curatoriales…
            </motion.div>
          ) : curatedTexts.length === 0 ? (
            <motion.div
              className="md:col-span-2 text-center text-slate-400 py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Muy pronto liberaremos los textos curatoriales completos.
            </motion.div>
          ) : (
            curatedTexts.map((text, index) => (
              <motion.article
                key={text.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="glass-effect rounded-2xl p-8 md:p-10 hover-glow flex flex-col"
              >
                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2 text-purple-300">
                    <User size={16} />
                    <span className="text-slate-200 font-semibold">{text.author}</span>
                  </div>
                  {text.role ? <span>/ {text.role}</span> : null}
                  {text.date ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Calendar size={16} />
                      {text.date}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-display text-2xl font-medium text-slate-100 mb-4 flex-grow">{text.title}</h3>
                <p className="text-slate-300/70 leading-relaxed font-light mb-6">"{text.excerpt}"</p>
                <Button
                  onClick={() => handleReadMore(text.slug)}
                  variant="link"
                  className="text-purple-300 hover:text-white self-start p-0"
                >
                  Leer texto completo
                </Button>
              </motion.article>
            ))
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-effect rounded-2xl p-8 md:p-12">
            <h3 className="font-display text-3xl font-medium mb-6 text-slate-100">
              Contribuye al Diálogo Crítico
            </h3>
            <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light">
              Invitamos a críticos, académicos y pensadores a contribuir con sus reflexiones 
              sobre #GatoEncerrado y su impacto en el panorama teatral contemporáneo.
            </p>
            <Button
              onClick={() => setIsContributionOpen(true)}
              className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow"
            >
              <Send size={18} />
              Enviar Propuesta
            </Button>
          </div>
        </motion.div>
      </div>
      <ContributionModal open={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </section>
  );
};

export default Curatorial;
