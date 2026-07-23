import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { showcaseDefinitions } from '@/components/transmedia/transmediaConstants';
import { resolvePortalRoute } from '@/lib/miniversePortalRegistry';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

const PENDING_KEY = 'gatoencerrado:pending-vitrana-id';
const GAT_KEY = 'gatoencerrado:gatokens-available';
const GAT_GIFT = 100;

const VITRANA_QUESTION = {
  miniversos:          '¿Qué significa para ti habitar una emoción delante de otros?',
  miniversoSonoro:     '¿Por qué algunos sonidos duran más que las imágenes?',
  miniversoGrafico:    '¿Qué te ocurre cuando alguien más interpreta tu apariencia?',
  miniversoMovimiento: '¿Qué cosas sabe tu cuerpo antes que tu pensamiento?',
  apps:                '¿Qué cambia en ti cuando una historia depende de tus decisiones?',
  copycats:            '¿Qué significa para ti verse fallar desde afuera?',
  lataza:              '¿Cuándo un objeto deja de ser para ti solo un objeto?',
  miniversoNovela:     '¿Qué cambia en ti cuando una experiencia personal se convierte en relato?',
  cine:                '¿Qué significa para ti verse fallar desde afuera?',
  oraculo:             '¿Cuándo una experiencia deja de sentirse individual?',
};

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.22, ease: 'easeIn' } },
};

const grantWelcomeGAT = () => {
  try {
    const current = Number.parseInt(safeGetItem(GAT_KEY) ?? '0', 10);
    const next = (Number.isFinite(current) ? current : 0) + GAT_GIFT;
    safeSetItem(GAT_KEY, String(next));
  } catch {}
};

const PortalInviteModal = ({ open, onClose, vitranaId }) => {
  const navigate = useNavigate();
  const definition = vitranaId ? (showcaseDefinitions[vitranaId] ?? null) : null;
  const question = vitranaId ? (VITRANA_QUESTION[vitranaId] ?? null) : null;
  const portalRoute = vitranaId ? resolvePortalRoute({ formatId: vitranaId }) : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && vitranaId) grantWelcomeGAT();
  }, [open, vitranaId]);

  const handleOpenPortal = () => {
    onClose?.();
    if (portalRoute) navigate(portalRoute);
  };

  return (
    <AnimatePresence>
      {open && definition ? (
        <motion.div
          className="fixed inset-0 z-[600] flex items-center justify-center px-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-[#04020f]/88 backdrop-blur-[18px]"
            variants={backdropVariants}
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-invite-title"
            variants={panelVariants}
            className="relative z-10 w-full max-w-sm rounded-[28px] border border-violet-400/20 bg-gradient-to-b from-[#120826]/90 via-[#0d061f]/90 to-[#070312]/90 px-7 py-8 shadow-[0_32px_80px_rgba(0,0,0,0.75)] backdrop-blur-[24px]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-40 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)' }}
            />

            <div className="mb-4 flex justify-center">
              <img
                src="https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/oraculo/gato-moneda.png"
                alt="GAToken"
                className="h-16 w-16 animate-[spin_8s_linear_infinite] drop-shadow-[0_0_18px_rgba(139,92,246,0.55)]"
              />
            </div>

            <p className="mb-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-violet-300/60">
              Tu portal te espera
            </p>
            <h2
              id="portal-invite-title"
              className="mb-3 text-center text-xl font-semibold leading-snug text-white"
            >
              {definition.label || definition.title || 'Portal'}
            </h2>

            {question ? (
              <p
                className="mb-5 text-center font-display leading-snug question-voice"
                style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.05rem)' }}
              >
                {question}
              </p>
            ) : null}

      
            <p className="mb-6 text-center text-sm leading-relaxed text-slate-400/60">
              Recibe <span className="text-violet-300/80">+{GAT_GIFT} GAT</span> de bienvenida para comenzar tu recorrido por el miniverso.
            </p>

            {portalRoute ? (
              <button
                type="button"
                onClick={handleOpenPortal}
                className="w-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(139,92,246,0.38)] transition-all duration-200 hover:shadow-[0_10px_36px_rgba(139,92,246,0.52)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Abrir {definition.label || definition.title || 'portal'} →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm text-slate-300/70 transition hover:text-slate-200"
              >
                Explorar el sitio
              </button>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export { PENDING_KEY };
export default PortalInviteModal;
