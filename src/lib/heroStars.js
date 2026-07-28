export const createHeroStars = (starCount) =>
  Array.from({ length: starCount }).map((_, index) => {
    const isBrightStar = index % 7 === 0;
    return {
      id: index,
      size: isBrightStar ? Math.random() * 1.35 + 1.15 : Math.random() * 0.85 + 0.75,
      opacity: isBrightStar ? Math.random() * 0.28 + 0.58 : Math.random() * 0.28 + 0.28,
      x: Math.random() * 100,
      y: Math.random() * 100,
      glow: isBrightStar ? 1 : 0,
      twinkle: isBrightStar,
      twinkleDelay: Math.random() * 7,
      twinkleDuration: 3.2 + Math.random() * 3.4,
    };
  });
