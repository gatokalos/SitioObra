import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { Send, Volume2, VolumeX, X } from 'lucide-react';
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

const DEFAULT_RETURN_URL = '/?heroTab=experiences#hero';

const PortalHeaderActions = ({ returnUrl = DEFAULT_RETURN_URL }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const ambientState = useSyncExternalStore(
    subscribeHeroAmbient,
    getHeroAmbientState,
    getHeroAmbientState
  );
  const { portalReturnUrl, portalReturnScrollY, portalReturnShowcaseId, restoreToken } = useMemo(
    () => resolvePortalReturnTarget(location.state, returnUrl),
    [location.state, returnUrl]
  );

  const handleBackToSite = useCallback(() => {
    const restoreState =
      portalReturnScrollY == null
        ? undefined
        : {
            portalRestoreScrollY: portalReturnScrollY,
            portalRestoreShowcaseId: portalReturnShowcaseId,
            portalRestoreToken: restoreToken,
          };
    navigate(portalReturnUrl, { replace: true, state: restoreState });
  }, [navigate, portalReturnScrollY, portalReturnShowcaseId, portalReturnUrl, restoreToken]);

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
    if (!user) return;
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
  }, [ambientState.isMuted, user]);

  return (
    <div className="inline-flex items-center gap-2">
      {user ? (
        <button
          type="button"
          onClick={handleToggleAmbientAudio}
          aria-label={ambientState.isMuted ? 'Activar sonido ambiente' : 'Silenciar sonido ambiente'}
          title={ambientState.isMuted ? 'Activar sonido ambiente' : 'Silenciar sonido ambiente'}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
            ambientState.isMuted
              ? 'border-white/15 bg-slate-950/70 text-slate-300 hover:border-purple-300/50 hover:bg-slate-900/80 hover:text-white'
              : 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
          }`}
        >
          {ambientState.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleSharePortal}
        aria-label="Compartir portal"
        title="Compartir portal"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-slate-300 transition hover:border-purple-300/50 hover:bg-slate-900/80 hover:text-white"
      >
        <Send size={14} />
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
