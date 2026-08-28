const STAR_TIERS = {
  dust: {
    minSize: 0.45,
    sizeRange: 0.45,
    minOpacity: 0.16,
    opacityRange: 0.22,
    glow: 0,
    twinkle: false,
  },
  mid: {
    minSize: 1,
    sizeRange: 0.6,
    minOpacity: 0.28,
    opacityRange: 0.26,
    glow: 0.28,
    twinkle: false,
  },
  anchor: {
    minSize: 2,
    sizeRange: 1.2,
    minOpacity: 0.56,
    opacityRange: 0.26,
    glow: 1,
    twinkle: true,
  },
};

const pickTier = () => {
  const roll = Math.random();
  if (roll < 0.06) return 'anchor';
  if (roll < 0.3) return 'mid';
  return 'dust';
};

export const createHeroStars = (starCount) =>
  Array.from({ length: starCount }).map((_, index) => {
    const tier = pickTier();
    const definition = STAR_TIERS[tier];
    const isAnchor = tier === 'anchor';
    // Las estrellas grandes enmarcan la escena desde los laterales y la zona
    // superior; no atraviesan la cara, el título ni el gatillo central.
    const x = isAnchor
      ? Math.random() < 0.5
        ? Math.random() * 28
        : 72 + Math.random() * 28
      : Math.random() * 100;
    const y = isAnchor ? Math.random() * 68 : Math.random() * 100;

    return {
      id: index,
      tier,
      size: Math.random() * definition.sizeRange + definition.minSize,
      opacity: Math.random() * definition.opacityRange + definition.minOpacity,
      x,
      y,
      glow: definition.glow,
      twinkle: definition.twinkle,
      twinkleDelay: Math.random() * 7,
      twinkleDuration: 3.2 + Math.random() * 3.4,
    };
  });
