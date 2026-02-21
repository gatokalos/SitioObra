import React, { useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/huellaCheckout';

const STRIPE_BRAND_COLOR = '#2b193e';
const STRIPE_ACCENT_COLOR = '#fda4af';

const PaymentForm = ({ onDone }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const returnUrl = useMemo(() => window.location.href, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || isSubmitting) {
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
      <PaymentElement />
      {errorMessage ? (
        <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || !stripe || !elements}
        className="h-11 w-full rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Procesando...' : 'Confirmar huella'}
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
      theme: 'night',
      variables: {
        colorPrimary: STRIPE_BRAND_COLOR,
        colorDanger: STRIPE_ACCENT_COLOR,
        colorBackground: '#0b1020',
        colorText: '#f8fafc',
        colorTextSecondary: '#94a3b8',
        borderRadius: '10px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#0f172a',
          border: '1px solid #233152',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: `1px solid ${STRIPE_ACCENT_COLOR}`,
          boxShadow: `0 0 0 1px ${STRIPE_ACCENT_COLOR}`,
        },
        '.Tab': {
          backgroundColor: '#0b1225',
          border: '1px solid #233152',
          color: '#cbd5e1',
        },
        '.Tab:hover': {
          color: '#ffffff',
        },
        '.Tab--selected': {
          border: `1px solid ${STRIPE_ACCENT_COLOR}`,
          boxShadow: `0 0 0 1px ${STRIPE_ACCENT_COLOR}`,
          color: '#ffffff',
        },
        '.Label': {
          color: '#94a3b8',
        },
        '.Error': {
          color: STRIPE_ACCENT_COLOR,
        },
      },
    },
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-slate-900/40 p-3 sm:p-4">
      <Elements stripe={stripePromise} options={stripeElementsOptions}>
        <PaymentForm onDone={onDone} />
      </Elements>
    </div>
  );
};

export default HuellaEmbeddedCheckout;
