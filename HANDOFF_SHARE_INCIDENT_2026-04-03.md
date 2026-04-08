# Handoff: Share / OG Incident Review

Fecha de revisión: 2026-04-03 / 2026-04-04 UTC
Workspace: `/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra`

## Resumen Ejecutivo

Se revisó la hipótesis de que "todas las ligas del blog dirigen al mismo artículo", específicamente:

- `https://universogatoencerrado.com/blog/cartografia-emocional-de-silvestre`

Resultado de la revisión:

- No pude reproducir un colapso general de rutas del blog a nivel servidor.
- Sí hay cambios recientes en metadata social y prerender del blog que afectan cómo las plataformas resuelven previews.
- Sí hay una inconsistencia vigente en producción: la home publica `og:url` e `og:image` con `https://esungatoencerrado.com`, mientras los artículos prerenderizados usan `https://universogatoencerrado.com/blog/<slug>`.
- No existe ningún hardcode de `cartografia-emocional-de-silvestre` en el source actual.

## Estado Del Repo

Al momento de esta revisión:

- `git status --short` devuelve limpio.
- No hay cambios locales sin commit.

## Qué Cambios Relevantes Existen Hoy

### 1. Cambio en metadata base de la home

Archivo:

- [index.html](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/index.html)

Líneas relevantes actuales:

- [index.html](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/index.html#L22)
- [index.html](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/index.html#L30)

Metadata actual:

- `og:image = https://esungatoencerrado.com/assets/logoapp.png`
- `og:url = https://esungatoencerrado.com`
- `twitter:image = https://esungatoencerrado.com/assets/logoapp.png`

Esto está en producción hoy. Se confirmó por `curl`:

- `https://universogatoencerrado.com/` devuelve `og:url = https://esungatoencerrado.com`

Ese estado no coincide con el dominio de los artículos prerenderizados.

### 2. Cambio en el fallback social del blog

Archivos:

- [scripts/prerender-blog.mjs](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/scripts/prerender-blog.mjs#L44)
- [src/pages/BlogPostPage.jsx](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/pages/BlogPostPage.jsx#L8)

El fallback anterior `social-card.jpg` fue reemplazado por:

- `/assets/logoapp.png`

Además se agregaron:

- `og:site_name`
- `og:image:secure_url`
- `og:image:type`

Esto cambia el comportamiento de fallback de previews cuando una plataforma no toma bien la imagen editorial del artículo.

### 3. Cambio en el formato de salida del prerender

Antes:

- `dist/blog/<slug>/index.html`

Ahora:

- `dist/blog/<slug>.html`

Archivos:

- [scripts/prerender-blog.mjs](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/scripts/prerender-blog.mjs#L180)
- [public/.htaccess](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/public/.htaccess#L5)

Rewrite actual:

- `/blog/slug` -> `/blog/slug.html`

## Commits Relevantes

### `8bfc46cb` - `fix`

Cambios:

- reemplazo de fallback `social-card.jpg` por `logoapp.png`
- agregado de `og:image:secure_url`
- agregado de `og:image:type`
- eliminación de `og:image:width` y `og:image:height` en artículos prerenderizados

Archivo afectado:

- [scripts/prerender-blog.mjs](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/scripts/prerender-blog.mjs)

### `da251918` - `facebook debug blog`

Cambios:

- prerender del blog cambió de `dist/blog/<slug>/index.html` a `dist/blog/<slug>.html`
- `.htaccess` cambió el rewrite para apuntar a `slug.html`

Archivos afectados:

- [scripts/prerender-blog.mjs](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/scripts/prerender-blog.mjs)
- [public/.htaccess](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/public/.htaccess)

### `7ce2b3c4` - `facebook debug blog 2`

Cambios:

- se agregaron reglas para desactivar `mod_security`

Archivo afectado:

- [public/.htaccess](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/public/.htaccess)

### `1996c0dd` - `facebook debug fix`

Cambios:

- se eliminaron las reglas de `mod_security` del `.htaccess`
- se modificó la metadata base de [index.html](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/index.html) para usar `https://esungatoencerrado.com`

Archivo afectado:

- [index.html](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/index.html)

## Qué Sí Pude Reproducir

### Producción sirve artículos distintos por slug

Probado con:

- `https://universogatoencerrado.com/blog/cartografia-emocional-de-silvestre`
- `https://universogatoencerrado.com/blog/plano-a-plano`
- `https://universogatoencerrado.com/blog/causa-social-gato-encerrado`

Resultado:

- cada URL responde `200`
- cada URL devuelve su propio `<title>`
- cada URL devuelve su propio `og:title`
- cada URL devuelve su propio `og:url`
- cada URL devuelve su propio `<link rel="canonical">`

Ejemplos verificados:

- `cartografia...` devuelve canonical a `.../blog/cartografia-emocional-de-silvestre`
- `plano-a-plano` devuelve canonical a `.../blog/plano-a-plano`
- `causa-social...` devuelve canonical a `.../blog/causa-social-gato-encerrado`

Conclusión:

- no se reprodujo un redirect global o un rewrite general del servidor hacia `cartografia-emocional-de-silvestre`

## Qué No Pude Reproducir

No encontré evidencia de que:

- cualquier slug de `/blog/<slug>` redireccione físicamente al slug `cartografia-emocional-de-silvestre`
- exista un hardcode de `cartografia-emocional-de-silvestre` en el repo
- la lógica actual de `shareUrl` en [src/components/Blog.jsx](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/Blog.jsx#L433) construya siempre el mismo enlace

La implementación actual de share del artículo usa:

- `return ${origin}/blog/${encodeURIComponent(post.slug)}`

por lo que en source el share está parametrizado por `post.slug`.

## Hallazgos Técnicos Útiles

### Inconsistencia de dominio

La home y la metadata base están usando:

- `https://esungatoencerrado.com`

Los artículos prerenderizados usan:

- `https://universogatoencerrado.com/blog/<slug>`

Esto puede confundir scrapers o afectar cómo una plataforma consolida previews y objetos compartidos.

### Fallback social degradado

El fallback actual es:

- `logoapp.png`

Eso no explica por sí mismo que todos apunten al mismo slug, pero sí empeora el fallback visual y cambia la identidad del preview cuando la plataforma no toma la imagen del artículo.

### Prerender del blog sí es específico por slug

Los archivos generados actuales en `dist/blog/` sí tienen:

- `og:url` específico por artículo
- `canonical` específico por artículo

Por lo tanto, el problema reportado no quedó demostrado como una falla simple de prerender uniforme.

## Hipótesis Más Probables Para Revisar

Estas hipótesis siguen abiertas y sí vale la pena que el developer las pruebe:

1. Caché del scraper de la plataforma social.
2. Consolidación de URLs por dominio/metadata inconsistente entre home y artículos.
3. Efecto de compartir desde una UI que conserva el `post` anterior en memoria, aunque el source revisado no lo demuestra de forma directa.
4. Algún comportamiento externo de Facebook/WhatsApp/LinkedIn al resolver previews cuando la home y los artículos publican dominios sociales distintos.

## Recomendaciones Para El Developer

1. Unificar todos los metas base y de artículos en un solo dominio canónico.
2. Revisar si `esungatoencerrado.com` debe existir en metadata; hoy aparece en la home pública.
3. Probar share/debugger de la plataforma con dos slugs distintos y comparar el objeto scrapeado.
4. Verificar el flujo UI exacto desde donde se comparte el artículo para descartar estado stale.
5. Si se quiere aislar el problema, revertir temporalmente los commits:
   - `1996c0dd`
   - `8bfc46cb`
   - `da251918`

## Conclusión

Lo que sí puede atribuirse a los cambios recientes es:

- alteración de la metadata base del sitio
- cambio del fallback social
- cambio del formato de salida del prerender del blog

Lo que no quedó demostrado en esta revisión es:

- que esos cambios estén haciendo que todos los slugs del blog resuelvan literalmente al artículo `cartografia-emocional-de-silvestre`

Si el usuario ve siempre ese destino al compartir, el siguiente paso correcto no es asumir un hardcode, sino reproducir el flujo exacto en la plataforma afectada y comparar el scrape/debug de al menos dos URLs distintas.
