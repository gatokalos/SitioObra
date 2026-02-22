import React, { useMemo, useState } from 'react';
import { Elements, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/huellaCheckout';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const STRIPE_BRAND_COLOR = '#ff8a3d';
const STRIPE_ACCENT_COLOR = '#ec4899';
const EMBEDDED_HEADER_COPY = 'Deja un impacto tangible.';
const EMBEDDED_LOGO_SRC = '/assets/logoapp.png';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const MockPaymentElement = ({ tab, onTabChange }) => (
  <div className="space-y-3">
    <div className="rounded-xl border border-fuchsia-400/30 bg-slate-950/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="grid grid-cols-2 gap-1">
      {[
        { id: 'tarjeta', label: 'Tarjeta' },
        { id: 'link', label: 'Link' },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={cx(
            'rounded-lg border px-3 py-2 text-sm font-semibold transition',
            'bg-slate-900/40 border-transparent text-slate-300 hover:text-white',
            tab === item.id &&
              'border-fuchsia-300/45 text-white [background:linear-gradient(135deg,rgba(255,138,61,0.35),rgba(236,72,153,0.32))] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_18px_rgba(236,72,153,0.22)]'
          )}
        >
          {item.label}
        </button>
      ))}
      </div>
    </div>

    <div className="rounded-2xl border border-fuchsia-300/25 bg-slate-950/65 p-4 shadow-[0_16px_38px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
      {tab === 'tarjeta' ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-300/85">Numero de tarjeta</span>
            <input
              readOnly
              value=""
              placeholder="4242 4242 4242 4242"
              className="mt-1 w-full rounded-xl border border-fuchsia-200/25 bg-slate-900/55 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/30 focus:border-orange-300/60"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-300/85">Expira</span>
              <input
                readOnly
                value=""
                placeholder="MM / AA"
                className="mt-1 w-full rounded-xl border border-fuchsia-200/25 bg-slate-900/55 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/30 focus:border-orange-300/60"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-300/85">CVC</span>
              <input
                readOnly
                value=""
                placeholder="123"
                className="mt-1 w-full rounded-xl border border-fuchsia-200/25 bg-slate-900/55 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/30 focus:border-orange-300/60"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-200/90">
            Paga con Link usando tu correo para autocompletar tus datos de pago en segundos.
          </p>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-300/85">Correo para Link</span>
            <input
              readOnly
              value=""
              placeholder="tu@email.com"
              className="mt-1 w-full rounded-xl border border-fuchsia-200/25 bg-slate-900/55 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/30 focus:border-orange-300/60"
            />
          </label>
          <p className="text-xs text-slate-400/80">
            Mock seguro: aqui solo previsualizamos UI. No hay cobros reales ni endpoints.
          </p>
        </div>
      )}
    </div>
  </div>
);

const PreviewPaymentForm = ({ onDone }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState('idle');
  const [tab, setTab] = useState('tarjeta');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    setIsReady(false);
    const id = window.setTimeout(() => setIsReady(true), 650);
    return () => window.clearTimeout(id);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isReady || isSubmitting) {
      setErrorMessage(!isReady ? 'Espera un momento: el formulario aun se esta cargando.' : '');
      return;
    }
    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');
    window.setTimeout(() => {
      const roll = Math.random();
      if (roll < 0.18) {
        setIsSubmitting(false);
        setStatus('error');
        setErrorMessage('No se pudo confirmar el pago. Intenta de nuevo.');
        onDone?.({ ok: false, message: 'preview_error' });
        return;
      }
      setIsSubmitting(false);
      setStatus('success');
      onDone?.({ ok: true, message: 'succeeded' });
    }, 900);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <MockPaymentElement tab={tab} onTabChange={setTab} />
      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}
      {status === 'success' ? (
        <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
          Huella registrada. Tu gesto entra al tramo vigente.
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || !isReady}
        className="relative h-11 w-full overflow-hidden rounded-xl border border-orange-200/40 px-6 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 [background:linear-gradient(90deg,#ff8a3d_0%,#ec4899_100%)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-75 [background:radial-gradient(60%_80%_at_28%_50%,rgba(255,222,178,0.24),transparent_70%),radial-gradient(60%_80%_at_72%_55%,rgba(253,203,255,0.22),transparent_72%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-55 [background:conic-gradient(from_120deg,rgba(255,138,61,0),rgba(255,138,61,0.24),rgba(236,72,153,0.2),rgba(255,138,61,0))] [mask-image:radial-gradient(circle,transparent_62%,black_64%,black_72%,transparent_74%)] animate-[spin_8s_linear_infinite]"
        />
        <span className="relative">
          {isSubmitting ? 'Procesando...' : !isReady ? 'Cargando formulario...' : 'Simular confirmacion'}
        </span>
      </button>
      <p className="text-[11px] leading-relaxed text-slate-300/80">
        17 huellas completan 102 sesiones individuales al ano. Desde la huella 18 inicia el siguiente tramo.
      </p>
    </form>
  );
};

const PaymentForm = ({ onDone, defaultEmail = '' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [linkEmail, setLinkEmail] = useState(defaultEmail);
  const returnUrl = useMemo(() => window.location.href, []);
  const linkElementOptions = useMemo(
    () => ({
      defaultValues: {
        email: defaultEmail,
      },
    }),
    [defaultEmail]
  );
  const paymentElementOptions = useMemo(
    () => ({
      layout: {
        type: 'tabs',
        defaultCollapsed: false,
      },
      ...(defaultEmail
        ? {
            defaultValues: {
              billingDetails: {
                email: defaultEmail,
              },
            },
          }
        : {}),
    }),
    [defaultEmail]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || isSubmitting || !isPaymentElementReady) {
      if (!isPaymentElementReady) {
        setErrorMessage('Espera un momento: el formulario de pago aún se está cargando.');
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message ?? 'No se pudo confirmar el pago.');
      onDone?.({ ok: false, message: error.message });
      return;
    }

    const status = paymentIntent?.status ?? 'unknown';
    if (status === 'succeeded' || status === 'processing') {
      onDone?.({ ok: true, message: status });
      return;
    }

    onDone?.({ ok: true, message: status });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <LinkAuthenticationElement
        options={linkElementOptions}
        onChange={(event) => {
          if (event?.value?.email) {
            setLinkEmail(event.value.email);
          }
        }}
      />
      <PaymentElement
        options={paymentElementOptions}
        onReady={() => {
          setIsPaymentElementReady(true);
          setErrorMessage('');
        }}
      />
      {errorMessage ? (
        <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || !stripe || !elements || !isPaymentElementReady}
        className="relative h-11 w-full overflow-hidden rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(90%_70%_at_50%_20%,rgba(255,138,61,0.28),transparent_60%),radial-gradient(70%_60%_at_75%_55%,rgba(236,72,153,0.2),transparent_62%)]"
        />
        <span className="relative">
          {isSubmitting
            ? 'Procesando...'
            : !isPaymentElementReady
              ? 'Cargando formulario...'
              : 'Confirmar huella con Stripe'}
        </span>
      </button>
      {linkEmail ? (
        <p className="text-[11px] leading-relaxed text-slate-300/90">
          Link activo para: <span className="text-white">{linkEmail}</span>
        </p>
      ) : null}
    </form>
  );
};

const HuellaEmbeddedCheckout = ({ clientSecret, onDone, previewMode = false }) => {
  const { user } = useAuth();
  const normalizedEmail = useMemo(() => (user?.email ? user.email.trim().toLowerCase() : ''), [user?.email]);

  if (!previewMode && !clientSecret) {
    return null;
  }

  const stripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: STRIPE_BRAND_COLOR,
        colorDanger: STRIPE_ACCENT_COLOR,
        colorBackground: 'transparent',
        colorText: '#f8fafc',
        colorTextSecondary: '#94a3b8',
        borderRadius: '12px',
        spacingUnit: '4px',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial',
      },
      rules: {
        '.Block': {
          backgroundColor: 'rgba(2, 6, 23, 0.6)',
          border: '1px solid rgba(232, 121, 249, 0.24)',
          boxShadow: '0 16px 38px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          borderRadius: '14px',
        },
        '.Input': {
          backgroundColor: 'rgba(15, 23, 42, 0.62)',
          border: '1px solid rgba(232, 121, 249, 0.18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        },
        '.Input:focus': {
          border: '1px solid rgba(255,138,61,0.88)',
          boxShadow: '0 0 0 2px rgba(236,72,153,0.28)',
        },
        '.Tab': {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(232, 121, 249, 0.2)',
          color: 'rgba(226,232,240,0.86)',
          boxShadow: 'none',
        },
        '.Tab:hover': {
          color: '#ffffff',
          border: '1px solid rgba(255,138,61,0.45)',
        },
        '.Tab--selected': {
          backgroundColor: 'rgba(236,72,153,0.18)',
          border: '1px solid rgba(255,138,61,0.72)',
          boxShadow: '0 0 0 2px rgba(236,72,153,0.25)',
          color: '#ffffff',
        },
        '.Label': {
          color: 'rgba(226,232,240,0.84)',
          fontSize: '12px',
          letterSpacing: '0.02em',
        },
        '.Error': {
          color: STRIPE_ACCENT_COLOR,
        },
        '.Text': {
          color: 'rgba(148,163,184,0.9)',
        },
      },
    },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-fuchsia-200/20 bg-slate-950/55 p-3 sm:p-4 shadow-[0_24px_55px_rgba(8,4,20,0.62)] backdrop-blur">
      <div
        aria-hidden="true"
        className="[background:radial-gradient(130%_95%_at_15%_0%,rgba(255,138,61,0.32),transparent_56%),radial-gradient(130%_95%_at_85%_5%,rgba(236,72,153,0.28),transparent_56%),radial-gradient(130%_120%_at_50%_110%,rgba(6,182,212,0.2),transparent_64%)] pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 [background:linear-gradient(to_bottom,rgba(255,255,255,0.16),transparent)]"
      />
      <div className="relative space-y-3">
        <div className="flex items-start gap-3 px-1 py-1 text-slate-100">
          <span
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/25 bg-slate-900/75 shadow"
          >
            <img
              src={EMBEDDED_LOGO_SRC}
              alt="Logo de Es un Gato Encerrado"
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </span>
          <div className="min-w-0">
            {previewMode ? (
              <p className="mb-1 inline-flex rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/90">
                Modo Lab
              </p>
            ) : null}
            <p className="text-sm font-semibold leading-relaxed text-slate-100">{EMBEDDED_HEADER_COPY}</p>
            <p className="mt-0.5 text-xs text-slate-300/90">
              Tu huella: <span className="text-white">$50 MXN</span> al mes.
            </p>
          </div>
        </div>

        {previewMode ? (
          <div className="relative">
            <PreviewPaymentForm onDone={onDone} />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={stripeElementsOptions}>
            <div className="relative">
              <PaymentForm onDone={onDone} defaultEmail={normalizedEmail} />
            </div>
          </Elements>
        )}
      </div>
    </div>
  );
};

export default HuellaEmbeddedCheckout;
