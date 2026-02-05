import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PortalAuthButton = ({ onOpenLogin }) => {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileName =
    user?.user_metadata?.alias ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : '');
  const simplifiedName = profileName ? profileName.trim().split(/\s+/)[0] : '';
  const greetingLabel = user ? `Hola ${simplifiedName || 'gato'}` : '';
  const statusDotClass = user ? 'bg-emerald-400' : 'bg-slate-600';

  const handleLogout = useCallback(async () => {
    if (!user) {
      onOpenLogin?.();
      return;
    }
    const { error } = await signOut();
    if (error) {
      console.error('[PortalAuthButton] Error al cerrar sesión:', error);
    }
    setIsProfileMenuOpen(false);
  }, [onOpenLogin, signOut, user]);

  const toggleMenu = useCallback(() => {
    setIsProfileMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;
    const handleClickAway = (event) => {
      if (!event.target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickAway);
    return () => window.removeEventListener('click', handleClickAway);
  }, [isProfileMenuOpen]);

  const loginButton = useMemo(() => {
    if (user) {
      return (
        <button
          type="button"
          onClick={toggleMenu}
          className="inline-flex items-center text-xs font-semibold text-slate-100 transition sm:text-sm underline underline-offset-4 decoration-slate-400/40 hover:text-white hover:decoration-emerald-300/60"
        >
          {greetingLabel}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onOpenLogin}
        className="inline text-xs font-semibold text-slate-100 sm:text-sm"
        aria-label="Iniciar sesión"
      >
        Iniciar sesión
      </button>
    );
  }, [greetingLabel, onOpenLogin, toggleMenu, user]);

  return (
    <div className="relative" data-profile-menu>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
        {loginButton}
      </div>
      {user && isProfileMenuOpen ? (
        <div className="absolute left-0 mt-2 w-40 rounded-xl border border-white/10 bg-black/90 py-2 text-sm text-slate-100 shadow-xl">
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PortalAuthButton;
