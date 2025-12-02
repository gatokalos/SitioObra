import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Feather,
  Palette,
  Smartphone,
  Coffee,
  Drama,
  Film,
  Video,
  Music,
  Heart,
  Brain,
  Map,
  Scan,
  Users,
  RadioTower,
  Sparkles,
  MapIcon,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MiniverseModal from '@/components/MiniverseModal';
import CallToAction from '@/components/CallToAction';
import { fetchBlogPostBySlug } from '@/services/blogService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ARExperience from '@/components/ar/ARExperience';
import MiniversoSonoroPreview from '@/components/miniversos/sonoro/MiniversoSonoroPreview';
import AutoficcionPreview from '@/components/novela/AutoficcionPreview';
import { recordShowcaseLike } from '@/services/showcaseLikeService';
import { useMobileVideoPresentation } from '@/hooks/useMobileVideoPresentation';
import IAInsightCard from '@/components/IAInsightCard';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const GAT_COSTS = {
  quironFull: 200,
  graficoSwipe: 110,
};
const showcaseDefinitions = {
  miniversos: {
    label: 'Drama',
    type: 'tragedia',
    intro:
      'Aquí nace la obra dentro de la obra. El gato encerrado de Es un gato encerrado.',
    cartaTitle: '#VibraciónEscénica',
    notaAutoral: 'De la escena brotó el universo:\nvoz, trance y cuerpo\nabriendo portales.',
      narrative: [
      'En este miniverso puedes entrar al mundo de Silvestre: escuchar sus ecos, leer a sus fantasmas… o conversar directamente con su trasunto, el Payasito Tiste, en un chat que habita la herida.',
    ],
    ctaLabel: 'Hablar con Silvestre',
    ctaDescription:
      'Activa el vínculo con la voz que aún no se apaga. Aquí es donde Silvestre —o lo que queda de él— te responde.',
    iaProfile: {
      type: 'GPT-4o afinada para voz literaria y contención emocional.',
      interaction: '1 a 3 mensajes con Silvestre (texto o voz).',
      tokensRange: '250–600 tokens por sesión.',
      coverage: 'Cubierto por suscriptores; entra en el plan de soporte colectivo.',
      footnote: 'Cada conversación tiene un costo real. Gracias por mantenerla viva.',
    },
  },
  copycats: {
    label: 'Cine',
    type: 'cinema',
    intro: 'El cine dentro de #GatoEncerrado es un laboratorio donde la realidad se revela por roce, no por imitación. Obra, proceso y mirada se mezclan hasta volver indistinguibles sus fronteras.',
    promise: 'Aquí no solo ves cine: te invitamos a entrar a su laboratorio.',
    theme:
      'La doble vida de una imagen: aquello que se ve y aquello que tiembla detrás. CopyCats (farsa lúcida) y Quirón (herida íntima) responden a la misma pregunta en dos lenguajes.',
    tone: ['Premiere íntima', 'Laboratorio abierto', 'Cine con memoria'],
    cartaTitle: '#LuzQueHiere',
    copycats: {
      title: 'CopyCats',
      description: 'Un juego serio sobre cómo nos repetimos sin notarlo. Mira su bitácora creativa y descubre cómo surgió esta pieza.',
      microcopy:
        'CopyCats es un ensayo cinematográfico sobre el desgaste creativo: un making-of que piensa el acto de crear mientras sucede. Se detiene en el burnout, en la autocrítica feroz, y en ese desprecio silencioso que a veces sentimos por la obra… justo cuando más nos necesita.',
      assets: [
        {
          id: 'copycats-carta',
          label: 'Carta audiovisual (4:02)',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/ensayos/La%20Cadena%20del%20Gesto.mp4',
        },
        {
          id: 'copycats-ensayo',
          label: 'La Cadena del Gesto (4:28)',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/ensayos/La%20Cadena%20del%20Gesto.mp4',
        },
      ],
      tags: ['Cine-ensayo', 'Identidad Digital', 'Archivo autoficcional'],
    },
    quiron: {
      title: 'Quirón',
      description: 'Mira el teaser y los stills de rodaje de un cortometraje que busca la vulnerabilidad donde casi no se nota.',
      microcopy:
        'Quirón explora un silencio heredado: una familia atravesada por el suicidio de un padre y un abuelo. La película nace para darle lenguaje a ese dolor y acercarnos a lo que normalmente se calla.',
      teaser: {
        id: 'quiron-teaser',
        label: 'Teaser oficial',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron.mp4',
      },
      stills: [
        {
          id: 'quiron-still-01',
          label: 'Still 01 · Primera llamada',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/stills%20-%20quiron/rodaje%201.jpg',
        },
        {
          id: 'quiron-still-02',
          label: 'Still 02 · Lectura en el set',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/stills%20-%20quiron/IMG_2290.JPG',
        },
        {
          id: 'quiron-still-03',
          label: 'Still 03 · Señales del día',
          url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/stills%20-%20quiron/IMG_2382.JPG',
        },
      ],
    },
    collaborators: [
      {
        id: 'viviana-gonzalez',
        name: 'Viviana González',
        role: 'Dirección de foto y registro creativo',
        bio: 'Cineasta y documentalista. Su cámara captura el pulso emocional de CopyCats y Quirón.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/placeholder-colaboradores.jpg',
        anchor: '#team',
      },
      {
        id: 'diego-madera',
        name: 'Diego Madera',
        role: 'Compositor · Tema musical',
        bio: 'Músico y compositor cuyo trabajo explora la tensión entre sonido y silencio.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/diego.png',
        anchor: '#team',
      },
      {
        id: 'maria-diana-laura-rodriguez',
        name: 'María Diana Laura Rodriguez',
        role: 'Coordinadora',
        bio: 'Productora en línea que facilita procesos con una disponibilidad impecable.',
        image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/equipo/placeholder-produccion.jpg',
        anchor: '#team',
      },
    ],
    bridge: {
      title: 'Una línea que vibra entre ambas historias',
      description:
        'CopyCats y Quirón dialogan desde extremos distintos del mismo territorio. Una filma el desgaste creativo y la fractura del proceso;la otra abre una confesión íntima que decide hablar del suicidio sin rodeos.',
      note:
        'Dos películas, dos vulnerabilidades distintas, un mismo impulso: usar el arte para tocar aquello que no queremos decir en voz alta y encontrar otra manera de contarlo.',
    },
    screening: {
      title: 'Screening privado · Marzo · Cineteca CECUT',
      description:
        'Únete al universo transmedia y asegura tu acceso al primer screening doble de CopyCats + Quirón, con conservatorio del equipo.',
      cta: 'Quiero ser parte del screening',
      footnote: 'El cine es otro modo de entrar al encierro. Acompáñanos en marzo para ver ambas películas antes que nadie.',
    },
    notaAutoral: 'Cuando la escena no alcanza,\nla cámara recuerda\nQuirón, CopyCats,\nmismo espacio en otra luz.',
    iaProfile: {
      type: 'GPT-4o mini + subtítulos vivos y notas críticas asistidas.',
      interaction: 'Notas críticas y captions contextuales por espectador.',
      tokensRange: '200–450 tokens por visita.',
      coverage: 'Incluido en las suscripciones transmedia.',
      footnote: 'La IA acompaña la mirada; la decisión sigue siendo humana.',
    },
  },
  lataza: {
    label: 'Artesanías',
    type: 'object-webar',
    slug: 'taza-que-habla',
    subtitle: 'Esta no es una taza. Es un boleto.',
    intro:
      'Un objeto cotidiano convertido en símbolo de comunión. Cada taza está vinculada a un sentimiento. Cada sentimiento, a una historia personal.',
    note: 'Apunta tu cámara a la taza. La pista aparecerá.',
    ctaLabel: 'Probar activación WebAR',
    ctaLink: '/webar/taza/index.html',
    ctaMessage: 'Cuando liberes la activación WebAR, descubrirás la pista que le corresponde a tu taza.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/taza_h.png',
    sentiments: ['Es tu manera de apoyar la causa social de Gato Encerrado.'], 
    phrases: ['La taza te habla.'],
    instructions: [
      'Permite el acceso a tu cámara para iniciar.',
      'Coloca la taza completa en cuadro, con buena iluminación.',
      'Mantén el marcador visible hasta que aparezca la orbe.',
    ],
    comments: [
      {
        id: 'la-taza-comment-1',
        quote: '“La taza me mostró una frase que me persiguió toda la semana.”',
        author: 'Usuario anónimo',
      },
      {
        id: 'la-taza-comment-2',
        quote: '“No entendí nada… hasta que le agarré el modo.”',
        author: 'Sofía B.',
      },
    ],
    cartaTitle: '#EstoNoEsUnaTaza',
    notaAutoral: 'Una taza que escucha.\nUn marcador que mira.\nLo cotidiano también es ritual.',
    iaProfile: {
      type: 'IA ligera para pistas contextuales + WebAR.',
      interaction: '1 activación guiada por objeto (escaneo breve).',
      tokensRange: '90–140 tokens por activación.',
      coverage: 'Cubierto por suscriptores; no hay costo directo por usuario.',
      footnote: 'La IA solo guía la pista; el ritual lo completa quien sostiene la taza.',
    },
  },
  miniversoNovela: {
    label: 'Literatura',
    type: 'blog-series',
    slug: null,
    intro:
      'Aquí se cruzan la autoficción, la novela gráfica y las vidas que aún no caben en escena. Fragmentos, procesos y pistas que solo existen cuando alguien las lee.',
    cartaTitle: '#PáginaViva',
    notaAutoral:
      'La palabra devolvió lo que el gato se tragó:\nMi Gato Encerrado\nhuyó de sí misma y se encontró.',
    entries: [
      {
        id: 'compra-libro',
        title: 'Edición física',
        description: 'La novela completa en su versión impresa. Incluye QR secreto.',
        image: '/assets/edicion-fisica.png',
        type: 'purchase-link',
        url: '/comprar-novela',
      },
      {
        id: 'novel-apps',
        title: 'Activa tu novela',
        description:
          'Cada formato tiene su propia app interactiva. La novela de autoficción ya se puede activar; el cómic transmedia abre pronto su lector con pistas y capas expandidas.',
        type: 'novel-apps',
        apps: [
          {
            id: 'autoficcion-app',
            name: 'Lector interactivo',
            description:
              'Lee los primeros fragmentos de la novela y desbloquea preguntas guiadas en cuatro planos de lectura: académico, psicológico, narrativo y teatral.',
            snippet: {
              tagline: 'Contraportada transmedia',
              text:
                'Al escanear el QR de tu ejemplar se desbloquean lecturas personalizadas. Aquí puedes probar una versión de inicio.',
              sideLayout: true,
            },
            ctaLabel: 'Leer fragmentos',
            ctaAction: 'openAutoficcionPreview',
          },
        ],
      },
      {
        id: 'comentarios-lectores',
        title: 'Conversaciones con lectores',
        type: 'quotes',
        quotes: [
          {
            quote: '“No sabía que un libro podía hablarme a mitad de la página.”',
            author: 'Lectora anónima',
          },
        ],
      },
    ],
    ctaLabel: 'Leer los primeros fragmentos',
    iaProfile: {
      type: 'GPT-4o mini + voz sintética para fragmentos.',
      interaction: 'Guía de lectura y acompañamiento breve por capítulo.',
      tokensRange: '150–320 tokens por fragmento leído.',
      coverage: 'Cubierto por suscriptores; lectura sin costo adicional.',
      footnote: 'La IA susurra; la historia sigue siendo tuya.',
    },
  },
  miniversoSonoro: {
    label: 'Sonoridades',
    type: 'audio-dream',
    intro:
      'Este miniverso mezcla imágenes errantes, pistas sonoras y palabras móviles para que crees tu propia atmósfera. Solo entra, prende un video, ponle la música que quieras, elige un poema… y deja que la combinación te sorprenda.',
    highlights: [
      'Video que fluye solo.',
      'Música que tú eliges.',
      'Poemas que respiran en pantalla.',
    ],
    exploration: [
      'El video corre por su cuenta — cambia con cada visita.',
      'Tú eliges la música — ajusta el ánimo del sueño.',
      'Escoge un poema — y observa cómo se desliza mientras todo ocurre.',
    ],
    closing: [
      'Sueño en tres capas',
      'Cada combinación abre un sueño distinto.',
      'Entra y crea el tuyo.',
    ],
    videoUrl:
      'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/videos-v/Vacio.mov',
    musicOptions: [
      {
        id: 'silencio',
        label: 'Silencio',
        url: '',
      },
      {
        id: 'ensayo-abierto',
        label: 'Ensayo Abierto (pista)',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Sonoridades/audio/cat_theme.m4a',
      },
    ],
    poems: [
      {
        id: 'pulmon',
        label: 'Poema 1 — “Pulmón”',
        text: 'La noche se abre como un pulmón cansado.',
      },
      {
        id: 'cuerpo',
        label: 'Poema 2 — “Cuerpo”',
        text: 'Lo que cae del sueño también cae del cuerpo.',
      },
    ],
    cartaTitle: '#SueñoEnCapas',
    notaAutoral: 'sueña una imagen.\nElige un pulso.\nDeja que el poema respire por ti.',
    iaProfile: {
      type: 'GPT-4o mini para poemas móviles + curaduría sonora.',
      interaction: 'Selección de poema y mezcla guiada.',
      tokensRange: '130–280 tokens por mezcla.',
      coverage: 'Incluido en la suscripción transmedia.',
      footnote: 'La IA elige la forma; tú eliges el ánimo.',
    },
  },
  miniversoGrafico: {
    label: 'Gráficos',
    type: 'graphic-lab',
    intro:
      'Colección viva de exploraciones visuales: cómics en curso, viñetas interactivas, posters simbólicos, caricaturas conceptuales, murales colaborativos y avances con IA/técnicas mixtas.',
    cartaTitle: '#FronteraAbierta',
    notaAutoral:
      'Garabatea tu límite, dibuja tu refugio.\nLo gráfico como portal emocional.\nCada trazo se siente antes de entenderse.',
    collection: [
      'Cómics en curso y por venir',
      'Viñetas interactivas',
      'Posters simbólicos',
      'Caricaturas conceptuales',
      'Murales colaborativos',
      'Avances con IA y técnicas mixtas',
    ],
    swipe: {
      title: 'Swipe narrativo (modo viñeta)',
      description: 'Haz scroll hacia arriba para navegar por tarjetas verticales.',
      steps: [
        'Cada tarjeta revela una escena, una decisión o una herida.',
        'Desliza y elige: ¿quieres ver lo que pasa o lo que duele?',
      ],
    },
    swipeShowcases: [
      {
        id: 'tres-pies-galeria',
        title: 'Tres Pies al Gato — proceso visual',
        description: 'Exploraciones de la novela gráfica.',
        previewImage: '/assets/silvestre-comic.jpeg',
        type: 'internal-reading',
        previewMode: 'pdf',
        previewPdfUrl:
          'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/grafico/Cap%20Aula.pdf',
        swipeNotes: [
          'Swipe vertical en PDF; cada página es una viñeta-ritual.',
          'Optimizado para móvil y tableta.',
        ],
      },
    ],
    
    quote: {
      text: '“El cómic me habló justo cuando dudaba de seguir leyendo.”',
      author: 'Lectora anónima',
    },
    ctas: {
      primary: 'Explora el miniverso gráfico',
      secondary: 'Súmate a la residencia gráfica',
    },
    iaProfile: {
      type: 'IA asistida para glifos y variaciones gráficas.',
      interaction: 'Swipe narrativo con prompts curados.',
      tokensRange: '110–220 tokens por sesión.',
      coverage: 'Cubierto por suscriptores; sin costo por visitante.',
      footnote: 'La IA abre caminos; el trazo final sigue siendo humano.',
    },
  },
  miniversoMovimiento: {
    label: 'Movimiento',
    type: 'movement-ritual',
    pendingName: 'La Ruta de las Diosas',
    tagline: 'Diosas en danza. Ciudades como escenario. Tecnología como portal.',
    overview: [
      'En este miniverso, el cuerpo se convierte en conjuro. La danza, en escritura. Y la ciudad… en altar vivo.',
      'La Ruta de las Diosas es una experiencia coreográfica transmedial que recorre plazas, parques y espacios públicos para activar un ritual contemporáneo con avatares, realidad aumentada y movimiento colectivo.',
    ],
    diosaHighlights: [
      'Una presencia digital inspirada en mitologías mesoamericanas.',
      'Diseñada con motion capture.',
      'Acompañada de música original.',
      'Proyectada con videomapping láser durante las noches.',
    ],
    dayNight: [
      'Durante el día, los talleres coreográficos en comunidad trazan mapas sensibles sobre el territorio.',
      'Durante la noche, los cuerpos físicos y virtuales se funden en un mismo acto escénico.',
    ],
    invitation: '¿Y tú? ¿Bailarás con nosotrxs o solo mirarás pasar a las diosas?',
    actions: [
      {
        id: 'ruta',
        label: 'Explora su ruta',
        description: 'Sigue el mapa interactivo o la línea de tiempo animada de cada estación (Tijuana, La Paz, etc.).',
        badge: 'CTA principal',
        buttonLabel: 'Explorar',
        toastMessage: 'Muy pronto liberaremos el mapa coreográfico y el timeline de estaciones.',
        icon: Map,
      },
      {
        id: 'marcador-ar',
        label: 'Activa un marcador AR en tu ciudad',
        description: 'Activa la cámara (WebAR) o abre la guía para instalar la app y recibir instrucciones.',
        buttonLabel: 'Activar AR',
        toastMessage: 'La guía WebAR se está terminando; te avisaremos cuando la cámara pueda abrir el portal.',
        icon: Scan,
      },
      {
        id: 'talleres',
        label: 'Inscríbete a los talleres coreográficos',
        description: 'Conecta con la comunidad y reserva tu lugar en los talleres diurnos que trazan la ruta.',
        buttonLabel: 'Inscribirme',
        toastMessage: 'Abriremos el formulario conectado a Supabase para registrar tu participación.',
        icon: Users,
      },
      {
        id: 'livestream',
        label: 'Sigue el livestream de la función final',
        description: 'Activa un embed o cuenta regresiva para ver la ruta completa cuando llegue la noche.',
        buttonLabel: 'Ver livestream',
        toastMessage: 'El livestream y su countdown estarán activos antes de la función final.',
        icon: RadioTower,
      },
    ],
  
    cartaTitle: '#RitualEnMovimiento',
    notaAutoral: 'El cuerpo es conjuro.\nLa ciudad tiembla y abre un portal.\nLa ruta solo existe si alguien baila.',
    iaProfile: {
      type: 'IA de ruta + prompts de movimiento guiados en app.',
      interaction: 'Selección de estación y avatar ritual en AR.',
      tokensRange: '180–320 tokens por usuario.',
      coverage: 'Incluido en la suscripción transmedia.',
      footnote: 'La IA guía; el rito sucede cuando alguien baila.',
    },
  },
  oraculo: {
    label: 'Oráculos',
    type: 'oracle',
    intro:
      'Preguntas que no buscan respuestas, sino resonancia. Alimenta la mente del Gato y gana GATokens por compartir tu pensamiento. El Oráculo no da respuestas, pero sí te recompensa por cada huella que dejas en la red del misterio. Tu pensamiento también construye este universo.',
    loops: [
      'Responde preguntas simbólicas, filosóficas, existenciales, absurdas o personales.',
      'Cada respuesta se guarda como semilla de conocimiento simbólico para IA, literatura y obra interactiva.',
      'Mientras más participas, más GATokens generas (proof-of-resonance con límites diarios anti-spam).',
    ],
    rewards: [
      { title: 'Responder a una pregunta profunda', tokens: '+20 GAT', description: 'Comparte una reflexión que vibre en lo simbólico o emocional.' },
      { title: 'Elegir y comentar reflexiones de otrxs', tokens: '+30 GAT', description: 'Modo foro: amplifica ideas y suma tu mirada.' },
      { title: 'Volver tras una semana', tokens: '+30 GAT', description: 'Retorno que sostiene el hilo y da seguimiento a tu huella.' },
      { title: 'Invitar a alguien con su primera reflexión', tokens: '+50 GAT', description: 'Trae a otra mente al Oráculo. Recompensa única por invitación.' },
    ],
    limitsNote: 'Límites por día para evitar spam y mantener el valor simbólico.',
    seedNotes: [
      'Las respuestas se almacenan como semillas de conocimiento simbólico.',
      'Enriquecen una base de datos viviente para literatura, IA personalizada y obra interactiva.',
      'Cada huella deja señal en la mente del Gato.',
    ],
    ctaLabel: 'Pregunta, responde y mintea',
    ctaDescription:
      'El Oráculo no da respuestas, pero sí te recompensa con GATokens por cada huella que dejas en la red del misterio. Tu pensamiento también construye este universo.',
    tagline: '🧠 Interacción que deja huella. 🪙 Reflexión que te recompensa.',
    cartaTitle: '#MinadoSimbólico',
    notaAutoral: 'Juega con el misterio.\nPiensa con el corazón.\nMintea con el alma.',
    iaProfile: {
      type: 'GPT-4o + embeddings simbólicos curados por la comunidad.',
      interaction: '1–3 reflexiones cortas por sesión; foro breve guiado.',
      tokensRange: '20–120 tokens por reflexión (promedio ~20 GAT).',
      coverage: 'Cubierto por suscriptores; las recompensas son GATokens internos.',
      footnote: 'El minado es simbólico y humano: no es financiero, es resonancia.',
    },
  },
};

const ShowcaseReactionInline = ({ showcaseId, title, description, buttonLabel }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');

  const handleReaction = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    const { success, error } = await recordShowcaseLike({ showcaseId, user });
    if (!success) {
      console.error('[ShowcaseReaction] Error guardando like:', error);
      toast({ description: 'No pudimos registrar el like. Intenta de nuevo más tarde.' });
      setStatus('idle');
      return;
    }

    setStatus('success');
    toast({ description: 'Gracias por tu apoyo en este escaparate.' });
  }, [showcaseId, status, user]);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleReaction}
          className={`rounded-full p-3 transition ${
            status === 'success'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 shadow-[0_0_25px_rgba(244,114,182,0.6)] text-white border border-transparent'
              : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white hover:from-purple-500 hover:to-indigo-500'
          }`}
          disabled={status === 'loading'}
        >
          <Heart size={20} />
        </button>
      </div>
      {buttonLabel ? (
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
          {status === 'loading' ? 'Enviando…' : buttonLabel}
        </p>
      ) : null}
    </div>
  );
};

  const formats = [
  {
    id: 'miniversos',
    title: 'Miniverso Dramático',
    description:
      'La obra como un miniverso dentro del mismo universo que ha generado.',
    icon: Drama,
    iconClass: 'text-purple-300',
    notaAutoral:
      'Aquí nunca abaca bien. Por lo menos no hasta el final.',
    iaTokensNote: '~300 por charla.',
  },
  {
    id: 'lataza',
    title: 'Miniverso Artesanías',
    description: 'Objeto ritual con WebAR. Una excusa para seguir la historia desde lo cotidiano.',
    icon: Coffee,
    iconClass: 'text-amber-300',
    notaAutoral:
      'Un objeto cotidiano que abrió un portal. La Taza no acompaña: revela. Lo que sostiene no es barro, sino vínculo.',
    iaTokensNote: '~90 por activación WebAR.',
  },
  {
    id: 'miniversoNovela',
    title: 'Miniverso Literatura',
    description: 'El teatro terminó, pero algo siguió hablando y de ese eco nace esta autoficción.',
    icon: BookOpen,
    iconClass: 'text-emerald-300',
    notaAutoral:
      'La novela es donde la escena se desborda. Fragmentos que respiran distinto cuando alguien los lee. Aquí la historia sigue probándose.',
    iaTokensNote: '~150 gatomonedas por capítulo.',
  },
  {
    id: 'miniversoGrafico',
    title: 'Miniverso Gráfico',
    description: 'Colección de viñetas interactivas, garabatos y símbolos en mutación.',
    icon: Palette,
    iconClass: 'text-fuchsia-300',
    notaAutoral:
      'Garabatea tu límite, dibuja tu refugio.\nLo gráfico como portal emocional.\nCada trazo se siente antes de entenderse.',
    iaTokensNote: '~110 por sesión.',
  },
  {
    id: 'copycats',
    title: 'Miniverso Cine',
    description: 'Filmes que piensan el cuerpo del Gato en clave cinematográfica.',
    icon: Film,
    iconClass: 'text-rose-300',
    notaAutoral:
      'La cámara miró lo que el teatro no podía sostener. CopyCats cuestiona; Quirón hiere con luz. Este espacio guarda esas miradas.',
    iaTokensNote: '~200 por espectador.',
  },
  {
    id: 'miniversoSonoro',
    title: 'Miniverso Sonoro',
    description: 'Capas de imagen, sonido y poema para soñar.',
    icon: Music,
    iconClass: 'text-cyan-300',
    notaAutoral:
      'Imagen, música y palabra en suspensión. Cada mezcla inventa otro ánimo. Aquí el sueño se edita solo.',
    iaTokensNote: '~130 por mezcla.',
  },
  {
    id: 'miniversoMovimiento',
    title: 'Miniverso Movimiento',
    description: 'Ruta coreográfica transmedial donde la ciudad se convierte en altar vivo.',
    icon: MapIcon,
    iconClass: 'text-sky-300',
    notaAutoral:
      'Diosas en danza. El mapa vibra si alguien lo recorre.',
    iaTokensNote: '~280 por mapa.',
  },
  {
    id: 'detodxs',
    title: 'Miniverso Apps',
    description: 'Experiencias digitales que te convierten en cómplice del universo.',
    icon: Smartphone,
    iconClass: 'text-lime-300',
    notaAutoral:
      'Tecnología como acompañamiento, no como solución. Experiencias que cuidan, preguntan y extienden la historia cuando nadie está mirando.',
    iaTokensNote: '~220 por mes.',
  },
  {
    id: 'oraculo',
    title: 'Miniverso Oráculo',
    description:
      'Preguntas que no buscan respuestas, sino resonancia.',
    icon: Brain,
    iconClass: 'text-indigo-300',
    notaAutoral: 'Juega con el misterio. Piensa con el corazón. Mintea con el alma.',
    iaTokensNote: 'Aquí ganas gatomonedas',
  },
];

const CAUSE_ACCORDION = [
  {
    id: 'tratamientos',
    title: 'Tratamientos emocionales',
    description:
      'Tu suscripción asigna hasta 6 sesiones a un joven sin costo para su familia. Isabel Ayuda para la Vida, A.C. activa las sesiones cuando se detecta riesgo emocional.',
    icon: HeartHandshake,
    metric: '6 sesiones promedio por suscriptor',
  },
  {
    id: 'residencias',
    title: 'Residencias creativas',
    description:
      'Laboratorios de 2 meses donde arte y acompañamiento reparan memoria y cuerpo. Cada 17 suscripciones financian una residencia completa.',
    icon: Palette,
    metric: '3 residencias activas por temporada',
  },
  {
    id: 'app-escolar',
    title: 'App Causa Social en escuelas',
    description:
      'Implementación y seguimiento semestral de la app de detección temprana. 75 suscripciones financian 1 escuela por semestre.',
    icon: Smartphone,
    metric: '5 escuelas atendidas por ciclo escolar',
  },
];

const Transmedia = () => {
  const [isMiniverseOpen, setIsMiniverseOpen] = useState(false);
  const [miniverseContext, setMiniverseContext] = useState(null);
  const [activeShowcase, setActiveShowcase] = useState(null);
  const [showcaseContent, setShowcaseContent] = useState({});
  const showcaseRef = useRef(null);
  const [openCauseId, setOpenCauseId] = useState(CAUSE_ACCORDION[0].id);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const pdfContainerRef = useRef(null);
  const supportSectionRef = useRef(null);
  const [pdfContainerWidth, setPdfContainerWidth] = useState(0);
  const pdfPageWidth = Math.max(pdfContainerWidth - 48, 320);
  const [isTazaARActive, setIsTazaARActive] = useState(false);
  const [isMobileARFullscreen, setIsMobileARFullscreen] = useState(false);
  const [showAutoficcionPreview, setShowAutoficcionPreview] = useState(false);
  const [micPromptVisible, setMicPromptVisible] = useState(false);
  const [hasShownMicPrompt, setHasShownMicPrompt] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSilvestreCoins, setShowSilvestreCoins] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const micTimeoutRef = useRef(null);
  const [isCinemaCreditsOpen, setIsCinemaCreditsOpen] = useState(false);
  const [openCollaboratorId, setOpenCollaboratorId] = useState(null);
  const [notaAutoralOpenMap, setNotaAutoralOpenMap] = useState({});
  const { isMobileViewport, canUseInlinePlayback, requestMobileVideoPresentation } = useMobileVideoPresentation();
  const { user } = useAuth();
  const [quironSpent, setQuironSpent] = useState(false);
  const [graphicSpent, setGraphicSpent] = useState(false);
  const [novelaQuestions, setNovelaQuestions] = useState(0);
  const [sonoroSpent, setSonoroSpent] = useState(false);
  const [tazaActivations, setTazaActivations] = useState(0);
  const [showQuironCommunityPrompt, setShowQuironCommunityPrompt] = useState(false);
  const [isQuironUnlocking, setIsQuironUnlocking] = useState(false);
  const [showQuironCoins, setShowQuironCoins] = useState(false);
  const [isQuironFullVisible, setIsQuironFullVisible] = useState(false);
  const [isNovelaSubmitting, setIsNovelaSubmitting] = useState(false);
  const [showNovelaCoins, setShowNovelaCoins] = useState(false);
  const [showSonoroCoins, setShowSonoroCoins] = useState(false);
  const [showTazaCoins, setShowTazaCoins] = useState(false);
  const [isTazaActivating, setIsTazaActivating] = useState(false);
  const [showGraphicCoins, setShowGraphicCoins] = useState(false);
  const [isGraphicUnlocking, setIsGraphicUnlocking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSpent = window.localStorage?.getItem('gatoencerrado:quiron-spent');
    if (storedSpent === 'true') {
      setQuironSpent(true);
      setIsQuironFullVisible(true);
    }
    const novelaStored = window.localStorage?.getItem('gatoencerrado:novela-questions');
    if (novelaStored && !Number.isNaN(Number.parseInt(novelaStored, 10))) {
      setNovelaQuestions(Number.parseInt(novelaStored, 10));
    }
    const graphicStored = window.localStorage?.getItem('gatoencerrado:graphic-spent');
    if (graphicStored === 'true') {
      setGraphicSpent(true);
    }
    const sonoroStored = window.localStorage?.getItem('gatoencerrado:sonoro-spent');
    if (sonoroStored === 'true') {
      setSonoroSpent(true);
    }
    const tazaStored = window.localStorage?.getItem('gatoencerrado:taza-activations');
    if (tazaStored && !Number.isNaN(Number.parseInt(tazaStored, 10))) {
      setTazaActivations(Number.parseInt(tazaStored, 10));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key === 'gatoencerrado:novela-questions') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) {
          setNovelaQuestions(value);
        }
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === 'true') {
        setSonoroSpent(true);
      }
      if (event.key === 'gatoencerrado:sonoro-spent' && event.newValue === null) {
        setSonoroSpent(false);
      }
      if (event.key === 'gatoencerrado:graphic-spent') {
        setGraphicSpent(event.newValue === 'true');
      }
      if (event.key === 'gatoencerrado:taza-activations') {
        const value = event.newValue ? Number.parseInt(event.newValue, 10) : 0;
        if (!Number.isNaN(value)) {
          setTazaActivations(value);
        }
      }
    };

    const handleCustomSpent = (event) => {
      if (event?.detail?.id === 'novela' && typeof event.detail.count === 'number') {
        setNovelaQuestions(event.detail.count);
      }
      if (event?.detail?.id === 'sonoro' && typeof event.detail.spent === 'boolean') {
        setSonoroSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'grafico' && typeof event.detail.spent === 'boolean') {
        setGraphicSpent(event.detail.spent);
      }
      if (event?.detail?.id === 'taza' && typeof event.detail.count === 'number') {
        setTazaActivations(event.detail.count);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gatoencerrado:miniverse-spent', handleCustomSpent);
    };
  }, []);

  const handleNovelaQuestionSend = useCallback(() => {
    if (isNovelaSubmitting) {
      return;
    }
    setIsNovelaSubmitting(true);
    setShowNovelaCoins(true);
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1100));
    delayPromise.then(() => {
      setShowNovelaCoins(false);
      setIsNovelaSubmitting(false);
      setNovelaQuestions((prev) => {
        const next = prev + 1;
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:novela-questions', String(next));
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'novela', spent: true, amount: 25, count: next },
            })
          );
        }
        return next;
      });
    });
  }, [isNovelaSubmitting]);

  const handleSonoroEnter = useCallback(() => {
    if (sonoroSpent) {
      return;
    }
    setShowSonoroCoins(true);
    setTimeout(() => setShowSonoroCoins(false), 1100);
    setSonoroSpent(true);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gatoencerrado:sonoro-spent', 'true');
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: true, amount: 130 },
        })
      );
    }
  }, [sonoroSpent]);

  const handleToggleQuironPrompt = useCallback(() => {
    if (!user) {
      setShowQuironCommunityPrompt((prev) => !prev);
      return;
    }

    if (isQuironUnlocking) {
      return;
    }

    setShowQuironCommunityPrompt(false);
    setIsQuironUnlocking(true);
    setShowQuironCoins(true);

    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1100));
    delayPromise.then(() => {
      setIsQuironFullVisible(true);
      setShowQuironCoins(false);
      setIsQuironUnlocking(false);
      setQuironSpent(true);
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('gatoencerrado:quiron-spent', 'true');
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: 'cine', spent: true, amount: GAT_COSTS.quironFull },
          })
        );
      }
    });
  }, [isQuironUnlocking, user]);

  const renderMobileVideoBadge = () =>
    isMobileViewport ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/80">
          <Video size={14} />
          Ver video
        </div>
      </div>
    ) : null;

  const handleOpenMiniverses = useCallback((contextLabel = null) => {
    const normalizedLabel = typeof contextLabel === 'string' ? contextLabel : null;
    setMiniverseContext(normalizedLabel);
    setIsMiniverseOpen(true);
  }, []);

  const handleCloseMiniverses = useCallback(() => {
    setIsMiniverseOpen(false);
    setMiniverseContext(null);
  }, []);

  const loadShowcaseContent = useCallback(async (showcaseId) => {
    const definition = showcaseDefinitions[showcaseId];
    if (!definition || definition.type === 'blog-series' || !definition.slug) {
      return;
    }

    setShowcaseContent((prev) => ({
      ...prev,
      [showcaseId]: { ...(prev[showcaseId] ?? {}), status: 'loading', error: null },
    }));

    try {
      const post = await fetchBlogPostBySlug(definition.slug);
      if (!post) {
        throw new Error('No encontramos el texto asociado a este miniverso.');
      }

      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: { status: 'success', post, error: null },
      }));
    } catch (error) {
      setShowcaseContent((prev) => ({
        ...prev,
        [showcaseId]: {
          status: 'error',
          post: null,
          error: error?.message ?? 'Ocurrió un error al cargar este escaparate.',
        },
      }));
    }
  }, []);

  const handleFormatClick = useCallback(
    (formatId) => {
      if (showcaseDefinitions[formatId]) {
        setActiveShowcase((prev) => (prev === formatId ? null : formatId));
        const definition = showcaseDefinitions[formatId];
        if (definition.slug && definition.type !== 'blog-series') {
          const entry = showcaseContent[formatId];
          if (!entry || entry.status === 'error') {
            loadShowcaseContent(formatId);
          }
        }
        return;
      }
      handleOpenMiniverses();
    },
    [handleOpenMiniverses, loadShowcaseContent, showcaseContent]
  );

  const handleOpenBlogEntry = useCallback((slug) => {
    if (!slug) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('gatoencerrado:open-blog', {
        detail: { slug },
      })
    );
    document.getElementById('dialogo-critico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const sendTranscript = useCallback(async (message) => {
    if (!message) {
      return false;
    }
    try {
      await fetch('http://localhost:3000/api/silvestre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensaje: message }),
      });
      setMicError('');
      setShowSilvestreCoins(true);
      setTimeout(() => setShowSilvestreCoins(false), 1200);
      return true;
    } catch (error) {
      console.error('[Silvestre Voice] Error sending transcript:', error);
      setMicError('No pudimos enviar tu mensaje de voz. Intenta nuevamente más tarde.');
      setShowSilvestreCoins(true);
      setTimeout(() => setShowSilvestreCoins(false), 1200);
      return false;
    }
  }, []);

  const stopSilvestreListening = useCallback(() => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('[Silvestre Voice] stop error:', err);
      }
    }
    setIsListening(false);
  }, [isListening]);

  const handleOpenSilvestreChat = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!hasShownMicPrompt) {
      setMicPromptVisible(true);
      setHasShownMicPrompt(true);
    } else if (!micPromptVisible) {
      setMicPromptVisible(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(
        'Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.'
      );
      window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const text = results.map((result) => result[0]?.transcript ?? '').join(' ');
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = (event) => {
        console.error('[Silvestre Voice] recognition error:', event);
        setMicError('No pudimos acceder al micrófono. Intenta nuevamente.');
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        const finalText = transcriptRef.current.trim();
        if (finalText) {
          sendTranscript(finalText);
          transcriptRef.current = '';
        }
      };
      recognitionRef.current = recognition;
    }

    if (isListening) {
      stopSilvestreListening();
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setMicError('');
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
      micTimeoutRef.current = setTimeout(() => {
        stopSilvestreListening();
      }, 45000);
    } catch (error) {
      console.error('[Silvestre Voice] start error:', error);
      setMicError('No pudimos abrir el micrófono. Intenta nuevamente.');
    }

    window.dispatchEvent(new CustomEvent('gatoencerrado:open-silvestre'));
  }, [hasShownMicPrompt, isListening, micPromptVisible, sendTranscript, stopSilvestreListening]);

  useEffect(() => {
    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenSemblanza = useCallback((anchor = '#team') => {
    const target = document.querySelector(anchor);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleOpenImagePreview = useCallback((payload) => {
    if (!payload?.src) {
      return;
    }
    setImagePreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
    });
  }, []);

  const handleCloseImagePreview = useCallback(() => {
    setImagePreview(null);
  }, []);

  const handleScrollToSupport = useCallback(() => {
    supportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleOpenPdfPreview = useCallback((payload) => {
    if (!payload?.src) {
      return;
    }
    setPdfPreview({
      src: payload.src,
      title: payload.title ?? '',
      description: payload.description ?? '',
    });
    setPdfNumPages(null);
    setPdfLoadError(null);
  }, []);

  const handleClosePdfPreview = useCallback(() => {
    setPdfPreview(null);
    setPdfNumPages(null);
    setPdfLoadError(null);
  }, []);

  const handleOpenGraphicSwipe = useCallback(
    (entry) => {
      if (!entry?.previewPdfUrl || isGraphicUnlocking) {
        return;
      }

      setIsGraphicUnlocking(true);

      const openPdf = () => {
        handleOpenPdfPreview({
          src: entry.previewPdfUrl,
          title: entry.title,
          description: entry.description
            ? `${entry.description} · Modo swipe vertical.`
            : 'Modo swipe vertical del lector visual interactivo.',
        });
        setTimeout(() => setIsGraphicUnlocking(false), 150);
      };

      if (!graphicSpent) {
        setGraphicSpent(true);
        setShowGraphicCoins(true);
        setTimeout(() => setShowGraphicCoins(false), 1100);
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('gatoencerrado:graphic-spent', 'true');
          window.dispatchEvent(
            new CustomEvent('gatoencerrado:miniverse-spent', {
              detail: { id: 'grafico', spent: true, amount: GAT_COSTS.graficoSwipe },
            })
          );
        }
        setTimeout(openPdf, 450);
        return;
      }

      openPdf();
    },
    [graphicSpent, handleOpenPdfPreview, isGraphicUnlocking]
  );

  const handleActivateAR = useCallback(() => {
    const remaining = Math.max(90 - tazaActivations * 30, 0);
    if (remaining <= 0) {
      toast({ description: 'Sin gatomonedas para esta activación.' });
      return;
    }
    if (isTazaActivating) {
      return;
    }
    const next = tazaActivations + 1;
    setTazaActivations(next);
    setShowTazaCoins(true);
    setIsTazaActivating(true);
    setTimeout(() => {
      setShowTazaCoins(false);
      setIsTazaActivating(false);
      setIsTazaARActive(true);
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
        setIsMobileARFullscreen(true);
        document.body.classList.add('overflow-hidden');
      } else {
        setIsMobileARFullscreen(false);
      }
    }, 950);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('gatoencerrado:taza-activations', String(next));
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: true, amount: 30, count: next },
        })
      );
    }
  }, [isTazaActivating, tazaActivations]);

  const handleCloseARExperience = useCallback(() => {
    setIsTazaARActive(false);
    setIsMobileARFullscreen(false);
    document.body.classList.remove('overflow-hidden');
    setIsTazaActivating(false);
  }, []);

  const handleResetCredits = useCallback(() => {
    setQuironSpent(false);
    setIsQuironFullVisible(false);
    setNovelaQuestions(0);
    setSonoroSpent(false);
    setShowSonoroCoins(false);
    setGraphicSpent(false);
    setShowGraphicCoins(false);
    setIsGraphicUnlocking(false);
    setTazaActivations(0);
    setShowTazaCoins(false);
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem('gatoencerrado:quiron-spent');
      window.localStorage?.removeItem('gatoencerrado:novela-questions');
      window.localStorage?.removeItem('gatoencerrado:sonoro-spent');
      window.localStorage?.removeItem('gatoencerrado:graphic-spent');
      window.localStorage?.removeItem('gatoencerrado:taza-activations');
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'novela', spent: false, amount: 0, count: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'cine', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'sonoro', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'grafico', spent: false, amount: 0 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('gatoencerrado:miniverse-spent', {
          detail: { id: 'taza', spent: false, amount: 0, count: 0 },
        })
      );
    }
  }, []);

  const toggleNotaAutoral = useCallback(() => {
    if (!activeShowcase) {
      return;
    }
    setNotaAutoralOpenMap((prev) => ({
      ...prev,
      [activeShowcase]: !prev[activeShowcase],
    }));
  }, [activeShowcase]);

  const handlePdfLoadSuccess = useCallback(({ numPages }) => {
    setPdfNumPages(numPages);
  }, []);

  const activeDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
  const isNotaAutoralOpen = activeShowcase ? notaAutoralOpenMap[activeShowcase] : false;
  const activeData = activeShowcase ? showcaseContent[activeShowcase] : null;
  const activeParagraphs = useMemo(() => {
    if (!activeData?.post?.content) {
      return [];
    }
    return activeData.post.content.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  }, [activeData]);

  useEffect(() => {
    if (activeShowcase && showcaseRef.current) {
      showcaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (!activeShowcase) {
      return;
    }
    setNotaAutoralOpenMap((prev) => ({
      ...prev,
      [activeShowcase]: false,
    }));
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'copycats') {
      setIsCinemaCreditsOpen(false);
      setOpenCollaboratorId(null);
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (activeShowcase !== 'lataza') {
      setIsTazaARActive(false);
      setIsMobileARFullscreen(false);
      document.body.classList.remove('overflow-hidden');
    }
  }, [activeShowcase]);

  useEffect(() => {
    if (!imagePreview && !pdfPreview) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (imagePreview) {
          handleCloseImagePreview();
        }
        if (pdfPreview) {
          handleClosePdfPreview();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePreview, pdfPreview, handleCloseImagePreview, handleClosePdfPreview]);

  useEffect(() => {
    if (!pdfPreview) {
      return undefined;
    }
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setPdfContainerWidth(pdfContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [pdfPreview]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
    };
  }, []);

  const handleLaunchWebAR = (message) => {
    toast({
      description: message || 'Muy pronto liberaremos la activación WebAR de este objeto.',
    });
  };

  const handleOpenCameraForQR = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({ description: 'Tu dispositivo no permite abrir la cámara desde el navegador.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      toast({
        description: 'Listo. En la versión final validaremos el QR con geolocalización para redimir tu ejemplar.',
      });
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({ description: 'No pudimos acceder a la cámara. Revisa los permisos e inténtalo de nuevo.' });
    }
  }, []);

  const handleNovelAppCTA = useCallback(
    (app) => {
      if (!app) return;

      if (app.ctaUrl) {
        window.open(app.ctaUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      if (app.ctaAction === 'openCamera') {
        handleOpenCameraForQR();
        return;
      }

      if (app.ctaAction === 'openAutoficcionPreview') {
        setShowAutoficcionPreview(true);
        return;
      }

      toast({
        description: app.ctaMessage || 'Muy pronto liberaremos esta app interactiva.',
      });
    },
    [handleOpenCameraForQR]
  );

  const handleMovementAction = useCallback(
    (action, contextLabel = null) => {
      if (!action) {
        return;
      }
      handleOpenMiniverses(contextLabel);
    },
    [handleOpenMiniverses]
  );

  const rendernotaAutoral = () => {
    if (!activeDefinition?.notaAutoral) return null;

    const isTragedia = activeDefinition.type === 'tragedia';
    const containerClass = isTragedia
      ? 'rounded-2xl border border-purple-400/60 bg-purple-900/20 p-4 text-sm text-slate-100 shadow-[0_0_25px_rgba(168,85,247,0.45),0_0_55px_rgba(109,40,217,0.32)]'
      : 'rounded-2xl border border-purple-300/45 p-6 bg-black/30 text-slate-300/80 text-sm leading-relaxed shadow-[0_0_22px_rgba(168,85,247,0.32),0_0_42px_rgba(59,130,246,0.18),0_20px_65px_rgba(0,0,0,0.45)]';
    const buttonClass = isTragedia
      ? 'text-xs uppercase tracking-[0.35em] text-slate-400 underline-offset-4 hover:text-white'
      : 'text-xs uppercase tracking-[0.35em] text-slate-400/80 underline-offset-4 hover:text-white';

    return (
      <div className={`${isTragedia ? 'space-y-3 pt-4' : 'space-y-3 mt-4'}`}>
        <button type="button" className={buttonClass} onClick={toggleNotaAutoral}>
          {isNotaAutoralOpen ? 'Ocultar Mini-Verso' : 'Mostrar Mini-Verso'}
        </button>
        {isNotaAutoralOpen ? (
          <motion.div
            key={activeShowcase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={containerClass}
          >
            <div className="mb-2 space-y-1">
              <p
                className={`text-xs uppercase tracking-[0.35em] ${
                  isTragedia ? 'text-purple-200' : 'text-purple-300'
                }`}
              >
                {activeDefinition.cartaTitle || 'Nota autoral'}
              </p>
            </div>
            <p className="leading-relaxed whitespace-pre-line">{activeDefinition.notaAutoral}</p>
          </motion.div>
        ) : null}
      </div>
    );
  };

  const renderPostDetails = (emptyMessage = 'Pronto liberaremos la carta completa de este miniverso.') => {
    if (!activeDefinition?.slug) {
      return null;
    }

    if (activeData?.status === 'loading') {
      return <p className="text-slate-400 text-sm">Cargando la carta que acompaña a este miniverso…</p>;
    }

    if (activeData?.status === 'error') {
      return <p className="text-red-300 text-sm">{activeData.error}</p>;
    }

    if (activeData?.status === 'success' && activeData.post) {
      return (
        <>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
            {activeData.post.author ? (
              <span className="inline-flex items-center gap-2">
                <Feather size={16} />
                {activeData.post.author}
                {activeData.post.author_role ? (
                  <span className="text-slate-500">/ {activeData.post.author_role}</span>
                ) : null}
              </span>
            ) : null}
            {activeData.post.published_at ? (
              <span>
                {new Date(activeData.post.published_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            ) : null}
          </div>
          <h4 className="font-display text-2xl text-slate-100 mb-6">{activeData.post.title}</h4>
          <div className="space-y-5 text-slate-200 leading-relaxed font-light">
            {activeParagraphs.length === 0 ? (
              <p>Muy pronto abriremos el expediente completo de este miniverso. Gracias por tu curiosidad.</p>
            ) : (
              activeParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            )}
          </div>
        </>
      );
    }

    return <p className="text-slate-400 text-sm">{emptyMessage}</p>;
  };

  const renderShowcaseContent = () => {
    if (!activeDefinition) {
      return (
        <p className="text-slate-400 text-sm">
          Selecciona un miniverso para explorar su carta y materiales.
        </p>
      );
    }

    if (activeDefinition.type === 'object-webar') {
      const objectWebArVideoId = `${activeShowcase ?? 'object-webar'}-video`;

      return (
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
          
        
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
              <div className="flex items-center justify-between gap-3 px-6 pt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400/70">Activa tu objeto</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-500/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-50">
                  <Coins size={14} className="text-amber-50" />
                  {Math.max(90 - tazaActivations * 30, 0)} gatomonedas
                </span>
              </div>
              {activeShowcase === 'lataza' && isTazaARActive && !isMobileARFullscreen ? (
                <div className="p-0 sm:p-4">
                  <ARExperience
                    targetSrc="/webar/taza/taza.mind"
                    phrases={activeDefinition.phrases}
                    onExit={handleCloseARExperience}
                  />
                </div>
              ) : (
                <>
                  {/\.mp4($|\?)/i.test(activeDefinition.image) ? (
                    <div className="relative">
                      {isMobileViewport ? (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                      ) : null}
                      {renderMobileVideoBadge()}
                      <video
                        src={activeDefinition.image}
                        className="w-full h-64 object-cover bg-black/50"
                        autoPlay
                        playsInline
                        muted
                        loop
                        controls={canUseInlinePlayback(objectWebArVideoId)}
                        onClick={(event) => requestMobileVideoPresentation(event, objectWebArVideoId)}
                        poster={activeDefinition.imagePoster}
                      />
                    </div>
                  ) : (
                    <img
                      src={activeDefinition.image}
                      alt="Ilustración de La Taza"
                      className="w-full h-64 object-cover bg-black/50"
                    />
                  )}
                  <div className="p-6 space-y-3">
                    <p className="text-sm text-slate-400 uppercase tracking-[0.3em]">{activeDefinition.note}</p>
                    {activeDefinition.instructions ? (
                      <ul className="text-sm text-slate-300/90 space-y-2">
                        {activeDefinition.instructions.map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-300 mt-1">●</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {activeShowcase === 'lataza' ? (
                      <div className="relative inline-flex overflow-visible">
                        {showTazaCoins ? (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: -6 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute -top-7 right-0 rounded-full border border-amber-200/60 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                          >
                            -30 gat
                          </motion.div>
                        ) : null}
                        <Button
                          className="relative border-purple-400/40 text-purple-200 hover:bg-purple-500/10 overflow-visible"
                          variant="outline"
                          onClick={handleActivateAR}
                          disabled={Math.max(90 - tazaActivations * 30, 0) <= 0 || isTazaActivating}
                        >
                          <span className="relative z-10">
                            {Math.max(90 - tazaActivations * 30, 0) <= 0
                              ? 'Sin gatomonedas'
                              : isTazaActivating
                                ? 'Procesando...'
                                : activeDefinition.ctaLabel}
                          </span>
                          {showTazaCoins ? (
                            <span className="pointer-events-none absolute inset-0">
                              {Array.from({ length: 6 }).map((_, index) => {
                                const endX = 120 + index * 12;
                                const endY = -110 - index * 12;
                                return (
                                  <motion.span
                                    key={`taza-coin-${index}`}
                                    className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                    initial={{ opacity: 0.9, scale: 0.7, x: 0, y: 0 }}
                                    animate={{ opacity: 0, scale: 1, x: endX, y: endY, rotate: 120 + index * 22 }}
                                    transition={{ duration: 1.05, ease: 'easeOut', delay: 0.05 }}
                                  />
                                );
                              })}
                            </span>
                          ) : null}
                        </Button>
                      </div>
                    ) : activeDefinition.ctaLink ? (
                      <a
                        href={activeDefinition.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold"
                      >
                        {activeDefinition.ctaLabel}
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                        onClick={() => handleLaunchWebAR(activeDefinition.ctaMessage)}
                      >
                        {activeDefinition.ctaLabel}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {activeDefinition.sentiments ? (
              <div className="rounded-2xl border border-white/10 p-6 bg-black/30">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Sentimientos vinculados</p>
                <ul className="space-y-3 text-slate-300/80 text-sm leading-relaxed">
                  {activeDefinition.sentiments.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
                {activeDefinition.comments ? (
                  <div className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-6">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-0">Comentarios de la comunidad</p>
                    <div className="space-y-4">
                      {activeDefinition.comments.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-white/5 p-4 bg-black/20">
                          <p className="text-slate-100 font-light mb-2">{comment.quote}</p>
                          <p className="text-xs text-slate-500">{comment.author}</p>
                        </div>
                      ))}
                    </div>
                    {activeShowcase === 'lataza' ? (
                      <ShowcaseReactionInline
                        showcaseId="lataza"
                        description="Haz clic para guardar un like que conecta a la comunidad alrededor de la taza."
                        buttonLabel="Resonar con la taza"
                      />
                    ) : null}
                  </div>
                ) : null}
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'audio-dream') {
      
      return (
        
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[1fr_2fr]">
           
          <div className="space-y-6 order-1 lg:order-2">
           <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Cómo explorar</p>
              <ol className="list-decimal list-inside space-y-3 text-slate-200 text-sm leading-relaxed md:text-base">
                {activeDefinition.exploration?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="hidden lg:block space-y-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3 text-sm text-slate-300">
                {activeDefinition.closing?.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              {activeShowcase === 'miniversoSonoro' ? (
                <ShowcaseReactionInline
                  showcaseId="miniversoSonoro"
                  title="La voz de quienes escuchan"
                  description="Comparte tu vibración y deja un like que resuene en este miniverso."
                  buttonLabel="Hacer latir la resonancia"
                />
              ) : null}
            </div>
            <div className="lg:hidden">
              <MiniversoSonoroPreview
                videoUrl={activeDefinition.videoUrl}
                videoTitle={activeDefinition.label}
                videoArtist="Residencia #GatoEncerrado"
                audioOptions={activeDefinition.musicOptions}
                poemOptions={activeDefinition.poems}
                showHeader
                showCTA
                onEnterExperience={handleSonoroEnter}
                isSpent={sonoroSpent}
                coinBlast={showSonoroCoins}
                costLabel="130 gatomonedas"
              />
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3 text-sm text-slate-300">
                  {activeDefinition.closing?.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                {activeShowcase === 'miniversoSonoro' ? (
                  <ShowcaseReactionInline
                    showcaseId="miniversoSonoro"
                    title="La voz de quienes escuchan"
                    description="Comparte tu vibración y deja un like que resuene en este miniverso."
                    buttonLabel="Hacer latir la resonancia"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex justify-center px-4 order-2 lg:order-1 lg:px-0">
            <div className="w-full max-w-[1100px]">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <MiniversoSonoroPreview
                  videoUrl={activeDefinition.videoUrl}
                  videoTitle={activeDefinition.label}
                  videoArtist="Residencia #GatoEncerrado"
                  audioOptions={activeDefinition.musicOptions}
                  poemOptions={activeDefinition.poems}
                  showHeader
                  showCTA
                  onEnterExperience={handleSonoroEnter}
                  isSpent={sonoroSpent}
                  coinBlast={showSonoroCoins}
                  costLabel="130 gatomonedas"
                />
              </div>
            </div>
          </div>

        </div>
      );
    }

    if (activeDefinition.type === 'oracle') {
      return (
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Minado simbólico</p>
              {activeDefinition.loops ? (
                <ul className="space-y-2 text-sm text-slate-200/90 leading-relaxed">
                  {activeDefinition.loops.map((step, index) => (
                    <li key={`oraculo-loop-${index}`} className="flex items-start gap-2">
                      <span className="text-purple-300 mt-1">●</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {activeDefinition.tagline ? (
                <p className="text-sm text-purple-200/90">{activeDefinition.tagline}</p>
              ) : null}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                  onClick={() =>
                    toast({
                      description: 'Muy pronto abriremos el Oráculo interactivo para mintear tus GATokens.',
                    })
                  }
                >
                  {activeDefinition.ctaLabel}
                </Button>
                <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.ctaDescription}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Sistema de recompensas</p>
              <div className="grid gap-3 md:grid-cols-2">
                {activeDefinition.rewards?.map((reward, index) => (
                  <div
                    key={`oraculo-reward-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-100">{reward.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200">
                        <Coins size={14} className="text-amber-200" />
                        {reward.tokens}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300/90 leading-relaxed">{reward.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">{activeDefinition.limitsNote}</p>
            </div>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Semillas de conocimiento</p>
              <ul className="space-y-2 text-sm text-slate-300/85 leading-relaxed">
                {activeDefinition.seedNotes?.map((seed, index) => (
                  <li key={`oraculo-seed-${index}`} className="flex items-start gap-2">
                    <Sparkles size={14} className="mt-1 text-amber-200" />
                    <span>{seed}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-200" />
                <p className="text-sm text-slate-200 font-semibold">Interacción que deja huella</p>
              </div>
              <p className="text-sm text-slate-300/85 leading-relaxed">
                Tus reflexiones afinan la mente del Gato: entrenamiento simbólico, no binario y emocional. Cada
                participación se audita para evitar ruido.
              </p>
              <p className="text-xs text-slate-500">El Oráculo es un espacio curado; el minado es resonancia, no dinero.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'tragedia') {
      return (
        <div className="space-y-10">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-black/60 to-rose-900/40 shadow-[0_25px_65px_rgba(15,23,42,0.65)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.8),_transparent_65%)]" />
            <div className="relative mx-auto grid w-full max-w-[min(100vw-2rem,1100px)] gap-6 p-6 sm:p-8 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-6">
                <div className="space-y-5 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                  <p className="text-xs uppercase tracking-[0.4em] text-purple-300">Escaparate</p>
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">{activeDefinition.label}</h3>
                  <p className="text-lg text-slate-200/80 leading-relaxed font-light">{activeDefinition.intro}</p>
                  <div className="space-y-3">
                    {activeDefinition.narrative?.map((paragraph, index) => (
                      <p key={`tragico-paragraph-${index}`} className="text-sm text-slate-300/90 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {rendernotaAutoral()}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-6 space-y-5 shadow-[0_25px_45px_rgba(0,0,0,0.45)]">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Conciencia abierta</p>
                <p className="text-sm text-slate-300/90 leading-relaxed">{activeDefinition.ctaDescription}</p>
                <div className="rounded-2xl border border-amber-200/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-100 font-semibold">
                    <Coins size={16} />
                    <span>~300 gatomonedas</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80"></span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border border-purple-400/40 text-purple-100 hover:bg-purple-500/10 silvestre-cta relative overflow-visible"
                  onClick={handleOpenSilvestreChat}
                >
                  <span className="relative z-10">{isListening ? 'Detener y enviar' : activeDefinition.ctaLabel}</span>
                  {showSilvestreCoins ? (
                    <span className="pointer-events-none absolute inset-0 overflow-visible">
                      {Array.from({ length: 6 }).map((_, index) => {
                        const endX = 220 + index * 16;
                        const endY = -240 - index * 14;
                        return (
                          <motion.span
                            key={`silvestre-coin-${index}`}
                            className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                            initial={{ opacity: 0.95, scale: 0.8, x: 0, y: 0 }}
                            animate={{ opacity: 0, scale: 1.05, x: endX, y: endY, rotate: 110 + index * 22 }}
                            transition={{ duration: 1.15, ease: 'easeOut', delay: 0.05 }}
                          />
                        );
                      })}
                    </span>
                  ) : null}
                </Button>
                <p className="text-[11px] text-slate-500">
                  La conversación se abre dentro del universo transmedia (pronto con GPT de Silvestre).
                </p>
                {micPromptVisible && !micError ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
                    <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Silvestre quiere escucharte</p>
                    <p>Silvestre quiere escucharte. Dale acceso a tu micrófono para comenzar.</p>
                  </div>
                ) : null}
                {micError && !isListening && !transcript ? (
                  <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-red-300">Sin micrófono</p>
                    <p>Tu navegador no permite activar el micrófono. Puedes escribirle a Silvestre si prefieres.</p>
                  </div>
                ) : null}
                {transcript ? (
                  <div className="mt-3 rounded-2xl border border-purple-500/40 bg-white/5 p-4 text-sm text-slate-100">
                    <p className="text-xs uppercase tracking-[0.35em] text-purple-300">
                      Transcripción en vivo{isListening ? ' (escuchando...)' : ''}
                    </p>
                    <p className="break-words">{transcript}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'graphic-lab') {
      const swipeShowcases = activeDefinition.swipeShowcases ?? [];

      return (
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Colección viva</p>
              <div className="flex flex-wrap gap-2">
                {activeDefinition.collection?.map((item, index) => (
                  <span
                    key={`collection-pill-${index}`}
                    className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {swipeShowcases.length ? (
              <div className="space-y-4">
                {swipeShowcases.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/70 via-black/60 to-fuchsia-900/40 overflow-hidden"
                  >
                    <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
                      {entry.previewImage ? (
                        <div className="relative h-full min-h-[220px]">
                          <img
                            src={entry.previewImage}
                            alt={entry.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                            <Scan size={14} className="text-fuchsia-200" />
                            Swipe PDF
                          </div>
                          <div className="absolute left-4 bottom-4 text-sm text-white/90">
                            Lector visual · scroll vertical
                          </div>
                        </div>
                      ) : null}

                      <div className="p-6 space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
                          Lector visual activo
                        </p>
                        <h4 className="font-display text-2xl text-slate-100">{entry.title}</h4>
                        {entry.description ? (
                          <p className="text-sm text-slate-200/90 leading-relaxed">{entry.description}</p>
                        ) : null}
                        {entry.swipeNotes?.length ? (
                          <ul className="space-y-2 text-sm text-slate-100 leading-relaxed">
                            {entry.swipeNotes.map((point, index) => (
                              <li key={`${entry.id}-note-${index}`} className="flex items-start gap-2">
                                <span className="text-fuchsia-200 mt-1">●</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          {entry.previewImage ? (
                            <Button
                              className="sm:flex-none justify-center bg-gradient-to-r from-fuchsia-600/80 to-purple-500/80 hover:from-fuchsia-500 hover:to-purple-400 text-white"
                              onClick={() =>
                                handleOpenImagePreview({
                                  src: entry.previewImage,
                                  title: entry.title,
                                  description: entry.description,
                                })
                              }
                            >
                              Ver portada
                            </Button>
                          ) : null}
                          {entry.previewPdfUrl ? (
                            <div className="relative inline-flex overflow-visible">
                              {showGraphicCoins ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: -6 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute -top-7 right-0 rounded-full border border-amber-200/60 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                                >
                                  -{GAT_COSTS.graficoSwipe} gat
                                </motion.div>
                              ) : null}
                              <Button
                                variant="outline"
                                disabled={isGraphicUnlocking}
                                onClick={() => handleOpenGraphicSwipe(entry)}
                                className="w-full sm:w-auto justify-center border-fuchsia-300/40 text-fuchsia-200 hover:bg-fuchsia-500/10 relative overflow-visible"
                              >
                                <span className="relative z-10">
                                  {graphicSpent ? 'Abrir swipe en PDF' : isGraphicUnlocking ? 'Aplicando...' : 'Aplicar y abrir'}
                                </span>
                                {showGraphicCoins ? (
                                  <span className="pointer-events-none absolute inset-0">
                                    {Array.from({ length: 6 }).map((_, index) => {
                                      const endX = 140 + index * 14;
                                      const endY = -140 - index * 12;
                                      return (
                                        <motion.span
                                          key={`graphic-coin-${index}`}
                                          className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                          initial={{ opacity: 0.9, scale: 0.7, x: 0, y: 0 }}
                                          animate={{
                                            opacity: 0,
                                            scale: 1.05,
                                            x: endX,
                                            y: endY,
                                            rotate: 120 + index * 18,
                                          }}
                                          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.05 }}
                                        />
                                      );
                                    })}
                                  </span>
                                ) : null}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">
                          Prototipo del lector visual interactivo
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Acciones</p>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                Activa el lector visual o súmate a la residencia gráfica.
              </p>
              <div className="rounded-2xl border border-amber-200/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-100 font-semibold">
                  <Coins size={16} />
                  <span>{graphicSpent ? '0 gatomonedas' : `~${GAT_COSTS.graficoSwipe} gatomonedas`}</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">
                  {graphicSpent ? 'Aplicado' : 'Por sesión / swipe'}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/70">
                {graphicSpent
                  ? 'Ya aplicaste tus gatomonedas al swipe en PDF.'
                  : 'Al abrir el swipe en PDF se descontarán todas las gatomonedas disponibles.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleOpenMiniverses('Miniverso Gráfico')}
                  className="w-full sm:w-auto justify-center bg-gradient-to-r from-purple-600/80 to-fuchsia-500/80 hover:from-purple-500 hover:to-fuchsia-400 text-white"
                >
                  {activeDefinition.ctas?.primary}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenMiniverses('Miniverso Gráfico')}
                  className="w-full sm:w-auto justify-center border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                >
                  {activeDefinition.ctas?.secondary}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Testimonio</p>
              <p className="text-lg text-slate-100 leading-relaxed italic">{activeDefinition.quote?.text}</p>
              <p className="text-xs text-slate-500">{activeDefinition.quote?.author}</p>
            </div>

            {activeShowcase === 'miniversoGrafico' ? (
              <ShowcaseReactionInline
                showcaseId="miniversoGrafico"
                title="Validación gráfica"
                description="Haz clic para dejar un like y seguir curando esta colección."
                buttonLabel="Resonar con el trazo"
              />
            ) : null}
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'movement-ritual') {
      return (
        <div className="space-y-10">
          <div className="grid gap-6 lg:gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-black/60 to-purple-900/30 p-6 lg:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Ruta coreográfica</p>
              <h3 className="font-display text-3xl text-slate-100">{activeDefinition.tagline}</h3>
              <div className="space-y-4 text-slate-300/85 leading-relaxed text-sm md:text-base">
                {activeDefinition.overview?.map((paragraph, index) => (
                  <p key={`movement-overview-${index}`}>{paragraph}</p>
                ))}
                {activeDefinition.diosaHighlights?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">
                      Cada estación revela una diosa distinta
                    </p>
                    <ul className="mt-3 space-y-2">
                      {activeDefinition.diosaHighlights.map((item, index) => (
                        <li key={`movement-highlight-${index}`} className="flex items-start gap-2">
                          <span className="text-purple-300 mt-1">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {activeDefinition.dayNight?.map((sentence, index) => (
                  <p key={`movement-daynight-${index}`}>{sentence}</p>
                ))}
                {activeDefinition.invitation ? (
                  <p className="text-lg text-slate-100 italic">{activeDefinition.invitation}</p>
                ) : null}
              </div>
              {rendernotaAutoral()}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-100 font-semibold">
                  <Coins size={16} />
                  <span>~280 gatomonedas</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">Mapa + estación</span>
              </div>
              <p className="text-[11px] text-amber-100/70">
                Se aplican al liberar la ruta, los talleres o el marcador AR; las suscripciones cubren el saldo.
              </p>
              {activeDefinition.actions?.map((action) => {
                const ActionIcon = action.icon || ArrowRight;
                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3 hover:border-purple-400/40 transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-white/10 bg-white/5 p-3">
                          <ActionIcon size={20} className="text-purple-200" />
                        </div>
                        <div>
                          {action.badge ? (
                            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">{action.badge}</p>
                          ) : null}
                          <p className="font-semibold text-slate-100">{action.label}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10 w-full sm:w-auto justify-center"
                        onClick={() =>
                          handleMovementAction(action, activeDefinition.pendingName || activeDefinition.label)
                        }
                      >
                        {action.buttonLabel ?? 'Activar'}
                      </Button>
                    </div>
                    {action.description ? (
                      <p className="text-sm text-slate-300/80 leading-relaxed">{action.description}</p>
                    ) : null}
                  </div>
                );
              })}
              <ShowcaseReactionInline
                showcaseId="miniversoMovimiento"
                title="Resonancia colectiva"
                description="Haz clic y deja un pulso para que la Ruta de las Diosas siga viva."
                buttonLabel="Hacer vibrar la ruta"
              />
            </div>
          </div>

          {activeDefinition.microinteractions?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {activeDefinition.microinteractions.map((micro, index) => (
                <div
                  key={`movement-micro-${index}`}
                  className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-3 text-sm leading-relaxed"
                >
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">{micro.title}</p>
                  {micro.description ? <p className="text-slate-300/85">{micro.description}</p> : null}
                  {micro.items?.length ? (
                    <ul className="space-y-2 text-slate-200/85">
                      {micro.items.map((item, bulletIndex) => (
                        <li key={`movement-micro-item-${index}-${bulletIndex}`} className="flex items-start gap-2">
                          <span className="text-purple-300 mt-1">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    if (activeDefinition.type === 'cinema') {
      const copycatsAssets = (() => {
        const seen = new Set();
        return (activeDefinition.copycats?.assets ?? []).filter((asset) => {
          const key = asset?.id || asset?.url;
          if (!key) {
            return true;
          }
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();

      const quironStills = (() => {
        const seen = new Set();
        return (activeDefinition.quiron?.stills ?? []).filter((still, index) => {
          const key = typeof still === 'string' ? still : still?.id || still?.url || `idx-${index}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      })();
      const toneTags = activeDefinition.tone ?? [];

      const renderMedia = (asset) => {
        if (!asset?.url) return null;
        const isVideoFile = /\.mp4($|\?)/i.test(asset.url);
        const videoId = asset?.id || asset?.url;
        return (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
            <div className="aspect-video w-full bg-black/60">
              {isVideoFile ? (
                <div className="relative h-full w-full">
                  {isMobileViewport ? (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                  ) : null}
                  {renderMobileVideoBadge()}
                  <video
                    src={asset.url}
                    title={asset.label}
                    className="w-full h-full object-cover"
                    controls={canUseInlinePlayback(videoId)}
                    onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                    playsInline
                    preload="metadata"
                  />
                </div>
              ) : (
                <iframe
                  src={asset.url}
                  title={asset.label}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                ></iframe>
              )}
            </div>
            {asset.label ? (
              <div className="px-4 py-3 text-sm text-slate-300 flex items-center justify-between gap-3">
                <span>{asset.label}</span>
              </div>
            ) : null}
          </div>
        );
      };

      return (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Meta-documental</p>
                  <h4 className="font-display text-xl text-slate-100">{activeDefinition.copycats?.title}</h4>
                </div>
              
              </div>
              <p className="text-sm text-slate-300/80 leading-relaxed">
                {activeDefinition.copycats?.description}
              </p>
              <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.copycats?.microcopy}</p>
              {activeDefinition.copycats?.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {activeDefinition.copycats.tags.map((tag, index) => (
                    <span
                      key={`copycats-tag-${index}`}
                      className="px-3 py-1 rounded-full border border-purple-400/30 bg-purple-900/20 text-xs text-purple-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {copycatsAssets.length ? (
                <div className="space-y-4">
                  {copycatsAssets.map((asset) => (
                    <div key={asset.id}>{renderMedia(asset)}</div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Teaser + Stills</p>
                  <h4 className="font-display text-xl text-slate-100">{activeDefinition.quiron?.title}</h4>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-rose-300">Teaser + stills</span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      quironSpent
                        ? 'border border-emerald-200/60 bg-emerald-500/10 text-emerald-100'
                        : 'border border-amber-200/50 bg-amber-500/10 text-amber-100'
                    }`}
                  >
                    <Coins size={14} />
                    {quironSpent ? '0 gatomonedas' : `${GAT_COSTS.quironFull} gatomonedas`}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300/80 leading-relaxed">{activeDefinition.quiron?.description}</p>
              <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.quiron?.microcopy}</p>
              <div className="flex flex-wrap items-center gap-3">
                {quironSpent ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100">
                    <Coins size={14} /> 0 gatomonedas
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleToggleQuironPrompt}
                    disabled={isQuironUnlocking}
                    className="relative bg-gradient-to-r from-rose-500/80 via-amber-500/80 to-yellow-400/80 text-slate-900 hover:from-rose-400 hover:via-amber-400 hover:to-yellow-300 disabled:opacity-70 overflow-visible"
                  >
                    <span className="relative z-10">
                      {isQuironUnlocking ? 'Procesando…' : 'Ver cortometraje completo'}
                    </span>
                    {showQuironCoins ? (
                      <span className="pointer-events-none absolute inset-0">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const startX = 0;
                          const startY = 0;
                          const endX = 140 + index * 10;
                          const endY = -120 - index * 10;
                          return (
                            <motion.span
                              key={`quiron-coin-btn-${index}`}
                              className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                              initial={{ opacity: 0.9, scale: 0.6, x: startX, y: startY }}
                              animate={{ opacity: 0, scale: 0.9, x: endX, y: endY, rotate: 90 + index * 25 }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          );
                        })}
                      </span>
                    ) : null}
                  </Button>
                )}
                <span className="text-xs uppercase tracking-[0.25em] text-slate-300/80">
                  {quironSpent
                    ? `0 gatomonedas pendientes · ${GAT_COSTS.quironFull} aplicadas`
                    : `Se descontarán ${GAT_COSTS.quironFull} GAT o se cubre con tu suscripción`}
                </span>
              </div>
              {showQuironCommunityPrompt ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-2xl border border-amber-200/40 bg-amber-500/10 p-4 text-sm text-amber-100"
                >
                  Únete a la comunidad para usar tus gatomonedas y desbloquear experiencias completas. Muy pronto podrás conectar tu saldo y suscripción aquí mismo.
                </motion.div>
              ) : null}
              {showQuironCoins ? (
                      <div className="pointer-events-none absolute inset-0 overflow-visible">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const startLeft = 0.35 + index * 0.04;
                    const startTop = 0.7;
                    const x = 220 + index * 8;
                    const y = -240 - index * 18;
                    return (
                      <motion.span
                        key={`quiron-coin-flight-${index}`}
                        className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                        style={{ left: `${startLeft * 100}%`, top: `${startTop * 100}%` }}
                        initial={{ opacity: 0.95, scale: 0.8, rotate: 0, x: 0, y: 0 }}
                        animate={{ opacity: 0, scale: 1, rotate: 140 + index * 18, x, y }}
                        transition={{ duration: 1.15, ease: 'easeOut' }}
                      />
                    );
                  })}
                </div>
              ) : null}
              {isQuironFullVisible ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
                >
                  <div className="aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center text-slate-200">
                    <div className="space-y-2 text-center">
                      <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Mockup</p>
                      <p className="text-lg font-semibold">Cortometraje completo · Placeholder</p>
                      <p className="text-xs text-slate-300/80">Se carga después de la animación de monedas.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-300 border-t border-white/5">
                    <span>Duración: 12:00 · Calidad: HD</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 px-2 py-1 text-amber-100">
                      <Coins size={14} /> 200 GAT aplicados
                    </span>
                  </div>
                </motion.div>
              ) : null}
              {activeDefinition.quiron?.teaser ? (
                <div>{renderMedia(activeDefinition.quiron.teaser)}</div>
              ) : null}
              {quironStills.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {quironStills.map((still, index) => {
                    const label = typeof still === 'string' ? still : still.label || `Still ${index + 1}`;
                    const url = typeof still === 'string' ? null : still.url;
                    return url ? (
                      <div
                        key={still.id || `quiron-still-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="aspect-[4/3] bg-black/40">
                          <img
                            src={url}
                            alt={label}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <p className="px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-200">{label}</p>
                      </div>
                    ) : (
                      <span
                        key={`quiron-still-pill-${index}`}
                        className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-100"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {activeDefinition.collaborators?.length ? (
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Colaboradores</p>
                <button
                  type="button"
                  onClick={() => setIsCinemaCreditsOpen((prev) => !prev)}
                  className="text-xs uppercase tracking-[0.3em] text-slate-300 hover:text-white transition"
                >
                  {isCinemaCreditsOpen ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {isCinemaCreditsOpen ? (
                <div className="space-y-3">
                  {activeDefinition.collaborators.map((collab, index) => {
                    const isOpen = openCollaboratorId === collab.id;
                    const imageSrc = collab.image || '/images/placeholder-colaboradores.jpg';
                    return (
                      <div key={collab.id || `cinema-collab-${index}`} className="border border-white/10 rounded-2xl bg-black/20">
                        <button
                          type="button"
                          onClick={() => setOpenCollaboratorId((prev) => (prev === collab.id ? null : collab.id))}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={imageSrc}
                              alt={`Retrato de ${collab.name}`}
                              className="h-12 w-12 rounded-full object-cover border border-white/10"
                              loading="lazy"
                            />
                            <div>
                              <p className="text-slate-100 font-semibold">{collab.name}</p>
                              {collab.role ? (
                                <p className="text-[11px] uppercase tracking-[0.3em] text-purple-300">{collab.role}</p>
                              ) : null}
                            </div>
                          </div>
                          <span className="text-slate-400 text-lg">{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen ? (
                          <div className="px-4 pb-4 text-sm text-slate-200/90 leading-relaxed space-y-3">
                            {collab.bio ? <p>{collab.bio}</p> : null}
                            <button
                              type="button"
                              onClick={() => handleOpenSemblanza(collab.anchor)}
                              className="text-xs uppercase tracking-[0.3em] text-purple-300 hover:text-purple-100 underline underline-offset-4"
                            >
                              Ver semblanza
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Lo que las conecta</p>
            <h4 className="font-display text-xl text-slate-100">{activeDefinition.bridge?.title}</h4>
            <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.bridge?.description}</p>
            <p className="text-sm text-slate-400 leading-relaxed">{activeDefinition.bridge?.note}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-black/60 to-purple-900/40 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/70">Pantalla 5 · CTA final</p>
              <h4 className="font-display text-2xl text-slate-100">{activeDefinition.screening?.title}</h4>
              <p className="text-sm text-slate-200/90 leading-relaxed">{activeDefinition.screening?.description}</p>
              <Button
                onClick={() =>
                  toast({
                    description:
                      'Guardaremos tu interés; pronto abriremos la lista de suscriptores para el screening doble en CECUT.',
                  })
                }
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-purple-600/80 to-indigo-500/80 hover:from-purple-500 hover:to-indigo-400 text-white"
              >
                {activeDefinition.screening?.cta}
              </Button>
              {activeDefinition.screening?.footnote ? (
                <p className="text-xs text-slate-400 leading-relaxed">{activeDefinition.screening.footnote}</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <ShowcaseReactionInline
                showcaseId="copycats"
                title="Validación cinematográfica"
                description="Haz clic para dejar un like y amplificar el screening de CopyCats + Quirón."
                buttonLabel="Sumar mi aplauso"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'blog-series') {
      const entries = activeDefinition.entries ?? [];
      const novelaSpentAmount = novelaQuestions * 25;
      const renderEntryAction = (entry) => {
        switch (entry.type) {
          case 'internal-reading':
            if (entry.previewMode === 'pdf' && entry.previewPdfUrl) {
              return (
               <Button
            onClick={() => setShowAutoficcionPreview(true)}
            className="w-full sm:w-auto justify-center"
          >
            Leer fragmento
          </Button>
          );
                      }
            if (entry.previewMode === 'image' && entry.previewImage) {
              return (
                <Button
                  onClick={() =>
                    handleOpenImagePreview({
                      src: entry.previewImage,
                      title: entry.title,
                      description: entry.description,
                    })
                  }
                  className="w-full sm:w-auto justify-center"
                >
                  Ver fragmento
                </Button>
              );
            }
            return entry.contentSlug ? (
              <Button onClick={() => handleOpenBlogEntry(entry.contentSlug)} className="w-full sm:w-auto justify-center">
                Leer fragmento
              </Button>
            ) : null;
          case 'purchase-link':
            return entry.url ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-purple-400/40 text-purple-200 hover:bg-purple-500/10 px-6 py-2 font-semibold transition"
              >
                Comprar edición
              </a>
            ) : null;
          case 'qr-scan':
            return (
              <Button
                variant="outline"
                className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10 w-full sm:w-auto justify-center"
                onClick={() =>
                  toast({
                    title: 'Escanea el QR',
                    description: 'Abre la cámara de tu dispositivo y apunta al código para activar la experiencia.',
                  })
                }
              >
                Escanear QR
              </Button>
            );
          default:
            return null;
        }
      };

      return (
        <div className="space-y-10">
          <div>{renderPostDetails()}</div>
          {entries.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {entries.map((entry) => {
                if (entry.type === 'horizontal-gallery') {
                  return (
                    <div
                      key={entry.id}
                      className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4"
                    >
                      <div className="space-y-2">
                        <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                        {entry.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {entry.images?.map((image, index) => (
                          <div
                            key={`${entry.id}-${index}`}
                            className="w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40"
                          >
                            <img
                              src={image}
                              alt={`${entry.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (entry.type === 'quotes') {
                  return (
                    <div
                      key={entry.id}
                      className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4"
                    >
                      <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                <div className="space-y-4">
                  {entry.quotes?.map((quote, index) => (
                    <blockquote
                      key={`${entry.id}-quote-${index}`}
                      className="text-slate-100 font-light leading-relaxed"
                    >
                      <p>{quote.quote}</p>
                      {quote.author ? (
                        <p className="text-xs text-slate-500 mt-2">{quote.author}</p>
                      ) : null}
                    </blockquote>
                  ))}
                </div>
                <ShowcaseReactionInline
                  showcaseId="miniversoNovela"
                  description="Haz clic para guardar un like y amplificar las conversaciones que la novela susurra."
                  buttonLabel="Apoyar la novela"
                />
              </div>
            );
          }

                if (entry.type === 'novel-apps') {
                  const novelaSpentAmount = novelaQuestions * 25;
                  return (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-6 relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 shrink-0">
                              <Coins size={14} className="text-amber-50" />
                              <span className="text-amber-50">150 gatomonedas</span>
                            </span>
                          </div>
                          {entry.description ? (
                            <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid gap-4 grid-cols-1">
                        {entry.apps?.map((app) => (
                          <div
                            key={app.id}
                            className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col gap-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-semibold text-slate-100">{app.name}</p>
                              <span
                                className={`text-xs uppercase tracking-[0.3em] ${
                                  app.status === 'Disponible' ? 'text-emerald-300' : 'text-slate-500'
                                }`}
                              >
                                {app.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300/80 leading-relaxed">{app.description}</p>
                            {app.snippet ? (
                              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                                <p className="text-xs uppercase tracking-[0.3em] text-purple-300">{app.snippet.tagline}</p>
                                {app.snippet.image ? (
                                  <img
                                    src={app.snippet.image}
                                    alt={app.name}
                                    className="w-full h-32 object-cover rounded-lg border border-white/5"
                                  />
                                ) : null}
                                {app.snippet.text ? (
                                  <p className="text-sm text-slate-200/90 leading-relaxed">{app.snippet.text}</p>
                                ) : null}
                              </div>
                            ) : null}
                            <div className="space-y-2">
                              <Button
                                onClick={() => handleNovelAppCTA(app)}
                                variant={app.status === 'Disponible' ? 'default' : 'outline'}
                                className={`w-full justify-center ${
                                  app.status === 'Disponible'
                                    ? 'bg-purple-600/80 hover:bg-purple-600 text-white'
                                    : 'border-purple-400/40 text-purple-200 hover:bg-purple-500/10'
                                }`}
                              >
                                {app.ctaLabel}
                              </Button>
                              <div className="flex items-center justify-center text-[11px] uppercase tracking-[0.35em] text-amber-200/90">
                                {novelaSpentAmount > 0
                                  ? `${novelaSpentAmount} gatomonedas usadas · ${novelaQuestions} pregunta${novelaQuestions === 1 ? '' : 's'}`
                                  : '0 gatomonedas usadas · 0 preguntas'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                const imageSrc = entry.previewImage || entry.image;
                const action = renderEntryAction(entry);

                return (
                  <div key={entry.id} className="rounded-2xl border border-white/10 p-6 bg-black/30 space-y-4">
                    {imageSrc ? (
                      <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 h-52 sm:h-64">
                        <img src={imageSrc} alt={entry.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                      {entry.description ? (
                        <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                      ) : null}
                    </div>
                    {action}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Muy pronto liberaremos el resto de la serie.</p>
          )}
        </div>
      );
    }

    const videos = activeDefinition.videos ?? [];

    return (
      <div className="space-y-10">
        <div>
          {renderPostDetails(
            'Pronto liberaremos la carta completa de este miniverso. Mientras tanto puedes explorar la galería audiovisual.'
          )}
        </div>

        {videos.length > 0 ? (
          <div>
            <h5 className="font-display text-xl text-slate-100 mb-4">Galería audiovisual</h5>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((video, index) => {
                const videoId = video.id || video.url || `video-${index}`;
                return (
                  <div
                    key={video.id || video.url || `video-${index}`}
                    className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex flex-col"
                  >
                    <div className="relative aspect-video w-full">
                      {/\.mp4($|\?)/i.test(video.url) ? (
                        <>
                          {isMobileViewport ? (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                          ) : null}
                          {renderMobileVideoBadge()}
                          <video
                            src={video.url}
                            title={video.title}
                            className="w-full h-full object-cover bg-black"
                            controls={canUseInlinePlayback(videoId)}
                            onClick={(event) => requestMobileVideoPresentation(event, videoId)}
                            playsInline
                            preload="metadata"
                            poster={video.poster}
                          />
                        </>
                      ) : (
                        <iframe
                          src={video.url}
                          title={video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      )}
                    </div>
                    <div className="p-4 space-y-1 text-sm text-slate-300">
                      <p className="font-semibold text-slate-100">{video.title}</p>
                      {video.author ? <p>{video.author}</p> : null}
                      {video.duration ? <p className="text-slate-500">Duración: {video.duration}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {activeShowcase === 'copycats' ? (
          <ShowcaseReactionInline
            showcaseId="copycats"
            description="Guarda un like que celebra las miradas que quedarán en escena."
            title="Opiniones después del corte"
          />
        ) : null}
      </div>
    );
  };

  return (
    <>
      <section id="transmedia" className="py-24 relative">
        {import.meta.env?.DEV ? (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={handleResetCredits}
              className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:bg-amber-500/20"
            >
              Reset créditos
            </button>
          </div>
        ) : null}
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-6"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Universo Transmedia</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-gradient italic">
              Miniversos que sostienen la causa
            </h2>
            <p className="text-lg text-slate-300/80 max-w-3xl mx-auto leading-relaxed font-light">
              #GatoEncerrado es un universo transmedia compuesto por miniversos narrativos. Cada experiencia digital, objeto o narrativa expandida activa tokens de IA (gatokens), que sostienen el ecosistima y financian la {' '}
              <button
                type="button"
                onClick={handleScrollToSupport}
                className="text-purple-200 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
              >
                causa social 
              </button>
             {' '} de Ayuda para la Vida, A.C.</p>
            <p className="text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
              Una suscripción de <span className="font-semibold text-purple-200">600 MXN</span> te otorga
              {' '}<span className="font-semibold text-purple-200">12,000 GATOKENS</span>.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {formats.map((format, index) => {
              const Icon = format.icon;
              const iconClass = format.iconClass ?? 'text-purple-200';
              return (
                <motion.div
                  key={format.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="group glass-effect rounded-xl p-8 hover-glow cursor-pointer flex flex-col transition-all duration-300 hover:border-purple-400/50"
                  onClick={() => handleFormatClick(format.id)}
                >
                  <div className="flex items-center justify-start mb-6 transition-all duration-300 group-hover:scale-110">
                    <Icon
                      size={32}
                      className={`${iconClass} drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]`}
                    />
                  </div>

                  <h3 className="font-display text-2xl font-medium text-slate-100 mb-3">{format.title}</h3>

                  <p className="text-slate-300/70 text-base leading-relaxed mb-4 flex-grow font-light">
                    {format.description}
                  </p>
                  {(() => {
                    const isCine = format.id === 'copycats';
                    const isNovela = format.id === 'miniversoNovela';
                    const isTaza = format.id === 'lataza';
                    const isGrafico = format.id === 'miniversoGrafico';
                    const novelaSpentAmount = novelaQuestions * 25;
                    const novelaRemaining = Math.max(150 - novelaSpentAmount, 0);
                    const tazaSpentAmount = tazaActivations * 30;
                    const tazaRemaining = Math.max(90 - tazaSpentAmount, 0);
                    let note = format.iaTokensNote;
                    let toneClass = 'text-amber-100';
                    let iconTone = 'text-amber-200';

                    if (isCine && quironSpent) {
                      note = '0 gatomonedas · 200 aplicadas';
                      toneClass = 'text-emerald-200';
                      iconTone = 'text-emerald-200';
                    } else if (isGrafico && graphicSpent) {
                      note = '0 gatomonedas · swipe aplicado';
                      toneClass = 'text-emerald-200';
                      iconTone = 'text-emerald-200';
                    } else if (isNovela && novelaQuestions > 0) {
                      note = `${novelaRemaining} gatomonedas restantes · ${novelaSpentAmount} usadas (${novelaQuestions} pregunta${novelaQuestions > 1 ? 's' : ''})`;
                      toneClass = 'text-emerald-200';
                      iconTone = 'text-emerald-200';
                    } else if (isNovela) {
                      note = '150 gatomonedas disponibles';
                    } else if (isGrafico) {
                      note = `${GAT_COSTS.graficoSwipe} gatomonedas disponibles`;
                    } else if (isTaza && tazaActivations > 0) {
                      note = `${tazaRemaining} gatomonedas restantes · ${tazaSpentAmount} usadas (${tazaActivations} activación${tazaActivations > 1 ? 'es' : ''})`;
                      toneClass = 'text-emerald-200';
                      iconTone = 'text-emerald-200';
                    } else if (isTaza) {
                      note = '90 gatomonedas disponibles';
                    }

                    return note ? (
                      <div className={`mb-3 flex items-center gap-2 ${toneClass}`}>
                        <Coins size={16} className={iconTone} />
                        <span>{note}</span>
                      </div>
                    ) : null;
                  })()}

                  <div className="text-purple-300 flex items-center gap-2 font-semibold transition-all duration-300 group-hover:gap-3">
                    Explorar
                    <ArrowRight size={18} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {activeDefinition ? (
            <motion.div
              ref={showcaseRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mt-12 glass-effect rounded-2xl p-8 md:p-12 border border-white/10"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  {activeDefinition.type !== 'tragedia' ? (
                    <>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-2">Escaparate</p>
                      <h3 className="font-display text-3xl text-slate-100 mb-3">{activeDefinition.label}</h3>
                      <p className="text-slate-300/80 leading-relaxed font-light max-w-3xl">
                        {activeDefinition.intro}
                      </p>
                      {rendernotaAutoral()}
                    </>
                  ) : null}
                </div>
                <button
                  onClick={() => setActiveShowcase(null)}
                  className="text-sm text-slate-400 hover:text-white transition self-start md:self-auto"
                  >
                  Cerrar escaparate ✕
                </button>
              </div>

              <div className="mt-8">{renderShowcaseContent()}</div>
              {activeDefinition.iaProfile ? (
                <div className="mt-9 max-w-xl">
                  <IAInsightCard {...activeDefinition.iaProfile} compact />
                </div>
              ) : null}
            </motion.div>
          ) : null}

          <div className="mt-16 grid lg:grid-cols-[3fr_2fr] gap-10">
            <motion.div
              id="apoya"
              ref={supportSectionRef}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden opacity-100"
              style={{ opacity: 1 }}
            >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-5 bg-no-repeat bg-center bg-[length:auto_100%] md:bg-[length:200%]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(5,5,10,0.85), rgba(5,5,10,0.85)), url(/assets/bg-logo.png)',
                backgroundBlendMode: 'screen',
                filter: 'grayscale(0.25)',
              }}
            />
            <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Apoya el proyecto</p>
                <h3 className="font-display text-3xl text-slate-100">
                  Nuestro impacto social crece contigo
                </h3>
                <p className="text-slate-300/80 leading-relaxed font-light">
                  La taquilla mantiene la obra en escena; el universo transmedia financia acompañamiento emocional real.
                  Cada cuota se distribuye en tres frentes que opera Isabel Ayuda para la Vida, A.C.{' '}
                  <a
                    href="https://www.ayudaparalavida.com/index.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-200 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
                  >
                    Visita su sitio
                  </a>
                </p>

                <div className="mt-4 space-y-3">
                  {CAUSE_ACCORDION.map((item) => {
                    const Icon = item.icon;
                    const isOpen = openCauseId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="border border-white/10 rounded-2xl bg-black/20 overflow-hidden transition"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenCauseId((prev) => (prev === item.id ? null : item.id))}
                          className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/5 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-500/15 text-purple-200">
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-100">{item.title}</p>
                              <p className="text-xs text-slate-400">{item.metric}</p>
                            </div>
                          </div>
                          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
                            {isOpen ? 'Ocultar' : 'Ver impacto'}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="px-4 pb-4 text-sm text-slate-300/90">{item.description}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
                <Button
                  onClick={handleOpenMiniverses}
                  variant="ghost"
                  className="text-purple-200 hover:text-white hover:bg-white/10 justify-start md:justify-center"
                >
                  🧪 Ver miniversos activos
                </Button>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <HeartHandshake size={20} className="text-purple-300" />
                  <span>Tu suscripción = Apoyo directo</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-6 border border-white/10 bg-slate-950/50 shadow-2xl"
            >
              <CallToAction />
            </motion.div>
          </div>
        </div>
      </section>

      <MiniverseModal open={isMiniverseOpen} onClose={handleCloseMiniverses} contextLabel={miniverseContext} />

      {pdfPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClosePdfPreview} />
          <div className="relative z-10 w-full max-w-5xl space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70">Lectura en progreso</p>
                <h4 className="font-display text-2xl text-slate-100">{pdfPreview.title || 'Fragmento en PDF'}</h4>
                {pdfPreview.description ? (
                  <p className="text-sm text-slate-300/80 leading-relaxed max-w-2xl">{pdfPreview.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClosePdfPreview}
                className="self-start rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
              >
                Cerrar ✕
              </button>
            </div>

            <div
              ref={pdfContainerRef}
              className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl p-4 max-h-[75vh] overflow-auto"
            >
              {pdfLoadError ? (
                <p className="text-sm text-red-300 text-center py-8">{pdfLoadError}</p>
              ) : (
                <Document
                  file={pdfPreview.src}
                  onLoadSuccess={handlePdfLoadSuccess}
                  onLoadError={(error) => {
                    console.error('Error al cargar PDF del miniverso:', error);
                    setPdfLoadError('No pudimos cargar el fragmento en PDF. Intenta de nuevo más tarde.');
                  }}
                  loading={<p className="text-sm text-slate-400 text-center py-8">Preparando páginas…</p>}
                >
                  {pdfNumPages
                    ? Array.from(new Array(pdfNumPages), (_, index) => (
                        <div key={`pdf-page-${index + 1}`} className="mb-6 last:mb-0">
                          <Page
                            pageNumber={index + 1}
                            width={pdfPageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </div>
                      ))
                    : null}
                </Document>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {imagePreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseImagePreview} />
          <div className="relative z-10 w-full max-w-3xl">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleCloseImagePreview}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 transition"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
              <div className="bg-black/60">
                <img src={imagePreview.src} alt={imagePreview.title || 'Vista previa'} className="w-full h-auto" />
              </div>
              {(imagePreview.title || imagePreview.description) ? (
                <div className="p-6 space-y-2">
                  {imagePreview.title ? (
                    <h4 className="font-display text-2xl text-slate-100">{imagePreview.title}</h4>
                  ) : null}
                  {imagePreview.description ? (
                    <p className="text-sm text-slate-300/80 leading-relaxed">{imagePreview.description}</p>
                  ) : null}
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Ilustración de la novela</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isTazaARActive && isMobileARFullscreen ? (
        <div className="fixed inset-0 z-40 bg-black">
          <ARExperience
            targetSrc="/webar/taza/taza.mind"
            phrases={showcaseDefinitions.lataza.phrases}
            onExit={handleCloseARExperience}
          />
        </div>
      ) : null}
      {showAutoficcionPreview && (
        <div className="fixed inset-0 z-[200] overflow-auto bg-black/80 backdrop-blur-xl p-6">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setShowAutoficcionPreview(false)}
              className="text-slate-300 hover:text-white mb-6"
            >
              Cerrar ✕
            </button>

            <AutoficcionPreview />
          </div>
        </div>
      )}
    </>
  );
};

export default Transmedia;
