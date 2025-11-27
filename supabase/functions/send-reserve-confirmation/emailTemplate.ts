export type ReserveEmailProps = {
  name?: string;
  city?: string | null;
  notes?: string | null;
  packagesSummary?: string | null;
};

export function renderReserveEmail({
  name,
  city,
  notes,
  packagesSummary,
}: ReserveEmailProps): string {
  const safe = (value?: string | null) => value?.trim() || '—';

  return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>#GatoEncerrado · Apartado confirmado</title>
  <style>
    body { margin:0; padding:0; background:#0b0c10; color:#e9ecf1; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 640px; margin:0 auto; padding: 32px 24px 40px; }
    .card { background: linear-gradient(135deg, #0f172a 0%, #0b0c10 55%, #111827 100%); border:1px solid #1f2937; border-radius: 18px; padding: 28px; box-shadow: 0 18px 48px rgba(0,0,0,0.45); }
    h1 { font-size: 24px; margin: 0 0 12px; color:#c084fc; letter-spacing: 0.02em; }
    h2 { font-size: 18px; margin: 0 0 14px; color:#e9ecf1; }
    p { margin: 0 0 12px; line-height: 1.55; color:#d1d5db; }
    .tag { display:inline-block; padding:6px 10px; background:#c084fc22; border:1px solid #c084fc55; color:#e9d5ff; border-radius: 10px; font-size: 12px; letter-spacing: 0.04em; }
    .grid { display:grid; grid-template-columns: 1fr; gap:10px; margin: 18px 0; }
    .row { border:1px solid #1f2937; background:#111827aa; border-radius: 12px; padding:12px 14px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color:#94a3b8; margin-bottom:4px; }
    .value { font-size: 15px; color:#e5e7eb; }
    .footer { margin-top: 18px; font-size: 12px; color:#9ca3af; line-height:1.5; }
    .btn { display:inline-block; margin-top:16px; padding:12px 18px; background:#c084fc; color:#0b0c10; border-radius: 12px; font-weight: 700; text-decoration:none; }
    @media (prefers-color-scheme: light) {
      body { background:#f4f5f7; color:#0f172a; }
      .card { background: #ffffff; border-color: #e5e7eb; box-shadow: 0 12px 30px rgba(15,23,42,0.08); }
      p, .value { color:#1f2937; }
      .footer { color:#4b5563; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <span class="tag">#GatoEncerrado · Merch</span>
      <h1>¡Apartado recibido!</h1>
      <p>Hola ${safe(name)}, confirmamos tu solicitud de artículos. En las próximas horas enviaremos el enlace de pago seguro (Stripe) y las instrucciones de entrega.</p>

      <div class="grid">
        <div class="row">
          <div class="label">Tu selección</div>
          <div class="value">${safe(packagesSummary)}</div>
        </div>
        <div class="row">
          <div class="label">Ciudad</div>
          <div class="value">${safe(city)}</div>
        </div>
        <div class="row">
          <div class="label">Notas</div>
          <div class="value">${safe(notes)}</div>
        </div>
      </div>

      <h2>Próximos pasos</h2>
      <p>1) Revisa tu correo (y spam) para el enlace de pago.<br>
         2) Completa el pago antes del evento para garantizar tu apartado.<br>
         3) Entrega en mesa de merch el 28 de diciembre (CECUT).</p>

      <a class="btn" href="https://gatoencerrado.ai">Ver agenda completa</a>

      <p class="footer">
        Si no solicitaste este apartado, ignora este mensaje.  
        Equipo #GatoEncerrado · gatoencerrado.ai
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
