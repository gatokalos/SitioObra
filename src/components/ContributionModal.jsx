import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';
import { supabase } from '@/lib/supabaseClient';
import { ensureAnonId } from '@/lib/identity';
import logoApp from '/assets/logoapp.png';
import {
  Drama,
  BookOpen,
  Smartphone,
  CupSoda,
  Film,
  BookMarked,
  Sparkles,
  Music,
  Coffee,
  Palette,
  Map,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';

const CATEGORIES = [
  {
    id: 'obra_escenica',
    icon: <Drama size={20} className="text-purple-300" />,
    title: 'La Obra - Es un Gato Encerrado',
    description: 'De la escena surgió el universo:\nvoz, trance y cuerpo\nactivando el paso.',

  },
    {
    id: 'miniverso_novela',
    icon: <BookOpen size={20} className="text-emerald-300" />,
    title: 'Literatura',
        description: 'La palabra devolvió lo que el gato se tragó:\nMi Gato Encerrado\n salió de sí para reconocerse.',
  },
  {
    id: 'taza',
    icon: <Coffee size={20} className="text-amber-300" />,
    title: 'Artesanías',
    description: 'Una taza que escucha.\nUn marcador que mira.\nLo cotidiano también es ritual.',
  },
  {
    id: 'cine',
    icon: <Film size={20} className="text-rose-300" />,
    title: 'Cine',
    description: 'Cuando la escena no basta,\nla cámara sostiene la memoria\nQuirón, CopyCats:\nel mismo espacio, expuesto de otra forma.',
  },
  {
    id: 'grafico',
    icon: <Palette size={20} className="text-fuchsia-300" />,
    title: 'Gráficos',
    description: 'Garabatea tu límite, dibuja tu refugio.\nLo gráfico como portal emocional.\nCada trazo se siente antes de entenderse.',
  },
  {
    id: 'apps',
    icon: <Smartphone size={20} className="text-lime-300" />,
    title: 'Juegos',
    description: 'Pantallas que acompañan.\nTecnologías que cuidan.\nAquí sigues el universo,\nsin salir del tuyo.',
  },
  {
    id: 'sonoro',
    icon: <Music size={20} className="text-cyan-300" />,
    title: 'Sonoridades',
    description: 'Sueña una imagen.\nAjusta el pulso.\nPermite que el poema respire sin ti.',
  },
  {
    id: 'movimiento',
    icon: <Map size={20} className="text-sky-300" />,
    title: 'Movimiento',
    description: 'Diosas en danza.\nCiudades como escenario.\nLa ruta vibra cuando alguien baila.',
  },
  {
    id: 'oraculo',
    icon: <Brain size={20} className="text-indigo-300" />,
    title: 'Oráculo',
    description: 'Preguntas que no buscan respuestas, sino resonancia. Mintea GATokens por cada huella.',
  },
  {
    id: 'otro',
    icon: <Sparkles size={20} className="text-fuchsia-300" />,
    title: 'Otra contribución',
    description: 'Performance, glitch sonoro o investigación híbrida. También cabe aquí.',
  },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};
const sheetVariants = {
  hidden: { opacity: 0, y: 90 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.25, ease: 'easeIn' } },
};

const initialFormState = {
  name: '',
  email: '',
  role: '',
  proposal: '',
  attachmentUrl: '',
};

const FORM_STORAGE_KEY = 'gatoencerrado-contrib-form';

const BETA_UNIVERSES = new Set(['apps', 'oraculo', 'sonoro']);

const formTitlesByUniverse = {
  obra_escenica: 'Si la Obra te tocó, este espacio es tuyo.',
  miniverso_novela: 'Si encontraste algo tuyo entre estas páginas, déjalo dicho.',
  taza: '¿Qué historia se activó cuando tomaste la taza? Escríbela aquí.',
  cine: '¿Qué imagen te persiguió después? Cuéntanos qué viste más allá de la pantalla.',
  grafico: '¿Qué símbolo, trazo o glitch quieres sumar a este laboratorio visual?',
  apps: '¿Cómo cambió tu forma de jugar o explorar este universo?',
  oraculo: 'Pregunta, responde y mintea: cada reflexión deja una huella y gana GATokens.',
  otro: 'Si no cabe en un miniverso… es porque aún no lo hemos nombrado.',
  sonoro: 'Comparte qué mezcla soñaste: qué viste, qué escuchaste, qué palabras eligieron.',
  movimiento: 'Cuéntanos qué ruta, coreografía o ritual colectivo quieres activar en la ciudad.',
};

const ContributionModal = ({
  open,
  onClose,
  initialCategoryId = null,
  presentation = 'modal',
  onReturnToShowcase = null,
}) => {
  const { user } = useAuth();
  const isSheet = presentation === 'sheet';
  const isDirectCategory = Boolean(initialCategoryId);
  const isAuthenticated = Boolean(user?.email);
  const preferredName = useMemo(
    () => user?.user_metadata?.alias || user?.user_metadata?.full_name || '',
    [user]
  );
  const authEmail = user?.email ?? '';
  const authDisplayName = preferredName || (authEmail ? authEmail.split('@')[0] : '');

  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [notifyOnPublish, setNotifyOnPublish] = useState(false);
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [isAnimatingCheckbox, setIsAnimatingCheckbox] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const storedFormRef = useRef(null);
  const loginDelayRef = useRef(null);
  const [formStorageLoaded, setFormStorageLoaded] = useState(false);
  const indicatorActive = isAuthenticated || notifyOnPublish;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = safeGetItem(FORM_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        storedFormRef.current = parsed;
        setFormState((prev) => ({
          ...prev,
          ...parsed.formState,
        }));
        setNotifyOnPublish(Boolean(parsed.notifyOnPublish));
        const storedCategory = CATEGORIES.find((item) => item.id === parsed.selectedCategory);
        if (storedCategory) {
          setSelectedCategory(storedCategory);
        }
      } catch {
        storedFormRef.current = null;
      }
    }
    setFormStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!open || !formStorageLoaded) {
      return;
    }

    const preferredCategory =
      (initialCategoryId && CATEGORIES.find((item) => item.id === initialCategoryId)) || null;

    if (!storedFormRef.current) {
      setFormState({
        ...initialFormState,
        name: isAuthenticated ? authDisplayName : '',
        email: isAuthenticated ? authEmail : '',
      });
      setNotifyOnPublish(isAuthenticated);
      setSelectedCategory(preferredCategory ?? CATEGORIES[0]);
      setIsFormPanelOpen(Boolean(preferredCategory));
    } else {
      const storedState = storedFormRef.current.formState ?? initialFormState;
      setFormState({
        ...storedState,
      });
      const storedNotify = storedFormRef.current.notifyOnPublish;
      setNotifyOnPublish(
        typeof storedNotify === 'boolean' ? storedNotify : isAuthenticated
      );
      const storedCategory = CATEGORIES.find(
        (item) => item.id === storedFormRef.current.selectedCategory
      );
      setSelectedCategory(preferredCategory ?? storedCategory ?? CATEGORIES[0]);
      setIsFormPanelOpen(true);
    }
    setStatus('idle');
    setErrorMessage('');
  }, [open, isAuthenticated, formStorageLoaded, initialCategoryId, authDisplayName, authEmail]);

  useEffect(() => {
    if (!open || !isAuthenticated) {
      return;
    }
    setFormState((prev) => ({
      ...prev,
      name: prev.name?.trim() ? prev.name : authDisplayName,
      email: authEmail || prev.email,
    }));
  }, [open, isAuthenticated, authDisplayName, authEmail]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const handleDesktopChange = (event) => {
      setIsDesktopLayout(event.matches);
    };
    const handleMobileChange = (event) => {
      setIsMobileLayout(event.matches);
    };
    setIsDesktopLayout(desktopQuery.matches);
    setIsMobileLayout(mobileQuery.matches);
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleDesktopChange);
      mobileQuery.addEventListener('change', handleMobileChange);
    } else {
      desktopQuery.addListener(handleDesktopChange);
      mobileQuery.addListener(handleMobileChange);
    }
    return () => {
      if (desktopQuery.removeEventListener) {
        desktopQuery.removeEventListener('change', handleDesktopChange);
        mobileQuery.removeEventListener('change', handleMobileChange);
      } else {
        desktopQuery.removeListener(handleDesktopChange);
        mobileQuery.removeListener(handleMobileChange);
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginOverlay(false);
    }
  }, [isAuthenticated]);

  const handleInputChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      if (isAuthenticated && name === 'email') {
        return;
      }
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    [isAuthenticated]
  );

  const closeLoginOverlay = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const handleNotifyAnimation = useCallback(() => {
    setIsAnimatingCheckbox(true);
    setTimeout(() => setIsAnimatingCheckbox(false), 420);
  }, []);

  const handleNotifySound = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 720;
    gain.gain.value = 0.03;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    oscillator.onended = () => {
      context.close();
    };
  }, []);

  const triggerLoginOverlay = useCallback(() => {
    if (loginDelayRef.current) {
      return;
    }
    loginDelayRef.current = setTimeout(() => {
      setShowLoginOverlay(true);
      loginDelayRef.current = null;
    }, 520);
  }, []);

  const handleNotifyCheckboxChange = useCallback(
    (event) => {
      handleNotifyAnimation();
      handleNotifySound();
      setTimeout(handleNotifySound, 140);
      if (!isAuthenticated && event.target.checked) {
        triggerLoginOverlay();
        return;
      }
      setNotifyOnPublish(event.target.checked);
    },
    [handleNotifyAnimation, handleNotifySound, isAuthenticated, triggerLoginOverlay]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload = {
      formState,
      notifyOnPublish,
      selectedCategory: selectedCategory.id,
    };
    safeSetItem(FORM_STORAGE_KEY, JSON.stringify(payload));
    storedFormRef.current = payload;
  }, [formState, notifyOnPublish, selectedCategory]);

  useEffect(() => {
    return () => {
      if (loginDelayRef.current) {
        clearTimeout(loginDelayRef.current);
      }
    };
  }, []);

  const triggerConfetti = useCallback(() => {
    const id = Date.now();
    setConfettiBursts((prev) => [...prev, id]);
    setTimeout(() => {
      setConfettiBursts((prev) => prev.filter((item) => item !== id));
    }, 1100);
  }, []);

  const handleGoToMiniversos = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    onClose?.();
    if (typeof document === 'undefined') {
      return;
    }
    setTimeout(() => {
      document.querySelector('#transmedia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, [onClose, status]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') {
        return;
      }

      if (!formState.name.trim() || !formState.email.trim() || !formState.proposal.trim()) {
        toast({ description: 'Completa tu nombre, correo y una breve propuesta.' });
        return;
      }

      if (notifyOnPublish && !isAuthenticated) {
        triggerLoginOverlay();
        toast({ description: 'Inicia sesión para recibir la notificación personalizada.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const topicId = selectedCategory?.id ?? 'obra_escenica';
        const payload = {
          name: formState.name.trim(),
          email: formState.email.trim().toLowerCase(),
          role: formState.role.trim() || null,
          content: formState.proposal.trim(),
          link: formState.attachmentUrl.trim() || null,
          notify: notifyOnPublish,
          topic: topicId,
        };

        const supabaseFunctionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
        const apiUrl = import.meta.env.VITE_API_URL;
        const normalizedApiUrl = apiUrl?.replace(/\/+$/, '');
        const apiFunctionsUrl =
          normalizedApiUrl && normalizedApiUrl.endsWith('/functions/v1')
            ? normalizedApiUrl
            : normalizedApiUrl
              ? `${normalizedApiUrl}/functions/v1`
              : null;
        const baseUrl = supabaseFunctionsUrl ?? apiFunctionsUrl;
        if (!baseUrl) {
          setStatus('error');
          setErrorMessage('El servicio de contribuciones no está disponible por ahora.');
          return;
        }

        const anonKey =
          import.meta.env.VITE_SUPABASE_ANON_KEY ??
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!anonKey) {
          setStatus('error');
          setErrorMessage('El servicio de contribuciones no está disponible por ahora.');
          return;
        }

        const response = await fetch(`${baseUrl}/submit-blog-contribution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));
        const success = response.ok && body?.ok === true;

        if (!success) {
          setStatus('error');
          setErrorMessage('No pudimos registrar tu propuesta. Intenta nuevamente más tarde.');
          return;
        }

        if (topicId === 'obra_escenica') {
          try {
            const anonId = ensureAnonId();
            const { error } = await supabase.from('miniverso_obra_interactions').insert({
              interaction_type: 'voice_note',
              voice_text: payload.content,
              user_id: user?.id ?? null,
              anon_id: anonId ?? null,
            });
            if (error) {
              console.error('[Suma tu voz] Supabase insert error:', error);
            }
          } catch (error) {
            console.error('[Suma tu voz] Supabase insert failed:', error);
          }
        }

        setStatus('success');
        triggerConfetti();
        toast({ description: '¡Gracias! Revisaremos tu propuesta y te contactaremos pronto.' });
        setFormState({
          ...initialFormState,
          name: preferredName || '',
          email: user?.email ?? '',
        });
        setNotifyOnPublish(false);
        setSelectedCategory(CATEGORIES[0]);
        setIsFormPanelOpen(false);
        safeRemoveItem(FORM_STORAGE_KEY);
        storedFormRef.current = null;
      } catch (err) {
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [
      formState,
      status,
      selectedCategory,
      notifyOnPublish,
      isAuthenticated,
      triggerConfetti,
      preferredName,
      user?.email,
      user?.id,
    ]
  );

  const handleClose = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    onClose?.();
  }, [onClose, status]);

  const handleSelectCategory = useCallback((category) => {
    setSelectedCategory(category);
    setIsFormPanelOpen(true);
  }, []);

  const formTitle = useMemo(() => {
    return (
      formTitlesByUniverse[selectedCategory?.id] ??
      'Contribuye al diálogo crítico'
    );
  }, [selectedCategory]);

  const handleCloseFormPanel = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    setIsFormPanelOpen(false);
  }, [status]);

  const renderBetaCard = () => (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[0.8rem] text-slate-300 leading-relaxed">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">¿Qué necesitas saber?</p>
      <p>• Algunos miniversos aún están bajo construcción.</p>
      <p>• Puedes ser parte de las pruebas tempranas o versiones beta.</p>
      <p>• Si te unes a esta lista, recibirás avances exclusivos antes de que se abran al público.</p>
      <div className="border-t border-white/10 pt-3 text-xs uppercase tracking-[0.35em] text-slate-500">
        ✨ ¿Qué recibirás?
      </div>
      <p className="text-sm">
        Invitaciones a exploraciones internas, accesos temporales, adelantos curatoriales y ventanas de activación anticipada en los miniversos en desarrollo.
      </p>
    </div>
  );

  const renderFormPanelBody = () => (
    <div className="relative">
      <div className="mb-4" />
      {isMobileLayout && !isDirectCategory ? (
        <button
          type="button"
          onClick={handleCloseFormPanel}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200"
        >
          ← Ver Más
        </button>
      ) : null}
      {isMobileLayout && BETA_UNIVERSES.has(selectedCategory.id) ? (
        <div className="mb-4">{renderBetaCard()}</div>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <input
            name="name"
            type="text"
            required
            value={formState.name}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            placeholder="¿Cómo quieres que te nombremos?"
          />
          <p className="mt-1 text-xs text-slate-500">
            ¿Así quieres que te llamemos? Dinos cómo te gusta que te nombren.
          </p>
        </div>

        <div>
          <input
            name="email"
            type="email"
            required
            value={formState.email}
            onChange={handleInputChange}
            readOnly={isAuthenticated}
            className={`w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 ${
              isAuthenticated ? 'cursor-not-allowed opacity-80' : ''
            }`}
            placeholder="nombre@correo.com"
          />
          {isAuthenticated ? (
            <p className="mt-1 text-xs text-slate-500">El correo se toma de tu sesión actual.</p>
          ) : null}
        </div>

        <input
          name="role"
          type="text"
          value={formState.role}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
          placeholder="Crítica teatral, artista, investigador, espectador..."
        />

        <textarea
          name="proposal"
          rows={5}
          required
          value={formState.proposal}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none"
          placeholder="Resume tu texto, crónica o propuesta curatorial..."
        />

        <input
          name="attachmentUrl"
          type="url"
          value={formState.attachmentUrl}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
          placeholder="Enlace a material adicional (Drive, portfolio, video...)"
        />

        <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-black/20 px-4 py-3">
          <motion.button
            type="button"
            onClick={handleNotifyCheckboxChange}
            aria-label="Activar notificación de publicación"
            className="relative flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/60"
          >
            <motion.div
              animate={
                indicatorActive
                  ? {
                      scale: [1, 1.05, 1],
                      boxShadow: notifyOnPublish
                        ? '0 0 18px rgba(74,222,128,0.65)'
                        : '0 0 12px rgba(74,222,128,0.45)',
                      filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.45))',
                    }
                  : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
              }
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`h-5 w-5 rounded-full border border-white/20 ${
                indicatorActive
                  ? 'bg-emerald-400 shadow-[0_0_12px_4px_rgba(52,211,153,0.65)] ring-2 ring-emerald-300/70'
                  : 'bg-slate-600/40'
              }`}
            />
            <span className="text-sm text-slate-300/80 leading-relaxed">
              Quiero ser parte de este hilo.
            </span>
          </motion.button>

          {!isAuthenticated ? (
            <span className="pl-8 text-xs text-slate-500">Inicia sesión para activar el seguimiento</span>
          ) : null}
        </div>

        {status === 'error' ? (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Recibimos tu propuesta. Te contactaremos si necesitamos más detalles.
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
        >
          {status === 'loading' ? 'Enviando…' : 'Enviar comentario'}
      </Button>
      </form>
      {isDesktopLayout && BETA_UNIVERSES.has(selectedCategory.id) ? (
        <div className="mt-6 space-y-3">{renderBetaCard()}</div>
      ) : null}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className={`fixed inset-0 ${isSheet ? 'z-[160] items-end px-0 py-0 md:items-center md:px-6 md:py-10' : 'z-50 items-center px-4 py-6 sm:py-12'} flex justify-center`}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className={`absolute inset-0 ${isSheet ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black/80 backdrop-blur-sm'}`}
              variants={backdropVariants}
              onClick={handleClose}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contribution-modal-title"
              variants={isSheet ? sheetVariants : modalVariants}
              className={`relative z-10 w-full max-w-5xl ${
                isSheet
                  ? 'h-screen max-h-screen rounded-t-3xl md:h-[70vh] md:max-h-[70vh] md:rounded-3xl bg-slate-950/90 backdrop-blur-xl'
                  : 'h-full max-h-[90vh] rounded-3xl bg-slate-950'
              } border border-white/10 p-4 sm:p-8 shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col gap-6`}
            >
              <div className="relative overflow-visible">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoApp}
                      alt="Logotipo Gato Encerrado"
                      className="h-20 w-20 rounded-xl border border-white/15 bg-black/40 p-1"
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400/70">
                        Formulario
                      </p>
                      <h2
                        id="contribution-modal-title"
                        className="font-display text-xl sm:text-2xl text-slate-50 leading-snug"
                      >
                        {formTitle}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {onReturnToShowcase ? (
                      <button
                        type="button"
                        onClick={onReturnToShowcase}
                        className="text-xs uppercase tracking-[0.3em] text-purple-200/80 hover:text-white transition"
                      >
                        Regresar
                      </button>
                    ) : null}
                    <button
                      onClick={handleClose}
                      className="text-slate-400 hover:text-white transition text-xl leading-none"
                      aria-label="Cerrar formulario de propuestas"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {confettiBursts.map((burst) => (
                  <ConfettiBurst key={burst} seed={burst} />
                ))}
              </div>

              {isDirectCategory ? (
                <div className="mt-1">{renderFormPanelBody()}</div>
              ) : (
                <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:gap-6">
                  <div className="flex-1 space-y-3 pr-3 md:pr-0 md:overflow-y-auto md:max-h-[72vh]">
                    {CATEGORIES.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() => handleSelectCategory(category)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selectedCategory.id === category.id
                            ? 'bg-purple-500/15 border-purple-300/40'
                            : 'bg-black/20 border-white/10 hover:border-purple-300/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {category.icon}
                          <h4 className="text-slate-100 font-medium">{category.title}</h4>
                        </div>
                        <p className="text-sm text-slate-400/80 leading-relaxed whitespace-pre-line">
                          {category.description}
                        </p>
                      </button>
                    ))}
                    <div className="pt-2 text-center text-xs text-purple-200/80">
                      <button
                        type="button"
                        onClick={handleGoToMiniversos}
                        className="underline-offset-4 hover:underline"
                      >
                        ¿No conoces los Miniversos? Clica aquí
                      </button>
                    </div>
                  </div>

                  {isDesktopLayout ? (
                    <div className="md:w-[520px] md:shrink-0">
                      {isFormPanelOpen ? (
                        <motion.div
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="flex h-full max-h-[78vh] flex-col rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl overflow-y-auto"
                        >
                          {renderFormPanelBody()}
                        </motion.div>
                      ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 px-4 text-center text-sm text-slate-400">
                          Selecciona una categoría para abrir el formulario.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <AnimatePresence>
                {!isDesktopLayout && isFormPanelOpen && !isDirectCategory ? (
                  <>
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                      className={`fixed inset-0 ${isSheet ? 'z-[180]' : 'z-[60]'} w-full bg-slate-950 border-white/15 shadow-2xl p-6 overflow-y-auto md:hidden`}
                    >
                      {renderFormPanelBody()}
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginOverlay ? (
          <LoginOverlay onClose={closeLoginOverlay} />
        ) : null}
      </AnimatePresence>

    </>
  );
};

const CONFETTI_COLORS = ['#f472b6', '#a855f7', '#facc15', '#34d399'];

const ConfettiBurst = ({ seed }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => ({
      left: Math.random() * 100,
      top: Math.random() * 20,
      delay: Math.random() * 0.2,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    }));
  }, [seed]);

  return (
    <div className="confetti-layer">
      {pieces.map((piece, index) => (
        <span
          key={`${seed}-${index}`}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ContributionModal;
