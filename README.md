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
```

> Estas variables se inyectan en `src/lib/supabaseClient.js`. La aplicación no iniciará si faltan.

## Scripts

```bash
npm install
npm run dev      # entorno local
npm run build    # build de producción
npm run preview  # previsualizar build
```

## Notas

- Asegúrate de crear las tablas mencionadas en Supabase antes de abrir la landing al público.
- Los buckets de Storage que consume la app (por ejemplo `trailers` o la galería de Instagram) deben existir y ser públicos si se usan en producción.
