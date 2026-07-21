import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation , useNavigate } from 'react-router-dom';
import {
  Map,
  RadioTower,
  Scan,
  User,
  Users,
} from 'lucide-react';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import LoginNudgeOverlay from '@/components/LoginNudgeOverlay';
import BienvenidaGuardrail from '@/components/BienvenidaGuardrail';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import DiosasCarousel from '@/components/DiosasCarousel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import ResonanceModal, { LEVEL2_QUESTIONS, buildL1Acknowledgment } from '@/components/portal/ResonanceModal';
import PulseReactionCard from '@/components/portal/PulseReactionCard';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';
import { ensureAnonId } from '@/lib/identity';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { safeGetItem } from '@/lib/safeStorage';
import { ORACULO_RECOMMENDED_SHOWCASE_KEY } from '@/components/transmedia/transmediaConstants';
import PortalL3RewardCTA from '@/components/portal/PortalL3RewardCTA';

const MOVEMENT_INTRO =
  'Este miniverso creativo traslada al cuerpo los conflictos mentales del universo #GatoEncerrado. Si en la obra la mente se fragmenta, aquí el cuerpo busca arraigo. Es un laboratorio coreográfico y somático que se activa por ciudad. No se interpretan emociones: se atraviesan.';
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



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando recorridos donde el cuerpo también participa en lo que sentimos."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalMovimiento = () => {
  const { user } = useAuth();
  usePortalTracking('movimiento');
  const { question: vitranaQuestion } = useVitranaQuestion('movimiento');
  const titleDisplay = useScrambleText('El cuerpo');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [isMovementCreditsOpen, setIsMovementCreditsOpen] = useState(false);
  const [latestMovimientoReading, setLatestMovimientoReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}').l1); } catch { return false; } });
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:movimiento') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
  const [actionFeedback, setActionFeedback] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    const t = window.setTimeout(() => setIsResonanceOpen(true), 150);
    return () => window.clearTimeout(t);
  }, []);
  const readingTooltipRef = useRef(null);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  // Salvaguarda: leer/explorar no requiere sesión, responder a la resonancia
  // colectiva sí. Se muestra el mismo aviso "¿Te gustaría iniciar sesión?" antes
  // de abrir el formulario de login real.
  const [showResonanceLoginNudge, setShowResonanceLoginNudge] = useState(false);
  // Gate en dos niveles: primero Tercera Llamada, luego login — nunca al
  // revés. hasBienvenida refleja el mismo localStorage que usa el guardrail
  // de MiniverseModal.jsx.
  const [hasBienvenida, setHasBienvenida] = useState(
    () => { try { return localStorage.getItem('gatoencerrado:bienvenida-completed') === '1'; } catch { return false; } }
  );
  const [showBienvenidaGuardrail, setShowBienvenidaGuardrail] = useState(false);
  // Tras completar el login real, continúa automáticamente al mismo lugar
  // donde el usuario quería responder — sin esto, quedaba de vuelta en la
  // página sin el video/narrativa que sigue naturalmente a ResonanceModal.
  const [pendingResonanceAfterLogin, setPendingResonanceAfterLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pendingResonanceAfterLogin) {
      setPendingResonanceAfterLogin(false);
      setIsResonanceOpen(true);
    }
  }, [isAuthenticated, pendingResonanceAfterLogin]);

  const handleCloseResonanceLoginNudge = useCallback(() => {
    setShowResonanceLoginNudge(false);
  }, []);

  const handleConfirmResonanceLogin = useCallback(() => {
    setShowResonanceLoginNudge(false);
    setPendingResonanceAfterLogin(true);
    setShowLoginOverlay(true);
  }, []);

  const handleCloseBienvenidaGuardrail = useCallback(() => {
    setShowBienvenidaGuardrail(false);
  }, []);

  // Al completar la bienvenida no se encadena nada más: solo se marca y se
  // cierra. Si el usuario vuelve a intentar responder, handleAnswerResonance
  // ya lo manda al login nudge con hasBienvenida en true.
  const handleBienvenidaCompleted = useCallback(() => {
    setHasBienvenida(true);
    setShowBienvenidaGuardrail(false);
  }, []);

  const handleAnswerResonance = useCallback(() => {
    if (isAuthenticated) {
      setIsResonanceOpen(true);
      return;
    }
    // El miniverso que el bridge de Bienvenida recomendó va libre de
    // salvaguardas — es el único que un invitado puede abrir y completar
    // sin fricción adicional.
    if (safeGetItem(ORACULO_RECOMMENDED_SHOWCASE_KEY) === 'miniversoMovimiento') {
      setIsResonanceOpen(true);
      return;
    }
    if (!hasBienvenida) {
      setShowBienvenidaGuardrail(true);
      return;
    }
    setShowResonanceLoginNudge(true);
  }, [isAuthenticated, hasBienvenida]);

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
      const ACTION_TYPE_MAP = {
        ruta: 'route_click',
        'marcador-ar': 'ar_marker_click',
        talleres: 'workshop_click',
        livestream: 'livestream_click',
      };
      const interactionType = ACTION_TYPE_MAP[action?.id];
      if (interactionType) {
        supabase.from('miniverso_movimiento_interactions').insert({
          interaction_type: interactionType,
          action_id: action?.id ?? null,
          anon_id: ensureAnonId() ?? null,
          user_id: user?.id ?? null,
          metadata: { recorded_at: new Date().toISOString() },
        }).then(({ error }) => { if (error) console.warn('[movimiento]', interactionType, error.message); });
      }
      setActionFeedback(action?.toastMessage || 'Esta activación se habilitará pronto.');
    },
    [requireAuth, user]
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

  const movimientoReadingAuthorLabel = (latestMovimientoReading?.author || '').trim() || 'autor invitado';
  const movimientoReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestMovimientoReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.image_url) ||
    sanitizeExternalHttpUrl(latestMovimientoReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
            {showLoginHint ? (
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-emerald-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestMovimientoReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestMovimientoReading.slug}
                  authorLabel={movimientoReadingAuthorLabel}
                  thumbnailUrl={movimientoReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Movimiento"
                  tone="cyan"
                />
              </div>
            ) : null}
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{MOVEMENT_INTRO}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-200/35 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">Cuerpo en tránsito</span>
                  <span className="rounded-full border border-emerald-200/35 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">Ritual coreográfico</span>
                  <span className="rounded-full border border-emerald-200/35 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">Ruta por ciudad</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                  <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('movimiento', l2Answer) ?? LEVEL2_QUESTIONS['movimiento']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="movimiento"
                    l2Done={l2Done}
                    l3Done={Boolean(l3Rec?.step3)}
                    l3Step3={l3Rec?.step3 ?? null}
                    l3FormaLabel={l3Rec?.forma ?? null}
                    onL3CTA={() => { const r = resolvePortalRoute({ formatId: l3Rec?.recommended_format_id }); if (r) navigate(r); }}
                    onAnswer={handleAnswerResonance}
                    label=""
                  />
                  <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
                </div>
              </div>
            </div>
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => { setIsResonanceOpen(false); refreshL1(); }}
                question={vitranaQuestion}
                portal="movimiento"
                onOpenNarrative={() => handleMovementAction(MOVEMENT_ACTIONS.find((a) => a.id === 'talleres'))}
                narrativeCTALabel="✦ Ver los talleres"
              />
            )}
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={MOVEMENT_NOTA_AUTORAL.title} verse={MOVEMENT_NOTA_AUTORAL.verse} palette={MOVEMENT_TILE} effect="flip" gatEventKey="flip:nota-autoral:movimiento" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(148,163,184,0.22)]">
                      <User size={16} />
                    </span>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-slate-300/85">Colaboradores</p>
                  </div>
                  <button type="button" onClick={() => setIsMovementCreditsOpen((prev) => !prev)} className="text-xs uppercase tracking-[0.3em] text-slate-300 hover:text-white transition">
                    {isMovementCreditsOpen ? 'Ocultar' : 'Abrir'}
                  </button>
                </div>
                {isMovementCreditsOpen ? (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-semibold text-slate-100">Colaboradores que buscamos</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300/90">
                      {MOVEMENT_COLLABORATOR_CALL_ITEMS.map((item) => (
                        <li key={`movement-collab-call-mobile-${item}`} className="flex items-start gap-2">
                          <span className="mt-1 text-purple-300">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleOpenCommunityComposer} className="w-full justify-center bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white hover:from-emerald-400/90 hover:to-emerald-500/90 sm:w-auto">
                        Convocatoria abierta
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden lg:block rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
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
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard
                title={MOVEMENT_NOTA_AUTORAL.title}
                verse={MOVEMENT_NOTA_AUTORAL.verse}
                palette={MOVEMENT_TILE}
                effect="flip"
                gatEventKey="flip:nota-autoral:movimiento"
              />
            </div>
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

          <div className={`lg:hidden rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
            <div className="mb-1">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
              <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
            </div>
            <VitranaQuestionReveal
              question={l1Done ? (buildL1Acknowledgment('movimiento', l2Answer) ?? LEVEL2_QUESTIONS['movimiento']?.question ?? vitranaQuestion) : vitranaQuestion}
              buttonLabel={l1Done ? 'Tu progreso →' : undefined}
              autoReveal={l1Done}
              portal="movimiento"
              l2Done={l2Done}
              l3Done={Boolean(l3Rec?.step3)}
              l3Step3={l3Rec?.step3 ?? null}
              l3FormaLabel={l3Rec?.forma ?? null}
              onL3CTA={() => { const r = resolvePortalRoute({ formatId: l3Rec?.recommended_format_id }); if (r) navigate(r); }}
              onAnswer={handleAnswerResonance}
              label=""
            />
            <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
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

          </div>
          <IAInsightCard {...MOVEMENT_IA_PROFILE} compact />
          {l3Rec?.step3 ? (
            <PortalL3RewardCTA portal="movimiento" l3Rec={l3Rec} />
          ) : experienceDone ? (
            <button
              type="button"
              onClick={() => handleMovementAction(MOVEMENT_ACTIONS.find((a) => a.id === 'talleres'))}
              className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
            >
              ✦ Inscríbete a los talleres coreográficos
            </button>
          ) : null}
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <BienvenidaGuardrail
          open={showBienvenidaGuardrail}
          onClose={handleCloseBienvenidaGuardrail}
          onCompleted={handleBienvenidaCompleted}
          description="Para responder esta pregunta y que tu resonancia forme parte del diálogo colectivo, primero cruza la puerta de entrada al universo. Es un vistazo breve — después puedes volver aquí mismo a compartir tu respuesta."
        />
        <LoginNudgeOverlay
          open={showResonanceLoginNudge}
          onClose={handleCloseResonanceLoginNudge}
          onLogin={handleConfirmResonanceLogin}
          title="¿Te gustaría iniciar sesión para responder?"
          description="Puedes seguir explorando este universo libremente. Para dejar tu propia resonancia y que forme parte del diálogo colectivo, necesitas iniciar sesión."
          titleId="resonance-login-nudge-title"
        />
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
