# Handoff: VideoNarrativeAutoplay — video URL incorrecto en desktop

## Problema

El componente `VideoNarrativeAutoplay` siempre carga la URL vertical (móvil) aunque el usuario esté en desktop.

- **URL móvil (siempre se muestra):** `fragmento_en_produccion_web.mp4`
- **URL desktop (nunca se muestra):** `muy_pronto_hzl_web.mp4` (nombre contiene `hzl` = horizontal)

El usuario tiene `window.screen.width = 2560`. La lógica actual debería seleccionar el URL desktop, pero no lo hace.

---

## Archivos clave

| Archivo | Rol |
|---|---|
| `src/components/VideoNarrativeAutoplay.jsx` | Componente del modal de video |
| `src/components/Hero.jsx` | Padre — lo renderiza con `React.lazy` |
| `src/components/MiniverseModal.jsx` | Define `MINIVERSE_CARDS` con los datos de cada card |

---

## Estado actual del código

### `VideoNarrativeAutoplay.jsx` (lógica de selección, líneas ~19–27)

```js
const card = MINIVERSE_CARDS.find((c) => c.formatId === formatId) ?? null;
const ctaLabel = card?.narrativeCtaLabel ?? 'Continuar experiencia';

// screen.width = physical screen size, never affected by DevTools docking or viewport emulation.
const isDesktop = typeof window !== 'undefined' && window.screen.width >= 1024;
const videoUrl = isDesktop
  ? (card?.narrativeVideoUrlDesktop ?? PLACEHOLDER_VIDEO_URL_DESKTOP)
  : (card?.narrativeVideoUrl ?? PLACEHOLDER_VIDEO_URL);
```

### `MiniverseModal.jsx` — todos los campos de video son `null`

```js
narrativeVideoUrl: null,
narrativeVideoUrlDesktop: null,
```

Todos los 9 miniversos tienen ambos campos en `null`. Por lo tanto la lógica debería caer siempre en los placeholders:
- `null ?? PLACEHOLDER_VIDEO_URL_DESKTOP` → `PLACEHOLDER_VIDEO_URL_DESKTOP` ✓

### `Hero.jsx` — cómo se carga el componente

```jsx
const VideoNarrativeAutoplay = React.lazy(
  () => import('@/components/VideoNarrativeAutoplay')
);

// ...dentro del return:
<Suspense fallback={null}>
  <VideoNarrativeAutoplay
    open={isAutoVideoOpen}
    onClose={() => setIsAutoVideoOpen(false)}
    formatId={autoVideoFormatId}
    isMobileViewport={isMobileViewport}
  />
</Suspense>
```

`isMobileViewport` en Hero.jsx se inicializa con:
```js
const [isMobileViewport, setIsMobileViewport] = useState(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 768px)').matches;
});
```
**Potencial problema:** no hay listener de resize visible en el snippet revisado. Si no se actualiza en resize, el valor queda stale.

---

## Diagnóstico

### Evidencia del bug

El DevTools del browser muestra en el DOM:
```html
<div class="fixed inset-0 z-[176] bg-black">
```

El archivo fuente tiene:
```jsx
className="fixed inset-0 z-[800] bg-black"
```

**`z-[176]` ≠ `z-[800]`** → el browser está ejecutando una versión del componente que NO corresponde al archivo fuente actual. Ni el hard refresh del browser ni el restart del servidor Vite resolvieron esto.

### Hipótesis principal

El componente está cargado con `React.lazy`. En algunos escenarios Vite + React.lazy, el chunk del componente queda "congelado" en memoria y no refleja los cambios del archivo fuente aunque HMR notifique la actualización. El módulo que el browser ejecuta podría estar viniendo de:

1. Un chunk de `dist/` servido estáticamente en paralelo al dev server
2. El caché del optimizador de Vite (`node_modules/.vite/deps`)
3. Un service worker registrado que intercepta las peticiones del módulo

---

## Lo que hay que hacer

### Opción A — Fix en Hero.jsx (recomendada, más robusta)

Mover la lógica de selección de URL al padre (`Hero.jsx`) donde el viewport está bien manejado, y pasar la URL resuelta como prop:

**En Hero.jsx:**
```js
// Junto a donde se define isMobileViewport, agregar:
const narrativeVideoUrl = isMobileViewport
  ? null   // o la URL móvil específica del formatId si existe
  : PLACEHOLDER_VIDEO_URL_DESKTOP;
```

O mejor: que `VideoNarrativeAutoplay` reciba directamente `videoUrl` como prop y elimine toda la lógica de detección interna.

**En VideoNarrativeAutoplay.jsx:**
```jsx
const VideoNarrativeAutoplay = ({ open, onClose, formatId, isMobileViewport, videoUrl: videoUrlProp }) => {
  // ...
  const card = MINIVERSE_CARDS.find((c) => c.formatId === formatId) ?? null;
  const videoUrl = videoUrlProp
    ?? (isMobileViewport
      ? (card?.narrativeVideoUrl ?? PLACEHOLDER_VIDEO_URL)
      : (card?.narrativeVideoUrlDesktop ?? PLACEHOLDER_VIDEO_URL_DESKTOP));
```

Pasar el prop desde Hero.jsx usando `isMobileViewport` que ya existe y está bien gestionado en ese componente.

### Opción B — Investigar y eliminar el módulo congelado

1. Verificar si hay un service worker registrado: DevTools → Application → Service Workers → Unregister all
2. Eliminar el caché de Vite: `rm -rf node_modules/.vite && npm run dev`
3. Verificar si hay un servidor estático sirviendo `dist/` en el mismo puerto

### Opción C — Forzar re-evaluación con key prop

En Hero.jsx, forzar que el componente se remonte cuando cambia `formatId` o `isAutoVideoOpen`:

```jsx
<VideoNarrativeAutoplay
  key={`${autoVideoFormatId}-${isAutoVideoOpen}`}
  open={isAutoVideoOpen}
  ...
/>
```

Esto forza un unmount/remount completo, lo que garantiza que el código más reciente se ejecute.

---

## Contexto adicional

- Build siempre se verifica con `npm run build` (no hay test suite)
- Stack: React + Vite (JSX puro, sin TypeScript)
- Imports usan alias `@/` → `/src`
- El componente es parte de una landing transmedia (`#GatoEncerrado`)
- `isMobileViewport` en Hero.jsx controla también la navegación post-CTA (portal móvil vs evento de escritorio), no solo el video URL — cualquier cambio debe mantener esa lógica intacta
