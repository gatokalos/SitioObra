import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';

const PortalArtesanias = () => {
  const { user } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const isAuthenticated = Boolean(user);

  const handleOpenLogin = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginOverlay(true);
    }
  }, [isAuthenticated]);

  const handleCloseLogin = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginHint(true);
    window.setTimeout(() => setShowLoginHint(false), 2200);
    return false;
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <PortalAuthButton onOpenLogin={handleOpenLogin} />
            {showLoginHint ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 shadow-[0_10px_30px_rgba(251,191,36,0.2)]">
                Inicia sesión para continuar. Usa el botón de arriba.
              </div>
            ) : null}
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={12} />
            Volver al sitio
          </Link>
        </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-10 shadow-[0_35px_120px_rgba(0,0,0,0.65)] space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-amber-200">
            Objetos del universo #GatoEncerrado
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-white">Tu objeto también habla</h1>
          <p className="text-slate-300/85 leading-relaxed">
            Este portal es el acceso a la pieza que tienes en tus manos. Aquí la obra se extiende fuera del teatro.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/40 bg-amber-500/10 text-amber-200">
              <Sparkles size={18} />
            </span>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Revela tu frase</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl text-white">Revela la frase de tu objeto</h3>
            <p className="text-sm text-slate-300/85">
              Cada taza y cada portavasos guarda una frase. Escanea tu objeto para descubrirla.
            </p>
          </div>
          <Button
            className="w-full justify-center"
            onClick={() => {
              if (!requireAuth()) return;
            }}
          >
            Revelar mi frase
          </Button>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
            Solo una acción. No guardamos imágenes.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200">
              <MessageCircle size={18} />
            </span>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Algo más</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl text-white">¿Quieres conversar con la frase?</h3>
            <p className="text-sm text-slate-300/85">
              Una vez revelada, puedes abrir un chat para dialogar con la obra desde esa frase.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => {
              if (!requireAuth()) return;
            }}
          >
            Chatear con mi frase
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
            <h3 className="font-display text-lg text-white">Explorar objetos disponibles</h3>
            <p className="text-sm text-slate-300/85">
              Ver catálogo de piezas, combos y ediciones.
            </p>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                if (!requireAuth()) return;
              }}
            >
              Ver catálogo
            </Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
            <h3 className="font-display text-lg text-white">Apartar o comprar</h3>
            <p className="text-sm text-slate-300/85">
              Reserva tu objeto o compra ahora.
            </p>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                if (!requireAuth()) return;
              }}
            >
              Apartar
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-slate-300/85">
            Este objeto no es souvenir. Es una puerta. Cada conversación lo activa.
          </p>
        </div>
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
    </div>
  </div>
  );
};

export default PortalArtesanias;
