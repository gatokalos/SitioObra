# Artefactos Transmedia pendientes — #GatoEncerrado
## Versión alineada al protocolo v6 · 2026-07-16

> Documento de trabajo. Propósito: definir, universo por universo, el artefacto
> transmedia como app — qué hace el usuario, qué misión de investigación cumple,
> y qué registra — antes de construirlo en código. Cada artefacto se diseña
> teóricamente aquí (chat dedicado dentro del proyecto doctoral) y se implementa
> en Claude Code.
>
> Origen: generado por Claude Code (sesión 2026-07-15/16) desde notas de ~49 días;
> alineado al marco canónico del v6 el 2026-07-16. La tabla de estados conserva su
> advertencia de reverificación contra el código actual.

---

## 1. Marco de referencia (canónico, v6)

**Pregunta de investigación (canónica):** ¿Bajo qué condiciones un sistema
narrativo transmedial puede operar como dispositivo de intervención subjetiva y
sociocultural, y cómo puede investigarse ese proceso con rigor epistemológico
desde la propia práctica de diseño del sistema?

> Nota de alineación: la pregunta anterior ("¿cómo pueden... influir en la
> participación...?") queda superada. Importa para este documento: cada
> artefacto no se diseña para *demostrar un efecto*, sino para crear y registrar
> las *condiciones* bajo las cuales la intervención subjetiva puede ocurrir y
> estudiarse.

**Las 5 capas del marco operativo** (cada artefacto debe ubicarse en al menos una):

1. **Observación** — Oráculo (preguntas que detonan introspección)
2. **Traducción** — Gatología (respuestas → estructuras simbólicas)
3. **Reflejo** — Drama / Apps (interacción narrativa personalizada)
4. **Expansión estética** — Sonoridades / Texto
5. **Encarnación** — Movimiento / Gráfico / Objeto (al cuerpo o a lo tangible)

> Corrección de alineación: la "capa 6 — Integración (comunidad, suscripción,
> acción social)" de la versión anterior NO es una capa del marco: es el
> territorio del indicador TCE. Un indicador había sido promovido a capa. El
> contenido se reubica abajo, donde pertenece.

**Los 5 indicadores de impacto que los datos del artefacto deben poder alimentar:**

- **TAN** (Tasa de Activación Narrativa) — usuarios que interactúan / usuarios totales
- **IRS** (Índice de Recorrido Significativo) — profundidad: módulos visitados, rutas completadas, tiempo activo
- **TRC** (Tasa de Retorno Consciente) — usuarios que regresan / usuarios únicos
- **IAS** (Índice de Apropiación Simbólica) — producción de sentido, vía análisis de respuestas abiertas
- **TCE** (Tasa de Compromiso Expandido) — transición de experiencia a acción: participación activa, suscripción, donación, compartir (esto absorbe la antigua "capa 6")

**Arquitectura técnica común (ya construida, aplica a todos los universos):**

```
L1: Pregunta de entrada → el usuario elige una opción
        ↓
Dispositivo narrativo: el usuario HACE ALGO en el artefacto del miniverso   ← lo que falta definir por universo
        ↓
L2: Conversación post-experiencia (3 turnos máx.)
        ↓
L3: Recomendación de siguiente miniverso + recompensa
```

> Puente de nomenclatura (para no reabrir la colisión ya resuelta): L1/L2/L3 es
> vocabulario de código. En el protocolo doctoral, el flujo del participante se
> nombra P1 (Primera intuición) / P2 (Artefacto transmedia) / P3 (Vestigio), y el
> modelo de análisis usa nombres desnumerados (umbral narrativo, registro de
> exposición, activación narrativa, resonancia diferida). Este documento usa
> L1/L2/L3 por ser documento de trabajo hacia código; cualquier texto que migre
> al protocolo se traduce.

El **dispositivo narrativo** (la casilla del diagrama) es lo que este documento
acota universo por universo: qué acción exacta hace el usuario, cuál es la
operación mínima que la completa, y qué se registra para que cuente como dato.

---

## 2. Patrón de preguntas por universo

Para cada miniverso, antes de darlo por "definido":

1. ¿Cuál es el artefacto exacto del dispositivo narrativo? (qué hace el usuario, literal)
2. ¿Cuál es la operación mínima que lo completa? (verbo + condición medible — no "explorar", sino "eligió una emoción y la escuchó ≥1 vez")
3. ¿Cómo se registra en el sistema? (qué flag se setea, qué evento de GAT/ledger se dispara)
4. ¿Qué tipo de dato produce para el corpus? (¿cuantitativo — clics, tiempo — o cualitativo — texto abierto?)
5. ¿A qué indicador(es) de impacto alimenta directamente?

> Pregunta 0, implícita y primera: ¿cuál es la **premisa articuladora** del
> miniverso, y cómo el artefacto la instancia? El artefacto no es una encuesta
> montada sobre la obra: es la manifestación gemela de la misma premisa.

---

## 3. Estado por universo

> ⚠️ Tabla basada en notas de ~49 días. Confirmar con Carlos qué avanzó de "por
> definir" a implementado antes de diseñar sobre ella.

| Universo | Portal / ruta | Dispositivo narrativo | Estado |
|---|---|---|---|
| Drama | `obra` / PortalVoz | Selección de emoción de Silvestre (8 modos) + escucha de voz dramática | Implementado en UI; operación de cierre sin definir (ver laguna abajo) |
| Literatura | `literatura` / PortalLiteratura | Lectura en voz alta de fragmentos + conversación con el asistente del Marcador Inteligente | **Definido conceptualmente (Carlos, 2026-07-16) — el ejemplo modelo para los demás** |
| Oráculo | `oraculo` / PortalOráculo | Preguntas del Oráculo | Punto de entrada del sistema — probablemente ya es dispositivo en sí mismo |
| Gráficos | `grafico` / PortalGraficos | Swipe de cómic / láminas | Por definir |
| Artesanías | `artesanias` / PortalArtesanías | Taza WebAR | Por definir |
| Cine | `cine` / PortalCine | Quirón (cortometraje) | Por definir — ver propuesta en sección 4 |
| Sonoridades | `sonoridades` / PortalSonoridades | Mezcla de audio / poema sonoro | Por definir |
| Movimiento | `movimiento` / PortalMovimiento | Ritual de movimiento | Por definir |
| Juegos | `apps` / PortalJuegos | Experiencia interactiva tipo app | Por definir |

### Laguna abierta ya identificada: Drama

**Premisa articuladora del miniverso** *(antes "hipótesis del miniverso" — se
renombra para no colisionar con las hipótesis H1–H6 del protocolo)*: la
variación emocional de una misma frase altera la percepción subjetiva de su
significado.

Preguntas sin resolver para conectar el dispositivo al cierre de L2:

1. ¿Cuántas emociones debe escuchar el usuario? ¿Una basta, o se requiere N para activar la variación que se quiere estudiar?
2. ¿Hay un mínimo de tiempo de escucha, o el clic en "elegir emoción" ya cuenta como la operación?
3. ¿Debe comparar conscientemente ≥2 emociones (A → B, misma frase), o cualquier orden vale?
4. ¿Existe un artefacto de cierre explícito ("terminé de explorar"), o el primer turno de L2 ya es el cierre del dispositivo?

---

## 4. Artefacto nuevo en discusión: Cine / "momentos sentidos"

Idea inicial de Carlos (2026-07-16, sin desarrollar todavía):

> Un artefacto que invite al usuario a tocar la pantalla en algún área durante el
> cortometraje, en los momentos donde sintió algo — lo que sea. El artefacto debe
> pensarse desde la narrativa del universo, no como una encuesta genérica.

Puntos abiertos antes de poder diseñarlo:

- ¿El toque ocurre *durante* la reproducción (tiempo real, timestamp) o *después* (reconstrucción reflexiva)? — Nota de alineación: la distinción importa doblemente aquí, porque el dato de mayor densidad del proyecto es el desfase entre lo declarado y lo reconocido; un artefacto con toque en vivo Y reconstrucción posterior capturaría ese desfase en registro no verbal.
- ¿Qué se le pide narrativamente? ¿Solo el toque, o toque + una palabra de qué sintió?
- ¿Cómo se ancla a la lógica de Quirón — hay motivo narrativo (in-universe) para que el espectador "deje una huella" sobre el corto?
- ¿Qué produce como dato? (Mapa de calor temporal de resonancia por escena — candidato fuerte para IAS; comparado entre usuarios, también IRS.)
- Ligado a la decisión de arquitectura pendiente (sección 5): el artefacto se diseña distinto según dónde viva Cine.

---

## 5. Decisión de arquitectura pendiente (no resuelta aquí)

¿Cine continúa dentro de SitioObra, o se separa a repositorio/dominio propio —
como literatura, oráculo y juegos? Afecta directamente la implementación del
artefacto de la sección 4. Se decide por separado.

---

## 6. Preguntas para el trabajo de diseño (chat dedicado)

- Para cada universo "por definir": ¿qué ejercicio mínimo, coherente con SU
  premisa articuladora (no genérico), produce dato válido para IAS/TRC/TCE?
- ¿Qué tan estrictos deben ser los criterios de validación del corpus de
  resonancia narrativa (anclaje temporal, situación específica, lenguaje de
  reinterpretación — ya definidos para L3) al extenderse a dispositivos NO
  VERBALES, como el toque de pantalla en Cine? Los criterios actuales son
  criterios de texto; un toque no tiene lenguaje. [Pregunta metodológicamente
  nueva — candidata a discusión con el asesor cuando madure.]
- ¿El protocolo ético de respuestas vulnerables (exclusión del corpus + recursos
  de apoyo, definido para L2/L3) necesita variante para artefactos táctiles o no
  textuales?

---

## Registro de alineación (2026-07-16)

Cambios respecto a la versión de Claude Code: (1) pregunta de investigación
reemplazada por la canónica del v6; (2) "capa 6 — Integración" reubicada como
territorio del TCE (un indicador había sido promovido a capa); (3) "hipótesis
del miniverso" renombrada a "premisa articuladora" (evita colisión con H1–H6);
(4) referencias a "Nivel 3" actualizadas a la nomenclatura vigente; (5) puente
de nomenclatura L1/L2/L3 ↔ P1/P2/P3 declarado; (6) Literatura actualizada a
"definido conceptualmente" con su dispositivo (lectura en voz alta +
conversación con el Marcador Inteligente) como ejemplo modelo; (7) añadida la
"pregunta 0" de la premisa articuladora al patrón de diseño.
