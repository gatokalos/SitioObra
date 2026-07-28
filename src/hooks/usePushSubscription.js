import { useCallback } from 'react';
import { isInstalledPWA } from '@/lib/pwaDetection';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_BASE = (import.meta.env.VITE_OBRA_API_URL ?? 'https://api.gatoencerrado.ai').replace(/\/+$/, '');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// Solo se activa si el usuario está en la PWA instalada.
// No muestra ningún UI propio — la única fricción posible es el diálogo nativo del navegador.
// Si falla por cualquier razón, falla en silencio: WhatsApp cubre el fallback.
export function usePushSubscription() {
  const autoSubscribeIfPWA = useCallback(async ({ anonId, miniversoId, bienvenidaAnonId } = {}) => {
    if (!isInstalledPWA()) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;
    if (!VAPID_PUBLIC_KEY) return;

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await fetch(`${API_BASE}/api/bitacora/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anon_id: anonId,
          miniverso_id: miniversoId,
          canal: 'push',
          push_token: JSON.stringify(subscription),
          bienvenida_anon_id: bienvenidaAnonId ?? null,
        }),
      });
    } catch {
      // Silencioso — no interrumpir la experiencia del usuario
    }
  }, []);

  return { autoSubscribeIfPWA };
}
