# Handoff: SitioObra <-> Bienvenida (GAT)

## Objetivo
Unificar el flujo de saldo GAT entre apps, evitar duplicaciones de UI, y mantener el handoff de Bienvenida hacia Transmedia con estado consistente.

---

## Cambios nuevos hechos hoy (SitioObra)

1. Se elimino el bloque grande fijo de "Saldo GAT" en cabecera de Transmedia.
2. Se mantuvo la metrica real dentro de cada vitrina:
   - Premio cobrado: `MINI-VERSO LEIDO · +X GAT` (solo cuando aplica).
   - Energia: `ENERGIA DISPONIBLE/AGOTADA ... · REQUERIDA ...`.
3. Se oculto el estado inicial de premio pendiente (`MINI-VERSO POR LEER ...`) para limpieza visual.
4. Se agrego un sticky toast de saldo GAT (discreto) que aparece solo cuando cambia el saldo:
   - `+N GAT` cuando suma.
   - `-N GAT` cuando gasta.
   - Muestra tambien saldo resultante.
5. El sticky se renderiza en `document.body` con `createPortal` y `z-[400]` para verse arriba de overlays de Obra.
6. Duracion del sticky ajustada a ~2.2s para que sea perceptible.
7. En modo `DEV`, el boton `Reset creditos` ahora limpia tambien:
   - `gatoencerrado:showcase-boosts`
   - `gatoencerrado:showcase-energy`
   - `gatoencerrado:gatokens-available`
   - `gatoencerrado:explorer-badge`
   - `gx_anon_id` (anon identity local)

---

## Contrato actual de credito GAT (fuente de verdad)

### Identidad anonima compartida
- Storage key: `gx_anon_id`
- Helper: `src/lib/identity.js` -> `ensureAnonId()`

### RPCs de estado/eventos
- `get_transmedia_credit_state(p_anon_id text)`
- `register_transmedia_credit_event(...)`

Archivo SQL:
- `supabase/sql/2026-02-18_transmedia_credit_ledger.sql`

### Restriccion importante (event_key whitelist)
Hoy la funcion SQL solo acepta:
- `sonoro_unlock`
- `graphic_unlock`
- `novela_question`
- `taza_activation`
- `explorer_badge_reward_subscriber`
- `explorer_badge_reward_guest`
- `showcase_boost:*`

Si Bienvenida quiere otorgar GAT con llaves nuevas, hay que ampliar whitelist SQL.

---

## Handoff Bienvenida ya existente en front

Helpers:
- `src/lib/bienvenida.js`
  - `setBienvenidaReturnPath(...)`
  - `setBienvenidaTransmediaIntent(...)`
  - `consumeBienvenidaTransmediaIntent()`
- `src/lib/bienvenidaBridge.js`
  - mapeo `appId -> showcaseId`

Uso en Transmedia:
- Importado en `src/components/Transmedia.jsx`
- Consumo de intent en runtime para foco/recomendacion de vitrina.

---

## Recomendacion de integracion con Bienvenida

1. En Bienvenida, para otorgar GAT:
   - Usar el mismo `anon_id` (`gx_anon_id`) y/o `auth.uid`.
   - Registrar evento via `register_transmedia_credit_event`.
2. Si se usaran eventos propios de Bienvenida, agregar namespace SQL permitido, por ejemplo:
   - `bienvenida_reward:*`
3. En retorno a SitioObra, mantener `setBienvenidaTransmediaIntent(...)` para abrir/focalizar vitrina.
4. Evitar escribir saldo local manualmente si no es necesario:
   - Mejor confiar en sync RPC al volver a Transmedia.
5. Si se quiere feedback inmediato al volver:
   - Guardar un intent de delta en storage (opcional) para forzar sticky al cargar.

---

## Checklist QA (cross-repo)

1. Usuario anonimo:
   - Gana GAT en Bienvenida.
   - Regresa a Transmedia.
   - Vitrina muestra energia actualizada.
   - Sticky de `+GAT` aparece.
2. Usuario autenticado:
   - Gasta GAT en Obra/otra vitrina.
   - Sticky de `-GAT` aparece sobre overlay.
3. DEV reset:
   - `Reset creditos` limpia estado local de pruebas.
   - Nueva sesion anon vuelve a estado base.

---

## Nota operativa
Si quieres, podemos integrar ambos repos desde este chat. Solo comparte:
- ruta local del repo Bienvenida
- rama objetivo
- si quieres cambios directos o solo PR patch notes
