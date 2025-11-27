import { serve } from 'std/http/server.ts';
import { renderReserveEmail } from './emailTemplate.ts';

type ReservePayload = {
  email?: string;
  name?: string;
  city?: string | null;
  notes?: string | null;
  packages?: string[];
  packagesSummary?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Gato Encerrado <no-reply@gatoencerrado.ai>';

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, name, city, notes, packages, packagesSummary } = (await req.json()) as ReservePayload;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const summary =
      packagesSummary ||
      (Array.isArray(packages) && packages.length > 0 ? packages.join(', ') : 'Pendiente de confirmación');

    const html = renderReserveEmail({
      name,
      city,
      notes,
      packagesSummary: summary,
    });

    const emailPayload = {
      from: RESEND_FROM,
      to: [email],
      subject: 'Apartado recibido – #GatoEncerrado',
      html,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Resend error', response.status, text);
      return new Response(JSON.stringify({ error: 'Email failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('send-reserve-confirmation error', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
