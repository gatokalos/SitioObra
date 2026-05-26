import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation , useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import MiniVersoCard from '@/components/transmedia/MiniVersoCard';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
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
import LiteraturaAppOverlay from '@/components/novela/LiteraturaAppOverlay';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { startDirectMerchCheckout } from '@/lib/merchCheckout';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';


const LITERATURA_NOTA_AUTORAL = {
  title: '#LaPreguntaInsiste',
  verse: 'Escribí para entender\ny la página me abrió otra pregunta.',
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
  eyebrow: 'OBRA DESTACADA',
  title: 'Mi Gato Encerrado',
  description: 'Leer este libro es algo parecido a despertar dentro de un libro.\n\n Una experiencia de autoficción expandida donde la escritura continúa lo que el escenario no alcanza a decir.',
  image: '/assets/edicion-fisica.png',
  snippetTitle: 'Tu ejemplar como portal',
  snippetText:
    'Escanea la contraportada para acceder al separador inteligente de #GatoEncerrado o ingresa desde aquí.',
};
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
    description="Estamos creando relatos donde una emoción puede reconocerse en otra persona."
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
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    const t = window.setTimeout(() => setIsResonanceOpen(true), 150);
    return () => window.clearTimeout(t);
  }, []);
  const [isNovelaCheckoutLoading, setIsNovelaCheckoutLoading] = useState(false);
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

  const handleOpenNovelaCheckout = useCallback(async () => {
    if (!requireAuth()) return;
    if (isNovelaCheckoutLoading) return;

    setIsNovelaCheckoutLoading(true);
    try {
      await startDirectMerchCheckout({
        packageId: 'novela-400',
        customerEmail: user?.email ?? '',
        metadata: {
          source: 'portal-literatura',
          package: 'novela-400',
        },
      });
    } catch (error) {
      console.error('[PortalLiteratura] Checkout error:', error);
      toast({ description: 'No pudimos abrir el checkout. Intenta nuevamente.' });
    } finally {
      setIsNovelaCheckoutLoading(false);
    }
  }, [isNovelaCheckoutLoading, requireAuth, user?.email]);

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
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-violet-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestLiteraturaReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestLiteraturaReading.slug}
                  authorLabel={literaturaReadingAuthorLabel}
                  thumbnailUrl={literaturaReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Literatura"
                  tone="cyan"
                />
              </div>
            ) : null}
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-violet-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-3 leading-relaxed font-light">
                  <p className="text-base leading-relaxed text-slate-300/90">En este miniverso literario se entiende la escritura como <strong>una forma de expansión</strong>.</p>
                  <p className="text-base leading-relaxed text-slate-200/80">No es un complemento de la obra escénica, sino un espacio propio donde fragmentos, voces, poemas y apuntes <em>dialogan entre sí</em> y amplían el universo #GatoEncerrado.</p>
                  <p className="text-lg leading-relaxed font-medium text-white">Hay palabras que no explican: solo acompañan.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Autoficción expandida</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Fragmentos y voces</span>
                  <span className="rounded-full border border-violet-200/35 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-violet-100">Escritura que acompaña</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                  <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
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
                    onAnswer={() => setIsResonanceOpen(true)}
                    label=""
                  />
                  <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
                </div>
              </div>
            </div>
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={LITERATURA_NOTA_AUTORAL.title} verse={LITERATURA_NOTA_AUTORAL.verse} palette={LITERATURA_TILE} effect="flip" gatEventKey="flip:nota-autoral:literatura" />
              </div>
              <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" bare />
            </div>
            {isResonanceOpen && (
              <ResonanceModal
                open={isResonanceOpen}
                onClose={() => { setIsResonanceOpen(false); refreshL1(); }}
                question={vitranaQuestion}
                portal="literatura"
                onOpenNarrative={() => setShowLiteraturaApp(true)}
                narrativeCTALabel="📖 Activar artefacto"
              />
            )}
          </div>


          <div className="lg:order-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
              <img
                src={LITERATURA_ENTRY.image}
                alt={LITERATURA_ENTRY.title}
                className="w-full h-52 sm:h-64 object-cover"
                loading="lazy"
              />
              <div className="px-6 pt-5 pb-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">{LITERATURA_ENTRY.eyebrow}</p>
                  <h5 className="font-display text-xl text-slate-100">{LITERATURA_ENTRY.title}</h5>
                  <p className="text-sm text-slate-300/80 leading-relaxed">Una novela escrita tras bajar el telón.

                  El autor escribe desde la memoria de una puesta en escena fragmentada, lúcida, especulativa. Esta obra atraviesa lo real y lo imaginado sin pretender cerrar nada.</p>
                  <p className="mt-3 text-sm italic text-slate-200/85 leading-relaxed">Leer este libro es algo parecido a despertar dentro de un libro.</p>
                  <p className="text-right text-xs text-slate-400/50 mt-0.5 tracking-wide">— Carlos A Pérez H.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{LITERATURA_ENTRY.snippetTitle}</p>
                    <QrCode size={16} className="shrink-0 text-purple-300/60" />
                  </div>
                  <p className="text-sm text-slate-200/90 leading-relaxed">{LITERATURA_ENTRY.snippetText}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleOpenNovelaCheckout}
                    disabled={isNovelaCheckoutLoading}
                    className="inline-flex w-full items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
                  >
                    {isNovelaCheckoutLoading ? 'Abriendo checkout...' : 'Comprar edición física'}
                  </button>
                </div>
                <div className={`pt-4 border-t border-white/10 lg:hidden space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
                  <div className="mb-1">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Formas de habitar</p>
                    <h4 className="font-display text-xl text-amber-300">Resonancia colectiva</h4>
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
                    onAnswer={() => setIsResonanceOpen(true)}
                    label=""
                  />
                  <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
                </div>
              </div>
            </div>

  
          </div>
          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <CollaboratorsPanel collaborators={LITERATURA_COLLABORATORS} accentClassName="text-violet-200/90" />
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard title={LITERATURA_NOTA_AUTORAL.title} verse={LITERATURA_NOTA_AUTORAL.verse} palette={LITERATURA_TILE} effect="flip" gatEventKey="flip:nota-autoral:literatura" />
            </div>
          </div>
          <div className="order-4"><IAInsightCard {...LITERATURA_IA_PROFILE} compact /></div>
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
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="miniverso_novela"
        />
      </div>

      <LiteraturaAppOverlay
        open={showLiteraturaApp}
        onClose={() => setShowLiteraturaApp(false)}
      />
    </div>
  );
};

export default PortalLiteratura;
