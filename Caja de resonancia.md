## Hand-off: Caja de resonancia

### Objetivo UX

Después de responder la pregunta madre, la persona debe regresar al Dashboard. La calibración no puede aparecer automáticamente: debe revelarse mediante la fase de la flama.

### Flujo esperado

1. El usuario responde la pregunta madre.
2. Regresa al Dashboard con la fase 1 seleccionada.
3. El encabezado superior muestra:

   - `ANTES DE ENTRAR`
   - `Primera intuición`
   - Descripción de lo que acaba de hacer.

4. Dentro de la tarjeta seleccionada no se repite “Primera intuición”: aparece la respuesta del usuario.
5. Al seleccionar la flama:

   - El encabezado cambia a `CALIBRACIÓN / Afina tu mirada`.
   - La descripción superior anticipa el contexto, sin revelar literalmente la pregunta.
   - Dentro de la tarjeta desaparece su título y aparece `Calibrar mi mirada`.

6. `Calibrar mi mirada` abre la pantalla independiente de chips.
7. Al seleccionar un chip aparece la moneda con el CTA `Habitar la forma`.
8. La moneda cierra el modal y abre el artefacto correspondiente.
9. Después de recorrer el artefacto, el sistema puede iniciar la conversación posterior y habilitar progresivamente la tercera fase.

### Estado actual

Todo este flujo ya está implementado en [ResonanceModal.jsx](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:252).

Puntos principales:

- Persistencia local: [línea 236](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:236)
- Regreso al Dashboard después de L1: [línea 421](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:421)
- Apertura manual de calibración: [línea 439](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:439)
- Apertura del artefacto: [línea 445](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:445)
- Pantalla independiente de chips: [línea 1169](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:1169)
- Moneda `Habitar la forma`: [línea 1235](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:1235)
- Encabezado dinámico del Dashboard: [línea 1431](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:1431)
- Respuesta de L1 y enlace de calibración dentro de las tarjetas: [línea 1537](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:1537)

### Integraciones

El modal utiliza:

- `POST /api/resonance/baseline`
- `POST /api/resonance/l2-turn`
- `POST /api/resonance/recommend-next`
- Endpoints `/api/bitacora/*`
- Tabla Supabase `vitrana_resonances`
- Callback `onOpenNarrative`, provisto por cada portal, para abrir su artefacto concreto.

Advertencia técnica: `l2Selection` y `l1ChipDone` conservan nombres históricos de cuando los chips pertenecían conceptualmente a L2. Ahora representan la calibración preestímulo. Funcionan, pero convendría renombrarlos solamente en un refactor separado.

### Persistencia relevante

Cada portal guarda su recorrido en:

```text
gatoencerrado:resonance:{portal}
```

Campos importantes:

```text
l1
l1_answer
dashboard_active_level
l2_calibration_open
l2_option
l2_narrative_opened
experience_ts
l2_current_question
l2_current_turn
l2_conv_done
```

### Checklist de aceptación

- No repetir el título de la fase dentro de su tarjeta activa.
- La fase 1 muestra la respuesta real del usuario.
- La pregunta de chips nunca aparece por sí sola.
- La flama cambia primero el encabezado superior.
- `Calibrar mi mirada` abre los chips.
- La moneda aparece únicamente después de seleccionar un chip.
- La moneda abre el artefacto correcto de cada portal.
- Recargar la página conserva el estado.
- El flujo funciona en móvil y desktop.
- El reset DEV reinicia solamente el portal actual y no elimina registros remotos.

El reset para estas pruebas está en [ResonanceModal.jsx](/Users/gatoenigmatico/gatoencerrado-ai/landing/SitioObra/src/components/portal/ResonanceModal.jsx:587). Sólo borra el progreso local del portal activo y recarga la página.