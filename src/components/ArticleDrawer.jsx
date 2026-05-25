import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchBlogPostBySlug } from '@/services/blogService';

const MD_COMPONENTS = {
  h1: ({ children }) => <h1 className="text-2xl font-semibold text-white mt-8 mb-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-6 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-medium text-white mt-4 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-slate-300 leading-relaxed mb-4">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-slate-300 mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-slate-300 mb-4">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-purple-500/40 pl-5 italic text-slate-400 my-6">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-white/5 text-purple-300 rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>
  ),
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
};

const ArticleDrawer = () => {
  const [slug, setSlug] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const close = () => setSlug(null);

  useEffect(() => {
    const handler = (e) => {
      const s = e.detail?.slug;
      if (s) setSlug(s);
    };
    window.addEventListener('gatoencerrado:open-article-overlay', handler);
    return () => window.removeEventListener('gatoencerrado:open-article-overlay', handler);
  }, []);

  useEffect(() => {
    if (!slug) { setPost(null); return; }
    let cancelled = false;
    setLoading(true);
    setPost(null);
    fetchBlogPostBySlug(slug).then((data) => {
      if (cancelled) return;
      setPost(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  // Bloquea scroll del body mientras está abierto
  useEffect(() => {
    if (!slug) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [slug]);

  // Escape para cerrar
  useEffect(() => {
    if (!slug) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slug]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {slug ? (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[201] flex flex-col bg-[#080a12] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)]"
            style={{ maxHeight: '92dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <div className="mx-auto w-10 h-1 rounded-full bg-white/20 absolute left-1/2 -translate-x-1/2 top-3" />
              <div className="flex-1" />
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:text-white transition"
                aria-label="Cerrar artículo"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="overflow-y-auto overscroll-contain px-5 pb-10 pt-2 space-y-0">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin" />
                </div>
              ) : !post ? (
                <p className="text-slate-400 text-sm text-center py-16">Artículo no encontrado.</p>
              ) : (
                <>
                  {post.featured_image_url && (
                    <img
                      src={post.featured_image_url}
                      alt={post.image_caption || post.title}
                      className="w-full rounded-2xl mb-6 object-cover"
                      style={{ aspectRatio: '16/9' }}
                    />
                  )}

                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs uppercase tracking-widest text-purple-400/80 border border-purple-400/20 rounded-full px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h1 className="text-2xl font-semibold text-white mb-3 leading-tight">{post.title}</h1>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6 text-sm text-slate-400">
                    {post.author_avatar_url && (
                      <img src={post.author_avatar_url} alt={post.author} className="w-7 h-7 rounded-full object-cover" />
                    )}
                    {post.author && <span>{post.author}</span>}
                    {post.author_role && <span className="text-slate-500">· {post.author_role}</span>}
                    {post.published_at && (
                      <span className="text-slate-500">
                        · {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    )}
                    {post.read_time_minutes && (
                      <span className="text-slate-500">· {post.read_time_minutes} min de lectura</span>
                    )}
                  </div>

                  {post.excerpt && (
                    <p className="text-slate-300 text-base leading-relaxed mb-6 border-l-2 border-purple-500/40 pl-4 italic">
                      {post.excerpt}
                    </p>
                  )}

                  {post.content && (
                    <div className="text-slate-300 leading-relaxed space-y-4">
                      <ReactMarkdown components={MD_COMPONENTS}>{post.content}</ReactMarkdown>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

export default ArticleDrawer;
