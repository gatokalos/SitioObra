# Memoria de sesión: HUB, GatoChip y continuidad narrativa

**Fecha:** 29 de julio de 2026  
**Proyecto:** `SitioObra`  
**Estado al cierre:** pruebas manuales reportadas por producto como aproximadamente 90% satisfactorias.  
**Propósito:** referencia interna para continuar el trabajo de UI/UX sin reconstruir las decisiones de esta sesión.

## 1. Distinción fundamental de producto

No confundir estos componentes:

- **Índice `#` / Programa de mano:** navegación general del universo.
- **GatoChip de Energía:** control de cuenta, recursos y accesos personales.
- **HUB grande:** vestíbulo personal que comunica que “la obra continúa”.
- **Bandeja mini del GatoChip:** versión compacta de los accesos de energía.
- **`#3D` del Hero:** activador narrativo de la escena; no es un menú secundario.

La jerarquía acordada es:

- `#` = índice general / Programa de mano.
- GatoChip = abre o cierra las superficies del HUB.
- `Primera fila` = entra o regresa a la escena.
- `#3D` = activación original del Hero para la primera visita.

## 2. Decisión central: cerrar no equivale a activar

Antes, cerrar el HUB y activar la escena estaban mezclados en una misma función. Esto provocaba duplicación mental y hacía frágil la animación.

Ahora existen dos contratos diferentes:

### GatoChip y Escape

- Cierran el HUB o la bandeja.
- No activan la escena.
- No fuerzan la aparición del `#` del header.

### Primera fila

- Cierra el HUB.
- Espera dos frames para que React vuelva a montar el `#` destino del header.
- Solicita al Hero la activación de escena.
- Conserva la transmigración visual del `#3D` hacia el `#` tipográfico.

La espera es necesaria porque, mientras el HUB está abierto, el `#` del header no está montado y no puede medirse como destino de la animación.

Implementación principal:

- `src/components/Header.jsx`
  - `dismissGatPanels`
  - `enterFirstRow`
- `src/components/Hero.jsx`
  - listener `gatoencerrado:activate-scene-request`

## 3. Contrato de continuidad después del login

La prueba positiva observada —login y aparición inmediata del video recomendado con su CTA— no estaba garantizada originalmente. Dependía de una clave residual:

```text
gatoencerrado:pending-vitrana-id
```

Esa clave solo se generaba al pulsar “Entra para seguir la forma” en una vitrina. El Login del HUB no la creaba.

Se introdujo un contrato explícito:

```text
gatoencerrado:pending-continuation:v1
```

Estructura:

```js
{
  source: "oracle-welcome" | "bienvenida-intent" | "l3-next-act" | "transmedia-vitrana",
  showcaseId,
  forma,
  presentation: "narrative-video",
  createdAt
}
```

Reglas:

- La recomendación guardada y la intención de continuar son datos distintos.
- Un login genérico no debe abrir videos inesperadamente.
- Un login originado por un CTA contextual sí debe reanudar el video correspondiente.
- La intención se consume una sola vez cuando el usuario queda autenticado.
- Existe compatibilidad temporal con la clave legacy `pending-vitrana-id`.

Archivo central:

- `src/lib/pendingContinuation.js`

Consumidor:

- `src/components/Hero.jsx`

Productores de la intención:

- Login contextual del HUB.
- CTA anónimo de “Siguiente acto”.
- Vitrinas de Transmedia.
- Recomendación L3 dentro de `ResonanceModal`.

## 4. Recomendaciones: fuentes y nomenclatura

Las recomendaciones ya no deben tratarse como una sola categoría.

### Recomendación L3

Procede del evento:

```text
resonance:l3-reward:{portal}
```

Se presenta como:

```text
Siguiente acto: {forma}
```

Los eventos nuevos guardan:

```js
{
  portal,
  recommended,
  recommended_format_id,
  forma
}
```

Los eventos históricos que no tienen `forma` usan el título del miniverso como fallback.

### Progreso previo

Cuando hay actividad en un miniverso pero no una recomendación L3:

```text
Retomar {miniverso}
```

### Oráculo / Bienvenida

Cuando existe una recomendación inicial:

```text
Explorar {miniverso}
```

La recomendación inicial puede seguir siendo accesible para el visitante sin obligarlo a iniciar sesión. Si el usuario elige Login desde el HUB antes de completar L3, el sistema guarda esa recomendación como continuación y, al autenticarse, presenta el video y su CTA.

### Sin recomendación

Se muestra:

```text
Explorar miniversos
```

Al pulsarlo aparece un mensaje inline que evita mencionar L1/L2/L3 y ofrece:

```text
Abrir Explora
```

## 5. Login para visitantes anónimos

Dentro de cualquier grid del HUB o bandeja:

- `Iniciar sesión` aparece siempre que `!user`.
- No depende directamente del saldo GAT.

Sin embargo, esto no significa que siempre sea alcanzable:

- Anónimo en navegador con GAT: puede abrir el GatoChip y ver Login.
- Anónimo en navegador sin GAT: el chip puede quedar oculto.
- PWA anónima sin GAT: el HUB puede abrirse automáticamente, pero después de cerrarlo el chip puede desaparecer y no permitir reabrirlo.

Esta diferencia entre **visibilidad del icono dentro del HUB** y **posibilidad de abrir el HUB** es un pendiente real.

## 6. Estado visual aprobado del HUB

Dirección estética acumulada durante la sesión:

- El HUB no debe sentirse como otro menú principal.
- Fondo transparente para permitir ver el campo estelar y el Hero.
- Estrellas consistentes con la fase cero del Hero.
- Grid de dos columnas.
- Iconos cuadrados, no rectángulos altos.
- Indicadores/flechas contenidos dentro de los iconos o eliminados.
- Punto verde de cuenta contenido dentro del icono.
- Cada hilera tiene su propio cuerpo celeste:
  - punto;
  - pleca vertical corta;
  - desvanecimiento;
  - pulso sobrio.
- El `#3D` puede pasar por encima de las plecas/cuerpos celestes, pero nunca por encima de los botones.
- Se conserva un espacio vertical estable en el encabezado aunque no exista descripción, para evitar que el grid se desplace y desalinée los cuerpos celestes.
- El GatoChip prevalece como control de cierre en lugar de una `X`.
- El control de iniciar/cerrar sesión fue retirado del Programa de mano y permanece en el HUB personal.

## 7. Estado de iconos y lógica pendiente

La dirección de producto acordada es mostrar el mayor mapa posible de la experiencia, usando estados inline cuando una puerta todavía no está disponible.

Objetivo:

- `Primera fila`: siempre.
- `Iniciar sesión`: siempre para anónimos dentro del HUB.
- `Siguiente acto / Explorar / Retomar`: según la fuente de recomendación.
- `Cuaderno holográfico`: idealmente siempre visible, con cuenta regresiva o estado bloqueado.
- `Café, charla y merch`: para visitantes que han vuelto y tienen GAT.
- `WhatsApp`: seguimiento y captura de teléfono cuando corresponda.
- `Hola / cuenta`: para autenticados.
- `Backstage`: idealmente siempre visible; abrir con huella o explicar inline cómo obtenerla.

No todo este mapa está terminado:

- Cuaderno todavía necesita un estado de disponibilidad consultable por el Header.
- Debe distinguir `availableAt`, disponibilidad, finalización, canales y teléfono faltante.
- Café/merch todavía no tiene una definición técnica completa de “ha vuelto”.
- Backstage todavía depende principalmente de suscripción activa.
- WhatsApp todavía usa un consentimiento global demasiado general.

## 8. Limitaciones de persistencia

La continuación contextual y las recomendaciones iniciales funcionan de manera durable dentro del mismo almacenamiento de navegador/PWA.

No están garantizadas cuando:

- se limpia el almacenamiento;
- se reinstala la PWA;
- se cambia de navegador;
- se cambia de dispositivo.

Para continuidad entre dispositivos, la recomendación/intención deberá persistirse o reconstruirse desde servidor ligada a la identidad autenticada.

## 9. Problema del GatoChip dejado deliberadamente en el tintero

Producto reporta que todavía existe un problema con el GatoChip después de las pruebas actuales, pero decidió no atenderlo en este momento.

Lo confirmado y relacionado:

- El chip ya puede cerrar el HUB en las pruebas recientes.
- El chip y `Primera fila` ya tienen funciones separadas.
- Sigue existiendo una debilidad de disponibilidad para usuarios anónimos sin GAT.
- En PWA sin GAT, cerrar el HUB puede dejar al usuario sin una superficie visible para reabrirlo.

Antes de intervenir de nuevo se necesita registrar:

1. dispositivo y modalidad: navegador o PWA;
2. estado de autenticación;
3. saldo GAT;
4. superficie abierta: HUB grande o bandeja mini;
5. zona exacta pulsada dentro del chip;
6. resultado esperado y resultado real.

No modificar este comportamiento incidentalmente durante los siguientes cambios visuales.

## 10. Validación realizada

- `npm run build` pasa correctamente.
- El prerender de los artículos termina correctamente.
- `git diff --check` no reporta errores.
- El proyecto no tiene una configuración ESLint utilizable desde la raíz; no se pudo ejecutar lint.
- El navegador automatizado no estuvo disponible en la sesión.
- Las pruebas reales de producto después del despliegue fueron reportadas como aproximadamente 90% satisfactorias.

## 11. Archivos modificados en esta etapa

- `src/components/Header.jsx`
- `src/components/Hero.jsx`
- `src/components/Transmedia.jsx`
- `src/components/portal/PortalL3RewardCTA.jsx`
- `src/components/portal/ResonanceModal.jsx`
- `src/lib/transmediaCreditEventLabels.js`
- `src/lib/pendingContinuation.js`

## 12. Pruebas de regresión recomendadas

1. GatoChip con HUB abierto: cierra sin activar la escena.
2. Escape con HUB abierto: cierra sin activar la escena.
3. Primera fila, primera visita: ejecuta la transmigración `#3D → # header`.
4. Primera fila con escena ya activada: regresa sin una animación falsa.
5. Anónimo con recomendación Oráculo: Login abre después el video correcto y su CTA.
6. Anónimo con L3: `Siguiente acto` muestra inline, Login y continuación correcta.
7. Usuario autenticado con L3: `Siguiente acto` abre directamente video y CTA.
8. Usuario sin recomendación: copy educativo y `Abrir Explora`.
9. Evento L3 nuevo: conserva `forma` en metadata.
10. Evento L3 histórico: usa título como fallback sin romper el icono.

---

Esta memoria describe el estado funcional previo a los siguientes cambios de UI basados en mockup. Los cambios visuales nuevos deben respetar estos contratos aunque modifiquen composición, escala, espaciado o estilo.
