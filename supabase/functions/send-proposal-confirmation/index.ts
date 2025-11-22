// supabase/functions/send-proposal-confirmation/index.ts
import { serve } from "std/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM");
const landingUrl = Deno.env.get("LANDING_URL") ?? "https://gatoencerrado.ai";
const nextStepsUrl = Deno.env.get("LANDING_NEXT_STEPS_URL") ?? landingUrl;
const loginUrl = Deno.env.get("LANDING_LOGIN_URL") ?? landingUrl;
const logoUrl = Deno.env.get("LOGO_URL") ?? `${landingUrl}/assets/logoapp.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  name?: string;
  proposal?: string;
  category?: string;
};

const buildHtmlEmail = ({ name, proposal, category }: Required<Payload>) => {
  const safeName = name || "amig@ del universo #GatoEncerrado";
  const safeProposal = proposal || "Sin texto adjunto.";
  const safeCategory = category || "el universo misceláneo";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gracias por tu propuesta · #GatoEncerrado</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #01070d;
        color: #e2e8f0;
      }
      .shell {
        max-width: 600px;
        margin: 0 auto;
        padding: 32px 24px;
      }
      .card {
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.95));
        border: 1px solid rgba(59, 130, 246, 0.35);
        border-radius: 28px;
        padding: 32px;
        box-shadow: 0 30px 60px -20px rgba(2, 6, 23, 0.8);
      }
      .header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }
      .chip {
        display: inline-flex;
        padding: 6px 18px;
        border-radius: 999px;
        background: rgba(129, 140, 248, 0.15);
        border: 1px solid rgba(129, 140, 248, 0.35);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #c7d2fe;
      }
      h1 {
        font-size: 24px;
        margin: 12px 0;
        color: #f8fafc;
      }
      p {
        line-height: 1.6;
        margin-bottom: 16px;
        color: rgba(226, 232, 240, 0.8);
      }
      .proposal-card {
        background: rgba(2, 6, 23, 0.85);
        border-radius: 18px;
        padding: 20px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        font-size: 14px;
        color: #e2e8f0;
        line-height: 1.7;
      }
      .logo-badge {
        width: 68px;
        height: 68px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .logo-badge img {
        width: 52px;
        height: 52px;
        object-fit: contain;
      }
      .footer {
        font-size: 12px;
        color: rgba(226, 232, 240, 0.6);
        text-align: center;
        margin-top: 24px;
      }
      .cta {
        display: inline-flex;
        margin-top: 18px;
        padding: 12px 22px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.05);
        color: #f8fafc;
        font-size: 13px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        text-decoration: none;
        font-weight: 600;
      }
      .cta-secondary {
        margin-top: 10px;
        background: rgba(129, 140, 248, 0.18);
        border-color: rgba(129, 140, 248, 0.55);
        color: #e0e7ff;
        text-transform: none;
        letter-spacing: 0.08em;
      }
      .cta-note {
        margin-top: 12px;
        font-size: 13px;
        color: rgba(226, 232, 240, 0.75);
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <div class="header-row">
          <div>
            <span class="chip">Blog / Diálogo vivo</span>
            <h1>Gracias por compartir tu voz, ${safeName.split(" ")[0]}.</h1>
            <p>
              Acabamos de recibir tu propuesta para <strong>${safeCategory}</strong>.
              Le daremos lectura con calma y, si necesitamos más detalles, te contactaremos.
            </p>
          </div>
          <div class="logo-badge">
            <img src="${logoUrl}" alt="#GatoEncerrado" />
          </div>
        </div>
        <div class="proposal-card">
          <p><strong>Tu aporte:</strong></p>
          <p>${safeProposal.replace(/\n/g, "<br />")}</p>
        </div>
        <p>
          Mantente atento a la bitácora y sigue compartiendo teorías. Tu narración alimenta al gato encerrado.
        </p>
        <p>#GatoEncerrado · Residencia Transmedia</p>
        <a href="${nextStepsUrl}" class="cta" target="_blank" rel="noreferrer">
          Ver próximos pasos
        </a>
        <p class="cta-note">
          Si todavía no activaste tu cuenta, inicia sesión para activar notificaciones y seguir la conversación.
        </p>
        <a href="${loginUrl}" class="cta cta-secondary" target="_blank" rel="noreferrer">
          Iniciar sesión
        </a>
      </div>
      <p class="footer">
        Este correo confirma que guardamos tu propuesta. Si no lo solicitaste, ignora este mensaje.
      </p>
    </div>
  </body>
</html>`;
};

const buildTextEmail = ({ name, proposal, category }: Required<Payload>) => {
  return [
    `Hola ${name || "amig@ del universo #GatoEncerrado"},`,
    "",
    `Recibimos tu propuesta para ${category || "el universo transmedia"}. Nuestro equipo la leyó y te responderemos si necesitamos más detalles.`,
    "",
    "Tu propuesta:",
    proposal || "Sin texto adjunto.",
    "",
    "Gracias por alimentar esta constelación narrativa.",
    "",
    `Ver próximos pasos: ${nextStepsUrl}`,
    `Iniciar sesión: ${loginUrl}`,
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

  const { email, name, proposal, category } = payload;

  if (!email) {
    return new Response("Missing email", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const html = buildHtmlEmail({
    email,
    name: name || "",
    proposal: proposal || "",
    category: category || "",
  });

  const text = buildTextEmail({
    email,
    name: name || "",
    proposal: proposal || "",
    category: category || "",
  });

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
