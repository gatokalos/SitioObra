import { useId } from 'react';
import { useLoginEnLaTarjeta } from '@/hooks/useLoginEnLaTarjeta';

// El login en el dorso de una tarjeta bloqueada de la galería, en escritorio
// (Carlos, 14 nov 2026). Antes, «Quiero cambiar de verso» abría la ventana de
// login encima de todo y «se rompe la promesa de las galerías»: la tarjeta
// gira y el acceso ocurre ahí mismo, «también con su tigre». El texto es el de
// la ventana de login (LoginOverlay.jsx); arriba va el nombre de la forma a la
// que se quiere entrar. En teléfono sigue la ventana de siempre.
const TIGRE_URL = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch/loggin_tiger.jpg';
const DEGRADADO_DEL_BOTON =
  'linear-gradient(90deg, rgba(158,92,255,0.9) 0%, rgba(197,77,150,0.88) 28%, rgba(255,120,33,0.94) 72%, rgba(255,87,24,0.9) 100%)';

const DorsoLogin = ({ formaTitle, onVolver, onEntrar, onAntesDeSalir }) => {
  const login = useLoginEnLaTarjeta({ onEntrar, onAntesDeSalir });
  const uid = useId();
  const idCorreo = `${uid}-correo`;
  const idCodigo = `${uid}-codigo`;

  return (
    <div
      data-dorso-login
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#09060f] text-left"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(7,4,13,0.12) 0%, rgba(9,5,16,0.8) 40%, rgba(7,4,11,0.97) 78%), url(${TIGRE_URL})`,
          backgroundPosition: 'center top',
          backgroundSize: 'cover',
        }}
      />
      <div className="relative z-10 flex h-full flex-col gap-3 overflow-y-auto p-6">
        {/* Sin la ceja ni «Volver»: el retorno es la X de la esquina
            (BotonDeRetorno, Carlos, 24 nov 2026). */}

        {/* El tigre respira arriba; el acceso, abajo. */}
        <div aria-hidden="true" className="min-h-[5.5rem] flex-1" />

        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.58rem] uppercase tracking-[0.32em] text-white/70 backdrop-blur-md">
            Login
          </span>
          <h3 className="font-display text-[1.75rem] leading-[0.98] tracking-[-0.02em] text-white">
            Para continuar, <br /> hay que cruzar
          </h3>
          <p className="text-sm leading-relaxed text-white/80">
            Aquí seguimos. Y más allá, hay algo nuevo por habitar.
          </p>
        </div>

        {login.step === 'email' ? (
          <form onSubmit={login.sendOtp} className="space-y-2.5">
            <label htmlFor={idCorreo} className="sr-only">Correo electrónico</label>
            <input
              id={idCorreo}
              type="email"
              value={login.email}
              onChange={(e) => login.setEmail(e.target.value)}
              placeholder="nombre@correo.com"
              className="form-surface form-surface--pill w-full px-4 py-2.5 text-base"
              required
              disabled={login.isSubmitting}
            />
            <button
              type="submit"
              disabled={login.isSubmitting}
              className="w-full rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-[0_14px_32px_rgba(255,92,20,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundImage: DEGRADADO_DEL_BOTON }}
            >
              {login.pendingSend ? 'Enviando código...' : 'Pasar al otro lado'}
            </button>
          </form>
        ) : (
          <form onSubmit={login.verifyOtp} className="space-y-2.5">
            <p className="text-xs leading-relaxed text-white/65">
              Enviamos un código de 6 dígitos a{' '}
              <span className="font-semibold text-white/90">{login.submittedEmail}</span>. Escríbelo aquí.
            </p>
            <label htmlFor={idCodigo} className="sr-only">Código de verificación</label>
            <input
              id={idCodigo}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={login.otpCode}
              onChange={(e) => login.setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="form-surface form-surface--pill w-full px-4 py-2.5 text-center text-xl tracking-[0.45em]"
              disabled={login.pendingVerify}
              autoFocus
            />
            <button
              type="submit"
              disabled={login.otpCode.length < 6 || login.pendingVerify}
              className="w-full rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-[0_14px_32px_rgba(255,92,20,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundImage: DEGRADADO_DEL_BOTON }}
            >
              {login.pendingVerify ? 'Verificando...' : 'Confirmar código'}
            </button>
            <button type="button" onClick={login.resend} className="w-full text-center text-xs text-white/50 transition hover:text-white/75">
              ¿No llegó? Reenviar código
            </button>
          </form>
        )}

        {login.feedback ? (
          <div
            className={`rounded-xl border px-3 py-2 text-xs leading-relaxed backdrop-blur-md ${
              login.feedback.type === 'error'
                ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
                : 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100'
            }`}
          >
            {login.feedback.text}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={login.conGoogle}
            disabled={login.isSubmitting}
            className="rounded-full border border-white/18 bg-white/[0.08] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {login.pendingProvider === 'google' ? 'Abriendo…' : 'Entrar con Google'}
          </button>
          <button
            type="button"
            onClick={login.conApple}
            disabled={login.isSubmitting}
            className="rounded-full border border-white/18 bg-white/[0.08] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {login.pendingProvider === 'apple' ? 'Abriendo…' : 'Entrar con Apple'}
          </button>
        </div>

        <p className="text-center text-xs text-white/65">Todo va a estar bien. Nada se pierde.</p>
      </div>
    </div>
  );
};

export default DorsoLogin;
