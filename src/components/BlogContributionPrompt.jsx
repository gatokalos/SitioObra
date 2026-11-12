import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import useScrambleText from '@/hooks/useScrambleText';

const BLOG_ONBOARDING_KEY = 'gatoencerrado-blog-onboarding';
const TITLE_FIRST_LINE = 'Hacemos una pausa…';
const TITLE_SECOND_LINE = 'y continuamos';
const TITLE = `${TITLE_FIRST_LINE} ${TITLE_SECOND_LINE}`;

const BlogContributionPrompt = ({ onAskQuestion = null }) => {
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.8 });
  const titleDisplay = useScrambleText(TITLE, { active: isTitleInView, hashAccents: true });
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

  return (
    <>
      <section id="blog-contribuye" className="narrative-transition-section py-24 relative min-h-[700px]">
        <div className="narrative-transition-divider section-divider mb-24"></div>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="narrative-transition-card relative overflow-visible p-8 text-center md:p-12"
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
<div className="narrative-transition-content relative z-10">
  <img
    src="/assets/IntermedioLogo.png"
    alt=""
    aria-hidden="true"
    loading="lazy"
    className="narrative-section-logo mx-auto mb-5 object-contain"
  />
            <h3 ref={titleRef} aria-label={TITLE} className="narrative-transition-title relative font-display text-3xl font-medium text-slate-100 mb-6 text-center">
    <span aria-hidden="true" className="invisible">{TITLE_FIRST_LINE}<br />{TITLE_SECOND_LINE}</span>
    <span aria-hidden="true" className="absolute inset-0">
      {titleDisplay.slice(0, TITLE_FIRST_LINE.length)}<br />{titleDisplay.slice(TITLE_FIRST_LINE.length + 1)}
    </span>
  </h3>

  <p className="narrative-transition-copy text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light text-center">
    <span className="block mt-8">
    <em>¿Qué obra ocurre en ti?</em>
  </span>
  <span className="whitespace-pre-line">
    {`Tal vez no lo sepas todavía.

Si te encuentras en medio de una que aún no tiene pies ni cabeza, 
solo nota si algo de lo que mires aquí se queda moviéndose adentro.`}
  </span>

</p>

  <div className="flex flex-col items-center">
    <Button
      type="button"
      onClick={() => onAskQuestion?.()}
      className="ge-chip-action ge-mobile-cta-width ge-chip-action--primary mx-auto"
    >
      Entra al camerino
    </Button>
  </div>

</div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default BlogContributionPrompt;
