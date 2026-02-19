// SitioObra/src/components/CallToAction.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Drama, HeartHandshake, Mail, MessageCircle, Palette, PawPrint, Smartphone, Ticket } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SUBSCRIPTION_PRICE_ID = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
const SESSIONS_PER_SUB = 6;
const THERAPY_TRAMO_HUELLAS = 17; // 1-17
const RESIDENCY_TRAMO_HUELLAS = 18; // 18-35
const SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS = 75; // 36-110
const CREATIVE_EXPANSION_TRAMO_HUELLAS = 12; // 111-122
const ANNUAL_TOTAL_HUELLAS =
  THERAPY_TRAMO_HUELLAS +
  RESIDENCY_TRAMO_HUELLAS +
  SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS +
  CREATIVE_EXPANSION_TRAMO_HUELLAS;
const SUPPORT_EMAIL = 'contacto@gatoencerrado.ai';
const SUPPORT_WHATSAPP = '+523315327985';
const SUPPORT_MESSAGE =
  'Hola,%0Aestuve en la función de Es un Gato Encerrado y quiero destinar mi boleto a la causa social.%0A%0AAdjunto una imagen como comprobante de que estuve ahí.%0ANo busco registrarme ni hacer login, solo sumar desde este gesto.%0A%0AGracias por abrir este espacio.';

function ProgressBar({ value, barClassName = 'bg-white/70' }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="relative w-full h-5 rounded-[4px] border border-white/15 bg-slate-900/80 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-10px_18px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
      <div
        className={`relative h-full rounded-[2px] transition-[width] duration-700 ease-out shadow-[0_0_18px_rgba(255,255,255,0.24)] ${barClassName}`}
        style={{ width: `${safeValue}%` }}
      />
      {safeValue > 3 ? (
        <div
          className="absolute top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-[2px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{ left: `calc(${safeValue}% - 4px)` }}
        />
      ) : null}
    </div>
  );
}

const CallToAction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
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
  const hasRunBarSequenceRef = useRef(false);
  const impactPanelRef = useRef(null);
  const isImpactPanelInView = useInView(impactPanelRef, { once: true, amount: 0.35 });
  const prefersReducedMotion = useReducedMotion();
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
  const stats = useMemo(() => {
    const totalSupport = subs + ticketUnits;
    const tramoTerapias = Math.min(Math.max(totalSupport, 0), THERAPY_TRAMO_HUELLAS);
    const tramoResidencias = Math.min(
      Math.max(totalSupport - THERAPY_TRAMO_HUELLAS, 0),
      RESIDENCY_TRAMO_HUELLAS
    );
    const tramoImplementacionEscuelas = Math.min(
      Math.max(
        totalSupport - (THERAPY_TRAMO_HUELLAS + RESIDENCY_TRAMO_HUELLAS),
        0
      ),
      SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS
    );
    const tramoExpansion = Math.min(
      Math.max(
        totalSupport -
          (THERAPY_TRAMO_HUELLAS +
            RESIDENCY_TRAMO_HUELLAS +
            SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS),
        0
      ),
      CREATIVE_EXPANSION_TRAMO_HUELLAS
    );

    const sesiones = tramoTerapias * SESSIONS_PER_SUB;

    return {
      totalSupport,
      totalSupportClamped: Math.min(totalSupport, ANNUAL_TOTAL_HUELLAS),
      annualFaltan: Math.max(ANNUAL_TOTAL_HUELLAS - totalSupport, 0),
      annualProg: (Math.min(totalSupport, ANNUAL_TOTAL_HUELLAS) / ANNUAL_TOTAL_HUELLAS) * 100,
      sesiones,
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
      implementacionEscuelasProg:
        (tramoImplementacionEscuelas / SCHOOL_IMPLEMENTATION_TRAMO_HUELLAS) * 100,
      universosActual: tramoExpansion,
      universosMeta: CREATIVE_EXPANSION_TRAMO_HUELLAS,
      universosFaltan: Math.max(CREATIVE_EXPANSION_TRAMO_HUELLAS - tramoExpansion, 0),
      universosProg: (tramoExpansion / CREATIVE_EXPANSION_TRAMO_HUELLAS) * 100,
    };
  }, [subs, ticketUnits]);

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

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [
    isImpactPanelInView,
    prefersReducedMotion,
    stats.implementacionEscuelasProg,
    stats.terapiasProg,
    stats.residenciasProg,
    stats.universosProg,
  ]);

  // 3) Checkout
  async function handleCheckout() {
    if (!SUBSCRIPTION_PRICE_ID) {
      setMsg('Configura VITE_STRIPE_SUBSCRIPTION_PRICE_ID antes de continuar.');
      return;
    }

    const line_items = [
      {
        price: SUBSCRIPTION_PRICE_ID,
        quantity: 1,
      },
    ];

    if (line_items.some((item) => !item.price || !item.quantity)) {
      setMsg('Faltan datos de la activación.');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      const normalizedEmail = user?.email ? user.email.trim().toLowerCase() : '';
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'subscription',
          line_items,
          customer_email: normalizedEmail || undefined,
          metadata: {
            channel: 'landing',
            event: 'suscripcion-landing',
            packages: 'subscription',
          },
        },
      });

      if (error || !data?.url) {
        throw error || new Error('No se pudo crear la sesión');
      }

      window.location.href = data.url;
    } catch (e) {
      console.error('[CallToAction] Checkout error:', e);
      setMsg(e.message || 'No se pudo crear la sesión');
    } finally {
      setLoading(false);
    }
  }

  // 4) Renderizado
  return (
    <div className="mx-auto h-full max-w-xl text-center flex flex-col gap-6">
      {/* Panel de impacto */}
      <div
        ref={impactPanelRef}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-100 space-y-4 flex-1"
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
            Boletos destinados
          </p>
          <p className="text-2xl font-semibold">{ticketUnits}</p>
        </div>

        {/* Checkout + Ticket Support */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="bg-white/90 text-black px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creando sesión…' : 'Dejar mi huella'}
          </button>
          <button
            type="button"
            onClick={() => setShowTicketSupport((prev) => !prev)}
            className="border border-white/20 text-white px-4 py-2 rounded hover:border-purple-300/70 hover:text-purple-100"
          >
            {showTicketSupport ? 'Ocultar opciones' : 'Destinar mi boleto'}
          </button>
        </div>

        {msg && <p className="text-red-300 text-sm">{msg}</p>}
        {showTicketSupport ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-slate-100 space-y-3">
            <p className="text-sm text-slate-300">
              Si ya compraste boleto, envíanos una foto como gesto de apoyo. No necesitas registrarte.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
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

        {/* Terapias */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <HeartHandshake size={14} className="text-emerald-300/90" />
              Fondo para terapias
            </span>
            <span>
              {stats.terapiasActual}/{stats.terapiasMeta}
            </span>
          </div>
          <ProgressBar
            value={barValues.terapias}
            barClassName="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300"
          />
      
          <p className="text-xs opacity-65">
            <strong>{stats.sesiones}</strong> sesiones financiadas en este tramo.
          </p>
        </div>

        {/* Residencias */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <Palette size={14} className="text-amber-300/90" />
              Fondo para residencias creativas
            </span>
            <span>
              {stats.residenciasActual}/{stats.residenciasMeta}
            </span>
          </div>
          <ProgressBar
            value={barValues.residencias}
            barClassName="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400"
          />

        </div>

        {/* Implementación de apps en escuelas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <Smartphone size={14} className="text-cyan-300/90" />
              Fondo para implementar apps en escuelas
            </span>
            <span>
              {stats.implementacionEscuelasActual}/{stats.implementacionEscuelasMeta}
            </span>
          </div>
          <ProgressBar
            value={barValues.implementacionEscuelas}
            barClassName="bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-300"
          />

        </div>

        {/* Expansión creativa */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <Drama size={14} className="text-violet-300/90" />
              Fondo para expansión creativa
            </span>
            <span>
              {stats.universosActual}/{stats.universosMeta}
            </span>
          </div>
          <ProgressBar
            value={barValues.universos}
            barClassName="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-400"
          />

        </div>
             <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Huellas totales</p>
          <p className="text-2xl font-semibold">{stats.totalSupport}</p>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Meta mínima anual</p>
          <p className="text-lg font-semibold">
            {stats.totalSupportClamped}/{ANNUAL_TOTAL_HUELLAS}
          </p>
        </div>
        <p className="text-md opacity-90">
          Faltan <strong>{stats.annualFaltan}</strong> huellas para completar todos los tramos.
        </p>
        <p className="text-xs opacity-65">
          Todo lo que supere esta meta se reinvierte en nuevas obras, miniversos y publicaciones ✨
        </p>
      </div>

    </div>
    
  );
};



export default CallToAction;
