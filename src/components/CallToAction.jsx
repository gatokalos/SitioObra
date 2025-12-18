// SitioObra/src/components/CallToAction.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IMPACT_COPY as t } from '../copy/impact.es.js';
import { apiFetch } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';

const SUBSCRIPTION_PRICE_ID = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
const SESSIONS_PER_SUB = 6;
const SUBS_PER_RESIDENCY = 17; // ≈ $10,000 / $600
const SUBS_PER_SCHOOL = 75;    // ≈ $45,000 / $600
const SUBS_PER_UNIVERSO = 158; // Nueva meta para creación artística

function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-white/70"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const CallToAction = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [subs, setSubs] = useState(0);
  const [canFetchStats, setCanFetchStats] = useState(Boolean(import.meta.env.VITE_API_URL));

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
    return () => { active = false; clearInterval(id); };
  }, [canFetchStats]);

  // 2) Cálculos de impacto
  const stats = useMemo(() => {
    const sesiones = subs * SESSIONS_PER_SUB;

    // Residencias
    const residencias = Math.floor(subs / SUBS_PER_RESIDENCY);
    const residenciasResto = subs % SUBS_PER_RESIDENCY;
    const residenciasFaltan = residenciasResto === 0 ? SUBS_PER_RESIDENCY : (SUBS_PER_RESIDENCY - residenciasResto);
    const residenciasProg = (residenciasResto / SUBS_PER_RESIDENCY) * 100;

    // Escuelas
    const escuelas = Math.floor(subs / SUBS_PER_SCHOOL);
    const escuelasResto = subs % SUBS_PER_SCHOOL;
    const escuelasFaltan = escuelasResto === 0 ? SUBS_PER_SCHOOL : (SUBS_PER_SCHOOL - escuelasResto);
    const escuelasProg = (escuelasResto / SUBS_PER_SCHOOL) * 100;

    // Universos / Creaciones nuevas
    const universos = Math.floor(subs / SUBS_PER_UNIVERSO);
    const universosResto = subs % SUBS_PER_UNIVERSO;
    const universosFaltan = universosResto === 0 ? SUBS_PER_UNIVERSO : (SUBS_PER_UNIVERSO - universosResto);
    const universosProg = (universosResto / SUBS_PER_UNIVERSO) * 100;

    return {
      sesiones,
      residencias, residenciasFaltan, residenciasProg,
      escuelas, escuelasFaltan, escuelasProg,
      universos, universosFaltan, universosProg
    };
  }, [subs]);

  // 3) Checkout
  async function handleCheckout() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

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
      setMsg('Faltan datos de la suscripción.');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'subscription',
          line_items,
          customer_email: normalizedEmail,
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
    <div className="max-w-xl mx-auto text-center space-y-6">
      <motion.div
  className="text-md text-white"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
  <p>
    Cuando la causa florece, su pulso regresa al universo: nuevos juegos, nuevas escenas, nuevas historias por contar.
  </p>

  <p className="text-xs text-slate-400/70 mt-3">
    Además, recibirás{' '}
    <a href="#transmedia" className="underline text-slate-300">
      12,000 GATokens
    </a>{' '}
    como una cortesía por tu suscripción.
  </p>
</motion.div>

      {/* Panel de impacto */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-100 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Suscriptores activos</p>
          <p className="text-2xl font-semibold">{subs}</p>
        </div>

        <div>
          <p className="text-sm mb-1 opacity-80">Terapias asignadas</p>
          <p className="text-lg mb-2">
            <strong>{stats.sesiones}</strong> sesiones (1 suscripción = 6 sesiones)
          </p>
        </div>

        {/* Residencias */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span>Residencias creativas</span>
            <span>{stats.residencias} activas</span>
          </div>
          <ProgressBar value={stats.residenciasProg} />
          <p className="text-xs opacity-70 mt-1">
            Faltan <strong>{stats.residenciasFaltan}</strong> suscripciones para abrir la siguiente residencia (≈ 17/sub).
          </p>
        </div>

        {/* Escuelas */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span>Escuelas con app activa</span>
            <span>{stats.escuelas} escuelas</span>
          </div>
          <ProgressBar value={stats.escuelasProg} />
          <p className="text-xs opacity-70 mt-1">
            Faltan <strong>{stats.escuelasFaltan}</strong> suscripciones para la próxima escuela (≈ 75/sub).
          </p>
        </div>

        {/* 🌌 Nuevo medidor: Expansión creativa */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm opacity-80">
            <span>Expansión creativa del universo</span>
            <span>{stats.universos} activadas</span>
          </div>
          <ProgressBar value={stats.universosProg} />
          <p className="text-xs opacity-70 mt-1">
            Faltan <strong>{stats.universosFaltan}</strong> suscripciones para la siguiente creación artística (≈ 158/sub).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 px-4 py-3 mt-4">
  <button
    type="button"
    className="relative flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/60"
  >
    <div className="h-5 w-5 rounded-full border border-white/20 bg-slate-600/40" />
    <span className="text-sm text-slate-300/80 leading-relaxed">
      Quiero estar al tanto de las expansiones e historias comunitarias.
    </span>
  </button>

</div>

      {/* Email + Checkout */}
      <div className="grid gap-3">
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded text-black"
        />
        <button
          onClick={handleCheckout}
          disabled={loading || !email}
          className="bg-white/90 text-black px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creando sesión…' : ' Apóyanos con tu suscripción'}
        </button>
      </div>

      {msg && <p className="text-red-300 text-sm">{msg}</p>}
      {/* Activar notificaciones del universo */}

    </div>
    
  );
};



export default CallToAction;
