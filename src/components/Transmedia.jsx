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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MiniverseModal from '@/components/MiniverseModal';
import CallToAction from '@/components/CallToAction';
import { fetchBlogPostBySlug } from '@/services/blogService';
import { toast } from '@/components/ui/use-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ARExperience from '@/components/ar/ARExperience';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;



const showcaseDefinitions = {
  copycats: {
    label: '#CopyCats',
    type: 'post-videos',
    slug: 'carta-a-copycats',
    intro:
  'En el Miniverso Cine conviven dos pulsos del mismo universo: la mirada crítica y desbordada de CopyCats y la herida luminosa de Quirón. Aquí puedes asomarte a cartas creativas, ensayos abiertos y al proceso íntimo detrás del cortometraje que nació de nombrar tres tabúes: el suicidio, el tarot y el arte como puente hacia lo que no sabemos decir.',
    videos: [
      {
        id: 'copycats-v2',
        title: 'Ensayo abierto · Variación 2',
        author: 'Detrás de cámaras',
        duration: '5:46',
        url: 'https://player.vimeo.com/video/959781265?h=9b3b018f3e',
      },
      {
        id: 'copycats-v3',
        title: 'Teaser de Quirón',
        author: 'Voces de la Comunidad',
        duration: '0:58',
        url: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/Quiron.mp4',
      },
    ],
  },
  lataza: {
    label: 'EstoNoEsUnaTaza',
    type: 'object-webar',
    slug: 'taza-que-habla',
    subtitle: 'Esta no es una taza. Es un boleto.',
    intro:
      'Un objeto cotidiano convertido en símbolo de comunión. Cada taza está vinculada a un sentimiento. Cada sentimiento, a una historia personal.',
    note: 'Apunta tu cámara a la taza. La pista aparecerá.',
    ctaLabel: 'Probar activación WebAR',
    ctaLink: '/webar/taza/index.html',
    ctaMessage: 'Cuando liberes la activación WebAR, descubrirás la pista que le corresponde a tu taza.',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/tazas.mp4',
    sentiments: [
      'Sentir rabia también es un acto de cuidado.',
    ],
    phrases: [
      'La taza te habla.',
    ],
    instructions: [
      'Permite el acceso a tu cámara para iniciar.',
      'Coloca la taza completa en cuadro, con buena iluminación.',
      'Mantén el marcador visible hasta que aparezca la orbe.',
    ],
    comments: [
      { id: 'la-taza-comment-1', quote: '“La taza me mostró una frase que me persiguió toda la semana.”', author: 'Usuario anónimo' },
      { id: 'la-taza-comment-2', quote: '“No entendí nada… hasta que le agarré el modo.”', author: 'Sofía B.' },
    ],
  },
  miniversoNovela: {
    label: 'Miniverso Novela',
    type: 'blog-series',
    slug: null,
    intro:
      'Aquí se cruzan la autoficción, la novela gráfica y las vidas que aún no caben en escena. Fragmentos, procesos y pistas que solo existen cuando alguien las lee.',
    entries: [
      {
        id: 'primer-fragmento',
        title: 'Fragmentos iniciales',
        description: 'Lee las primeras páginas de la novela.',
        previewImage: '/assets/primerfragmento.png',
        contentSlug: 'fragmento-novela',
        type: 'internal-reading',
        previewMode: 'pdf',
        previewPdfUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/PDFs/10pages.pdf',
      },
      {
        id: 'compra-libro',
        title: 'Edición física',
        description: 'La novela completa en su versión impresa. Incluye QR secreto.',
        image: '/assets/edicion-fisica.png',
        type: 'purchase-link',
        url: '/comprar-novela',
      },
      {
        id: 'tres-pies-galeria',
        title: 'Tres Pies al Gato — proceso visual',
        description: 'Exploraciones de la novela gráfica.',
        previewImage: '/assets/silvestre-comic.jpeg',
        type: 'internal-reading',
        previewMode: 'pdf',
        previewPdfUrl: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/PDFs/Caps%201%20a%2024.pdf',
      },
      {
        id: 'novel-apps',
        title: 'Activa tus novelas',
        description:
          'Cada formato tiene su propia app interactiva. La novela de autoficción ya se puede activar; el cómic transmedia abre pronto su lector con pistas y capas expandidas.',
        type: 'novel-apps',
        apps: [
          {
            id: 'autoficcion-app',
            name: 'Novela de autoficción',
            status: 'Disponible',
            description:
              'Escanea el QR de la contraportada de tu ejemplar para redimirlo y activar la app. Allí, cada segmento narrativo se convierte en una experiencia guiada con preguntas académicas, psicológicas, narrativas y teatrales para vivir la escena como si estuvieras en un ensayo.',
            snippet: {
              tagline: 'Contraportada interactiva',
              text: 'Abre la cámara, apunta al QR y desbloquea prompts y lecturas personalizadas para conversar con Silvestre.',
            },
            ctaLabel: 'Abrir cámara',
            ctaAction: 'openCamera',
          },
          {
            id: 'comic-app',
            name: 'Novela gráfica / Cómic transmedia',
            status: 'En desarrollo',
            description:
              'El lector digital del cómic desbloquea pistas visuales, pistas sonoras y activaciones AR que conectan con los miniversos.',
            snippet: {
              tagline: 'App del cómic',
              text: 'Beta privada en curso. La experiencia combinará lectura, audio-ensayos y análisis visual.',
              image: '/assets/imagen-comic.png',
            },
            ctaLabel: 'Recibir aviso',
            ctaMessage:
              'Déjanos tu correo en Apoya el proyecto para recibir el acceso prioritario cuando la app del cómic se libere.',
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
  },
};

const formats = [
  {
    id: 'miniversos',
    title: 'Miniverso Escénico',
    description: 'La función que detonó este universo. Voces, cuerpos y gatos en escena.',
    icon: Drama,
    iconClass: 'text-purple-300',
  },
    {
    id: 'lataza',
    title: 'Miniverso Taza',
    description: 'Objeto ritual con WebAR. Una excusa para seguir la historia desde lo cotidiano.',
    icon: Coffee,
    iconClass: 'text-amber-300',
  },
  {
    id: 'miniversoNovela',
    title: 'Miniverso Novela',
    description: 'Desde la autoficción hasta las viñetas de la novela gráfica.',
    icon: BookOpen,
    iconClass: 'text-emerald-300',
  },
  {
    id: 'copycats',
    title: 'Miniverso Cine',
    description: '“Quirón” y otros filmes que piensan el cuerpo del Gato en clave cinematográfica.',
    icon: Film,
    iconClass: 'text-rose-300',
  },
  {
    id: 'detodxs',
    title: 'Miniverso Apps',
    description: 'Experiencias digitales que te convierten en cómplice del universo.',
    icon: Smartphone,
    iconClass: 'text-lime-300',
  },
  {
    id: 'clubdegato',
    title: 'Miniverso Bitácora',
    description: 'Crónicas, expansiones narrativas y debate vivo sobre el universo.',
    icon: Video,
    iconClass: 'text-indigo-300',
  },
];

const CAUSE_ACCORDION = [
  {
    id: 'tratamientos',
    title: 'Tratamientos emocionales',
    description:
      'Financia terapias para jóvenes que no pueden costearlas. Isabel Ayuda para la Vida, A.C. cubre sesiones cuando detectamos riesgo emocional.',
    icon: HeartHandshake,
    metric: '6 sesiones promedio por suscriptor',
  },
  {
    id: 'residencias',
    title: 'Residencias creativas',
    description:
      'Laboratorios donde arte y acompañamiento se combinan para reparar memoria y cuerpo. Becas completas para procesos de creación y contención.',
    icon: Palette,
    metric: '3 residencias activas por temporada',
  },
  {
    id: 'app-escolar',
    title: 'App Causa Social en escuelas',
    description:
      'Aplicación que detecta señales tempranas en estudiantes. Tu cuota permite capacitar psicólogos, visitar escuelas y dar seguimiento ante crisis.',
    icon: Smartphone,
    metric: '15 escuelas atendidas cada semestre',
  },
];

const Transmedia = () => {
  const [isMiniverseOpen, setIsMiniverseOpen] = useState(false);
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

  const handleOpenMiniverses = useCallback(() => {
    setIsMiniverseOpen(true);
  }, []);

  const handleCloseMiniverses = useCallback(() => {
    setIsMiniverseOpen(false);
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
          error: error?.message ?? 'Ocurrió un error al cargar este showcase.',
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

  const handleActivateAR = useCallback(() => {
    setIsTazaARActive(true);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      setIsMobileARFullscreen(true);
      document.body.classList.add('overflow-hidden');
    } else {
      setIsMobileARFullscreen(false);
    }
  }, []);

  const handleCloseARExperience = useCallback(() => {
    setIsTazaARActive(false);
    setIsMobileARFullscreen(false);
    document.body.classList.remove('overflow-hidden');
  }, []);

  const handlePdfLoadSuccess = useCallback(({ numPages }) => {
    setPdfNumPages(numPages);
  }, []);

  const activeDefinition = activeShowcase ? showcaseDefinitions[activeShowcase] : null;
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

  const handleNovelAppCTA = useCallback((app) => {
    if (!app) {
      return;
    }
    if (app.ctaUrl) {
      window.open(app.ctaUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (app.ctaAction === 'openCamera') {
      handleOpenCameraForQR();
      return;
    }
    toast({
      description: app.ctaMessage || 'Muy pronto liberaremos esta app interactiva.',
    });
  }, [handleOpenCameraForQR]);

  const renderPostDetails = (emptyMessage = 'Pronto liberaremos la carta completa de este miniverso.') => {
    if (activeDefinition?.type === 'blog-series') {
      return (
        <div className="rounded-2xl border border-white/10 p-6 bg-black/30 text-slate-300/80 text-sm leading-relaxed">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-2">Carta abierta</p>
          <p>{activeDefinition?.intro}</p>
        </div>
      );
    }

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
      return (
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div>{renderPostDetails('Pronto liberaremos la carta completa de este miniverso.')}</div>
            <p className="text-slate-300/85 leading-relaxed font-light">{activeDefinition.intro}</p>

            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30">
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
                    <video
                      src={activeDefinition.image}
                      className="w-full h-64 object-cover bg-black/50"
                      autoPlay
                      playsInline
                      muted
                      loop
                      controls
                      poster={activeDefinition.imagePoster}
                    />
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
                      <Button
                        className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
                        variant="outline"
                        onClick={handleActivateAR}
                      >
                        {activeDefinition.ctaLabel}
                      </Button>
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
              <div className="rounded-2xl border border-white/10 p-6 bg-black/30">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-4">Comentarios de la comunidad</p>
                <div className="space-y-4">
                  {activeDefinition.comments.map((comment) => (
                    <div key={comment.id} className="rounded-xl border border-white/5 p-4 bg-black/20">
                      <p className="text-slate-100 font-light mb-2">{comment.quote}</p>
                      <p className="text-xs text-slate-500">{comment.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (activeDefinition.type === 'blog-series') {
      const entries = activeDefinition.entries ?? [];
      const renderEntryAction = (entry) => {
        switch (entry.type) {
          case 'internal-reading':
            if (entry.previewMode === 'pdf' && entry.previewPdfUrl) {
              return (
                <Button
                  onClick={() =>
                    handleOpenPdfPreview({
                      src: entry.previewPdfUrl,
                      title: entry.title,
                      description: entry.description,
                    })
                  }
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
                    </div>
                  );
                }

                if (entry.type === 'novel-apps') {
                  return (
                    <div key={entry.id} className="md:col-span-2 rounded-2xl border border-white/10 p-6 bg-black/30 space-y-6">
                      <div className="space-y-2">
                        <h5 className="font-display text-xl text-slate-100">{entry.title}</h5>
                        {entry.description ? (
                          <p className="text-sm text-slate-300/80 leading-relaxed">{entry.description}</p>
                        ) : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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
              {videos.map((video) => (
                <div key={video.id} className="rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex flex-col">
                  <div className="aspect-video w-full">
                    {/\.mp4($|\?)/i.test(video.url) ? (
                      <video
                        src={video.url}
                        title={video.title}
                        className="w-full h-full object-cover bg-black"
                        controls
                        playsInline
                        preload="metadata"
                        poster={video.poster}
                      />
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
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <section id="transmedia" className="py-24 relative">
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
              #GatoEncerrado es un universo transmedial compuesto por miniversos narrativos. Cada experiencia digital, objeto o narrativa expandida 
              financia el acompañamiento psicoemocional de{' '}
              <button
                type="button"
                onClick={handleScrollToSupport}
                className="text-purple-200 underline underline-offset-4 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-sm"
              >
                Isabel Ayuda para la Vida, A.C.
              </button>
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
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400/70 mb-2">Showcase</p>
                  <h3 className="font-display text-3xl text-slate-100 mb-3">{activeDefinition.label}</h3>
                  <p className="text-slate-300/80 leading-relaxed font-light max-w-3xl">
                    {activeDefinition.intro}
                  </p>
                </div>
                <button
                  onClick={() => setActiveShowcase(null)}
                  className="text-sm text-slate-400 hover:text-white transition self-start md:self-auto"
                >
                  Cerrar showcase ✕
                </button>
              </div>

              <div className="mt-8">{renderShowcaseContent()}</div>
            </motion.div>
          ) : null}

          <div className="mt-16 grid lg:grid-cols-[3fr_2fr] gap-10">
            <motion.div
              ref={supportSectionRef}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8 md:p-10 flex flex-col justify-between"
            >
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Apoya el proyecto</p>
                <h3 className="font-display text-3xl text-slate-100">
                  Tu suscripción sostiene la causa social de #GatoEncerrado
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

      <MiniverseModal open={isMiniverseOpen} onClose={handleCloseMiniverses} />

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
    </>
  );
};

export default Transmedia;
