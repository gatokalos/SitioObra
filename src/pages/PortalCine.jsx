import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useLocation , useNavigate } from 'react-router-dom';
import { RotateCcw, Video, X } from 'lucide-react';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import LoginNudgeOverlay from '@/components/LoginNudgeOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import PortalL3RewardCTA from '@/components/portal/PortalL3RewardCTA';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import ResonanceModal, { LEVEL2_QUESTIONS, buildL1Acknowledgment } from '@/components/portal/ResonanceModal';
import PulseReactionCard from '@/components/portal/PulseReactionCard';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';

const SUPABASE_STORAGE = `${import.meta.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public`;

const CINE_INTRO =
  'El cine dentro de #GatoEncerrado es otro modo de entrar al encierro.';
const CINE_PROMISE = 'CopyCats (cine de no-ficción) y Quirón (cortometraje de autoficción) dialogan desde extremos distintos del mismo espectro:';
const CINE_THEME =
  'Una filma el desgaste creativo y la fractura del proceso; la otra abre una confesión íntima que decide hablar del suicidio sin rodeos.';
const CINE_TONE = ['Premiere íntima', 'Conversatorio abierto', 'Cine con memoria'];
const CINE_NOTA_AUTORAL = {
  title: '#LuzQueEditas',
  verse: 'Memoria encendida.\nCámara despierta.\nY el tiempo se vuelve a editar.',
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
const QUIRON_DATA = {
  title: 'Quirón',
  description: 'Quirón es un cortometraje de autoficción que indaga en la herida emocional como punto de partida del conocimiento y la transformación. A través de una narrativa audiovisual original, explora la posibilidad de resignificar el dolor humano.',
  teaserUrl: `${SUPABASE_STORAGE}/Cine%20-%20teasers/Quiron_small.mp4`,
  fullUrl: `${SUPABASE_STORAGE}/Cine%20-%20teasers/Quiron_10min.mp4`,
  tags: ['Cine-ensayo', 'Archivo autoficcional'],
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
    role: 'Autoficción (Quirón) · Intérprete natural en pantalla',
    bio: 'Tania llegó al proyecto desde la autoficción y revelo una presencia genuina, vulnerable y precisa frente a cámara. Su participación en Quirón abrió una grieta luminosa para volver la historia mas humana.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/tania.jpg',
  },
];
const CINE_BLOG_KEYS = ['copycats', 'cine', 'miniversocine'];
const CINE_BLOG_KEY_SET = new Set(CINE_BLOG_KEYS.map((key) => key.trim().toLowerCase()));



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando imágenes donde lo que sentimos encuentra eco en otras miradas."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalCine = () => {
  const { user } = useAuth();
  usePortalTracking('cine');
  const { question: vitranaQuestion } = useVitranaQuestion('cine');
  const titleDisplay = useScrambleText('El lente');
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestCineReading, setLatestCineReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}').l1); } catch { return false; } });
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const [isPrecareVisible, setIsPrecareVisible] = useState(false);
  const [isQuironOverlayVisible, setIsQuironOverlayVisible] = useState(false);
  const [quironSignedUrl, setQuironSignedUrl] = useState('');
  const [isQuironUnlocking, setIsQuironUnlocking] = useState(false);
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false
  );
  const quironVideoRef = useRef(null);
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:cine') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    const t = window.setTimeout(() => setIsResonanceOpen(true), 150);
    return () => window.clearTimeout(t);
  }, []);
  const readingTooltipRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = (e) => setIsPortrait(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isQuironOverlayVisible) return undefined;
    const block = (e) => {
      const key = String(e.key || '').toLowerCase();
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(key))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', block);
    return () => window.removeEventListener('keydown', block);
  }, [isQuironOverlayVisible]);

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

  const handleCloseResonanceLoginNudge = useCallback(() => {
    setShowResonanceLoginNudge(false);
  }, []);

  const handleConfirmResonanceLogin = useCallback(() => {
    setShowResonanceLoginNudge(false);
    setShowLoginOverlay(true);
  }, []);

  const handleAnswerResonance = useCallback(() => {
    if (isAuthenticated) {
      setIsResonanceOpen(true);
      return;
    }
    setShowResonanceLoginNudge(true);
  }, [isAuthenticated]);

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
    setIsPrecareVisible(true);
  }, [requireAuth]);

  const handleConfirmPrecare = useCallback(async () => {
    setIsPrecareVisible(false);
    setIsQuironUnlocking(true);
    try {
      const { data, error } = await supabase.storage
        .from('Cine - teasers')
        .createSignedUrl('Quiron_10min.mp4', 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error('Sin URL firmada');
      setQuironSignedUrl(data.signedUrl);
      setIsQuironOverlayVisible(true);
    } catch (err) {
      console.error('[PortalCine] No se pudo firmar el cortometraje:', err);
      window.open(QUIRON_DATA.fullUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsQuironUnlocking(false);
    }
  }, []);


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


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
            {showLoginHint ? (
              <div className="rounded-xl border border-sky-300/60 bg-sky-500/10 px-3 py-2 text-xs text-sky-100 shadow-[0_10px_30px_rgba(56,189,248,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-sky-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
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
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-sky-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
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

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                  <h4 className="font-display text-xl question-heading-voice">Resonancia colectiva</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('cine', l2Answer) ?? LEVEL2_QUESTIONS['cine']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="cine"
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
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={CINE_NOTA_AUTORAL.title} verse={CINE_NOTA_AUTORAL.verse} palette={CINE_TILE} effect="flip" gatEventKey="flip:nota-autoral:cine" />
              </div>
              <CollaboratorsPanel collaborators={CINE_COLLABORATORS} accentClassName="text-sky-200/90" bare />
            </div>
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => { setIsResonanceOpen(false); refreshL1(); }}
                question={vitranaQuestion}
                portal="cine"
                onOpenNarrative={handleOpenFullFilm}
                narrativeCTALabel="✦ Ver el corto"
              />
            )}
          </div>


          {/* Reel Card: Obra destacada + Resonancia */}
          <div className="lg:order-2 overflow-hidden rounded-2xl border border-white/10">
            <div className="relative min-h-[30rem] overflow-hidden">
              <video
                ref={(el) => { if (el) { el.play().catch(() => {}); } }}
                src={QUIRON_DATA.teaserUrl}
                className="absolute inset-0 h-full w-full cursor-pointer object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                controls={isMobileViewport ? canUseInlinePlayback(`${QUIRON_DATA.title}-${QUIRON_DATA.teaserUrl}`) : false}
                onClick={(event) => { void handleImmersiveVideoActivate(event, `${QUIRON_DATA.title}-${QUIRON_DATA.teaserUrl}`); }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.14)_35%,rgba(0,0,0,0.72)_100%)]" />
              <div className="absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.35em] text-slate-300/75">Obra destacada</p>
                  <h4 className="font-display text-2xl text-slate-100">{QUIRON_DATA.title}</h4>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-100 backdrop-blur-md">
                  <Video size={16} />
                </span>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-3">
                <p className="text-sm text-slate-200/90 leading-relaxed">{QUIRON_DATA.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100 backdrop-blur-sm">Incluye dispositivo interactivo</span>
                </div>
              </div>
            </div>
            <div className={`bg-slate-950/80 p-5 lg:hidden transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
              <div className="mb-1">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                <h4 className="font-display text-xl question-heading-voice">Resonancia colectiva</h4>
              </div>
              <div className="space-y-4">
                <VitranaQuestionReveal
                  question={l1Done ? (buildL1Acknowledgment('cine', l2Answer) ?? LEVEL2_QUESTIONS['cine']?.question ?? vitranaQuestion) : vitranaQuestion}
                  buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                  autoReveal={l1Done}
                  portal="cine"
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

          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={CINE_COLLABORATORS} accentClassName="text-sky-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={CINE_NOTA_AUTORAL.title} verse={CINE_NOTA_AUTORAL.verse} palette={CINE_TILE} effect="flip" gatEventKey="flip:nota-autoral:cine" />
            </div>
          </div>
          <div className="order-4"><IAInsightCard {...CINE_IA_PROFILE} compact /></div>
          {l3Rec?.step3 ? (
            <div className="order-5">
              <PortalL3RewardCTA portal="cine" l3Rec={l3Rec} />
            </div>
          ) : experienceDone ? (
            <div className="order-5">
              <button
                type="button"
                onClick={handleOpenFullFilm}
                className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
              >
                ✦ Ver cortometraje ahora
              </button>
            </div>
          ) : null}
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <LoginNudgeOverlay
          open={showResonanceLoginNudge}
          onClose={handleCloseResonanceLoginNudge}
          onLogin={handleConfirmResonanceLogin}
          title="¿Te gustaría iniciar sesión para responder?"
          description="Puedes seguir explorando este universo libremente. Para dejar tu propia resonancia y que forme parte del diálogo colectivo, necesitas iniciar sesión."
          titleId="resonance-login-nudge-title"
        />
        {isPrecareVisible && typeof document !== 'undefined' && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[490] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none">
            <div className="absolute inset-0 bg-black/92 backdrop-blur-md" onClick={() => setIsPrecareVisible(false)} />
            <div className="relative z-10 my-8 w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-white/10 bg-slate-950/90 p-8 text-center shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Antes de continuar</p>
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10">
                  <RotateCcw size={22} className="text-sky-300 animate-spin-slow" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-sky-300/80">Mejor en horizontal</p>
              </div>
              <p className="mt-4 text-sm text-slate-300/85 leading-relaxed">
                Una vez desbloqueado, el cortometraje se habilita una vez; con una huella activada puedes volver cuando quieras. ¿Quieres continuar?
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleConfirmPrecare}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-500/80 px-6 py-3 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-400"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrecareVisible(false)}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {isQuironUnlocking && typeof document !== 'undefined' && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[492] flex flex-col items-center justify-center bg-black/95">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Preparando el cortometraje…</p>
          </div>,
          document.body
        )}

        {isQuironOverlayVisible && quironSignedUrl && typeof document !== 'undefined' && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[495] bg-black">
            <video
              ref={quironVideoRef}
              src={quironSignedUrl}
              className="h-full w-full object-contain"
              controls
              autoPlay
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              onEnded={() => { setIsQuironOverlayVisible(false); setQuironSignedUrl(''); }}
            />
            <button
              type="button"
              onClick={() => { setIsQuironOverlayVisible(false); setQuironSignedUrl(''); }}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Cerrar cortometraje"
            >
              <X size={18} />
            </button>
            {isPortrait && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm">
                <RotateCcw size={40} className="text-white/80 animate-spin-slow" style={{ animationDuration: '3s' }} />
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Gira tu teléfono</p>
                <p className="text-xs text-slate-500">para ver el cortometraje</p>
              </div>
            )}
          </div>,
          document.body
        )}
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
