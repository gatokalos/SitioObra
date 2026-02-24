import { supabasePublic } from '@/lib/supabaseClient';

const pickFirstRow = (data) => {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
};

export async function fetchFocusAppMetadata(focusRaw) {
  const safeFocus = typeof focusRaw === 'string' ? focusRaw.trim() : '';
  if (!safeFocus) return { metadata: null, error: null };

  const { data, error } = await supabasePublic.rpc('get_focus_app_metadata', {
    p_focus: safeFocus,
  });

  if (error) return { metadata: null, error };

  const row = pickFirstRow(data);
  if (!row || typeof row !== 'object') return { metadata: null, error: null };

  return {
    metadata: {
      focusInput: typeof row.focus_input === 'string' ? row.focus_input : safeFocus,
      appId: typeof row.app_id === 'string' ? row.app_id : null,
      showcaseId: typeof row.showcase_id === 'string' ? row.showcase_id : null,
      appSlug: typeof row.app_slug === 'string' ? row.app_slug : null,
      title: typeof row.title === 'string' ? row.title : null,
      description: typeof row.description === 'string' ? row.description : null,
      imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
      ctaLabel: typeof row.cta_label === 'string' ? row.cta_label : null,
      ctaUrl: typeof row.cta_url === 'string' ? row.cta_url : null,
      gatokensMin: Number.isFinite(row.gatokens_min) ? Number(row.gatokens_min) : null,
      gatokensMax: Number.isFinite(row.gatokens_max) ? Number(row.gatokens_max) : null,
      tags: Array.isArray(row.tags) ? row.tags.filter((value) => typeof value === 'string') : [],
      priority: Number.isFinite(row.priority) ? Number(row.priority) : null,
    },
    error: null,
  };
}
