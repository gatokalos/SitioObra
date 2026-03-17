import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, DoorOpen, ShoppingBag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPortalLaunchState } from '@/lib/portalNavigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safeStorage';

const LOGIN_RETURN_KEY = 'gatoencerrado:login-return';
const AUTHENTICATED_HERO_URL = '/?heroTab=experiences#hero';

const SHOW_HISTORY = [
  {
    id: 'camafeo',
    label: 'Camafeo · May',
    title: 'Teatro Camafeo',
    dateLabel: 'Temporada · mayo',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/cedes/camafeo_mayo.jpg',
    description: [
      'Aquí comenzó la temporada escénica de Es un gato encerrado.',
      'Camafeo fue el espacio que hizo posible el montaje, las primeras funciones abiertas y privadas, y el encuentro directo con el público.',
      'La obra tomó forma aquí.',
    ],
  },
  {
    id: 'cecut',
    label: 'CECUT · Dic',
    title: 'Centro Cultural Tijuana',
    dateLabel: 'Presentación · diciembre',
    image: 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/cedes/Cecut_diciembre.JPG',
    description: [
      'En diciembre, la obra tuvo una función especial en un momento inédito: por primera vez, en más de 25 años del CECUT, se presentó teatro durante la última semana del año.',
      'La obra cerró el 2025 en escena.',
      'La conversación sigue abierta.',
    ],
  },
];

const NextShow = () => {
  const [activeShowId, setActiveShowId] = useState('cecut');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.id);
  const activeShow = useMemo(
    () => SHOW_HISTORY.find((show) => show.id === activeShowId) ?? SHOW_HISTORY[0],
    [activeShowId]
  );

  const handleOpenReserve = useCallback(() => {
    navigate('/portal-encuentros', {
      state: createPortalLaunchState(location, 'next-show-encuentros'),
    });
  }, [location, navigate]);

  const handleOpenAuthenticatedHero = useCallback(() => {
    navigate(AUTHENTICATED_HERO_URL, { replace: true });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [navigate]);

  const handlePrimaryAction = useCallback(() => {
    if (isLoggedIn) {
      handleOpenAuthenticatedHero();
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    safeSetItem(
      LOGIN_RETURN_KEY,
      JSON.stringify({
        anchor: '#next-show',
        action: 'next-show-login',
        source: 'next-show',
      })
    );
    window.dispatchEvent(new CustomEvent('open-login-modal'));
  }, [handleOpenAuthenticatedHero, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') {
      return;
    }
    const pending = safeGetItem(LOGIN_RETURN_KEY);
    if (!pending) {
      return;
    }
    try {
      const parsed = JSON.parse(pending);
      const isNextShowLoginFlow =
        parsed?.anchor === '#next-show' && parsed?.action === 'next-show-login';
      if (!isNextShowLoginFlow) {
        return;
      }
      safeRemoveItem(LOGIN_RETURN_KEY);
      window.setTimeout(() => {
        handleOpenAuthenticatedHero();
      }, 120);
    } catch {
      safeRemoveItem(LOGIN_RETURN_KEY);
    }
  }, [handleOpenAuthenticatedHero, isLoggedIn]);

  return (
    <>
      <section id="next-show" className="py-24 relative min-h-[760px] md:min-h-[820px]">
        <div className="section-divider mb-24"></div>

        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden min-h-[520px] md:min-h-[560px]"
          >
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-medium mb-4 text-gradient italic">
                Memoria en escena
              </h2>
              <p className="text-sm text-slate-400/80 mb-8">
                Funciones que sostuvieron la obra y la conversación.
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {SHOW_HISTORY.map((show) => (
                  <button
                    key={show.id}
                    type="button"
                    onClick={() => setActiveShowId(show.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      activeShowId === show.id
                        ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                        : 'border-white/10 text-slate-300 hover:border-purple-300/40 hover:text-purple-100'
                    }`}
                  >
                    {show.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeShow.id}-image`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl bg-black/40">
                      <img
                        src={activeShow.image}
                        alt={activeShow.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        width={1200}
                        height={900}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeShow.id}-copy`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <h3 className="font-display text-2xl text-slate-100">{activeShow.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-300/80">
                      <Calendar size={18} className="text-purple-300" />
                      <span className="uppercase tracking-[0.25em]">{activeShow.dateLabel}</span>
                    </div>
                    <div className="text-base text-slate-300/80 leading-relaxed space-y-3">
                      {activeShow.description.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center items-center">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={handlePrimaryAction}
                    className="bg-gradient-to-r from-orange-500/90 via-rose-500/90 to-pink-500/90 hover:from-orange-400 hover:to-pink-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/40 transition"
                  >
                    <DoorOpen size={20} />
                    {isLoggedIn ? 'Entrar al otro lado' : 'Entrar al otro lado'}
                  </Button>
                  <p className="text-xs text-slate-400/80">
                    {isLoggedIn
                      ? '"Tu sesión ya abrió la siguiente capa"'
                      : '"El final abre otra puerta"'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleOpenReserve}
                    className="border-slate-100/30 text-slate-200 hover:bg-white/5 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                  >
                    <ShoppingBag size={20} />
                    Merch
                  </Button>
                  <p className="text-xs text-slate-400/80">"Crea un nuevo recuerdo"</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default NextShow;
