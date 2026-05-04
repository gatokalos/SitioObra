import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Headphones, Heart, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import MiniversoSonoroPreview from '@/components/miniversos/sonoro/MiniversoSonoroPreview';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';

const SONORIDADES_INTRO =
  'Sonoridades reúne la música original y el diseño sonoro creados para la obra, junto con piezas que expanden su universo más allá del escenario.';
const SONORIDADES_BODY =
  'En la puesta, el sonido no acompañó la historia: la transformó. Abrió una experiencia inmersiva donde la resonancia modifica la percepción del tiempo, del cuerpo y del espacio. Este espacio permite recorrer esas composiciones, explorar sus capas y descubrir cómo lo audible deja huella incluso cuando la escena ya terminó.';
const SONORIDADES_CLOSE =
  'Cada visita es una mezcla nueva, un sueño que se reinventa con cada escucha.';
const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;

const SONORIDADES_VIDEO_URL = `${SUPABASE_STORAGE}/Sonoridades/videos-v/Vacio.mov`;
const SONORIDADES_MUSIC_OPTIONS = [
  {
    id: 'silencio',
    label: 'Silencio',
    url: '',
  },
  {
    id: 'ensayo-abierto',
    label: 'Ensayo Abierto (pista)',
    url: `${SUPABASE_STORAGE}/Sonoridades/audio/cat_theme.m4a`,
  },
];
const SONORIDADES_POEMS = [
  {
    id: 'pulmon',
    label: 'Poema 1 - Pulmon',
    text: 'La noche se abre como un pulmon cansado.',
  },
  {
    id: 'cuerpo',
    label: 'Poema 2 - Cuerpo',
    text: 'Lo que cae del sueño tambien cae del cuerpo.',
  },
];
const SONORIDADES_EXPLORATION = [
  'El video corre por su cuenta y cambia con cada visita.',
  'Tu eliges la musica para ajustar el animo del sueño.',
  'Escoge un poema y observa como se desliza mientras todo ocurre.',
];
const SONORIDADES_CLOSING = ['Sueño en tres capas', 'Cada combinacion abre un sueño distinto.', 'Entra y crea el tuyo.'];
const SONORIDADES_NOTA_AUTORAL = {
  title: '#LoQueSuenaAdentro',
  verse: 'Abri los ojos.\nLa resonancia era antigua.\nComo el silencio.',
};
const SONORIDADES_TILE = {
  gradient: 'linear-gradient(135deg, rgba(18,29,62,0.95), rgba(32,65,103,0.85), rgba(70,91,146,0.65))',
  border: 'rgba(125,211,252,0.38)',
  text: '#e0f2fe',
  accent: '#bae6fd',
  background: 'rgba(18,29,62,0.75)',
};
const SONORIDADES_IA_PROFILE = {
  type: 'GPT-4o mini para poemas moviles + curaduria sonora.',
  interaction: 'Seleccion de poema y mezcla guiada.',
  tokensRange: '130-280 tokens por mezcla.',
  coverage: 'Incluido en la huella transmedia.',
  footnote: 'La IA elige la forma; tu eliges el animo.',
};
const SONORIDADES_COLLABORATORS = [
  {
    id: 'lia-perez',
    name: 'Lia Perez, MPSE',
    role: 'Diseno Sonoro',
    bio: 'Artista sonora con mas de doce anios de experiencia. Fundadora de Concrete Sounds, ha colaborado en filmes como Ya no estoy aqui y Monos.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
  },
  {
    id: 'diego-madera',
    name: 'Diego Madera',
    role: 'Compositor',
    bio: 'Musico y compositor cuyo trabajo explora la tension entre sonido y silencio. Su pieza original acompania los pasajes emocionales de la obra.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
  },
];
const SONORIDADES_BLOG_KEYS = [
  'miniversosonoro',
  'sonoro',
  'sonoridades',
  'miniverso_sonoro',
  'miniverso-sonoro',
];
const SONORIDADES_BLOG_KEY_SET = new Set(SONORIDADES_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const MiniVersoCard = ({ title, verse, palette }) => {
  const [isActive, setIsActive] = useState(false);

  const toggle = () => setIsActive((prev) => !prev);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      className="relative [perspective:1200px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl"
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
    >
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
          Deja un pulso para sostener esta camara de resonancia.
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
      {status === 'loading' ? 'Enviando...' : 'Hacer latir la resonancia'}
    </p>
  </div>
);

const PortalSonoridades = () => {
  const { user } = useAuth();
  usePortalTracking('sonoridades');
  const { question: vitranaQuestion } = useVitranaQuestion('sonoridades');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestSonoridadesReading, setLatestSonoridadesReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
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
    const loadLatestSonoridadesReading = async () => {
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
        console.warn('[PortalSonoridades] No se pudo detectar lectura relacionada:', error);
        setLatestSonoridadesReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return SONORIDADES_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestSonoridadesReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestSonoridadesReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestSonoridadesReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestSonoridadesReading?.slug]);

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

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleOpenTrack = useCallback(() => {
    if (!requireAuth()) return;
    if (typeof window === 'undefined') return;
    const trackUrl = SONORIDADES_MUSIC_OPTIONS.find((item) => item.id === 'ensayo-abierto')?.url;
    if (!trackUrl) return;
    window.open(trackUrl, '_blank', 'noopener,noreferrer');
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversoSonoro', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const sonoridadesReadingAuthorLabel = (latestSonoridadesReading?.author || '').trim() || 'autor invitado';
  const sonoridadesReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestSonoridadesReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestSonoridadesReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestSonoridadesReading?.image_url) ||
    sanitizeExternalHttpUrl(latestSonoridadesReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-cyan-300/60 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-cyan-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestSonoridadesReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestSonoridadesReading.slug}
                  authorLabel={sonoridadesReadingAuthorLabel}
                  thumbnailUrl={sonoridadesReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Sonoridades"
                  tone="cyan"
                />
              </div>
            ) : null}
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Sonoridades</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{SONORIDADES_INTRO}</p>
                  <p>{SONORIDADES_BODY}</p>
                  <p className="text-slate-100/90">{SONORIDADES_CLOSE}</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Laboratorio de Resonancia</p>
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
                    registra tu respuesta
                  </button>
                </div>
                <p className="text-xs text-slate-400/70 leading-relaxed px-1">
                  Nos interesa explorar qué ocurre en distintas personas cuando una experiencia transforma su manera de entender el mundo.
                </p>
                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          </div>


          <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-cyan-900/30 p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Camara de resonancia</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                <Headphones size={13} />
                Sugerencia: usa audifonos
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-0 lg:p-6">
              <MiniversoSonoroPreview
                videoUrl={SONORIDADES_VIDEO_URL}
                videoTitle="Sonoridades"
                videoArtist="Residencia #GatoEncerrado"
                audioOptions={SONORIDADES_MUSIC_OPTIONS}
                poemOptions={SONORIDADES_POEMS}
                showHeader
                showCTA={false}
                isSpent
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleOpenTrack}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/85 to-blue-600/85 hover:from-cyan-400/90 hover:to-blue-500/90 text-white"
              >
                <Music2 size={15} className="mr-2" />
                Escuchar pista base
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-cyan-300/40 text-cyan-200 hover:bg-cyan-500/10"
                onClick={handleOpenCommunityComposer}
              >
                Compartir vibracion
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400/80">Como explorar</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-200 text-sm leading-relaxed">
                {SONORIDADES_EXPLORATION.map((step, index) => (
                  <li key={`sonoro-step-${index}`}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-2">
              {SONORIDADES_CLOSING.map((line, index) => (
                <p key={`sonoro-closing-${index}`} className="text-sm text-slate-300/90">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={SONORIDADES_COLLABORATORS} accentClassName="text-cyan-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={SONORIDADES_NOTA_AUTORAL.title} verse={SONORIDADES_NOTA_AUTORAL.verse} palette={SONORIDADES_TILE} />
            </div>
          </div>
          <IAInsightCard {...SONORIDADES_IA_PROFILE} compact />
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="sonoro"
        />
      </div>
    </div>
  );
};

export default PortalSonoridades;
