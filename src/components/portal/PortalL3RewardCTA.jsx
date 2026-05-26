import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  createTransmediaIdempotencyKey,
  registerTransmediaCreditEvent,
} from '@/services/transmediaCreditsService';

const PORTAL_KEY_TO_ROUTE = {
  obra:        '/portal-voz',
  literatura:  '/portal-literatura',
  artesanias:  '/portal-artesanias',
  grafico:     '/portal-graficos',
  cine:        '/portal-cine',
  sonoridades: '/portal-sonoridades',
  movimiento:  '/portal-movimiento',
  juegos:      '/portal-juegos',
  oraculo:     '/portal-oraculo',
};

const PortalL3RewardCTA = ({ portal, l3Rec }) => {
  const navigate = useNavigate();
  const [showCoins, setShowCoins] = useState(false);
  const [showChip, setShowChip] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const recommendedPortal = l3Rec?.recommended_portal;
  const forma = l3Rec?.forma;
  const nextRoute = recommendedPortal ? PORTAL_KEY_TO_ROUTE[recommendedPortal] : null;

  const handleClaim = useCallback(async () => {
    if (claimed) return;
    setClaimed(true);
    setShowCoins(true);
    setTimeout(() => setShowCoins(false), 1400);
    setShowChip(true);
    setTimeout(() => setShowChip(false), 2500);

    try {
      const { state } = await registerTransmediaCreditEvent({
        eventKey: `resonance:l3-reward:${portal}`,
        amount: 175,
        oncePerIdentity: true,
        metadata: { portal, recommended: recommendedPortal },
        idempotencyKey: createTransmediaIdempotencyKey(`resonance:l3-reward:${portal}`),
      });
      if (state && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gatoencerrado:external-credit-event', { detail: { state } }));
      }
    } catch (err) {
      console.error('[PortalL3RewardCTA] Error al otorgar GAT:', err);
      setClaimed(false);
    }

    if (nextRoute) {
      setTimeout(() => navigate(nextRoute, { state: { showGatTransferChip: true } }), 900);
    }
  }, [claimed, portal, recommendedPortal, nextRoute, navigate]);

  if (!l3Rec?.step3) return null;

  return (
    <div className="relative pt-1">
      <AnimatePresence>
        {showChip && (
          <motion.span
            key="l3-chip"
            className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-amber-200 whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            +175 GAT transferidos
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleClaim}
        className="relative overflow-hidden w-full rounded-2xl border border-yellow-400/50 bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-yellow-500/15 px-6 py-4 text-sm font-semibold tracking-wide text-yellow-200 shadow-[0_0_24px_rgba(234,179,8,0.18)] transition hover:border-yellow-400/70 hover:bg-yellow-500/20 active:scale-[0.98]"
      >
        <span className="flex items-center justify-center gap-2.5">
          <span className="text-base">🪙</span>
          <span>+175 GAT · Siguiente miniverso{forma ? `: ${forma}` : ''}</span>
        </span>
        {showCoins && (
          <span className="pointer-events-none absolute inset-0">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const dist = 52 + i * 6;
              return (
                <motion.span
                  key={`l3-coin-${i}`}
                  className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                  initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.1, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: i * 0.025 }}
                />
              );
            })}
          </span>
        )}
      </button>
    </div>
  );
};

export default PortalL3RewardCTA;
