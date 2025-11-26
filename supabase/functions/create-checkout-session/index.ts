import { serve } from 'std/http/server.ts';
import Stripe from 'npm:stripe@14.25.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CreateCheckoutPayload = {
  priceId?: string;
  userId?: string;
  mode?: Stripe.Checkout.SessionCreateParams.Mode;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { priceId, userId, mode } = (await req.json()) as CreateCheckoutPayload;

    if (!priceId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing priceId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkoutMode: Stripe.Checkout.SessionCreateParams.Mode =
      mode === 'subscription' ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      payment_method_types: ['card'],
      success_url: 'https://gatoencerrado.ai/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://gatoencerrado.ai/pago-cancelado',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        priceId,
        mode: checkoutMode,
      },
    });

    if (!session.url) {
      return new Response(JSON.stringify({ error: 'Stripe did not return a checkout URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase.from('payments_pending').insert({
      user_id: userId,
      stripe_session_id: session.id,
      price_id: priceId,
    });

    if (insertError) {
      console.error('Error inserting into payments_pending', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error creating checkout session';
    console.error('create-checkout-session error', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
