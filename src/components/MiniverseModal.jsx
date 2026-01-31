import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Brain, Coffee, Drama, Film, MapIcon, Music, Palette, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const TABS = [
  { id: 'experiences', label: 'Miniversos activos' },
  { id: 'waitlist', label: 'Próximamente' },
];

const MINIVERSE_CARDS = [
  {
    id: 'drama',
    formatId: 'miniversos',
    icon: Drama,
    thumbLabel: 'D',
    thumbGradient: 'from-purple-400/80 via-fuchsia-500/70 to-rose-500/60',
    title: 'Miniverso Obra',
    titleShort: 'Obra',
    description: 'Dialoga con la obra sobre tus impresiones de la obra.',
    action: 'Explora',
  },
  {
    id: 'literatura',
    formatId: 'miniversoNovela',
    icon: BookOpen,
    thumbLabel: 'L',
    thumbGradient: 'from-emerald-400/80 via-teal-500/70 to-cyan-500/60',
    title: 'Miniverso Literatura',
    titleShort: 'Literatura',
    description:
      'La obra reescrita como novela: el texto se transforma en autoficción.',
    action: 'Explora',
  },
  {
    id: 'taza',
    formatId: 'lataza',
    icon: Coffee,
    thumbLabel: 'A',
    thumbGradient: 'from-amber-400/80 via-orange-500/70 to-rose-500/60',
    title: 'Miniverso Artesanías',
    titleShort: 'Artesanías',
    description:
      'Objeto ritual de que activa la experiencia fuera del escenario.',
    action: 'Explora',
  },
  {
    id: 'graficos',
    formatId: 'miniversoGrafico',
    icon: Palette,
    thumbLabel: 'G',
    thumbGradient: 'from-fuchsia-400/80 via-purple-500/70 to-indigo-500/60',
    title: 'Miniverso Gráficos',
    titleShort: 'Gráficos',
    description: 'Imágenes y trazos nacidos del proceso creativo de la obra.',
    action: 'Explora',
    isUpcoming: true,
  },
  {
    id: 'cine',
    formatId: 'copycats',
    icon: Film,
    thumbGradient: 'from-rose-500/80 via-red-500/70 to-fuchsia-500/60',
    title: 'Miniverso Cine',
    titleShort: 'Cine',
    description:
      'Películas y miradas que dialogan con el universo de la obra.',
    action: 'Explora',
  },
  {
    id: 'sonoro',
    formatId: 'miniversoSonoro',
    icon: Music,
    thumbLabel: 'S',
    thumbGradient: 'from-sky-400/80 via-cyan-500/70 to-indigo-500/60',
    title: 'Miniverso Sonoridades',
    titleShort: 'Sonoridades',
    description:
      'Música, poemas y registros sonoros surgidos de la obra.',
    action: 'Explora',
  },
    {
    id: 'movimiento',
    formatId: 'miniversoMovimiento',
    icon: MapIcon,
    thumbLabel: 'M',
    thumbGradient: 'from-sky-400/80 via-emerald-500/70 to-cyan-500/60',
    title: 'Miniverso Movimiento',
    titleShort: 'Movimiento',
    description: 'Cuerpos, recorridos y figuras rituales que expanden la obra en el espacio.',
    action: 'Explora',
    isUpcoming: true,
  },
  {
    id: 'apps',
    formatId: 'apps',
    icon: Smartphone,
    thumbLabel: 'J',
    thumbGradient: 'from-lime-400/80 via-emerald-500/70 to-teal-500/60',
    title: 'Miniverso Apps',
    titleShort: 'Apps',
    description: 'Experimentos lúdicos que reescriben la obra en formato interactivo.',
    action: 'Explora',
  },
  {
    id: 'oraculo',
    formatId: 'oraculo',
    icon: Brain,
    thumbLabel: 'O',
    thumbGradient: 'from-indigo-400/80 via-violet-500/70 to-purple-500/60',
    title: 'Miniverso Oráculo',
    titleShort: 'Oráculo',
    description: 'Preguntas, azar y respuestas que la obra deja abiertas.',
    action: 'Explora',
  },

];

const initialFormState = {
  fullName: '',
  email: '',
  interest: 'miniversos',
  message: '',
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.85 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const MiniverseModal = ({ open, onClose, onSelectMiniverse }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [formState, setFormState] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMiniverseId, setSelectedMiniverseId] = useState(null);
  const [selectedUpcomingId, setSelectedUpcomingId] = useState(null);
  const [visitedMiniverses, setVisitedMiniverses] = useState({});

  const playKnockSound = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    const context = new AudioContext();
    const now = context.currentTime;

    const scheduleKnock = (time, frequency) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.06, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.14);
    };

    scheduleKnock(now + 0.02, 180);
    scheduleKnock(now + 0.18, 150);

    setTimeout(() => {
      context.close();
    }, 500);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(TABS[0].id);
      setFormState(initialFormState);
      setStatus('idle');
      setErrorMessage('');
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
    }
  }, [open]);

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

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const activeTabLabel = useMemo(() => TABS.find((tab) => tab.id === activeTab)?.label ?? TABS[0].label, [activeTab]);
  const upcomingMiniverses = useMemo(
    () => MINIVERSE_CARDS.filter((card) => card.isUpcoming),
    []
  );
  const selectedMiniverse = useMemo(
    () => MINIVERSE_CARDS.find((card) => card.id === selectedMiniverseId) ?? null,
    [selectedMiniverseId]
  );
  const selectedUpcoming = useMemo(
    () => upcomingMiniverses.find((card) => card.id === selectedUpcomingId) ?? null,
    [selectedUpcomingId, upcomingMiniverses]
  );

  const markMiniverseVisited = useCallback((miniverseId) => {
    if (!miniverseId) return;
    setVisitedMiniverses((prev) => (prev[miniverseId] ? prev : { ...prev, [miniverseId]: true }));
  }, []);

  const handleTabChange = useCallback(
    (tabId) => {
      if (selectedMiniverseId) {
        markMiniverseVisited(selectedMiniverseId);
      }
      setActiveTab(tabId);
      setSelectedMiniverseId(null);
      setSelectedUpcomingId(null);
    },
    [markMiniverseVisited, selectedMiniverseId]
  );

  const handleSelectCard = useCallback(
    (card) => {
      if (card.isUpcoming) {
        return;
      }
      if (!visitedMiniverses[card.id]) {
        playKnockSound();
      }
      markMiniverseVisited(card.id);
      setSelectedMiniverseId(card.id);
    },
    [markMiniverseVisited, playKnockSound, visitedMiniverses]
  );

  const handleSelectUpcoming = useCallback((card) => {
    setSelectedUpcomingId(card.id);
  }, []);

  const handleReturnToUpcomingList = useCallback(() => {
    setSelectedUpcomingId(null);
  }, []);

  const handleReturnToList = useCallback(() => {
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    setSelectedMiniverseId(null);
  }, [markMiniverseVisited, selectedMiniverseId]);

  const handleEnterMiniverse = useCallback(() => {
    if (!selectedMiniverse) return;
    markMiniverseVisited(selectedMiniverse.id);
    onSelectMiniverse?.(selectedMiniverse.formatId);
  }, [markMiniverseVisited, onSelectMiniverse, selectedMiniverse]);

  const handleEnterUpcoming = useCallback(() => {
    if (!selectedUpcoming) return;
    onSelectMiniverse?.(selectedUpcoming.formatId);
  }, [onSelectMiniverse, selectedUpcoming]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === 'loading') {
        return;
      }

      if (!formState.fullName.trim() || !formState.email.trim()) {
        toast({ description: 'Por favor completa tu nombre y correo.' });
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        const payload = {
          full_name: formState.fullName.trim(),
          email: formState.email.trim().toLowerCase(),
          city: null,
          interest: 'miniversos',
          channel: 'landing',
          object_type: 'experiencia-digital',
          event: 'miniversos',
          notes: formState.message.trim() || null,
        };

        const { error } = await supabase.from('rsvp_extended').insert(payload);

        if (error) {
          console.error('[MiniverseModal] Error al registrar miniverso:', error);
          setStatus('error');
          setErrorMessage(
            error.message?.includes('rsvp_extended')
              ? 'Crea la tabla rsvp_extended en Supabase para habilitar este formulario.'
              : 'No pudimos registrar tu interés. Intenta de nuevo.'
          );
          return;
        }

        setStatus('success');
        toast({
          description: 'Gracias. Te enviaremos una señal cuando el próximo miniverso cobre vida.',
        });
      } catch (err) {
        console.error('[MiniverseModal] Excepción al guardar:', err);
        setStatus('error');
        setErrorMessage('Ocurrió un error inesperado. Intenta más tarde.');
      }
    },
    [formState, status]
  );

  const handleClose = useCallback(() => {
    if (status === 'loading') {
      return;
    }
    if (selectedMiniverseId) {
      markMiniverseVisited(selectedMiniverseId);
    }
    onClose?.();
  }, [markMiniverseVisited, onClose, selectedMiniverseId, status]);

  const handleScrollToSupport = useCallback(() => {
    if (typeof document === 'undefined') {
      onClose?.();
      return;
    }
    onClose?.();
    setTimeout(() => {
      document.querySelector('#apoya')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 140);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 py-6 sm:px-4 sm:py-10 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="miniverse-modal-title"
            variants={modalVariants}
            className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-5 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400/80 mb-2">
            Narrativa expandida
          </p>

          <h2 id="miniverse-modal-title" className="font-display text-3xl text-slate-50">
            Explora el universo de #GatoEncerrado
          </h2>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/90">
            Cuando la obra no está en cartelera, su narrativa pulsa en otros lenguajes.{" "}
            <strong className="font-semibold text-slate-50">
              Explora a tu ritmo. Cada miniverso es una puerta.
            </strong>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  activeTab === tab.id
                    ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                    : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

            <div className="grid md:grid-cols-2 gap-8">
              {activeTab === 'waitlist' ? (
                <>
                  <div className="space-y-4 text-slate-300/90 text-sm leading-relaxed">
                    <div className="glass-effect rounded-2xl border border-white/10 p-5 space-y-4">
                  
                      <h3 className="font-display text-2xl text-slate-100">
                        Estos miniversos necesitan tu apoyo para cobrar vida.
                      </h3>
                      <p className="font-semibold text-purple-100">
                        👉{' '}
                        <button
                          type="button"
                          onClick={handleScrollToSupport}
                          className="underline underline-offset-4 text-purple-100 hover:text-white transition"
                        >
                          Suscríbete
                        </button>
                        , comparte o participa.
                      </p>

                      {selectedUpcoming ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5 min-h-[220px]">
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-45 mix-blend-screen"
                            style={{
                              backgroundImage:
                                'radial-gradient(1px 1px at 12% 18%, rgba(248,250,252,0.8), transparent 65%),' +
                                'radial-gradient(1.5px 1.5px at 24% 42%, rgba(241,245,249,0.65), transparent 70%),' +
                                'radial-gradient(2px 2px at 36% 28%, rgba(226,232,240,0.6), transparent 70%),' +
                                'radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,0.45), transparent 70%),' +
                                'radial-gradient(1.5px 1.5px at 52% 18%, rgba(241,245,249,0.55), transparent 70%),' +
                                'radial-gradient(2px 2px at 64% 48%, rgba(226,232,240,0.6), transparent 70%),' +
                                'radial-gradient(1px 1px at 72% 30%, rgba(255,255,255,0.4), transparent 70%),' +
                                'radial-gradient(1.5px 1.5px at 80% 66%, rgba(241,245,249,0.55), transparent 70%),' +
                                'radial-gradient(2px 2px at 88% 22%, rgba(226,232,240,0.6), transparent 70%),' +
                                'radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,0.35), transparent 70%),' +
                                'radial-gradient(1.5px 1.5px at 58% 78%, rgba(241,245,249,0.55), transparent 70%),' +
                                'radial-gradient(1px 1px at 90% 82%, rgba(255,255,255,0.35), transparent 70%)',
                            }}
                          />
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-12 w-12 rounded-full bg-gradient-to-br ${selectedUpcoming.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                              >
                                {selectedUpcoming.icon ? (
                                  <selectedUpcoming.icon size={22} className="text-white drop-shadow-sm" />
                                ) : (
                                  selectedUpcoming.thumbLabel
                                )}
                              </div>
                              <h4 className="font-display text-xl text-slate-100">{selectedUpcoming.title}</h4>
                            </div>
                            <p className="text-sm text-slate-300/90 leading-relaxed">
                              {selectedUpcoming.description}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                type="button"
                                onClick={handleEnterUpcoming}
                                className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                              >
                                {selectedUpcoming.action}
                              </Button>
                              <button
                                type="button"
                                onClick={handleReturnToUpcomingList}
                                className="rounded-lg border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-300 hover:text-white hover:border-purple-300/40 transition"
                              >
                                Cerrar puerta
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {upcomingMiniverses.map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => handleSelectUpcoming(card)}
                              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left flex items-center gap-4 transition hover:border-purple-300/40 hover:bg-white/5"
                            >
                              <div
                                className={`h-12 w-12 rounded-full bg-gradient-to-br ${card.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                              >
                                {card.icon ? (
                                  <card.icon size={22} className="text-white drop-shadow-sm" />
                                ) : (
                                  card.thumbLabel
                                )}
                              </div>
                              <h4 className="font-display text-lg text-slate-100">{card.title}</h4>
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">Nombre completo *</label>
                      <input
                        name="fullName"
                        type="text"
                        required
                        value={formState.fullName}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">Correo electrónico *</label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formState.email}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="nombre@correo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">Mensaje opcional</label>
                      <textarea
                        name="message"
                        rows={3}
                        value={formState.message}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                        placeholder="Comparte qué miniverso te emociona más o si traes alguna propuesta."
                      />
                    </div>

                    {status === 'error' ? (
                      <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                      </div>
                    ) : null}
                    {status === 'success' ? (
                      <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Quedas en lista para las próximas experiencias. Llegará un correo con la primera pista.
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                    >
                      {status === 'loading' ? 'Guardando…' : 'Quiero apoyar este miniverso'}
                    </Button>
                  </form>
                </>
              ) : selectedMiniverse ? (
                <div className="md:col-span-2">
                  <div className="glass-effect relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 space-y-6">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-65 mix-blend-screen"
                      style={{
                        backgroundImage:
                          'radial-gradient(1px 1px at 6% 10%, rgba(248,250,252,0.9), transparent 65%),' +
                          'radial-gradient(1.5px 1.5px at 10% 28%, rgba(241,245,249,0.75), transparent 70%),' +
                          'radial-gradient(2px 2px at 14% 46%, rgba(226,232,240,0.7), transparent 70%),' +
                          'radial-gradient(1px 1px at 18% 72%, rgba(255,255,255,0.55), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 22% 18%, rgba(241,245,249,0.7), transparent 70%),' +
                          'radial-gradient(2px 2px at 28% 36%, rgba(226,232,240,0.7), transparent 70%),' +
                          'radial-gradient(1px 1px at 32% 60%, rgba(255,255,255,0.55), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 36% 82%, rgba(241,245,249,0.65), transparent 70%),' +
                          'radial-gradient(2px 2px at 40% 22%, rgba(226,232,240,0.7), transparent 70%),' +
                          'radial-gradient(1px 1px at 44% 44%, rgba(255,255,255,0.55), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 48% 68%, rgba(241,245,249,0.7), transparent 70%),' +
                          'radial-gradient(2px 2px at 52% 30%, rgba(226,232,240,0.7), transparent 70%),' +
                          'radial-gradient(1px 1px at 56% 54%, rgba(255,255,255,0.5), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 60% 12%, rgba(241,245,249,0.7), transparent 70%),' +
                          'radial-gradient(2px 2px at 64% 40%, rgba(226,232,240,0.7), transparent 100%),' +
                          'radial-gradient(1px 1px at 68% 76%, rgba(255,255,255,0.5), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 72% 24%, rgba(241,245,249,0.7), transparent 70%),' +
                          'radial-gradient(2px 2px at 76% 58%, rgba(226,232,240,0.7), transparent 50%),' +
                          'radial-gradient(1px 1px at 80% 14%, rgba(255,255,255,0.5), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 84% 38%, rgba(241,245,249,0.65), transparent 70%),' +
                          'radial-gradient(2px 2px at 88% 66%, rgba(226,232,240,0.7), transparent 70%),' +
                          'radial-gradient(1px 1px at 92% 22%, rgba(255,255,255,0.5), transparent 70%),' +
                          'radial-gradient(1.5px 1.5px at 94% 48%, rgba(241,245,249,0.65), transparent 70%),' +
                          'radial-gradient(2px 2px at 96% 80%, rgba(226,232,240,0.7), transparent 70%)',
                        filter: 'brightness(1.15)',
                      }}
                    />
                    <div className="relative z-10 space-y-6">
             
                      <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-full bg-gradient-to-br ${selectedMiniverse.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                      >
                        {selectedMiniverse.icon ? (
                          <selectedMiniverse.icon size={22} className="text-white drop-shadow-sm" />
                        ) : (
                          selectedMiniverse.thumbLabel
                        )}
                      </div>
                        <h3 className="font-display text-2xl text-slate-100">{selectedMiniverse.title}</h3>
                      </div>

                    <p className="text-sm text-slate-300/90 leading-relaxed">
                      {selectedMiniverse.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={handleEnterMiniverse}
                        className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover-glow"
                      >
                        {selectedMiniverse.action}
                      </Button>
                      <button
                        type="button"
                        onClick={handleReturnToList}
                        className="rounded-lg border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-300 hover:text-white hover:border-purple-300/40 transition"
                      >
                        Tocar otra puerta
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 grid md:grid-cols-3 gap-6">
                  {MINIVERSE_CARDS.map((card) => {
                    const isUpcoming = Boolean(card.isUpcoming);
                    const isVisited = !isUpcoming && Boolean(visitedMiniverses[card.id]);
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => handleSelectCard(card)}
                        disabled={isUpcoming}
                        className={`relative text-left glass-effect rounded-2xl border p-5 transition flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isUpcoming
                            ? 'border-white/10 bg-white/5'
                            : isVisited
                              ? 'border-emerald-300/20 bg-emerald-500/5 hover:border-emerald-300/30'
                              : 'border-white/10 bg-white/5 hover:border-purple-300/40 hover:shadow-[0_10px_30px_rgba(124,58,237,0.18)]'
                        }`}
                      >
                        {isUpcoming ? (
                          <>
                            <div className="h-12 w-12 rounded-full border border-white/10 bg-slate-800/60 flex items-center justify-center text-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                              {card.icon ? <card.icon size={22} className="text-slate-200/80" /> : card.thumbLabel}
                            </div>
                            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                              Próximamente
                            </span>
                          </>
                        ) : null}
                        {isVisited ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-300/60"
                          />
                        ) : null}
                        {!isUpcoming ? (
                          <>
                            <div
                              className={`h-12 w-12 rounded-full bg-gradient-to-br ${card.thumbGradient} flex items-center justify-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
                            >
                              {card.icon ? <card.icon size={22} className="text-white drop-shadow-sm" /> : card.thumbLabel}
                            </div>
                        <h3 className="font-display text-lg text-slate-100">{card.titleShort ?? card.title}</h3>
                          </>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>{activeTabLabel}</span>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition">
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MiniverseModal;
