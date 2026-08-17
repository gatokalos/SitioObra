import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation , useNavigate } from 'react-router-dom';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import MiniverseIconBadge from '@/components/transmedia/MiniverseIconBadge';
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
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
import PulseReactionCard from '@/components/portal/PulseReactionCard';
import LiteraturaAppOverlay from '@/components/novela/LiteraturaAppOverlay';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';


const LITERATURA_NOTA_AUTORAL = {
  title: '#Literatura',
  verse: 'Escribí para entender\ny la página\nme abrió otra pregunta.',
};
const LITERATURA_TILE = {
  gradient: 'linear-gradient(135deg, rgba(26,24,60,0.95), rgba(59,43,95,0.85), rgba(108,56,118,0.7))',
  border: 'rgba(196,181,253,0.38)',
  text: '#ede9fe',
  accent: '#ddd6fe',
  background: 'rgba(26,24,60,0.74)',
};
const LITERATURA_IA_PROFILE = {
  type: 'GPT-4o mini + voz sintética para fragmentos.',
  interaction: 'Guía de lectura y acompañamiento breve por capítulo.',
  tokensRange: '150-320 tokens por fragmento leído.',
  coverage: 'Cubierto por suscriptores; lectura sin costo adicional.',
  footnote: 'La IA susurra; la historia sigue siendo tuya.',
};
const LITERATURA_COLLABORATORS = [
  {
    id: 'pepe-rojo',
    name: 'Pepe Rojo',
    role: 'Escritor y crítico cultural',
    bio: 'Acompañó la literatura de este miniverso con una lectura precisa y generosa. Su intervención dio claridad y ruta al futuro de la obra.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/peperojo.jpeg',
  },
  {
    id: 'groppe-imprenta',
    name: 'Groppe Libros',
    role: 'Edición física',
    bio: 'Acompañó la primera edición física de Mi Gato Encerrado con oficio paciente y preciso, dando cuerpo de libro a este universo.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/groppelibros.png',
  },
];
const LITERATURA_ENTRY = {
  eyebrow: 'Obra destacada',
  title: 'Mi Gato Encerrado',
  description: 'Leer este libro es algo parecido a despertar dentro de un libro.\n\n Una experiencia de autoficción expandida donde la escritura continúa lo que el escenario no alcanza a decir.',
  image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/ObraDestacadaLiteratura_pingpong.mp4',
};

function LiteraturaEntryCopy() {
  return (
    <>
      <p className="text-sm text-slate-200/90 leading-relaxed"><strong>Una novela de autoficción </strong> que se despliega entre lo real y lo imaginado, dejando que el lector complete la historia desde su propia experiencia en torno a una <em>supuesta</em> puesta en escena.</p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-violet-400/30 bg-violet-900/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-violet-100">Incluye artefacto interactivo</span>
      </div>
    </>
  );
}

const LITERATURA_BLOG_KEYS = [
  'miniversonovela',
  'novela',
  'literatura',
  'miniverso_novela',
  'miniverso-novela',
];
const LITERATURA_BLOG_KEY_SET = new Set(LITERATURA_BLOG_KEYS.map((key) => key.trim().toLowerCase()));



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    title="¡Déjanos un pulso!"
    description="Alguien cuenta cuántas miradas llegaron hasta aquí…"
    successMessage="Gracias por tu pulso en este miniverso."
    status={status}
    onReact={onReact}
  />
);

const PortalLiteratura = () => {
  const { user } = useAuth();
  usePortalTracking('literatura');
  const { question: vitranaQuestion } = useVitranaQuestion('literatura');
  const titleDisplay = useScrambleText('La escritura');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestLiteraturaReading, setLatestLiteraturaReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}').l1); } catch { return false; } });
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
  const [showLiteraturaApp, setShowLiteraturaApp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Resonancia Colectiva ya no se auto-abre al llegar del video narrativo
  // (decisión 2026-08-07: se sentía intrusivo — el usuario debe encontrarla
  // por sí mismo). Lo que sí se conserva es la señal "ya vio el video de
  // este miniverso" — "Intuye tu respuesta" la usa como puente: si no lo
  // vio, se lo ofrece antes de abrir la pregunta.
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    try {
      const key = 'gatoencerrado:resonance:literatura';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...existing, video_seen: true }));
    } catch {}
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

  // Puente: si no ha visto el video narrativo de este miniverso, se lo
  // ofrece antes de abrir la pregunta (decisión 2026-08-07 — Resonancia
  // Colectiva ya no se auto-abre sola; ahora "Intuye tu respuesta" decide).
  const [showResonanceBridgeVideo, setShowResonanceBridgeVideo] = useState(false);
  const handleAnswerResonance = useCallback(() => {
    let videoSeen = false;
    try {
      const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:literatura') || '{}');
      videoSeen = Boolean(s.video_seen);
    } catch {}
    if (videoSeen) {
      setIsResonanceOpen(true);
    } else {
      setShowResonanceBridgeVideo(true);
    }
  }, []);
  const handleBridgeVideoContinue = useCallback(() => {
    try {
      const key = 'gatoencerrado:resonance:literatura';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...existing, video_seen: true }));
    } catch {}
    setShowResonanceBridgeVideo(false);
    setIsResonanceOpen(true);
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
    const loadLatestLiteraturaReading = async () => {
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
        console.warn('[PortalLiteratura] No se pudo detectar lectura relacionada:', error);
        setLatestLiteraturaReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return LITERATURA_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestLiteraturaReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestLiteraturaReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestLiteraturaReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestLiteraturaReading?.slug]);

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

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'miniversoNovela', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const literaturaReadingAuthorLabel = (latestLiteraturaReading?.author || '').trim() || 'autor invitado';
  const literaturaReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestLiteraturaReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.image_url) ||
    sanitizeExternalHttpUrl(latestLiteraturaReading?.author_avatar_url) ||
    null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
            {showLoginHint ? (
              <div className="rounded-xl border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <div className="hidden lg:block">
            <PortalHeaderActions />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="absolute top-4 right-4 z-10">
              <RelatedReadingTooltipButton
                slug={latestLiteraturaReading?.slug}
                authorLabel={literaturaReadingAuthorLabel}
                thumbnailUrl={literaturaReadingThumbnailUrl}
                ariaLabel="Mostrar lectura relacionada de Literatura"
                tone="cyan"
                miniversoLabel="La escritura"
              />
            </div>
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="flex min-w-0 items-center gap-4">
                  <MiniverseIconBadge formatId="miniversoNovela" />
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-violet-300">Literatura</p>
                    <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                  </div>
                </div>
                <div className="space-y-3 leading-relaxed font-light">
                  <p className="text-lg leading-relaxed font-medium text-white mt-4">Aquí te encuentras en un lugar que no termina de decirse.</p>
                  <p className="text-base leading-relaxed text-slate-200/80">A diferencia de <em>la apariencia</em>, que ocurre toda al mismo tiempo, la escritura necesita más tiempo para existir detrás de cada palabra — y seguirá exigiéndolo incluso después del punto final.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Autoficción expandida</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Fragmentos y voces</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Escritura que acompaña</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia Colectiva</p>
                  <h4 className="font-display text-xl question-heading-voice">Tras cada pregunta</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('literatura', l2Answer) ?? LEVEL2_QUESTIONS['literatura']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="literatura"
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
            <div className={`lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
              <div className="mb-1">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia Colectiva</p>
                <h4 className="font-display text-xl question-heading-voice">Tras cada pregunta</h4>
              </div>
              <VitranaQuestionReveal
                question={l1Done ? (buildL1Acknowledgment('literatura', l2Answer) ?? LEVEL2_QUESTIONS['literatura']?.question ?? vitranaQuestion) : vitranaQuestion}
                buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                autoReveal={l1Done}
                portal="literatura"
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
            <VideoNarrativeAutoplay
              open={showResonanceBridgeVideo}
              formatId="miniversoNovela"
              isMobileViewport={typeof window !== 'undefined' && window.innerWidth < 1024}
              onClose={() => setShowResonanceBridgeVideo(false)}
              onNavigate={handleBridgeVideoContinue}
            />
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => { setIsResonanceOpen(false); refreshL1(); }}
                onRequireLogin={() => setShowResonanceLoginNudge(true)}
                question={vitranaQuestion}
                portal="literatura"
                onOpenNarrative={() => setShowLiteraturaApp(true)}
                narrativeCTALabel="📖 Activar artefacto"
              />
            )}
          </div>


          <div className="lg:order-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
              <div className="relative min-h-[30rem] overflow-hidden">
                {/\.mp4($|\?)/i.test(LITERATURA_ENTRY.image) ? (
                  <video
                    ref={(el) => { if (el) { el.play().catch(() => {}); } }}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={LITERATURA_ENTRY.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={LITERATURA_ENTRY.image}
                    alt={LITERATURA_ENTRY.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />
                <div className="absolute top-0 left-0 right-0 p-5">
                  <p className="mb-1 text-xs uppercase tracking-[0.35em] text-slate-300/75">{LITERATURA_ENTRY.eyebrow}</p>
                  <h5 className="font-display text-xl text-slate-100">{LITERATURA_ENTRY.title}</h5>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                  <LiteraturaEntryCopy />
                </div>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-4">
                <div className="lg:hidden">
                  <IAInsightCard
                    {...LITERATURA_IA_PROFILE}
                    title="Información del artefacto"
                    compact
                  />
                </div>
                <div className="pt-4 border-t border-white/10 lg:hidden space-y-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Verso fundacional</p>
                    <MiniVersoCard title={LITERATURA_NOTA_AUTORAL.title} verse={LITERATURA_NOTA_AUTORAL.verse} palette={LITERATURA_TILE} effect="flip" gatEventKey="flip:nota-autoral:literatura" />
                  </div>
                  <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" bare />
                </div>
              </div>
            </div>

  
          </div>
          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Verso fundacional</p>
              <MiniVersoCard title={LITERATURA_NOTA_AUTORAL.title} verse={LITERATURA_NOTA_AUTORAL.verse} palette={LITERATURA_TILE} effect="flip" gatEventKey="flip:nota-autoral:literatura" />
            </div>
          </div>
          <div className="order-4 hidden lg:block">
            <IAInsightCard
              {...LITERATURA_IA_PROFILE}
              title="Información del artefacto"
              compact
            />
          </div>
          {l3Rec?.step3 ? (
            <div className="order-5">
              <PortalL3RewardCTA portal="literatura" l3Rec={l3Rec} />
            </div>
          ) : experienceDone ? (
            <div className="order-5">
              <button
                type="button"
                onClick={() => setShowLiteraturaApp(true)}
                className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
              >
                📖 Abrir separador inteligente
              </button>
            </div>
          ) : null}
          <div className="order-last flex justify-end pt-2 lg:hidden">
            <PortalHeaderActions />
          </div>
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <LoginNudgeOverlay
          open={showResonanceLoginNudge}
          onClose={handleCloseResonanceLoginNudge}
          onLogin={handleConfirmResonanceLogin}
          title="¿Te gustaría iniciar sesión para continuar?"
          description="Ya viviste esta experiencia libremente. Para seguir explorando el siguiente miniverso recomendado, necesitas iniciar sesión."
          titleId="resonance-login-nudge-title"
        />
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="miniverso_novela"
        />
      </div>

      <LiteraturaAppOverlay
        open={showLiteraturaApp}
        onRequireLogin={handleOpenLogin}
        onClose={(sessionContext) => {
          setShowLiteraturaApp(false);
          // Marca la experiencia como vivida (dispara la conversación del
          // Reseñador en ResonanceModal) solo si el usuario llegó a "Iniciar
          // debate" dentro del artefacto — es lo único que produce fragment_id.
          // Cerrar el overlay sin eso (incluida una carga fallida del iframe)
          // no cuenta como experiencia: si no, el Reseñador arranca el Turno 1
          // sin párrafo ni plano y termina citando la intuición de L1 como si
          // fuera parte de una lectura que nunca ocurrió.
          if (sessionContext?.fragment_id) {
            try {
              const key = 'gatoencerrado:resonance:literatura';
              const existing = JSON.parse(localStorage.getItem(key) || '{}');
              localStorage.setItem(key, JSON.stringify({
                ...existing,
                experience_ts: existing.experience_ts ?? Date.now(),
                l2_fragment_id: sessionContext.fragment_id,
                ...(sessionContext.plano ? { l2_plano: sessionContext.plano } : {}),
                ...(sessionContext.initiator ? { l2_initiator: sessionContext.initiator } : {}),
              }));
            } catch { /* ignore */ }
          }
          refreshL1();
          setIsResonanceOpen(true);
        }}
      />
    </div>
  );
};

export default PortalLiteratura;
