# Tintero de pendientes

> Registro iniciado el 19 de agosto de 2026.  
> Son recordatorios de producto y arquitectura; no significan que el trabajo ya esté autorizado o implementado.

## 1. Reducir la fricción del pago de Huella — Stripe Link

**Prioridad:** alta

### Problema

Antes de abrir Stripe, el flujo de Huella ya solicita y valida el correo para proteger y recuperar la suscripción. Dentro del formulario embebido se vuelve a mostrar la autenticación opcional de Stripe Link, lo que se percibe como una segunda exigencia del mismo dato.

### Resultado buscado

- Pedir el correo una sola vez en el flujo propio de Huella.
- Reutilizar ese correo como `billingDetails.email` dentro de `PaymentElement`.
- Retirar del formulario la invitación “Pago rápido con Link (opcional)” y `LinkAuthenticationElement`.
- Confirmar si Link debe seguir disponible silenciosamente como método/autocompletado administrado por Stripe o si también debe deshabilitarse desde Payment Methods. Son decisiones distintas.
- Verificar el recorrido completo como invitado, usuario autenticado, pago exitoso, pago fallido y recuperación posterior de la Huella.

### Ubicación actual

- Captura inicial del correo: `src/components/CallToAction.jsx`.
- Toggle y autenticación duplicada de Link: `src/components/HuellaEmbeddedCheckout.jsx`.
- Creación de la suscripción/PaymentIntent: backend o función que atiende `createEmbeddedSubscription`.

---

## 2. Preguntas para la comunidad — El Apuntador

**Prioridad:** alta

### Estado actual

- “Mesa de notas” muestra preguntas estáticas desde `STARTER_FAQ_PROMPTS`.
- El copy promete que una persona puede “dejar la suya para los demás”, pero todavía no existe el flujo completo para hacerlo.
- `POST /api/search` sí responde las consultas del Apuntador mediante RAG y streaming, pero no guarda ni distribuye preguntas comunitarias.

### Endpoints pendientes sugeridos

#### Lectura pública

`GET /api/community-questions`

- Devuelve únicamente preguntas aprobadas.
- Admite `limit` y cursor/paginación.
- Puede alternar preguntas recientes y curatoriales sin repetir siempre las mismas.
- Si el servicio no está disponible, la interfaz conserva `STARTER_FAQ_PROMPTS` como fallback editorial.

#### Envío

`POST /api/community-questions`

Body mínimo sugerido:

```json
{
  "question": "¿Qué ocurre cuando...?",
  "source": "apuntador"
}
```

- Guarda inicialmente con estado `pending`.
- Acepta identidad autenticada o `anon_id`, sin publicar datos personales.
- Valida longitud, enlaces, contenido vacío y frecuencia de envío.
- Devuelve una confirmación clara: recibida, no publicada automáticamente.

#### Moderación

Definir si la aprobación se hará mediante endpoint administrativo o directamente desde Supabase/Backstage. Como mínimo se necesitan estados `pending`, `approved` y `rejected`, fecha de moderación y responsable.

### Trabajo de interfaz asociado

- Incorporar el gesto “Dejar una pregunta para la comunidad”.
- Mostrar éxito sin confundir “recibida” con “publicada”.
- Alimentar la rotación con preguntas aprobadas y mantener las preguntas editoriales como respaldo.
- Registrar selección, envío y consulta sin guardar información sensible innecesaria.

### Ubicación actual

- Preguntas estáticas y Mesa de notas: `src/components/Blog.jsx`.
- Consulta RAG: `src/hooks/useSearch.js`.
- Endpoint actual del Apuntador: `backend/gato-enigmatico-api/routes/search.js`.

---

## 3. Sincronizar el copy del sitio al conocimiento del Apuntador

**Prioridad:** alta — siguiente tras esta auditoría

### Qué resuelve

El Apuntador no puede consultar el copy editorial que ya vive en el frontend (bienvenida del autor, descripciones de cada miniverso, Cómplices, versos). Ese contenido está duplicado y desincronizado entre `transmediaConstants.jsx` y 8 de los 9 `Portal*.jsx` — hay drift real ya detectado (colaboradores, diosas, wording).

### Arquitectura propuesta

- Adoptar `transmediaConstants.jsx` como fuente única; migrar los 8 portales que hoy duplican copy.
- Tabla nueva en Supabase: `sitio_conocimiento`, con flag de visibilidad en vivo.
- Script de sync idempotente (`content_hash` + upsert), mismo patrón que `ingest-personajes-knowledge.mjs`.
- Fase futura: automatizar con GitHub Actions.

### Documento completo

`backend/gato-enigmatico-api/docs/handoff-sitio-conocimiento-sync.md` — inventario completo de los 9 miniversos, decisiones de arquitectura ya confirmadas, y las 4 decisiones que faltan por confirmar antes de escribir código.

---

## 4. Otros pendientes que conviene conservar visibles

### Modernizar la reacción de La Réplica

- Revisar `POST /api/obra-conciencia`, creado con un flujo anterior.
- Auditar por separado: prompt central, modo `confusion-lucida`, recuperación RAG, historial, modelo de texto, TTS, latencia y registro de errores.
- Definir primero qué debe mejorar en la experiencia antes de cambiar modelos o reescribir el prompt.

### Definir “Otras huellas”

- Decidir qué compras cuentan como Huella: novela, taza, obra u otros objetos.
- Diseñar la forma de acreditar una compra sin crear un proceso manual difícil de sostener.
- Mantener el bloque actual como placeholder informativo hasta definir fuente de datos, reglas y copy.

### Homologar “Última llamada”

- Usar **Última llamada** en toda interfaz y documentación nueva.
- No renombrar automáticamente claves históricas de almacenamiento o eventos como `tercera-llamada-completed`; requieren una migración compatible para no perder estados existentes.

### Matriz mínima de regresión responsive

Antes de publicar cambios importantes, revisar al menos:

- iPhone pequeño y iPhone con Dynamic Island.
- iPad Mini, Air y Pro en portrait.
- Desktop mediano y amplio.
- Header durante scroll, preguntas rotativas, footer, revelados progresivos y checkout de Huella.

