import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation , useNavigate } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import LoginNudgeOverlay from '@/components/LoginNudgeOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import CollaboratorsPanel from '@/components/portal/CollaboratorsPanel';
import MiniversoSonoroPreview from '@/components/miniversos/sonoro/MiniversoSonoroPreview';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import PortalL3RewardCTA from '@/components/portal/PortalL3RewardCTA';
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
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';

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
  verse: 'Abri los ojos.\nLa resonancia era antigua...\ncomo el silencio.',
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



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando atmósferas donde las emociones pueden respirarse en colectivo."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalSonoridades = () => {
  const { user } = useAuth();
  usePortalTracking('sonoridades');
  const { question: vitranaQuestion } = useVitranaQuestion('sonoridades');
  const titleDisplay = useScrambleText('El eco');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestSonoridadesReading, setLatestSonoridadesReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}').l1); } catch { return false; } });
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:sonoridades') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
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
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
            {showLoginHint ? (
              <div className="rounded-xl border border-cyan-300/60 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-cyan-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
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
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{SONORIDADES_INTRO}</p>
                  <p>{SONORIDADES_BODY}</p>
                  <p className="text-slate-100/90">{SONORIDADES_CLOSE}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200/35 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">Diseño sonoro</span>
                  <span className="rounded-full border border-cyan-200/35 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">Sueño en capas</span>
                  <span className="rounded-full border border-cyan-200/35 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-100">Mezcla original</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                  <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('sonoridades', l2Answer) ?? LEVEL2_QUESTIONS['sonoridades']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="sonoridades"
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
                <MiniVersoCard title={SONORIDADES_NOTA_AUTORAL.title} verse={SONORIDADES_NOTA_AUTORAL.verse} palette={SONORIDADES_TILE} effect="flip" gatEventKey="flip:nota-autoral:sonoridades" />
              </div>
              <CollaboratorsPanel collaborators={SONORIDADES_COLLABORATORS} accentClassName="text-cyan-200/90" bare />
            </div>
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => { setIsResonanceOpen(false); refreshL1(); }}
                question={vitranaQuestion}
                portal="sonoridades"
                onOpenNarrative={handleOpenTrack}
                narrativeCTALabel="✦ Escuchar ahora"
              />
            )}
          </div>


          <div className="lg:order-2 space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-cyan-900/30 p-6 lg:p-8">
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
                variant="outline"
                className="w-full sm:w-auto border-cyan-300/40 text-cyan-200 hover:bg-cyan-500/10"
                onClick={handleOpenCommunityComposer}
              >
                Compartir vibracion
              </Button>
            </div>
          </div>

          <div className="lg:order-2 space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
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
          <div className={`lg:hidden rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
            <div className="mb-1">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
              <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
            </div>
            <VitranaQuestionReveal
              question={l1Done ? (buildL1Acknowledgment('sonoridades', l2Answer) ?? LEVEL2_QUESTIONS['sonoridades']?.question ?? vitranaQuestion) : vitranaQuestion}
              buttonLabel={l1Done ? 'Tu progreso →' : undefined}
              autoReveal={l1Done}
              portal="sonoridades"
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
          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={SONORIDADES_COLLABORATORS} accentClassName="text-cyan-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={SONORIDADES_NOTA_AUTORAL.title} verse={SONORIDADES_NOTA_AUTORAL.verse} palette={SONORIDADES_TILE} effect="flip" gatEventKey="flip:nota-autoral:sonoridades" />
            </div>
          </div>
          <div className="order-4"><IAInsightCard {...SONORIDADES_IA_PROFILE} compact /></div>
          {l3Rec?.step3 ? (
            <div className="order-5">
              <PortalL3RewardCTA portal="sonoridades" l3Rec={l3Rec} />
            </div>
          ) : experienceDone ? (
            <div className="order-5">
              <button
                type="button"
                onClick={handleOpenTrack}
                className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
              >
                ✦ Entrar a la experiencia sonora
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
