import { serve } from 'std/http/server.ts';
import Stripe from 'npm:stripe@14.25.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!webhookSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const relevantEvents = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.created',
]);

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

  const signature = req.headers.get('stripe-signature');
  const payload = await req.text();

  let event: Stripe.Event;

  try {
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Stripe webhook signature error', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!relevantEvents.has(event.type)) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;

        if (!userId || !priceId) {
          throw new Error('Missing userId or priceId in checkout session metadata');
        }

        const { error: insertError } = await supabase.from('payments_confirmed').insert({
          user_id: userId,
          stripe_session_id: session.id,
          price_id: priceId,
          status: 'completed',
        });

        if (insertError) {
          throw insertError;
        }

        const { error: deleteError } = await supabase
          .from('payments_pending')
          .delete()
          .eq('stripe_session_id', session.id);

        if (deleteError) {
          console.error('Failed to delete pending payment', deleteError);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        // Reserved for future use (e.g., renewals).
        break;
      }
      case 'customer.subscription.created': {
        // Reserved for future subscription lifecycle handling.
        break;
      }
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('stripe-webhooks error', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
