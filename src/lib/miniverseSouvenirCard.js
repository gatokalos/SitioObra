/* ── Canvas souvenir card para miniversos completados ─────────────────── */

const CANVAS_WIDTH  = 1080;
const CANVAS_HEIGHT = 1920;

const PORTAL_DISPLAY_NAME = {
  obra:        'Obra',
  literatura:  'Literatura',
  artesanias:  'Artesanías',
  grafico:     'Gráficos',
  cine:        'Cine',
  sonoridades: 'Sonoridades',
  movimiento:  'Movimiento',
  juegos:      'Juegos',
  oraculo:     'Oráculo',
};

const PORTAL_NUMBER = {
  obra:        '01',
  literatura:  '02',
  artesanias:  '03',
  grafico:     '04',
  cine:        '05',
  sonoridades: '06',
  movimiento:  '07',
  juegos:      '08',
  oraculo:     '09',
};


const MERCH = 'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Merch';
const PORTAL_ICON_URL = {
  obra:        `${MERCH}/la_obra.png`,
  literatura:  `${MERCH}/literatura.png`,
  artesanias:  `${MERCH}/la_taza.png`,
  grafico:     `${MERCH}/los_graficos.png`,
  cine:        `${MERCH}/cortos.png`,
  sonoridades: `${MERCH}/sonoridades.png`,
  movimiento:  `${MERCH}/lasdiosas.png`,
  juegos:      `${MERCH}/juegos.png`,
  oraculo:     `${MERCH}/el_oraculo.png`,
};

const stripEslabon = (text) => {
  if (!text) return text;
  const idx = text.indexOf(': ');
  return idx !== -1 ? text.slice(idx + 2) : text;
};

const sanitizeMessage = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 460) : '';


const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) { reject(new Error('Missing src')); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Cannot load: ${src}`));
    img.src = src;
  });

const loadFirstAvailable = async (sources = []) => {
  for (const src of sources) {
    if (!src) continue;
    try { return await loadImage(src); } catch (_) {}
  }
  return null;
};

const drawCoverImage = (ctx, img, x, y, w, h) => {
  if (!img) return;
  const ir = img.width / img.height;
  const cr = w / h;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > cr) { sw = img.height * cr; sx = (img.width - sw) / 2; }
  else          { sh = img.width / cr;  sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

const wrapText = (ctx, text, maxWidth) => {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) { current = trial; }
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
};

const drawOrnateRule = (ctx, left, right, y) => {
  const mid = (left + right) / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(232,240,252,0.42)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 8]);
  ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(248,232,177,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(mid - 8, y); ctx.lineTo(mid, y - 8);
  ctx.lineTo(mid + 8, y); ctx.lineTo(mid, y + 8);
  ctx.closePath(); ctx.stroke();
  ctx.restore();
};

const letterSpace = (ctx, pxStr) => { try { ctx.letterSpacing = pxStr; } catch (_) {} };

const toBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Cannot generate blob')),
      'image/png', 0.95
    );
  });

/* ── Main export ─────────────────────────────────────────────────────────── */

export const createMiniverseSouvenirBlob = async ({
  portal = 'grafico',
  step3  = '',
  backgroundUrl = null,
} = {}) => {
  if (typeof document === 'undefined') throw new Error('Requires browser context');

  const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const displayName = PORTAL_DISPLAY_NAME[portal] ?? portal;
  const number      = PORTAL_NUMBER[portal] ?? '00';
  const message     = sanitizeMessage(stripEslabon(step3)) || 'El laboratorio registró tu recorrido.';

  const [bgImg, boletoImg, iconImg] = await Promise.all([
    loadFirstAvailable([backgroundUrl]),
    loadFirstAvailable(['/assets/boleto_vintage.png']),
    loadFirstAvailable([PORTAL_ICON_URL[portal]]),
  ]);

  // ── 1. Poster a full opacity ─────────────────────────────────────────────
  ctx.fillStyle = '#040916';
  ctx.fillRect(0, 0, W, H);
  if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, W, H);

  // ── 2. Panel geometry (boleto is 540×960 → same 9:16 as canvas) ──────────
  const panelW = Math.round(W * 0.88);
  const panelH = Math.round(panelW * (960 / 540));
  const panelX = Math.round((W - panelW) / 2);
  const panelY = Math.round((H - panelH) / 2);
  const cx     = W / 2;

  // ── 3. Boleto frame — straight, no tilt ──────────────────────────────────
  if (boletoImg) {
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur    = 40;
    ctx.shadowOffsetY = 16;
    ctx.drawImage(boletoImg, panelX, panelY, panelW, panelH);
    ctx.restore();
  }

  // ── 4. Typography ─────────────────────────────────────────────────────────
  const glow = (blur = 10) => {
    ctx.shadowColor   = 'rgba(0,0,0,0.92)';
    ctx.shadowBlur    = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  };
  const palette = {
    heading:    'rgba(244,230,197,0.97)',
    subheading: 'rgba(220,235,255,0.93)',
    label:      'rgba(234,217,183,0.96)',
    body:       'rgba(241,230,205,0.97)',
    minor:      'rgba(214,192,151,0.88)',
  };

  ctx.textAlign = 'center';

  // Padding proporcional al boleto: 13% top, 10% bottom, 11% horizontal
  const safeTop    = panelY + Math.round(panelH * 0.13);
  const safeBottom = panelY + panelH - Math.round(panelH * 0.10);
  const safeLeft   = panelX + Math.round(panelW * 0.11);
  const safeRight  = panelX + panelW - Math.round(panelW * 0.11);

  let y = safeTop;

  // Title
  glow(14);
  ctx.fillStyle = palette.heading;
  ctx.font = '500 66px “Times New Roman”, Georgia, serif';
  y += 66;
  ctx.fillText('Resonancia Colectiva', cx, y);

  // Subtitle
  y += 70;
  glow(10);
  ctx.fillStyle = palette.subheading;
  ctx.font = '500 42px “Times New Roman”, Georgia, serif';
  letterSpace(ctx, '1.5px');
  ctx.fillText(`MINIVERSO ${number}: ${displayName.toUpperCase()}`, cx, y);
  letterSpace(ctx, '0px');

  // Rule
  y += 44;
  drawOrnateRule(ctx, safeLeft, safeRight, y);

  // TU CONSIGNA
  y += 72;
  glow(12);
  ctx.fillStyle = palette.label;
  ctx.font = '600 50px “Times New Roman”, Georgia, serif';
  letterSpace(ctx, '3px');
  ctx.fillText('TU CONSIGNA', cx, y);
  letterSpace(ctx, '0px');

  // ── 5. Oracular message — flujo natural tras SEDIMENTO ───────────────────
  y += 68;
  glow(8);
  ctx.fillStyle = palette.body;
  ctx.font = 'italic 500 50px “Times New Roman”, Georgia, serif';
  const msgLines = wrapText(ctx, message, (safeRight - safeLeft) * 0.92).slice(0, 7);
  const lineH    = 62;

  msgLines.forEach((line, i) => {
    const prefix = i === 0 ? '“' : '';
    const suffix = i === msgLines.length - 1 ? '”' : '';
    ctx.fillText(`${prefix}${line}${suffix}`, cx, y + i * lineH);
  });

  // ── 6. Flavor text — anclado al safe bottom ──────────────────────────────
  const ftY = safeBottom - 36;
  drawOrnateRule(ctx, safeLeft, safeRight, ftY - 52);

  glow(6);
  ctx.fillStyle = palette.minor;
  ctx.font = '500 28px “Times New Roman”, Georgia, serif';
  ctx.fillText('Este registro es único. No garantiza continuidad.', cx, ftY - 2);
  ctx.fillText('Solo testifica que estuviste.', cx, ftY + 36);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // ── 7. App icon — esquina inferior derecha, dentro del safe area ──────────
  if (iconImg) {
    const iconSize = 204;
    const iconR    = 52;
    const iconX    = safeRight - iconSize - Math.round(panelW * 0.06);
    const iconY    = safeBottom - iconSize - Math.round(panelH * 0.07);

    // Glow detrás del ícono
    ctx.save();
    ctx.shadowColor   = 'rgba(200,220,255,0.65)';
    ctx.shadowBlur    = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // Rounded square blanco (iOS style)
    const rr = (x, y, w, h, r) => {
      const s = Math.min(r, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x+s,y); ctx.lineTo(x+w-s,y); ctx.quadraticCurveTo(x+w,y,x+w,y+s);
      ctx.lineTo(x+w,y+h-s); ctx.quadraticCurveTo(x+w,y+h,x+w-s,y+h);
      ctx.lineTo(x+s,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-s);
      ctx.lineTo(x,y+s); ctx.quadraticCurveTo(x,y,x+s,y);
      ctx.closePath();
    };
    rr(iconX, iconY, iconSize, iconSize, iconR);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.restore();

    // Ícono clipeado al mismo rounded rect
    ctx.save();
    rr(iconX, iconY, iconSize, iconSize, iconR);
    ctx.clip();
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  }

  return toBlob(canvas);
};

export const downloadBlob = (blob, filename) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.append(a);
  a.click(); a.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
};
