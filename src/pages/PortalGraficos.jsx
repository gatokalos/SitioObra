import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Heart, Image as ImageIcon, Scan } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';

const GRAFICOS_INTRO =
  'Gráficos explora el universo #GatoEncerrado desde la imagen. Aquí las escenas se quedan en otro momento: lo que en la obra aparece como pensamiento o diálogo, en el cómic puede convertirse en ensayo, en silencio, en otra voz. No solo el de Silvestre, sino el de cualquiera que se haya sentido como él. Dibujar permite mirar lo que no siempre se dice en escena.';
const GRAFICOS_NOTA_AUTORAL = {
  title: '#MirarmeLoQueSoy',
  verse: 'Me quedé dibujando,\ncomo si el papel supiera quién soy\nmejor que yo.',
};
const GRAFICOS_TILE = {
  gradient: 'linear-gradient(135deg, rgba(39,16,51,0.95), rgba(79,28,89,0.85), rgba(150,43,127,0.62))',
  border: 'rgba(244,114,182,0.4)',
  text: '#fdf2f8',
  accent: '#fbcfe8',
  background: 'rgba(39,16,51,0.7)',
};
const GRAFICOS_IA_PROFILE = {
  type: 'IA asistida para glifos y variaciones gráficas.',
  interaction: 'Swipe narrativo con prompts curados.',
  tokensRange: '110-220 tokens por sesión.',
  coverage: 'Cubierto por suscriptores; sin costo por visitante.',
  footnote: 'La IA abre caminos; el trazo final sigue siendo humano.',
};
const GRAFICOS_COLLABORATOR = {
  name: 'Manuel Sarabia',
  role: 'Ilustrador y crítico de cine',
  bio: 'Desde Sadaka Estudio trazó los primeros storyboards de Tres pies al gato, ayudando a imaginar cómo se ve un mundo cuando aún no existe.',
  image: '/assets/logoapp.webp',
};
const GRAFICOS_SWIPE_SHOWCASE = {
  title: 'Tres Pies al Gato',
  description: 'Exploraciones de la novela gráfica.',
  previewImage: '/assets/silvestre-comic.jpeg',
  previewPdfUrl:
    'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/grafico/Cap%20Aula.pdf',
  swipeNotes: [
    'Swipe vertical en PDF; cada página es una viñeta-ritual.',
    'Optimizado para móvil y tableta.',
  ],
};
const GRAFICOS_COLLABORATOR_CALL_ITEMS = [
  'Ilustradores con narrativa secuencial',
  'Diseño editorial para tirajes híbridos',
  'Narrativa visual para adolescencias',
  'Mediación gráfica en escuelas y centros culturales',
];
const GRAFICOS_BLOG_KEYS = ['graficos', 'grafico', 'miniversografico', 'miniverso_grafico', 'miniverso-grafico'];
const GRAFICOS_BLOG_KEY_SET = new Set(GRAFICOS_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

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
          Haz clic y deja un pulso.
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
      {status === 'loading' ? 'Enviando...' : 'Hacer vibrar el trazo'}
    </p>
  </div>
);

const PortalGraficos = () => {
  const { user } = useAuth();
  usePortalTracking('grafico');
  const { question: vitranaQuestion } = useVitranaQuestion('grafico');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestGraficosReading, setLatestGraficosReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
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
    let cancelled = false;
    const loadLatestGraficosReading = async () => {
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
        console.warn('[PortalGraficos] No se pudo detectar lectura relacionada:', error);
        setLatestGraficosReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return GRAFICOS_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestGraficosReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestGraficosReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestGraficosReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestGraficosReading?.slug]);

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

  useEffect(() => {
    if (!isImagePreviewOpen) return undefined;
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isImagePreviewOpen]);

  const handleOpenPdf = useCallback(() => {
    if (!requireAuth()) return;
    if (typeof window === 'undefined') return;
    window.open(GRAFICOS_SWIPE_SHOWCASE.previewPdfUrl, '_blank', 'noopener,noreferrer');
  }, [requireAuth]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversoGrafico', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const graficosReadingAuthorLabel = (latestGraficosReading?.author || '').trim() || 'autor invitado';
  const graficosReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestGraficosReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestGraficosReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestGraficosReading?.image_url) ||
    sanitizeExternalHttpUrl(latestGraficosReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-fuchsia-300/60 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-100 shadow-[0_10px_30px_rgba(232,121,249,0.22)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-fuchsia-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Gráficos</h3>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{GRAFICOS_INTRO}</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Archivo de experiencia narrativa</p>
                  <RelatedReadingTooltipButton
                    slug={latestGraficosReading?.slug}
                    authorLabel={graficosReadingAuthorLabel}
                    thumbnailUrl={graficosReadingThumbnailUrl}
                    ariaLabel="Mostrar lectura relacionada de Gráficos"
                    tone="cyan"
                  />
                </div>
                <div className="form-surface px-6 py-8">
                  {vitranaQuestion ? (
                    <p className="text-slate-800 text-base leading-relaxed italic text-center font-light">
                      {vitranaQuestion}
                    </p>
                  ) : (
                    <p className="text-slate-400/60 text-sm text-center py-2">···</p>
                  )}
                </div>
                <div className="mx-auto w-full max-w-md">
                  <button
                    type="button"
                    className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                    onClick={handleOpenCommunityComposer}
                  >
                    Registra tu experiencia
                  </button>
                </div>
                <p className="text-xs text-slate-400/70 leading-relaxed px-1">
                  Esta plataforma investiga cómo distintas personas atraviesan experiencias narrativas, emocionales y simbólicas.
                </p>
                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          </div>


          <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-fuchsia-900/30 p-6 lg:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Swipe narrativo</p>
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-fuchsia-900/40 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.65)]">
              <div className="grid gap-0 lg:grid-cols-[1fr_1.3fr]">
                <div className="relative h-full min-h-[240px]">
                  <img
                    src={GRAFICOS_SWIPE_SHOWCASE.previewImage}
                    alt={GRAFICOS_SWIPE_SHOWCASE.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                    <Scan size={14} className="text-fuchsia-200" />
                    Swipe PDF
                  </div>
                  <div className="absolute left-4 bottom-4 text-sm text-white/90">
                    Lector visual · scroll vertical
                  </div>
                </div>

                <div className="flex flex-col space-y-4 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">Lector visual activo</p>
                  <h4 className="font-display text-2xl text-slate-100">{GRAFICOS_SWIPE_SHOWCASE.title}</h4>
                  <p className="text-sm text-slate-200/90 leading-relaxed">{GRAFICOS_SWIPE_SHOWCASE.description}</p>
                  <ul className="space-y-2 text-sm text-slate-100 leading-relaxed">
                    {GRAFICOS_SWIPE_SHOWCASE.swipeNotes.map((point, index) => (
                      <li key={`grafico-note-${index}`} className="flex items-start gap-2">
                        <span className="text-fuchsia-200 mt-1">●</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="sm:flex-none justify-center bg-gradient-to-r from-fuchsia-600/80 to-purple-500/80 hover:from-fuchsia-500 hover:to-purple-400 text-white"
                      onClick={() => setIsImagePreviewOpen(true)}
                    >
                      Ver portada
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOpenPdf}
                      className="w-full sm:w-auto justify-center border-fuchsia-300/40 text-fuchsia-200 hover:bg-fuchsia-500/10"
                    >
                      Abrir swipe en PDF
                    </Button>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gray-100/80">Prototipo del Capítulo 1</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Detonadores visuales</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-slate-500">Entrada</p>
                <p className="font-semibold text-slate-100 mt-2">¿Qué no pudiste decir en escena?</p>
                <p className="text-sm text-slate-300/85 mt-2 leading-relaxed">
                  Convierte una frase en viñeta para explorar cómo cambia su intensidad cuando la dibujas.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-slate-500">Proceso</p>
                <p className="font-semibold text-slate-100 mt-2">Tensión entre trazo y silencio</p>
                <p className="text-sm text-slate-300/85 mt-2 leading-relaxed">
                  Cada panel funciona como una pausa: lo no dicho también se vuelve narrativa.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel
              collaborators={[GRAFICOS_COLLABORATOR]}
              accentClassName="text-fuchsia-200/90"
              extraContent={(
                <div>
                  <p className="text-sm font-semibold text-slate-100">Convocatoria abierta</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300/90">
                    {GRAFICOS_COLLABORATOR_CALL_ITEMS.map((item) => (
                      <li key={`grafico-collab-call-${item}`} className="flex items-start gap-2">
                        <span className="mt-1 text-fuchsia-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={handleOpenCommunityComposer}
                      className="w-full justify-center bg-gradient-to-r from-fuchsia-500/90 to-purple-600/90 text-white hover:from-fuchsia-400/90 hover:to-purple-500/90 sm:w-auto"
                    >
                      Sumarme al laboratorio
                    </Button>
                  </div>
                </div>
              )}
            />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={GRAFICOS_NOTA_AUTORAL.title} verse={GRAFICOS_NOTA_AUTORAL.verse} palette={GRAFICOS_TILE} />
            </div>
          </div>
          <IAInsightCard {...GRAFICOS_IA_PROFILE} compact />
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="grafico"
        />
      </div>

      {isImagePreviewOpen ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsImagePreviewOpen(false)} />
          <div className="relative z-10 my-10 w-[calc(100vw-2rem)] max-w-3xl space-y-4">
            <div className="flex justify-between items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Portada</p>
                <h4 className="font-display text-2xl text-slate-100">{GRAFICOS_SWIPE_SHOWCASE.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-white/40"
                aria-label="Cerrar portada"
              >
                <ImageIcon size={16} />
              </button>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/50">
              <img
                src={GRAFICOS_SWIPE_SHOWCASE.previewImage}
                alt={GRAFICOS_SWIPE_SHOWCASE.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PortalGraficos;
