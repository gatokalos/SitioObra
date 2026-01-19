import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Instagram as InstagramIcon, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstagramPostsFromBucket } from '@/services/instagramService';
import { recordGalleryLike, getGalleryLikeCount } from '@/services/galleryLikeService';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const collagePattern = [
  { grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-4 md:col-span-4 md:row-span-3 lg:col-span-3 lg:row-span-4',
    offset: 'lg:-translate-y-3 lg:rotate-[0.8deg]',
    frame: 'shadow-[17px_17px_0_rgba(164,196,248,0.14)]',
    tint: 'from-sky-300/18 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2',
    offset: 'lg:translate-y-2 lg:rotate-[0.3deg]',
    frame: 'shadow-[14px_14px_0_rgba(167,139,250,0.14)]',
    tint: 'from-purple-400/14 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2 lg:col-span-3 lg:row-span-3',
    offset: 'lg:translate-y-3 lg:rotate-[0.9deg]',
    frame: 'shadow-[12px_12px_0_rgba(129,140,248,0.14)]',
    tint: 'from-indigo-400/15 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2 md:col-span-4 md:row-span-2 lg:col-span-3 lg:row-span-3',
    offset: 'lg:-translate-y-2',
    frame: 'shadow-[11px_11px_0_rgba(248,113,113,0.15)]',
    tint: 'from-rose-400/14 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-3 sm:col-span-2 sm:row-span-3 md:col-span-2 md:row-span-3 lg:col-span-2 lg:row-span-4',
    offset: 'lg:translate-y-2 lg:-rotate-[1.6deg]',
    frame: 'shadow-[16px_16px_0_rgba(251,191,36,0.14)]',
    tint: 'from-amber-300/16 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2 md:col-span-4 md:row-span-2 lg:col-span-3 lg:row-span-2',
    offset: 'lg:-translate-y-4 lg:rotate-[-0.7deg]',
    frame: 'shadow-[13px_13px_0_rgba(45,212,191,0.15)]',
    tint: 'from-teal-300/12 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2',
    offset: 'lg:translate-y-3 lg:rotate-[0.6deg]',
    frame: 'shadow-[12px_12px_0_rgba(148,163,184,0.16)]',
    tint: 'from-slate-300/12 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-3 md:col-span-4 md:row-span-3 lg:col-span-4 lg:row-span-4',
    offset: 'lg:-translate-y-2 lg:rotate-[0.4deg]',
    frame: 'shadow-[16px_16px_0_rgba(110,231,183,0.12)]',
    tint: 'from-emerald-300/14 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-3 lg:col-span-2 lg:row-span-3',
    offset: 'lg:translate-y-2 lg:-rotate-[0.9deg]',
    frame: 'shadow-[13px_13px_0_rgba(244,162,97,0.13)]',
    tint: 'from-orange-300/16 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-4 md:col-span-4 md:row-span-3 lg:col-span-3 lg:row-span-4',
    offset: 'lg:-translate-y-3 lg:rotate-[0.7deg]',
    frame: 'shadow-[17px_17px_0_rgba(164,196,248,0.14)]',
    tint: 'from-sky-300/18 via-transparent to-slate-950/0',
  },
{
  grid: 'col-span-3 row-span-2 sm:col-span-4 sm:row-span-2 md:col-span-4 md:row-span-2 lg:col-span-5 lg:row-span-3',
  offset: 'lg:translate-y-1 lg:-rotate-[0.3deg]',
  frame: 'shadow-[11px_11px_0_rgba(250,204,21,0.15)]',
  tint: 'from-yellow-300/15 via-transparent to-slate-950/0',
},
  {
    grid: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-3 md:col-span-3 md:row-span-3 lg:col-span-3 lg:row-span-3',
    offset: 'lg:-translate-y-1 lg:rotate-[1deg]',
    frame: 'shadow-[15px_15px_0_rgba(153,246,228,0.12)]',
    tint: 'from-teal-200/14 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-3 md:col-span-2 md:row-span-4 lg:col-span-2 lg:row-span-4',
    offset: 'lg:-translate-y-4 lg:-rotate-[1.1deg]',
    frame: 'shadow-[20px_20px_0_rgba(203,213,225,0.13)]',
    tint: 'from-slate-200/18 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-3 row-span-2 sm:col-span-4 sm:row-span-2 md:col-span-4 md:row-span-2 lg:col-span-5 lg:row-span-2',
    offset: 'lg:translate-y-1 lg:-rotate-[0.3deg]',
    frame: 'shadow-[31px_11px_0_rgba(250,204,21,0.15)]',
    tint: 'from-sky-300/18 via-transparent to-slate-950/0',
  },
  {
    grid: 'col-span-3 row-span-2 sm:col-span-4 sm:row-span-2 md:col-span-4 md:row-span-2 lg:col-span-5 lg:row-span-2',
    offset: 'lg:translate-y-1 lg:-rotate-[0.33deg]',
    frame: 'shadow-[11px_11px_0_rgba(250,204,21,0.15)]',
    tint: 'from-sky-300/18 via-transparent to-slate-950/0',
  },
];

const BLOCKED_IFRAME_HOSTS = ['instagram.com', 'linktr.ee', 'youtube.com', 'youtu.be', 'cargo.site'];

const shouldConfirmExternalLink = (url) => {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return BLOCKED_IFRAME_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch (error) {
    return false;
  }
};

const curatedLayout = [
  { match: 'Copia de Foto 1 (1)', patternIndex: 0, story: 'El futuro ha arribado' },
  { match: 'PoloyEstela', patternIndex: 8, story: 'Entre micro-climas' },
  { match: 'Copia de Foto 4', patternIndex: 2, story: 'El Ensayo Final' },
  { match: 'Copia de Foto 3 (1)', patternIndex: 3, story: 'No habrá un nosotros' },
  { match: 'Pausa entre actos', patternIndex: 4, story: 'Coreografía del desamor' },
  { match: 'Copia de Foto 4 (1)', patternIndex: 5, story: 'Señor de Paja' },
  { match: '_V7M6314', patternIndex: 6, story: 'Encierro post-pandemia' },
  { match: '_V7M6296', patternIndex: 7, story: 'No es un Ted-Talk' },
  { match: '_V7M6348', patternIndex: 8, story: 'Odisea inter-estelar' },
  { match: 'Xanadu', patternIndex: 9, story: 'Salvando el Xánadu' },
  { match: '_V7M6281', patternIndex: 10, story: 'La intervención' },
  { match: '_V7M6324', patternIndex: 11, story: 'Un arma de doble filo' },
  { match: '_V7M6329', patternIndex: 12, story: 'Corazón del encerrado' },
  { match: 'Copia de Foto 5 (1)', patternIndex: 13, story: 'Soneto sin dueño' },
  { match: 'DSC02497', patternIndex: 14, story: 'El gatillo emocional' },
  
];

const curatedLayoutAlejandro = [
  { match: 'chiu_01', patternIndex: 13, story: 'Mariana, foco absoluto' },
  { match: 'chiu_16', patternIndex: 0, story: 'Cyndi: después del salto' },
  { match: 'chiu_02', patternIndex: 1, story: 'Harold, piso y escena' },
  { match: 'chiu_03', patternIndex: 2, story: 'Ritual previo' },
  { match: 'chiu_06', patternIndex: 3, story: 'Silvestre Felis, en fuga' },
  { match: 'chiu_05', patternIndex: 4, story: 'Carlos y Cyndi' },
  { match: 'chiu_04', patternIndex: 5, story: 'Sueño profundo' },
  { match: 'chiu_07', patternIndex: 6, story: 'Aparece el Paysito Tiste' },
  { match: 'chiu_08', patternIndex: 7, story: 'Chivis: el incomprendido' },
  { match: 'chiu_09', patternIndex: 8, story: 'Llamadas intrusivas' },
  { match: 'chiu_10', patternIndex: 9, story: 'Despierta' },
  { match: 'chiu_11', patternIndex: 10, story: '¿Privación sensorial?' },
  { match: 'chiu_12', patternIndex: 11, story: 'Transición a la Reina' },
  { match: 'chiu_13', patternIndex: 12, story: 'Dulce desencuentro' },
  { match: 'chiu_14', patternIndex: 13, story: 'No fue culpa de nadie' },
  { match: 'chiu_17', patternIndex: 14, story: 'Gil: abrazo de cierre' },
  { match: 'chiu_15', patternIndex: 1, story: 'Agradecimiento total' },
];

const curatedLayoutSergio = [
  { match: 'Ungato12', patternIndex: 0, story: 'Pulso inmóvil' },
  { match: 'Ungato02', patternIndex: 1, story: 'Después del gesto' },
  { match: 'Ungato03', patternIndex: 1, lockPattern: true, story: 'Antes de abrir' },
  { match: 'Ungato06', patternIndex: 10, story: 'Foco interno' },
  { match: 'Ungato10', patternIndex: 5, story: 'Entre colegas' },
  { match: 'Ungato01', patternIndex: 10, lockPattern: true, story: 'Entrega sostenida' },
  { match: 'Ungato09', patternIndex: 7, story: 'Ajuste compartido' },
  { match: 'Ungato25', patternIndex: 10, story: 'Develación heredada' },
  { match: 'Ungato19', patternIndex: 9, story: 'Cuerpo común' },
  { match: 'Ungato17', patternIndex: 10, story: 'Ráfaga azul' },
  { match: 'Ungato15', patternIndex: 11, story: 'Mirada en pausa' },
  { match: 'Ungato20', patternIndex: 12, story: 'Gesto suspendido' },
  { match: 'Ungato22', patternIndex: 13, story: 'Cuerpo dispuesto' },
  { match: 'Ungato23', patternIndex: 14, story: 'Espalda mortal' },
  { match: 'Ungato24', patternIndex: 15, story: 'Última pregunta' },
];

const curatedLayoutDiego = [

  
  { match: 'diegohdz571', patternIndex: 10, lockPattern: true, story: 'Carnicería, cuchillos' }, 
  { match: 'diegohdz587', story: 'Un sueño recurrente' },
  { match: 'diegohdz591', story: 'Un número irracional' },
  { match: 'diegohdz593', story: '¿Me extrañaste?' },
  { match: 'diegohdz602', story: '¡Bájate de ahí!' },
  { match: 'diegohdz604', story: 'Una voz, una sola' },
  { match: 'diegohdz607', story: 'Te cargó el payaso' },
  { match: 'diegohdz664', story: 'Una semana de gracia' },
  { match: 'diegohdz648', story: 'Migraña insoportable' },
  { match: 'diegohdz686', patternIndex: 10, lockPattern: true, story: '¿Confías en mí?' },
  { match: 'diegohdz700', story: 'Solo no te duermas' },
  { match: 'diegohdz721', story: 'Pase lo que pase' },
  { match: 'diegohdz721', story: 'Serán testigos' },    
  { match: 'diegohdz728', story: 'Serán testigos' },
  { match: 'diegohdz738', story: 'Gemir de placer' },
  { match: 'diegohdz772', story: 'Las patentes' },
  { match: 'diegohdz779', story: 'Venerable Don Polo' },
  { match: 'diegohdz796', story: 'La Salvadora' },
  { match: 'diegohdz805', story: 'Espacio sideral' },
  { match: 'diegohdz813', story: 'Huele a gato encerrado' },
  { match: 'diegohdz807', story: 'Incompatibiles' },
  { match: 'diegohdz844', story: '¿Soñando otra vez?' },
  { match: 'diegohdz829', story: 'Todo va estar bien' },
  { match: 'diegohdz847', story: 'Despertó la curiosidad' },
  { match: 'diegohdz848', story: 'Más que felicidad' },
  { match: 'diegohdz850', story: 'Melina Mandelbaum' },
  { match: 'diegohdz854', story: 'Una última vez' },
  { match: 'diegohdz855', story: 'Aquí se acaba, campeón' },
  { match: 'diegohdz007', story: 'Grandes logros' },
  { match: 'diegohdz857', patternIndex: 4, lockPattern: true, story: 'Muchas gracias' },
];

const storyFragments = [
  'El gatillo emocional',
];

const CHIU_SHUFFLE_SEED = 'chiu-2025';
const CHIU_PATTERN_ORDER = null;
const BROWN_SHUFFLE_SEED = 'brown-2025';
const BROWN_PATTERN_ORDER = null;
const DIEGO_SHUFFLE_SEED = 'diego-hdz-2025';
const DIEGO_PATTERN_ORDER = null;
const DIEGO_LAYOUT_LIMIT = 30;
const DIEGO_VISIBLE_COUNT = DIEGO_LAYOUT_LIMIT;

const PHOTOGRAPHERS = [
  {
    id: 'gabriel',
    label: 'Gabriel Monroy',
    creditPrefix: 'Semblanza visual en Instagram: ',
    creditLinkText: '@gabs1_797',
    creditLinkHref: 'https://www.instagram.com/gabs1_797/',
    layout: curatedLayout,
    allowRemaining: true,
  },
  {
    id: 'alejandro',
    label: 'Alejandro Chiu',
    creditPrefix: 'Semblanza visual en Instagram: ',
    creditLinkText: '@alexchiu',
    creditLinkHref: 'https://www.instagram.com/alexchiu/',
    layout: curatedLayoutAlejandro,
    allowRemaining: false,
  },
  {
    id: 'sergio',
    label: 'Sergio Brown',
    creditPrefix: 'Semblanza visual y canal: ',
    creditLinks: [
      { text: 'Instagram', href: 'https://www.instagram.com/brownchecho/' },
      { text: 'YouTube', href: 'https://www.youtube.com/@brownchecho' },
    ],
    layout: curatedLayoutSergio,
    allowRemaining: true,
  },
  {
    id: 'diego',
    label: 'Diego Hernández',
    creditPrefix: 'Semblanza visual en Instagram: ',
    creditLinkText: '@diego_hdz',
    creditLinkHref: 'https://www.instagram.com/dhrdzr/',
    layout: curatedLayoutDiego,
    allowRemaining: false,
    layoutLimit: DIEGO_LAYOUT_LIMIT,
    folder: 'diego_hdz',
    visibleCount: DIEGO_VISIBLE_COUNT,
  },
];

const Instagram = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isGalleryDisabled, setIsGalleryDisabled] = useState(false);
  const instagramProfileUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const BASE_VISIBLE_COUNT = 15;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activePhotographer, setActivePhotographer] = useState('gabriel');
  const [likeStatusById, setLikeStatusById] = useState({});
  const [likeCountById, setLikeCountById] = useState({});
  const [likeRevealById, setLikeRevealById] = useState({});
  const [likedPosts, setLikedPosts] = useState(() => {
    const stored = safeGetItem('gatoencerrado:gallery-likes');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  });
  const lastFocusedRef = useRef(null);
  const closeButtonRef = useRef(null);
  const likeRevealTimeoutRef = useRef(null);
  const [slots, setSlots] = useState([]);
  const nextIndexRef = useRef(0);
  const orderedSequenceRef = useRef([]);
  const patternOrderRef = useRef([]);
  const patternSeedRef = useRef(null);
  const [activePhotographerLink, setActivePhotographerLink] = useState(null);
  const [confirmPhotographerLink, setConfirmPhotographerLink] = useState(null);
  const activePhotographerData =
    PHOTOGRAPHERS.find((photographer) => photographer.id === activePhotographer) ?? PHOTOGRAPHERS[0];
  const visibleCount =
    typeof activePhotographerData?.visibleCount === 'number'
      ? activePhotographerData.visibleCount
      : activePhotographerData?.allowRemaining === false
      ? Math.max(activePhotographerData.layout.length, BASE_VISIBLE_COUNT)
      : BASE_VISIBLE_COUNT;

  const matchesDescriptor = useCallback((post, descriptor) => {
    if (!descriptor) return false;
    const target = `${post.alt || ''} ${post.imgSrc || ''}`.toLowerCase();
    if (Array.isArray(descriptor)) {
      return descriptor.some((value) => target.includes(String(value).toLowerCase()));
    }
    return target.includes(String(descriptor).toLowerCase());
  }, []);

  const isPhotographerLinkOpen = Boolean(activePhotographerLink?.url);
  const isConfirmPhotographerLinkOpen = Boolean(confirmPhotographerLink?.url);
  const handleOpenPhotographerLink = useCallback((url, label) => {
    if (!url) return;
    if (shouldConfirmExternalLink(url)) {
      setActivePhotographerLink(null);
      setConfirmPhotographerLink({ url, label });
      return;
    }
    setConfirmPhotographerLink(null);
    setActivePhotographerLink({ url, label });
  }, []);
  const handleClosePhotographerLink = useCallback(() => {
    setActivePhotographerLink(null);
  }, []);
  const handleCloseConfirmPhotographerLink = useCallback(() => {
    setConfirmPhotographerLink(null);
  }, []);
  const handleConfirmPhotographerLink = useCallback(() => {
    if (!confirmPhotographerLink?.url) return;
    window.open(confirmPhotographerLink.url, '_blank', 'noopener,noreferrer');
    setConfirmPhotographerLink(null);
  }, [confirmPhotographerLink]);
  const handlePhotographerLinkClick = useCallback((event, url, label) => {
    if (!url || !/^https?:\/\//i.test(url)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    handleOpenPhotographerLink(url, label);
  }, [handleOpenPhotographerLink]);

  const shouldExclude = useCallback((post) => {
    const exclusions = ['susurro de vestuario', 'foto 2'];
    return exclusions.some((descriptor) => matchesDescriptor(post, descriptor));
  }, [matchesDescriptor]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getInstagramPostsFromBucket();
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
          setIsGalleryDisabled(false);
          setError(null);
        } else {
          setPosts([]);
          setIsGalleryDisabled(true);
          setError(null);
        }
      } catch (err) {
        console.warn('[Instagram] Galería no disponible temporalmente:', err);
        setIsGalleryDisabled(true);
        setPosts([]);
        setError('La galería visual está en pausa temporalmente.');
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length === 0) {
      setSlots([]);
      nextIndexRef.current = 0;
      orderedSequenceRef.current = [];
      return;
    }

    const seedToInt = (seed) => {
      let hash = 2166136261;
      for (let i = 0; i < seed.length; i += 1) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };

    const mulberry32 = (seed) => {
      let t = seed;
      return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };

    const shufflePatternOrder = (seed) => {
      const order = Array.from({ length: collagePattern.length }, (_, idx) => idx);
      const random = seed ? mulberry32(seedToInt(seed)) : Math.random;
      for (let i = order.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return order;
    };
    const shufflePosts = (items, seed) => {
      if (!seed) return items;
      const shuffled = items.slice();
      const random = mulberry32(seedToInt(seed));
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const availablePosts = posts
      .map((post, idx) => ({ post, originalIndex: idx }))
      .filter(({ post }) => !shouldExclude(post));

    if (availablePosts.length === 0) {
      setSlots([]);
      nextIndexRef.current = 0;
      orderedSequenceRef.current = [];
      return;
    }

    const usedIndices = new Set();
    const prioritized = [];
    const activeLayout = activePhotographerData?.layout ?? curatedLayout;
    const allowRemaining = activePhotographerData?.allowRemaining !== false;
    const layoutLimit = activePhotographerData?.layoutLimit;
    const postShuffleSeed = activePhotographerData?.postShuffleSeed;
    const postShuffleLimit = activePhotographerData?.postShuffleLimit;
    const limitedLayout = Number.isFinite(layoutLimit)
      ? activeLayout.slice(0, layoutLimit)
      : activeLayout;
    const layoutSequence = postShuffleSeed ? shufflePosts(limitedLayout, postShuffleSeed) : limitedLayout;
    const useShuffledPattern = ['alejandro', 'sergio', 'diego'].includes(activePhotographerData?.id);
    if (useShuffledPattern) {
      const isSergio = activePhotographerData?.id === 'sergio';
      const isDiego = activePhotographerData?.id === 'diego';
      const patternOrder = isSergio
        ? BROWN_PATTERN_ORDER
        : isDiego
        ? DIEGO_PATTERN_ORDER
        : CHIU_PATTERN_ORDER;
      const patternSeed = isSergio
        ? BROWN_SHUFFLE_SEED
        : isDiego
        ? DIEGO_SHUFFLE_SEED
        : CHIU_SHUFFLE_SEED;
      if (Array.isArray(patternOrder) && patternOrder.length === collagePattern.length) {
        patternOrderRef.current = patternOrder.slice();
        patternSeedRef.current = patternSeed;
      } else if (
        patternOrderRef.current.length === collagePattern.length &&
        patternSeedRef.current === patternSeed
      ) {
        patternOrderRef.current = patternOrderRef.current.slice();
      } else {
        patternOrderRef.current = shufflePatternOrder(patternSeed);
        patternSeedRef.current = patternSeed;
      }
    } else {
      patternOrderRef.current = [];
      patternSeedRef.current = null;
    }
    const isRelevantPost = (post) =>
      layoutSequence.some((entry) => matchesDescriptor(post, entry.match));
    const scopedPosts = activePhotographerData?.folder
      ? availablePosts.filter(({ post }) => post.folder === activePhotographerData.folder)
      : availablePosts;
    const matchingPosts = allowRemaining
      ? scopedPosts
      : scopedPosts.filter(({ post }) => isRelevantPost(post));
    const orderedMatchingPosts = shufflePosts(matchingPosts, postShuffleSeed);
    const trimmedMatchingPosts = Number.isFinite(postShuffleLimit)
      ? orderedMatchingPosts.slice(0, postShuffleLimit)
      : orderedMatchingPosts;

    layoutSequence.forEach((entry) => {
      const indexInAvailable = trimmedMatchingPosts.findIndex((candidate, idx) => !usedIndices.has(idx) && matchesDescriptor(candidate.post, entry.match));
      if (indexInAvailable !== -1) {
        const foundEntry = trimmedMatchingPosts[indexInAvailable];
        usedIndices.add(indexInAvailable);
        const fallbackPatternIndex = prioritized.length % collagePattern.length;
        const shuffledPatternIndex =
          patternOrderRef.current[prioritized.length % patternOrderRef.current.length] ??
          fallbackPatternIndex;
        const useLockedPattern = Boolean(entry.lockPattern);
        prioritized.push({
          postIndex: foundEntry.originalIndex,
          patternIndex:
            useShuffledPattern && !useLockedPattern
              ? shuffledPatternIndex
              : entry.patternIndex ?? fallbackPatternIndex,
          story: entry.story ?? storyFragments[prioritized.length % storyFragments.length],
        });
      }
    });

    const remaining = allowRemaining
      ? trimmedMatchingPosts
          .map((entry, idx) => ({ ...entry, idx }))
          .filter(({ idx }) => !usedIndices.has(idx))
          .map((entry, offset) => ({
            postIndex: entry.originalIndex,
            patternIndex: (prioritized.length + offset) % collagePattern.length,
            story: storyFragments[(prioritized.length + offset) % storyFragments.length],
          }))
      : [];

    const fullSequence = [...prioritized, ...remaining];
    orderedSequenceRef.current = fullSequence;

    if (fullSequence.length === 0) {
      setSlots([]);
      nextIndexRef.current = 0;
      return;
    }

    const visible = Math.min(visibleCount, fullSequence.length);
    const initialSlots = fullSequence.slice(0, visible).map((item, index) => ({
      slotId: `${Date.now()}-${index}-${item.postIndex}-${Math.random()}`,
      postIndex: item.postIndex,
      patternIndex: item.patternIndex,
      story: item.story,
    }));

    setSlots(initialSlots);
    nextIndexRef.current = fullSequence.length > 0 ? (visible % fullSequence.length) : 0;
  }, [posts, visibleCount, matchesDescriptor, shouldExclude, activePhotographerData]);

  const handleInstagramClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openModalAt = useCallback((index) => {
    lastFocusedRef.current = document.activeElement;
    setSelectedIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedIndex(null);
    if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
      lastFocusedRef.current.focus();
    }
  }, []);

  const showPrev = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null) return index;
      return (index - 1 + posts.length) % posts.length;
    });
  }, [posts.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null) return index;
      return (index + 1) % posts.length;
    });
  }, [posts.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, closeModal, showPrev, showNext]);

  useEffect(() => {
    if (!isPhotographerLinkOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        handleClosePhotographerLink();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPhotographerLinkOpen, handleClosePhotographerLink]);

  useEffect(() => {
    if (!isConfirmPhotographerLinkOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation();
        }
        handleCloseConfirmPhotographerLink();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isConfirmPhotographerLinkOpen, handleCloseConfirmPhotographerLink]);

  const isModalOpen = selectedIndex !== null;
  const activePost = isModalOpen && posts[selectedIndex] ? posts[selectedIndex] : null;
  const activeLikeId = activePost?.id || activePost?.filename || activePost?.imgSrc;
  const likeStatus = activeLikeId ? likeStatusById[activeLikeId] : 'idle';
  const isLiked = activeLikeId ? likedPosts.includes(activeLikeId) : false;
  const likeCount = activeLikeId ? likeCountById[activeLikeId] : null;
  const totalPosts = posts.length;
  const currentPosition = selectedIndex !== null ? selectedIndex : 0;
  const progressPercent = totalPosts > 0 ? ((currentPosition + 1) / totalPosts) * 100 : 0;

  useEffect(() => {
    if (isModalOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!activePost || !activeLikeId) return;
    if (likeCountById[activeLikeId] !== undefined) return;

    let isActive = true;
    getGalleryLikeCount(activePost).then(({ success, count }) => {
      if (!isActive || !success) return;
      setLikeCountById((prev) => ({ ...prev, [activeLikeId]: count ?? 0 }));
    });

    return () => {
      isActive = false;
    };
  }, [activePost, activeLikeId, likeCountById]);

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.94,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
  };

  const imageVariants = {
    hidden: { scale: 1.08, y: 30 },
    visible: {
      scale: 1.02,
      y: 0,
      transition: { duration: 0.85, ease: 'easeOut' },
    },
  };

  const persistLikedPosts = useCallback((nextLiked) => {
    safeSetItem('gatoencerrado:gallery-likes', JSON.stringify(nextLiked));
  }, []);

  const revealLikeCount = useCallback((id) => {
    if (!id) return;
    setLikeRevealById((prev) => ({ ...prev, [id]: true }));
    if (likeRevealTimeoutRef.current) {
      clearTimeout(likeRevealTimeoutRef.current);
    }
    likeRevealTimeoutRef.current = setTimeout(() => {
      setLikeRevealById((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  }, []);

  const handleLike = useCallback(async () => {
    if (!activePost || !activeLikeId || likeStatus === 'loading' || isLiked) return;

    setLikeStatusById((prev) => ({ ...prev, [activeLikeId]: 'loading' }));
    const { success } = await recordGalleryLike({
      post: activePost,
      index: selectedIndex,
    });

    if (success) {
      setLikedPosts((prev) => {
        const next = prev.includes(activeLikeId) ? prev : [...prev, activeLikeId];
        persistLikedPosts(next);
        return next;
      });
      setLikeCountById((prev) => {
        const current = typeof prev[activeLikeId] === 'number' ? prev[activeLikeId] : 0;
        return { ...prev, [activeLikeId]: current + 1 };
      });
      setLikeStatusById((prev) => ({ ...prev, [activeLikeId]: 'success' }));
      revealLikeCount(activeLikeId);
      return;
    }

    setLikeStatusById((prev) => ({ ...prev, [activeLikeId]: 'error' }));
  }, [activePost, activeLikeId, isLiked, likeStatus, persistLikedPosts, revealLikeCount, selectedIndex]);

  useEffect(() => (
    () => {
      if (likeRevealTimeoutRef.current) {
        clearTimeout(likeRevealTimeoutRef.current);
      }
    }
  ), []);

  const isGalleryLoading = !isGalleryDisabled && !error && posts.length === 0;
  const placeholderSlots = collagePattern.slice(0, Math.min(visibleCount, collagePattern.length));
  const photographerLinkOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isPhotographerLinkOpen ? (
          <motion.div
            key="photographer-link-iframe"
            className="fixed inset-0 z-[170] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePhotographerLink}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={activePhotographerLink?.label || 'Perfil externo'}
              className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Perfil</p>
                  <h3 className="font-display text-2xl text-slate-100">
                    {activePhotographerLink?.label || 'Enlace externo'}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {activePhotographerLink?.url ? (
                    <a
                      href={activePhotographerLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-200 underline underline-offset-4 hover:text-white"
                    >
                      Abrir en nueva pestaña
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleClosePhotographerLink}
                    className="text-slate-300 hover:text-white transition"
                  >
                    Cerrar ✕
                  </button>
                </div>
              </div>
              <div className="relative w-full aspect-[16/10] bg-black">
                {activePhotographerLink?.url ? (
                  <iframe
                    src={activePhotographerLink.url}
                    title={activePhotographerLink?.label || 'Perfil externo'}
                    className="h-full w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">
                    No se pudo cargar el sitio.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;
  const confirmPhotographerLinkOverlay = typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        {isConfirmPhotographerLinkOpen ? (
          <motion.div
            key="photographer-link-confirm"
            className="fixed inset-0 z-[180] flex items-center justify-center px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseConfirmPhotographerLink}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar salida"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_35px_120px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.96, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 14 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">
                  Salida externa
                </p>
                <h3 className="font-display text-xl text-slate-100">
                  {confirmPhotographerLink?.label || 'Abrir enlace'}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-300/80 leading-relaxed">
                  Este sitio no permite vista interna. Se abrirá en otra pestaña para que
                  puedas regresar fácilmente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseConfirmPhotographerLink}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 transition"
                  >
                    Quedarme aquí
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPhotographerLink}
                    className="rounded-full bg-purple-500/80 px-4 py-2 text-sm text-white hover:bg-purple-500 transition"
                  >
                    Abrir enlace
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <section id="instagram" className="py-20 relative">
      <div className="section-divider mb-20" />

      <div className="container mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-5 text-gradient italic">
            Fractales Escénicos
          </h2>
         <p className="text-base md:text-lg text-slate-300/75 max-w-3xl mx-auto leading-relaxed mb-7 font-light">
  Un homenaje visual a los destellos de <em>Es un gato encerrado</em>.  
  Esto es lo que existe solo cuando alguien decide observar de verdad.  
  Mira la obra a través de los ojos de nuestros fotógrafos.
</p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {PHOTOGRAPHERS.map((photographer) => (
              <button
                key={photographer.id}
                type="button"
                onClick={() => setActivePhotographer(photographer.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  activePhotographer === photographer.id
                    ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                    : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                }`}
              >
                {photographer.label}
              </button>
            ))}
          </div>

              {/* Crédito fotográfico: tipografía pequeña y gris tenue; enlace al Team */}
              <p className="text-xs text-slate-400/70 mt-3">
                {activePhotographerData.creditPrefix}
                {activePhotographerData.creditLinks ? (
                  <>
                    <a
                      href={activePhotographerData.creditLinks[0]?.href}
                      onClick={(event) =>
                        handlePhotographerLinkClick(
                          event,
                          activePhotographerData.creditLinks[0]?.href,
                          `${activePhotographerData.creditLinks[0]?.text} de ${activePhotographerData.label}`
                        )
                      }
                      className="underline text-slate-300"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {activePhotographerData.creditLinks[0]?.text}
                    </a>
                    {' · '}
                    <a
                      href={activePhotographerData.creditLinks[1]?.href}
                      onClick={(event) =>
                        handlePhotographerLinkClick(
                          event,
                          activePhotographerData.creditLinks[1]?.href,
                          `${activePhotographerData.creditLinks[1]?.text} de ${activePhotographerData.label}`
                        )
                      }
                      className="underline text-slate-300"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {activePhotographerData.creditLinks[1]?.text}
                    </a>
                  </>
                ) : (
                  <a
                    href={activePhotographerData.creditLinkHref || '#team'}
                    onClick={(event) =>
                      handlePhotographerLinkClick(
                        event,
                        activePhotographerData.creditLinkHref,
                        `Perfil de ${activePhotographerData.label}`
                      )
                    }
                    className="underline text-slate-300"
                    target={activePhotographerData.creditLinkHref ? '_blank' : undefined}
                    rel={activePhotographerData.creditLinkHref ? 'noreferrer' : undefined}
                  >
                    {activePhotographerData.creditLinkText}
                  </a>
                )}
                .
              </p>

              
    
        </motion.div>

        {error && !isGalleryDisabled && (
          <div className="flex items-center justify-center gap-3 p-4 mb-6 text-center text-red-400 bg-red-900/20 rounded-lg">
            <AlertCircle size={22} />
            <p>{error}</p>
          </div>
        )}

        {isGalleryDisabled && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 mb-6 text-center md:text-left text-slate-200 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm md:text-base text-slate-300">
              La galería visual está en pausa temporalmente. Puedes explorar más fotos en nuestro perfil de Instagram.
            </p>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 border-white/20 text-slate-200 hover:bg-white/10"
              onClick={() => handleInstagramClick(instagramProfileUrl)}
            >
              Ver Instagram
              <ExternalLink size={16} />
            </Button>
          </div>
        )}

        {slots.length > 0 ? (
          <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 auto-rows-[95px] sm:auto-rows-[110px] md:auto-rows-[120px] lg:auto-rows-[140px] xl:auto-rows-[150px] gap-2 md:gap-3 lg:gap-3.5">
              <AnimatePresence mode="popLayout">
                {slots.map((slot, slotIdx) => {
                  const post = posts[slot.postIndex];
                  if (!post) {
                    return null;
                  }

                  const pattern = collagePattern[slot.patternIndex % collagePattern.length];
                  const story = slot.story ?? storyFragments[(slotIdx + slot.postIndex) % storyFragments.length];

                  return (
                    <motion.button
                      key={slot.slotId}
                      type="button"
                      layout
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      viewport={{ amount: 0.5, once: false }}
                      onClick={() => openModalAt(slot.postIndex)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openModalAt(slot.postIndex); }}
                      className={`group relative isolate flex h-full w-full cursor-pointer items-stretch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/60 ${pattern.grid}`}
                    >
                      <div className={`relative h-full w-full transition-transform duration-300 ease-out ${pattern.offset}`}>
                        <motion.div
                          layout
                          variants={cardVariants}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ amount: 0.6, once: false }}
                          whileHover={{ translateY: -6 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={`relative flex h-full w-full overflow-hidden rounded-[20px] bg-slate-950/70 backdrop-blur-sm ${pattern.frame}`}
                        >
                          <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${pattern.tint}`} aria-hidden="true" />
                          <motion.img
                          src={post.imgSrc}
                          alt={post.alt || 'Recuerdo #GatoEncerrado'}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          initial={{ scale: 1.02, y: 0, opacity: 1 }}   // Estado inicial ya visible
                          whileHover={{ scale: 1.06 }}                  // Solo efecto en hover
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />

                          <div className="relative flex h-full flex-col justify-between p-3 md:p-4">
                            <div className="text-[0.58rem] uppercase tracking-[0.3em] text-slate-200/75 mix-blend-screen">
                              #GatoEncerrado
                            </div>
                          <div className="flex flex-col gap-2">
                            <div className="w-8 md:w-10 border-t border-slate-200/30" />
                            <p className="text-[0.8rem] md:text-sm font-light text-slate-50/90 max-w-[10rem] md:max-w-[10.5rem] leading-relaxed drop-shadow-[0_10px_22px_rgba(15,23,42,0.6)]">
                              {story}
                            </p>
                    
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.button>
                );
              })}
              </AnimatePresence>
          </div>
        ) : isGalleryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 auto-rows-[95px] sm:auto-rows-[110px] md:auto-rows-[130px] lg:auto-rows-[150px] gap-2 md:gap-3 lg:gap-3.5">
              {placeholderSlots.map((pattern, index) => (
                <div
                  key={`placeholder-${index}`}
                  className={`relative h-full w-full ${pattern.grid}`}
                >
                  <div
                    className={`h-full w-full rounded-[20px] bg-white/5 animate-pulse ${pattern.frame}`}
                  />
                </div>
              ))}
            </div>
        ) : null}

        <AnimatePresence>
          {isModalOpen && activePost && (
            <motion.div
              key="gallery-modal"
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-slate-950/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
              />

              <motion.div
                className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[28px] bg-slate-900/90 backdrop-blur-xl shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="Recuerdo ampliado"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              >
                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-slate-300/90">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">#GatoEncerrado</p>
                      <span className="text-xs font-medium tracking-wide">
                        {totalPosts > 0 ? `${currentPosition + 1}` : '0'}
                        <span className="text-slate-400/80">/{totalPosts}</span>
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="relative">
                      <button
                        aria-label="Me gusta"
                        onClick={handleLike}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition ${
                          isLiked
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 border-transparent shadow-[0_0_18px_rgba(244,114,182,0.45)]'
                            : 'hover:bg-white/10'
                        }`}
                        disabled={likeStatus === 'loading' || isLiked}
                      >
                        <Heart size={18} className={isLiked ? 'fill-current' : undefined} />
                      </button>
                    </div>
                    <button
                      aria-label="Anterior"
                      onClick={showPrev}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      aria-label="Siguiente"
                      onClick={showNext}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      ref={closeButtonRef}
                      aria-label="Cerrar"
                      onClick={closeModal}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[3/2] w-full bg-black">
                  <img
                    src={activePost.imgSrc}
                    alt={activePost.alt || 'Recuerdo #GatoEncerrado'}
                    className="h-full w-full object-contain"
                  />
                  {likeRevealById[activeLikeId] ? (
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-2 text-base font-medium uppercase tracking-[0.3em] text-pink-200 shadow-[0_0_24px_rgba(244,114,182,0.45)]"
                      aria-hidden="true"
                    >
                      ❤ {typeof likeCount === 'number' ? likeCount : 0}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {photographerLinkOverlay}
      {confirmPhotographerLinkOverlay}
    </section>
  );
};

export default Instagram;
