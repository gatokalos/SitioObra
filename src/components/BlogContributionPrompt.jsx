import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContributionModal from '@/components/ContributionModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const BLOG_ONBOARDING_KEY = 'gatoencerrado-blog-onboarding';

const BlogContributionPrompt = () => {
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const onboardingStoredRef = useRef(false);

  const { user } = useAuth();
  const isLoggedIn = Boolean(user?.email);

  const contributionButtonClassName = cn(
    'text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover-glow transition mx-auto',
    isLoggedIn
      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-400/90 hover:to-emerald-500/90 shadow-[0_0_35px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/30'
      : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-600 hover:to-indigo-600'
  );

  const handleOpenContribution = useCallback(() => {
    setIsContributionOpen(true);
    setShowOnboardingHint(false);
    onboardingStoredRef.current = true;
    safeSetItem(BLOG_ONBOARDING_KEY, 'seen');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || onboardingStoredRef.current) {
      return;
    }
    const seen = safeGetItem(BLOG_ONBOARDING_KEY);
    if (seen === 'seen') {
      setShowOnboardingHint(false);
      onboardingStoredRef.current = true;
      return;
    }
    setShowOnboardingHint(true);
    const timeout = setTimeout(() => {
      setShowOnboardingHint(false);
      safeSetItem(BLOG_ONBOARDING_KEY, 'seen');
      onboardingStoredRef.current = true;
    }, 6000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleResumeContribution = () => {
      setIsContributionOpen(true);
    };
    window.addEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    return () => {
      window.removeEventListener('gatoencerrado:resume-contribution', handleResumeContribution);
    };
  }, []);

  return (
    <>
      <section id="blog-contribuye" className="py-24 relative min-h-[700px]">
        <div className="section-divider mb-24"></div>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="relative glass-effect rounded-2xl p-8 md:p-12 text-center overflow-hidden"
          >
            {/* HALO VIOLETA DELICADO (DETRÁS) */}
            <div
              aria-hidden="true"
              className="
                absolute inset-0
                pointer-events-none
                flex items-center justify-center
                z-0
              "
            >
              <motion.div
                initial={{ opacity: 0.35, scale: 0.9 }}
                animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="
                  w-[85%] h-[85%]
                  md:w-[70%] md:h-[70%]
                  rounded-full
                  bg-purple-600/30
                  blur-[100px]
                "
              />
            </div>

           {/* CONTENIDO */}
<div className="relative z-10">
  <h3 className="font-display text-3xl font-medium text-slate-100 mb-6 text-center">
    INTERMEDIO
  </h3>

  <p className="text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light whitespace-pre-line text-center">
    {`No todo se entiende a la primera. 
    Y no pasa nada. 
    
    Este universo no se recorre en línea recta. Se avanza, se duda, se vuelve atrás. 
    
    En #GatoEncerrado la confusión no es un error: es parte del viaje.
    
    `}

    <span className="block mt-4 text-sm text-slate-150/0 italic">
      (Y a veces basta con dejar que la mente vuelva a su estado silvestre.)
    </span>
  </p>

  {/* BOTÓN DIVIDIDO */}
  <div className="flex flex-col items-center">
    <div className="inline-flex rounded-full overflow-hidden shadow-lg border border-slate-600/50 backdrop-blur-sm">
      {/* Mitad izquierda: continuar */}
      <button
        onClick={() => {
          document.querySelector('#provoca')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }}
        className="px-6 py-3 text-sm sm:text-base font-medium text-slate-100 bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:opacity-90 transition-all duration-300"
      >
        Continuar
      </button>

      {/* Mitad derecha: contactar */}
      <button
        onClick={() => {
          document.querySelector('#contact')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }}
        className="px-6 py-3 text-sm sm:text-base font-medium text-slate-100 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 transition-all duration-300"
      >
        Preguntar
      </button>
    </div>
  </div>
</div>
          </motion.div>
        </div>
      </section>
      <ContributionModal open={isContributionOpen} onClose={() => setIsContributionOpen(false)} />
    </>
  );
};

export default BlogContributionPrompt;
