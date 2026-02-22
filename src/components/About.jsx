import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Headphones, Quote, Send, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ConfettiBurst } from '@/components/Confetti';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';
import {
  fetchApprovedAudiencePerspectives,
  submitAudiencePerspective,
} from '@/services/audiencePerspectiveService';
import {
  getTrailerPublicUrl,
  TRAILER_FALLBACK_URL,
  TRAILER_FALLBACK_URL_MOBILE,
  TRAILER_FALLBACK_URL_SQUARE,
} from '@/services/trailerService';
import ReserveModal from '@/components/ReserveModal';

const aboutParagraphs = [
  {
    text: `Es un gato encerrado: una experiencia escénica que ocurre en el teatro y, al mismo tiempo, dentro de quien la mira.

    Es el corazón de #GatoEncerrado. Desde aquí, la obra se desdobla y nos abre un espacio donde Silvestre Felis y su doctora enfrentan el miedo, la desconexión y el peligro de sufrir en silencio.

    Y aunque la función termine, su pulso continúa: se expande hacia otros lenguajes —cine, cómic, experiencias interactivas y diálogo— que prolongan ese latido en nuestro universo transmedia.`,
  
  className:
      'text-lg leading-relaxed font-light whitespace-pre-line bg-gradient-to-b from-violet-300/95 via-slate-200/80 to-slate-100/100 text-transparent bg-clip-text',
  },

];

const fallbackTestimonials = [
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

const PROVOCA_SHARE_URL = 'https://esungatoencerrado.com/#provoca';
const PROVOCA_DRAFT_KEY = 'gatoencerrado:provoca-draft';
const PROVOCA_AFTERCARE_DELAY_MS = 3200;
const PROVOCA_CONFETTI_VISIBLE_MS = 2400;
const inviteMessage = `Hola 🐾
Quiero invitarte a compartir tu mirada en *Perspectivas del público* de *Es un gato encerrado*.
Entra aquí: ${PROVOCA_SHARE_URL}
Me encantará leer tu opinión. 💜`;

export const ProvocaSection = () => {
  const { user } = useAuth();
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [voiceRole, setVoiceRole] = useState('');
  const [voiceDraft, setVoiceDraft] = useState('');
  const [voiceTrap, setVoiceTrap] = useState('');
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);
  const [showAfterCareOverlay, setShowAfterCareOverlay] = useState(false);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const afterCareTimeoutRef = useRef(null);
  const confettiTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (afterCareTimeoutRef.current) {
        clearTimeout(afterCareTimeoutRef.current);
      }
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  const fireProvocaConfetti = useCallback(() => {
    const id = Date.now();
    setConfettiBursts((prev) => [...prev, id]);
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
    }
    confettiTimeoutRef.current = setTimeout(() => {
      setConfettiBursts((prev) => prev.filter((item) => item !== id));
      confettiTimeoutRef.current = null;
    }, PROVOCA_CONFETTI_VISIBLE_MS);
  }, []);

  useEffect(() => {
    const stored = safeGetItem(PROVOCA_DRAFT_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.quote) setVoiceDraft(parsed.quote);
      if (parsed?.name) setVoiceName(parsed.name);
      if (parsed?.role) setVoiceRole(parsed.role);
      if (parsed?.quote || parsed?.name || parsed?.role) {
        setIsVoiceInputOpen(true);
      }
    } catch {
      safeRemoveItem(PROVOCA_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = {
      quote: voiceDraft.trim(),
      name: voiceName.trim(),
      role: voiceRole.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (!payload.quote && !payload.name && !payload.role) {
      safeRemoveItem(PROVOCA_DRAFT_KEY);
      return;
    }
    safeSetItem(PROVOCA_DRAFT_KEY, JSON.stringify(payload));
  }, [voiceDraft, voiceName, voiceRole]);

  useEffect(() => {
    let cancelled = false;
    const loadApproved = async () => {
      const { data, error } = await fetchApprovedAudiencePerspectives(2);
      if (cancelled || error || !Array.isArray(data) || data.length === 0) {
        return;
      }
      const mapped = data.map((item) => ({
        quote: item?.quote?.startsWith('“') ? item.quote : `“${item?.quote ?? ''}”`,
        author: item?.author_name || 'Voz del público',
        role: item?.author_role || 'Perspectiva compartida',
      }));
      if (!cancelled) {
        setTestimonials(mapped);
      }
    };
    loadApproved();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmitVoice = useCallback(async () => {
    const quote = voiceDraft.trim();

    if (!quote || quote.length < 10) {
      toast({ description: 'Comparte una perspectiva un poco más completa.' });
      return;
    }
    if (isSubmittingVoice) {
      return;
    }
    const authorName =
      voiceName.trim() ||
      user?.user_metadata?.alias ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')?.[0] ||
      'Voz del público';
    const authorRole = voiceRole.trim();

    setIsSubmittingVoice(true);
    const { error } = await submitAudiencePerspective({
      quote,
      authorName,
      authorRole: authorRole || null,
      honeypot: voiceTrap,
      metadata: {
        source: 'provoca_section',
      },
    });
    setIsSubmittingVoice(false);

    if (error) {
      toast({ description: 'No pudimos guardar tu perspectiva. Intenta de nuevo.' });
      return;
    }

    const shouldPromptLogin = !user?.email;
    fireProvocaConfetti();
    setVoiceDraft('');
    setVoiceRole('');
    setVoiceTrap('');
    if (shouldPromptLogin) {
      setVoiceName('');
      if (afterCareTimeoutRef.current) {
        clearTimeout(afterCareTimeoutRef.current);
      }
      afterCareTimeoutRef.current = setTimeout(() => {
        setShowAfterCareOverlay(true);
        afterCareTimeoutRef.current = null;
      }, PROVOCA_AFTERCARE_DELAY_MS);
    } else {
      setVoiceName(authorName);
    }
    safeRemoveItem(PROVOCA_DRAFT_KEY);
    setIsVoiceInputOpen(false);
  }, [fireProvocaConfetti, isSubmittingVoice, user, voiceDraft, voiceName, voiceRole, voiceTrap]);

  useEffect(() => {
    if (!isVoiceInputOpen) {
      return;
    }
    if (voiceName.trim()) {
      return;
    }
    const suggestedName =
      user?.user_metadata?.alias ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')?.[0] ||
      '';
    if (suggestedName) {
      setVoiceName(suggestedName);
    }
  }, [isVoiceInputOpen, user, voiceName]);

  const handleCloseAfterCare = useCallback(() => {
    setShowAfterCareOverlay(false);
  }, []);

  const handleOpenLoginFromAfterCare = useCallback(() => {
    setShowAfterCareOverlay(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
    }
  }, []);

  const handleInviteFromProvoca = useCallback(async () => {
    const shareData = {
      title: 'Es un gato encerrado',
      url: PROVOCA_SHARE_URL,
      text: inviteMessage,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const encodedMessage = encodeURIComponent(inviteMessage);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const afterCareOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {showAfterCareOverlay ? (
          <motion.div
            key="provoca-after-care"
            className="fixed inset-0 z-[190] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAfterCare}
              aria-label="Cerrar mensaje post-envío"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="provoca-aftercare-title"
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#071514]/95 p-5 sm:p-6 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
          
              <div className="mt-5 space-y-3">
                <h3 id="provoca-aftercare-title" className="font-display text-2xl text-slate-50">
                  ¿Te gustaría suscribirte gratis al sitio?
                </h3>
                <p className="text-sm leading-relaxed text-slate-200/90">
                  Tu perspectiva ya fue enviada. Si te suscribes, podrás seguir el diálogo y recibir avisos cuando publiquemos nuevas respuestas y funciones.
                </p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseAfterCare}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Ahora no
                </button>
                <button
                  type="button"
                  onClick={handleOpenLoginFromAfterCare}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500/95 to-teal-500/95 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_26px_rgba(16,185,129,0.35)] transition hover:from-emerald-400 hover:to-teal-400"
                >
                  Suscribirme gratis
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <>
      <section id="provoca" className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="relative overflow-hidden glass-effect rounded-2xl p-8 md:p-12"
        >
          {confettiBursts.map((burst) => (
            <ConfettiBurst key={burst} seed={burst} />
          ))}
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-center">
            <div>
              <details className="group mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-left">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <HeartHandshake size={16} className="text-emerald-200" />
                    <span className="text-[0.66rem] uppercase tracking-[0.23em] text-emerald-200/85">
                      Y si te movió más de lo esperado...
                    </span>
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-emerald-200/80 group-open:text-white">
                    <span className="group-open:hidden">Pulsar</span>
                    <span className="hidden group-open:inline">Cerrar</span>
                  </span>
                </summary>
                <div className="mt-3 space-y-2 pl-7">
                  <p className="text-sm text-slate-200/95 leading-relaxed">
                    El equipo de Isabel Ayuda para la Vida, A.C. te ofrece acompañamiento confidencial y puede orientarte.
                  </p>
                  <a
                    href="https://www.ayudaparalavida.com/contacto.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 hover:text-white transition"
                  >
                    Contacto directo
                  </a>
                </div>
              </details>
              <p className="uppercase tracking-[0.35em] text-xs text-slate-400/80 mb-4">Perspectivas del público</p>
              <h3 className="font-display text-3xl text-slate-100 mb-6 italic">
                ¿Qué nos provoca esta obra?
              </h3>
              <p className="text-slate-300/80 leading-relaxed mb-6 font-light">
                Reunimos testimonios, críticas y preguntas abiertas que siguen vibrando después de la función. Puedes leer las voces que ya habitan este espacio o abrir una nueva compartiendo tu experiencia.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsVoiceInputOpen((prev) => !prev)}
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 w-full sm:w-auto whitespace-normal break-words text-center leading-snug"
                >
                  ¿Ya la viste?
                </Button>
                <Button
                  variant="outline"
                  onClick={handleInviteFromProvoca}
                  className="border-slate-100/20 text-slate-200 hover:bg-slate-100/10 px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Send size={18} />
                  Invitar al diálogo
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {isVoiceInputOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="mt-4"
                  >
                    <textarea
                      aria-label="Comparte cómo cambió tu forma de mirar, sentir o recordar"
                      value={voiceDraft}
                      onChange={(event) => setVoiceDraft(event.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
                      placeholder="Cuéntanos cómo cambió tu forma de mirar, sentir o recordar algo..."
                    />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        aria-label="Tu nombre"
                        value={voiceName}
                        onChange={(event) => setVoiceName(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        placeholder="Tu nombre"
                      />
                      <input
                        aria-label="Tu rol o ciudad"
                        value={voiceRole}
                        onChange={(event) => setVoiceRole(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                        placeholder="Rol, ciudad o vínculo (opcional)"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        value={voiceTrap}
                        onChange={(event) => setVoiceTrap(event.target.value)}
                        className="hidden"
                        name="website"
                      />
                      <Button
                        onClick={handleSubmitVoice}
                        disabled={isSubmittingVoice}
                        className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-white"
                      >
                        {isSubmittingVoice ? 'Enviando…' : 'Enviar perspectiva'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-100/30 bg-slate-50 text-slate-950 hover:bg-slate-200"
                      >
                        Escuchar a la obra
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
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
      </section>
      {afterCareOverlay}
    </>
  );
};

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
  const trailerVideoRef = useRef(null);

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

  const stopTrailerPlayback = useCallback(({ reset = false } = {}) => {
    const video = trailerVideoRef.current;
    if (!video) return;
    try {
      video.pause();
      if (reset) {
        video.currentTime = 0;
      }
    } catch {
      // noop
    }
  }, []);

  const handleCloseTrailer = useCallback(() => {
    stopTrailerPlayback({ reset: true });
    setIsTrailerOpen(false);
  }, [stopTrailerPlayback]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleShowcaseVisibility = (event) => {
      if (!event?.detail?.open) return;
      stopTrailerPlayback({ reset: true });
      setIsTrailerOpen(false);
    };
    window.addEventListener('gatoencerrado:showcase-visibility', handleShowcaseVisibility);
    return () => window.removeEventListener('gatoencerrado:showcase-visibility', handleShowcaseVisibility);
  }, [stopTrailerPlayback]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stopTrailerPlayback();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopTrailerPlayback]);

  useEffect(
    () => () => {
      stopTrailerPlayback({ reset: true });
    },
    [stopTrailerPlayback]
  );

  const handleInvite = useCallback(async () => {
    const shareData = {
      title: 'Es un gato encerrado',
      url: PROVOCA_SHARE_URL,
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
                Silvestre no está solo
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
                        ref={trailerVideoRef}
                        id="gato-encerrado-trailer"
                        key={trailer.url}
                        src={trailer.url}
                        controls
                        autoPlay
                        playsInline
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
