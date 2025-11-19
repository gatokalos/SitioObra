import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Transmedia from '@/components/Transmedia';
import Blog from '@/components/Blog';
import Team from '@/components/Team';
import Instagram from '@/components/Instagram';
import NextShow from '@/components/NextShow';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { useBlogPosts } from '@/hooks/useBlogPosts';

const pageTitle = '#GatoEncerrado - Obra de Teatro Transmedia';
const pageDescription =
  'La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmedia.';

function App() {
  const blogData = useBlogPosts();

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
        <Blog posts={blogData.posts} isLoading={blogData.isLoading} error={blogData.error} />
        <Transmedia />
        <Instagram />
        <NextShow />
        <Contact />
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
