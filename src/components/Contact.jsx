import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Send, Instagram, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const Contact = () => {
  const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const instagramUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const twitterUrl = 'https://x.com/SilvestreFilis';
  const facebookUrl = 'https://www.facebook.com/share/16pHNpZjpM/?mibextid=wwXIfr';

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (status === 'loading') {
        return;
      }

      const trimmedName = formValues.name.trim();
      const trimmedEmail = formValues.email.trim();
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
            meta: { route: 'contact' },
          });
          if (backstageError) {
            console.error('[Contact] No se pudo duplicar en blog_contributions:', backstageError);
          }
        } catch (backstageError) {
          console.error('[Contact] Excepción duplicando en blog_contributions:', backstageError);
        }

        setStatus('success');
        setFormValues({ name: '', email: '', message: '' });
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
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
      });
    }
  };

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
            Contacto, Prensa & Créditos
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Para colaboraciones, entrevistas o simplemente para compartir tus teorías. 
            Aquí cae el telón, pero la conversación continúa.
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
              {status === 'error' && (
                <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              {status === 'success' && (
                <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Tu mensaje llegó. Te escribiremos a la brevedad.
                </div>
              )}
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
              >
                <Send size={20} />
                {status === 'loading' ? 'Enviando…' : 'Enviar'}
              </Button>
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
              <h3 className="font-display text-xl font-medium text-slate-100 mb-4">Kit de Prensa</h3>
              <p className="text-slate-300/70 mb-4 font-light">Descarga nuestro kit de prensa con imágenes en alta resolución, dossier y más.</p>
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
                Con el apoyo de <span className="text-slate-200">Isabel Ayuda para la Vida, A.C.</span>.
                <br />
                Agradecimientos especiales a todos los que creyeron en esta locura.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
