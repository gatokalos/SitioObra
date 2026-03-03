import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabaseClient';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

async function parseFunctionsError(error) {
  const response = error?.context;
  const status = typeof response?.status === 'number' ? response.status : null;

  if (!response || typeof response.clone !== 'function') {
    return { status, payload: null };
  }

  try {
    const payload = await response.clone().json();
    return { status, payload };
  } catch (_) {
    try {
      const payload = await response.clone().text();
      return { status, payload };
    } catch (__) {
      return { status, payload: null };
    }
  }
}

function buildCheckoutError({ error, status, payload, fallbackMessage }) {
  const payloadMessage =
    (payload && typeof payload === 'object'
      ? payload?.error_description || payload?.message || payload?.error
      : null) || null;
  const message = payloadMessage || error?.message || fallbackMessage;
  const normalized = new Error(message);
  normalized.status = status ?? null;
  normalized.code =
    (payload && typeof payload === 'object' ? payload?.error || payload?.code : null) ||
    error?.name ||
    'checkout_error';
  normalized.details = payload ?? null;
  normalized.cause = error;
  return normalized;
}

export async function createEmbeddedSubscription({ priceId, metadata = {} }) {
  const { data, error } = await supabase.functions.invoke(
    'create-subscription-payment-element',
    {
      body: {
        price_id: priceId,
        metadata,
      },
    }
  );

  if (error) {
    const { status, payload } = await parseFunctionsError(error);
    const normalizedCode =
      (payload && typeof payload === 'object'
        ? payload?.error || payload?.code || payload?.message
        : payload) || '';
    const codeText = String(normalizedCode).toLowerCase();
    if (
      status === 409 &&
      (
        codeText.includes('already_subscribed') ||
        codeText.includes('already subscribed') ||
        codeText.includes('already_active_subscription') ||
        codeText.includes('subscription already active')
      )
    ) {
      return { ok: false, error: 'already_subscribed' };
    }
    throw buildCheckoutError({
      error,
      status,
      payload,
      fallbackMessage: 'No se pudo abrir el formulario embebido.',
    });
  }

  return data;
}

export async function startCheckoutFallback({ priceId, customerEmail, metadata = {} }) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      metadata,
    },
  });

  if (error) {
    const { status, payload } = await parseFunctionsError(error);
    throw buildCheckoutError({
      error,
      status,
      payload,
      fallbackMessage: 'No se pudo iniciar el checkout externo.',
    });
  }

  if (!data?.url) {
    throw new Error('fallback_missing_checkout_url');
  }

  window.location.assign(data.url);
}
