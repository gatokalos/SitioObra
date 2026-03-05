import { supabase } from '@/lib/supabaseClient';

export const MERCH_PACKAGE_PRICE_MAP = {
  'taza-250': import.meta.env.VITE_PRICE_TAZA,
  'novela-400': import.meta.env.VITE_PRICE_NOVELA,
};

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  return /\S+@\S+\.\S+/.test(trimmed) ? trimmed : '';
};

export async function startDirectMerchCheckout({
  packageId,
  customerEmail = '',
  metadata = {},
}) {
  const priceId = MERCH_PACKAGE_PRICE_MAP[packageId];
  if (!priceId) {
    throw new Error('missing_price_id');
  }

  const payload = {
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
  };

  const normalizedEmail = normalizeEmail(customerEmail);
  if (normalizedEmail) {
    payload.customer_email = normalizedEmail;
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: payload,
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('missing_checkout_url');
  }

  window.location.assign(data.url);
}
