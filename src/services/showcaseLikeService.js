import { supabase } from '@/lib/supabaseClient';

export async function recordShowcaseLike({ showcaseId, user }) {
  if (!showcaseId) {
    return { success: false, error: new Error('Falta el identificador del showcase') };
  }

  const payload = {
    showcase_id: showcaseId,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    metadata: {
      recorded_at: new Date().toISOString(),
    },
  };

  const { error } = await supabase.from('showcase_likes').insert(payload);
  return { success: !error, error };
}
