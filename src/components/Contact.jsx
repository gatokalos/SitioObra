import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Send, Instagram, Twitter, Facebook, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';

const Contact = () => {
  const [formValues, setFormValues] = useState({ name: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const instagramUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const twitterUrl = 'https://x.com/SilvestreFilis';
  const facebookUrl = 'https://www.facebook.com/share/16pHNpZjpM/?mibextid=wwXIfr';
  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.email);

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === 'loading') {
        return;
      }

      const trimmedName = formValues.name.trim();
      const trimmedEmail = formValues.email.trim();
      const trimmedCity = formValues.city.trim();
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
            email: trimmedEmail.toLowerCase(),
            city: trimmedCity || null,
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
            subject: 'Contacto público',
            message: trimmedMessage,
            meta: { route: 'contact', city: trimmedCity || null },
          });
          if (backstageError) {
            console.error('[Contact] No se pudo duplicar en blog_contributions:', backstageError);
          }
        } catch (backstageError) {
          console.error('[Contact] Excepción duplicando en blog_contributions:', backstageError);
        }

        setStatus('success');
        setFormValues({ name: '', email: '', city: '', message: '' });
        toast({ description: 'Recibimos tu mensaje y te escribiremos pronto.' });
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
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            ¿Ya sientes la curiosidad gatuna?
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Si algo de la experiencia te dejó una huella —o una pregunta—, este es tu espacio para contarlo. No buscamos "opiniones" sino aquello que cambió tu forma de mirar, sentir o recordar. 
            Aunque también puedes usar este espacio para compartir tus teorías, solicitar entrevistas y para colaboraciones.
          </p>
              <p className="text-xs text-slate-400/70 mt-3">
                Y si algo de la obra te movió más de lo esperado, el equipo de
 {' '}                <a href="#team" className="underline text-slate-300">Ayuda para la Vida.</a>  puede orientarte de manera confidencial.
              </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl p-8"
          >
            <h3 className="font-display text-2xl font-medium text-slate-100 mb-8">
              Envíanos un Mensaje
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Nombre</label>
                <input
                  name="name"
                  type="text"
                  value={formValues.name}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Ciudad (opcional)</label>
                <input
                  name="city"
                  type="text"
                  value={formValues.city}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, city: event.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  placeholder="¿Desde dónde nos visitas?"
                />
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Mensaje</label>
                <textarea
                  name="message"
                  rows={5}
                  value={formValues.message}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
                  placeholder="Cuéntanos más..."
                ></textarea>
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
              <h3 className="font-display text-xl font-medium text-slate-100 mb-4">Prensa & Créditos</h3>
              <p className="text-slate-300/70 mb-4 font-light">Imágenes, dossier y equipo creativo de Es un gato encerrado.</p>
              <Button onClick={handleActionClick} variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400">
                <Download size={18} className="mr-2" />
                Descargar Kit
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
                  src="/assets/logoapp.png"
                  alt="Logo #GatoEncerrado"
                  className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 p-1"
                  loading="lazy"
                />
                <img
                  src="/assets/incendiologo.png"
                  alt="Logo Incendio Producciones"
                  className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 p-1"
                  loading="lazy"
                />
                <img
                  src="/assets/isabel_banner.png"
                  alt="Banner Isabel Ayuda para la Vida, A.C."
                  className="h-10 w-auto max-w-[140px] rounded-lg border border-white/10 bg-black/30 px-2 object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
