import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Hand,
  Heart,
  Map,
  RadioTower,
  Scan,
  User,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import DiosasCarousel from '@/components/DiosasCarousel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import { fetchApprovedContributions } from '@/services/contributionService';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';

const MOVEMENT_INTRO =
  'Movimiento traslada al cuerpo los conflictos mentales del universo #GatoEncerrado. Si en la obra la mente se fragmenta, aquí el cuerpo busca arraigo. Es un laboratorio coreográfico y somático que se activa por ciudad. No se interpretan emociones: se atraviesan.';
const MOVEMENT_TAGLINE = 'Talleres de Cuerpo Colectivo';
const MOVEMENT_BODY =
  'Cuando la obra visita una ciudad, Movimiento activa una semana de exploración corporal abierta a la comunidad. Cada jornada trabaja una fuerza corporal específica, desde arraigo hasta fragmentación, a través de entrenamiento somático y creación coreográfica.\n\nEstas coreografías se registran mediante captura de movimiento (o mocap) y se traducen en presencias digitales que habitan ese territorio. Al finalizar el proceso, la acción escénica no desaparece: queda sembrada en el espacio público como una presencia en realidad aumentada.';
const MOVEMENT_COLLABORATOR_CALL_ITEMS = [
  'Intérpretes y bailarines por ciudad',
  'Diseño y desarrollo de skins digitales',
  'Asistencia en captura de movimiento',
  'Espacios para activación urbana',
  'Comunidad interesada en exploración corporal',
];
const MOVEMENT_HIGHLIGHTS = [
  'Una presencia digital inspirada en mitologías mesoamericanas.',
  'Diseñada con motion capture.',
  'Acompañada de música original.',
  'Proyectada con videomapping láser durante las noches.',
];
const MOVEMENT_ACTIONS = [
  {
    id: 'ruta',
    label: 'Explora su ruta',
    description: 'Sigue el mapa interactivo o la línea de tiempo animada de cada estación (Tijuana, La Paz, etc.).',
    badge: 'CTA principal',
    buttonLabel: 'Explorar',
    toastMessage: 'Muy pronto liberaremos el mapa coreográfico y el timeline de estaciones.',
    icon: Map,
  },
  {
    id: 'marcador-ar',
    label: 'Activa un marcador AR en tu ciudad',
    description: 'Activa la cámara (WebAR) o abre la guía para instalar la app y recibir instrucciones.',
    buttonLabel: 'Activar AR',
    toastMessage: 'La guía WebAR se está terminando; te avisaremos cuando la cámara pueda abrir el portal.',
    icon: Scan,
  },
  {
    id: 'talleres',
    label: 'Inscríbete a los talleres coreográficos',
    description: 'Convocatorias abiertas por temporada. Reserva tu lugar en los talleres que trazan la ruta.',
    buttonLabel: 'Inscribirme',
    toastMessage: 'Abriremos el formulario conectado a Supabase para registrar tu participación.',
    icon: Users,
  },
  {
    id: 'livestream',
    label: 'Sigue el livestream de la función final',
    description: 'Activa un embed o cuenta regresiva para ver la ruta completa cuando llegue la noche.',
    buttonLabel: 'Ver livestream',
    toastMessage: 'El livestream y su countdown estarán activos antes de la función final.',
    icon: RadioTower,
  },
];
const MOVEMENT_DIOSAS_GALLERY = [
  {
    id: 'coatlicue-360',
    title: 'Coatlicue',
    description: 'Madre tierra. Peso. Vida y muerte simultánea.',
    badge: 'Portal AR',
    location: 'Hombros / Carga',
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Coatlicue/coatlicue_web.mp4',
    poster:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Coatlicue/coatlicue_web.jpg',
    gradient:
      'linear-gradient(165deg, rgba(16,185,129,0.65), rgba(59,130,246,0.55), rgba(168,85,247,0.55))',
  },
  {
    id: 'chanico-360',
    title: 'Chanico',
    description: 'Fuego doméstico. Centro del hogar.',
    badge: 'Portal AR',
    location: 'Plexo / Centro de voluntad',
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Chantico/chanico_web.mp4',
    poster:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Chantico/chanico_web.jpg',
    gradient:
      'linear-gradient(175deg, rgba(14,165,233,0.55), rgba(52,211,153,0.45), rgba(8,47,73,0.75))',
  },
  {
    id: 'chicomecoatl-360',
    title: 'Chicomecóatl',
    description: 'Maíz. Fertilidad. Sostén de vida.',
    badge: 'Portal AR',
    location: 'Caderas / Raíz',
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Chicomecoatl/chicomecoatl_web.mp4',
    poster:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Chicomecoatl/chicomecoatl_web.jpg',
    gradient:
      'linear-gradient(175deg, rgba(99,102,241,0.52), rgba(20,184,166,0.45), rgba(109,40,217,0.55))',
  },
  {
    id: 'coyolxauhqui-360',
    title: 'Coyolxauhqui',
    description: 'Luna desmembrada en movimiento continuo.',
    badge: 'Portal AR',
    location: 'Cabeza / Fragmentación',
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/web/Coyolxauhqui/Coyolxauhqui_web.mp4',
    poster:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Presencias/posters/Coyolxauhqui/Coyolxauhqui_web.jpg',
    gradient:
      'linear-gradient(180deg, rgba(129,140,248,0.58), rgba(14,165,233,0.45), rgba(30,41,59,0.7))',
  },
];
const MOVEMENT_IA_PROFILE = {
  type: 'Actualmente no usa IA en producción.',
  interaction:
    'Registro en motion capture (mocap), traducción a avatar digital y activación en sitio mediante realidad aumentada.',
  tokensRange: 'Sin consumo de IA por visitante en esta etapa.',
  coverage: 'Producción técnica y activación territorial gestionadas por el equipo de Movimiento.',
  footnote: 'Cuando integremos módulos de IA reales, esta ficha se actualizará con métricas verificables.',
};
const MOVEMENT_NOTA_AUTORAL = {
  title: '#CaerEsDanzar',
  verse: 'Mi cuerpo colapsará;\nno sin danza\nni dolor bonito.',
};
const MOVEMENT_TILE = {
  gradient: 'linear-gradient(135deg, rgba(24,30,45,0.95), rgba(40,64,65,0.85), rgba(74,123,102,0.65))',
  border: 'rgba(163,233,208,0.35)',
  text: '#d1fae5',
  accent: '#a7f3d0',
  background: 'rgba(24,30,45,0.75)',
};
const MOVIMIENTO_BLOG_KEYS = [
  'movimiento',
  'miniversomovimiento',
  'miniverso_movimiento',
  'miniverso-movimiento',
];
const MOVIMIENTO_BLOG_KEY_SET = new Set(MOVIMIENTO_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

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
          Haz clic y deja un pulso para que la Ruta de la Corporeidad siga viva.
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
      {status === 'loading' ? 'Enviando...' : 'Hacer vibrar la ruta'}
    </p>
  </div>
);

const PortalMovimiento = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [isMovementCreditsOpen, setIsMovementCreditsOpen] = useState(false);
  const [communityComments, setCommunityComments] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [latestMovimientoReading, setLatestMovimientoReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const readingTooltipRef = useRef(null);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginOverlay(true);
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);

  useEffect(() => {
    let isCancelled = false;
    const loadComments = async () => {
      setCommunityLoading(true);
      setCommunityError('');
      const topics = ['movimiento', 'miniversomovimiento'];
      let resolvedData = [];
      let resolvedError = null;
      for (const topic of topics) {
        const { data, error } = await fetchApprovedContributions(topic);
        if (isCancelled) return;
        if (error) {
          resolvedError = error;
          continue;
        }
        if (Array.isArray(data) && data.length) {
          resolvedData = data;
          resolvedError = null;
          break;
        }
      }
      if (isCancelled) return;
      if (resolvedError && !resolvedData.length) {
        setCommunityError('No pudimos cargar comentarios.');
      }
      setCommunityComments(resolvedData);
      setCommunityLoading(false);
    };

    loadComments();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLatestMovimientoReading = async () => {
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
        console.warn('[PortalMovimiento] No se pudo detectar lectura relacionada:', error);
        setLatestMovimientoReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return MOVIMIENTO_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestMovimientoReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestMovimientoReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestMovimientoReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestMovimientoReading?.slug]);

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
    if (!actionFeedback) return undefined;
    const timer = window.setTimeout(() => setActionFeedback(''), 2800);
    return () => window.clearTimeout(timer);
  }, [actionFeedback]);

  const handleMovementAction = useCallback(
    (action) => {
      if (!requireAuth()) return;
      setActionFeedback(action?.toastMessage || 'Esta activación se habilitará pronto.');
    },
    [requireAuth]
  );

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversoMovimiento', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const hasCommunityComments = useMemo(() => communityComments.length > 0, [communityComments]);
  const movimientoReadingAuthorLabel = (latestMovimientoReading?.author || '').trim() || 'autor invitado';
  const movimientoReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestMovimientoReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.image_url) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/60 to-emerald-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Vitrina</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">Movimiento</h3>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{MOVEMENT_INTRO}</p>
                </div>
                <IAInsightCard {...MOVEMENT_IA_PROFILE} compact />
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                  <MiniVersoCard
                    title={MOVEMENT_NOTA_AUTORAL.title}
                    verse={MOVEMENT_NOTA_AUTORAL.verse}
                    palette={MOVEMENT_TILE}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(148,163,184,0.22)]">
                  <User size={16} />
                </span>
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300/85">Colaboradores</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMovementCreditsOpen((prev) => !prev)}
                className="text-xs uppercase tracking-[0.3em] text-slate-300 hover:text-white transition"
              >
                {isMovementCreditsOpen ? 'Ocultar' : 'Abrir'}
              </button>
            </div>
            {isMovementCreditsOpen ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm font-semibold text-slate-100">Colaboradores que buscamos</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300/90">
                  {MOVEMENT_COLLABORATOR_CALL_ITEMS.map((item) => (
                    <li key={`movement-collab-call-${item}`} className="flex items-start gap-2">
                      <span className="mt-1 text-purple-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleOpenCommunityComposer}
                    className="w-full justify-center bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white hover:from-emerald-400/90 hover:to-emerald-500/90 sm:w-auto"
                  >
                    Convocatoria abierta
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-purple-900/30 p-6 lg:p-8">
            <h3 className="font-display text-3xl text-slate-100">{MOVEMENT_TAGLINE}</h3>
            <p className="text-sm leading-relaxed text-slate-100/80 md:text-base whitespace-pre-line">{MOVEMENT_BODY}</p>
            <DiosasCarousel
              items={MOVEMENT_DIOSAS_GALLERY}
              label="Swipe-horizontal"
              caption="Cada clip muestra un giro 360° de las presencias cuenta-cuentos."
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr] xl:items-start">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Activaciones de ruta</p>
                <div className="space-y-3">
                  {MOVEMENT_ACTIONS.map((action) => {
                    const ActionIcon = action.icon || Map;
                    return (
                      <div
                        key={action.id}
                        className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3 hover:border-purple-400/40 transition"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full border border-white/10 bg-white/5 p-3">
                              <ActionIcon size={20} className="text-purple-200" />
                            </div>
                            <div>
                              {action.badge ? (
                                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{action.badge}</p>
                              ) : null}
                              <p className="font-semibold text-slate-100">{action.label}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10 sm:w-auto"
                            onClick={() => handleMovementAction(action)}
                          >
                            {action.buttonLabel ? `${action.buttonLabel} (próximamente)` : 'Próximamente'}
                          </Button>
                        </div>
                        {action.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{action.description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {actionFeedback ? (
                  <p className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    {actionFeedback}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3 text-sm leading-relaxed">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Ritual digital</p>
                  <ul className="space-y-2 text-slate-200/85">
                    {MOVEMENT_HIGHLIGHTS.slice(0, 2).map((item) => (
                      <li key={`movement-highlight-a-${item}`} className="flex items-start gap-2">
                        <span className="text-purple-300 mt-1">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3 text-sm leading-relaxed">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Noche de activación</p>
                  <ul className="space-y-2 text-slate-200/85">
                    {MOVEMENT_HIGHLIGHTS.slice(2).map((item) => (
                      <li key={`movement-highlight-b-${item}`} className="flex items-start gap-2">
                        <span className="text-purple-300 mt-1">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Voces de la comunidad</p>
                  <RelatedReadingTooltipButton
                    slug={latestMovimientoReading?.slug}
                    authorLabel={movimientoReadingAuthorLabel}
                    thumbnailUrl={movimientoReadingThumbnailUrl}
                    ariaLabel="Mostrar lectura relacionada de Movimiento"
                    tone="cyan"
                  />
                </div>
                <div className="max-h-[240px] form-surface relative overflow-y-auto px-3 py-3 pr-2">
                  {communityLoading ? (
                    <p className="px-1 py-2 text-sm text-slate-600/85">Cargando comentarios...</p>
                  ) : communityError ? (
                    <p className="px-1 py-2 text-sm text-rose-700/85">{communityError}</p>
                  ) : hasCommunityComments ? (
                    <div className="space-y-2.5">
                      {communityComments.map((comment) => (
                        <div
                          key={`portal-movimiento-comment-${comment.id}`}
                          className="rounded-xl border border-indigo-200/70 bg-white/72 p-3 shadow-[0_6px_18px_rgba(80,120,255,0.08)]"
                        >
                          <p className="mb-1.5 text-[0.96rem] font-light leading-relaxed text-slate-800">{comment.proposal}</p>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500/85">{comment.name || 'Anónimo'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 py-2 text-sm text-slate-600/85">Todavía no hay voces en este miniverso.</p>
                  )}
                </div>
                <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500/85">Desliza para leer más voces</p>
                <div className="pt-4 mt-1 border-t border-white/10">
                  <div className="mx-auto w-full max-w-md">
                    <button
                      type="button"
                      className="w-full rounded-full border border-purple-500/70 text-purple-100 shadow-[0_15px_45px_rgba(67,56,202,0.45)] hover:bg-purple-500/20 tracking-[0.25em] text-xs uppercase px-4 py-2"
                      onClick={handleOpenCommunityComposer}
                    >
                      coméntanos algo
                    </button>
                  </div>
                </div>

                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          </div>
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="movimiento"
        />
      </div>
    </div>
  );
};

export default PortalMovimiento;
