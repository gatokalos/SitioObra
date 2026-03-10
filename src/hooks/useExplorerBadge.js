import { useState, useEffect, useCallback, useRef } from 'react';
import { safeSetItem } from '@/lib/safeStorage';
import {
  EXPLORER_BADGE_STORAGE_KEY,
  EXPLORER_BADGE_REWARD,
  DEFAULT_BADGE_STATE,
  readStoredJson,
} from '@/components/transmedia/transmediaConstants';

/**
 * Manages the Explorer Badge unlock, reward claiming, celebration, and
 * the showcase reveal boost (which shares the celebratedShowcaseId state).
 *
 * @param {object} deps
 * @param {boolean}  deps.allShowcasesUnlocked
 * @param {boolean}  deps.isSubscriber
 * @param {object}   deps.showcaseBoosts
 * @param {object}   deps.baseEnergyByShowcase
 * @param {Function} deps.trackTransmediaCreditEvent
 * @param {Function} deps.setIsContributionOpen
 */
const useExplorerBadge = ({
  allShowcasesUnlocked,
  isSubscriber,
  showcaseBoosts,
  baseEnergyByShowcase,
  trackTransmediaCreditEvent,
  setIsContributionOpen,
}) => {
  const storedBadge = readStoredJson(EXPLORER_BADGE_STORAGE_KEY, null);
  const initialExplorerBadge = storedBadge ? { ...DEFAULT_BADGE_STATE, ...storedBadge } : DEFAULT_BADGE_STATE;

  const [explorerBadge, setExplorerBadge] = useState(initialExplorerBadge);
  const [showBadgeCoins, setShowBadgeCoins] = useState(false);
  const [showBadgeLoginOverlay, setShowBadgeLoginOverlay] = useState(false);
  const [hasLoadedBadgeLoginOverlay, setHasLoadedBadgeLoginOverlay] = useState(false);
  const [celebratedShowcaseId, setCelebratedShowcaseId] = useState(null);
  const celebrationTimeoutRef = useRef(null);
  const badgeCoinsTimeoutRef = useRef(null);

  // Persist badge to localStorage
  useEffect(() => {
    safeSetItem(EXPLORER_BADGE_STORAGE_KEY, JSON.stringify(explorerBadge));
  }, [explorerBadge]);

  // Lazy-load badge login overlay
  useEffect(() => {
    if (showBadgeLoginOverlay) setHasLoadedBadgeLoginOverlay(true);
  }, [showBadgeLoginOverlay]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
      if (badgeCoinsTimeoutRef.current) clearTimeout(badgeCoinsTimeoutRef.current);
    };
  }, []);

  // Auto-unlock badge when all showcases are revealed
  useEffect(() => {
    if (!allShowcasesUnlocked || explorerBadge.unlocked) return;
    setExplorerBadge((prev) => ({ ...prev, unlocked: true, unlockedAt: Date.now() }));
  }, [allShowcasesUnlocked, explorerBadge.unlocked]);

  const handleBadgeLogin = useCallback(() => {
    setShowBadgeLoginOverlay(true);
  }, []);

  const handleCloseBadgeLogin = useCallback(() => {
    setShowBadgeLoginOverlay(false);
  }, []);

  const handleBadgeSubscribe = useCallback(() => {
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsContributionOpen(true);
  }, [setIsContributionOpen]);

  const handleExplorerReward = useCallback(
    async (rewardType = 'subscriber') => {
      if (!allShowcasesUnlocked || explorerBadge.rewardClaimed) return;
      const rewardAmount = rewardType === 'subscriber' ? EXPLORER_BADGE_REWARD : 0;
      if (rewardAmount <= 0) return;
      const eventKey =
        rewardType === 'subscriber' ? 'explorer_badge_reward_subscriber' : 'explorer_badge_reward_guest';
      const result = await trackTransmediaCreditEvent({
        eventKey,
        amount: rewardAmount,
        oncePerIdentity: true,
        metadata: { source: 'transmedia_explorer_badge' },
      });
      if (!result.ok) return;
      setShowBadgeCoins(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: 'explorer-badge', boost: true, amount: rewardAmount },
          })
        );
      }
      setExplorerBadge((prev) => ({
        ...prev,
        rewardClaimed: true,
        claimedType: rewardType,
        claimedAt: Date.now(),
      }));
      if (badgeCoinsTimeoutRef.current) clearTimeout(badgeCoinsTimeoutRef.current);
      badgeCoinsTimeoutRef.current = setTimeout(() => setShowBadgeCoins(false), 1300);
    },
    [allShowcasesUnlocked, explorerBadge.rewardClaimed, trackTransmediaCreditEvent]
  );

  // Auto-claim subscriber reward when eligible
  useEffect(() => {
    if (!allShowcasesUnlocked || !isSubscriber || explorerBadge.rewardClaimed) return;
    handleExplorerReward('subscriber');
  }, [allShowcasesUnlocked, explorerBadge.rewardClaimed, handleExplorerReward, isSubscriber]);

  const handleShowcaseRevealBoost = useCallback(
    async (showcaseId) => {
      if (!showcaseId || showcaseBoosts?.[showcaseId]) return;
      const boostAmount = baseEnergyByShowcase[showcaseId] ?? 0;
      if (!boostAmount) return;
      const result = await trackTransmediaCreditEvent({
        eventKey: `showcase_boost:${showcaseId}`,
        amount: boostAmount,
        oncePerIdentity: true,
        metadata: { source: 'transmedia_showcase_reveal', showcaseId },
      });
      if (!result.ok) return;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('gatoencerrado:miniverse-spent', {
            detail: { id: showcaseId, boost: true, amount: boostAmount },
          })
        );
      }
      setCelebratedShowcaseId(showcaseId);
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = setTimeout(() => {
        setCelebratedShowcaseId((current) => (current === showcaseId ? null : current));
      }, 1400);
    },
    [baseEnergyByShowcase, showcaseBoosts, trackTransmediaCreditEvent]
  );

  return {
    explorerBadge,
    setExplorerBadge,
    showBadgeCoins,
    setShowBadgeCoins,
    showBadgeLoginOverlay,
    hasLoadedBadgeLoginOverlay,
    celebratedShowcaseId,
    setCelebratedShowcaseId,
    handleBadgeLogin,
    handleCloseBadgeLogin,
    handleBadgeSubscribe,
    handleExplorerReward,
    handleShowcaseRevealBoost,
  };
};

export default useExplorerBadge;
