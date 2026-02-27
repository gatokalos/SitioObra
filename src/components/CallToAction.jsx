// SitioObra/src/components/CallToAction.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Drama, HeartHandshake, Mail, MessageCircle, Palette, PawPrint, Smartphone, Ticket, Volume2, VolumeX } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import HuellaEmbeddedCheckout from '@/components/HuellaEmbeddedCheckout';
import { createEmbeddedSubscription, startCheckoutFallback } from '@/lib/huellaCheckout';
import { clearBienvenidaFlowGoal, clearBienvenidaForceOnLogin } from '@/lib/bienvenida';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

const SUBSCRIPTION_PRICE_ID = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
const SESSIONS_PER_SUB = 6;
const THERAPY_TRAMO_HUELLAS = 17; // 1-17
const RESIDENCY_TRAMO_HUELLAS = 51; // 3 residencias x 17 huellas
const SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS = 375; // 5 escuelas x 75 huellas
const EXPANSION_START = RESIDENCY_TRAMO_HUELLAS + SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS; // 426
const EXPANSION_START_COPY = EXPANSION_START + 1; // 427
const ANNUAL_TOTAL_HUELLAS = EXPANSION_START;
const AFTERCARE_AUDIO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/FX_folleys/wah_Payasito_HITS.cm-St.m4a';
const IMPACT_SYNC_MEDIA_QUERY =
  '(min-width: 1024px), ((min-width: 768px) and (orientation: landscape))';
const SYNCABLE_BAR_KEYS = new Set(['terapias', 'residencias', 'implementacionEscuelas']);
const SUPPORT_EMAIL = 'contacto@gatoencerrado.ai';
const SUPPORT_WHATSAPP = '+523315327985';
const SUPPORT_MESSAGE =
  'Hola,%20asistí%20a%20la%20obra%20y%20quiero%20sumar%20mi%20boleto%20como%20huella.%20Adjunto%20comprobante%20(o%20selfie)%20y%20cuántas%20personas%20fuimos.%20Gracias.';
const SUPPORT_CTA_VIDEO_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/CTAs/CTA_boleto_pingpong_blur.mp4';
const SUPPORT_CTA_POSTER_URL =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/CTAs/cta-boleto-poster.jpg';
const SHOULD_PREVIEW_AFTERCARE =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('aftercare') === '1';
const COUNTER_SOUND_MILESTONES = new Set([17, 51, EXPANSION_START]);
const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatFirstHuellaDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return null;
  }
}

function deriveImpactStats(totalSupport) {
  const tramoTerapias = Math.min(Math.max(totalSupport, 0), THERAPY_TRAMO_HUELLAS);
  const tramoResidencias = Math.min(Math.max(totalSupport, 0), RESIDENCY_TRAMO_HUELLAS);
  const tramoImplementacionEscuelas = Math.min(
    Math.max(totalSupport - RESIDENCY_TRAMO_HUELLAS, 0),
    SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS
  );
  const tramoExpansion = Math.max(totalSupport - EXPANSION_START, 0);
  const reinversion = tramoExpansion;
  const residenciasHitosActivos = Math.floor(tramoResidencias / 17);
  const appsHitosActivos = Math.floor(tramoImplementacionEscuelas / 75);

  return {
    totalSupport,
    totalSupportClamped: Math.min(totalSupport, ANNUAL_TOTAL_HUELLAS),
    annualFaltan: Math.max(ANNUAL_TOTAL_HUELLAS - totalSupport, 0),
    annualProg: (Math.min(totalSupport, ANNUAL_TOTAL_HUELLAS) / ANNUAL_TOTAL_HUELLAS) * 100,
    sesiones: tramoTerapias * SESSIONS_PER_SUB,
    terapiasActual: tramoTerapias,
    terapiasMeta: THERAPY_TRAMO_HUELLAS,
    terapiasFaltan: Math.max(THERAPY_TRAMO_HUELLAS - tramoTerapias, 0),
    terapiasProg: (tramoTerapias / THERAPY_TRAMO_HUELLAS) * 100,
    residenciasActual: tramoResidencias,
    residenciasMeta: RESIDENCY_TRAMO_HUELLAS,
    residenciasFaltan: Math.max(RESIDENCY_TRAMO_HUELLAS - tramoResidencias, 0),
    residenciasProg: (tramoResidencias / RESIDENCY_TRAMO_HUELLAS) * 100,
    implementacionEscuelasActual: tramoImplementacionEscuelas,
    implementacionEscuelasMeta: SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS,
    implementacionEscuelasFaltan: Math.max(
      SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS - tramoImplementacionEscuelas,
      0
    ),
    implementacionEscuelasProg: (tramoImplementacionEscuelas / SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS) * 100,
    universosActual: tramoExpansion,
    universosMeta: null,
    universosFaltan: 0,
    universosProg: totalSupport >= EXPANSION_START ? 100 : (totalSupport / EXPANSION_START) * 100,
    residenciasHitosActivos,
    appsHitosActivos,
    reinversion,
  };
}

function ProgressBar({
  value,
  barClassName = 'bg-white/70',
  onPreviewChange,
  onRelease,
  maxValue = 100,
  currentValue = 0,
  milestones = [],
  isPreviewing = false,
  showUnlockMarker = false,
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  const barRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const activePointerIdRef = useRef(null);
  const DESKTOP_EDGE_SNAP_PX = 14;

  function emitValueFromClientX(clientX, options = {}) {
    const { desktopEdgeSnap = false } = options;
    if (!barRef.current || !onPreviewChange) return;
    const rect = barRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relativeX = clamp(clientX - rect.left, 0, rect.width);
    let ratio = relativeX / rect.width;
    if (desktopEdgeSnap && rect.width - relativeX <= DESKTOP_EDGE_SNAP_PX) {
      ratio = 1;
    }
    const normalizedX = ratio * rect.width;
    setHoverX(normalizedX);
    onPreviewChange(Math.round(ratio * maxValue));
  }

  useEffect(() => {
    if (!isDragging) return undefined;
    function handleMouseUp() {
      setIsDragging(false);
      activePointerIdRef.current = null;
      onRelease?.();
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, onRelease]);

  return (
    <div
      ref={barRef}
      role={onPreviewChange ? 'slider' : undefined}
      tabIndex={onPreviewChange ? 0 : -1}
      className={`relative w-full h-8 rounded-[4px] border border-white/15 bg-slate-900/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-10px_18px_rgba(0,0,0,0.35)] select-none ${onPreviewChange ? 'cursor-pointer' : 'cursor-default'}`}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        setIsDragging(true);
        emitValueFromClientX(event.clientX, { desktopEdgeSnap: true });
      }}
      onMouseMove={(event) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        setHoverX(clamp(event.clientX - rect.left, 0, rect.width));
        if (isDragging) emitValueFromClientX(event.clientX, { desktopEdgeSnap: true });
      }}
      onMouseEnter={(event) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        setHoverX(clamp(event.clientX - rect.left, 0, rect.width));
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isDragging) {
          if (barRef.current && hoverX >= barRef.current.getBoundingClientRect().width - DESKTOP_EDGE_SNAP_PX) {
            onPreviewChange?.(maxValue);
          }
          setIsDragging(false);
          onRelease?.();
        }
      }}
      onBlur={() => onRelease?.()}
      onPointerDown={(event) => {
        if (!onPreviewChange) return;
        if (event.pointerType === 'mouse') return;
        activePointerIdRef.current = event.pointerId;
        setIsDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        emitValueFromClientX(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!isDragging) return;
        if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
        emitValueFromClientX(event.clientX);
      }}
      onPointerUp={(event) => {
        if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
        activePointerIdRef.current = null;
        setIsDragging(false);
        onRelease?.();
      }}
      onPointerCancel={(event) => {
        if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return;
        activePointerIdRef.current = null;
        setIsDragging(false);
        onRelease?.();
      }}
      style={{ touchAction: onPreviewChange ? 'none' : 'auto' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
      {milestones.map((milestone) => {
        const left = `${(milestone / maxValue) * 100}%`;
        const active = currentValue >= milestone;
        return (
          <div
            key={milestone}
            className={`absolute top-1/2 h-3 -translate-y-1/2 -translate-x-1/2 w-[2px] ${active ? 'bg-white/90' : 'bg-white/30'}`}
            style={{ left }}
          />
        );
      })}
      <div
        className={`relative h-full rounded-[2px] transition-[width] ${isPreviewing ? 'duration-150' : 'duration-700'} ease-out shadow-[0_0_18px_rgba(255,255,255,0.24)] ${barClassName}`}
        style={{ width: `${safeValue}%` }}
      />
      {showUnlockMarker && safeValue <= 3 ? (
        <div
          className="absolute left-[4px] top-1/2 h-5 w-2 -translate-y-1/2 rounded-[2px] bg-white/85 shadow-[0_0_12px_rgba(255,255,255,0.95)]"
          aria-hidden="true"
        />
      ) : null}
      {safeValue > 3 ? (
        <div
          className="absolute top-1/2 h-5 w-2 -translate-y-1/2 rounded-[2px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{ left: `calc(${safeValue}% - 4px)` }}
        />
      ) : null}
      {isHovering && onPreviewChange ? (
        <PawPrint
          size={14}
          className="absolute -top-4 -translate-x-1/2 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none"
          style={{ left: hoverX }}
        />
      ) : null}
    </div>
  );
}

const CallToAction = ({ barsIntroDelayMs = 0 }) => {
  const { user } = useAuth();
  const embeddedCheckoutRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [pendingFallbackPayload, setPendingFallbackPayload] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [localCheckoutLock, setLocalCheckoutLock] = useState(false);
  const [firstHuellaAt, setFirstHuellaAt] = useState(null);
  const [showTicketSupport, setShowTicketSupport] = useState(false);
  const [subs, setSubs] = useState(0);
  const [ticketUnits, setTicketUnits] = useState(0);
  const [canFetchStats, setCanFetchStats] = useState(Boolean(import.meta.env.VITE_API_URL));
  const [barValues, setBarValues] = useState({
    terapias: 0,
    residencias: 0,
    implementacionEscuelas: 0,
    universos: 0,
  });
  const [interactiveSupport, setInteractiveSupport] = useState(null);
  const [showAftercareOverlay, setShowAftercareOverlay] = useState(false);
  const [aftercareVariant, setAftercareVariant] = useState('expansion');
  const [isTicketSupportVideoAvailable, setIsTicketSupportVideoAvailable] = useState(true);
  const [isCounterSoundEnabled, setIsCounterSoundEnabled] = useState(false);
  const [isLoginPulseActive, setIsLoginPulseActive] = useState(false);
  const hasRunBarSequenceRef = useRef(false);
  const aftercareTimeoutRef = useRef(null);
  const reachedExpansionRef = useRef(false);
  const aftercareAudioRef = useRef(null);
  const accordionPushTimeoutRef = useRef(null);
  const loginPulseTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const lastSupportForSoundRef = useRef(null);
  const impactPanelRef = useRef(null);
  const isImpactPanelInView = useInView(impactPanelRef, { once: true, amount: 0.35 });
  const prefersReducedMotion = useReducedMotion();
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  const metadataSubscriber = Boolean(
    user?.user_metadata?.isSubscriber === true ||
      user?.user_metadata?.isSubscriber === 'true' ||
      user?.user_metadata?.is_subscriber === true ||
      user?.user_metadata?.is_subscriber === 'true' ||
      user?.user_metadata?.subscription_status === 'active' ||
      user?.user_metadata?.subscription_status === 'trialing' ||
      user?.user_metadata?.stripe_subscription_status === 'active' ||
      user?.user_metadata?.stripe_subscription_status === 'trialing' ||
      user?.user_metadata?.plan === 'subscriber' ||
      user?.user_metadata?.tier === 'subscriber' ||
      user?.app_metadata?.subscription_status === 'active' ||
      user?.app_metadata?.subscription_status === 'trialing' ||
      user?.app_metadata?.stripe_subscription_status === 'active' ||
      user?.app_metadata?.stripe_subscription_status === 'trialing' ||
      user?.app_metadata?.roles?.includes?.('subscriber')
  );
  const metadataFirstHuellaAt =
    user?.user_metadata?.first_huella_at ??
    user?.user_metadata?.subscription_started_at ??
    user?.user_metadata?.stripe_subscription_created_at ??
    user?.app_metadata?.first_huella_at ??
    user?.app_metadata?.subscription_started_at ??
    user?.app_metadata?.stripe_subscription_created_at ??
    null;
  const firstHuellaDateLabel = formatFirstHuellaDate(firstHuellaAt ?? metadataFirstHuellaAt);
  const isSubscriber = metadataSubscriber || hasActiveSubscription || localCheckoutLock;

  // 1) Cargar suscriptores en tiempo real
  useEffect(() => {
    if (!import.meta.env.VITE_API_URL) {
      console.warn('VITE_API_URL no está definido, se omite la carga de stats de suscriptores.');
      return undefined;
    }

    if (!canFetchStats) return undefined;

    let active = true;
    async function fetchSubs() {
      try {
        const res = await apiFetch('/stats-suscriptores', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setSubs(Number(data?.total || 0));
      } catch (e) {
        console.error('Error stats/suscriptores', e);
        setCanFetchStats(false);
      }
    }
    fetchSubs();
    const id = setInterval(fetchSubs, 15000); // refresco cada 15s
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [canFetchStats]);

  useEffect(() => {
    let active = true;
    async function fetchTicketUnits() {
      try {
        const { data, error } = await supabase.functions.invoke('stats-boletos-destinados');
        if (error) {
          throw error;
        }
        if (!active) return;
        setTicketUnits(Number(data?.total || 0));
      } catch (e) {
        console.error('Error stats/boletos_destinados', e);
        if (active) {
          setTicketUnits(0);
        }
      }
    }
    fetchTicketUnits();
    const ticketId = setInterval(fetchTicketUnits, 20000);
    return () => {
      active = false;
      clearInterval(ticketId);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      setLocalCheckoutLock(false);
      setFirstHuellaAt(null);
      return undefined;
    }

    let isMounted = true;
    setIsCheckingSubscription(true);

    supabase
      .from('suscriptores')
      .select('id,status,created_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[CallToAction] No se pudo validar huella:', error);
          setHasActiveSubscription(false);
          return;
        }
        const hasSubscription = Array.isArray(data) && data.length > 0;
        setHasActiveSubscription(hasSubscription);
        if (hasSubscription) {
          setFirstHuellaAt(data[0]?.created_at ?? null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSubscription(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const pending = safeGetItem(LOGIN_RETURN_KEY);
    if (!pending) return;

    try {
      const parsed = JSON.parse(pending);
      const isHuellaLoginFlow =
        parsed?.anchor === '#cta' &&
        (parsed?.action === 'cta-huella-login' || parsed?.action === 'cta-huella-login-status');
      if (!isHuellaLoginFlow) return;

      safeRemoveItem(LOGIN_RETURN_KEY);
      setIsLoginPulseActive(false);

      window.setTimeout(() => {
        const target = document.getElementById('cta') || embeddedCheckoutRef.current;
        target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }, 80);

      if (!isSubscriber) {
        setCheckoutStatus('Sesión iniciada. Estás listo para activar tu huella aquí mismo.');
      }
    } catch {
      safeRemoveItem(LOGIN_RETURN_KEY);
    }
  }, [isSubscriber, user]);

  // 2) Cálculos de impacto
  const stats = useMemo(() => deriveImpactStats(subs + ticketUnits), [subs, ticketUnits]);
  const displayStats = interactiveSupport === null ? stats : deriveImpactStats(interactiveSupport);
  const displayBarValues =
    interactiveSupport === null
      ? barValues
      : {
          terapias: displayStats.terapiasProg,
          residencias: displayStats.residenciasProg,
          implementacionEscuelas: displayStats.implementacionEscuelasProg,
          universos: displayStats.universosProg,
        };

  const ensureCounterAudio = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioContextRef.current) {
      const context = new AudioCtx();
      const masterGain = context.createGain();
      masterGain.gain.value = 0.11;
      masterGain.connect(context.destination);
      audioContextRef.current = context;
      masterGainRef.current = masterGain;
    }

    const context = audioContextRef.current;
    if (context?.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        return null;
      }
    }
    return context;
  }, []);

  const playCounterTick = useCallback(async (direction = 1) => {
    const context = await ensureCounterAudio();
    const masterGain = masterGainRef.current;
    if (!context || !masterGain) return;

    const nowTick = context.currentTime;
    const baseFreq = direction >= 0 ? 642 : 598;

    const bodyOsc = context.createOscillator();
    const bodyGain = context.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(baseFreq, nowTick);
    bodyGain.gain.setValueAtTime(0.0001, nowTick);
    bodyGain.gain.exponentialRampToValueAtTime(0.058, nowTick + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, nowTick + 0.16);

    const shimmerOsc = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(baseFreq * 1.92, nowTick);
    shimmerGain.gain.setValueAtTime(0.0001, nowTick);
    shimmerGain.gain.exponentialRampToValueAtTime(0.018, nowTick + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, nowTick + 0.14);

    bodyOsc.connect(bodyGain);
    shimmerOsc.connect(shimmerGain);
    bodyGain.connect(masterGain);
    shimmerGain.connect(masterGain);

    bodyOsc.start(nowTick);
    shimmerOsc.start(nowTick);
    bodyOsc.stop(nowTick + 0.18);
    shimmerOsc.stop(nowTick + 0.16);
  }, [ensureCounterAudio]);

  const playMilestoneChime = useCallback(async () => {
    const context = await ensureCounterAudio();
    const masterGain = masterGainRef.current;
    if (!context || !masterGain) return;

    const nowChime = context.currentTime;
    const leadOsc = context.createOscillator();
    const leadGain = context.createGain();
    leadOsc.type = 'sine';
    leadOsc.frequency.setValueAtTime(986, nowChime);
    leadOsc.frequency.exponentialRampToValueAtTime(1320, nowChime + 0.12);
    leadGain.gain.setValueAtTime(0.0001, nowChime);
    leadGain.gain.exponentialRampToValueAtTime(0.07, nowChime + 0.016);
    leadGain.gain.exponentialRampToValueAtTime(0.0001, nowChime + 0.34);

    const tailOsc = context.createOscillator();
    const tailGain = context.createGain();
    tailOsc.type = 'triangle';
    tailOsc.frequency.setValueAtTime(740, nowChime);
    tailGain.gain.setValueAtTime(0.0001, nowChime);
    tailGain.gain.exponentialRampToValueAtTime(0.03, nowChime + 0.02);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, nowChime + 0.42);

    leadOsc.connect(leadGain);
    tailOsc.connect(tailGain);
    leadGain.connect(masterGain);
    tailGain.connect(masterGain);

    leadOsc.start(nowChime);
    tailOsc.start(nowChime + 0.02);
    leadOsc.stop(nowChime + 0.38);
    tailOsc.stop(nowChime + 0.48);
  }, [ensureCounterAudio]);

  function supportFromSlider(tramo, rawValue) {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return 0;
    if (tramo === 'terapias') return clamp(value, 0, THERAPY_TRAMO_HUELLAS);
    if (tramo === 'residencias') return clamp(value, 0, RESIDENCY_TRAMO_HUELLAS);
    if (tramo === 'implementacionEscuelas') {
      return RESIDENCY_TRAMO_HUELLAS + clamp(value, 0, SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS);
    }
    return clamp(value, 0, EXPANSION_START);
  }

  function handleSliderInput(tramo, value) {
    setInteractiveSupport(supportFromSlider(tramo, value));
  }

  useEffect(() => {
    const realValues = {
      terapias: stats.terapiasProg,
      residencias: stats.residenciasProg,
      implementacionEscuelas: stats.implementacionEscuelasProg,
      universos: stats.universosProg,
    };

    if (!isImpactPanelInView) return undefined;

    if (prefersReducedMotion) {
      setBarValues(realValues);
      hasRunBarSequenceRef.current = true;
      return undefined;
    }

    if (hasRunBarSequenceRef.current) {
      setBarValues(realValues);
      return undefined;
    }

    hasRunBarSequenceRef.current = true;
    const timeouts = [];
    const peakValues = {
      terapias: 88,
      residencias: 85,
      implementacionEscuelas: 79,
      universos: 76,
    };
    const keys = ['terapias', 'residencias', 'implementacionEscuelas', 'universos'];

    const settledDelay = Math.max(0, Number(barsIntroDelayMs) || 0);
    const kickoffId = window.setTimeout(() => {
      keys.forEach((key, index) => {
        const id = window.setTimeout(() => {
          setBarValues((prev) => ({ ...prev, [key]: peakValues[key] }));
        }, 120 * index);
        timeouts.push(id);
      });

      keys.forEach((key, index) => {
        const id = window.setTimeout(() => {
          setBarValues((prev) => ({ ...prev, [key]: realValues[key] }));
        }, 620 + 120 * index);
        timeouts.push(id);
      });
    }, settledDelay);
    timeouts.push(kickoffId);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [
    barsIntroDelayMs,
    isImpactPanelInView,
    prefersReducedMotion,
    stats.implementacionEscuelasProg,
    stats.terapiasProg,
    stats.residenciasProg,
    stats.universosProg,
  ]);

  useEffect(() => {
    if (!isCounterSoundEnabled) {
      lastSupportForSoundRef.current = displayStats.totalSupport;
      return;
    }
    if (interactiveSupport === null) {
      lastSupportForSoundRef.current = displayStats.totalSupport;
      return;
    }

    const previous = lastSupportForSoundRef.current;
    if (previous === null) {
      lastSupportForSoundRef.current = displayStats.totalSupport;
      return;
    }

    const current = displayStats.totalSupport;
    if (current === previous) return;

    const direction = current > previous ? 1 : -1;
    const distance = Math.abs(current - previous);
    const burstCount = Math.min(distance, 3);

    for (let step = 1; step <= burstCount; step += 1) {
      const virtualValue = previous + Math.round((distance * step) / burstCount) * direction;
      const delayMs = (step - 1) * 44;
      window.setTimeout(() => {
        playCounterTick(direction);
        if (COUNTER_SOUND_MILESTONES.has(virtualValue)) {
          playMilestoneChime();
        }
      }, delayMs);
    }

    lastSupportForSoundRef.current = current;
  }, [
    displayStats.totalSupport,
    interactiveSupport,
    isCounterSoundEnabled,
    playCounterTick,
    playMilestoneChime,
  ]);

  useEffect(() => {
    const reachedExpansion = displayStats.totalSupport >= EXPANSION_START;
    if (reachedExpansion && !reachedExpansionRef.current) {
      reachedExpansionRef.current = true;
      setAftercareVariant('expansion');
      fireConfetti();
      window.setTimeout(() => fireConfetti(), 260);
      if (aftercareTimeoutRef.current) {
        window.clearTimeout(aftercareTimeoutRef.current);
      }
      aftercareTimeoutRef.current = window.setTimeout(() => {
        setShowAftercareOverlay(true);
        aftercareTimeoutRef.current = null;
      }, 950);
    }
  }, [displayStats.totalSupport, fireConfetti]);

  useEffect(() => {
    return () => {
      if (aftercareTimeoutRef.current) {
        window.clearTimeout(aftercareTimeoutRef.current);
      }
      if (loginPulseTimeoutRef.current) {
        window.clearTimeout(loginPulseTimeoutRef.current);
      }
      if (aftercareAudioRef.current) {
        aftercareAudioRef.current.pause();
        aftercareAudioRef.current.src = '';
        aftercareAudioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      masterGainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!SHOULD_PREVIEW_AFTERCARE) return;
    setAftercareVariant('payment_success');
    setShowAftercareOverlay(true);
  }, []);

  useEffect(() => {
    if (!showAftercareOverlay || aftercareVariant !== 'expansion' || typeof window === 'undefined') return;
    let audio = aftercareAudioRef.current;
    if (!audio) {
      audio = new Audio(AFTERCARE_AUDIO_URL);
      audio.preload = 'auto';
      audio.volume = 0.82;
      aftercareAudioRef.current = audio;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [aftercareVariant, showAftercareOverlay]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia(IMPACT_SYNC_MEDIA_QUERY);
    const handleAccordionToggle = (event) => {
      if (!mediaQuery.matches) return;
      if (interactiveSupport !== null) return;

      const barKey = event?.detail?.barKey;
      if (!SYNCABLE_BAR_KEYS.has(barKey)) return;

      const realValues = {
        terapias: stats.terapiasProg,
        residencias: stats.residenciasProg,
        implementacionEscuelas: stats.implementacionEscuelasProg,
        universos: stats.universosProg,
      };
      const baseValue = realValues[barKey] ?? 0;
      const peakValue = Math.min(100, Math.max(baseValue + 16, baseValue < 70 ? 74 : baseValue + 9));

      if (accordionPushTimeoutRef.current) {
        window.clearTimeout(accordionPushTimeoutRef.current);
        accordionPushTimeoutRef.current = null;
      }

      setBarValues((prev) => ({ ...prev, [barKey]: peakValue }));
      accordionPushTimeoutRef.current = window.setTimeout(() => {
        setBarValues((prev) => ({ ...prev, [barKey]: realValues[barKey] ?? baseValue }));
        accordionPushTimeoutRef.current = null;
      }, 460);
    };

    window.addEventListener('gatoencerrado:impact-accordion-toggle', handleAccordionToggle);
    return () => {
      window.removeEventListener('gatoencerrado:impact-accordion-toggle', handleAccordionToggle);
      if (accordionPushTimeoutRef.current) {
        window.clearTimeout(accordionPushTimeoutRef.current);
        accordionPushTimeoutRef.current = null;
      }
    };
  }, [
    interactiveSupport,
    stats.implementacionEscuelasProg,
    stats.residenciasProg,
    stats.terapiasProg,
    stats.universosProg,
  ]);

  // 3) Checkout
  async function handleCheckout() {
    if (!SUBSCRIPTION_PRICE_ID) {
      setCheckoutStatus('Configura VITE_STRIPE_SUBSCRIPTION_PRICE_ID antes de continuar.');
      return;
    }

    if (!user) {
      // Paso umbral preservado para uso futuro desde otro punto del sitio:
      // setBienvenidaFlowGoal('subscription');
      // setBienvenidaForceOnLogin();
      setCheckoutStatus('Inicia sesión para activar tu huella aquí mismo.');
      clearBienvenidaFlowGoal();
      clearBienvenidaForceOnLogin();
      safeSetItem(
        LOGIN_RETURN_KEY,
        JSON.stringify({
          anchor: '#cta',
          action: 'cta-huella-login',
          source: 'call-to-action',
        })
      );
      setIsLoginPulseActive(true);
      if (loginPulseTimeoutRef.current) {
        window.clearTimeout(loginPulseTimeoutRef.current);
      }
      loginPulseTimeoutRef.current = window.setTimeout(() => {
        setIsLoginPulseActive(false);
        loginPulseTimeoutRef.current = null;
      }, 3200);
      return;
    }

    if (isSubscriber) {
      setCheckoutStatus('Tu huella ya está activa en esta cuenta. Gracias por impulsar la causa.');
      setEmbeddedClientSecret('');
      return;
    }

    const line_items = [
      {
        price: SUBSCRIPTION_PRICE_ID,
        quantity: 1,
      },
    ];

    if (line_items.some((item) => !item.price || !item.quantity)) {
      setCheckoutStatus('Faltan datos de la activación.');
      return;
    }

    const normalizedEmail = user?.email ? user.email.trim().toLowerCase() : '';
    const fallbackPayload = {
      priceId: SUBSCRIPTION_PRICE_ID,
      customerEmail: normalizedEmail || undefined,
      metadata: {
        channel: 'landing',
        event: 'suscripcion-landing',
        packages: 'subscription',
        source: 'miniverse_modal_fallback',
      },
    };
    try {
      setLoading(true);
      setMsg('');
      setCheckoutStatus('');
      setPendingFallbackPayload(null);
      const metadata = {
        channel: 'landing',
        event: 'suscripcion-landing',
        packages: 'subscription',
        source: 'miniverse_modal',
      };
      const data = await createEmbeddedSubscription({
        priceId: SUBSCRIPTION_PRICE_ID,
        metadata,
      });

      if (!data?.ok) {
        if (data?.error === 'already_subscribed') {
          setCheckoutStatus('Tu huella ya está activa en esta cuenta.');
          setHasActiveSubscription(true);
          setEmbeddedClientSecret('');
          return;
        }
        throw new Error(data?.error || 'embedded_unknown_error');
      }

      if (!data.client_secret) {
        throw new Error('missing_client_secret');
      }

      setEmbeddedClientSecret(data.client_secret);
      setCheckoutStatus('');
    } catch (e) {
      console.warn('[CallToAction] Embedded checkout error. Activando fallback.', e);
      setCheckoutStatus('No se pudo abrir el formulario embebido. Puedes intentar nuevamente o usar checkout externo.');
      setPendingFallbackPayload(fallbackPayload);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualFallbackCheckout() {
    if (!pendingFallbackPayload) return;
    try {
      setLoading(true);
      await startCheckoutFallback(pendingFallbackPayload);
    } catch (fallbackError) {
      console.error('[CallToAction] Fallback checkout error:', fallbackError);
      setMsg(fallbackError?.message || 'No se pudo iniciar el checkout externo.');
    } finally {
      setLoading(false);
    }
  }

  function handleEmbeddedCheckoutDone({ ok, message }) {
    if (!ok) return;
    const normalizedStatus = (message || '').toLowerCase();
    if (normalizedStatus === 'succeeded' || normalizedStatus === 'processing') {
      const isProcessing = normalizedStatus === 'processing';
      setLocalCheckoutLock(true);
      setCheckoutStatus(
        isProcessing
          ? 'Pago recibido. Estamos verificando tu huella (1-3 minutos).'
          : 'Pago confirmado. Tu huella se activará en esta cuenta.'
      );
      setEmbeddedClientSecret('');
      setAftercareVariant(isProcessing ? 'payment_processing' : 'payment_success');
      fireConfetti();
      window.setTimeout(() => fireConfetti(), 220);
      setShowAftercareOverlay(true);
      return;
    }
    setCheckoutStatus(`Estado actual del pago: ${message || 'unknown'}.`);
  }

  const handleOpenLoginFromStatus = useCallback(() => {
    setIsLoginPulseActive(false);
    clearBienvenidaFlowGoal();
    clearBienvenidaForceOnLogin();
    safeSetItem(
      LOGIN_RETURN_KEY,
      JSON.stringify({
        anchor: '#cta',
        action: 'cta-huella-login',
        source: 'call-to-action-status',
      })
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
    }
  }, []);

  const handleToggleCounterSound = useCallback(() => {
    const nextValue = !isCounterSoundEnabled;
    setIsCounterSoundEnabled(nextValue);
    if (nextValue) {
      ensureCounterAudio().then((context) => {
        if (!context) return;
        playCounterTick(1);
      });
    }
  }, [ensureCounterAudio, isCounterSoundEnabled, playCounterTick]);

  // 4) Renderizado
  return (
    <div className="relative mx-auto h-full max-w-xl text-center flex flex-col gap-6">
      {confettiBursts.map((burst) => (
        <ConfettiBurst key={burst} seed={burst} />
      ))}
      {/* Panel de impacto */}
      <div
        ref={impactPanelRef}
        className="relative rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-100 flex flex-col gap-4 flex-1"
      >
        <button
          type="button"
          onClick={handleToggleCounterSound}
          className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200/90 hover:border-purple-300/40 hover:text-white transition"
          aria-label={isCounterSoundEnabled ? 'Silenciar sonidos del simulador' : 'Activar sonidos del simulador'}
          title={isCounterSoundEnabled ? 'Silenciar simulador' : 'Activar simulador sonoro'}
        >
          {isCounterSoundEnabled ? (
            <Volume2 size={14} className="text-purple-200" />
          ) : (
            <VolumeX size={14} className="text-slate-300" />
          )}
        </button>
        <p className="text-[0.85rem] uppercase tracking-[0.18em] text-slate-400/80">
          Modelo anual por tramos · Q{currentQuarter} {currentYear}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="text-[1.05rem] opacity-90 inline-flex items-center gap-2 leading-tight">
            <PawPrint size={14} className="text-violet-300/90" />
            Huellas activadas
          </p>
          <p className="text-[2.2rem] font-semibold leading-none">{subs}</p>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-[1.05rem] opacity-90 inline-flex items-center gap-2 leading-tight">
            <Ticket size={14} className="text-cyan-300/90" />
            Boletos con causa
          </p>
          <p className="text-[2.2rem] font-semibold leading-none">{ticketUnits}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-[1.05rem] opacity-90 leading-tight">
              {interactiveSupport !== null
                ? 'Modo simulador'
                : 'Huellas + boletos • actualmente'}
            </p>
            <p className="text-[2.2rem] font-semibold leading-none">{displayStats.totalSupport}</p>
          </div>
        </div>

        <div className="mt-1 space-y-3">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowTicketSupport((prev) => !prev)}
              className="block w-full border border-white/20 text-white px-4 py-2 rounded hover:border-purple-300/70 hover:text-purple-100"
            >
              {showTicketSupport ? 'Ocultar opciones' : 'Sumar mi boleto'}
            </button>
            {showTicketSupport ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-left text-slate-100">
                {isTicketSupportVideoAvailable ? (
                  <video
                    className="pointer-events-none absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-70 saturate-125 contrast-125 brightness-110"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={SUPPORT_CTA_POSTER_URL}
                    onError={() => setIsTicketSupportVideoAvailable(false)}
                    aria-hidden="true"
                  >
                    <source src={SUPPORT_CTA_VIDEO_URL} type="video/mp4" />
                  </video>
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/30 to-slate-950/45" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(125,211,252,0.28),transparent_45%),radial-gradient(circle_at_80%_72%,rgba(147,197,253,0.22),transparent_18%)]" />
                <p className="relative z-10 mb-2 text-m leading-relaxed text-slate-400">
  <br />
  Si asististe a la obra, puedes convertir ese momento en huella. 
  Si no tienes comprobante, tu palabra es suficiente. 
  Alguien del equipo te contestará.
  <br /><br />
</p>
                <div className="relative z-10 grid gap-2">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=Destinar%20boleto%20a%20la%20causa&body=${SUPPORT_MESSAGE}`}
                    className="flex items-center justify-center gap-2 text-center rounded-lg border border-sky-200/30 bg-white/10 px-4 py-2 text-white backdrop-blur-md transition hover:border-sky-200/60 hover:bg-white/15"
                  >
                    <Mail size={18} />
                    Enviar por correo
                  </a>
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${SUPPORT_MESSAGE}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 text-center rounded-lg border border-sky-200/30 bg-white/10 px-4 py-2 text-white backdrop-blur-md transition hover:border-sky-200/60 hover:bg-white/15"
                  >
                    <MessageCircle size={18} />
                    Enviar por WhatsApp
                  </a>
                </div>
              </div>
            ) : null}
            <button
              onClick={handleCheckout}
              disabled={loading || isSubscriber || isCheckingSubscription}
              className={`white-glass-btn block w-full px-4 py-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                !user ? 'white-glass-btn--idle' : 'white-glass-btn--active'
              } ${isLoginPulseActive ? 'white-glass-btn--pulse animate-pulse' : ''}`}
            >
              {isCheckingSubscription
                ? 'Validando huella...'
                : isSubscriber
                  ? 'Tu huella ya está activa'
                  : loading
                    ? 'Abriendo confirmación…'
                    : 'Activar huella mensual'}
            </button>
          </div>

          {msg ? <p className="text-red-300 text-sm">{msg}</p> : null}

          <div ref={embeddedCheckoutRef} className="pt-1">
            {checkoutStatus ? (
              !user && checkoutStatus === 'Inicia sesión para activar tu huella aquí mismo.' ? (
                <p className="text-slate-200 text-sm">
                  <button
                    type="button"
                    onClick={handleOpenLoginFromStatus}
                    className="underline underline-offset-2 hover:text-white transition"
                  >
                    Inicia sesión
                  </button>{' '}
                  para activar tu huella aquí mismo.
                </p>
              ) : (
                <p className="text-slate-200 text-sm">{checkoutStatus}</p>
              )
            ) : null}
            {pendingFallbackPayload ? (
              <button
                type="button"
                onClick={handleManualFallbackCheckout}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-white/25 px-4 py-2 text-sm text-white hover:border-white/40 disabled:opacity-50"
              >
                {loading ? 'Abriendo checkout externo…' : 'Abrir checkout externo'}
              </button>
            ) : null}
            {isSubscriber ? (
              <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-left text-emerald-100">
                <p className="text-sm font-semibold"> Primera huella: {firstHuellaDateLabel ?? 'fecha en sincronización'}.
                </p>
                <p className="mt-1 text-xs text-emerald-100/90">
                  Tu gesto forma parte del tramo vigente.
                </p>
                <p className="mt-1 text-xs text-emerald-100/90">
                  Recibirás actualización trimestral del crecimiento.
                </p>
              </div>
            ) : null}
            {embeddedClientSecret ? (
              <HuellaEmbeddedCheckout
                clientSecret={embeddedClientSecret}
                onDone={handleEmbeddedCheckoutDone}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-1 space-y-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[1.02rem] opacity-90">Meta mínima anual</p>
            <p className="text-[1.45rem] font-semibold leading-none">
              {displayStats.totalSupportClamped}/{ANNUAL_TOTAL_HUELLAS}
            </p>
          </div>
          {/* Terapias */}
          <div className="space-y-1">
          <div className="flex items-center text-[0.92rem] opacity-85">
            <span className="inline-flex items-center gap-2">
              <HeartHandshake size={14} className="text-emerald-300/90" />
              Primer tramo: {displayStats.sesiones}/102 sesiones individuales al año.
            </span>
          </div>
          <ProgressBar
            value={displayBarValues.terapias}
            barClassName="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"
            maxValue={THERAPY_TRAMO_HUELLAS}
            currentValue={displayStats.terapiasActual}
            onPreviewChange={(value) => handleSliderInput('terapias', value)}
            onRelease={() => setInteractiveSupport(null)}
            isPreviewing={interactiveSupport !== null}
          />
          <p className="text-[13px] opacity-75 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={13} className="text-violet-300/90" />
            {displayStats.terapiasActual}/{displayStats.terapiasMeta}
          </p>
          </div>

          {/* Residencias */}
          <div className="space-y-1">
          <div className="flex items-center text-[0.92rem] opacity-85">
            <span className="inline-flex items-center gap-2">
              <Palette size={14} className="text-amber-300/90" />
              {displayStats.residenciasHitosActivos}/3 residencias activas por ciclo escolar.
            </span>
          </div>
          <ProgressBar
            value={displayBarValues.residencias}
            barClassName="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400"
            maxValue={RESIDENCY_TRAMO_HUELLAS}
            currentValue={displayStats.residenciasActual}
            milestones={[17, 34, 51]}
            onPreviewChange={(value) => handleSliderInput('residencias', value)}
            onRelease={() => setInteractiveSupport(null)}
            isPreviewing={interactiveSupport !== null}
          />
          <p className="text-[13px] opacity-75 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={13} className="text-violet-300/90" />
            {displayStats.residenciasActual}/{displayStats.residenciasMeta}
          </p>
          </div>

          {/* Implementación de apps en escuelas */}
          <div className="space-y-1">
          <div className="flex items-center text-[0.92rem] opacity-85">
            <span className="inline-flex items-center gap-2">
              <Smartphone size={14} className="text-cyan-300/90" />
              {displayStats.appsHitosActivos}/5 escuelas atendidas por ciclo escolar.
            </span>
          </div>
          <ProgressBar
            value={displayBarValues.implementacionEscuelas}
            barClassName="bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-300"
            maxValue={SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS}
            currentValue={displayStats.implementacionEscuelasActual}
            milestones={[75, 150, 225, 300, 375]}
            showUnlockMarker={displayStats.residenciasActual >= displayStats.residenciasMeta}
            onPreviewChange={(value) => handleSliderInput('implementacionEscuelas', value)}
            onRelease={() => setInteractiveSupport(null)}
            isPreviewing={interactiveSupport !== null}
          />
          <p className="text-[13px] opacity-75 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={13} className="text-violet-300/90" />
            {displayStats.implementacionEscuelasActual}/{displayStats.implementacionEscuelasMeta}
          </p>
          </div>

          {/* Expansión creativa */}
          <div className="space-y-1">
          <div className="flex items-center text-[0.92rem] opacity-85">
            <span className="inline-flex items-center gap-2">
              <Drama size={14} className="text-violet-300/90" />
              Fondo para expansión creativa
            </span>
          </div>
          <ProgressBar
            value={displayBarValues.universos}
            barClassName="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-400"
            maxValue={EXPANSION_START}
            currentValue={Math.min(displayStats.totalSupport, EXPANSION_START)}
            milestones={[Math.round(EXPANSION_START / 2), EXPANSION_START]}
            onPreviewChange={(value) => handleSliderInput('universos', value)}
            onRelease={() => setInteractiveSupport(null)}
            isPreviewing={interactiveSupport !== null}
          />
          <p className="text-xs opacity-65">
            A partir de la huella {EXPANSION_START_COPY}, cada huella se reinvierte en nuevas obras, miniversos y publicaciones.
          </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-md opacity-90">
            Faltan <strong>{displayStats.annualFaltan}</strong> huellas para completar todos los tramos.
          </p>
          <p className="text-sm opacity-80">
            Reinversión (excedente): <strong>+{displayStats.reinversion}</strong>
          </p>
          <p className="text-xs opacity-65">
            Todo lo que supere esta meta se reinvierte en nuevas obras, miniversos y publicaciones ✨
          </p>
        </div>
      </div>
      {showAftercareOverlay ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/82 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aftercare-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-slate-950/95 p-6 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {aftercareVariant === 'expansion' ? 'Fin de temporada.' : 'Estado de tu huella'}
            </p>
            {aftercareVariant === 'expansion' ? (
              <p className="mt-3 text-lg font-semibold text-white">17 · 51 · 375.</p>
            ) : null}
            <h3 id="aftercare-title" className="mt-4 text-2xl font-semibold text-white">
              {aftercareVariant === 'payment_success'
                ? 'Pago confirmado por Stripe.'
                : aftercareVariant === 'payment_processing'
                  ? 'Pago recibido. En verificación.'
                  : 'Meta mínima anual cumplida.'}
            </h3>
            <p className="mt-5 text-slate-200 leading-relaxed">
              {aftercareVariant === 'payment_success'
                ? 'Tu huella quedó registrada. Recibirás tu factura en el correo de esta cuenta. Si no se refleja al instante, se sincroniza en 1-3 minutos 🐾'
                : aftercareVariant === 'payment_processing'
                  ? 'No necesitas pagar de nuevo. Estamos validando tu aportación y, al confirmarse, recibirás tu factura en tu correo.'
                  : 'La obra respira.\nSola.\nY en comunidad.'}
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-white/95 px-4 py-2 font-semibold text-black hover:bg-white"
              onClick={() => {
                setShowAftercareOverlay(false);
                if (aftercareVariant === 'expansion') {
                  reachedExpansionRef.current = false;
                }
                if (aftercareAudioRef.current) {
                  aftercareAudioRef.current.pause();
                  aftercareAudioRef.current.currentTime = 0;
                }
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}

    </div>
    
  );
};



export default CallToAction;
