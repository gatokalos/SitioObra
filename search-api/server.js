import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// ─── Validación de entorno ────────────────────────────────────────────────────
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  ANTHROPIC_API_KEY,
  ALLOWED_ORIGIN = '*',
  PORT = '3001',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) {
  console.error(
    '[search-api] Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY'
  );
  process.exit(1);
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── System prompt — voz editorial de GatoEncerrado ──────────────────────────
const SYSTEM_PROMPT = `Eres el asistente de búsqueda de GatoEncerrado, un proyecto artístico transmedia argentino.
Tu función es responder preguntas sobre la Obra, el universo narrativo, los personajes, los artículos del blog y los espacios creativos del sitio.

Reglas estrictas:
- Responde ÚNICAMENTE sobre GatoEncerrado: la Obra, Obra (personaje IA), Silvestre, el Miniverso, los portales (Lectura, Sonoro, Movimiento, Gráficos, Juegos, Literatura, Artesanías, Voz, Oráculo, Encuentros), el blog, los colaboradores y los artículos disponibles.
- Si la consulta no tiene relación con GatoEncerrado, responde: "Eso está más allá de mi universo. Explorá los portales del sitio para encontrar lo que buscás."
- Usa siempre el vos rioplatense. Nunca uses "tú".
- El tono es cálido, curatorial, poético pero preciso. No es formal ni corporativo.
- Citá los artículos relevantes por su título cuando sean pertinentes.
- Si no encontrás información suficiente en el contexto, decilo con honestidad y sugerí explorar el sitio.
- Sé conciso. Máximo 3 párrafos salvo que la complejidad lo requiera.`;

// ─── Tabla y campos del blog ──────────────────────────────────────────────────
const TABLE = 'blog_posts';
const LIST_FIELDS = 'id,slug,title,excerpt,author,author_role,published_at,read_time_minutes,tags,featured_image_url,image_caption,author_avatar_url';
const MAX_SEARCH_RESULTS = 5;
// Cantidad de caracteres del campo `content` inyectados por artículo como contexto
const CONTENT_SNIPPET_LENGTH = 1200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Busca artículos relevantes en Supabase.
 * Intenta primero búsqueda full-text (columna `fts`).
 * Si falla o no hay resultados, cae en búsqueda ilike sobre título + excerpt.
 */
async function searchArticles(query) {
  // Intento 1: full-text search (requiere columna generada `fts` en la tabla)
  const ftsResult = await supabase
    .from(TABLE)
    .select('title,excerpt,content,slug,tags,published_at')
    .textSearch('fts', query, { type: 'websearch', config: 'spanish' })
    .limit(MAX_SEARCH_RESULTS);

  if (!ftsResult.error && ftsResult.data?.length > 0) {
    return ftsResult.data;
  }

  // Intento 2: ilike sobre título y excerpt (siempre disponible)
  const term = `%${query.replace(/[%_]/g, '\\$&')}%`;
  const ilikeResult = await supabase
    .from(TABLE)
    .select('title,excerpt,content,slug,tags,published_at')
    .or(`title.ilike.${term},excerpt.ilike.${term}`)
    .limit(MAX_SEARCH_RESULTS);

  return ilikeResult.data ?? [];
}

/**
 * Construye el bloque de contexto RAG que se inyecta al prompt de Claude.
 */
function buildContext(articles) {
  if (!articles.length) {
    return 'No se encontraron artículos relacionados con esta consulta en el blog de GatoEncerrado.';
  }

  return articles
    .map((a, i) => {
      const snippet = (a.content ?? a.excerpt ?? '').slice(0, CONTENT_SNIPPET_LENGTH);
      const tags = Array.isArray(a.tags) && a.tags.length ? `Etiquetas: ${a.tags.join(', ')}` : '';
      return [
        `[Artículo ${i + 1}] "${a.title}"`,
        tags,
        a.excerpt ? `Resumen: ${a.excerpt}` : '',
        snippet ? `Contenido:\n${snippet}` : '',
        `Slug: ${a.slug}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');
}

// ─── App Express ──────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
  })
);
app.use(express.json({ limit: '64kb' }));

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gatoencerrado-search-api' });
});

// ─── GET /blog-posts ──────────────────────────────────────────────────────────
// Compatible con el blogService.js existente de la SPA
app.get('/blog-posts', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(LIST_FIELDS)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[/blog-posts] Supabase error:', error.message);
      return res.status(500).json({ error: 'Error al obtener artículos.' });
    }

    res.json(data ?? []);
  } catch (err) {
    console.error('[/blog-posts] Excepción:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// ─── GET /blog-posts/:slug ────────────────────────────────────────────────────
app.get('/blog-posts/:slug', async (req, res) => {
  const slug = req.params.slug?.trim();
  if (!slug) return res.status(400).json({ error: 'slug requerido.' });

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    res.json(data);
  } catch (err) {
    console.error('[/blog-posts/:slug] Excepción:', err);
    res.status(500).json({ error: 'Error interno.' });
  }
});

// ─── POST /search ─────────────────────────────────────────────────────────────
// Búsqueda RAG: Supabase → contexto → Claude (streaming SSE)
app.post('/search', async (req, res) => {
  const query = req.body?.query?.trim();
  if (!query) {
    return res.status(400).json({ error: 'El campo "query" es requerido.' });
  }

  // Longitud mínima para evitar búsquedas triviales
  if (query.length < 2) {
    return res.status(400).json({ error: 'La consulta es demasiado corta.' });
  }

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // evitar buffering en nginx

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Heartbeat para mantener la conexión viva durante la búsqueda en Supabase
  res.write(': heartbeat\n\n');

  try {
    // 1. Recuperar artículos relevantes
    const articles = await searchArticles(query);
    const context = buildContext(articles);
    const sources = articles.map((a) => ({ title: a.title, slug: a.slug }));

    // 2. Llamar a Claude con streaming
    const userMessage = `Consulta del visitante: "${query}"\n\nContexto — artículos del blog de GatoEncerrado:\n\n${context}`;

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // 3. Re-transmitir deltas de texto al cliente
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        sendEvent({ type: 'delta', text: event.delta.text });
      }
    }

    // 4. Señal de finalización + fuentes
    sendEvent({ type: 'done', sources });
  } catch (err) {
    console.error('[/search] Error:', err);

    if (err instanceof Anthropic.RateLimitError) {
      sendEvent({ type: 'error', message: 'Límite de solicitudes alcanzado. Intentá en unos segundos.' });
    } else if (err instanceof Anthropic.APIError) {
      sendEvent({ type: 'error', message: 'Error al generar respuesta. Intentá de nuevo.' });
    } else {
      sendEvent({ type: 'error', message: 'Error interno del servidor.' });
    }
  } finally {
    res.end();
  }
});

// ─── Inicio ───────────────────────────────────────────────────────────────────
app.listen(Number(PORT), () => {
  console.log(`[search-api] Corriendo en http://localhost:${PORT}`);
});
