import { useEffect, useRef, useState } from "react";

export function useHideIconsOnScroll() {
  const [iconsVisible, setIconsVisible] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const isTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints ?? 0) > 0 ||
      (navigator.msMaxTouchPoints ?? 0) > 0;

    if (!isTouch) {
      return undefined;
    }

    const hideIconsTemporarily = () => {
      setIconsVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIconsVisible(true);
      }, 500);
    };

    window.addEventListener("touchstart", hideIconsTemporarily, { passive: true });
    window.addEventListener("touchmove", hideIconsTemporarily, { passive: true });

    return () => {
      window.removeEventListener("touchstart", hideIconsTemporarily);
      window.removeEventListener("touchmove", hideIconsTemporarily);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return iconsVisible;
}
