import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Book, Coffee, Film, Users, HelpCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Transmedia = () => {
  const formats = [
    {
      icon: Smartphone,
      title: 'La App',
      description: 'Una experiencia interactiva que expande la narrativa más allá del teatro.',
    },
    {
      icon: Book,
      title: 'El Cómic',
      description: 'Una novela gráfica que explora los orígenes de los personajes.',
    },
    {
      icon: Coffee,
      title: 'Las Tazas',
      description: 'Merchandising con frases y diseños que esconden pistas sobre la obra.',
    },
    {
      icon: Film,
      title: 'El Cine',
      description: 'Cortometrajes que funcionan como precuelas y secuelas de la historia principal.',
    },
    {
      icon: Users,
      title: 'Talleres',
      description: 'Workshops de dramaturgia y performance inspirados en el proceso creativo.',
    },
    {
      icon: HelpCircle,
      title: 'El Club de las Preguntas Sin Respuestas',
      description: 'Un foro online para debatir teorías y compartir interpretaciones de la obra.',
    }
  ];

  const handleFormatClick = () => {
    toast({
      description: "🚧 Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  return (
    <section id="transmedia" className="py-24 relative">
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
            Universo Transmedia
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            #GatoEncerrado es un ecosistema narrativo que se expande a través de múltiples 
            plataformas, ofreciendo diferentes puertas de entrada a la misma historia.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {formats.map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="group glass-effect rounded-xl p-8 hover-glow cursor-pointer flex flex-col transition-all duration-300 hover:border-purple-400/50"
              onClick={handleFormatClick}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/80 to-blue-500/80 rounded-full flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110">
                <format.icon size={32} className="text-white" />
              </div>
              
              <h3 className="font-display text-2xl font-medium text-slate-100 mb-3">
                {format.title}
              </h3>
              
              <p className="text-slate-300/70 text-base leading-relaxed mb-4 flex-grow font-light">
                {format.description}
              </p>
              
              <div className="text-purple-300 flex items-center gap-2 font-semibold transition-all duration-300 group-hover:gap-3">
                Descubrir
                <ArrowRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Transmedia;