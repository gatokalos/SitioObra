# Portal Voz: Paridad Contra Vitrina Escena

## Objetivo
Migrar `portal-voz` hasta igualar funcionalidad y narrativa de la vitrina `Escena` en `Transmedia`, evitando duplicación de lógica.

## Estado actual
- `portal-voz` cubre: micrófono, detonadores, selección de emociones.
- `portal-voz` no cubre: comunidad, bitácora emocional, beta de afinación colectiva, loop móvil completo de jugabilidad.
- Registro de portales marcado como `obsolete` para `portal-voz`, `portal-lectura`, `portal-artesanias` hasta lograr paridad.

## Referencias de código
- Vitrina Escena (fuente de verdad actual):
  - `src/components/Transmedia.jsx:5748` (copy narrativo principal)
  - `src/components/Transmedia.jsx:5792` (`ObraConversationControls` completo)
  - `src/components/Transmedia.jsx:5852` (bloque comunidad)
  - `src/components/Transmedia.jsx:5889` (`elevatedCopy: "Pruébala con otra emoción"`)
  - `src/components/Transmedia.jsx:5925` (bitácora de emociones)
  - `src/components/Transmedia.jsx:6013` (beta afinación colectiva)
- Portal actual:
  - `src/pages/PortalVoz.jsx:245` (encabezado)
  - `src/pages/PortalVoz.jsx:277` (controles de conversación)
  - `src/pages/PortalVoz.jsx:309` (detonadores)
  - `src/pages/PortalVoz.jsx:336` (selector emociones)

## Backlog priorizado

### P0 (bloqueantes de paridad)
1. `PV-001` Paridad de loop móvil en conversación
- Gap: falta ciclo completo de CTA secundario (`Leer del guion` -> `prueba con otra emoción` -> `lanza la frase`) y estado elevado en detonadores.
- Fuente: `Transmedia.jsx` (estado y props de `ObraConversationControls`/`ObraQuestionList`).
- Aceptación:
  - En móvil, `portal-voz` reproduce el mismo flujo de estados que Escena.
  - El estado elevado aparece con copy y estilo equivalentes.

2. `PV-002` Paridad de detonadores escénicos
- Gap: `portal-voz` no replica reglas de gasto/progreso y presentación final cuando se agotan detonadores en todas emociones.
- Aceptación:
  - Misma lógica de `spentSet`, `questionProgressMap`, fallback de agotado y paginación.

3. `PV-003` Bloque comunidad en portal
- Gap: `portal-voz` no tiene comentarios/comunidad del miniverso.
- Aceptación:
  - Se integra componente equivalente a `renderCommunityBlock('miniversos', ...)`.
  - Mantiene autenticación y UX de envío/lectura.

4. `PV-004` Bitácora de emociones
- Gap: ausencia total de visualización de orbes y leyenda de emociones.
- Aceptación:
  - Render de orbes por modo con persistencia local consistente.
  - Leyenda de distribución visible y estable.

5. `PV-005` Beta de afinación colectiva
- Gap: ausencia de bloque beta con métrica ficticia.
- Aceptación:
  - Incluye copy, diagrama mockup y barras ficticias (frase más usada vs originales).

### P1 (alineación narrativa y visual)
6. `PV-006` Paridad de copy de entrada
- Gap: encabezado y bajada no coinciden con experiencia actual de Escena.
- Aceptación:
  - Copy de entrada del portal igualado al tono vigente de Escena.

7. `PV-007` Paridad de jerarquía visual
- Gap: layouts divergentes (tarjetas, orden de bloques, densidad visual).
- Aceptación:
  - Orden y jerarquía homologados (mic/roles/detonadores/comunidad/bitácora/beta).

### P2 (deuda técnica y prevención de regresiones)
8. `PV-008` Extracción de estado compartido Escena/Portal
- Gap: riesgo de duplicación entre `Transmedia` y `PortalVoz`.
- Implementación sugerida:
  - `src/hooks/useObraEscenaState.js` para estado/acciones compartidas.
  - `src/lib/obraEscenaConfig.js` para copies/modos/labels comunes.
- Aceptación:
  - Ambos consumen la misma capa de estado/config.
  - Cambios futuros se hacen en un solo lugar.

9. `PV-009` Validación de paridad (checklist técnico)
- Gap: no hay control formal para declarar portal actualizado.
- Aceptación:
  - Checklist en PR obligatorio para marcar `portal-voz` como `ready`.
  - Sólo tras checklist completo se cambia `obsolete -> ready`.

## Orden de ejecución recomendado
1. `PV-001`
2. `PV-002`
3. `PV-003`
4. `PV-004`
5. `PV-005`
6. `PV-006`
7. `PV-007`
8. `PV-008`
9. `PV-009`

## Criterio de salida (para volver a `ready`)
- `portal-voz` cubre el 100% del flujo funcional clave de Escena en móvil.
- No hay degradación UX respecto a vitrina.
- Estado/copy compartidos en capa común (sin fork de lógica).
- QA manual mobile: iOS Safari + Android Chrome.
