import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabaseClient';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

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
    throw error;
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
    throw error;
  }

  if (!data?.url) {
    throw new Error('fallback_missing_checkout_url');
  }

  window.location.assign(data.url);
}
