import React, { useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/huellaCheckout';

const STRIPE_BRAND_COLOR = '#a78bfa';
const STRIPE_ACCENT_COLOR = '#fda4af';
const EMBEDDED_HEADER_COPY = 'Formulario de pago listo. Completa tu huella aquí.';
const EMBEDDED_LOGO_SRC = '/assets/logoapp.png';

const PaymentForm = ({ onDone }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const returnUrl = useMemo(() => window.location.href, []);

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
      <PaymentElement
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
          className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(90%_70%_at_50%_20%,rgba(167,139,250,0.35),transparent_60%)]"
        />
        <span className="relative">
          {isSubmitting ? 'Procesando...' : !isPaymentElementReady ? 'Cargando formulario...' : 'Confirmar huella con Stripe'}
        </span>
      </button>
    </form>
  );
};

const HuellaEmbeddedCheckout = ({ clientSecret, onDone }) => {
  if (!clientSecret) {
    return null;
  }

  const stripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'day',
      variables: {
        colorPrimary: STRIPE_BRAND_COLOR,
        colorDanger: STRIPE_ACCENT_COLOR,
        colorBackground: 'transparent',
        colorText: '#f8fafc',
        colorTextSecondary: '#a8b0c3',
        borderRadius: '12px',
        spacingUnit: '4px',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial',
      },
      rules: {
        '.Block': {
          backgroundColor: 'rgba(10, 16, 32, 0.55)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 18px 55px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          borderRadius: '14px',
        },
        '.Input': {
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148,163,184,0.18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        },
        '.Input:focus': {
          border: '1px solid rgba(167,139,250,0.85)',
          boxShadow: '0 0 0 2px rgba(167,139,250,0.28)',
        },
        '.Tab': {
          backgroundColor: 'rgba(11, 18, 37, 0.65)',
          border: '1px solid rgba(148,163,184,0.16)',
          color: 'rgba(226,232,240,0.78)',
          boxShadow: 'none',
        },
        '.Tab:hover': {
          color: '#ffffff',
          border: '1px solid rgba(167,139,250,0.35)',
        },
        '.Tab--selected': {
          backgroundColor: 'rgba(167,139,250,0.14)',
          border: '1px solid rgba(167,139,250,0.70)',
          boxShadow: '0 0 0 2px rgba(167,139,250,0.22)',
          color: '#ffffff',
        },
        '.Label': {
          color: 'rgba(203,213,225,0.80)',
          fontSize: '12px',
          letterSpacing: '0.02em',
        },
        '.Error': {
          color: STRIPE_ACCENT_COLOR,
        },
        '.Text': {
          color: 'rgba(148,163,184,0.90)',
        },
      },
    },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 p-3 sm:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_20%_0%,rgba(167,139,250,0.20),transparent_55%),radial-gradient(120%_90%_at_80%_10%,rgba(253,164,175,0.14),transparent_55%),radial-gradient(140%_120%_at_50%_110%,rgba(56,189,248,0.10),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 [background:linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent)]"
      />
      <div className="relative space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-slate-900/80">
            <img
              src={EMBEDDED_LOGO_SRC}
              alt="Logo de Es un Gato Encerrado"
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </span>
          <p className="text-sm font-medium leading-relaxed text-slate-100">{EMBEDDED_HEADER_COPY}</p>
        </div>

        <Elements stripe={stripePromise} options={stripeElementsOptions}>
          <div className="relative">
            <PaymentForm onDone={onDone} />
          </div>
        </Elements>
      </div>
    </div>
  );
};

export default HuellaEmbeddedCheckout;
