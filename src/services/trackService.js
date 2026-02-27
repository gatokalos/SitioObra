import { ensureAnonId, touchAnonSession } from '@/lib/identity';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function trackInteraction({
  action_type,
  anon_id,
  context = {},
  metadata = {},
}) {
  if (!action_type) {
    return { success: false, error: new Error('action_type is required') };
  }

  await touchAnonSession();
  const resolvedAnonId = anon_id ?? ensureAnonId();

  if (!resolvedAnonId) {
    return { success: false, error: new Error('anon_id is required for interactions') };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: new Error('Missing Supabase configuration for interactions') };
  }

  const safeContext = context && typeof context === 'object' ? context : {};
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        action_type,
        anon_id: resolvedAnonId,
        context: safeContext,
        metadata: safeMetadata,
      }),
    });

    if (!response.ok) {
      let details = null;
      try {
        details = await response.json();
      } catch (error) {
        details = await response.text();
      }

      const error = new Error(
        `trackInteraction failed with status ${response.status} (${response.statusText})`
      );
      if (details) {
        error.details = details;
      }
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}
