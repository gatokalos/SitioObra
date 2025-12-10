import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/SupabaseAuthContext';
import { trackMetric } from '@/lib/trackMetric';
import {
  EMAIL_REDIRECT_SOURCE,
  EMAIL_REDIRECT_STORAGE_KEY,
} from '@/lib/emailRedirectConfig';

const EMAIL_REGEX = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;

const sanitizeEmail = (value) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return EMAIL_REGEX.test(normalized) ? normalized : null;
};

const hashEmail = async (value) => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return null;
  }
  const encoder = new TextEncoder();
  const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const useEmailRedirect = () => {
  const { user } = useAuth();
  const [shouldShowToast, setShouldShowToast] = useState(false);
  const [emailHash, setEmailHash] = useState(null);
  const hasLoggedRef = useRef(false);

  const dismissToast = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EMAIL_REDIRECT_STORAGE_KEY, 'true');
    }
    setShouldShowToast(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawSearch = window.location.search;
    const initialParams = new URLSearchParams(rawSearch);
    const parsedSource = initialParams.get('source');
    const hasSeenFlag = window.localStorage.getItem(EMAIL_REDIRECT_STORAGE_KEY) === 'true';
    const isAuthenticated = Boolean(user);
    const shouldShowDecision =
      !isAuthenticated && parsedSource === EMAIL_REDIRECT_SOURCE && !hasSeenFlag;

    if (!hasLoggedRef.current) {
      console.debug('useEmailRedirect rawSearch', rawSearch);
      console.debug('useEmailRedirect source constant', EMAIL_REDIRECT_SOURCE);
      console.debug('useEmailRedirect parsed source', parsedSource);
      console.debug('useEmailRedirect hasSeen', hasSeenFlag);
      console.debug('useEmailRedirect isAuthenticated', isAuthenticated);
      console.debug('useEmailRedirect shouldShowToast decision', shouldShowDecision);
      hasLoggedRef.current = true;
    }

    if (user) return;
    let isMounted = true;

    const proceed = async () => {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('source');

      if (source !== EMAIL_REDIRECT_SOURCE) return;

      const alreadySeen = window.localStorage.getItem(EMAIL_REDIRECT_STORAGE_KEY) === 'true';
      if (alreadySeen) {
        params.delete('source');
        params.delete('email');
        const cleanedSearch = params.toString();
        const sanitizedUrl = `${window.location.pathname}${
          cleanedSearch ? `?${cleanedSearch}` : ''
        }${window.location.hash}`;
        window.history.replaceState({}, document.title, sanitizedUrl);
        return;
      }

      const email = sanitizeEmail(params.get('email'));
      const hashedEmail = email ? await hashEmail(email) : null;

      if (!isMounted) return;
      setEmailHash(hashedEmail);
      setShouldShowToast(true);
      window.localStorage.setItem(EMAIL_REDIRECT_STORAGE_KEY, 'true');
      void trackMetric('email_redirect_impression', EMAIL_REDIRECT_SOURCE, hashedEmail);

      params.delete('source');
      params.delete('email');
      const cleanedSearch = params.toString();
      const sanitizedUrl = `${window.location.pathname}${
        cleanedSearch ? `?${cleanedSearch}` : ''
      }${window.location.hash}`;
      if (!isMounted) return;
      window.history.replaceState({}, document.title, sanitizedUrl);
    };

    void proceed();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { shouldShowToast, dismissToast, emailHash };
};
