import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import ContributionModal from '@/components/ContributionModal';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import IAInsightCard from '@/components/IAInsightCard';
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import ResonanceModal, { LEVEL2_QUESTIONS } from '@/components/portal/ResonanceModal';
import PulseReactionCard from '@/components/portal/PulseReactionCard';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeExternalHttpUrl } from '@/lib/urlSafety';
import { hasEnoughGAT } from '@/lib/gatAccess';
import { usePortalTracking } from '@/hooks/usePortalTracking';
import { useVitranaQuestion } from '@/hooks/useVitranaQuestion';
import useScrambleText from '@/hooks/useScrambleText';
import {
  MINIVERSO_TILE_COLORS,
  MINIVERSO_TILE_GRADIENTS,
  showcaseDefinitions,
} from '@/components/transmedia/transmediaConstants';

const JUEGOS_DEFINITION = showcaseDefinitions.apps ?? {};
const JUEGOS_TILE = {
  ...MINIVERSO_TILE_COLORS.apps,
  gradient: MINIVERSO_TILE_GRADIENTS.apps,
};
const JUEGOS_BLOG_KEYS = ['apps', 'juegos', 'miniversoapps', 'miniverso_apps', 'miniverso-apps'];
const JUEGOS_BLOG_KEY_SET = new Set(JUEGOS_BLOG_KEYS.map((key) => key.trim().toLowerCase()));

const MiniVersoCard = ({ title, verse, palette }) => {
  const [isActive, setIsActive] = useState(() => {
    try { return window.localStorage.getItem('gatoencerrado:miniverso-verso:' + title) === '1'; } catch { return false; }
  });
  const reveal = () => setIsActive((prev) => {
    if (prev) return prev;
    try { window.localStorage.setItem('gatoencerrado:miniverso-verso:' + title, '1'); } catch {}
    return true;
  });

  return (
    <div className="relative [perspective:1200px]" onClick={reveal}>
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
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando decisiones donde lo que sentimos cambia la forma de avanzar."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalJuegos = () => {
  const { user } = useAuth();
  usePortalTracking('juegos');
  const { question: vitranaQuestion } = useVitranaQuestion('juegos');
  const titleDisplay = useScrambleText(JUEGOS_DEFINITION.label || 'Juegos');
  const isAuthenticated = Boolean(user);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [latestJuegosReading, setLatestJuegosReading] = useState(null);
  const [reactionStatus, setReactionStatus] = useState('idle');
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isResonanceOpen, setIsResonanceOpen] = useState(false);
  const [l1Done, setL1Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').l1); } catch { return false; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').l2_option); } catch { return false; } });
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); } catch { /* ignore */ } }, []);
  const location = useLocation();
  useEffect(() => {
    if (location.state?.portalLaunchSource !== 'video-narrative-cta') return;
    const t = window.setTimeout(() => setIsResonanceOpen(true), 150);
    return () => window.clearTimeout(t);
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
    const loadLatestJuegosReading = async () => {
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
        console.warn('[PortalJuegos] No se pudo detectar lectura relacionada:', error);
        setLatestJuegosReading(null);
        return;
      }

      const firstMatch =
        Array.isArray(data) && data.length
          ? data.find((post) => {
              const key = String(post?.miniverso || '').trim().toLowerCase();
              return JUEGOS_BLOG_KEY_SET.has(key);
            }) ?? null
          : null;
      setLatestJuegosReading(firstMatch?.slug ? firstMatch : null);
    };

    loadLatestJuegosReading();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleOpenCommunityComposer = useCallback(() => {
    if (!requireAuth()) return;
    setIsContributionOpen(true);
  }, [requireAuth]);

  const handleSendPulse = useCallback(async () => {
    if (!requireAuth()) return;
    if (reactionStatus === 'loading') return;

    setReactionStatus('loading');
    const { success } = await recordShowcaseLike({ showcaseId: 'apps', user });
    if (success) {
      setReactionStatus('success');
    } else {
      setReactionStatus('idle');
    }
  }, [reactionStatus, requireAuth, user]);

  const juegosReadingAuthorLabel = (latestJuegosReading?.author || '').trim() || 'autor invitado';
  const juegosReadingThumbnailUrl =
    sanitizeExternalHttpUrl(latestJuegosReading?.featured_image_url) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.cover_image) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.image_url) ||
    sanitizeExternalHttpUrl(latestJuegosReading?.author_avatar_url) ||
    null;
  const embeddedAppUrl = sanitizeExternalHttpUrl(JUEGOS_DEFINITION.liveExperience?.url);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                Inicia sesion para continuar. Usa el boton de arriba.
              </div>
            ) : null}
          </div>
          <PortalHeaderActions />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 [transform:translateZ(0)] bg-gradient-to-br from-slate-900/85 via-black/60 to-emerald-900/25 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            {latestJuegosReading?.slug ? (
              <div className="absolute top-4 right-4 z-10">
                <RelatedReadingTooltipButton
                  slug={latestJuegosReading.slug}
                  authorLabel={juegosReadingAuthorLabel}
                  thumbnailUrl={juegosReadingThumbnailUrl}
                  ariaLabel="Mostrar lectura relacionada de Juegos"
                  tone="cyan"
                />
              </div>
            ) : null}
            <div className="grid gap-10 p-6 sm:p-8 lg:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">#Miniversos</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  {JUEGOS_DEFINITION.introNode ?? JUEGOS_DEFINITION.intro}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia colectiva</p>
                  <h4 className="font-display text-xl text-amber-300">Formas de sentir</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (LEVEL2_QUESTIONS['juegos']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="juegos"
                    l2Done={l2Done}
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
                portal="juegos"
                onOpenNarrative={embeddedAppUrl ? () => window.open(embeddedAppUrl, '_blank') : undefined}
                narrativeCTALabel={JUEGOS_DEFINITION.liveExperience?.ctaLabel || '✦ Abrir la app'}
              />
            )}
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={JUEGOS_DEFINITION.cartaTitle} verse={JUEGOS_DEFINITION.notaAutoral} palette={JUEGOS_TILE} />
              </div>
            </div>
          </div>

          {embeddedAppUrl ? (
            <div className="lg:order-2 rounded-3xl border border-emerald-200/20 bg-black/30 p-4 sm:p-5 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/75">Experiencia incrustada</p>
                  <h4 className="font-display text-xl text-slate-100">
                    {JUEGOS_DEFINITION.liveExperience?.title || 'App en vivo'}
                  </h4>
                  {JUEGOS_DEFINITION.liveExperience?.description ? (
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-300/85">
                      {JUEGOS_DEFINITION.liveExperience.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-emerald-200/20 bg-slate-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <iframe
                  src={embeddedAppUrl}
                  title={JUEGOS_DEFINITION.liveExperience?.title || 'App de Juegos'}
                  className="block h-[72vh] min-h-[520px] w-full bg-white"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; fullscreen; gamepad; gyroscope; microphone; web-share"
                />
              </div>
              <div className={`pt-4 border-t border-emerald-200/20 lg:hidden space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
                <div className="mb-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia colectiva</p>
                  <h4 className="font-display text-xl text-amber-300">Formas de sentir</h4>
                </div>
                <VitranaQuestionReveal
                  question={l1Done ? (LEVEL2_QUESTIONS['juegos']?.question ?? vitranaQuestion) : vitranaQuestion}
                  buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                  autoReveal={l1Done}
                  portal="juegos"
                  l2Done={l2Done}
                  onAnswer={() => setIsResonanceOpen(true)}
                  label=""
                />
                <ShowcaseReactionInline status={reactionStatus} onReact={handleSendPulse} />
              </div>
            </div>
          ) : null}

          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard
                title={JUEGOS_DEFINITION.cartaTitle}
                verse={JUEGOS_DEFINITION.notaAutoral}
                palette={JUEGOS_TILE}
              />
            </div>
          </div>
          {JUEGOS_DEFINITION.iaProfile ? <div className="order-4"><IAInsightCard {...JUEGOS_DEFINITION.iaProfile} compact /></div> : null}
          {experienceDone && embeddedAppUrl ? (
            <div className="order-5">
              <a
                href={embeddedAppUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/10 px-6 py-4 text-sm font-semibold tracking-wide text-amber-200 shadow-[0_8px_32px_rgba(251,191,36,0.15)] transition hover:bg-amber-500/20 hover:shadow-[0_8px_40px_rgba(251,191,36,0.25)]"
              >
                ✦ {JUEGOS_DEFINITION.liveExperience?.ctaLabel || 'Abrir app en pestaña nueva'}
              </a>
            </div>
          ) : null}
        </div>

        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
        <ContributionModal
          open={isContributionOpen}
          onClose={() => setIsContributionOpen(false)}
          initialCategoryId="apps"
        />
      </div>
    </div>
  );
};

export default PortalJuegos;
