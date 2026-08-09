import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import RelatedReadingTooltipButton from '@/components/portal/RelatedReadingTooltipButton';
import VitranaQuestionReveal from '@/components/portal/VitranaQuestionReveal';
import ResonanceModal, { LEVEL2_QUESTIONS, buildL1Acknowledgment } from '@/components/portal/ResonanceModal';
import VideoNarrativeAutoplay from '@/components/VideoNarrativeAutoplay';
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
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import PortalL3RewardCTA from '@/components/portal/PortalL3RewardCTA';
import { ensureAnonId } from '@/lib/identity';

const OBRA_API_URL = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');
const JUEGOS_PROTOCOL_VERSION = 1;
const JUEGOS_ENTRY_SOURCE = 'portal_iframe';
const JUEGOS_RESONANCE_KEY = 'gatoencerrado:resonance:juegos';

const compactGameCompletion = (payload) => {
  const summary = payload?.summary && typeof payload.summary === 'object'
    ? payload.summary
    : (payload?.acta?.summary && typeof payload.acta.summary === 'object' ? payload.acta.summary : {});
  const provenance = payload?.acta?.provenance && typeof payload.acta.provenance === 'object'
    ? payload.acta.provenance
    : {};
  const finiteNumber = (value) => (Number.isFinite(value) ? value : null);
  const shortString = (value) => (typeof value === 'string' && value ? value.slice(0, 120) : null);

  return Object.fromEntries(Object.entries({
    outcome: shortString(payload?.outcome),
    disposition: shortString(payload?.disposition),
    movement_count: finiteNumber(summary.movement_count),
    boo_count: finiteNumber(summary.boo_count),
    replacement_count: finiteNumber(summary.replacement_count),
    accepted_phrase_count: finiteNumber(summary.accepted_phrase_count),
    round_count: finiteNumber(summary.round_count),
    duration_ms: finiteNumber(summary.duration_ms),
    completed_at: shortString(payload?.completed_at || summary.completed_at),
    app_version: shortString(payload?.app_version || provenance.app_version),
    event_count: finiteNumber(provenance.event_count),
    synced_event_count: finiteNumber(provenance.synced_event_count),
  }).filter(([, value]) => value !== null));
};

const JUEGOS_DEFINITION = showcaseDefinitions.apps ?? {};
const JUEGOS_TILE = {
  ...MINIVERSO_TILE_COLORS.apps,
  gradient: MINIVERSO_TILE_GRADIENTS.apps,
};
const JUEGOS_BLOG_KEYS = ['apps', 'juegos', 'miniversoapps', 'miniverso_apps', 'miniverso-apps'];
const JUEGOS_BLOG_KEY_SET = new Set(JUEGOS_BLOG_KEYS.map((key) => key.trim().toLowerCase()));



const ShowcaseReactionInline = ({ status, onReact }) => (
  <PulseReactionCard
    status={status}
    onReact={onReact}
    description="Estamos creando decisiones donde lo que sentimos cambia la forma de avanzar."
    buttonLabel="¡Déjanos un pulso!"
  />
);

const PortalJuegos = () => {
  const { user, session } = useAuth();
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
  const [l2Answer, setL2Answer] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').l2_option ?? null; } catch { return null; } });
  const [experienceDone, setExperienceDone] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').experience_ts); } catch { return false; } });
  const [l2Done, setL2Done] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').l2_option); } catch { return false; } });
  const [l3Rec, setL3Rec] = useState(() => { try { return JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}').l3_recommendation ?? null; } catch { return null; } });
  const [gameLaunched, setGameLaunched] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(JUEGOS_RESONANCE_KEY) || '{}');
      return Boolean(stored.l1 && stored.l2_option && stored.l2_narrative_opened && !stored.experience_ts);
    } catch {
      return false;
    }
  });
  const [gameLaunchStatus, setGameLaunchStatus] = useState('idle');
  const [gameLaunchError, setGameLaunchError] = useState(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const iframeRef = useRef(null);
  const launchSessionRef = useRef(null);
  const launchRequestRef = useRef(null);
  const launchRequestIdRef = useRef(null);
  const completedPartidaRef = useRef(null);
  const refreshL1 = useCallback(() => { try { const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}'); setL1Done(Boolean(s.l1)); setExperienceDone(Boolean(s.experience_ts)); setL2Done(Boolean(s.l2_option)); setL2Answer(s.l2_option ?? null); setL3Rec(s.l3_recommendation ?? null); } catch { /* ignore */ } }, []);
  const handleLaunchEmbeddedGame = useCallback(() => {
    if (completedPartidaRef.current) {
      launchSessionRef.current = null;
      launchRequestIdRef.current = null;
      completedPartidaRef.current = null;
      setGameLaunchStatus('idle');
      setGameLaunchError(null);
      setIframeReloadKey((value) => value + 1);
    }
    try {
      const stored = JSON.parse(localStorage.getItem(JUEGOS_RESONANCE_KEY) || '{}');
      if (!stored.l1 || !stored.l2_option) {
        setIsResonanceOpen(true);
        return;
      }
      localStorage.setItem(JUEGOS_RESONANCE_KEY, JSON.stringify({
        ...stored,
        l2_narrative_opened: true,
      }));
    } catch {
      setIsResonanceOpen(true);
      return;
    }
    refreshL1();
    setGameLaunched(true);
  }, [refreshL1]);
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
      const key = 'gatoencerrado:resonance:juegos';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...existing, video_seen: true }));
    } catch {}
  }, []);

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
      const s = JSON.parse(localStorage.getItem('gatoencerrado:resonance:juegos') || '{}');
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
      const key = 'gatoencerrado:resonance:juegos';
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
  const embeddedAppOrigin = useMemo(() => {
    if (!embeddedAppUrl) return null;
    try {
      return new URL(embeddedAppUrl).origin;
    } catch {
      return null;
    }
  }, [embeddedAppUrl]);
  const requestGameReady = useCallback(() => {
    if (!embeddedAppOrigin || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'gato:juegos:hello',
      version: JUEGOS_PROTOCOL_VERSION,
    }, embeddedAppOrigin);
  }, [embeddedAppOrigin]);

  const createGameLaunchSession = useCallback(async (reportedAppVersion) => {
    if (launchSessionRef.current) return launchSessionRef.current;
    if (launchRequestRef.current) return launchRequestRef.current;

    const anonId = ensureAnonId();
    if (!anonId) throw new Error('No se pudo crear una identidad anónima para la partida.');

    const appVersion = typeof reportedAppVersion === 'string' && reportedAppVersion.trim()
      ? reportedAppVersion.trim().slice(0, 120)
      : (import.meta.env.VITE_JUEGOS_APP_VERSION || 'unknown');

    const request = (async () => {
      setGameLaunchStatus('connecting');
      setGameLaunchError(null);

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (!launchRequestIdRef.current) {
        launchRequestIdRef.current = typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `portal-juegos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      headers['X-Idempotency-Key'] = launchRequestIdRef.current;
      const accessToken = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const requestBody = JSON.stringify({
        anon_id: anonId,
        entry_source: JUEGOS_ENTRY_SOURCE,
        app_version: appVersion,
        protocol_version: String(JUEGOS_PROTOCOL_VERSION),
      });
      let response;
      let data = {};
      for (let attempt = 0; attempt < 3; attempt += 1) {
        response = await fetch(`${OBRA_API_URL}/api/juegos/partidas`, {
          method: 'POST',
          headers,
          body: requestBody,
        });
        data = await response.json().catch(() => ({}));
        if (response.status !== 409 || attempt === 2) break;
        await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)));
      }
      if (!response.ok) {
        throw new Error(data?.error || `No se pudo iniciar la partida (${response.status}).`);
      }
      if (!data?.partida_id || !data?.session_token || !data?.context_snapshot) {
        throw new Error('La sesión de juego llegó incompleta.');
      }

      const launchSession = {
        partida_id: data.partida_id,
        session_token: data.session_token,
        context_snapshot: data.context_snapshot,
        gat_condition: data.gat_condition ?? null,
      };
      launchSessionRef.current = launchSession;
      setGameLaunchStatus('ready');
      return launchSession;
    })();

    launchRequestRef.current = request;
    try {
      return await request;
    } finally {
      launchRequestRef.current = null;
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!gameLaunched || !l1Done || !l2Done || !embeddedAppOrigin) return undefined;

    const postLaunch = (targetWindow, launchSession) => {
      targetWindow?.postMessage({
        type: 'gato:juegos:launch',
        version: JUEGOS_PROTOCOL_VERSION,
        payload: {
          partida_id: launchSession.partida_id,
          session_token: launchSession.session_token,
          context_snapshot: launchSession.context_snapshot,
          entry_source: JUEGOS_ENTRY_SOURCE,
          api_base_url: OBRA_API_URL,
          gat_condition: launchSession.gat_condition,
        },
      }, embeddedAppOrigin);
    };

    const handleGameMessage = async (event) => {
      if (event.origin !== embeddedAppOrigin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.version !== JUEGOS_PROTOCOL_VERSION) return;

      if (event.data.type === 'gato:juegos:ready') {
        try {
          const launchSession = await createGameLaunchSession(event.data.payload?.app_version);
          if (event.source !== iframeRef.current?.contentWindow) return;
          postLaunch(event.source, launchSession);
        } catch (error) {
          console.error('[PortalJuegos] No se pudo crear la sesión de juego:', error);
          setGameLaunchStatus('error');
          setGameLaunchError(error?.message || 'No pudimos preparar la partida.');
        }
        return;
      }

      if (event.data.type !== 'gato:juegos:completed') return;
      const payload = event.data.payload;
      const activeSession = launchSessionRef.current;
      if (!payload || typeof payload !== 'object') return;
      if (!activeSession || payload.partida_id !== activeSession.partida_id) return;
      if (completedPartidaRef.current === payload.partida_id) return;

      completedPartidaRef.current = payload.partida_id;
      const completedAt = Date.now();
      const gameSummary = compactGameCompletion(payload);
      try {
        const existing = JSON.parse(localStorage.getItem(JUEGOS_RESONANCE_KEY) || '{}');
        localStorage.setItem(JUEGOS_RESONANCE_KEY, JSON.stringify({
          ...existing,
          l2_narrative_opened: true,
          experience_ts: completedAt,
          game_partida_id: payload.partida_id,
          game_summary: gameSummary,
          game_pending_sync: payload.pending_sync === true,
        }));
      } catch (error) {
        console.warn('[PortalJuegos] No se pudo guardar la finalización local:', error);
      }

      setGameLaunchStatus('completed');
      setGameLaunched(false);
      refreshL1();
      setIsResonanceOpen(true);
      window.dispatchEvent(new CustomEvent('gatoencerrado:juegos:completed', {
        detail: {
          partidaId: payload.partida_id,
          outcome: payload.outcome ?? null,
          pendingSync: payload.pending_sync === true,
          summary: gameSummary,
        },
      }));
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [createGameLaunchSession, embeddedAppOrigin, gameLaunched, iframeReloadKey, l1Done, l2Done, refreshL1]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* <PortalAuthButton onOpenLogin={handleOpenLogin} /> */}
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
            <div className="grid gap-6 p-4 sm:p-6 lg:p-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <div className="flex min-w-0 items-center gap-4">
                  <MiniverseIconBadge formatId="apps" />
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">#Miniversos</p>
                    <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{titleDisplay}</h3>
                  </div>
                </div>
                <div className="space-y-4 text-lg text-slate-200/85 leading-relaxed font-light">
                  {JUEGOS_DEFINITION.introNode ?? JUEGOS_DEFINITION.intro}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia Colectiva</p>
                  <h4 className="font-display text-xl question-heading-voice">Tras cada pregunta</h4>
                </div>
                <div className="flex flex-col gap-5">
                  <VitranaQuestionReveal
                    question={l1Done ? (buildL1Acknowledgment('juegos', l2Answer) ?? LEVEL2_QUESTIONS['juegos']?.question ?? vitranaQuestion) : vitranaQuestion}
                    buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                    autoReveal={l1Done}
                    portal="juegos"
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
            <VideoNarrativeAutoplay
              open={showResonanceBridgeVideo}
              formatId="apps"
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
                portal="juegos"
                onOpenNarrative={embeddedAppUrl ? handleLaunchEmbeddedGame : undefined}
                narrativeCTALabel={JUEGOS_DEFINITION.liveExperience?.ctaLabel || '✦ Abrir la app'}
              />
            )}
            <div className="lg:hidden px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
                <MiniVersoCard title={JUEGOS_DEFINITION.cartaTitle} verse={JUEGOS_DEFINITION.notaAutoral} palette={JUEGOS_TILE} effect="flip" gatEventKey="flip:nota-autoral:juegos" />
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
                {gameLaunched && l1Done && l2Done ? (
                  <iframe
                    key={iframeReloadKey}
                    ref={iframeRef}
                    src={embeddedAppUrl}
                    title={JUEGOS_DEFINITION.liveExperience?.title || 'App de Juegos'}
                    className="block h-[72vh] min-h-[520px] w-full bg-white"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; fullscreen; gamepad; gyroscope; microphone; web-share"
                    onLoad={requestGameReady}
                  />
                ) : (
                  <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 py-12 text-center">
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Antes de entrar</p>
                    <p className="max-w-xl font-display text-2xl leading-snug text-white">
                      {l1Done && l2Done
                        ? (experienceDone
                            ? 'Tu partida quedó registrada. Puedes volver a entrar y abrir otro recorrido.'
                            : 'Tu intuición y tu expectativa ya están listas. Ahora sí: entra a decidir.')
                        : 'Deja primero una intuición y una expectativa. El juego las llevará consigo sin mostrarlas en la URL.'}
                    </p>
                    <button
                      type="button"
                      onClick={l1Done && l2Done ? handleLaunchEmbeddedGame : handleAnswerResonance}
                      className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-6 py-3 text-sm font-semibold tracking-wide text-emerald-100 transition hover:bg-emerald-500/25"
                    >
                      {l1Done && l2Done
                        ? (experienceDone ? 'Jugar otra partida →' : 'Entrar al juego →')
                        : 'Responder antes de entrar →'}
                    </button>
                  </div>
                )}
              </div>
              {gameLaunchStatus === 'connecting' ? (
                <p className="text-xs text-emerald-100/70" role="status">Preparando una partida vinculada a tu recorrido…</p>
              ) : null}
              {gameLaunchStatus === 'error' ? (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-100" role="alert">
                  <span>{gameLaunchError || 'No pudimos preparar la partida.'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGameLaunchError(null);
                      setGameLaunchStatus('idle');
                      setIframeReloadKey((value) => value + 1);
                    }}
                    className="rounded-full border border-rose-200/30 px-3 py-1 font-semibold transition hover:bg-rose-200/10"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}
              <div className={`pt-4 border-t border-emerald-200/20 lg:hidden space-y-4 transition-opacity duration-300${isResonanceOpen ? ' opacity-30 pointer-events-none' : ''}`}>
                <div className="mb-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Resonancia Colectiva</p>
                  <h4 className="font-display text-xl question-heading-voice">Tras cada pregunta</h4>
                </div>
                <VitranaQuestionReveal
                  question={l1Done ? (buildL1Acknowledgment('juegos', l2Answer) ?? LEVEL2_QUESTIONS['juegos']?.question ?? vitranaQuestion) : vitranaQuestion}
                  buttonLabel={l1Done ? 'Tu progreso →' : undefined}
                  autoReveal={l1Done}
                  portal="juegos"
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
          ) : null}

          <div className="hidden lg:block lg:order-3 rounded-3xl border border-white/10 bg-black/30 p-6 space-y-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Mini-verso autoral</p>
              <MiniVersoCard
                title={JUEGOS_DEFINITION.cartaTitle}
                verse={JUEGOS_DEFINITION.notaAutoral}
                palette={JUEGOS_TILE}
                effect="flip"
                gatEventKey="flip:nota-autoral:juegos"
              />
            </div>
          </div>
          {JUEGOS_DEFINITION.iaProfile ? <div className="order-4"><IAInsightCard {...JUEGOS_DEFINITION.iaProfile} compact /></div> : null}
          {l3Rec?.step3 ? (
            <div className="order-5">
              <PortalL3RewardCTA portal="juegos" l3Rec={l3Rec} />
            </div>
          ) : experienceDone && embeddedAppUrl ? (
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
          initialCategoryId="apps"
        />
      </div>
    </div>
  );
};

export default PortalJuegos;
