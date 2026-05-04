import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clapperboard, Hand, Heart, Ticket, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import { ensureAnonId } from '@/lib/identity';

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;

const CINE_INTRO =
  'El cine dentro de #GatoEncerrado es otro modo de entrar al encierro.';
const CINE_PROMISE = 'CopyCats (cine de no-ficción) y Quirón (cortometraje de autoficción) dialogan desde extremos distintos del mismo espectro:';
const CINE_THEME =
  'Una filma el desgaste creativo y la fractura del proceso; la otra abre una confesión íntima que decide hablar del suicidio sin rodeos.';
const CINE_TONE = ['Premiere íntima', 'Conversatorio abierto', 'Cine con memoria'];
const CINE_NOTA_AUTORAL = {
  title: '#LuzQueEditas',
  verse: 'Memoria encendida.\nCamara despierta.\nY el tiempo la vuelve a montar.',
};
const CINE_TILE = {
  gradient: 'linear-gradient(135deg, rgba(16,27,54,0.95), rgba(38,63,109,0.85), rgba(92,47,95,0.7))',
  border: 'rgba(147,197,253,0.38)',
  text: '#dbeafe',
  accent: '#bfdbfe',
  background: 'rgba(16,27,54,0.75)',
};
const CINE_IA_PROFILE = {
  type: 'GPT-4o mini + subtitulos vivos y notas criticas asistidas.',
  interaction: 'Notas criticas y captions contextuales por espectador.',
  tokensRange: '200-450 tokens por visita.',
  coverage: 'Incluido en la activacion de huellas.',
  footnote: 'La IA acompaña la mirada; la decision sigue siendo humana.',
};
const COPYCATS_DATA = {
  title: 'CopyCats',
  description:
    'CopyCats observa el acto de crear mientras ocurre. Un cine-ensayo sobre repetición, desgaste creativo y el extraño momento en que una obra empieza a copiarse a sí misma.',
  microcopy: 'Ensayo abierto (4:27)',
  url: `${SUPABASE_STORAGE}/Cine%20-%20teasers/Cadena_Gesto_small.mp4`,
  tags: ['teaser', 'Identidad Digital', 'Archivo autoficcional'],
};
const QUIRON_DATA = {
  title: 'Quiron',
  description: 'Mira el teaser de un cortometraje que explora la vulnerabilidad donde casi nunca se nombra.',
  teaserLabel: 'Teaser oficial',
  teaserUrl: `${SUPABASE_STORAGE}/Cine%20-%20teasers/Quiron_small.mp4`,
  fullUrl: `${SUPABASE_STORAGE}/Cine%20-%20teasers/Quiron_10min.mp4`,
  tags: ['Cine-ensayo', 'Identidad Digital', 'Archivo autoficcional'],
};
const CINE_PROYECCION = {
  title: 'Mayo 2026 · Cineteca CECUT',
  description:
    'Forma parte de la primera proyeccion doble de CopyCats + Quiron, con conversatorio del equipo y sonido Dolby Atmos diseniado por Concrete Sounds.',
  cta: 'Quiero ser parte de la proyeccion',
  footnote: 'Registro de interes activo. Espera noticias.',
};
const CINE_COLLABORATORS = [
  {
    id: 'viviana-gonzalez',
    name: 'Viviana Gonzalez',
    role: 'Direccion y fotografia · CopyCats / Quiron',
    bio: 'Viviana acompaña al Cine de #GatoEncerrado con una mirada que piensa. Comunicologa y docente en la Ibero, su experiencia ilumina procesos mas que superficies.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/viviana_gg.jpeg',
  },
  {
    id: 'diego-madera',
    name: 'Diego Madera',
    role: 'Compositor · Tema musical',
    bio: 'Diego tiende puentes entre emocion y estructura. Su musica respira junto al material filmado: acompana, sostiene y revela.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
  },
  {
    id: 'lia-perez',
    name: 'Lia Perez, MPSE',
    role: 'Diseno sonoro y pulso emocional',
    bio: 'Lia afino cada capa de sonido en Quiron y CopyCats. Su oido construye atmosferas que no se escuchan: se sienten.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg',
  },
  {
    id: 'maria-diana-laura-rodriguez',
    name: 'Maria Diana Laura Rodriguez',
    role: 'Produccion en linea y cuerpo en escena',
    bio: 'Coordino la produccion en linea del cortometraje y encarna una presencia clave entre lo ritual y lo domestico.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariadianalaura.jpg',
  },
  {
    id: 'tania-fraire',
    name: 'Tania Fraire Vazques',
    role: 'Autoficcion (Quiron) · Interprete natural en pantalla',
    bio: 'Tania llego al proyecto desde la autoficcion y revelo una presencia genuina, vulnerable y precisa frente a camara. Su participación en Quiron abrio una grieta luminosa para volver la historia mas humana.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/tania.jpg',
  },
];
const CINE_BLOG_KEYS = ['copycats', 'cine', 'miniversocine'];
const CINE_BLOG_KEY_SET = new Set(CINE_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

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
          Deja un pulso para sostener este miniverso cinematografico.
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
      {status === 'loading' ? 'Enviando...' : 'Hacer vibrar el cine'}
    </p>
  </div>
);

const PortalCine = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePortalTracking('cine');
  const { question: vitranaQuestion } = useVitranaQuestion('cine');
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestCineReading, setLatestCineReading] = useState(null);
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
    const loadLatestCineReading = async () => {
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
        console.warn('[PortalCine] No se pudo detectar lectura relacionada:', error);
        setLatestCineReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return CINE_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestCineReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestCineReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestCineReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestCineReading?.slug]);

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

  const handleOpenFullFilm = useCallback(() => {
    if (!requireAuth()) return;
    if (typeof window === 'undefined') return;
    window.open(QUIRON_DATA.fullUrl, '_blank', 'noopener,noreferrer');
  }, [requireAuth]);

  const handleProjectionInterest = useCallback(() => {
    if (!requireAuth()) return;
    supabase.from('miniverso_cine_interactions').insert({
      interaction_type: 'screening_cta',
      anon_id: ensureAnonId() ?? null,
      user_id: user?.id ?? null,
      metadata: { recorded_at: new Date().toISOString() },
    }).then(({ error }) => { if (error) console.warn('[cine] screening_cta:', error.message); });
    navigate({ pathname: '/', hash: '#next-show' });
  }, [requireAuth, navigate, user]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'copycats', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const cineReadingAuthorLabel = (latestCineReading?.author || '').trim() || 'autor invitado';
  const cineReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestCineReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestCineReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestCineReading?.image_url) ||
    sanitizeExternalHttpUrl(latestCineReading?.author_avatar_url) ||
    null;

  const handleImmersiveVideoActivate = useCallback(
    async (event, videoId) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLVideoElement)) return;

      if (isMobileViewport) {
        await requestMobileVideoPresentation(event, videoId);
        return;
      }

      target.controls = true;
      target.muted = false;
      target.loop = false;

      try {
        await target.play();
      } catch (error) {
        // Si el navegador bloquea el audio, dejamos visibles los controles.
      }
    },
    [isMobileViewport, requestMobileVideoPresentation]
  );

  const renderImmersiveCinemaCard = ({
    title,
    description,
    microcopy,
    videoUrl,
    poster,
    tags,
    accentClassName,
    icon,
    cta = null,
  }) => {
    const videoId = `${title}-${videoUrl}`;

    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/10 p-6 ${accentClassName}`}
      >
        <div className="absolute inset-0">
          <video
            src={videoUrl}
            className="h-full w-full cursor-pointer object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            controls={isMobileViewport ? canUseInlinePlayback(videoId) : false}
            onClick={(event) => {
              void handleImmersiveVideoActivate(event, videoId);
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.14)_35%,rgba(0,0,0,0.72)_100%)]" />
        </div>

        <div className="relative z-10 flex min-h-[30rem] flex-col">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display text-2xl text-slate-100">{title}</h4>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-100 backdrop-blur-md">
              {icon}
            </span>
          </div>

          <div className="pointer-events-none mt-4 flex justify-end">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
              <Video size={14} />
              {isMobileViewport ? 'Toca para abrir' : 'Haz clic para activar'}
            </div>
          </div>

          <div aria-hidden="true" className="h-[11rem] sm:h-[13rem] lg:h-[14rem]" />

          <div className="mt-auto space-y-4">
            <p className="text-sm text-slate-200/90 leading-relaxed">{description}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{microcopy}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={`${title}-tag-${tag}`}
                  className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            {cta}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-sky-300/60 bg-sky-500/10 px-3 py-2 text-xs text-sky-100 shadow-[0_10px_30px_rgba(56,189,248,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-sky-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestCineReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestCineReading.slug}
                  authorLabel={cineReadingAuthorLabel}
                  thumbnailUrl={cineReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Cine"
                  tone="cyan"
                />
              </div>
            ) : null}
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-sky-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Cine</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{CINE_INTRO}</p>
                  <p className="text-slate-100/90">{CINE_PROMISE}</p>
                  <p className="text-slate-300/90">{CINE_THEME}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CINE_TONE.map((item) => (
                    <span
                      key={`cine-tone-${item}`}
                      className="rounded-full border border-sky-200/35 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-100"
                    >
                      {item}
                    </span>
                  ))}
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


          <div className="grid gap-6 xl:grid-cols-2">
            {renderImmersiveCinemaCard({
              title: COPYCATS_DATA.title,
              description: COPYCATS_DATA.description,
              microcopy: COPYCATS_DATA.microcopy,
              videoUrl: COPYCATS_DATA.url,
              tags: COPYCATS_DATA.tags,
              accentClassName: 'bg-gradient-to-br from-slate-950/80 via-black/60 to-indigo-900/30',
              icon: <Clapperboard size={16} />,
            })}

            {renderImmersiveCinemaCard({
              title: QUIRON_DATA.title,
              description: QUIRON_DATA.description,
              microcopy: QUIRON_DATA.teaserLabel,
              videoUrl: QUIRON_DATA.teaserUrl,
              tags: QUIRON_DATA.tags,
              accentClassName: 'bg-gradient-to-br from-slate-950/80 via-black/60 to-purple-900/30',
              icon: <Video size={16} />,
              cta: (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center border-purple-300/40 bg-black/25 text-purple-200 backdrop-blur-sm hover:bg-purple-500/10"
                  onClick={handleOpenFullFilm}
                >
                  Ver cortometraje completo
                </Button>
              ),
            })}
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="rounded-2xl border border-cyan-200/25 bg-cyan-500/10 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">{CINE_PROYECCION.title}</p>
              <p className="text-sm text-slate-100/95 leading-relaxed">{CINE_PROYECCION.description}</p>
              <Button
                type="button"
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/85 to-blue-600/85 hover:from-cyan-400/90 hover:to-blue-500/90 text-white"
                onClick={handleProjectionInterest}
              >
                <Ticket size={15} className="mr-2" />
                {CINE_PROYECCION.cta}
              </Button>
              <p className="text-xs text-cyan-100/80">{CINE_PROYECCION.footnote}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={CINE_COLLABORATORS} accentClassName="text-sky-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={CINE_NOTA_AUTORAL.title} verse={CINE_NOTA_AUTORAL.verse} palette={CINE_TILE} />
            </div>
          </div>
          <IAInsightCard {...CINE_IA_PROFILE} compact />
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="cine"
        />
      </div>
    </div>
  );
};

export default PortalCine;
