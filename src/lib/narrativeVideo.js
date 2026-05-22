export const NARRATIVE_VIDEO_URL_MOBILE =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/trailers/fragmento_en_produccion_web.mp4';

export const NARRATIVE_VIDEO_URL_DESKTOP =
  'https://ytubybkoucltwnselbhc.supabase.co/storage/v1/object/public/Cine%20-%20teasers/muy_pronto_hzl_web.mp4';

export const resolveNarrativeVideoUrl = ({ card, isMobileViewport, videoUrl } = {}) => {
  if (videoUrl) return videoUrl;

  return isMobileViewport
    ? (card?.narrativeVideoUrl ?? NARRATIVE_VIDEO_URL_MOBILE)
    : (card?.narrativeVideoUrlDesktop ?? NARRATIVE_VIDEO_URL_DESKTOP);
};
