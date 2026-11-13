# Seguimiento automático (24h / 3d / 7d) — n8n

El CRM ya **programa solo** los seguimientos cuando se envía una propuesta:
al enviar, crean 3 filas en `public.seguimientos` (estado `pendiente`,
`programado_para` = ahora + 1/3/7 días).

Falta el workflow de n8n que los envía por WhatsApp.

## Tabla (ya migrada)

```sql
CREATE TABLE IF NOT EXISTS public.seguimientos (
  id bigserial PRIMARY KEY,
  cliente_id bigint,
  cliente_nombre text,
  telefono text,
  tipo text,
  mensaje text,
  programado_para timestamptz,
  estado text DEFAULT 'pendiente',
  creado_en timestamptz DEFAULT now()
);
```

## Workflow a crear en n8n (Settings → Import from JSON)

Nombre: `CRM - Seguimiento automatico`

**Nodos (en orden):**

| # | Nodo | Tipo | Parámetros |
|---|---|---|---|
| 1 | `Cada 15 min` | `n8n-nodes-base.scheduleTrigger` v1.3 | Trigger: **Minutes** → 15 |
| 2 | `Seguimientos pendientes` | `n8n-nodes-base.supabase` | Resource: **seguimientos** · Operation: **Get Many** · Limit: 50 · **Query**: `select=*&estado=eq.pendiente&programado_para=lte.<AHORA ISO>` |
| 3 | `Por cada seguimiento` | `n8n-nodes-base.splitInBatches` v2 | Batch size: 1 |
| 4 | `Enviar WhatsApp` | `n8n-nodes-base.httpRequest` v4 | Method: POST · URL: `http://host.docker.internal:2785/send-message` (o la del OpenWA) · JSON body: `{"session":"crm-agency","to":"{{ $json.telefono }}","message":"{{ $json.mensaje }}"}` |
| 5 | `Marcar enviado` | `n8n-nodes-base.supabase` | Update **seguimientos** · id = `{{ $json.id }}` · `estado` = `enviado` |
| 6 | `Sin pendientes` | `n8n-nodes-base.noOp` | (salida vacía del nodo 3) |

**Conexiones:** 1→2→3→4→5 (y 3→6).

**Notas**
- Si el nodo Supabase no soporta `Query` en *Get Many*, usar **Operation: Execute Query** con:
  `select * from seguimientos where estado = 'pendiente' and programado_para <= now() limit 50;`
- El teléfono debe ir con código de país (ej. `57300...`).
- Verificar con: `select id, telefono, tipo, estado, programado_para from seguimientos order by id desc limit 10;`

## Verificación

1. Enviar una propuesta desde el CRM (FAB → Enviar propuesta).
2. En Supabase: `select * from seguimientos;` → 3 filas `pendiente`.
3. n8n ejecuta → pasa a `enviado` y llega el WhatsApp.
