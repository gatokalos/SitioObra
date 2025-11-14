import { serve } from "std/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  name?: string;
  interestLabel?: string;
  city?: string | null;
  notes?: string | null;
};

const buildHtmlEmail = ({ name, interestLabel, city, notes }: Required<Omit<Payload, "email">>) => {
  const safeName = name || "amig@ del universo #GatoEncerrado";
  const safeInterest = interestLabel || "Experiencia #GatoEncerrado";
  const safeCity = city || "No especificado";
  const safeNotes = notes || "Sin mensaje adicional.";

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
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="tag">#GatoEncerrado</span>
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
      <p>
        Este correo es tu constancia de registro. Si necesitas actualizar tus datos,
        sólo responde este mensaje y alguien del equipo te ayudará.
      </p>
      <p>Gracias por cuidar este universo.</p>
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

const buildTextEmail = ({ name, interestLabel, city, notes }: Required<Omit<Payload, "email">>) => {
  return [
    `Hola ${name || "amig@ del universo #GatoEncerrado"},`,
    "",
    `Registramos tu interés en ${interestLabel || "la experiencia #GatoEncerrado"}.`,
    `Ciudad: ${city || "No especificado"}`,
    `Mensaje: ${notes || "Sin mensaje adicional."}`,
    "",
    "Cuando abramos la próxima ventana de preventa o actividades transmedia, te contactaremos.",
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
    city: payload.city ?? "",
    notes: payload.notes ?? "",
  });
  const text = buildTextEmail({
    name: payload.name ?? "",
    interestLabel: payload.interestLabel ?? "",
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
