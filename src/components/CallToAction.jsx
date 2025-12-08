// SitioObra/src/components/CallToAction.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IMPACT_COPY as t } from '../copy/impact.es.js';
import { apiFetch } from '@/lib/apiClient';

const SESSIONS_PER_SUB = 6;
const SUBS_PER_RESIDENCY = 17; // ≈ $10,000 / $600
const SUBS_PER_SCHOOL = 75;    // ≈ $45,000 / $600

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

    if (!canFetchStats) {
      return undefined;
    }

    let active = true;
    async function fetchSubs() {
      try {
        const res = await apiFetch('/stats/suscriptores', { cache: 'no-store' });
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

    const residencias = Math.floor(subs / SUBS_PER_RESIDENCY);
    const residenciasResto = subs % SUBS_PER_RESIDENCY;
    const residenciasFaltan = residenciasResto === 0 ? SUBS_PER_RESIDENCY : (SUBS_PER_RESIDENCY - residenciasResto);
    const residenciasProg = (residenciasResto / SUBS_PER_RESIDENCY) * 100;

    const escuelas = Math.floor(subs / SUBS_PER_SCHOOL);
    const escuelasResto = subs % SUBS_PER_SCHOOL;
    const escuelasFaltan = escuelasResto === 0 ? SUBS_PER_SCHOOL : (SUBS_PER_SCHOOL - escuelasResto);
    const escuelasProg = (escuelasResto / SUBS_PER_SCHOOL) * 100;

    return {
      sesiones,
      residencias, residenciasFaltan, residenciasProg,
      escuelas, escuelasFaltan, escuelasProg
    };
  }, [subs]);

  // 3) Checkout
  async function handleCheckout() {
    try {
      setLoading(true);
      setMsg('');
      const res = await apiFetch('/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear la sesión');
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <motion.p
        className="text-md text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Cada suscripción motiva al universo #GatoEncerrado y activa impacto real en su causa social.
      </motion.p>

      {/* Panel de impacto */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-slate-100 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm opacity-80">Suscriptores activos</p>
          <p className="text-2xl font-semibold">{subs}</p>
        </div>

        <div>
          <p className="text-sm mb-1 opacity-80">Terapias asignadas</p>
          <p className="text-lg mb-2"><strong>{stats.sesiones}</strong> sesiones (1 suscripción = 6 sesiones)</p>
        </div>

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

        <p className="text-[11px] leading-4 text-slate-300/80 pt-2">
          * Isabel Ayuda para la Vida, A.C. no cobra al usuario por sesión. Las sesiones se asignan sin costo para
          las familias cuando se detecta riesgo, gracias a la combinación de suscripciones, aportes simbólicos y apoyos institucionales.
        </p>
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
          {loading ? 'Creando sesión…' : 'Quiero suscribirme'}
        </button>
      </div>

      {msg && <p className="text-red-300 text-sm">{msg}</p>}
    </div>
  );
};

export default CallToAction;
