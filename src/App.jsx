import React, { useEffect } from 'react';
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

const pageTitle = '#GatoEncerrado - Obra de Teatro transmedia';
const pageDescription =
  'La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmediaes.';

  
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
    <div className="min-h-screen overflow-x-hidden">
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
  );
}

export default App;
