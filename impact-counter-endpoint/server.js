// impact-counter-endpoint/server.js
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const app = express();
app.use(cors());
app.use(express.json());

// Load config
const config = JSON.parse(await fs.readFile(new URL('./impact-config.json', import.meta.url), 'utf-8'));

// Supabase setup (service role only on backend!)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const subsTable = process.env.SUBS_TABLE || 'subscriptions';
const statusColumn = process.env.STATUS_COLUMN || 'status';
const activeValue = process.env.ACTIVE_VALUE || 'active';

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

async function fetchTotalSubs() {
  // Fallback for demos if supabase is not configured
  if (!supabase) {
    return Number(process.env.SUBS_TOTAL_FIXED || 0);
  }
  const { count, error } = await supabase
    .from(subsTable)
    .select('*', { count: 'exact', head: true })
    .eq(statusColumn, activeValue);

  if (error) throw error;
  return count || 0;
}

app.get('/stats/impact-config', (req, res) => res.json(config));

app.get('/stats/suscriptores', async (req, res) => {
  try {
    const total = await fetchTotalSubs();
    res.json({ total, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('count_failed', e);
    res.status(500).json({ error: 'count_failed' });
  }
});

app.get('/stats/impact', async (req, res) => {
  try {
    const total = await fetchTotalSubs();
    const sessions = total * config.sessionsPerSubscriber;

    const residencies = Math.floor(total / config.subsPerResidency);
    const residRest = total % config.subsPerResidency;
    const residRemaining = residRest === 0 ? config.subsPerResidency : config.subsPerResidency - residRest;

    const schools = Math.floor(total / config.subsPerSchool);
    const schoolRest = total % config.subsPerSchool;
    const schoolRemaining = schoolRest === 0 ? config.subsPerSchool : config.subsPerSchool - schoolRest;

    res.json({
      total,
      sessions,
      residencies,
      residenciesRemaining: residRemaining,
      schools,
      schoolsRemaining: schoolRemaining,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('impact_failed', e);
    res.status(500).json({ error: 'impact_failed' });
  }
});

// Optional Server-Sent Events for realtime
app.get('/stats/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const push = async () => {
    try {
      const total = await fetchTotalSubs();
      const payload = JSON.stringify({ total, t: Date.now() });
      res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // keep alive
    }
  };

  const id = setInterval(push, 15000);
  req.on('close', () => clearInterval(id));
  push();
});

const port = process.env.PORT || 5055;
app.listen(port, () => console.log(`impact-counter listening on :${port}`));
