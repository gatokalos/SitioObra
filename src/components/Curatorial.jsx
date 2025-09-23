import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Quote, User, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Curatorial = () => {
  const texts = [
    {
      title: 'El Encierro Como Metáfora',
      author: 'Dr. María Elena Rodríguez',
      role: 'Crítica Teatral',
      date: 'Marzo 2024',
      excerpt: 'En #GatoEncerrado encontramos una reflexión profunda sobre los múltiples encierros que caracterizan la experiencia humana contemporánea. La obra trasciende la literalidad del espacio físico para explorar las prisiones mentales, sociales y emocionales que habitamos...',
    },
    {
      title: 'Narrativas Transmedia en el Teatro',
      author: 'Prof. Carlos Mendoza',
      role: 'Investigador en Artes Escénicas',
      date: 'Febrero 2024',
      excerpt: 'La integración de múltiples plataformas narrativas en #GatoEncerrado representa un paradigma emergente en las artes escénicas. Esta obra no solo utiliza el teatro como medio principal, sino que expande su universo narrativo...',
    },
  ];

  const handleReadMore = () => {
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  return (
    <section id="curatorial" className="py-24 relative">
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
            Textos Curatoriales
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Reflexiones críticas y análisis profundos sobre #GatoEncerrado 
            desde diferentes perspectivas académicas y curatoriales.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {texts.map((text, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8 md:p-10 hover-glow flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-purple-300 text-sm">
                  <User size={16} />
                  <span className="text-slate-200 font-semibold">{text.author}</span>
                </div>
                <span className="text-slate-400 text-sm">/ {text.role}</span>
              </div>
              <h3 className="font-display text-2xl font-medium text-slate-100 mb-4 flex-grow">
                {text.title}
              </h3>
              <p className="text-slate-300/70 leading-relaxed font-light mb-6">
                "{text.excerpt}"
              </p>
              <Button
                onClick={handleReadMore}
                variant="link"
                className="text-purple-300 hover:text-white self-start p-0"
              >
                Leer texto completo
              </Button>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-effect rounded-2xl p-8 md:p-12">
            <h3 className="font-display text-3xl font-medium mb-6 text-slate-100">
              Contribuye al Diálogo Crítico
            </h3>
            <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light">
              Invitamos a críticos, académicos y pensadores a contribuir con sus reflexiones 
              sobre #GatoEncerrado y su impacto en el panorama teatral contemporáneo.
            </p>
            <Button
              onClick={handleReadMore}
              className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow"
            >
              <Send size={18} />
              Enviar Propuesta
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Curatorial;