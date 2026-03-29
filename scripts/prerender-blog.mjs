/**
 * prerender-blog.mjs
 *
 * Runs after `vite build`. For each published blog post it creates
 * dist/blog/<slug>/index.html with correct OG/Twitter meta tags injected,
 * so social-media bots receive ready HTML without executing JavaScript.
 *
 * Usage: node scripts/prerender-blog.mjs
 * Reads VITE_API_URL from .env → .env.local → process.env (later wins).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Load env files ──────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    result[key] = raw.replace(/^["']|["']$/g, '');
  }
  return result;
}

const env = {
  ...parseEnvFile(join(ROOT, '.env')),
  ...parseEnvFile(join(ROOT, '.env.local')),
  ...process.env,
};

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = (env.VITE_API_URL || '').replace(/\/+$/, '');
const SITE_URL = (env.VITE_SITE_URL || 'https://universogatoencerrado.com').replace(/\/+$/, '');
const FALLBACK_IMAGE = `${SITE_URL}/assets/social-card.jpg`;

if (!API_URL) {
  console.warn('[prerender-blog] VITE_API_URL not set — skipping blog prerender.');
  process.exit(0);
}

const distIndexPath = join(ROOT, 'dist', 'index.html');
if (!existsSync(distIndexPath)) {
  console.error('[prerender-blog] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = readFileSync(distIndexPath, 'utf8');

// ─── HTML injection ───────────────────────────────────────────────────────────

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Replace meta content values and inject canonical in a copy of index.html.
 * Works on both quoted-attribute orders (content="…" or property="…" content="…").
 */
function injectMeta(html, { title, description, image, url }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  const i = escapeAttr(image);
  const u = escapeAttr(url);

  const replaceProp = (prop, value) =>
    html.replace(
      new RegExp(`(<meta\\s[^>]*property="${prop}"[^>]*content=")[^"]*(")`),
      `$1${value}$2`,
    ).replace(
      new RegExp(`(<meta\\s[^>]*content=")[^"]*("[^>]*property="${prop}")`),
      `$1${value}$2`,
    );

  const replaceName = (name, value) =>
    html.replace(
      new RegExp(`(<meta\\s[^>]*name="${name}"[^>]*content=")[^"]*(")`),
      `$1${value}$2`,
    ).replace(
      new RegExp(`(<meta\\s[^>]*content=")[^"]*("[^>]*name="${name}")`),
      `$1${value}$2`,
    );

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t} — #GatoEncerrado</title>`);
  html = replaceProp('og:title', t);
  html = replaceProp('og:description', d);
  html = replaceProp('og:image', i);
  html = replaceProp('og:url', u);
  html = replaceProp('og:type', 'article');
  html = replaceName('twitter:title', t);
  html = replaceName('twitter:description', d);
  html = replaceName('twitter:image', i);

  // Insert canonical just before </head>
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${u}" />\n</head>`);
  } else {
    html = html.replace(
      /(<link\s[^>]*rel="canonical"[^>]*href=")[^"]*(")/,
      `$1${u}$2`,
    );
  }

  return html;
}

// ─── Fetch posts ──────────────────────────────────────────────────────────────

async function fetchPosts() {
  try {
    const res = await fetch(`${API_URL}/blog-posts`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[prerender-blog] API returned ${res.status} — skipping.`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[prerender-blog] Could not reach API (${err.message}) — skipping.`);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const posts = await fetchPosts();

if (posts.length === 0) {
  console.log('[prerender-blog] No posts returned — nothing to prerender.');
  process.exit(0);
}

let count = 0;

for (const post of posts) {
  const slug = (post.slug ?? `post-${post.id}` ?? '').trim();
  if (!slug) continue;

  const title = (post.title ?? 'Artículo sin título').trim();
  const description = (post.excerpt ?? post.summary ?? 'Lee este artículo en #GatoEncerrado.').trim();
  const image = (post.featured_image_url ?? post.cover_image ?? FALLBACK_IMAGE).trim();
  const url = `${SITE_URL}/blog/${slug}`;

  const html = injectMeta(baseHtml, { title, description, image, url });

  const outDir = join(ROOT, 'dist', 'blog', slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  count++;
}

console.log(`[prerender-blog] ✓ Prerendered ${count} article page${count !== 1 ? 's' : ''} → dist/blog/`);
