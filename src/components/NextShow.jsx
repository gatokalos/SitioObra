import React, { useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import useScrambleText from '@/hooks/useScrambleText';

// El aplauso (antes Caída del telón; Carlos, 23 nov 2026): la tercera escena
// del recorrido corto, de la misma familia que Tercera llamada y «Hacemos una
// pausa…» (emblema en el eje de la orbe, título, poco texto y el botón como
// ancla). Cada botón abre algo ahí mismo:
// - «Visitar archivo» revela la obra fundacional (con las temporadas como
//   última tarjeta) y sus créditos, y baja a ella;
// - «Antes de irte» revela la taquilla.
// El título y el copy son de Carlos; el nombre puede cambiar. El emblema,
// «El anillo que vuelve al punto», contiene a la vez despedida y origen.
// Conserva el id #next-show para los enlaces del Programa de mano.
const TITLE_FIRST_LINE = 'El aplauso…';
const TITLE_SECOND_LINE = 'decirnos adiós';
const TITLE = `${TITLE_FIRST_LINE} ${TITLE_SECOND_LINE}`;

const NextShow = () => {
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.8 });
  const titleDisplay = useScrambleText(TITLE, { active: isTitleInView, hashAccents: true });

  const handleVisitarArchivo = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-obra-destacada'));
    window.setTimeout(() => {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  // "Antes de irte" revela únicamente su propia sección. No requiere sesión:
  // es descubrimiento, no autenticación.
  const handleOpenSystemPreview = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('gatoencerrado:reveal-before-leaving'));
    window.setTimeout(() => {
      document.getElementById('conoce-sistema')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  return (
    <section id="next-show" className="narrative-transition-section desktop-viewport-scene py-24 relative min-h-[700px]">
      <div className="narrative-transition-divider section-divider mb-24"></div>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="narrative-transition-card relative overflow-visible p-8 text-center md:p-12"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          >
            <motion.div
              initial={{ opacity: 0.35, scale: 0.9 }}
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[85%] h-[85%] md:w-[70%] md:h-[70%] rounded-full bg-purple-600/30 blur-[100px]"
            />
          </div>

          <div className="narrative-transition-content relative z-10">
            <img
              src="/assets/AplausoLogo.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="narrative-section-logo mx-auto mb-5 object-contain"
            />
            <h3 ref={titleRef} aria-label={TITLE} className="narrative-transition-title relative font-display text-3xl font-medium text-slate-100 mb-6 text-center">
              <span aria-hidden="true" className="invisible">{TITLE_FIRST_LINE}<br />{TITLE_SECOND_LINE}</span>
              <span aria-hidden="true" className="titulo-perlado absolute inset-0">
                {titleDisplay.slice(0, TITLE_FIRST_LINE.length)}<br />{titleDisplay.slice(TITLE_FIRST_LINE.length + 1)}
              </span>
            </h3>

            <div className="narrative-transition-copy text-slate-300/80 leading-relaxed mb-8 max-w-2xl mx-auto font-light text-center space-y-4">
              <p>Durante mucho tiempo pensé que el escenario era el destino. Después entendí que también podía ser el punto de partida.</p>
              <p>Este espacio conserva fragmentos de la puesta en escena que <strong>dio origen</strong> a este universo.</p>
            </div>

            <div className="narrative-transition-cta flex flex-row flex-wrap items-center justify-center gap-4">
              <Button
                type="button"
                onClick={handleVisitarArchivo}
                className="ge-chip-action ge-mobile-cta-width ge-chip-action--primary"
              >
                Visitar archivo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenSystemPreview}
                className="ge-chip-action ge-mobile-cta-width ge-chip-action--secondary"
              >
                Antes de irte
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NextShow;
