import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResonanceModal from '@/components/portal/ResonanceModal';
import { CATALOG } from '@/lib/bitacoraShared';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { setAnonIdOverride } from '@/lib/identity';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ORACULO_RECOMMENDED_SHOWCASE_KEY } from '@/components/transmedia/transmediaConstants';

// Mismo criterio de acceso que handleFormatClick usa en Transmedia.jsx: un
// invitado sin cuenta solo puede entrar a la vitrina recomendada o a una que
// ya desbloqueó gastando GAT — cualquier otra requiere login. anon_id no es
// secreto (vive en el localStorage del propio visitante), así que sin este
// chequeo cualquiera podía usar su propio anon_id con m=<cualquier portal>
// para saltarse el desbloqueo (encontrado 2026-07-27).
function hasUnlockedAccess(formatId, isAuthenticated) {
  if (isAuthenticated) return true;
  try {
    const recommended = window.localStorage.getItem(ORACULO_RECOMMENDED_SHOWCASE_KEY);
    if (recommended && recommended === formatId) return true;
    const boosts = JSON.parse(window.localStorage.getItem('gatoencerrado:showcase-boosts') || '{}');
    return Boolean(boosts?.[formatId]);
  } catch {
    return false;
  }
}

// Aterrizaje del magic link de Bitácora diferida (WhatsApp/push, días después).
// URL: /bitacora?t=<anon_id>&m=<portal key, ej. "sonoridades">
// El anon_id del link puede no coincidir con el de este navegador (el link
// puede abrirse en otro dispositivo) — se fuerza como identidad activa para
// esta pestaña, ver setAnonIdOverride en lib/identity.js.
const BitacoraLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  const anonId = searchParams.get('t');
  const portalKey = searchParams.get('m');

  // Efecto de módulo, no de React: debe correr antes de que ResonanceModal
  // monte y dispare sus propias llamadas (que leen ensureAnonId()).
  if (anonId) setAnonIdOverride(anonId);

  const entry = useMemo(() => CATALOG.find((c) => c.key === portalKey), [portalKey]);

  const handleClose = () => navigate('/', { replace: true });

  const handleOpenNarrative = () => {
    if (!hasUnlockedAccess(entry?.showcase, isAuthenticated)) {
      setShowLogin(true);
      return;
    }
    const route = resolvePortalRoute({ formatId: entry?.showcase });
    if (route) navigate(route);
  };

  const handleNavigateToRecommendation = (formatId) => {
    if (!hasUnlockedAccess(formatId, isAuthenticated)) {
      setShowLogin(true);
      return;
    }
    const route = resolvePortalRoute({ formatId });
    if (route) navigate(route);
  };

  if (!anonId || !entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-950 via-black to-slate-900 px-6 text-center text-slate-100">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Bitácora</p>
        <h1 className="font-display text-2xl">Este enlace ya no es válido.</h1>
        <p className="max-w-sm text-sm text-slate-400/80">
          Vuelve a #GatoEncerrado y retoma tu recorrido desde ahí.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto overflow-x-hidden overscroll-none bg-gradient-to-b from-slate-950 via-black to-slate-900">
      {/* El contenedor canónico: las mismas dimensiones que usa la tarjeta de
          vitrina en Transmedia.jsx (showcaseRef) — acotada a max-w-6xl, NUNCA
          borde a borde. ResonanceModal se posiciona con "absolute inset-0",
          así que necesita este "relative" con tamaño real (no el viewport
          completo) para heredar el tamaño correcto, igual que en su uso
          normal dentro de una vitrina. */}
      <div className="relative my-10 h-[calc(100vh-5rem)] w-[calc(100vw-2.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/55 shadow-[0_35px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <ResonanceModal
          open
          startInHolografico
          portal={portalKey}
          question={entry.q}
          onClose={handleClose}
          onOpenNarrative={handleOpenNarrative}
          onNavigateToRecommendation={handleNavigateToRecommendation}
          onRequireLogin={() => setShowLogin(true)}
        />
      </div>
      {showLogin ? <LoginOverlay onClose={() => setShowLogin(false)} /> : null}
    </div>
  );
};

export default BitacoraLanding;
