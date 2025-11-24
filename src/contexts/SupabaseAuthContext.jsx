import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { safeGetItem, safeRemoveItem } from '@/lib/safeStorage';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;

    const processRedirect = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = url.searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const errorDescription = url.searchParams.get('error_description');
      const shouldCleanHash =
        window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token');
      const cleanUrl = `${url.origin}${url.pathname}${shouldCleanHash ? '' : url.hash}`;

      const cleanup = () => {
        window.history.replaceState({}, document.title, cleanUrl);
      };

      if (errorDescription) {
        toast({
          variant: 'destructive',
          title: 'No pudimos iniciar sesión',
          description: errorDescription || 'El enlace no es válido. Intenta abrirlo en el navegador nativo.',
        });
        cleanup();
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) {
            toast({
              variant: 'destructive',
              title: 'No pudimos completar el login',
              description: error.message || 'Intenta abrir el enlace en el navegador por defecto.',
            });
          } else {
            handleSession(data.session);
          }
          cleanup();
        }
        return;
      }

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!cancelled) {
          if (error) {
            toast({
              variant: 'destructive',
              title: 'No pudimos completar el login',
              description: error.message || 'Intenta abrir el enlace en el navegador por defecto.',
            });
          } else {
            handleSession(data.session);
          }
          cleanup();
        }
      }
    };

    processRedirect();

    return () => {
      cancelled = true;
    };
  }, [handleSession, toast]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (session && safeGetItem('gatoencerrado:resume-contribution') === 'true') {
      window.dispatchEvent(new CustomEvent('gatoencerrado:resume-contribution'));
      safeRemoveItem('gatoencerrado:resume-contribution');
    }
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
