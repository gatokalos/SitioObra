// supabase/functions/send-proposal-confirmation/index.ts
import { serve } from "std/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!resendApiKey || !resendFrom) {
    console.error("Missing Resend configuration");
    return new Response("Email service not configured", {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let payload: { email?: string; name?: string; proposal?: string };

  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
  }

  const { email, name, proposal } = payload;

  if (!email) {
    return new Response("Missing email", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const emailBody = [
    `Hola ${name || 'amig@ del universo #GatoEncerrado'},`,
    "",
    "Recibimos tu propuesta para el blog / Diálogo vivo. Nuestro equipo la leerá pronto y te contactará si necesitamos más detalles.",
    "",
    "Resumen enviado:",
    proposal || "Sin propuesta adjunta.",
    "",
    "Gracias por sumar tu voz.",
    "#GatoEncerrado",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: "Recibimos tu propuesta para el blog #GatoEncerrado",
      text: emailBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend error:", errorText);
    return new Response("Failed to send email", {
      status: 502,
      headers: corsHeaders,
    });
  }

  return new Response("ok", { status: 200, headers: corsHeaders });
});