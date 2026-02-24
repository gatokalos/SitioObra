import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Download, Send, Instagram, Twitter, Facebook, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';
import { ConfettiBurst, useConfettiBursts } from '@/components/Confetti';

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';
const CAUSE_SITE_URL = 'https://www.ayudaparalavida.com/index.html';

const Contact = () => {
  const [formValues, setFormValues] = useState({
    name: '',
    role: '',
    email: '',
    city: '',
    attachmentUrl: '',
    message: '',
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCauseSiteOpen, setIsCauseSiteOpen] = useState(false);
  const instagramUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const twitterUrl = 'https://x.com/SilvestreFilis';
  const facebookUrl = 'https://www.facebook.com/share/16pHNpZjpM/?mibextid=wwXIfr';
  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.email);
  const { bursts: confettiBursts, fireConfetti } = useConfettiBursts();

  const handleOpenCauseSite = useCallback(() => {
    if (!CAUSE_SITE_URL) {
      toast({ description: 'Falta configurar la URL de la causa social.' });
      return;
    }
    setIsCauseSiteOpen(true);
  }, []);

  const handleCloseCauseSite = useCallback(() => {
    setIsCauseSiteOpen(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') {
      return;
    }
    const pending = safeGetItem(LOGIN_RETURN_KEY);
    if (!pending) {
      return;
    }
    try {
      const parsed = JSON.parse(pending);
      if (parsed?.anchor === '#contact') {
        safeRemoveItem(LOGIN_RETURN_KEY);
        setTimeout(() => {
          document.querySelector(parsed.anchor)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 120);
      }
    } catch (error) {
      safeRemoveItem(LOGIN_RETURN_KEY);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isCauseSiteOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        handleCloseCauseSite();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isCauseSiteOpen, handleCloseCauseSite]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === 'loading') {
        return;
      }

      const trimmedName = formValues.name.trim();
      const trimmedRole = formValues.role.trim();
      const trimmedEmail = formValues.email.trim();
      const trimmedCity = formValues.city.trim();
      const trimmedAttachmentUrl = formValues.attachmentUrl.trim();
      const trimmedMessage = formValues.message.trim();

      if (!trimmedName || !trimmedEmail || !trimmedMessage) {
        toast({ description: 'Completa nombre, email y mensaje antes de enviar.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const { error } = await supabase.functions.invoke('send-contact-message', {
          body: {
            name: trimmedName,
            role: trimmedRole || null,
            email: trimmedEmail.toLowerCase(),
            city: trimmedCity || null,
            attachment_url: trimmedAttachmentUrl || null,
            message: trimmedMessage,
          },
        });

        if (error) {
          throw error;
        }

        try {
          const { error: backstageError } = await supabase.from('blog_contributions').insert({
            name: trimmedName,
            email: trimmedEmail.toLowerCase(),
            proposal: trimmedMessage,
            topic: 'contacto',
            link: trimmedAttachmentUrl || null,
            meta: {
              route: 'contact',
              city: trimmedCity || null,
              attachment_url: trimmedAttachmentUrl || null,
              role: trimmedRole || null,
            },
          });
          if (backstageError) {
            console.error('[Contact] No se pudo duplicar en blog_contributions:', backstageError);
          }
        } catch (backstageError) {
          console.error('[Contact] Excepción duplicando en blog_contributions:', backstageError);
        }

        setStatus('success');
        setFormValues({ name: '', role: '', email: '', city: '', attachmentUrl: '', message: '' });
        fireConfetti();
      } catch (err) {
        console.error('[Contact] Error enviando mensaje:', err);
        setStatus('error');
        setErrorMessage('No pudimos enviar tu mensaje. Intenta de nuevo más tarde.');
        toast({ description: 'No pudimos enviar tu mensaje. Intenta de nuevo.' });
      }
    },
    [formValues, status]
  );

  const handleActionClick = () => {
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próxima visita! 🚀"
    });
  };

  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próxima visita! 🚀"
      });
    }
  };

  const handleOpenLoginOverlay = useCallback(() => {
    if (typeof window === 'undefined' || isLoggedIn) {
      return;
    }
    safeSetItem(
      LOGIN_RETURN_KEY,
      JSON.stringify({ anchor: '#contact', action: 'contact-notify' })
    );
    window.dispatchEvent(new CustomEvent('open-login-modal'));
  }, [isLoggedIn]);

  const contributionButtonClassName = [
    'border-slate-100/20 text-slate-200 hover:bg-slate-100/10 px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition',
    isLoggedIn
      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-400/90 hover:to-emerald-500/90 shadow-[0_0_35px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/30 text-white border-transparent'
      : 'bg-black/30 border border-slate-100/20'
  ].join(' ');
  const causeSiteOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isCauseSiteOpen ? (
          <motion.div
            key="cause-site-iframe"
            className="fixed inset-0 z-[175] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCauseSite}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Isabel Ayuda para la Vida"
              className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Causa social</p>
                  <h3 className="font-display text-2xl text-slate-100">Isabel Ayuda para la Vida</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {CAUSE_SITE_URL ? (
                    <a
                      href={CAUSE_SITE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCloseCauseSite}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[16/10] bg-black">
                {CAUSE_SITE_URL ? (
                  <iframe
                    src={CAUSE_SITE_URL}
                    title="Isabel Ayuda para la Vida"
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
                    No se pudo cargar el sitio.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <section id="contact" className="py-24 relative min-h-[880px]">
      <div className="section-divider mb-24"></div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">
            Contacto, Prensa & Créditos
          </p>
          
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            ¿Tienes curiosidad gatuna?
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Si algo de este sitio te dejó una una pregunta, este es tu espacio para contarlo. No buscamos "opiniones" sino aquello que cambió tu forma de mirar, sentir o recordar una obra. 
            Aunque también puedes usar este espacio para compartir tus teorías, solicitar entrevistas y para colaboraciones.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl p-8 relative overflow-hidden"
          >
            {confettiBursts.map((burst) => (
              <ConfettiBurst key={burst} seed={burst} />
            ))}
            <h3 className="font-display text-2xl font-medium text-slate-100 mb-8">
              Envíanos un Mensaje
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Nombre *</label>
                <input
                  name="name"
                  type="text"
                  value={formValues.name}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                  className="form-surface w-full px-4 py-3"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Perfil</label>
                <input
                  name="role"
                  type="text"
                  value={formValues.role}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, role: event.target.value }))}
                  className="form-surface w-full px-4 py-3"
                  placeholder="Espectador, artista, investigador..."
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                  className="form-surface w-full px-4 py-3"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Ciudad</label>
                <input
                  name="city"
                  type="text"
                  value={formValues.city}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, city: event.target.value }))}
                  className="form-surface w-full px-4 py-3"
                  placeholder="¿Desde dónde nos visitas?"
                />
              </div>
        
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Mensaje *</label>
                <textarea
                  name="message"
                  rows={5}
                  value={formValues.message}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                  className="form-surface w-full px-4 py-3 resize-none"
                  placeholder="Cuéntanos todo..."
                ></textarea>
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Material</label>
                <input
                  name="attachmentUrl"
                  type="url"
                  value={formValues.attachmentUrl}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, attachmentUrl: event.target.value }))}
                  className="form-surface w-full px-4 py-3"
                  placeholder="Drive, portfolio, video..."
                />
              </div>
              {status === 'error' ? (
                <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              ) : null}

              {status === 'success' ? (
                <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Tu mensaje llegó. Te escribiremos a la brevedad.
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex-1 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                  >
                    <Send size={20} />
                    {status === 'loading' ? 'Enviando…' : 'Enviar'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleOpenLoginOverlay}
                    disabled={isLoggedIn}
                    className={`flex-1 lg:flex-none ${contributionButtonClassName}`}
                  >
                    <PenLine size={18} />
                    {isLoggedIn ? 'Espera tu respuesta' : 'Recibir notificaciones'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400/70 text-center">
                  {isLoggedIn
                    ? 'Gracias por iniciar sesión, el equipo te responderá con gusto y cuidado.'
                    : '¿No quieres escribir ahora? Inicia sesión aquí y recibirás un mensaje cordial de alguien del equipo.'}
                </p>
                
              </div>
              
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="glass-effect rounded-xl p-6">
              <h3 className="font-display text-xl font-medium text-slate-100 mb-4">Redes Sociales</h3>
              <div className="flex gap-2">
                <Button onClick={() => handleSocialClick(instagramUrl)} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Instagram size={24} /></Button>
                <Button onClick={() => handleSocialClick(twitterUrl)} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Twitter size={24} /></Button>
                <Button onClick={() => handleSocialClick(facebookUrl)} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Facebook size={24} /></Button>
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="font-display text-xl font-medium text-slate-100 mb-4">Prensa</h3>
              <p className="text-slate-300/70 mb-4 font-light">Material oficial, dossier e información para medios y difusión cultural.</p>
              <Button onClick={handleActionClick} variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400">
                <Download size={18} className="mr-2" />
                Descargar dossier
              </Button>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="font-display text-xl font-medium text-slate-100 mb-4">Créditos Finales</h3>
              <p className="text-slate-300/70 text-sm leading-relaxed font-light">
                Una producción de <span className="text-slate-200">#GatoEncerrado</span>.
                <br />
                Compañía asociada: <span className="text-slate-200">Incendio Producciones</span>.
                <br />
                Con el apoyo de <span className="text-slate-200">Isabel Ayuda para la Vida, A.C.</span>.
                <br />
                Agradecimientos a todas las personas que hicieron posible esta locura.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <img
                  src="/assets/logoapp.webp"
                  alt="Logo #GatoEncerrado"
                  className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 p-1"
                  width={40}
                  height={40}
                  loading="lazy"
                />
                <img
                  src="/assets/incendiologo.png"
                  alt="Logo Incendio Producciones"
                  className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 p-1"
                  width={40}
                  height={40}
                  loading="lazy"
                />
                <img
                  src="/assets/isabel_banner.png"
                  alt="Banner Isabel Ayuda para la Vida, A.C."
                  className="h-10 w-auto max-w-[140px] rounded-lg border border-white/10 bg-black/30 px-2 object-contain"
                  width={140}
                  height={40}
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {causeSiteOverlay}
    </section>
  );
};

export default Contact;
