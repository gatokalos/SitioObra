import { useEffect, useRef } from 'react';

/**
 * Locks/restores body scroll when the cinematic showcase is open,
 * and closes it on Escape key press.
 *
 * @param {object}   deps
 * @param {boolean}  deps.isCinematicShowcaseOpen
 * @param {boolean}  deps.isMiniverseShelved
 * @param {Function} deps.handleCloseShowcase
 */
const useBodyScrollLock = ({ isCinematicShowcaseOpen, isMiniverseShelved, handleCloseShowcase }) => {
  const scrollLockYRef = useRef(0);
  const wasCinematicOpenRef = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const shouldLockBackgroundScroll = isCinematicShowcaseOpen && !isMiniverseShelved;

    if (shouldLockBackgroundScroll) {
      wasCinematicOpenRef.current = true;
      scrollLockYRef.current = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollLockYRef.current}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      return;
    }

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    document.documentElement.style.overflow = '';

    if (wasCinematicOpenRef.current) {
      window.scrollTo(0, scrollLockYRef.current || 0);
    }
    wasCinematicOpenRef.current = false;
    scrollLockYRef.current = 0;
  }, [isCinematicShowcaseOpen, isMiniverseShelved]);

  // Cleanup scroll styles on unmount
  useEffect(
    () => () => {
      const html = document.documentElement;
      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      body.classList.remove('overflow-hidden');
      html.style.overflow = '';
    },
    [],
  );

  // Escape key closes the showcase
  useEffect(() => {
    if (!isCinematicShowcaseOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseShowcase();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseShowcase, isCinematicShowcaseOpen]);
};

export default useBodyScrollLock;
