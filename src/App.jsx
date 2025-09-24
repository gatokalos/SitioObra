import React from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Team from '@/components/Team';
import Transmedia from '@/components/Transmedia';
import Instagram from '@/components/Instagram';
import NextShow from '@/components/NextShow';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import Curatorial from '@/components/Curatorial';

function App() {
  return (
    <>
      <Helmet>
        <title>#GatoEncerrado - Obra de Teatro Transmedia</title>
        <meta name="description" content="La historia de alguien que desaparece… y deja una huella emocional. Una experiencia teatral única que explora múltiples formatos transmedia." />
      </Helmet>
      
      <div className="min-h-screen overflow-x-hidden">
        <Header />
        
        <main>
          <Hero />
          <About />
          <Team />
           <Instagram />
          <Curatorial />
          <Transmedia />
          <NextShow />
          <Contact />
        </main>
        
        <Footer />
        <Toaster />
      </div>
    </>
  );
}

export default App;