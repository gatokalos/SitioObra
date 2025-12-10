import { supabase } from '@/lib/supabaseClient';
import { getAnonId } from '@/lib/identity';
import { track } from '@/services/trackService';

export async function recordShowcaseLike({ showcaseId, user }) {
  if (!showcaseId) {
    return { success: false, error: new Error('Falta el identificador del showcase') };
  }

  const anonId = getAnonId();
  const metadata = {
    recorded_at: new Date().toISOString(),
    ...(anonId ? { anon_id: anonId } : {}),
  };

  const payload = {
    showcase_id: showcaseId,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    metadata,
  };

  const { error } = await supabase.from('showcase_likes').insert(payload);

  const { error: trackError } = await track('showcase_like', {
    showcase_id: showcaseId,
    user_id: user?.id ?? null,
    metadata,
  });

  if (trackError) {
    console.error('showcaseLikeService track error', trackError);
  }
  return { success: !error, error };
}
