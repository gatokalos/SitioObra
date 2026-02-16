import { ensureAnonId } from '@/lib/identity';
import { supabasePublic } from '@/lib/supabaseClient';

export const MINIVERSE_HOME_EVENT_TYPES = {
  APP_CLICK: 'app_click',
  HOME_SHARE: 'home_share',
  OPEN_TRANSMEDIA: 'open_transmedia',
};

const FALLBACK_TOP_APPS = ['drama', 'cine', 'oraculo'];

export async function trackMiniverseHomeEvent({
  eventType,
  appId = null,
  source = 'miniverse_modal',
  metadata = {},
} = {}) {
  if (!eventType) return { success: false, error: new Error('eventType is required') };

  const anonId = ensureAnonId();
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};

  const { error } = await supabasePublic.rpc('track_miniverse_home_event', {
    p_event_type: eventType,
    p_app_id: appId,
    p_anon_id: anonId,
    p_source: source,
    p_metadata: safeMetadata,
  });

  if (error) return { success: false, error };
  return { success: true, error: null };
}

export async function fetchTopMiniverseApps(limit = 3) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(9, Number(limit))) : 3;
  const { data, error } = await supabasePublic.rpc('get_miniverse_home_top_apps', {
    p_limit: safeLimit,
  });

  if (error) {
    return { appIds: FALLBACK_TOP_APPS.slice(0, safeLimit), error };
  }

  const appIds = Array.isArray(data)
    ? data.map((row) => row?.app_id).filter((value) => typeof value === 'string' && value.length > 0)
    : [];

  return {
    appIds: appIds.length ? appIds.slice(0, safeLimit) : FALLBACK_TOP_APPS.slice(0, safeLimit),
    error: null,
  };
}
