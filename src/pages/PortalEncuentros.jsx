import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReserveModal from '@/components/ReserveModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';
import PortalHeaderActions from '@/components/portal/PortalHeaderActions';

const PortalEncuentros = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const isAuthenticated = Boolean(user);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const handleClose = useCallback(() => {
    navigate('/#hero', { replace: true });
  }, [navigate]);

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
