import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Transmedia from '@/components/Transmedia';
import Blog from '@/components/Blog';
import Team from '@/components/Team';
import BlogContributionPrompt from '@/components/BlogContributionPrompt';
import Instagram from '@/components/Instagram';
import NextShow from '@/components/NextShow';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useEmailRedirect } from '@/hooks/useEmailRedirect';
import LoginToast from '@/components/LoginToast';
import PortalLectura from '@/pages/PortalLectura';
import PortalArtesanias from '@/pages/PortalArtesanias';
import PortalVoz from '@/pages/PortalVoz';
import bgLogo from '@/assets/bg-logo.png';

const pageTitle = '#GatoEncerrado - Obra de Teatro transmedia';
const pageDescription =
  'La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmediaes.';

const HeroBackground = () => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const FADE_DISTANCE = 900;
    let ticking = false;

    const updateOpacity = () => {
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
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity }}>
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-pink-900/50 via-transparent to-transparent blur-4xl"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-purple-700/60 via-transparent to-transparent blur-3xl"></div>
        </div>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-pin-light"
          style={{ filter: 'contrast(15%) brightness(75%)' }}
          alt="Textura de telón de teatro de terciopelo oscuro"
          src={bgLogo}
        />
      </div>
    </div>
  );
};

  
function App() {
  const blogData = useBlogPosts();
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
                <About />
                <Team />
                <Instagram />
                <BlogContributionPrompt />
                <Blog posts={blogData.posts} isLoading={blogData.isLoading} error={blogData.error} />
                <Transmedia />
                <NextShow />
                <Contact />
              </main>

              <Footer />
              {shouldShowToast && (
                <LoginToast emailHash={emailHash} onDismiss={dismissToast} />
              )}
              <Toaster />
            </div>
          </div>
        )}
      />
      <Route path="/portal-lectura" element={<PortalLectura />} />
      <Route path="/portal-artesanias" element={<PortalArtesanias />} />
      <Route path="/portal-voz" element={<PortalVoz />} />
    </Routes>
  );
}

export default App;
