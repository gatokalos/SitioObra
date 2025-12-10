import { supabase } from '@/lib/supabaseClient';
import { getAnonId, touchAnonSession } from '@/lib/identity';

export async function track(actionType, metadata = {}) {
  await touchAnonSession();
  const anon_id = getAnonId();

  const payload = {
    action_type: actionType,
    anon_id,
    metadata: {
      ...metadata,
      ...(anon_id ? { anon_id } : {}),
    },
  };

  return supabase.from('interactions').insert(payload);
}
