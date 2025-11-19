import { serve } from "std/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM");
const landingUrl = Deno.env.get("LANDING_URL") ?? "https://gatoencerrado.ai";
const logoUrl = Deno.env.get("LOGO_URL") ?? `${landingUrl}/assets/logoapp.png`;
const stripeUrl = Deno.env.get("STRIPE_URL") ?? `${landingUrl}/reservaciones`;
const calendarLink =
  Deno.env.get("CALENDAR_LINK") ??
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Gato%20Encerrado%20%C2%B7%2028%20de%20diciembre&dates=20241228T210000Z/20241228T223000Z&details=Funci%C3%B3n%20especial%20en%20CEC&location=CECUT";
const smsNumber = Deno.env.get("SMS_NUMBER") ?? "+5215550112233";
const smsMessage = encodeURIComponent("Recordarme la función #GatoEncerrado el 28 de diciembre en CECUT.");

const CTA_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    html: string;
    plainText: string;
  }
> = {
  recordatorio: {
    title: "Recordatorio de la función",
    description: "Añade el evento a tu calendario o recibe un SMS el día del show.",
    html: `<div class="cta-grid">
        <a href="${calendarLink}" target="_blank" rel="noreferrer" class="cta-link">Añadir a mi calendario</a>
        <a href="sms:${smsNumber}?body=${smsMessage}" class="cta-link">Solicitar notificación SMS</a>
      </div>`,
    plainText: `Añade al calendario: ${calendarLink} · Pide el SMS al ${smsNumber}`,
  },
  reservaciones: {
    title: "Información sobre reservaciones",
    description: "Accede a la línea de reservaciones y asegura tu paquete con Stripe.",
    html: `<a href="${stripeUrl}" class="cta-link" target="_blank" rel="noreferrer">Abrir línea de reservaciones</a>`,
    plainText: `Sigue la línea de reservaciones: ${stripeUrl}`,
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  name?: string;
  interestLabel?: string;
  interestValue?: string;
  city?: string | null;
  notes?: string | null;
};

const buildHtmlEmail = ({ name, interestLabel, interestValue, city, notes }: Required<Omit<Payload, "email">>) => {
  const safeName = name || "amig@ del universo #GatoEncerrado";
  const safeInterest = interestLabel || "Experiencia #GatoEncerrado";
  const safeCity = city || "No especificado";
  const safeNotes = notes || "Sin mensaje adicional.";
  const ctaDetails = CTA_CONFIG[interestValue ?? "recordatorio"] ?? CTA_CONFIG["recordatorio"];

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de registro · #GatoEncerrado</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 0 auto; padding: 32px 24px; }
    .card { background: linear-gradient(135deg, rgba(51, 65, 85, 0.8), rgba(15, 23, 42, 0.95)); border-radius: 24px; padding: 32px; border: 1px solid rgba(148, 163, 184, 0.25); box-shadow: 0 25px 50px -12px rgba(0,0,0,.65); }
    h1 { font-size: 24px; margin-bottom: 12px; color: #f8fafc; }
    p { line-height: 1.6; font-size: 15px; margin-bottom: 16px; }
    .tag { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(129, 140, 248, 0.15); border: 1px solid rgba(129, 140, 248, 0.35); color: #c7d2fe; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 8px; }
    .list { background: rgba(15, 23, 42, 0.6); border-radius: 18px; padding: 20px; border: 1px solid rgba(148, 163, 184, 0.15); }
    .list strong { color: #f8fafc; }
    .footer { text-align: center; margin-top: 28px; font-size: 12px; color: rgba(226, 232, 240, 0.6); }
    .cta { display: inline-flex; margin-top: 18px; padding: 12px 22px; border-radius: 999px; border: 1px solid rgba(59, 130, 246, 0.45); background: rgba(59, 130, 246, 0.15); color: #c7d2fe; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; font-weight: 600; }
    .logo { display: block; width: 92px; margin-bottom: 16px; }
    .cta-block { margin-top: 24px; border-radius: 20px; border: 1px solid rgba(148, 163, 184, 0.25); padding: 20px; background: rgba(15, 23, 42, 0.65); }
    .cta-block h2 { margin: 0 0 4px; font-size: 16px; color: #f8fafc; }
    .cta-block p { margin: 0 0 12px; color: rgba(226, 232, 240, 0.75); font-size: 14px; }
    .cta-grid { display: flex; gap: 12px; flex-wrap: wrap; }
    .cta-link { display: inline-flex; justify-content: center; align-items: center; padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(129, 140, 248, 0.35); color: #c7d2fe; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; background: rgba(129, 140, 248, 0.12); }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="tag">#GatoEncerrado</span>
      <img src="${logoUrl}" alt="#GatoEncerrado" class="logo" />
      <h1>Hola ${safeName.split(" ")[0]}, recibimos tu registro.</h1>
      <p>
        Te mantendremos al tanto de la preventa y activaciones transmedia vinculadas a
        <strong>${safeInterest}</strong>. Cuando abramos la siguiente ventana,
        serás de las primeras personas en enterarse.
      </p>
      <div class="list">
        <p><strong>Ciudad:</strong> ${safeCity}</p>
        <p><strong>Interés:</strong> ${safeInterest}</p>
        <p><strong>Mensaje:</strong> ${safeNotes}</p>
      </div>
      <div class="cta-block">
        <h2>${ctaDetails.title}</h2>
        <p>${ctaDetails.description}</p>
        ${ctaDetails.html}
      </div>
      <p>
        Este correo es tu constancia de registro. Si necesitas actualizar tus datos,
        sólo responde este mensaje y alguien del equipo te ayudará.
      </p>
      <p>Gracias por cuidar este universo.</p>
      <a href="${landingUrl}" class="cta" target="_blank" rel="noreferrer">Ver paquetes abiertos</a>
      <p>#GatoEncerrado · Residencia Transmedia</p>
    </div>
    <p class="footer">
      Recibes este correo porque lo registraste en la landing de #GatoEncerrado.
      Si no reconoces este mensaje, simplemente ignóralo.
    </p>
  </div>
</body>
</html>`;
};

const buildTextEmail = ({
  name,
  interestLabel,
  interestValue,
  city,
  notes,
}: Required<Omit<Payload, "email">>) => {
  return [
    `Hola ${name || "amig@ del universo #GatoEncerrado"},`,
    "",
    `Registramos tu interés en ${interestLabel || "la experiencia #GatoEncerrado"}.`,
    `Ciudad: ${city || "No especificado"}`,
    `Mensaje: ${notes || "Sin mensaje adicional."}`,
    "",
    "Cuando abramos la próxima ventana de preventa o actividades transmedia, te contactaremos.",
    "",
    `CTA: ${
      CTA_CONFIG[interestValue ?? "recordatorio"]?.plainText ?? CTA_CONFIG["recordatorio"].plainText
    }`,
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
    name: payload.name ?? "",
    interestLabel: payload.interestLabel ?? "",
    interestValue: payload.interestValue ?? "",
    city: payload.city ?? "",
    notes: payload.notes ?? "",
  });
  const text = buildTextEmail({
    name: payload.name ?? "",
    interestLabel: payload.interestLabel ?? "",
    interestValue: payload.interestValue ?? "",
    city: payload.city ?? "",
    notes: payload.notes ?? "",
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
      subject: "Tu registro para #GatoEncerrado quedó guardado",
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
