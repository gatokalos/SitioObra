import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation , useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
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

const HashtagButton3D = lazy(() => import('@/components/HashtagButton3D'));

const ORACULO_TITLE = 'El espejo';
const ORACULO_INTRO =
  (
  <>
    Este miniverso existe para mirar lo que <strong>#GatoEncerrado</strong> despierta en ti.
    <br />
    A través de preguntas breves, el <strong>Oráculo</strong> abre un espacio para observar tus propias respuestas:
    emociones, intuiciones y pensamientos que aparecen después de la experiencia.
  
  </>
);
const ORACULO_TAGLINE =  (
  <>
    <strong>Aquí no se interpreta la mente.</strong>
    <br />
    Se aprende a <em>observar al observador</em>.
  </>
);
const ORACULO_SEED_NOTES = [
  'Las respuestas se almacenan como semillas de conocimiento simbólico.',
  'Enriquecen una base de datos viviente para literatura, IA personalizada y obra interactiva.',
  'Cada huella deja señal en la mente del Gato.',
];
const ORACULO_NOTA_AUTORAL = {
  title: '#CambiarSinCambiar',
  verse: 'Miré el espejo.\nNo dijo nada.\nÉramos dos... y no.',
};
const ORACULO_TILE = {
  gradient: 'linear-gradient(135deg, rgba(38,18,56,0.95), rgba(86,33,115,0.85), rgba(168,68,139,0.65))',
  border: 'rgba(216,180,254,0.42)',
  text: '#f5e8ff',
  accent: '#e9d5ff',
  background: 'rgba(38,18,56,0.72)',
};
const ORACULO_IA_PROFILE = {
  type: 'GPT-4o + embeddings simbólicos curados por la comunidad.',
  interaction: '1-3 reflexiones cortas por sesión; foro breve guiado.',
  tokensRange: '20-120 tokens por reflexion (promedio ~20 GAT).',
  coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
  footnote: 'El minado es simbólico y humano: no es financiero, es resonancia.',
};
const ORACULO_BLOG_KEYS = [
  'oraculo',
  'oracle',
  'miniverso-oraculo',
  'miniverso_oraculo',
  'miniversooraculo',
];
const ORACULO_BLOG_KEY_SET = new Set(ORACULO_BLOG_KEYS.map((key) => key.trim().toLowerCase()));



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando símbolos para explorar emociones que a veces no sabemos nombrar."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalOraculo = () => {
  const { user } = useAuth();
  usePortalTracking('oraculo');
  const { question: vitranaQuestion } = useVitranaQuestion('oraculo');
  const titleDisplay = useScrambleText(ORACULO_TITLE);
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestOraculoReading, setLatestOraculoReading] = useState(null);
  const [isReadingTooltipOpen, setIsReadingTooltipOpen] = useState(false);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}').l1); } catch { return false; } });
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:oraculo') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    const t = window.setTimeout(() => setIsResonanceOpen(true), 150);
    return () => window.clearTimeout(t);
  }, []);
  const readingTooltipRef = useRef(null);

  const oraculoUrl = useMemo(() => {
    const raw = import.meta.env.VITE_BIENVENIDA_URL ?? import.meta.env.VITE_ORACULO_URL ?? '';
    if (raw) return raw.replace(/\/+$/, '');
    return import.meta.env.DEV ? 'http://localhost:5174' : '';
  }, []);

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
    const loadLatestOraculoReading = async () => {
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
        console.warn('[PortalOraculo] No se pudo detectar lectura relacionada:', error);
        setLatestOraculoReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return ORACULO_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestOraculoReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestOraculoReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (latestOraculoReading?.slug) return;
    setIsReadingTooltipOpen(false);
  }, [latestOraculoReading?.slug]);

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

  const [isOraculoIframeOpen, setIsOraculoIframeOpen] = useState(false);

  const handleOpenOraculo = useCallback(() => {
    if (!requireAuth()) return;
    if (!oraculoUrl) {
      toast({
        description: 'Falta configurar la URL del Oráculo (VITE_BIENVENIDA_URL o VITE_ORACULO_URL).',
      });
      return;
    }
    setIsOraculoIframeOpen(true);
  }, [oraculoUrl, requireAuth]);

  const handleCloseOraculoIframe = useCallback(() => setIsOraculoIframeOpen(false), []);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'oraculo', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const oraculoReadingAuthorLabel = (latestOraculoReading?.author || '').trim() || 'autor invitado';
  const oraculoReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestOraculoReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.image_url) ||
    sanitizeExternalHttpUrl(latestOraculoReading?.author_avatar_url) ||
    null;

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
            {showLoginHint ? (
              <div className="rounded-xl border border-violet-300/60 bg-violet-500/10 px-3 py-2 text-xs text-violet-100 shadow-[0_10px_30px_rgba(139,92,246,0.25)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/35 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestOraculoReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestOraculoReading.slug}
                  authorLabel={oraculoReadingAuthorLabel}
                  thumbnailUrl={oraculoReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Oráculo"
                  tone="violet"
                />
              </div>
            ) : null}
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-3 text-lg text-slate-200/85 leading-relaxed font-light">
                  <p>{ORACULO_INTRO}</p>
                  <p className="text-violet-200/90">{ORACULO_TAGLINE}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Ritual simbólico</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Pregunta abierta</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Huella viviente</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                  <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('oraculo', l2Answer) ?? LEVEL2_QUESTIONS['oraculo']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="oraculo"
                    l2Done={l2Done}
                    l3Done={Boolean(l3Rec?.step3)}
                    l3Step3={l3Rec?.step3 ?? null}
                    l3FormaLabel={l3Rec?.forma ?? null}
                    onL3CTA={() => { const r = resolvePortalRoute({ formatId: l3Rec?.recommended_format_id }); if (r) navigate(r); }}
                    onAnswer={() => setIsResonanceOpen(true)}
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
                portal="oraculo"
                onOpenNarrative={handleOpenOraculo}
                narrativeCTALabel="✦ Mintear ahora"
              />
            )}
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={ORACULO_NOTA_AUTORAL.title} verse={ORACULO_NOTA_AUTORAL.verse} palette={ORACULO_TILE} effect="flip" gatEventKey="flip:nota-autoral:oraculo" />
              </div>
            </div>
          </div>

          <div className="lg:order-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Semillas de conocimiento</p>
              <ul className="space-y-2 text-sm text-slate-300/85 leading-relaxed">
                {ORACULO_SEED_NOTES.map((seed, index) => (
                  <li key={`oraculo-seed-${index}`} className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-1 text-amber-200" />
                    <span>{seed}</span>
                  </li>
                ))}
              </ul>
              <Suspense fallback={<div style={{ height: 200 }} />}>
                <HashtagButton3D
                  onClick={handleOpenOraculo}
                  height="200px"
                  style={{ width: '190px', margin: '0 auto' }}
                />
              </Suspense>
            </div>
          </div>

          <div className={`lg:hidden rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
            <div className="mb-1">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
              <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
            </div>
            <VitranaQuestionReveal
              question={l1Done ? (buildL1Acknowledgment('oraculo', l2Answer) ?? LEVEL2_QUESTIONS['oraculo']?.question ?? vitranaQuestion) : vitranaQuestion}
              buttonLabel={l1Done ? 'Tu progreso →' : undefined}
              autoReveal={l1Done}
              portal="oraculo"
              l2Done={l2Done}
              l3Done={Boolean(l3Rec?.step3)}
              l3Step3={l3Rec?.step3 ?? null}
              l3FormaLabel={l3Rec?.forma ?? null}
              onL3CTA={() => { const r = resolvePortalRoute({ formatId: l3Rec?.recommended_format_id }); if (r) navigate(r); }}
              onAnswer={() => setIsResonanceOpen(true)}
              label=""
            />
            <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
          </div>

          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard
                title={ORACULO_NOTA_AUTORAL.title}
                verse={ORACULO_NOTA_AUTORAL.verse}
                palette={ORACULO_TILE}
              />
            </div>
          </div>
          <div className="order-4"><IAInsightCard {...ORACULO_IA_PROFILE} compact /></div>
          {l3Rec?.step3 ? (
            <div className="order-5">
              <PortalL3RewardCTA portal="oraculo" l3Rec={l3Rec} />
            </div>
          ) : experienceDone ? (
            <div className="order-5">
              <button
                type="button"
                onClick={handleOpenOraculo}
                className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
              >
                ✦ Pregunta, responde y mintea
              </button>
            </div>
          ) : null}
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="oraculo"
        />
      </div>
    </div>

    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {isOraculoIframeOpen ? (
          <motion.div
            key="oraculo-portal-iframe"
            className="fixed inset-0 z-[170] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOraculoIframe}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Oráculo interactivo"
              className="relative z-10 my-6 w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Oráculo en vivo</p>
                  <h3 className="font-display text-2xl text-slate-100">Demo completa</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {oraculoUrl ? (
                    <a
                      href={oraculoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseOraculoIframe}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="h-[72vh] bg-black">
                {oraculoUrl ? (
                  <iframe
                    title="Oráculo interactivo"
                    src={oraculoUrl}
                    className="h-full w-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; accelerometer; gyroscope; magnetometer; microphone; camera"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    URL del Oráculo no configurada.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )}
    </>
  );
};

export default PortalOraculo;
