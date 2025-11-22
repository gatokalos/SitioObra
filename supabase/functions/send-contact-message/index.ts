import { serve } from "std/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM");
const landingUrl = Deno.env.get("LANDING_URL") ?? "https://gatoencerrado.ai";
const logoUrl = Deno.env.get("LOGO_URL") ?? `${landingUrl}/assets/logoapp.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  name?: string;
  message?: string | null;
};

const buildHtmlEmail = ({ name, message }: Required<Payload>) => {
  const safeName = name || "amig@ del universo #GatoEncerrado";
  const safeMessage = message || "Sin mensaje adicional.";
  const formattedMessage = safeMessage.replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recibimos tu mensaje · #GatoEncerrado</title>
    <style>
      body {
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #020617;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 580px;
        margin: 0 auto;
        padding: 32px 24px;
      }
      .card {
        background: radial-gradient(circle at top right, rgba(238, 210, 255, 0.08), transparent 45%),
          #030712;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.8);
      }
      .tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(129, 140, 248, 0.15);
        color: #c7d2fe;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        color: #e0e7ff;
        margin-bottom: 12px;
        font-size: 24px;
      }
      p {
        color: rgba(226, 232, 240, 0.85);
        line-height: 1.6;
        margin-bottom: 16px;
        font-size: 15px;
      }
      .logo {
        display: block;
        width: 92px;
        margin-bottom: 18px;
      }
      .quote {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        padding: 16px;
        font-size: 14px;
        color: #cbd5f5;
        line-height: 1.6;
      }
      .footer {
        text-align: center;
        margin-top: 24px;
        font-size: 12px;
        color: rgba(226, 232, 240, 0.55);
      }
      .cta {
        display: inline-flex;
        margin-top: 16px;
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border: 1px solid rgba(129, 140, 248, 0.5);
        background: rgba(129, 140, 248, 0.15);
        color: #e0e7ff;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <span class="tag">#GatoEncerrado</span>
        <img src="${logoUrl}" alt="#GatoEncerrado" class="logo" />
        <h1>Hola ${safeName.split(" ")[0]}, recibimos tu mensaje.</h1>
        <p>
          Gracias por escribirnos desde la sección <strong>Contacto, Prensa & Créditos</strong>. Nuestro equipo lee cada mensaje con atención y te responderá apenas pueda.
        </p>
          <div class="quote">
            <p><strong>Mensaje recibido:</strong></p>
            <p>${formattedMessage}</p>
        </div>
        <p>
          Mientras tanto, siempre puedes revisar nuestras novedades en redes o seguir la bitácora de #GatoEncerrado. Aquí sigue la historia y tú eres parte de ella.
        </p>
        <p>#GatoEncerrado · Residencia Transmedia</p>
        <a href="${landingUrl}" class="cta" target="_blank" rel="noreferrer">
          Descubre nuestra causa social
        </a>
      </div>
      <p class="footer">
        Este correo confirma que recibimos tu mensaje. Si no reconoces este envío, ignóralo: nadie más lo verá.
      </p>
    </div>
  </body>
</html>`;
};

const buildTextEmail = ({ name, message }: Required<Payload>) => {
  return [
    `Hola ${name || "amig@ del universo #GatoEncerrado"},`,
    "",
    "Gracias por escribirnos desde la sección Contacto, Prensa & Créditos. Leímos tu mensaje y te escribiremos pronto.",
    "",
    "Tu mensaje:",
    message || "Sin mensaje adicional.",
    "",
    "Cuida ese amor por los Miniversos.",
    "",
    `CTA: ${landingUrl}`,
    "",
    "#GatoEncerrado",
  ].join("\n");
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

  let payload: Payload;

  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
  }

  if (!payload.email) {
    return new Response("Missing email", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const html = buildHtmlEmail({
    name: payload.name || "",
    message: payload.message || "",
    email: payload.email,
  });
  const text = buildTextEmail({
    name: payload.name || "",
    message: payload.message || "",
    email: payload.email,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [payload.email],
      subject: "Recibimos tu mensaje · #GatoEncerrado",
      text,
      html,
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
