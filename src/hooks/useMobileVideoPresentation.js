import { useCallback, useEffect, useState } from "react";

export function useMobileVideoPresentation() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [inlineAllowedIds, setInlineAllowedIds] = useState(() => new Set());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = (event) => setIsMobileViewport(event.matches);

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setInlineAllowedIds(new Set());
    }
  }, [isMobileViewport]);

  const allowInlinePlayback = useCallback((videoId) => {
    if (!videoId) {
      return;
    }

    setInlineAllowedIds((prev) => {
      if (prev.has(videoId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });
  }, []);

  const canUseInlinePlayback = useCallback(
    (videoId) => {
      if (!isMobileViewport) {
        return true;
      }

      if (!videoId) {
        return true;
      }

      return inlineAllowedIds.has(videoId);
    },
    [inlineAllowedIds, isMobileViewport]
  );

  const requestMobileVideoPresentation = useCallback(
    async (event, videoId, options = {}) => {
      const { onPresentation } = options;

      if (!isMobileViewport) {
        return "inline";
      }

      event.preventDefault();
      event.stopPropagation();

      const video = event.currentTarget;
      if (!(video instanceof HTMLVideoElement)) {
        return "inline";
      }

      const ensurePlayback = async () => {
        if (video.paused || video.readyState < 2) {
          await video.play();
        }
      };

      const canUsePiP =
        typeof document !== "undefined" &&
        "pictureInPictureEnabled" in document &&
        document.pictureInPictureEnabled &&
        typeof video.requestPictureInPicture === "function" &&
        !video.disablePictureInPicture;

      if (canUsePiP) {
        try {
          await ensurePlayback();
          await video.requestPictureInPicture();
          onPresentation?.("pip");
          return "pip";
        } catch (error) {
          /* Continue to fullscreen fallback. */
        }
      }

      const fullscreenRequest =
        video.requestFullscreen ||
        video.webkitEnterFullscreen ||
        video.webkitRequestFullscreen ||
        video.mozRequestFullScreen ||
        video.msRequestFullscreen;

      if (fullscreenRequest) {
        try {
          await ensurePlayback();
          await fullscreenRequest.call(video);
          onPresentation?.("fullscreen");
          return "fullscreen";
        } catch (error) {
          /* Continue to inline fallback. */
        }
      }

      allowInlinePlayback(videoId);
      video.controls = true;

      try {
        await ensurePlayback();
      } catch (error) {
        /* If playback fails, silently allow the default behavior. */
      }

      onPresentation?.("inline");
      return "inline";
    },
    [allowInlinePlayback, isMobileViewport]
  );

  return {
    isMobileViewport,
    canUseInlinePlayback,
    requestMobileVideoPresentation,
  };
}
