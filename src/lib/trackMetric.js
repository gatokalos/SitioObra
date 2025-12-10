import { supabase } from '@/lib/supabaseClient';
import { EMAIL_REDIRECT_METRICS_TABLE } from '@/lib/emailRedirectConfig';

export const trackMetric = async (eventName, source, emailHash = null) => {
  const payload = {
    event_name: eventName,
    source,
    metadata: emailHash ? { email_hash: emailHash } : null,
  };

  const { error } = await supabase.from(EMAIL_REDIRECT_METRICS_TABLE).insert(payload);

  if (error) {
    console.error('[trackMetric] supabase error', { payload, error });
  } else {
    console.debug('[trackMetric] OK', payload);
  }
};
