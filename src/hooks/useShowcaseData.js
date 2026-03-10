import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchApprovedContributions } from '@/services/contributionService';
import {
  BLOG_MINIVERSO_KEYS_BY_SHOWCASE,
  TOPIC_BY_SHOWCASE,
  CONTRIBUTION_CATEGORY_BY_SHOWCASE,
} from '@/components/transmedia/transmediaConstants';

/**
 * Manages showcase-level data: latest blog posts, public contributions,
 * and reading badge interaction state.
 *
 * @param {object} deps
 * @param {Function} deps.navigateToCuratorial
 * @param {boolean}  deps.isMobileViewport
 */
const useShowcaseData = ({ navigateToCuratorial, isMobileViewport }) => {
  const [latestBlogPostByShowcase, setLatestBlogPostByShowcase] = useState({});
  const [publicContributions, setPublicContributions] = useState({});
  const [publicContributionsLoading, setPublicContributionsLoading] = useState({});
  const [publicContributionsError, setPublicContributionsError] = useState({});
  const [readingTooltipForShowcase, setReadingTooltipForShowcase] = useState(null);
  const [readingTapArmedByShowcase, setReadingTapArmedByShowcase] = useState({});
  const [readingGlowDismissedByShowcase, setReadingGlowDismissedByShowcase] = useState({});

  // Load latest blog posts keyed by showcase on mount
  useEffect(() => {
    let cancelled = false;
    const loadLatestBlogPostsByMiniverso = async () => {
      const allMiniversoKeys = Array.from(
        new Set(
          Object.values(BLOG_MINIVERSO_KEYS_BY_SHOWCASE)
            .flat()
            .map((item) => item?.trim?.().toLowerCase())
            .filter(Boolean)
        )
      );
      if (!allMiniversoKeys.length) return;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .not('slug', 'is', null)
        .not('miniverso', 'is', null)
        .in('miniverso', allMiniversoKeys)
        .order('published_at', { ascending: false });

      if (cancelled || error) {
        if (error) {
          console.warn('[Transmedia] No se pudo cargar la disponibilidad de lecturas:', error);
        }
        return;
      }

      const latestByMiniverso = {};
      (data ?? []).forEach((post) => {
        const key = post?.miniverso?.trim?.().toLowerCase();
        if (!key || latestByMiniverso[key]) return;
        latestByMiniverso[key] = post;
      });

      const latestByShowcase = {};
      Object.entries(BLOG_MINIVERSO_KEYS_BY_SHOWCASE).forEach(([showcaseId, keys]) => {
        const match = keys
          .map((key) => latestByMiniverso[key?.trim?.().toLowerCase()])
          .find(Boolean);
        if (match) latestByShowcase[showcaseId] = match;
      });

      if (!cancelled) setLatestBlogPostByShowcase(latestByShowcase);
    };

    loadLatestBlogPostsByMiniverso();
    return () => { cancelled = true; };
  }, []);

  const getTopicForShowcase = useCallback(
    (showcaseId) => TOPIC_BY_SHOWCASE[showcaseId] ?? showcaseId,
    []
  );

  const getContributionCategoryForShowcase = useCallback(
    (showcaseId) => CONTRIBUTION_CATEGORY_BY_SHOWCASE[showcaseId] ?? showcaseId,
    []
  );

  const fetchPublicComments = useCallback(
    async (showcaseId) => {
      if (!showcaseId) return;
      const topic = getTopicForShowcase(showcaseId);
      setPublicContributionsLoading((prev) => ({ ...prev, [showcaseId]: true }));
      setPublicContributionsError((prev) => ({ ...prev, [showcaseId]: null }));
      const { data, error } = await fetchApprovedContributions(topic);
      if (error) {
        console.error('Error fetching contributions', { showcaseId, error });
        setPublicContributionsError((prev) => ({
          ...prev,
          [showcaseId]: 'No pudimos cargar comentarios.',
        }));
      } else {
        setPublicContributions((prev) => ({ ...prev, [showcaseId]: data || [] }));
      }
      setPublicContributionsLoading((prev) => ({ ...prev, [showcaseId]: false }));
    },
    [getTopicForShowcase]
  );

  const handleOpenLatestBlogForShowcase = useCallback(
    (showcaseId) => {
      const post = latestBlogPostByShowcase[showcaseId];
      if (!post?.slug) return;
      navigateToCuratorial(post.slug);
    },
    [latestBlogPostByShowcase, navigateToCuratorial]
  );

  const handleReadingBadgeClick = useCallback(
    (showcaseId) => {
      const post = latestBlogPostByShowcase[showcaseId];
      if (!post?.slug) return;

      if (!isMobileViewport) {
        handleOpenLatestBlogForShowcase(showcaseId);
        return;
      }

      const isAlreadyArmed = Boolean(readingTapArmedByShowcase[showcaseId]);
      if (!isAlreadyArmed) {
        setReadingGlowDismissedByShowcase((prev) => ({ ...prev, [showcaseId]: true }));
        setReadingTapArmedByShowcase((prev) => ({ ...prev, [showcaseId]: true }));
        setReadingTooltipForShowcase(showcaseId);
        window.setTimeout(() => {
          setReadingTooltipForShowcase((prev) => (prev === showcaseId ? null : prev));
        }, 2200);
        return;
      }

      handleOpenLatestBlogForShowcase(showcaseId);
      window.setTimeout(() => {
        setReadingTooltipForShowcase((prev) => (prev === showcaseId ? null : prev));
      }, 2200);
    },
    [handleOpenLatestBlogForShowcase, isMobileViewport, latestBlogPostByShowcase, readingTapArmedByShowcase]
  );

  return {
    latestBlogPostByShowcase,
    publicContributions,
    publicContributionsLoading,
    publicContributionsError,
    readingTooltipForShowcase,
    readingTapArmedByShowcase,
    readingGlowDismissedByShowcase,
    getTopicForShowcase,
    getContributionCategoryForShowcase,
    fetchPublicComments,
    handleOpenLatestBlogForShowcase,
    handleReadingBadgeClick,
  };
};

export default useShowcaseData;
