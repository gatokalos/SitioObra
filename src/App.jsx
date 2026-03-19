import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import NextShow from '@/components/NextShow';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useEmailRedirect } from '@/hooks/useEmailRedirect';
import LoginToast from '@/components/LoginToast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import {
  createTransmediaIdempotencyKey,
  registerTransmediaCreditEvent,
} from '@/services/transmediaCreditsService';

const pageTitle = '#GatoEncerrado - Obra de Teatro transmedia';
const pageDescription =
  'La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmediaes.';
const TRANSMEDIA_UNLOCK_STORAGE_KEY = 'gatoencerrado:transmedia-unlocked:v1';
const TRANSMEDIA_UNLOCK_REWARD_AMOUNT = 7;
const TRANSMEDIA_FOCUS_KEYS = ['focus', 'appId', 'app_id', 'recommended_app_id'];
const TRANSMEDIA_DEEPLINK_REWARD_EVENT_KEY = 'showcase_boost:landing_deeplink';
const IS_UI_LAB_ENABLED =
  import.meta.env.DEV ||
  ['1', 'true', 'yes', 'on'].includes(String(import.meta.env.VITE_UI_LAB || '').toLowerCase());
const About = lazy(() => import('@/components/About'));
const ProvocaSection = lazy(() =>
  import('@/components/About').then((module) => ({ default: module.ProvocaSection }))
);
const loadTransmedia = () => import('@/components/Transmedia');
const Transmedia = lazy(loadTransmedia);
const AlianzaSocial = lazy(() => import('@/components/AlianzaSocial'));
const Team = lazy(() => import('@/components/Team'));
const Instagram = lazy(() => import('@/components/Instagram'));
const BlogContributionPrompt = lazy(() => import('@/components/BlogContributionPrompt'));
const Blog = lazy(() => import('@/components/Blog'));
const Bienvenida = lazy(() => import('@/pages/Bienvenida'));
const PortalLiteratura = lazy(() => import('@/pages/PortalLiteratura'));
const PortalArtesanias = lazy(() => import('@/pages/PortalArtesanias'));
const PortalVoz = lazy(() => import('@/pages/PortalVoz'));
const PortalMovimiento = lazy(() => import('@/pages/PortalMovimiento'));
const PortalGraficos = lazy(() => import('@/pages/PortalGraficos'));
const PortalCine = lazy(() => import('@/pages/PortalCine'));
const PortalSonoridades = lazy(() => import('@/pages/PortalSonoridades'));
const PortalJuegos = lazy(() => import('@/pages/PortalJuegos'));
const PortalOraculo = lazy(() => import('@/pages/PortalOraculo'));
const PortalEncuentros = lazy(() => import('./pages/PortalEncuentros.jsx'));
const LabHuella = lazy(() => import('@/pages/LabHuella'));

const SectionFallback = ({ id, minHeight = 320 }) => (
  <section id={id} className="relative" style={{ minHeight }}>
    <div className="container mx-auto px-6 py-12">
      <div className="h-28 rounded-2xl border border-white/10 bg-black/20" />
    </div>
  </section>
);

const RouteFallback = () => (
  <div className="min-h-screen bg-[#050507]" />
);

const PortalErrorFallback = () => (
  <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center gap-6 px-6 text-center">
    <p className="text-slate-300 text-base">Esta sección no pudo cargar.</p>
    <a href="/" className="text-slate-400 underline underline-offset-4 text-sm hover:text-white transition-colors">
      Volver al inicio
    </a>
  </div>
);

const DeferredSection = ({
  children,
  fallback,
  rootMargin = '600px 0px',
  idleDelayMs = 3000,
}) => {
  const mountRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return undefined;
    if (typeof window === 'undefined') {
      setIsReady(true);
      return undefined;
    }

    let observer = null;
    let timeoutId = null;
    let idleId = null;
    let isMounted = true;

    const reveal = () => {
      if (!isMounted) return;
      setIsReady(true);
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(reveal, { timeout: idleDelayMs });
    } else {
      timeoutId = window.setTimeout(reveal, idleDelayMs);
    }

    if (typeof window.IntersectionObserver === 'function' && mountRef.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          reveal();
          observer.disconnect();
        },
        { rootMargin, threshold: 0.01 },
      );
      observer.observe(mountRef.current);
    }

    return () => {
      isMounted = false;
      if (observer) observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [idleDelayMs, isReady, rootMargin]);

  return <div ref={mountRef}>{isReady ? children : fallback}</div>;
};

const BlogSection = () => {
  const blogData = useBlogPosts();

  return <Blog posts={blogData.posts} isLoading={blogData.isLoading} error={blogData.error} />;
};

const HERO_BACKGROUND_VARIANTS = {
  guest: {
    alt: 'Cabina teatral con cortinas rojas y un gato al centro',
    src: '/assets/gato-cabina.webp',
    className: 'absolute inset-0 h-full w-full object-cover',
    style: {
      opacity: 0.44,
      filter: 'contrast(78%) brightness(72%) saturate(88%)',
      objectPosition: '50% 28%',
      transform: 'translateY(12%) scale(1.4)',
    },
  },
  authenticated: {
    alt: 'Textura de telón de teatro de terciopelo oscuro',
    src: '/assets/bg-logo.png',
    className: 'absolute inset-0 h-full w-full object-cover mix-blend-pin-light',
    style: {
      opacity: 0.19,
      filter: 'contrast(25%) brightness(75%)',
    },
  },
};

const HERO_GUEST_SOFT_FOCUS_MASK =
  'radial-gradient(ellipse 34% 42% at 50% 43%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 42%, rgba(0,0,0,0) 76%)';

const HeroBackground = ({ isAuthenticated = false }) => {
  const [opacity, setOpacity] = useState(1);
  const backgroundVariant = isAuthenticated
    ? HERO_BACKGROUND_VARIANTS.authenticated
    : HERO_BACKGROUND_VARIANTS.guest;

  useEffect(() => {
    const FADE_DISTANCE = 900;
    let ticking = false;

    const updateOpacity = () => {
      if (document.documentElement.dataset.bienvenidaFade === 'true') {
        setOpacity(0);
        ticking = false;
        return;
      }
      if (document.documentElement.dataset.miniverseOpen === 'true') {
        setOpacity(1);
      } else {
        const nextOpacity = Math.max(0, 1 - window.scrollY / FADE_DISTANCE);
        setOpacity(nextOpacity);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOpacity);
        ticking = true;
      }
    };

    updateOpacity();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity, transition: 'opacity 0.45s ease' }}>
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-pink-900/50 via-transparent to-transparent blur-4xl"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-purple-700/60 via-transparent to-transparent blur-3xl"></div>
        </div>
        <img
          className={backgroundVariant.className}
          style={backgroundVariant.style}
          alt={backgroundVariant.alt}
          src={backgroundVariant.src}
          decoding="async"
          fetchpriority="low"
        />
        {!isAuthenticated ? (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[clamp(9rem,28vh,18rem)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(2,3,10,0.98) 0%, rgba(2,3,10,0.94) 26%, rgba(2,3,10,0.78) 52%, rgba(2,3,10,0.42) 78%, rgba(2,3,10,0) 100%)',
              }}
            />
            <img
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{
                ...backgroundVariant.style,
                opacity: 0.24,
                filter: 'blur(18px) brightness(28%) saturate(78%)',
                WebkitMaskImage: HERO_GUEST_SOFT_FOCUS_MASK,
                maskImage: HERO_GUEST_SOFT_FOCUS_MASK,
              }}
              alt=""
              aria-hidden="true"
              src={backgroundVariant.src}
              decoding="async"
              fetchpriority="low"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(2,3,10,0.62) 0%, rgba(2,3,10,0.18) 24%, rgba(2,3,10,0.08) 38%, rgba(2,3,10,0.08) 62%, rgba(2,3,10,0.18) 76%, rgba(2,3,10,0.62) 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 18%, rgba(2,3,10,0) 42%)',
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

const BienvenidaGate = () => null;

const HashAnchorScroller = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const hasPortalScrollRestore = Number.isFinite(Number(location.state?.portalRestoreScrollY));
    if (hasPortalScrollRestore) return undefined;
    const rawHash = location.hash || '';
    if (!rawHash.startsWith('#') || rawHash.length < 2) return undefined;

    const [hashAnchor] = rawHash.split('?');
    const anchorId = decodeURIComponent(hashAnchor.slice(1));
    let retries = 0;
    let timerId = null;
    let userHasScrolled = false;

    const onUserScroll = () => { userHasScrolled = true; };

    const scrollToAnchor = () => {
      const target = document.getElementById(anchorId);
      if (!target) return false;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    };

    const opts = { passive: true, once: true };
    window.addEventListener('wheel', onUserScroll, opts);
    window.addEventListener('touchmove', onUserScroll, opts);

    if (!scrollToAnchor()) {
      // Element not in DOM yet — retry until found (up to 2s)
      timerId = window.setInterval(() => {
        retries += 1;
        if (scrollToAnchor() || retries >= 20) {
          window.clearInterval(timerId);
        }
      }, 100);
    } else {
      // Element found but deferred sections above may shift layout — watch for drift
      timerId = window.setInterval(() => {
        retries += 1;
        if (userHasScrolled || retries >= 50) {
          window.clearInterval(timerId);
          return;
        }
        const target = document.getElementById(anchorId);
        if (!target) return;
        const { top } = target.getBoundingClientRect();
        if (top < -80) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    return () => {
      if (timerId) window.clearInterval(timerId);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
    };
  }, [location.hash, location.pathname, location.state]);

  return null;
};

const getLocationHashAnchor = (locationLike) => {
  const rawHash = String(locationLike?.hash || '');
  if (!rawHash.startsWith('#')) return '';
  const [hashAnchor] = rawHash.split('?');
  return decodeURIComponent(hashAnchor.slice(1)).trim().toLowerCase();
};

const hasFocusParams = (params) =>
  TRANSMEDIA_FOCUS_KEYS.some((key) => {
    const value = params.get(key);
    return typeof value === 'string' && value.trim().length > 0;
  });

const hasTransmediaDeepLinkIntent = (locationLike) => {
  const hashAnchor = getLocationHashAnchor(locationLike);
  if (hashAnchor === 'transmedia' || hashAnchor === 'apoya') {
    return true;
  }

  const hashRaw = String(locationLike?.hash || '');
  const [, hashQuery = ''] = hashRaw.split('?');
  if (hashAnchor === 'transmedia' && hashQuery) {
    const hashParams = new URLSearchParams(hashQuery);
    if (hasFocusParams(hashParams)) {
      return true;
    }
  }

  const searchParams = new URLSearchParams(locationLike?.search || '');
  return hasFocusParams(searchParams) || Boolean(searchParams.get('miniverso'));
};

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const { shouldShowToast, dismissToast, emailHash } = useEmailRedirect();
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [hasGuestUnlockedTransmedia, setHasGuestUnlockedTransmedia] = useState(() => {
    return safeGetItem(TRANSMEDIA_UNLOCK_STORAGE_KEY) === '1';
  });
  const isAuthenticated = Boolean(user);
  const canAccessTransmedia = isAuthenticated || hasGuestUnlockedTransmedia;
  const isMobileLoggedInPortalMode = isAuthenticated && isMobileViewport;
  const isPortalRoute = location.pathname.startsWith('/portal-');
  const hasForcedHomeTopOnBootRef = useRef(false);
  const appliedPortalRestoreTokenRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!('scrollRestoration' in window.history)) return undefined;
    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousMode;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (hasForcedHomeTopOnBootRef.current) return undefined;
    if (location.pathname !== '/') return undefined;
    if (location.hash) return undefined;
    hasForcedHomeTopOnBootRef.current = true;
    const rafId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isPortalRoute) return undefined;

    const restoreY = Number(location.state?.portalRestoreScrollY);
    if (!Number.isFinite(restoreY)) return undefined;

    const restoreToken =
      typeof location.state?.portalRestoreToken === 'string' && location.state.portalRestoreToken.trim()
        ? location.state.portalRestoreToken
        : `${location.pathname}${location.search}:${restoreY}`;

    if (appliedPortalRestoreTokenRef.current === restoreToken) {
      return undefined;
    }
    appliedPortalRestoreTokenRef.current = restoreToken;
    let cancelled = false;
    let userInteracted = false;
    const timers = [];
    const safeY = Math.max(0, restoreY);

    const restore = () => {
      if (cancelled || userInteracted) return;
      window.scrollTo({
        top: safeY,
        left: 0,
        behavior: 'auto',
      });
    };

    const markUserInteracted = () => {
      userInteracted = true;
    };

    const kickoffId = window.requestAnimationFrame(restore);
    const settleDelays = [120, 280, 520, 860, 1200];
    settleDelays.forEach((delay) => {
      const id = window.setTimeout(restore, delay);
      timers.push(id);
    });

    window.addEventListener('touchstart', markUserInteracted, { passive: true });
    window.addEventListener('wheel', markUserInteracted, { passive: true });
    window.addEventListener('keydown', markUserInteracted, { passive: true });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(kickoffId);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('touchstart', markUserInteracted);
      window.removeEventListener('wheel', markUserInteracted);
      window.removeEventListener('keydown', markUserInteracted);
    };
  }, [isPortalRoute, location.hash, location.pathname, location.search, location.state]);

  useEffect(() => {
    document.title = pageTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', pageDescription);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPortalRoute) return;
    const rafId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [isPortalRoute, location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileViewport(event.matches);
    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    if (!sectionId || typeof document === 'undefined') return;
    let retries = 0;
    const maxRetries = 28;
    const tryScroll = () => {
      const element = document.getElementById(sectionId);
      if (!element) return false;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    };

    if (tryScroll()) return;
    const timerId = window.setInterval(() => {
      retries += 1;
      if (tryScroll() || retries >= maxRetries) {
        window.clearInterval(timerId);
      }
    }, 100);
  }, []);

  const rewardTransmediaReveal = useCallback(async (eventKey, metadata = {}) => {
    if (!eventKey) return;
    const { error, state, duplicate } = await registerTransmediaCreditEvent({
      eventKey,
      amount: TRANSMEDIA_UNLOCK_REWARD_AMOUNT,
      oncePerIdentity: true,
      idempotencyKey: createTransmediaIdempotencyKey(eventKey),
      metadata: {
        source: 'landing_transmedia_reveal',
        ...metadata,
      },
    });
    if (error) {
      console.warn('[TransmediaReveal] No se pudo registrar premio por detonador:', { eventKey, error });
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:external-credit-event', {
          detail: {
            eventKey,
            duplicate: Boolean(duplicate),
            state: state && typeof state === 'object' ? state : null,
          },
        })
      );
    }
  }, []);

  const handleRevealTransmedia = useCallback(
    ({ trigger = 'unknown', targetId = 'transmedia', eventKey = null } = {}) => {
      if (!isAuthenticated && !hasGuestUnlockedTransmedia) {
        safeSetItem(TRANSMEDIA_UNLOCK_STORAGE_KEY, '1');
        setHasGuestUnlockedTransmedia(true);
      }
      if (eventKey) {
        void rewardTransmediaReveal(eventKey, {
          trigger,
          target_id: targetId,
          is_authenticated: isAuthenticated,
        });
      }
      if (targetId) {
        // Si el showcase aún no estaba en el DOM, Suspense necesita más tiempo para montar
        const delay = targetId === 'transmedia' && !hasGuestUnlockedTransmedia ? 600 : 90;
        window.setTimeout(() => {
          scrollToSection(targetId);
        }, delay);
      }
      return true;
    },
    [hasGuestUnlockedTransmedia, isAuthenticated, rewardTransmediaReveal, scrollToSection]
  );

  useEffect(() => {
    if (location.pathname !== '/') return;
    if (isAuthenticated || hasGuestUnlockedTransmedia) return;
    if (!hasTransmediaDeepLinkIntent(location)) return;
    const hashAnchor = getLocationHashAnchor(location);
    const targetId = hashAnchor === 'apoya' ? 'apoya' : 'transmedia';
    handleRevealTransmedia({
      trigger: 'deep-link',
      targetId,
      eventKey: TRANSMEDIA_DEEPLINK_REWARD_EVENT_KEY,
    });
  }, [handleRevealTransmedia, hasGuestUnlockedTransmedia, isAuthenticated, location]);

  useEffect(() => {
    if (!canAccessTransmedia) return undefined;
    if (typeof window === 'undefined') return undefined;
    let timeoutId = null;
    let idleId = null;
    let cancelled = false;

    const warmTransmedia = () => {
      if (cancelled) return;
      void loadTransmedia();
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(warmTransmedia, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(warmTransmedia, 700);
    }

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [canAccessTransmedia]);

  return (
    <>
      <BienvenidaGate />
      <HashAnchorScroller />
      <Routes>
      <Route
        path="/"
        element={(
          <div className="min-h-screen overflow-x-hidden relative">
            <HeroBackground isAuthenticated={isAuthenticated} />
            <div className="relative z-10">
              <Header
                showAllianceNav={true}
                showTransmediaNav={canAccessTransmedia && !isMobileLoggedInPortalMode}
              />

              <main className="pt-20 lg:pt-24">
                <Hero />

                {/* Alianza Social: pública, siempre visible después del Hero */}
                <SectionErrorBoundary
                  fallback={(
                    <section id="apoya" className="py-24 relative">
                      <div className="container mx-auto px-6">
                        <div className="glass-effect rounded-2xl p-8 text-center">
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Alianza Social</p>
                        </div>
                      </div>
                    </section>
                  )}
                >
                  <DeferredSection
                    rootMargin="400px 0px"
                    idleDelayMs={800}
                    fallback={<SectionFallback id="apoya" minHeight={700} />}
                  >
                    <Suspense fallback={<SectionFallback id="apoya" minHeight={700} />}>
                      <AlianzaSocial />
                    </Suspense>
                  </DeferredSection>
                </SectionErrorBoundary>

                <DeferredSection fallback={<SectionFallback id="about" minHeight={620} />}>
                  <Suspense fallback={<SectionFallback id="about" minHeight={620} />}>
                    <About />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback id="team" minHeight={980} />}>
                  <Suspense fallback={<SectionFallback id="team" minHeight={980} />}>
                    <Team />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback id="instagram" minHeight={1600} />}>
                  <Suspense fallback={<SectionFallback id="instagram" minHeight={1600} />}>
                    <Instagram />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback id="provoca" minHeight={900} />}>
                  <Suspense fallback={<SectionFallback id="provoca" minHeight={900} />}>
                    <ProvocaSection />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback id="dialogo-critico" minHeight={900} />}>
                  <Suspense fallback={<SectionFallback id="dialogo-critico" minHeight={900} />}>
                    <BlogSection />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback id="blog-contribuye" minHeight={700} />}>
                  <Suspense fallback={<SectionFallback id="blog-contribuye" minHeight={700} />}>
                    <BlogContributionPrompt onRevealTransmedia={handleRevealTransmedia} />
                  </Suspense>
                </DeferredSection>

                {/* Showcase Transmedia: sorpresa, se revela al expandir desde el Intermedio */}
                {canAccessTransmedia && !isMobileLoggedInPortalMode && (
                  <SectionErrorBoundary fallback={<SectionFallback id="transmedia" minHeight={1600} />}>
                    <Suspense fallback={<SectionFallback id="transmedia" minHeight={1600} />}>
                      <Transmedia />
                    </Suspense>
                  </SectionErrorBoundary>
                )}

                <NextShow />
                <Contact />
              </main>

              <Footer
                showAllianceNav={true}
                showTransmediaNav={canAccessTransmedia && !isMobileLoggedInPortalMode}
              />
              {shouldShowToast && (
                <LoginToast emailHash={emailHash} onDismiss={dismissToast} />
              )}
            </div>
          </div>
        )}
      />
      <Route path="/bienvenida" element={<Suspense fallback={<RouteFallback />}><Bienvenida /></Suspense>} />
      <Route path="/portal-literatura" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalLiteratura /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-artesanias" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalArtesanias /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-voz" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalVoz /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-movimiento" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalMovimiento /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-graficos" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalGraficos /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-cine" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalCine /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-sonoridades" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalSonoridades /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-juegos" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalJuegos /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-oraculo" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalOraculo /></Suspense></SectionErrorBoundary>} />
      <Route path="/portal-encuentros" element={<SectionErrorBoundary fallback={<PortalErrorFallback />}><Suspense fallback={<RouteFallback />}><PortalEncuentros /></Suspense></SectionErrorBoundary>} />
      {IS_UI_LAB_ENABLED ? (
        <Route path="/lab/huella" element={<Suspense fallback={<RouteFallback />}><LabHuella /></Suspense>} />
      ) : null}
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
