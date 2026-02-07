# SitioObra · #GatoEncerrado

Landing page para la obra transmedia *Es un gato encerrado*. El proyecto está construido con Vite + React, Tailwind y Supabase para la parte de formularios, blog y almacenamiento de assets.

## Requisitos

- Node.js 18+
- Cuenta de Supabase con Storage habilitado y las tablas usadas en los formularios (`rsvp_extended`, `blog_contributions`, `blog_posts`, etc.).
- (Opcional) Backend propio para Stripe definido en `VITE_API_URL`.

## Variables de entorno

1. Duplica `.env.example` y renómbralo a `.env`.
2. Completa los valores:

```bash
VITE_SUPABASE_URL=https://<tu-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-public-anon-key>
VITE_API_URL=https://tu-backend.com # opcional
VITE_BIENVENIDA_URL=http://localhost:5174 # app bienvenida (iframe)
```

> Estas variables se inyectan en `src/lib/supabaseClient.js`. La aplicación no iniciará si faltan.

## Scripts

```bash
npm install
npm run dev      # entorno local
npm run build    # build de producción
npm run preview  # previsualizar build
```

## Bienvenida (integración rápida)

- Ruta: `/bienvenida`
- Se muestra una sola vez por usuario autenticado.
- Configura `VITE_BIENVENIDA_URL` con la URL de la app externa (si no existe, no se activa).
- Persistencia: se guarda en storage local por usuario (`bienvenida:seen:<user_id>`).
- Comunicación opcional desde la app bienvenida:
  - `window.parent.postMessage({ type: 'bienvenida:done' }, '*')`
  - `window.parent.postMessage({ type: 'bienvenida:close' }, '*')`

### Dev local

- SitioObra: `npm run dev` (por defecto `http://localhost:5173`)
- Bienvenida: `npm run dev -- --port 5174` (o el puerto que elijas)

### Plan de migración (Fase 2, sin implementar)

1. Crear monorepo:
   - `apps/sitio-obra`
   - `apps/bienvenida`
   - `packages/shared` (tokens, UI, helpers)
2. Extraer piezas comunes (botones, tipografías, colores).
3. Unificar auth en `packages/shared-auth`.
4. Cambiar iframe por import dinámico del módulo en `sitio-obra`.

## Notas

- Asegúrate de crear las tablas mencionadas en Supabase antes de abrir la landing al público.
- Los buckets de Storage que consume la app (por ejemplo `trailers` o la galería de Instagram) deben existir y ser públicos si se usan en producción.
