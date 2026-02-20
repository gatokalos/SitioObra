import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { safeGetItem, safeRemoveItem, safeStorage } from '@/lib/safeStorage';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const redirectLockRef = useRef(false);

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSupabaseAuthStorage = useCallback(() => {
    try {
      const keysToRemove = [];
      const total = Number(safeStorage?.length || 0);
      for (let i = 0; i < total; i += 1) {
        const key = safeStorage?.key?.(i);
        if (typeof key !== 'string') continue;
        if (/^sb-.*-auth-token$/.test(key) || /^sb-.*-code-verifier$/.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => safeRemoveItem(key));
    } catch {
      // ignore storage cleanup failures
    }
  }, []);

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

      // In React StrictMode (dev), effects can run twice and consume PKCE code twice.
      // Lock by code/token fingerprint so we only exchange once per redirect payload.
      const fingerprint = code
        ? `code:${code}`
        : accessToken && refreshToken
          ? `token:${accessToken.slice(0, 24)}`
          : null;
      if (!errorDescription && !fingerprint) {
        return;
      }
      if (redirectLockRef.current) {
        return;
      }
      if (fingerprint) {
        const seen = window.sessionStorage?.getItem('gatoencerrado:auth-redirect-fingerprint');
        if (seen === fingerprint) {
          cleanup();
          return;
        }
        window.sessionStorage?.setItem('gatoencerrado:auth-redirect-fingerprint', fingerprint);
      }
      redirectLockRef.current = true;

      try {
        if (errorDescription) {
          toast({
            variant: 'destructive',
            title: 'No pudimos iniciar sesión',
            description: errorDescription || 'El enlace no es válido. Intenta abrirlo en el navegador nativo.',
          });
          return;
        }

        if (!accessToken && !refreshToken && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;

          if (error) {
            const msg = String(error?.message || '').toLowerCase();
            // PKCE flow can be consumed by another tab/attempt; fallback to current session.
            const { data: current } = await supabase.auth.getSession();
            if (current?.session) {
              handleSession(current.session);
              return;
            }
            if (msg.includes('invalid flow state') || msg.includes('no valid flow state')) {
              toast({
                variant: 'destructive',
                title: 'Sesión expirada durante el acceso',
                description: 'Vuelve a tocar "Iniciar sesión". El enlace anterior ya no es válido.',
              });
              return;
            }
            if (msg.includes('grant_type=pkce') || msg.includes('404') || msg.includes('not found')) {
              toast({
                variant: 'destructive',
                title: 'No pudimos completar el acceso',
                description: 'Reintenta el login. Estamos usando retorno directo del proveedor.',
              });
              return;
            }
            toast({
              variant: 'destructive',
              title: 'No pudimos completar el login',
              description: error.message || 'Intenta abrir el enlace en el navegador por defecto.',
            });
            return;
          }

          handleSession(data.session);
          return;
        }

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;

          if (error) {
            toast({
              variant: 'destructive',
              title: 'No pudimos completar el login',
              description: error.message || 'Intenta abrir el enlace en el navegador por defecto.',
            });
            return;
          }

          handleSession(data.session);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error?.message || 'No pudimos completar el login. Intenta abrir el enlace nuevamente.';
          toast({
            variant: 'destructive',
            title: 'No pudimos completar el login',
            description: message,
          });
        }
      } finally {
        redirectLockRef.current = false;
        cleanup();
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
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    if (!currentSession) {
      clearSupabaseAuthStorage();
      await handleSession(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut({ scope: 'local' });

    const errorCode = String(error?.code || error?.error_code || '').toLowerCase();
    const errorMessage = String(error?.message || '').toLowerCase();
    const isSessionNotFound =
      errorCode === 'session_not_found' ||
      errorMessage.includes('session_not_found') ||
      errorMessage.includes('session from session_id claim in jwt does not exist');

    if (isSessionNotFound) {
      clearSupabaseAuthStorage();
      await handleSession(null);
      return { error: null };
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [clearSupabaseAuthStorage, handleSession, toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
