// SitioObra/src/components/CallToAction.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Drama, HeartHandshake, Mail, MessageCircle, Palette, PawPrint, Smartphone, Ticket } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';
import HuellaEmbeddedCheckout from '@/components/HuellaEmbeddedCheckout';
import { createEmbeddedSubscription, startCheckoutFallback } from '@/lib/huellaCheckout';

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
  'Hola:%0A%0AEstuve en la función de Es un Gato Encerrado y quiero convertir mi boleto en una huella para la causa social.%0A%0AAdjunto una imagen como comprobante de que estuve ahí.%0ANo busco registrarme ni hacer login, solo sumar desde este gesto.%0A%0AGracias por abrir este espacio.';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const hasRunBarSequenceRef = useRef(false);
  const aftercareTimeoutRef = useRef(null);
  const reachedExpansionRef = useRef(false);
  const aftercareAudioRef = useRef(null);
  const accordionPushTimeoutRef = useRef(null);
  const impactPanelRef = useRef(null);
  const isImpactPanelInView = useInView(impactPanelRef, { once: true, amount: 0.35 });
  const prefersReducedMotion = useReducedMotion();
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

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
    const reachedExpansion = displayStats.totalSupport >= EXPANSION_START;
    if (reachedExpansion && !reachedExpansionRef.current) {
      reachedExpansionRef.current = true;
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
      if (aftercareAudioRef.current) {
        aftercareAudioRef.current.pause();
        aftercareAudioRef.current.src = '';
        aftercareAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showAftercareOverlay || typeof window === 'undefined') return;
    let audio = aftercareAudioRef.current;
    if (!audio) {
      audio = new Audio(AFTERCARE_AUDIO_URL);
      audio.preload = 'auto';
      audio.volume = 0.82;
      aftercareAudioRef.current = audio;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [showAftercareOverlay]);

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
      setCheckoutStatus('Inicia sesión para activar tu huella aquí mismo.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-login-modal'));
      }
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
    try {
      setLoading(true);
      setMsg('');
      setCheckoutStatus('');
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
      setCheckoutStatus('No se pudo abrir el formulario embebido. Redirigiendo al checkout...');
      try {
        await startCheckoutFallback({
          priceId: SUBSCRIPTION_PRICE_ID,
          customerEmail: normalizedEmail || undefined,
          metadata: {
            channel: 'landing',
            event: 'suscripcion-landing',
            packages: 'subscription',
            source: 'miniverse_modal_fallback',
          },
        });
      } catch (fallbackError) {
        console.error('[CallToAction] Fallback checkout error:', fallbackError);
        setMsg(fallbackError?.message || 'No se pudo iniciar el pago.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEmbeddedCheckoutDone({ ok, message }) {
    if (!ok) return;
    const normalizedStatus = (message || '').toLowerCase();
    if (normalizedStatus === 'succeeded' || normalizedStatus === 'processing') {
      setCheckoutStatus('Pago confirmado. Tu huella se activará en esta cuenta.');
      setEmbeddedClientSecret('');
      return;
    }
    setCheckoutStatus(`Estado actual del pago: ${message || 'unknown'}.`);
  }

  useEffect(() => {
    if (!embeddedClientSecret || !embeddedCheckoutRef.current) return;
    embeddedCheckoutRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [embeddedClientSecret]);

  // 4) Renderizado
  return (
    <div className="mx-auto h-full max-w-xl text-center flex flex-col gap-6">
      {confettiBursts.map((burst) => (
        <ConfettiBurst key={burst} seed={burst} />
      ))}
      {/* Panel de impacto */}
      <div
        ref={impactPanelRef}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-100 flex flex-col gap-4 flex-1"
      >
        <p className="text-[0.85rem] uppercase tracking-[0.18em] text-slate-400/80">
          Modelo anual por tramos · Q{currentQuarter} {currentYear}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80 inline-flex items-center gap-2">
            <PawPrint size={14} className="text-violet-300/90" />
            Huellas activadas
          </p>
          <p className="text-2xl font-semibold">{subs}</p>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80 inline-flex items-center gap-2">
            <Ticket size={14} className="text-cyan-300/90" />
            Boletos con causa
          </p>
          <p className="text-2xl font-semibold">{ticketUnits}</p>
        </div>

        <div className="order-2 space-y-4">
          {/* Terapias */}
          <div className="space-y-1">
          <div className="flex items-center text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <HeartHandshake size={14} className="text-emerald-300/90" />
              {displayStats.sesiones} sesiones financiadas en este tramo.
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
          <p className="text-xs opacity-70 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={12} className="text-violet-300/90" />
            {displayStats.terapiasActual}/{displayStats.terapiasMeta}
          </p>
          </div>

          {/* Residencias */}
          <div className="space-y-1">
          <div className="flex items-center text-sm opacity-80">
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
          <p className="text-xs opacity-70 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={12} className="text-violet-300/90" />
            {displayStats.residenciasActual}/{displayStats.residenciasMeta}
          </p>
          </div>

          {/* Implementación de apps en escuelas */}
          <div className="space-y-1">
          <div className="flex items-center text-sm opacity-80">
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
            onPreviewChange={(value) => handleSliderInput('implementacionEscuelas', value)}
            onRelease={() => setInteractiveSupport(null)}
            isPreviewing={interactiveSupport !== null}
          />
          <p className="text-xs opacity-70 inline-flex items-center gap-1 justify-end w-full">
            <PawPrint size={12} className="text-violet-300/90" />
            {displayStats.implementacionEscuelasActual}/{displayStats.implementacionEscuelasMeta}
          </p>
          </div>

          {/* Expansión creativa */}
          <div className="space-y-1">
          <div className="flex items-center text-sm opacity-80">
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

        <div className="order-1 space-y-2">
          <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Huellas + boletos con causa</p>
          <p className="text-2xl font-semibold">{displayStats.totalSupport}</p>
          </div>
          <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Meta mínima anual</p>
          <p className="text-lg font-semibold">
            {displayStats.totalSupportClamped}/{ANNUAL_TOTAL_HUELLAS}
          </p>
          </div>
        </div>

        <div className="order-3 space-y-3">
          {/* Checkout + Ticket Support */}
          <div className="grid gap-3">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-white/90 text-black px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Abriendo…' : 'Dejar mi huella'}
            </button>
            <button
              type="button"
              onClick={() => setShowTicketSupport((prev) => !prev)}
              className="border border-white/20 text-white px-4 py-2 rounded hover:border-purple-300/70 hover:text-purple-100"
            >
              {showTicketSupport ? 'Ocultar opciones' : 'Convertir mi boleto'}
            </button>
          </div>

          {msg && <p className="text-red-300 text-sm">{msg}</p>}
          {showTicketSupport ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-slate-100 space-y-3">
              <p className="text-sm text-slate-300">
                Si asististe a la obra y deseas convertir ese momento en huella, puedes hacerlo aquí.
              </p>
              <div className="grid gap-2">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Destinar%20boleto%20a%20la%20causa&body=${SUPPORT_MESSAGE}`}
                  className="flex items-center justify-center gap-2 text-center border border-white/20 text-white px-4 py-2 rounded hover:border-purple-300/70 hover:text-purple-100"
                >
                  <Mail size={18} />
                  Enviar por correo
                </a>
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${SUPPORT_MESSAGE}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-center border border-white/20 text-white px-4 py-2 rounded hover:border-purple-300/70 hover:text-purple-100"
                >
                  <MessageCircle size={18} />
                  Enviar por WhatsApp
                </a>
              </div>
            </div>
          ) : null}

          <div ref={embeddedCheckoutRef} className="pt-2">
            {checkoutStatus ? <p className="text-slate-200 text-sm">{checkoutStatus}</p> : null}
            {embeddedClientSecret ? (
              <HuellaEmbeddedCheckout
                clientSecret={embeddedClientSecret}
                onDone={handleEmbeddedCheckoutDone}
              />
            ) : null}
          </div>
        </div>

        <div className="order-4 space-y-2">
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
          className="fixed inset-0 z-[220] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aftercare-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-slate-950/95 p-6 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Fin de temporada.</p>
            <p className="mt-3 text-lg font-semibold text-white">17 · 51 · 375.</p>
            <h3 id="aftercare-title" className="mt-4 text-2xl font-semibold text-white">
              Meta mínima anual cumplida.
            </h3>
            <p className="mt-5 text-slate-200 leading-relaxed">
              La obra respira.
              <br />
              Sola.
              <br />Y en comunidad.
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-white/95 px-4 py-2 font-semibold text-black hover:bg-white"
              onClick={() => {
                setShowAftercareOverlay(false);
                reachedExpansionRef.current = false;
                if (aftercareAudioRef.current) {
                  aftercareAudioRef.current.pause();
                  aftercareAudioRef.current.currentTime = 0;
                }
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

    </div>
    
  );
};



export default CallToAction;
