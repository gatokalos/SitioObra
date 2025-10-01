import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1595872018818-97555653a011?auto=format&fit=crop&w=800&q=80';

const teamData = {
  Dramaturgia: {
    name: 'Carlos Pérez',
    bio: 'Escritor y dramaturgo especializado en narrativas transmedia y teatro contemporáneo. Su trabajo explora la fragilidad de la memoria y la identidad en la era digital.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/GIF-2025-09-24-14-01-20.gif',
  },
  Dirección: {
    name: 'Gilberto Corales',
    bio: 'Directora teatral con más de 15 años de experiencia en teatro experimental. Su visión artística busca romper la cuarta pared y crear experiencias inmersivas y participativas.',
    image: 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyMnRvbmd6MmxvdzY3MnYybDhscHBtbnQ1MGkxMnRjYzU2bmQ5YWh6ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dhk64E8l02062eyLwH/giphy.gif',
  },
  Producción: {
    name: 'Miroslava Wilson',
    bio: 'Productora ejecutiva con una trayectoria en proyectos culturales innovadores. Es la fuerza motriz que convierte las ideas artísticas en realidades escénicas.',
    image: 'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyaGx4MTJsNTZnY2UyZ3k0dTh0Nzc5NnZqbXplYTlzbW13Zzh6ZnBybSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VDAPPNWRruFPG40guE/giphy.gif',
  },
  Elenco: {
    description:
      'Actores de teatro experimental con formación en danza contemporánea y performance. Cada uno aporta un matiz distinto al latido emocional de la obra.',
    members: [
      {
        name: 'Elena Vásquez',
        role: 'Protagonista — "La Voz"',
        bio: 'Explora la dualidad entre cuerpo y sonido; sus silencios son tan elocuentes como sus parlamentos.',
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Javier Soto',
        role: 'Protagonista — "El Eco"',
        bio: 'Actor físico que mezcla clown y performance audiovisual; sostiene la memoria del relato.',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'María Rojas',
        role: 'Ensamble — "La Sombra"',
        bio: 'Bailarina contemporánea que traduce los sueños en movimiento y construye los pasajes oníricos.',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80&sat=-20',
      },
      {
        name: 'Andrés Pineda',
        role: 'Ensamble — "El Pulso"',
        bio: 'Percusionista y actor; marca el ritmo interno de la obra con gestos mínimos y respiración colectiva.',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  Vestuario: {
    name: 'Marco Bianchi',
    bio: 'Diseñador de vestuario que utiliza la ropa como una extensión de la narrativa, creando piezas que reflejan el estado interno de los personajes.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  Escenografía: {
    name: 'Sofia Chen',
    bio: 'Artista visual que integra tecnología y arte tradicional. Su escenografía es un personaje más, un espacio dinámico que se transforma con la historia.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  },
  Música: {
    name: 'Miguel Torres',
    bio: 'Músico y compositor de paisajes sonoros experimentales. Su música crea una atmósfera envolvente que guía al público a través de las emociones de la obra.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
  },
  Iluminación: {
    name: 'David Kim',
    bio: 'Especialista en tecnología teatral y diseño de iluminación. Utiliza la luz y la sombra para esculpir el espacio y enfocar la tensión dramática.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
};

const Team = () => {
  const renderRole = (data) => {
    if (Array.isArray(data?.members)) {
      return (
        <div className="space-y-6">
          {data.description && (
            <p className="text-slate-300/80 leading-relaxed font-light mb-2">{data.description}</p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {data.members.map((member, idx) => (
              <div
                key={member.name + idx}
                className="glass-effect rounded-xl p-5 flex gap-4 items-start border border-white/5"
              >
                <img
                  className="h-20 w-20 flex-shrink-0 rounded-full object-cover shadow-lg shadow-black/30"
                  src={member.image || FALLBACK_IMAGE}
                  alt={`Retrato de ${member.name}`}
                />
                <div className="space-y-1">
                  <h4 className="font-display text-lg text-purple-200">{member.name}</h4>
                  {member.role && (
                    <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">{member.role}</p>
                  )}
                  <p className="text-sm text-slate-300/80 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-1">
          <img
            className="w-full h-48 object-cover rounded-lg shadow-lg shadow-black/30"
            alt={`Retrato de ${data.name}`}
            src={data.image || FALLBACK_IMAGE}
          />
        </div>
        <div className="md:col-span-2">
          <h3 className="font-display text-xl font-bold text-purple-300 mb-2">{data.name}</h3>
          <p className="text-slate-300/80 leading-relaxed font-light">{data.bio}</p>
        </div>
      </div>
    );
  };

  return (
    <section id="team" className="py-24 relative">
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
            Equipo Creativo
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
            Un colectivo de artistas multidisciplinarios unidos por la pasión de crear
            experiencias teatrales que desafían los límites tradicionales del arte escénico.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {Object.entries(teamData).map(([role, data], index) => (
              <AccordionItem
                value={`item-${index}`}
                key={role}
                className="glass-effect rounded-lg border-none overflow-hidden"
              >
                <AccordionTrigger className="font-display text-xl md:text-2xl text-slate-100 p-6 hover:no-underline hover:bg-white/5 transition-colors duration-300">
                  {role}
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 bg-black/20">
                  {renderRole(data)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default Team;
