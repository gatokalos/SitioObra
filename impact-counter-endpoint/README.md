# Impact Counter Endpoint

API mínima para exponer **suscriptores** e **impacto social** (terapias, residencias, escuelas) para #GatoEncerrado.

## Endpoints

- `GET /stats/suscriptores` → `{ total, updatedAt }`
- `GET /stats/impact-config` → reglas de conversión (JSON)
- `GET /stats/impact` → calcula impacto a partir del total
- `GET /stats/stream` → SSE opcional (actualización cada 15s)

## Cálculos por defecto (modificables en `impact-config.json`)
- `sessionsPerSubscriber`: 6
- `subsPerResidency`: 17
- `subsPerSchool`: 75

## Despliegue rápido

```bash
npm i
cp .env.example .env   # rellena SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm start
```

> **Seguridad**: usa `SUPABASE_SERVICE_ROLE_KEY` **solo** en este servidor backend. No lo expongas en el frontend.

## Supabase (opcional)
Se cuenta a partir de la tabla `subscriptions` con `status = 'active'`.

Ejemplo sugerido de tabla:
```sql
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  email text null,
  status text not null default 'active',
  source text null,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx on public.subscriptions(status);
```
