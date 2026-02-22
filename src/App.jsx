import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About, { ProvocaSection } from '@/components/About';
import SectionErrorBoundary from '@/components/SectionErrorBoundary';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useEmailRedirect } from '@/hooks/useEmailRedirect';
import LoginToast from '@/components/LoginToast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  hasSeenBienvenida,
  isBienvenidaPending,
  isBienvenidaSkip,
  isBienvenidaForceOnLogin,
  getBienvenidaFlowGoal,
  clearBienvenidaForceOnLogin,
  clearBienvenidaSkip,
  setBienvenidaPending,
  setBienvenidaReturnPath,
} from '@/lib/bienvenida';
import { safeGetItem } from '@/lib/safeStorage';

const pageTitle = '#GatoEncerrado - Obra de Teatro transmedia';
const pageDescription =
  'La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmediaes.';
const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';
const IS_UI_LAB_ENABLED =
  import.meta.env.DEV ||
  ['1', 'true', 'yes', 'on'].includes(String(import.meta.env.VITE_UI_LAB || '').toLowerCase());
// Hot toggle: pause auto-launch of Bienvenida after login without deleting the flow.
const ENABLE_BIENVENIDA_AUTO_LAUNCH = false;
const Transmedia = lazy(() => import('@/components/Transmedia'));
const Team = lazy(() => import('@/components/Team'));
const Instagram = lazy(() => import('@/components/Instagram'));
const BlogContributionPrompt = lazy(() => import('@/components/BlogContributionPrompt'));
const Blog = lazy(() => import('@/components/Blog'));
const NextShow = lazy(() => import('@/components/NextShow'));
const Contact = lazy(() => import('@/components/Contact'));
const Footer = lazy(() => import('@/components/Footer'));
const Bienvenida = lazy(() => import('@/pages/Bienvenida'));
const PortalLectura = lazy(() => import('@/pages/PortalLectura'));
const PortalArtesanias = lazy(() => import('@/pages/PortalArtesanias'));
const PortalVoz = lazy(() => import('@/pages/PortalVoz'));
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

const HeroBackground = () => {
  const [opacity, setOpacity] = useState(1);

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
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-pin-light"
          style={{ filter: 'contrast(15%) brightness(75%)' }}
          alt="Textura de telón de teatro de terciopelo oscuro"
          src="/assets/bg-logo.png"
          decoding="async"
          fetchPriority="low"
        />
      </div>
    </div>
  );
};

const BienvenidaGate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const bienvenidaUrl = import.meta.env.VITE_BIENVENIDA_URL;

  const currentPath = useMemo(() => {
    const search = location.search || '';
    const hash = location.hash || '';
    return `${location.pathname}${search}${hash}`;
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (!ENABLE_BIENVENIDA_AUTO_LAUNCH) return;
    if (!bienvenidaUrl) return;
    if (location.pathname === '/bienvenida') return;
    if (location.pathname.startsWith('/lab/')) return;
    if (isBienvenidaPending()) return;
    if (loading || !user) return;
    const flowGoal = getBienvenidaFlowGoal();
    const isSubscriptionGoal = flowGoal === 'subscription';
    if (safeGetItem(LOGIN_RETURN_KEY) && !isSubscriptionGoal) return;
    const forceOnLogin = isBienvenidaForceOnLogin();
    if (isBienvenidaSkip()) {
      clearBienvenidaSkip();
    }
    if (!forceOnLogin && !isSubscriptionGoal && hasSeenBienvenida(user.id)) return;

    setBienvenidaPending();
    clearBienvenidaForceOnLogin();
    setBienvenidaReturnPath(isSubscriptionGoal ? '/#cta' : currentPath);
    navigate(isSubscriptionGoal ? '/bienvenida?goal=subscription' : '/bienvenida', { replace: true });
  }, [currentPath, loading, location.pathname, navigate, user, bienvenidaUrl]);

  return null;
};

const HashAnchorScroller = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const rawHash = location.hash || '';
    if (!rawHash.startsWith('#') || rawHash.length < 2) return undefined;

    const anchorId = decodeURIComponent(rawHash.slice(1));
    let retries = 0;
    let timerId = null;

    const scrollToAnchor = () => {
      const target = document.getElementById(anchorId);
      if (!target) return false;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    };

    if (scrollToAnchor()) return undefined;

    timerId = window.setInterval(() => {
      retries += 1;
      if (scrollToAnchor() || retries >= 20) {
        window.clearInterval(timerId);
      }
    }, 100);

    return () => {
      if (timerId) window.clearInterval(timerId);
    };
  }, [location.hash, location.pathname]);

  return null;
};

  
function App() {
  const { shouldShowToast, dismissToast, emailHash } = useEmailRedirect();

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

  return (
    <>
      <BienvenidaGate />
      <HashAnchorScroller />
      <Routes>
      <Route
        path="/"
        element={(
          <div className="min-h-screen overflow-x-hidden relative">
            <HeroBackground />
            <div className="relative z-10">
              <Header />

              <main className="pt-20 lg:pt-24">
                <Hero />
                <SectionErrorBoundary
                  fallback={(
                    <section id="transmedia" className="py-24 relative">
                      <div className="container mx-auto px-6">
                        <div className="glass-effect rounded-2xl p-8 text-center">
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Narrativa Expandida</p>
                          <h3 className="font-display text-3xl text-slate-100 mt-3">Vitrinas temporalmente no disponibles</h3>
                          <p className="text-slate-300/80 mt-4">
                            Recarga la página para intentar nuevamente.
                          </p>
                        </div>
                      </div>
                    </section>
                  )}
                >
                  <DeferredSection
                    rootMargin="750px 0px"
                    fallback={<SectionFallback id="transmedia" minHeight={900} />}
                  >
                    <Suspense fallback={<SectionFallback id="transmedia" minHeight={900} />}>
                      <Transmedia />
                    </Suspense>
                  </DeferredSection>
                </SectionErrorBoundary>
                <About />
                <DeferredSection fallback={<SectionFallback minHeight={380} />}>
                  <Suspense fallback={<SectionFallback minHeight={380} />}>
                    <Team />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback minHeight={380} />}>
                  <Suspense fallback={<SectionFallback minHeight={380} />}>
                    <Instagram />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback minHeight={340} />}>
                  <Suspense fallback={<SectionFallback minHeight={340} />}>
                    <BlogContributionPrompt />
                  </Suspense>
                </DeferredSection>
                <ProvocaSection />
                <DeferredSection fallback={<SectionFallback minHeight={520} />}>
                  <Suspense fallback={<SectionFallback minHeight={520} />}>
                    <BlogSection />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback minHeight={340} />}>
                  <Suspense fallback={<SectionFallback minHeight={340} />}>
                    <NextShow />
                  </Suspense>
                </DeferredSection>
                <DeferredSection fallback={<SectionFallback minHeight={300} />}>
                  <Suspense fallback={<SectionFallback minHeight={300} />}>
                    <Contact />
                  </Suspense>
                </DeferredSection>
              </main>

              <DeferredSection fallback={<SectionFallback minHeight={220} />}>
                <Suspense fallback={<SectionFallback minHeight={220} />}>
                  <Footer />
                </Suspense>
              </DeferredSection>
              {shouldShowToast && (
                <LoginToast emailHash={emailHash} onDismiss={dismissToast} />
              )}
              <Toaster />
            </div>
          </div>
        )}
      />
      <Route path="/bienvenida" element={<Suspense fallback={<RouteFallback />}><Bienvenida /></Suspense>} />
      <Route path="/portal-lectura" element={<Suspense fallback={<RouteFallback />}><PortalLectura /></Suspense>} />
      <Route path="/portal-artesanias" element={<Suspense fallback={<RouteFallback />}><PortalArtesanias /></Suspense>} />
      <Route path="/portal-voz" element={<Suspense fallback={<RouteFallback />}><PortalVoz /></Suspense>} />
      {IS_UI_LAB_ENABLED ? (
        <Route path="/lab/huella" element={<Suspense fallback={<RouteFallback />}><LabHuella /></Suspense>} />
      ) : null}
      </Routes>
    </>
  );
}

export default App;
