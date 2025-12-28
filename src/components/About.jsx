import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Headphones, Quote, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  getTrailerPublicUrl,
  TRAILER_FALLBACK_URL,
  TRAILER_FALLBACK_URL_MOBILE,
  TRAILER_FALLBACK_URL_SQUARE,
} from '@/services/trailerService';
import ReserveModal from '@/components/ReserveModal';

const aboutParagraphs = [
  {
    text: `Es un gato encerrado existe como obra escénica y como estado emocional del dolor humano. 
    
    Nuestra obra se desdobla: lo que sucede en el escenario también ocurre en la mente de quien la mira. En ella, Silvestre y su terapeuta exploran los sueños lúcidos para confrontar el miedo, la desconexión y la fragilidad de la mente. 
    
    Pero la experiencia no termina en el teatro: también es una narrativa expandida con otros lenguajes artísticos —cine, cómic, experiencias interactivas y poesía— que laten dentro del universo #GatoEncerrado.`,
    
    className:
      'text-lg leading-relaxed font-light whitespace-pre-line bg-gradient-to-b from-violet-300/95 via-slate-200/80 to-slate-300/100 text-transparent bg-clip-text',
  },

];

const testimonials = [
  {
    quote:
      '“Salí de la función y fue como si despertara con nuevos recuerdos. Es un gato encerrado me obligó a conversar con mis propios vacíos.”',
    author: 'Maru Navarro',
    role: 'Espectadora / Tijuana',
  },
  {
    quote:
      '“Es un Gato Encerrado nos recuerda que el teatro puede ser también archivo emocional y dispositivo de memoria.”',
    author: 'Dr. Luis Miguel Sánchez',
    role: 'Crítico invitado',
  },
];

const inviteMessage = `Hola 🐾
Quiero invitarte a ver *Es un gato encerrado*.
Mira el tráiler aquí: https://esungatoencerrado.com/trailer
Si te late, vamos. 💜`;

const About = () => {
  const [trailer, setTrailer] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveIntent, setReserveIntent] = useState('preventa');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const [isTabletLandscape, setIsTabletLandscape] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px) and (max-width: 1180px) and (orientation: landscape)').matches
  );
  const [isTabletPortrait, setIsTabletPortrait] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const tabletLandscapeQuery = window.matchMedia(
      '(min-width: 768px) and (max-width: 1180px) and (orientation: landscape)'
    );
    const tabletPortraitQuery = window.matchMedia(
      '(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)'
    );
    const handleChange = (event) => setIsMobile(event.matches);
    const handleTabletLandscapeChange = (event) => setIsTabletLandscape(event.matches);
    const handleTabletPortraitChange = (event) => setIsTabletPortrait(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      tabletLandscapeQuery.addEventListener('change', handleTabletLandscapeChange);
      tabletPortraitQuery.addEventListener('change', handleTabletPortraitChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      tabletLandscapeQuery.addListener(handleTabletLandscapeChange);
      tabletPortraitQuery.addListener(handleTabletPortraitChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
        tabletLandscapeQuery.removeEventListener('change', handleTabletLandscapeChange);
        tabletPortraitQuery.removeEventListener('change', handleTabletPortraitChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
        tabletLandscapeQuery.removeListener(handleTabletLandscapeChange);
        tabletPortraitQuery.removeListener(handleTabletPortraitChange);
      }
    };
  }, []);

  const trailerPreviewSrc = isTabletPortrait || isTabletLandscape
    ? TRAILER_FALLBACK_URL_SQUARE
    : isMobile
      ? TRAILER_FALLBACK_URL_MOBILE
      : TRAILER_FALLBACK_URL;

  const handleOpenReserve = useCallback((intent) => {
    setReserveIntent(intent);
    setIsReserveOpen(true);
  }, []);


    const handleCloseReserve = useCallback(() => {
    setIsReserveOpen(false);
  }, []);

  const handleScrollToContacts = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  const handleWatchTrailer = useCallback(async () => {
    if (isTrailerLoading) {
      return;
    }

    const preferredName = isMobile || isTabletLandscape ? 'trailer_landing_v' : 'trailerlanding';
    const hasMatchingTrailer =
      trailer?.url &&
      (trailer.name?.toLowerCase().includes(preferredName) || trailer.url.toLowerCase().includes(preferredName));

    if (hasMatchingTrailer) {
      setIsTrailerOpen(true);
      return;
    }

    try {
      setIsTrailerLoading(true);
      const trailerData = await getTrailerPublicUrl(preferredName);

      if (trailerData?.url) {
        let finalTrailer = trailerData;

        if (isMobile && !trailerData.url.toLowerCase().includes('trailer_landing_v')) {
          finalTrailer = {
            ...trailerData,
            url: TRAILER_FALLBACK_URL_MOBILE,
            name: 'trailer_landing_v.mp4',
          };
        }

        setTrailer(finalTrailer);
        setIsTrailerOpen(true);
      } else {
        toast({ description: 'El tráiler aún no está disponible. Intenta más tarde.' });
      }
    } catch (err) {
      console.error('Error al obtener el tráiler:', err);
      toast({ description: 'No se pudo cargar el tráiler. Inténtalo de nuevo más tarde.' });
    } finally {
      setIsTrailerLoading(false);
    }
  }, [isTrailerLoading, isMobile, trailer]);

  const handleCloseTrailer = useCallback(() => {
    setIsTrailerOpen(false);
    const video = document.getElementById('gato-encerrado-trailer');
    if (video && typeof video.pause === 'function') {
      video.pause();
    }
  }, []);

  const handleInvite = useCallback(async () => {
    const shareData = {
      title: 'Es un gato encerrado',
      url: 'https://esungatoencerrado.com/trailer',
      text: inviteMessage,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Error al compartir invitación:', error);
      }
    }

    setIsInviteModalOpen(true);
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    setIsInviteModalOpen(false);
  }, []);

  const handleShareOption = useCallback((type) => {
    const encodedMessage = encodeURIComponent(inviteMessage);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent('Te invito a ver Es un gato encerrado')}&body=${encodedMessage}`;
    const targetUrl = type === 'whatsapp' ? whatsappUrl : emailUrl;

    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }

    setIsInviteModalOpen(false);
  }, []);

  return (
    <>
    <section id="about" className="py-24 relative">
      <div className="section-divider mb-24"></div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            Sobre la Obra
          </h2>
          <div className="max-w-3xl mx-auto">
            {aboutParagraphs.map((paragraph) => (
              <p
                key={paragraph.text.slice(0, 40)}
                className={`${paragraph.className} ${paragraph.extraClass ?? ''}`}
              >
                {paragraph.text}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="glass-effect rounded-2xl p-8 md:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <video
                className="w-full h-96 object-cover rounded-xl shadow-2xl shadow-black/50"
                aria-label="Escena de la obra #GatoEncerrado, luz tenue y misteriosa"
                src={trailerPreviewSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" aria-hidden="true" />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="font-display text-3xl font-medium text-slate-100 mb-6">
                La Mente de Silvestre
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-8 font-light">
                Silvestre <strong>transforma su mente</strong> en escenario. Aquí, lo real y lo imaginario ya no compiten. Y tú —espectador, visitante, cómplice— puedes entrar sin tocar la puerta, porque quizás… tú también tienes <i>un gato encerrado</i> en el pecho.
              </p>
              <div className="flex flex-col lg:flex-row gap-4">
                <Button
                  onClick={handleWatchTrailer}
                  disabled={isTrailerLoading}
                  className="relative bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow"
                >
                  <Headphones size={20} />
                  {isTrailerLoading ? 'Cargando…' : 'Escucha el Tráiler'}
                 
                </Button>
                <Button
                  variant="outline"
                  onClick={handleInvite}
                  className="border-slate-100/20 text-slate-200 hover:bg-slate-100/10 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  <Send size={20} />
                  Invita a un cómplice
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mt-16 glass-effect rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-center">
            <div>
              <p className="uppercase tracking-[0.35em] text-xs text-slate-400/80 mb-4">Perspectivas del público</p>
              <h3 className="font-display text-3xl text-slate-100 mb-6 italic">
                ¿Qué nos provoca esta obra?
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-6 font-light">
                Reunimos testimonios, críticas y preguntas abiertas que siguen vibrando después de la función. Puedes leer las voces que ya habitan este espacio o abrir una nueva compartiendo tu experiencia.
              </p>
              <Button
                variant="outline"
                onClick={handleScrollToContacts}
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 w-full sm:w-auto whitespace-normal break-words text-center leading-snug"
              >
                Sumar mi voz
              </Button>
            </div>
            <div className="space-y-6">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                  <Quote className="text-purple-300 mb-4" size={28} />
                  <p className="text-slate-200 italic leading-relaxed mb-4">{item.quote}</p>
                  <div className="text-sm text-slate-400">
                    <p className="text-slate-200 font-semibold">{item.author}</p>
                    <p>{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isTrailerOpen && trailer?.url && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              onClick={handleCloseTrailer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className={`relative z-10 w-full h-full ${isMobile ? 'max-w-4xl p-4' : 'p-6 sm:p-8'} overflow-hidden bg-slate-950/95 backdrop-blur-xl`}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border border-white/10 rounded-2xl bg-black/40 text-slate-200 uppercase tracking-[0.35em] text-xs shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                  <span>Tráiler #GatoEncerrado</span>
                  <button
                    onClick={handleCloseTrailer}
                    className="text-slate-300 hover:text-white transition"
                    aria-label="Cerrar tráiler"
                  >
                    ✕
                  </button>
                </div>
                {/*
                  Mantiene letterbox en desktop y usa formato vertical (9/16) en móvil
                  cuando el tráiler es la versión vertical.
                */}
                {(() => {
                  const isVerticalTrailer =
                    isMobile &&
                    (trailer?.url?.toLowerCase().includes('trailer_landing_v') ||
                      trailer?.name?.toLowerCase().includes('trailer_landing_v'));
                  const aspectClass = isVerticalTrailer ? 'aspect-[9/16]' : 'aspect-video';

                  return (
                    <div
                      className={`relative w-full ${aspectClass} bg-black rounded-2xl overflow-hidden mx-auto flex items-center justify-center shadow-[0_18px_60px_rgba(0,0,0,0.55)]`}
                    >
                      <video
                        id="gato-encerrado-trailer"
                        key={trailer.url}
                        src={trailer.url}
                        controls
                        autoPlay
                        className="h-full w-full object-contain"
                      />
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
        {isInviteModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              onClick={handleCloseInviteModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 backdrop-blur-xl p-6 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Compartir</p>
                  <h4 className="text-slate-100 font-display text-2xl">Invita a alguien</h4>
                </div>
                <button
                  onClick={handleCloseInviteModal}
                  className="text-slate-300 hover:text-white transition"
                  aria-label="Cerrar invitación"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-300/80 whitespace-pre-line text-sm mb-6 font-light">{inviteMessage}</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleShareOption('whatsapp')}
                  className="w-full px-5 py-3 rounded-full font-semibold flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 transition"
                >
                  Enviar por WhatsApp
                </button>
                <button
                  onClick={() => handleShareOption('email')}
                  className="w-full px-5 py-3 rounded-full font-semibold flex items-center justify-center gap-2 border border-slate-100/20 text-slate-200 hover:bg-slate-100/10 transition"
                >
                  Enviar por Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>

      <ReserveModal
        open={isReserveOpen}
        onClose={handleCloseReserve}
        initialInterest={reserveIntent}
      />
    </>
  );
};

export default About;
