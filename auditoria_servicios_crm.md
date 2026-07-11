# Auditoría de Servicios del CRM — DESEO DIGITAL
**Alcance:** Solo lectura + reporte.  
**Archivos revisados:** ai.ts, database.ts, supabase.ts, facturacion.ts, oportunidadesService.ts, agentes.ts, almacenamiento auxiliar (pdf, plantillas, storage, ocr).  
**Archivos inexistentes en rutas:** contratos.ts, tareas.ts, clientes.ts, proyectos.ts, email.ts. Sus servicios viven en facturacion.ts, supabase.ts/database.ts, clientesService.ts, proyectosService.ts.

---

## Resumen Ejecutivo
Se detectaron **11 hallazgos** que impiden o pueden impedir guardar/actualizar datos correctamente. Destacan:
- 1 error crítico de runtime por uso de `confirm()` en capa de servicio.
- 3 errores de mapeo/schema que causan pérdida de datos o fallo en create/update.
- 1 race condition en numeración de facturas que bloquea guardados concurrentes.
- 3 fallos de “ Conexión Placeholder” que ocultan caídas de Supabase silenciosamente.
- 3 problemas de manejo de errores que tragans excepciones y dificultan diagnóstico.

---

## Hallazgos por Severidad

### CRÍTICO

#### 1. `confirm()` bloqueante en capa de servicio (ai.ts)
- **Archivo y línea:** `ai.ts` línea ~270  
- **Descripción:** `ejecutarAccionSincrona` usa `confirm(...)` antes de llamar `proyectosService.update(...)`.  
- **Impacto:** `confirm` es API de navegador. Si este módulo se ejecuta en SSR/Worker/Vite preview sin DOM, lanza `ReferenceError` y **bloquea la actualización del proyecto**. Además, introduce lógica de UI en servicio.  
- **Fix sugerido:**  
  - Eliminar `confirm` del servicio.  
  - Pasar un flag `dryRun` o `requireConfirmation` desde la capa de UI.  
  - Si se necesita confirmación, exponer un callback/promesa resuelta por el frontend.

### ALTO

#### 2. Mapeo roto de `ultima_interaccion` en clientes (supabase.ts)
- **Archivo y línea:** `supabase.ts` línea ~396  
- **Descripción:** `mapClienteToDB` usa clave `ultimaInteraccion` (camelCase) mientras que el schema y DB usan `ultima_interaccion` (snake_case).  
- **Impacto:** Al actualizar un cliente, el campo `ultima_interaccion` se guarda como `undefined`/`null`. Si en la DB la columna tiene `NOT NULL`, el update **falla**.  
- **Fix sugerido:**  
  ```ts
  ultima_interaccion: c.ultima_interaccion ?? c.ultimaInteraccion,
  ```

#### 3. Race condition en numeración de facturas (facturacion.ts)
- **Archivo y línea:** `facturacion.ts` líneas 23–40 (`getSiguienteNumero`)  
- **Descripción:** Consulta el último número y calcula el siguiente sin bloqueo de fila.  
- **Impacto:** Si dos usuarios/requests consultan al mismo tiempo, ambos obtienen el mismo último número y ambos insertan el mismo `numero` en `facturas` → **violación de UNIQUE constraint** y fallo al guardar factura.  
- **Fix sugerido:**  
  - Mover la secuencia a Postgres (`CREATE SEQUENCE facturas_numero_seq`).  
  - O usar una RPC con `SELECT FOR UPDATE`.  
  - O capturar error de unique y reintentar con cálculo nuevo.

#### 4. Destino de correo vacío hardcodeado (facturacion.ts)
- **Archivo y línea:** `facturacion.ts` líneas 19 y 52  
- **Descripción:** `enviarEmail` envía `to: []` vacío.  
- **Impacto:** La factura/contrato **nunca llega al cliente**. Si la API real de Resend está activa, puede incluso fallar o quedar en cola sin destinatario.  
- **Fix sugerido:**  
  ```ts
  to: [factura.cliente?.email || contrato.cliente?.email]
  ```

#### 5. Columna inexistente en anulación de facturas (facturacion.ts)
- **Archivo y línea:** `facturacion.ts` línea ~42  
- **Descripción:** `anular` incluye `updated_at` en el update, pero el schema de `facturas` en `supabase.ts` no declara esa columna.  
- **Impacto:** Si la tabla no tiene `updated_at`, **no se anula la factura** y se lanza error de servidor.  
- **Fix sugerido:**  
  - Confirmar si `updated_at` existe en la tabla.  
  - Si no, eliminar el campo del update de anulación.  
  - Preferir usar `updated_at` automático de Supabase vía trigger.

### MEDIO

#### 6. Cliente Supabase con placeholders oculta fallos de conexión (supabase.ts)
- **Archivo y línea:** `supabase.ts` líneas 29–36  
- **Descripción:** Cuando faltan env vars, crea el cliente con `placeholder-project.supabase.co` y key inventada.  
- **Impacto:** En producción sin env vars, los servicios retornan arrays vacíos o `null` silenciosamente. **La app parece funcionar pero no guarda nada**.  
- **Fix sugerido:**  
  - No crear el cliente con placeholders.  
  - `if (!URL || !KEY) throw new Error('Faltan credenciales de Supabase');`  
  - O inicializar `supabase = undefined` y validar en cada método.

#### 7. Consumo de errores silenciosos en logs y listados (database.ts / supabase.ts / agentes.ts)
- **Archivos y líneas:**  
  - `database.ts` línea 163: `logsService.create` hace `.catch(() => {})`.  
  - `database.ts` líneas 144, 169, 173, 211, etc.: `.catch(() => null/[])` en listados.  
  - `agentes.ts` línea 27: `if (error) return [];` en `getAll`.  
- **Impacto:** Si Supabase cae o hay timeout, el usuario ve listados vacíos sin saber que hay fallo de conexión. Los logs de auditoría se pierden.  
- **Fix sugerido:**  
  - Remover `.catch(() => {})` en logs.  
  - En listados, propagar el error o al menos relanzarlo después de loguear.  
  - Si se desea fallback defensivo, hacerlo explícito y con `throw` en modo debug.

#### 8. Falta de validación previa a create/update en servicios de negocio (varios)
- **Archivos:** `supabase.ts` (clientes, proyectos, etc.), `oportunidadesService.ts`, `facturacion.ts`  
- **Descripción:** Servicios reciben `any` y hacen insert directo sin validar campos obligatorios con Zod/TS.  
- **Impacto:** Si el frontend envía objetos incompletos (ej. `cliente` sin `email`), Supabase puede aceptar datos inválidos o lanzar error DB que no se maneja con mensaje útil.  
- **Fix sugerido:**  
  - Usar schemas Zod (`ClienteSchema`, etc.) para `parse` antes de insertar.  
  - En `oportunidadesService.create`, validar `nombre`, `valor`, `etapa`, `estado` mínimos.

### BAJO

#### 9. `getEstadisticas` no exportada (oportunidadesService.ts)
- **Archivo y línea:** `oportunidadesService.ts` línea 203  
- **Descripción:** Función auxiliar `getEstadisticas` definida sin `export`.  
- **Impacto:** No puede ser importada por UI/otros módulos. Si la app depende de esas estadísticas, **no se puede calcular** el dato.  
- **Fix sugerido:**  
  - `export async function getEstadisticas(...)` o mover dentro del objeto exportado.

#### 10. Manejo genérico de errores sin detalle original (agentes.ts)
- **Archivo y línea:** `agentes.ts` líneas 42, 55, 69, 81  
- **Descripción:** `catch { throw new Error('No se pudo ...') }` sin guardar el error original.  
- **Impacto:** Se pierde el mensaje real de Supabase (timeout, constraint, red). Dificulta diagnosing.  
- **Fix sugerido:**  
  - `catch (e) { console.error(e); throw new Error('No se pudo ...', { cause: e }); }`

#### 11. `localStorage` sin try/catch en plantillas (plantillas.ts)
- **Archivo y línea:** `plantillas.ts` líneas 23, 37, 46  
- **Descripción:** `savePlantilla`, `updatePlantilla`, `deletePlantilla` usan `localStorage.setItem` sin capturar `QuotaExceededError`.  
- **Impacto:** Si el almacenamiento está lleno o en modo incógnito restringido, **la app crashea** al intentar guardar.  
- **Fix sugerido:**  
  - Envolver `localStorage.setItem` en try/catch y mostrar feedback amigable.

---

## Matriz Resumen

| # | Hallazgo | Severidad | Afecta guardado/actualización |
|---|---------|-----------|------------------------------|
| 1 | `confirm()` en servicio IA | CRÍTICO | Sí (bloqueo) |
| 2 | Mapeo `ultima_interaccion` roto | ALTO | Sí (update cliente) |
| 3 | Race condition en número factura | ALTO | Sí (create factura) |
| 4 | `to: []` vacío en email | ALTO | No (envío) |
| 5 | Columna `updated_at` inexistente en anular factura | ALTO | Sí (update factura) |
| 6 | Placeholder oculta desconexión | MEDIO | Sí (todos los guardados) |
| 7 | Errores tragados en listados/logs | MEDIO | No directo, pero oculta fallo |
| 8 | Sin validación Zod previa | MEDIO | Sí (datos inválidos) |
| 9 | `getEstadisticas` no exportada | BAJO | No directo |
| 10 | Errores sin detalle original | BAJO | No directo |
| 11 | `localStorage` sin try/catch | BAJO | No directo |

---

## Recomendación Priorizada
1. **Corregir #1** (confirm en servicio) para desbloquear IA en entornos no-DOM.  
2. **Corregir #2** (mapeo roto) para evitar corrupción en clientes.  
3. **Corregir #3** y **#5** para facturación estable.  
4. **Corregir #4** para que los correos lleguen.  
5. **Corregir #6** para detectar fallos de conexión en deploy.

---

*Archivo generado por auditoría automatizada + revisión manual.*  
*Fecha:* 2026-07-10
