import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResonanceModal from '@/components/portal/ResonanceModal';
import { CATALOG } from '@/lib/bitacoraShared';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { setAnonIdOverride } from '@/lib/identity';

// Aterrizaje del magic link de Bitácora diferida (WhatsApp/push, días después).
// URL: /bitacora?t=<anon_id>&m=<portal key, ej. "sonoridades">
// El anon_id del link puede no coincidir con el de este navegador (el link
// puede abrirse en otro dispositivo) — se fuerza como identidad activa para
// esta pestaña, ver setAnonIdOverride en lib/identity.js.
const BitacoraLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);

  const anonId = searchParams.get('t');
  const portalKey = searchParams.get('m');

  // Efecto de módulo, no de React: debe correr antes de que ResonanceModal
  // monte y dispare sus propias llamadas (que leen ensureAnonId()).
  if (anonId) setAnonIdOverride(anonId);

  const entry = useMemo(() => CATALOG.find((c) => c.key === portalKey), [portalKey]);

  const handleClose = () => navigate('/', { replace: true });

  const handleOpenNarrative = () => {
    const route = resolvePortalRoute({ formatId: entry?.showcase });
    if (route) navigate(route);
  };

  const handleNavigateToRecommendation = (formatId) => {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900">
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
      {showLogin ? <LoginOverlay onClose={() => setShowLogin(false)} /> : null}
    </div>
  );
};

export default BitacoraLanding;
