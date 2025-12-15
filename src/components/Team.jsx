// src/components/Team.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const teamData = {
  "Alianza de Impacto Social": {
    name: "Isabel Ayuda para la Vida A.C.",
    bio: "Isabel Ayuda para la Vida A.C. es una asociación civil fundada en 2018, dedicada a la prevención de la violencia autoinfligida y a la promoción del pedir ayuda como estrategia de vida. Su colaboración con #GatoEncerrado articula el cuidado emocional y la empatía como parte activa del proceso creativo, en contextos artísticos y educativos.",
    image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/IsabelAC.jpg",
  },
  Dirección: {
    name: "Gilberto Corrales",
    bio: "Director, dramaturgo y actor. Licenciado en Teatro por la Facultad de Artes de la UABC, ha dirigido más de cuarenta obras, la mayoría de su autoría. Su trabajo explora la transdisciplina y la investigación del lenguaje escénico. Fundador de Incendio Producciones, sus obras han estado presentes en la Muestra Nacional de Teatro y en festivales de Colombia, Argentina y EE.UU. Ganador del Premio Juventud 2016 y del FITU UNAM. Dirige el Contagio Tijuana y colabora con artistas como Jorge Ballina y Daniel Primo.",
    image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/gil-corrales.gif",
  },
    Dramaturgia: {
    name: "Carlos A. Pérez H.",
    bio: "Comunicólogo, autor, y artista transmedia. Su obra habita entre teatro, escritura y tecnología, proponiendo una poética crítica y humana. Formado en el ITESO, la Universidad de Salamanca y LABASAD Barcelona, integra astrología psicológica, cuerpo y arte digital en una mirada simbólica. Creador del universo transmedia #GatoEncerrado, concibe el acto creativo como una forma de acompañamiento y transformación.",
    image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/carlos_perez.gif",
  },
  "Producción": {
    description:
      "Un equipo que coordina, articula y acompaña cada engranaje de la producción escénica con mirada sensible, técnica y humana.",
    members: [
  
      {
        name: "Miroslava Wilson",
        role: "Producción Ejecutiva",
        bio: "Productora ejecutiva, directora y asesora de movimiento. Originaria de Hermosillo y radicada en Tijuana, es fundadora de Péndulo Cero A.C. y educadora de movimiento somático certificada por Body Mind Movement. Su trabajo interdisciplinario vincula arte, medio ambiente y humanismo. Ha presentado su obra en Asia, América y Europa, y actualmente impulsa proyectos como Casa Viva y SomasSomos.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Miroslava%20.jpg",
      },
          {
        name: "Rosalía Hernández Millán",
        role: "Producción General y Vinculación Social",
        bio: "Presidenta de Isabel A.C. Ayuda para la Vida, Maestra en Psicobiología y Neurociencia Cognitiva (UAB). Su labor impulsa la integración entre arte y bienestar emocional, fortaleciendo el puente entre el proyecto escénico y la comunidad.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rosslee.png",
      },
      {
        name: "Marcela Durán Mulia",
        role: "Producción Administrativa",
        bio: "Actriz, gestora y representante legal de Incendio Producciones. Licenciada en Comunicación (UABC) y Maestra en Alta Dirección Corporativa (Humanitas). Ha participado en la Muestra Nacional de Teatro, ENARTES y otros festivales internacionales. Su mirada estratégica une la gestión cultural con la sensibilidad artística.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/marcela.png",
      },
      {
        name: "Gabriel Monroy",
        role: "Asistencia de Dirección y Gestión",
        bio: "Actor, fotógrafo escénico y gestor. Licenciado en Artes Escénicas por la Universidad de Sonora. Creador de la serie fotográfica 'Reflejos de la escena', exhibida internacionalmente. Su mirada visual y su acompañamiento escénico fortalecen el proceso de dirección.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/gabriel.jpg",
      },
      {
        name: "Rocío Morgan",
        role: "Asistencia Ejecutiva",
        bio: "Gestora cultural y apoyo logístico de producción. Su labor sostiene los procesos administrativos y humanos que hacen posible la operación cotidiana de la obra.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/rocio.jpg",
      },
      {
        name: "María Diana Laura Rodriguez",
        role: "Enlace de Producción",
        bio: "Maquillista y traspunte en el Teatro Camafeo. Fue un apoyo operativo clave en la etapa temprana de #GatoEncerrado y facilitó el enlace con el director Gilberto Corrales, gesto que definió la continuidad del proyecto. Su iniciativa y acompañamiento hicieron posible que el montaje avanzara en el momento más decisivo.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariadianalaura.jpg",
      },
    ],
  },
  Elenco: {
    description:
      "Actores y actrices que encarnan el pulso emocional de la obra desde la fisicalidad, la voz y la presencia simbólica.",
    members: [
      {
        id: "elenco-cyndi",
        name: "Cynthia Teresa Rodríguez Aguirre",
        role: "Intérprete",
        bio: "Artista interdisciplinaria egresada de la UABC. Su práctica integra fotografía, escritura y teatro. Ha participado en el San Diego Fringe Festival y en montajes de Incendio Producciones. Actualmente se enfoca en la dirección escénica y la exploración visual.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/cyndi.jpg",
      },
      {
        id: "elenco-mariana",
        name: "Mariana de los Santos",
        role: "Intérprete",
        bio: "Actriz tijuanense formada en CEART y con experiencia en cine y teatro contemporáneo. Su trabajo corporal revela una sensibilidad poética que dialoga entre lo íntimo y lo colectivo.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/mariana.jpg",
      },
      {
        id: "elenco-ricardo",
        name: "Ricardo Márquez Salgado",
        role: "Intérprete",
        bio: "Comunicólogo, modelo y actor. Ha participado en teatro, cine y publicidad. Destacan sus coprotagónicos en 'Ideas para no morir en el anonimato' y 'Entre Dos'. Su presencia combina energía escénica y precisión estética.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/ricardo.jpg",
      },
      {
        id: "elenco-carlos-valdez",
        name: "Carlos Valdez Rosas",
        role: "Intérprete",
        bio: "Actor y productor de Incendio Producciones. Su trabajo combina performance, posdrama e interdisciplina. Ha participado en la Muestra Nacional de Teatro y festivales internacionales en Argentina y Estados Unidos.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/carlitos.jpg",
      },
    ],
  },
  "Diseño Escénico": {
    description:
      "Diseñadoras y diseñadores que construyen atmósferas visuales y espaciales para expandir la poética de la obra.",
    members: [
      {
        name: "Jorge Ballina",
        role: "Escenografía",
        bio: "Arquitecto y escenógrafo con más de 120 obras en teatro, danza y ópera. Miembro del Sistema Nacional de Creadores de Arte, ha sido galardonado con premios internacionales como el World Stage Design Toronto y Calgary. Su trabajo combina estructura y poesía visual.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/jorge.jpg",
      },
      {
        name: "Daniel Primo",
        role: "Video Escenográfico e Iluminación",
        bio: "Artista visual y diseñador escénico. Explora la relación entre multimedia y espacio escénico. Integrante del Sistema Nacional de Creadores, su trabajo ha sido presentado en Europa, Asia y América. Cofundador de Engranaje Invertebrado.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/primo.jpg",
      },
      {
        name: "Ximena Inurreta",
        role: "Asistente de Diseño de Escenografía",
        bio: "Diseñadora escénica emergente que apoya el desarrollo de atmósferas visuales y transiciones espaciales en el montaje de #GatoEncerrado.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Ximena.jpg",
      },
    ],
  },
  "Música y Sonido": {
    description:
      "Artistas que modelan la experiencia auditiva, desde la composición musical hasta la espacialización del sonido.",
    members: [
      {
        name: "Lía Pérez",
        role: "Diseño Sonoro",
        bio: "Artista sonora con más de doce años de experiencia. Fundadora de Concrete Sounds, ha colaborado en filmes como 'Ya no estoy aquí' y 'Monos'. Su especialidad es la creación de paisajes inmersivos que amplían la dimensión sensorial del teatro.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/lia.jpg",
      },
      {
        name: "Diego Madera",
        role: "Composición Musical",
        bio: "Músico y compositor cuyo trabajo explora la tensión entre sonido y silencio. Su pieza original acompaña los pasajes emocionales de la obra.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png",
      },
    ],
  },
  "Vestuario y Caracterización": {
    description:
      "Diseño textil y caracterización que traducen la psicología de los personajes en textura, color y forma.",
    members: [
      {
        name: "Karla Flores",
        role: "Realización de Vestuario",
        bio: "Diseñadora de vestuario que traduce emociones en textura, movimiento y color. Su trabajo aporta profundidad simbólica a la corporalidad de los intérpretes.",
        image: "https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/Karla.jpg",
      },
      {
        name: "Jonathan Lazcano",
        role: "Pelucas y Caracterización Capilar",
        bio: "Artista de caracterización. Su trabajo artesanal da vida y coherencia visual a los personajes a través del detalle y la textura.",
        image: "/images/placeholder-diseno.jpg",
      },
    ],
  },
  "Realización Técnica": {
    description:
      "Especialistas que construyen y operan la infraestructura escénica para que cada función suceda con precisión y seguridad.",
    members: [
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
    ],
  },

  "Colaboradores y Agradecimientos": {
    description:
      "Detrás de cada función existe una constelación de manos, miradas y corazones que hacen posible la obra de Es un Gato Encerrado. Este bloque celebra su labor silenciosa y luminosa.",
    members: [],
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
  const [selectedElencoId, setSelectedElencoId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const accordionItemRefs = useRef({});
  const pendingScrollRef = useRef(null);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== "undefined" ? window.innerWidth < 768 : false);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  useEffect(() => {
    if (isMobile && selectedElencoId) {
      setSelectedElencoId(null);
    }
  }, [isMobile, selectedElencoId]);

  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return;

    const targetNode = accordionItemRefs.current[pendingScrollRef.current];
    pendingScrollRef.current = null;
    if (!targetNode) return;

    const scrollMargin =
      parseFloat(getComputedStyle(targetNode).scrollMarginTop) || 0;
    const rect = targetNode.getBoundingClientRect();
    const desiredY = window.scrollY + rect.top - scrollMargin;

    // Ajuste inmediato antes del siguiente repintado; sin animar para evitar rebotes.
    window.scrollTo({ top: desiredY, behavior: "auto" });
  }, [openSection]);

  const renderRole = (data, roleKey) => {
    const isElenco = roleKey === "Elenco";
    const useRoundAvatars =
      isMobile &&
      [
        "Diseño Escénico",
        "Música y Sonido",
        "Vestuario y Caracterización",
        "Realización Técnica",
        "Producción",
      ].includes(roleKey);
    const desktopCircleGroups = [
      "Diseño Escénico",
      "Música y Sonido",
      "Producción",
      "Realización Técnica",
      "Vestuario y Caracterización",
    ];
    const useDesktopCircleGrid = !isMobile && desktopCircleGroups.includes(roleKey);
    const useElencoDesktopGrid = !isMobile && isElenco;
    if (Array.isArray(data?.members)) {
      const isElencoClickable = isElenco && !isMobile;
      const membersWithId = data.members.map((member, idx) => ({
        member,
        id: member.id || `${member.name}-${idx}`,
        idx,
      }));
      const activeElencoMember =
        isElencoClickable && selectedElencoId
          ? membersWithId.find(({ id }) => id === selectedElencoId)?.member
          : null;

      return (
        <div className="space-y-6">
          {data.description && (
            <p className="text-slate-300/80 leading-relaxed font-light mb-2 md:text-base sm:text-sm">
              {data.description}
            </p>
          )}
          {isElencoClickable && activeElencoMember && (
            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              className="relative overflow-hidden rounded-xl border border-white/5 shadow-lg shadow-black/30 max-h-[520px]"
            >
              <img
                className="w-full h-full object-cover"
                src={activeElencoMember.image}
                alt={`Retrato de ${activeElencoMember.name}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h4 className="font-display text-2xl text-purple-100 drop-shadow">
                  {activeElencoMember.name}
                </h4>
                {activeElencoMember.role && (
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-200/80">
                    {activeElencoMember.role}
                  </p>
                )}
              </div>
            </motion.div>
          )}
          {useElencoDesktopGrid ? (
            <motion.div layout className="grid gap-6 md:grid-cols-3">
              {membersWithId.map(({ member, id: memberId }) => {
                const isActive = selectedElencoId === memberId;
                const handleToggle = () =>
                  setSelectedElencoId((prev) => (prev === memberId ? null : memberId));

                return (
                  <motion.button
                    key={memberId}
                    type="button"
                    layout
                    transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                    onClick={handleToggle}
                    className={`flex flex-col items-center gap-3 text-center rounded-3xl p-6 border transition shadow-lg shadow-black/40 backdrop-blur-sm ${
                      isActive
                        ? "border-purple-400/60 bg-white/10 ring-2 ring-purple-200/50"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border border-white/10 shadow-xl shadow-black/50 bg-black/30 flex items-center justify-center">
                      <img
                        className="w-full h-full object-cover"
                        src={member.image}
                        alt={`Retrato de ${member.name}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-xl text-purple-100">{member.name}</h4>
                      {member.role && (
                        <p className="text-xs uppercase tracking-[0.35em] text-purple-200/70">
                          {member.role}
                        </p>
                      )}
                      {member.bio && (
                        <p className="text-sm text-slate-200 leading-relaxed">{member.bio}</p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : useDesktopCircleGrid ? (
            <div className="grid gap-6 md:grid-cols-3">
              {membersWithId.map(({ member, id: memberId }) => (
                <div
                  key={memberId}
                  className="flex flex-col items-center gap-3 text-center bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-lg shadow-black/40"
                >
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border border-white/10 shadow-xl shadow-black/50 bg-black/30 flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover"
                      src={member.image}
                      alt={`Retrato de ${member.name}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-xl text-purple-100">{member.name}</h4>
                    {member.role && (
                      <p className="text-xs uppercase tracking-[0.35em] text-purple-200/70">
                        {member.role}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-sm text-slate-200 leading-relaxed">{member.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div layout className="grid gap-6 md:grid-cols-2">
              {membersWithId.map(({ member, id: memberId }) => {
                const isActive = isElencoClickable && selectedElencoId === memberId;
                const handleToggle = () =>
                  isElencoClickable
                    ? setSelectedElencoId((prev) => (prev === memberId ? null : memberId))
                    : undefined;

                if (useRoundAvatars) {
                  return (
                    <motion.div
                      layout
                      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                      key={memberId}
                      className="glass-effect rounded-xl p-5 flex flex-col gap-4 border border-white/5 items-center sm:flex-row sm:items-start"
                    >
                      <img
                        className="h-20 w-20 flex-shrink-0 rounded-full object-cover shadow-lg shadow-black/30"
                        src={member.image}
                        alt={`Retrato de ${member.name}`}
                        loading="lazy"
                      />
                      <div className="space-y-2 text-center sm:text-left sm:flex-1">
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
                        {member.url && (
                          <a
                            href={member.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-purple-200 transition hover:text-purple-100 underline-offset-4"
                          >
                            {member.urlLabel ?? "Ver perfil"}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    layout
                    transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                    key={memberId}
                    className={`glass-effect rounded-xl p-5 flex flex-col md:flex-row gap-4 border border-white/5 transition-all duration-300 ${
                      isElencoClickable
                        ? `cursor-pointer hover:border-purple-400/40 ${
                            isActive ? "border-purple-400/60 ring-2 ring-purple-300/40" : ""
                          }`
                        : ""
                    }`}
                    onClick={handleToggle}
                    role={isElencoClickable ? "button" : undefined}
                    tabIndex={isElencoClickable ? 0 : undefined}
                    onKeyDown={
                      isElencoClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleToggle();
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="w-full md:w-44 overflow-hidden rounded-lg border border-white/5 bg-black/30">
                      <img
                        className="w-full h-44 object-cover shadow-lg shadow-black/30"
                        src={member.image}
                        alt={`Retrato de ${member.name}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
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
                      {member.url && (
                        <a
                          href={member.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-purple-200 transition hover:text-purple-100 underline-offset-4"
                        >
                          {member.urlLabel ?? "Ver perfil"}
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
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

  const handleAccordionChange = (nextValue) => {
    const value = nextValue ?? null;
    setOpenSection(value);
    pendingScrollRef.current = value;
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
          
            Un colectivo de artistas y alianzas multidisciplinarias reunidas en el cruce entre creación escénica, pensamiento crítico y cuidado emocional.
Cada colaboración forma parte activa del universo que la obra pone en escena.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-4"
            value={openSection ?? undefined}
            onValueChange={handleAccordionChange}
          >
            {Object.entries(teamData).map(([role, data], index) => {
              const itemValue = `item-${index}`;
              return (
                <AccordionItem
                  value={itemValue}
                  key={role}
                  className="glass-effect rounded-lg border-none overflow-hidden scroll-mt-24"
                  ref={(node) => {
                    if (node) {
                      accordionItemRefs.current[itemValue] = node;
                    } else {
                      delete accordionItemRefs.current[itemValue];
                    }
                  }}
                >
                  <AccordionTrigger className="font-display text-xl md:text-2xl text-slate-100 p-6 hover:no-underline hover:bg-white/5 transition-colors duration-300">
                    {role}
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0 bg-black/20">
                    {renderRole(data, role)}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default Team;
