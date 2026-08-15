import React, { useState } from 'react';
import { ChevronDown, Cpu, MessageCircle, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const IAInsightCard = ({
  title = 'Incluye dispositivo interactivo',
  type,
  interaction,
  tokensRange,
  coverage,
  compact = false,
  rewardLabel,
  minRequired,
  // Modo "viajar" (cuaderno holográfico): cuando travelRequiredGat viene
  // definido, aparece un botón salvaguarda — anónimo → pide autenticarse;
  // autenticado con balance suficiente → onTravel(); autenticado sin balance
  // → avisa y no deja entrar a un universo nuevo. No descuenta nada: el
  // único lugar donde se gasta GAT de verdad es dentro de cada artefacto
  // transmedia. Sin travelRequiredGat, la tarjeta no muestra ningún botón.
  travelRequiredGat,
  travelLabel = 'Viajar al universo',
  onTravel,
  // Variante compacta para el Libreto: conserva exactamente la protección de
  // autenticación/GAT del modo viajar, pero elimina el acordeón informativo.
  travelCtaOnly = false,
  // Algunas páginas (p. ej. /bitacora) no montan Header.jsx, así que el
  // evento global 'open-login-modal' no tiene quién lo escuche ahí. Si el
  // padre puede darnos un callback real (su propio LoginOverlay), se usa
  // ese; si no, cae al evento global (funciona en el flujo normal de
  // Transmedia.jsx, donde Header.jsx sí está montado).
  onRequireLogin,
  // Modo controlado opcional: si el padre pasa isOpen/onToggle (p. ej. para
  // coordinarlo con otro acordeón, que solo uno esté abierto a la vez), se
  // usa ese estado en vez del interno. Sin estas props se comporta igual
  // que siempre (estado propio).
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalIsOpen, setInternalIsOpen] = useState(!compact);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const toggleOpen = onToggle ?? (() => setInternalIsOpen((prev) => !prev));
  const isTravelMode = typeof travelRequiredGat === 'number';
  const hasBody = type || interaction || tokensRange || coverage || rewardLabel || minRequired;

  const getLocalBalance = () => {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage?.getItem('gatoencerrado:gatokens-available');
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleTravelClick = () => {
    if (!user) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        window.dispatchEvent(new CustomEvent('open-login-modal'));
      }
      return;
    }
    const balance = getLocalBalance();
    if (balance >= travelRequiredGat) {
      onTravel?.();
      return;
    }
    toast({
      description: `Todavía no te alcanza para otro universo (necesitas ${travelRequiredGat} GAT). Sigue donde ya tienes progreso.`,
    });
  };

  if (travelCtaOnly && isTravelMode) {
    return (
      <button
        type="button"
        onClick={handleTravelClick}
        className="group flex w-full items-center justify-between gap-4 rounded-xl border border-purple-700/35 bg-purple-950/30 px-5 py-4 text-left text-purple-100 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.4)] transition hover:border-purple-500/55 hover:bg-purple-900/35"
      >
        <span>
          <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-purple-200/55">
            Continuar el recorrido
          </span>
          <span className="mt-1 block font-display text-lg text-purple-100">
            {travelLabel}
          </span>
        </span>
        <Send size={18} className="shrink-0 text-purple-200/75 transition-transform group-hover:translate-x-1" />
      </button>
    );
  }

  if (!hasBody) {
    return null;
  }

  return (
    <div className="rounded-xl border border-purple-700/30 bg-purple-950/25 p-5 text-sm text-purple-100 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-200" />
          <h4 className="text-base font-semibold text-purple-200">{title}</h4>
        </div>
        <ChevronDown
          size={18}
          className={`text-purple-200 transition ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-2 text-purple-100/90">
          {type ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Cpu size={16} className="mt-0.5 text-purple-200" />
              <p>
                <strong>Tipo de IA:</strong> {type}
              </p>
            </div>
          ) : null}
          {interaction ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <MessageCircle size={16} className="mt-0.5 text-purple-200" />
              <div>
        <strong>Interacción esperada:</strong>{' '}
        <span>{interaction}</span>
      </div>
            </div>
          ) : null}
          {tokensRange ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Sparkles size={16} className="mt-0.5 text-amber-200" />
              <div className="flex items-start gap-2">
  <Sparkles size={16} />
  <div>
    <strong>Tokens estimados:</strong>{' '}
    <span>{tokensRange}</span>
  </div>
</div>
            </div>
          ) : null}
          {coverage ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <ShieldCheck size={16} className="mt-0.5 text-emerald-200" />
              <div>
              <strong>Costos cubiertos:</strong>{' '}
              <span>{coverage}</span>
            </div>
            </div>
          ) : null}

          {rewardLabel ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <Sparkles size={16} className="mt-0.5 text-amber-200 shrink-0" />
              <p>
                <strong>Energía del mini-verso:</strong> {rewardLabel}
              </p>
            </div>
          ) : null}
          {minRequired ? (
            <div className="flex items-start gap-2 leading-relaxed">
              <ShieldCheck size={16} className="mt-0.5 text-purple-200 shrink-0" />
              <p>
                <strong>Mínima requerida:</strong> {minRequired}
              </p>
            </div>
          ) : null}

          {isTravelMode ? (
            <div className="pt-3">
              <button
                type="button"
                onClick={handleTravelClick}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500/90 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              >
                <Send size={16} />
                {travelLabel}
              </button>
              {!user ? (
                <p className="mt-2 text-xs text-amber-200">Necesitas iniciar sesión para continuar.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default IAInsightCard;
