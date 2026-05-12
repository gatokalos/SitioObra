import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReserveModal from '@/components/ReserveModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';
import { resolvePortalReturnTarget } from '@/lib/portalNavigation';

const PortalEncuentros = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const { portalReturnUrl, portalReturnScrollY, portalReturnShowcaseId, restoreToken } =
    resolvePortalReturnTarget(
    location.state
  );

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const handleClose = useCallback(() => {
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

  if (!isMobile) {
    return (
      <>
        <ReserveModal
          open
          onClose={handleClose}
          mode="offseason"
          renderMode="modal"
        />
        {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="w-full py-8 md:py-12">
        <div className="flex items-start justify-between gap-4 px-4 sm:px-6">
          <PortalAuthButton onOpenLogin={handleOpenLogin} />
          <PortalHeaderActions />
        </div>

        <ReserveModal
          open
          onClose={handleClose}
          mode="offseason"
          renderMode="page"
        />
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
    </div>
  );
};

export default PortalEncuentros;
