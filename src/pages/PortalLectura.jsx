import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, PenLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AutoficcionPreviewOverlay from '@/components/novela/AutoficcionPreviewOverlay';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginOverlay from '@/components/ContributionModal/LoginOverlay';
import PortalAuthButton from '@/components/PortalAuthButton';

const PortalLectura = () => {
  const { user } = useAuth();
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showAutoficcionPreview, setShowAutoficcionPreview] = useState(false);
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
    setShowLoginOverlay(true);
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
              <div className="rounded-xl border border-purple-400/50 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
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
          <p className="text-xs uppercase tracking-[0.45em] text-purple-300">Portal de lectura</p>
          <h1 className="font-display text-3xl md:text-4xl text-white">Es un gato encerrado</h1>
          <p className="text-slate-300/85 leading-relaxed">
            Este QR abre el universo de lectura. Si tienes el libro a la mano, toma una foto del texto y
            te llevamos directo al fragmento correspondiente.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-200">
                <Camera size={18} />
              </span>
              <p className="text-sm uppercase tracking-[0.35em] text-purple-200">Principal</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl text-white">Escanear mi página</h3>
              <p className="text-sm text-slate-300/85">
                Toma una foto del texto y te llevamos directo al fragmento correspondiente.
              </p>
            </div>
            <Button
              className="w-full justify-center"
              onClick={() => {
                if (!requireAuth()) return;
              }}
            >
              Escanear página
            </Button>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Solo una foto. No guardamos imágenes.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200">
                <Sparkles size={18} />
              </span>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Abierto</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl text-white">Explorar fragmentos públicos</h3>
              <p className="text-sm text-slate-300/85">
                Accede a una selección abierta de pasajes para probar la experiencia.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                if (!requireAuth()) return;
                setShowAutoficcionPreview(true);
              }}
            >
              Ver fragmentos
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200">
                <PenLine size={18} />
              </span>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Rápido</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl text-white">Reflexionar sin foto</h3>
              <p className="text-sm text-slate-300/85">
                Elige un tema o escribe una pregunta y recibe una guía de reflexión.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                if (!requireAuth()) return;
              }}
            >
              Empezar reflexión
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-purple-200">Marca tu lectura</p>
            <p className="text-sm text-slate-300/85">
              Guarda este dispositivo como lector activo y vuelve cuando quieras.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-purple-400/40 text-purple-200 hover:bg-purple-500/10"
            onClick={() => {
              if (!requireAuth()) return;
            }}
          >
            Activar en este dispositivo
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          Este portal es público. Si tienes el libro físico, el escaneo de página te da acceso directo al fragmento
          correcto.
        </p>
      </div>
      {showLoginOverlay ? <LoginOverlay onClose={handleCloseLogin} /> : null}
      <AutoficcionPreviewOverlay
        open={showAutoficcionPreview}
        onClose={() => setShowAutoficcionPreview(false)}
      />
    </div>
  </div>
  );
};

export default PortalLectura;
