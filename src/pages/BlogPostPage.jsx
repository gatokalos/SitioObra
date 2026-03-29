import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchBlogPostBySlug } from '@/services/blogService';

const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://universogatoencerrado.com';
const FALLBACK_IMAGE = `${SITE_ORIGIN}/assets/social-card.jpg`;

const SITE_DEFAULTS = {
  title: '#GatoEncerrado — Universo transmedia',
  description: 'Explora los miniversos: Cine, Novela, RA, Juegos, Bitácora y más.',
  image: FALLBACK_IMAGE,
  url: SITE_ORIGIN,
  type: 'website',
};

function setMetaProp(property, content) {
  let el = document.querySelector(`meta[property="${CSS.escape ? property : property}"]`);
  // querySelector doesn't support og:title directly with colon, use attribute selector
  el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function useSocialMeta(post) {
  useEffect(() => {
    if (!post) return;

    const title = post.title;
    const description = post.excerpt || SITE_DEFAULTS.description;
    const image = post.featured_image_url || FALLBACK_IMAGE;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : `${SITE_ORIGIN}/blog/${post.slug}`;

    document.title = `${title} — #GatoEncerrado`;

    setMetaProp('og:title', title);
    setMetaProp('og:description', description);
    setMetaProp('og:image', image);
    setMetaProp('og:url', url);
    setMetaProp('og:type', 'article');
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', title);
    setMetaName('twitter:description', description);
    setMetaName('twitter:image', image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      document.title = SITE_DEFAULTS.title;
      setMetaProp('og:title', SITE_DEFAULTS.title);
      setMetaProp('og:description', SITE_DEFAULTS.description);
      setMetaProp('og:image', SITE_DEFAULTS.image);
      setMetaProp('og:url', SITE_ORIGIN);
      setMetaProp('og:type', SITE_DEFAULTS.type);
      setMetaName('twitter:card', 'summary_large_image');
      setMetaName('twitter:title', SITE_DEFAULTS.title);
      setMetaName('twitter:description', SITE_DEFAULTS.description);
      setMetaName('twitter:image', SITE_DEFAULTS.image);
      const can = document.querySelector('link[rel="canonical"]');
      if (can) can.remove();
    };
  }, [post]);
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSocialMeta(post);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setPost(null);

    fetchBlogPostBySlug(slug).then((data) => {
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
      } else {
        setPost(data);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-slate-300 text-lg">Artículo no encontrado.</p>
        <Link
          to="/#dialogo-critico"
          className="text-slate-400 underline underline-offset-4 text-sm hover:text-white transition-colors"
        >
          Ver todos los artículos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507]">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link
          to="/#dialogo-critico"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-12 transition-colors"
        >
          ← Volver
        </Link>

        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.image_caption || post.title}
            className="w-full rounded-2xl mb-10 object-cover"
            style={{ aspectRatio: '16/9' }}
          />
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs uppercase tracking-widest text-purple-400/80 border border-purple-400/20 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-semibold text-white mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-10 text-sm text-slate-400">
          {post.author_avatar_url && (
            <img
              src={post.author_avatar_url}
              alt={post.author}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          {post.author && <span>{post.author}</span>}
          {post.author_role && <span className="text-slate-500">· {post.author_role}</span>}
          {post.published_at && (
            <span className="text-slate-500">
              ·{' '}
              {new Date(post.published_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
          {post.read_time_minutes && (
            <span className="text-slate-500">· {post.read_time_minutes} min de lectura</span>
          )}
        </div>

        {post.excerpt && (
          <p className="text-slate-300 text-lg leading-relaxed mb-10 border-l-2 border-purple-500/40 pl-5 italic">
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <div className="text-slate-300 leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
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
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
