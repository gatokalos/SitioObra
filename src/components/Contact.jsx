import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Download, Send, Instagram, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const handleActionClick = () => {
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  return (
    <section id="contact" className="py-24 relative">
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
                <input type="text" className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" placeholder="Tu nombre"/>
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" placeholder="tu@email.com"/>
              </div>
              <div>
                <label className="block text-slate-300/80 text-sm font-medium mb-2">Mensaje</label>
                <textarea rows={5} className="w-full px-4 py-3 bg-black/30 border border-slate-100/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none" placeholder="Cuéntanos más..."></textarea>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow">
                <Send size={20} />
                Enviar
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
                <Button onClick={handleActionClick} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Instagram size={24} /></Button>
                <Button onClick={handleActionClick} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Twitter size={24} /></Button>
                <Button onClick={handleActionClick} variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Facebook size={24} /></Button>
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
                Una producción de <span className="text-slate-200">Teatro de la Penumbra</span>.
                <br />
                Con el apoyo de <span className="text-slate-200">Fondo Nacional para la Cultura y las Artes</span>.
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