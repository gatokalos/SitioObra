import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram as InstagramIcon, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstagramPostsFromBucket } from '@/services/instagramService';
import { recordGalleryLike } from '@/services/galleryLikeService';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const collagePattern = [
  { grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-4 md:col-span-3 md:row-span-3 lg:col-span-3 lg:row-span-4',
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
    grid: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2 md:col-span-3 md:row-span-2 lg:col-span-3 lg:row-span-3',
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
    grid: 'col-span-2 row-span-2 sm:col-span-3 sm:row-span-2 md:col-span-3 md:row-span-2 lg:col-span-3 lg:row-span-2',
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
    grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-3 md:col-span-3 md:row-span-3 lg:col-span-4 lg:row-span-4',
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
    grid: 'col-span-2 row-span-3 sm:col-span-3 sm:row-span-4 md:col-span-3 md:row-span-3 lg:col-span-3 lg:row-span-4',
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

const curatedLayout = [
  { match: 'Copia de Foto 1 (1)', patternIndex: 0, story: 'El futuro ha arribado' },
  { match: 'PoloyEstela', patternIndex: 1, story: 'Entre micro-climas' },
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

const storyFragments = [
  'El gatillo emocional',
];

const Instagram = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isGalleryDisabled, setIsGalleryDisabled] = useState(false);
  const instagramProfileUrl = 'https://www.instagram.com/esungatoencerrado/?hl=en';
  const VISIBLE_COUNT = 15;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [likeStatusById, setLikeStatusById] = useState({});
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
  const [slots, setSlots] = useState([]);
  const nextIndexRef = useRef(0);
  const orderedSequenceRef = useRef([]);

  const matchesDescriptor = useCallback((post, descriptor) => {
    if (!descriptor) return false;
    const target = `${post.alt || ''} ${post.imgSrc || ''}`.toLowerCase();
    if (Array.isArray(descriptor)) {
      return descriptor.some((value) => target.includes(String(value).toLowerCase()));
    }
    return target.includes(String(descriptor).toLowerCase());
  }, []);

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

    curatedLayout.forEach((entry) => {
      const indexInAvailable = availablePosts.findIndex((candidate, idx) => !usedIndices.has(idx) && matchesDescriptor(candidate.post, entry.match));
      if (indexInAvailable !== -1) {
        const foundEntry = availablePosts[indexInAvailable];
        usedIndices.add(indexInAvailable);
        prioritized.push({
          postIndex: foundEntry.originalIndex,
          patternIndex: entry.patternIndex ?? (prioritized.length % collagePattern.length),
          story: entry.story ?? storyFragments[prioritized.length % storyFragments.length],
        });
      }
    });

    const remaining = availablePosts
      .map((entry, idx) => ({ ...entry, idx }))
      .filter(({ idx }) => !usedIndices.has(idx))
      .map((entry, offset) => ({
        postIndex: entry.originalIndex,
        patternIndex: (prioritized.length + offset) % collagePattern.length,
        story: storyFragments[(prioritized.length + offset) % storyFragments.length],
      }));

    const fullSequence = [...prioritized, ...remaining];
    orderedSequenceRef.current = fullSequence;

    if (fullSequence.length === 0) {
      setSlots([]);
      nextIndexRef.current = 0;
      return;
    }

    const visible = Math.min(VISIBLE_COUNT, fullSequence.length);
    const initialSlots = fullSequence.slice(0, visible).map((item, index) => ({
      slotId: `${Date.now()}-${index}-${item.postIndex}-${Math.random()}`,
      postIndex: item.postIndex,
      patternIndex: item.patternIndex,
      story: item.story,
    }));

    setSlots(initialSlots);
    nextIndexRef.current = fullSequence.length > 0 ? (visible % fullSequence.length) : 0;
  }, [posts, VISIBLE_COUNT, matchesDescriptor, shouldExclude]);

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

  const isModalOpen = selectedIndex !== null;
  const activePost = isModalOpen && posts[selectedIndex] ? posts[selectedIndex] : null;
  const activeLikeId = activePost?.id || activePost?.filename || activePost?.imgSrc;
  const likeStatus = activeLikeId ? likeStatusById[activeLikeId] : 'idle';
  const isLiked = activeLikeId ? likedPosts.includes(activeLikeId) : false;
  const totalPosts = posts.length;
  const currentPosition = selectedIndex !== null ? selectedIndex : 0;
  const progressPercent = totalPosts > 0 ? ((currentPosition + 1) / totalPosts) * 100 : 0;

  useEffect(() => {
    if (isModalOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isModalOpen]);

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

  const handleViewportLeave = useCallback((slotIdx, entry) => {
    if (!entry || posts.length <= VISIBLE_COUNT) return;

    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const isLeavingTop = entry.boundingClientRect.bottom <= 0;
    const isLeavingBottom = viewportHeight ? entry.boundingClientRect.top >= viewportHeight : false;

    if (!isLeavingTop && !isLeavingBottom) return;

    setSlots((prevSlots) => {
      if (!Array.isArray(prevSlots) || prevSlots.length === 0) {
        return prevSlots;
      }

      const candidateSlots = [...prevSlots];
      const usedIndices = new Set(
        candidateSlots
          .filter((_, idx) => idx !== slotIdx)
          .map((slot) => slot.postIndex),
      );

      const pool = orderedSequenceRef.current;
      if (!pool || pool.length === 0) {
        return prevSlots;
      }

      let pointer = nextIndexRef.current ?? 0;
      let guard = 0;

      while (guard < pool.length && usedIndices.has(pool[pointer].postIndex)) {
        pointer = (pointer + 1) % pool.length;
        guard += 1;
      }

      if (guard >= pool.length) {
        return prevSlots;
      }

      const chosen = pool[pointer];
      nextIndexRef.current = (pointer + 1) % pool.length;

      candidateSlots[slotIdx] = {
        slotId: `${Date.now()}-${slotIdx}-${chosen.postIndex}-${Math.random()}`,
        postIndex: chosen.postIndex,
        patternIndex: chosen.patternIndex,
        story: chosen.story,
      };

      return candidateSlots;
    });
  }, [posts.length, VISIBLE_COUNT]);

  const persistLikedPosts = useCallback((nextLiked) => {
    safeSetItem('gatoencerrado:gallery-likes', JSON.stringify(nextLiked));
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
      setLikeStatusById((prev) => ({ ...prev, [activeLikeId]: 'success' }));
      return;
    }

    setLikeStatusById((prev) => ({ ...prev, [activeLikeId]: 'error' }));
  }, [activePost, activeLikeId, isLiked, likeStatus, persistLikedPosts, selectedIndex]);

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
            Un homenaje visual a los destellos de Es un gato encerrado... Esto es lo que existe solo cuando alguien se atreve a mirar.
          </p>

              {/* Crédito fotográfico: tipografía pequeña y gris tenue; enlace al Team */}
              <p className="text-xs text-slate-400/70 mt-3">
                Fotografía: Gabriel Monroy. Su semblanza está disponible en {' '}
                <a href="#team" className="underline text-slate-300">Producción</a>.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 auto-rows-[95px] sm:auto-rows-[110px] md:auto-rows-[130px] lg:auto-rows-[150px] gap-2 md:gap-3 lg:gap-3.5">
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
                    onViewportLeave={(entry) => handleViewportLeave(slotIdx, entry)}
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
        ) : !error && !isGalleryDisabled ? (
            <div className="text-center text-slate-400 animate-pulse italic">
              <p>Cargando recuerdos...</p>
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
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Instagram;
