export const isSafariBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isSafari = /Safari/i.test(ua);
  const isNonSafariWebkit = /Chrome|CriOS|Chromium|Edg|OPR|Android/i.test(ua);
  return isSafari && !isNonSafariWebkit;
};
