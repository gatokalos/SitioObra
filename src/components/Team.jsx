// src/components/Team.jsx
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const teamData = {
  Dirección: {
    name: "Gilberto Corrales",
    bio: "Director, dramaturgo y actor. Licenciado en Teatro por la Facultad de Artes de la UABC, ha dirigido más de cuarenta obras, la mayoría de su autoría. Su trabajo explora la transdisciplina y la investigación del lenguaje escénico. Fundador de Incendio Producciones, sus obras han estado presentes en la Muestra Nacional de Teatro y en festivales de Colombia, Argentina y EE.UU. Ganador del Premio Juventud 2016 y del FITU UNAM. Dirige el Contagio Tijuana y colabora con artistas como Jorge Ballina y Daniel Primo.",
    image: "/images/placeholder-direccion.jpg",
  },
  Dramaturgia: {
    name: "Carlos A. Pérez H.",
    bio: "Artista transmedial, autor y dramaturgo. Su obra habita entre teatro, escritura y tecnología, proponiendo una poética crítica y humana. Formado en el ITESO, la Universidad de Salamanca y LABASAD Barcelona, integra astrología psicológica, cuerpo y arte digital en una mirada simbólica. Creador del universo transmedia #GatoEncerrado, concibe el acto creativo como una forma de acompañamiento y transformación.",
    image: "/images/placeholder-dramaturgia.jpg",
  },
  Producción: {
    name: "Miroslava Wilson",
    bio: "Productora ejecutiva, directora y asesora de movimiento. Originaria de Hermosillo y radicada en Tijuana, es fundadora de Péndulo Cero A.C. y educadora de movimiento somático certificada por Body Mind Movement. Su trabajo interdisciplinario vincula arte, medio ambiente y humanismo. Ha presentado su obra en Asia, América y Europa, y actualmente impulsa proyectos como Casa Viva y SomasSomos.",
    image: "/images/placeholder-produccion.jpg",
  },
    Elenco: {
    description:
      "Actores y actrices que encarnan el pulso emocional de la obra desde la fisicalidad, la voz y la presencia simbólica.",
    members: [
      {
        name: "Ricardo Márquez Salgado",
        role: "Intérprete",
        bio: "Comunicólogo, modelo y actor. Ha participado en teatro, cine y publicidad. Destacan sus coprotagónicos en 'Ideas para no morir en el anonimato' y 'Entre Dos'. Su presencia combina energía escénica y precisión estética.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/ricardo.jpg",
      },
      {
        name: "Cynthia Teresa Rodríguez Aguirre",
        role: "Intérprete",
        bio: "Artista interdisciplinaria egresada de la UABC. Su práctica integra fotografía, escritura y teatro. Ha participado en el San Diego Fringe Festival y en montajes de Incendio Producciones. Actualmente se enfoca en la dirección escénica y la exploración visual.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/cyndi.jpg",
      },
     {
        name: "Mariana de los Santos",
        role: "Intérprete",
        bio: "Actriz tijuanense formada en CEART y con experiencia en cine y teatro contemporáneo. Su trabajo corporal revela una sensibilidad poética que dialoga entre lo íntimo y lo colectivo.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariana.jpg",
      },
      {
        name: "Carlos Valdez Rosas",
        role: "Intérprete",
        bio: "Actor y productor de Incendio Producciones. Su trabajo combina performance, posdrama e interdisciplina. Ha participado en la Muestra Nacional de Teatro y festivales internacionales en Argentina y Estados Unidos.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/carlitos.jpg",
      },
    ],
  },
  "Producción y Asistencia": {
    description:
      "Un equipo que coordina, articula y acompaña cada engranaje de la producción escénica con mirada sensible, técnica y humana.",
    members: [
      {
        name: "Marcela Durán Mulia",
        role: "Producción Administrativa",
        bio: "Actriz, gestora y representante legal de Incendio Producciones. Licenciada en Comunicación (UABC) y Maestra en Alta Dirección Corporativa (Humanitas). Ha participado en la Muestra Nacional de Teatro, ENARTES y otros festivales internacionales. Su mirada estratégica une la gestión cultural con la sensibilidad artística.",
        image: "/images/placeholder-colaboradores.jpg",
      },
      {
        name: "Rosalía Hernández Millán",
        role: "Producción General y Vinculación Social",
        bio: "Presidenta de Isabel A.C. Ayuda para la Vida, Maestra en Psicobiología y Neurociencia Cognitiva (UAB). Su labor impulsa la integración entre arte y bienestar emocional, fortaleciendo el puente entre el proyecto escénico y la comunidad.",
        image: "/images/placeholder-colaboradores.jpg",
      },
      {
        name: "Gabriel Monroy",
        role: "Asistencia de Dirección y Gestión",
        bio: "Actor, fotógrafo escénico y gestor. Licenciado en Artes Escénicas por la Universidad de Sonora. Creador de la serie fotográfica 'Reflejos de la escena', exhibida internacionalmente. Su mirada visual y su acompañamiento escénico fortalecen el proceso de dirección.",
        image: "/images/placeholder-colaboradores.jpg",
      },
      {
        name: "Rocío Morgán",
        role: "Asistencia Ejecutiva",
        bio: "Gestora cultural y apoyo logístico de producción. Su labor sostiene los procesos administrativos y humanos que hacen posible la operación cotidiana de la obra.",
        image: "/images/placeholder-colaboradores.jpg",
      },
    ],
  },
  "Diseño y Técnica Escénica": {
    description:
      "Un equipo de diseñadores y técnicos escénicos que entrelazan arquitectura, multimedia, sonido y luz para expandir la atmósfera de la obra.",
    members: [
      {
        name: "Jorge Ballina",
        role: "Escenografía",
        bio: "Arquitecto y escenógrafo con más de 120 obras en teatro, danza y ópera. Miembro del Sistema Nacional de Creadores de Arte, ha sido galardonado con premios internacionales como el World Stage Design Toronto y Calgary. Su trabajo combina estructura y poesía visual.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Daniel Primo",
        role: "Video Escenográfico e Iluminación",
        bio: "Artista visual y diseñador escénico. Explora la relación entre multimedia y espacio escénico. Integrante del Sistema Nacional de Creadores, su trabajo ha sido presentado en Europa, Asia y América. Cofundador de Engranaje Invertebrado.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Lía Pérez",
        role: "Diseño Sonoro",
        bio: "Artista sonora con más de doce años de experiencia. Fundadora de Concrete Sounds, ha colaborado en filmes como 'Ya no estoy aquí' y 'Monos'. Su especialidad es la creación de paisajes inmersivos que amplían la dimensión sensorial del teatro.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Harold García",
        role: "Dirección Técnica",
        bio: "Arquitecto y diseñador lumínico. Ha colaborado en producciones como 'Matilda', 'Mamma Mia!' y 'Madame Butterfly'. Su trabajo abarca teatro, ópera y danza contemporánea, con presentaciones en México, Los Ángeles y festivales nacionales.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/harold.jpg",
      },
      {
        name: "Rebeca Hernández",
        role: "Realización Escenográfica",
        bio: "Diseñadora industrial egresada del CIDI-UNAM y fundadora de Atelier RHC en Tijuana. Su taller produce escenografías, mobiliario y piezas funcionales para teatro y espacios públicos, uniendo técnica artesanal con visión contemporánea.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rebeca.jpg",
      },
      {
        name: "Ximena Inurreta",
        role: "Asistente de Diseño de Escenografía",
        bio: "Diseñadora escénica emergente que apoya el desarrollo de atmósferas visuales y transiciones espaciales en el montaje de #GatoEncerrado.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Diego Madera",
        role: "Tema Musical",
        bio: "Músico y compositor cuyo trabajo explora la tensión entre sonido y silencio. Su pieza original acompaña los pasajes emocionales de la obra.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Karla Flores",
        role: "Realización de Vestuario",
        bio: "Diseñadora de vestuario que traduce emociones en textura, movimiento y color. Su trabajo aporta profundidad simbólica a la corporalidad de los intérpretes.",
        image: "/images/placeholder-diseno.jpg",
      },
      {
        name: "Jonathan Lazcano",
        role: "Pelucas",
        bio: "Artista de caracterización. Su trabajo artesanal da vida y coherencia visual a los personajes a través del detalle y la textura.",
        image: "/images/placeholder-diseno.jpg",
      },
    ],
  },
  "Colaboradores y Agradecimientos": {
    description:
      "Detrás de cada función existe una constelación de manos, miradas y corazones que hacen posible el universo escénico de #GatoEncerrado. Este bloque celebra su labor silenciosa y luminosa.",
    members: [
      {
        name: "Isabel Ayuda para la Vida A.C.",
        role: "",
        bio: "Asociación civil sin fines de lucro fundada en 2018 y dirigida por Rosalía Hernández Millán. Su misión es prevenir la violencia autoinfligida mediante el programa DySVAE, promoviendo el pedir ayuda como estrategia de vida. Colabora con #GatoEncerrado para visibilizar la salud emocional y la empatía en contextos artísticos y educativos.",
        image: "/images/placeholder-institucional.jpg",
      },
      {
        name: "Diseño, Sonido y Escenografía Complementarios",
        role: "",
        bio: "Ximena Inurreta — asistente de diseño de escenografía. Diego Madera — tema musical. Karla Flores — realización de vestuario. Jonathan Lazcano — pelucas.",
        image: "/images/placeholder-diseno.jpg",
      },
    ],
    details: {
      tecnicos:
        "Asistencia técnica y tramoya: Renee Camacho — asistencia técnica y tramoya. Luis Fernando López Sánchez, Alex Nava, Christian Camacho — equipo de realización de escenografía. Marco Antonio Corral Gastelúm, Manuel Axxel Aquino, Santiago Augusto Rodríguez, Alejandro Saldaña — realizadores y tramoya.",
      registro:
        "Registro, foto y medios: Viviana González — registro creativo videográfico. Sergio Brown — registro audiovisual. Enigma Creative — publicidad y diseño gráfico. Eclipse Comunicación Estratégica — difusión y medios.",
      institucionales:
        "Apoyos institucionales: Agradecimiento a Teatro CAMAFEO y sus productoras Margarita Martínez de Camarena y Elsa Pérez de Vargas; CEART Tijuana, IMAC, Casa Viva y Adagio Studio por su apoyo en ensayos y espacios.",
    },
  },
};

// === COMPONENT ===
const Team = () => {
  const renderRole = (data) => {
    if (Array.isArray(data?.members)) {
      return (
        <div className="space-y-6">
          {data.description && (
            <p className="text-slate-300/80 leading-relaxed font-light mb-2 md:text-base sm:text-sm">
              {data.description}
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {data.members.map((member, idx) => (
              <div
                key={member.name + idx}
                className="glass-effect rounded-xl p-5 flex gap-4 items-start border border-white/5"
              >
                <img
                  className="h-20 w-20 flex-shrink-0 rounded-full object-cover shadow-lg shadow-black/30"
                  src={member.image}
                  alt={`Retrato de ${member.name}`}
                />
                <div className="space-y-1">
                  <h4 className="font-display text-lg text-purple-200">
                    {member.name}
                  </h4>
                  {member.role && (
                    <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">
                      {member.role}
                    </p>
                  )}
                  {member.bio && (
                    <p className="text-sm md:text-base sm:text-sm text-slate-300/80 leading-relaxed">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {data.details && (
            <div className="text-slate-400 text-sm leading-relaxed space-y-4">
              <div className="border-t border-white/10 pt-4">
                {data.details.tecnicos}
              </div>
              <div className="border-t border-white/10 pt-4">
                {data.details.registro}
              </div>
              <div className="border-t border-white/10 pt-4">
                {data.details.institucionales}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-1">
          <img
            className="w-full h-48 object-cover rounded-lg shadow-lg shadow-black/30"
            alt={`Retrato de ${data.name}`}
            src={data.image}
          />
        </div>
        <div className="md:col-span-2">
          <h3 className="font-display text-xl font-bold text-purple-300 mb-2">
            {data.name}
          </h3>
          <p className="text-slate-300/80 leading-relaxed font-light md:text-base sm:text-sm">
            {data.bio}
          </p>
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
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-6 text-gradient italic">
            Equipo Creativo
          </h2>
          <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light md:text-base sm:text-sm">
            Un colectivo de artistas multidisciplinarios unidos por la pasión de crear
            experiencias teatrales que desafían los límites del arte escénico y la empatía.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
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