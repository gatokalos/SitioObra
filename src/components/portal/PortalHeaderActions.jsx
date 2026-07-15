import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  getHeroAmbientAudio,
  getHeroAmbientState,
  subscribeHeroAmbient,
  toggleHeroAmbientMuted,
  HERO_AMBIENT_DEFAULT_VOLUME,
  HERO_AMBIENT_MIN_AUDIBLE_VOLUME,
  resumeHeroAmbientPlayback,
} from '@/lib/heroAmbientAudio';
import { resolvePortalReturnTarget } from '@/lib/portalNavigation';
import GATChip from '@/components/portal/GATChip';

const DEFAULT_RETURN_URL = '/?heroTab=experiences#hero';

const PortalHeaderActions = ({ returnUrl = DEFAULT_RETURN_URL }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showTransferChip, setShowTransferChip] = useState(false);

  useEffect(() => {
    if (!location.state?.showGatTransferChip) return;
    setShowTransferChip(true);
    const t = window.setTimeout(() => setShowTransferChip(false), 2500);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ambientState = useSyncExternalStore(
    subscribeHeroAmbient,
    getHeroAmbientState,
    getHeroAmbientState
  );
  // Estas páginas de portal no tienen #transmedia en el DOM, así que la pista
  // de Transmedia nunca suena aquí — solo importa isPlaying de Hero.
  const isAmbientAudible = !ambientState.isMuted && ambientState.isPlaying;
  const { portalReturnUrl, portalReturnScrollY, portalReturnShowcaseId, restoreToken } = useMemo(
    () => resolvePortalReturnTarget(location.state, returnUrl),
    [location.state, returnUrl]
  );
  const portalLaunchSource = location.state?.portalLaunchSource ?? '';

  const handleBackToSite = useCallback(() => {
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const fromTransmedia = portalLaunchSource === 'transmedia-mobile-portal';

    if (isMobile && !user) {
      // Anonymous mobile users have a single portal entry point (bienvenida recommendation).
      // Send them to About so they continue discovering the site naturally.
      navigate('/#about', { replace: true });
      return;
    }

    if (isMobile && fromTransmedia) {
      // Mobile + opened from Transmedia section: hash-based navigation so
      // HashAnchorScroller handles scrollIntoView with retry — avoids React 18
      // concurrent-mode timing issues that break pixel-based scroll restoration.
      const baseUrl = portalReturnUrl.split('#')[0];
      navigate(`${baseUrl}#transmedia`, { replace: true });
      return;
    }

    // All other cases (desktop, or mobile opened from Hero/MiniverseModal/Header):
    // pixel-based scroll restoration.
    const restoreState =
      portalReturnScrollY == null
        ? undefined
        : {
            portalRestoreScrollY: portalReturnScrollY,
            portalRestoreShowcaseId: portalReturnShowcaseId,
            portalRestoreToken: restoreToken,
          };
    navigate(portalReturnUrl, { replace: true, state: restoreState });
  }, [navigate, portalLaunchSource, portalReturnScrollY, portalReturnShowcaseId, portalReturnUrl, restoreToken]);

  const handleSharePortal = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const shareUrl = window.location.href;
    const sharePayload = {
      title: '#GatoEncerrado',
      text: 'Te comparto este portal de #GatoEncerrado.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ description: 'Enlace del portal copiado.' });
        return;
      }

      window.prompt('Copia este enlace para compartir:', shareUrl);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast({ description: 'No pudimos compartir este portal por ahora.' });
    }
  }, []);

  const handleToggleAmbientAudio = useCallback(() => {
    // El control de audio ambient es una preferencia de UI, no un recurso con
    // GAT detrás — también debe funcionar para invitados sin cuenta.
    const audio = getHeroAmbientAudio();
    if (!audio) return;

    if (!ambientState.isMuted && audio.paused) {
      audio.volume = HERO_AMBIENT_DEFAULT_VOLUME;
      if (audio.volume > HERO_AMBIENT_MIN_AUDIBLE_VOLUME) {
        void resumeHeroAmbientPlayback({ targetVolume: HERO_AMBIENT_DEFAULT_VOLUME });
      }
      return;
    }

    toggleHeroAmbientMuted({ targetVolume: HERO_AMBIENT_DEFAULT_VOLUME });
  }, [ambientState.isMuted]);

  return (
    <div className="inline-flex items-center gap-2">
      <AnimatePresence>
        {showTransferChip && (
          <motion.span
            key="portal-transfer-chip"
            className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            +175 GAT transferidos
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleToggleAmbientAudio}
        aria-label={isAmbientAudible ? 'Silenciar sonido ambiente' : 'Activar sonido ambiente'}
        title={isAmbientAudible ? 'Silenciar sonido ambiente' : 'Activar sonido ambiente'}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
          isAmbientAudible
            ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
            : 'border-white/15 bg-slate-950/70 text-slate-300 hover:border-purple-300/50 hover:bg-slate-900/80 hover:text-white'
        }`}
      >
        {isAmbientAudible ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
      <button
        type="button"
        onClick={handleBackToSite}
        aria-label="Cerrar portal"
        title="Cerrar portal"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-slate-300 transition hover:border-purple-300/50 hover:bg-slate-900/80 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PortalHeaderActions;
