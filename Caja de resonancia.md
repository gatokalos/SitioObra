# Memoria de decisiones: Resonancia Colectiva

**Proyecto:** Universo #GatoEncerrado<br>
**Corte de la memoria:** 13 de agosto de 2026<br>
**Carácter del documento:** registro de decisiones de investigación, narrativa, UI/UX y arquitectura técnica.

## 1. Propósito

Resonancia Colectiva no debe comportarse como un cuestionario aislado ni como una secuencia de formularios. Se concibe como un recorrido longitudinal en el que la persona visitante ocupa el lugar de protagonista y deja tres clases de huella:

1. Lo que intuye antes de conocer la forma artística.
2. La posición desde la que se dispone a habitarla.
3. Lo que permanece o cambia después de la experiencia y con el paso del tiempo.

La interfaz adopta lenguaje escénico porque la persona no está fuera de la obra: entra, calibra su mirada, atraviesa un artefacto, vuelve al foco y finalmente consulta un registro de lo vivido.

## 2. Principios aprobados

- El Dashboard es el centro de orientación del recorrido.
- Las preguntas no deben aparecer automáticamente fuera de contexto: cada fase se abre mediante una acción deliberada.
- Una tarjeta seleccionada no repite su título. Muestra la huella o interpretación de lo que la persona acaba de responder.
- Las respuestas se devuelven como frases semánticas legibles, no como fragmentos crudos ni como el texto literal de un chip.
- El encabezado superior explica el momento activo; las tarjetas conservan una versión compacta del recorrido.
- Móvil y desktop comparten lógica, orden, semántica y persistencia. Solo cambian proporciones, fondos y densidad visual.
- La respuesta longitudinal no debe llevar directamente al mapa final: primero se cierra la Bitácora y después se desbloquea el Libreto.
- La memoria visual debe recuperar la estética propia de cada miniverso, no depender de símbolos genéricos.
- Los accesos a miniversos todavía no ganados conservan autenticación y salvaguarda de GAT.
- Las resonancias de otras personas solo deben presentarse de forma colectiva y anónima.

## 3. Arquitectura narrativa de las fases

### Fase 1 — Antes de entrar / Primera intuición

La persona responde la pregunta madre antes de conocer el artefacto. Al enviar:

- Regresa inmediatamente al Dashboard.
- La fase 1 queda seleccionada.
- El encabezado superior conserva `ANTES DE ENTRAR / Primera intuición` y explica el valor de haber respondido sin información previa.
- La tarjeta seleccionada muestra una frase semántica construida a partir de la respuesta.
- Cuando la tarjeta no está seleccionada, conserva título y descripción para que nunca quede vacía.

Ejemplo aprobado para Artesanías:

> Un objeto deja de ser para ti solo un objeto cuando lo extrañas.

La implementación admite un `acknowledgment` futuro del API, pero conserva una transformación determinista local como respaldo y para el modo DEV.

### Fase 2 — Calibración / Afina tu mirada

La flama representa calibración preestímulo. No abre una conversación genérica ni formula una pregunta improvisada.

Flujo aprobado:

1. Mientras está pasiva, la tarjeta muestra `Afina tu mirada` y el contexto completo correspondiente al miniverso.
2. Al tocar la flama se abre la pantalla independiente de calibración.
3. La pregunta es estable por miniverso y sus chips ya están definidos en código.
4. Al seleccionar un chip, el sistema genera una frase semántica.
5. La persona regresa automáticamente al Dashboard con la fase 2 seleccionada.
6. La respuesta queda alineada con el icono de la flama, en la misma posición visual que la huella de L1.
7. Debajo de las tres fases aparece el artefacto desbloqueado.

Ejemplo aprobado para Artesanías:

**Pregunta:** ¿Qué cosas te cuesta dejar ir aunque ya no tengan utilidad?

**Respuesta semántica:**

> La ropa es lo que más te cuesta dejar ir, aunque ya no tenga utilidad.

El API puede devolver una formulación mejor, pero el modo DEV utiliza una guía semántica local y no presenta el chip crudo como respuesta final.

### Desbloqueo del artefacto transmedia

La moneda GAT no se elimina: es un elemento de recompensa visual coherente con los GATokens.

- Ya no aparece dentro de la pantalla de chips.
- Aparece en el espacio inferior del Dashboard después de seleccionar la calibración.
- Lleva el título `Has desbloqueado el artefacto: [forma]`.
- Conserva el CTA `Habitar la forma`.
- Al activarse, abre el artefacto concreto del portal.

### Conversación posterior al artefacto

La conversación posterior sigue siendo una fase distinta de la calibración previa. Puede recibir contexto del fragmento o plano atravesado y registrar preguntas posteriores a la experiencia.

La deuda técnica aceptada es que algunas variables conservan nombres históricos de L2 aunque hoy representan momentos diferentes del flujo. No deben renombrarse durante ajustes visuales; su refactor deberá hacerse por separado y con pruebas de persistencia.

### Fase 3 — Días después / En el foco

`Cuaderno holográfico` dejó de ser el nombre de la tercera fase. La fase ahora se llama:

- Eyebrow: `DÍAS DESPUÉS`
- Título: `En el foco`

Su función es comunicar que la obra continúa fuera de escena. El acceso longitudinal se presenta como:

`La obra continúa…`

Este CTA abre las preguntas finales de la Bitácora; no abre todavía el mapa de esferas.

## 4. Regreso longitudinal después de 72 horas

El intervalo predeterminado del backend es de 72 horas. En desarrollo puede declararse `BITACORA_DELAY_HOURS=0` para probar el recorrido sin esperar.

Decisiones de acceso:

- El enlace diferido identifica el miniverso y la identidad anónima de la sesión.
- El aterrizaje abre directamente las preguntas longitudinales.
- No se muestra el mapa antes de contestarlas.
- Al cerrar la Bitácora, la persona regresa al Dashboard.
- El registro completo ocupa el espacio inferior que antes utilizó temporalmente el artefacto.
- Desde allí aparece el CTA `Abrir libreto holográfico`.

Esto separa dos conceptos:

- **Bitácora:** acto de responder y cerrar el registro longitudinal.
- **Libreto holográfico:** dispositivo posterior para volver a mirar el recorrido completo.

## 5. Libreto holográfico

### Constelación

El mapa muestra las nueve formas del universo. Se descartaron los iconos lineales genéricos y los cuadros colocados dentro de círculos.

Decisión visual final:

- Cada imagen alojada en `Merch/*.png` ocupa la esfera completa.
- La esfera recorta la imagen a sangre mediante forma circular.
- No hay palabras visibles dentro de las esferas.
- El nombre permanece disponible como etiqueta accesible y aparece en el panel inferior al seleccionar la forma.
- Se añade un reflejo y una sombra interior discretos para reforzar el volumen esférico.
- La esfera central representa la forma seleccionada; las demás funcionan como satélites navegables.

Emblemas utilizados:

```text
la_obra.png
la_taza.png
literatura.png
los_graficos.png
cortos.png
sonoridades.png
lasdiosas.png
juegos.png
el_oraculo.png
```

### Identidad editorial por forma

| Forma | Eyebrow |
|---|---|
| El drama | TEATRO · DRAMATURGIA |
| El objeto | OFICIO · ARTESANÍA |
| La escritura | NOVELA · AUTOFICCIÓN |
| La imagen | CÓMIC · ILUSTRACIÓN |
| La proyección | CINE · AUDIOVISUAL |
| La vibración | MÚSICA · PAISAJE SONORO |
| El cuerpo | DANZA · MOVIMIENTO |
| El riesgo | JUEGO · NARRATIVA |
| La pregunta | ORÁCULO · DIVINACIÓN |

El encabezado genérico `Una misma obra / No cambia la pregunta` fue sustituido por esta identidad dinámica.

### Versos de la vitrina

El párrafo genérico `Solo cambia la forma de abordarla…` fue sustituido por el verso autoral correspondiente a cada forma.

La fuente única es `formats[].vitrinaCopy` en `transmediaConstants.jsx`. El Libreto no mantiene una copia paralela de esos textos: así cualquier corrección futura en la vitrina se refleja también en el regreso longitudinal.

### Progreso completado

Cuando el miniverso principal cierra su fase longitudinal:

- Las cuatro etapas aparecen marcadas.
- Bitácora permanece visualmente activa y pulsa hasta que la persona abre la explicación posterior.
- Al abrirla, deja de pulsar.
- La lectura queda persistida por miniverso para que la llamada de atención no reaparezca en visitas posteriores.

Campo local:

```text
libreto_collective_info_seen
```

### Conoce otras resonancias

El bloque del registro completado se conserva como una decisión protegida:

- Título: `Conoce otras resonancias`.
- Explica que los datos futuros serán colectivos y anónimos.
- Introduce el valor de conservar una Huella.
- CTA: `Abrir mi bitácora`.
- Su destino puede configurarse con `VITE_GATO_BITACORA_URL`.

Los ajustes generales de satélites incompletos no deben modificar este bloque ni su comportamiento.

### Satélites incompletos y salvaguarda

En un satélite incompleto, el acordeón repetido `Incluye dispositivo interactivo` se sustituye por un CTA compacto:

`Viajar a esta escena`

Este cambio es exclusivamente de presentación. Conserva la misma salvaguarda:

- Sin sesión, solicita autenticación.
- Con sesión, verifica el saldo local de GAT.
- Con saldo insuficiente, no permite el viaje y explica el requisito.
- Con saldo suficiente, abre la escena.
- No descuenta GAT: el gasto real sigue ocurriendo dentro del artefacto correspondiente.

Los estados completados conservan los bloques y comportamientos ya aprobados; no deben recibir automáticamente la variante compacta.

## 6. Paridad móvil y desktop

La implementación utiliza el mismo componente y estado para ambos tamaños.

Paridad confirmada:

- Copies de las tres fases.
- Transformaciones semánticas de L1 y calibración.
- Alineación de respuestas con sus iconos.
- Apertura deliberada de la pregunta de chips.
- Regreso automático al Dashboard.
- Moneda y `Habitar la forma`.
- `En el foco` y acceso longitudinal.
- CTA del Libreto.
- Constelación, versos y bloque posterior.
- Persistencia del recorrido.

El chip `ACTIVO`, que había quedado oculto por `hidden lg:flex`, fue restituido en móvil. En móvil ocupa una segunda fila dentro de la tarjeta para evitar superponerse con respuestas largas.

Las diferencias permitidas son solamente adaptaciones de tamaño, espaciado, fondos y mayor explicitud en algunas preguntas longitudinales móviles.

## 7. Persistencia

Cada miniverso conserva su recorrido en:

```text
gatoencerrado:resonance:{portal}
```

Campos relevantes:

```text
l1
l1_answer
l1_acknowledgment
dashboard_active_level
l2_calibration_open
l2_option
l2_acknowledgment
l2_narrative_opened
experience_ts
l2_current_question
l2_current_turn
l2_conv_done
l3_recommendation
bitacora_consented
bitacora_available_at
bitacora_completed
libreto_collective_info_seen
```

El reset DEV borra únicamente el progreso local del portal activo y recarga la página. No elimina respuestas remotas ni reinicia indiscriminadamente otros miniversos.

## 8. Integraciones

### Frontend

- `POST /api/resonance/baseline`
- `POST /api/resonance/l2-turn`
- `POST /api/resonance/recommend-next`
- Endpoints `/api/bitacora/*`
- Tabla Supabase `vitrana_resonances`
- Callback `onOpenNarrative` para abrir el artefacto concreto del portal.

### Archivos principales

- `src/components/portal/ResonanceModal.jsx`: fases, semántica, Dashboard, artefacto y Bitácora.
- `src/components/portal/CuadernoHolografico.jsx`: constelación, progreso, versos y panel del Libreto.
- `src/components/portal/VitranaQuestionReveal.jsx`: revelación de preguntas y control de sus acciones.
- `src/components/IAInsightCard.jsx`: salvaguarda de autenticación/GAT y variante compacta de viaje.
- `src/lib/bitacoraShared.js`: catálogo, nombres editoriales y eyebrows.
- `src/pages/BitacoraLanding.jsx`: entrada del enlace longitudinal.
- `backend/gato-enigmatico-api/routes/bitacora.js`: disponibilidad temporal de la Bitácora.

## 9. Límites éticos y de investigación

- Las respuestas libres pueden contener información emocional sensible.
- No deben enviarse a un proveedor externo de IA sin una decisión explícita sobre destino, consentimiento y tratamiento de datos.
- La formulación semántica local evita que el modo DEV dependa de un servicio externo.
- Las futuras estadísticas de `Conoce otras resonancias` deben ser agregadas y anónimas.
- No deben presentarse respuestas individuales de otras personas sin consentimiento específico.
- La compra o conservación de una Huella no debe prometer beneficios que todavía no estén implementados.

## 10. Checklist de aceptación antes de despliegue

- [ ] L1 vuelve al Dashboard y muestra una frase semántica, no la respuesta cruda.
- [ ] L1 pasiva conserva título y descripción.
- [ ] La flama abre la pregunta estable del miniverso.
- [ ] El chip seleccionado vuelve al Dashboard y se convierte en una frase.
- [ ] `ACTIVO` aparece en móvil y desktop sin superponerse al copy.
- [ ] La moneda aparece debajo de las fases y abre el artefacto correcto.
- [ ] La conversación posterior no se confunde con la calibración previa.
- [ ] `En el foco` respeta la disponibilidad longitudinal.
- [ ] El enlace de 72 horas abre preguntas y no el mapa.
- [ ] Cerrar la Bitácora desbloquea el Libreto.
- [ ] Las nueve imágenes se ven como esferas completas, sin cuadros ni palabras internas.
- [ ] Cada selección muestra eyebrow, forma y verso correctos.
- [ ] Bitácora pulsa hasta abrir `Conoce otras resonancias` y no vuelve a pulsar después.
- [ ] El bloque completado permanece intacto.
- [ ] El CTA de satélite incompleto conserva login y requisito GAT.
- [ ] El recorrido completo funciona en el iPhone más pequeño y en desktop.
- [ ] Recargar conserva el estado del portal activo.

## 11. Decisiones futuras, no incluidas en este cierre

- Sustituir los copies provisionales de beneficios de la Huella por textos definitivos.
- Conectar `Conoce otras resonancias` con datos agregados reales.
- Confirmar la URL canónica definitiva de `Abrir mi bitácora` mediante `VITE_GATO_BITACORA_URL`.
- Evaluar un refactor de nombres históricos de estado de L2 sin mezclarlo con ajustes visuales.
- Realizar una prueba física del recorrido longitudinal en Safari iOS, especialmente con el panel expandido.
