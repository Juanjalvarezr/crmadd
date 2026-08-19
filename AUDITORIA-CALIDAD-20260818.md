# Auditoría de Calidad CRM — Facturación, Documentos, Calendario, Configuración, Supabase
**Proyecto:** CRM Agencia DESEO DIGITAL  
**Ruta:** `C:\Users\jujoa\Desktop\Proyectos Personales\crm-agencia`  
**Fecha:** 2026-08-18  
**Alcance:** `facturacion.tsx`, `documentos.tsx`, `calendario.tsx`, `configuracion.tsx`, `supabase.ts`, `useCRMStore.ts`, `theme.ts`

---

## Resumen Ejecutivo
Se detectaron issues críticos en **seguridad** (seed destructivo, HTML sin sanitizar), **performance** (consultas redundantes, re-render storms), **validación** (formularios casi sin validar) y **consistencia** (colores hardcodeados fuera de `theme.ts`). El código es funcional, pero presenta deuda técnica alta en rutas con más lógica de dominio.

---

## 1) Mobile-First y Accesibilidad

### Hallazgos
- **Padding/grid mobile-first correcto:** rutas usan `xs: 1, sm: 1.5, md: 2` y flex-wrap consistente con `theme.ts`.
- **IconButtons sin `aria-label`:** `facturacion.tsx`, `documentos.tsx`, `calendario.tsx` usan `<IconButton>` sin label accesible.
- **`confirm()` nativo:** eliminación usa `confirm()` en vez de diálogo MUI accesible (`Dialog` con `aria-labelledby`).
- **`dangerouslySetInnerHTML` sin capa accesible:** en `facturacion.tsx` el modal de documento no provee alternativa textual ni restricción de foco.
- **Falta de `aria-live`:** estados de loading/error no usan regiones con `aria-live="polite"`.
- **Imagen preview en `documentos.tsx`:** `<img alt="preview">` es genérico; debería reflejar tipo/nombre.
- **Dialog:** falta foco inicial y trampa de foco en modos de creación/edición.

### Acciones Correctivas
- [P1] Agregar `aria-label` a todos los `IconButton` en las 4 rutas.
- [P2] Reemplazar `confirm()` por `Dialog` accesible con botones primario/secundario y `aria-describedby`.
- [P3] En `facturacion.tsx`, envolver documento generado con fallback textual y gestión de foco.
- [P4] Agregar `aria-live` en regiones de error/estado vacío.

---

## 2) Manejo de Errores y Loading States

### Hallazgos
- **Loading local por ruta:** correcto uso de `CircularProgress` y `Alert`.
- **Mezcla de notificaciones globales y locales:** `configuracion.tsx` tiene bloques comentados “Eliminar Snackbar local” pero aún así usa `showNotification` de store global. `facturacion.tsx` y `documentos.tsx` usan solo notificaciones globales; está OK pero no siempre sincroniza con estado local.
- **Errores silenciosos:** `configuracion.tsx: catch {}` en `loadOptions`, `loadReglas`, `loadConocimiento`, `loadPrompts` y seed data traga errores sin logging ni notificación.
- **`documentos.tsx`:** efecto `useEffect(..., [load])` con `load` recreado cada render => riesgo de loop infinito o recargas innecesarias.
- **`calendario.tsx`:** loader full-screen con solo `CircularProgress`; no muestra skeletons ni estado vacío si no hay eventos.

### Acciones Correctivas
- [P1] Eliminar `catch {}` vacíos. Mínimo: `console.error` + `showNotification` global.
- [P2] Memoizar `load` en `documentos.tsx` con `useCallback` y estabilizar dependencias.
- [P3] En `calendario.tsx`, mostrar fallback cuando no hay eventos en vez de pantalla vacía.

---

## 3) Consistencia con `theme.ts`

### Hallazgos
- **Tokens definidos pero no usados:** `theme.ts` exporta `BRAND`, `SURFACE`, `STATUS`, `SEMANTIC` y paleta semantic completa.
- **Hardcodeo de colores:**
  - `facturacion.tsx`: `color="#009688"`, fondos implícitos.
  - `calendario.tsx`: `color="#1976d2"`, `"#e91e63"`, colores de eventos hardcodeados.
  - `configuracion.tsx`: múltiples colores literales (`#0d0e15`, `#12131a`, `#1976d2`, `#e91e63`, `#4caf50`, `#388e3c`, etc.).
- **StatCard usa `color="primary/success/warning"`** que delega a tema => bien.
- **Chips en facturación usan `size="small"` con `sx` override** => parcialmente inconsistente con `theme.ts`.

### Acciones Correctivas
- [P2] Migrar colores hardcodeados a `BRAND.*`, `STATUS.*` o `theme.palette.*`.
- [P3] Centralizar fondos de `Paper`/`Box` con `SURFACE.*` para evitar divergencias entre rutas.
- [P2] Definir paleta extendida en `theme.ts` para colores de eventos de calendario y usarla en `eventStyleGetter`.

---

## 4) Validaciones de Formulario

### Hallazgos
- **Facturación:** cero validaciones. Acepta strings vacíos en `numero_factura`, `cliente_id`, `proyecto_id`, `fecha_vencimiento`. No valida montos numéricos ni longitudes. No hay feedback inline.
- **Documentos:** solo exige `titulo` vía botón disabled. No valida formato URL, tipo de archivo, tamaños, ni campos requeridos como `cliente_id`/`proyecto_id`.
- **Configuración:** password validation existe (longitud mínima, confirmación). Empresa/plantillas/SOPs no validan campos obligatorios más allá de `.trim()`.
- **No existe capa de sanitización/validación centralizada** a pesar de referencias en skill a `security.ts`; no hay archivo `app/services/security.ts`.

### Acciones Correctivas
- [P1] Introducir validaciones por schema (`zod` ya está en `supabase.ts`) para formularios de factura y documento.
- [P2] Mostrar errores inline bajo cada campo con `FormHelperText`.
- [P3] Normalizar IDs numéricos con `Number.isInteger` antes de enviar.
- [P2] Para documento: validar URL si se ingresa, validar tipo MIME en upload.

---

## 5) Seguridad (XSS, Inyecciones)

### Hallazgos
- **XSS alto:** `facturacion.tsx:312` usa `dangerouslySetInnerHTML` con contenido de plantilla. Aunque viene de DB propia, no hay sanitización previa. Inyección de script es posible si alguien edita plantilla con `<script>`.
- **HTML en email:** `emailService.sendRealEmail` envía HTML crudo desde strings concatenados sin escapar contenido del cliente.
- **Seed destructivo en producción:** `configuracion.tsx:handleSeedRealData` hace `.delete().neq('id', 0)` sobre `oportunidades`, `proyectos`, `tareas`, `equipo`, `clientes`. Si un usuario hace clic en producción, **pierde todos los datos reales**. No hay flag de entorno ni confirmación destructiva con count.
- **URLs externas sin rel:** en `documentos.tsx` los links `target="_blank"` usan `rel="noreferrer"` pero no `noopener`. En preview, `<iframe src>` sin `sandbox`.
- **Supabase client:** usa env vars pero cae a placeholders si faltan; en prod eso haría consultas fallar silenciosamente.

### Acciones Correctivas
- [P0] Gating `handleSeedRealData` con env var `VITE_ALLOW_SEED_WIPE === 'true'` + confirm modal que muestra counts reales.
- [P0] Sanitizar HTML de plantillas antes de `dangerouslySetInnerHTML` (DOMPurify o cleaner) y restringir etiquetas permitidas.
- [P1] Escapar valores dinámicos en templates de email o usar templating seguro.
- [P1] Revisar que todas las URLs `target="_blank"` incluyan `rel="noopener noreferrer"`.
- [P2] Agregar validación/alert si `SUPABASE_URL` o key son placeholders en runtime.

---

## 6) Performance

### Hallazgos
- **Consultas innecesarias:**
  - `facturacion.tsx: openEdit` y `openDetail` llaman ambos a `pagosService.getByFactura` y `plantillasDocumentosService.getByTipo("factura")` por separado.
  - `calendario.tsx` llama `facturasService.getAll()` en dos efectos distintos; uno para sync y otro para cobro rápido.
  - `documentos.tsx: loadOptions` consulta `/api/proyectos`, `/api/clientes`, `/api/facturas` que pueden no existir en app cliente.
- **Re-renders:**
  - `calendario.tsx` recalcula eventos cada vez que cambian longitudes de arrays; no memoiza `eventStyleGetter`.
  - `facturacion.tsx` renderiza listado completo con `.slice(0,20)`; si crece, puede degradar.
  - `useCRMStore` no usa selectores granulares en la mayoría de rutas; cambios en `clientes` re-renderizan rutas que no usan clientes.
- **Listas sin paginación ni cache:** todos los servicios traen `select('*')` sin paginación ni `maybeSingle` cuando aplica.
- **Carga inicial:** `fetchDashboardData` no incluye `facturas`/`pagos`, entonces calendario tiene que pedir facturas aparte.

### Acciones Correctivas
- [P1] Cachear pagos y plantilla por factura en store o local map para evitar doble fetch.
- [P1] Memoizar `eventStyleGetter` y mover cálculo de eventos a selector derivado o `useMemo`.
- [P1] Agregar paginación/límite en servicios de listas grandes.
- [P2] Incluir `facturas` en `fetchDashboardData` o crear fetch específico compartido.
- [P2] Migrar rutas a selectores específicos del store (`s.facturas`, `s.clientes`) en vez de objeto completo.

---

## 7) Flujos de Usuario Completos

### Hallazgos
- **Facturación:** flujo completo existe (crear → editar → detalle → generar doc → pagar → notificar). Brechas:
  - Al pagar, actualiza estado a “Pagada” solo si saldo <= 0, pero `handleRegistrarPago` recarga lista sin sincronizar store de detalle.
  - Generación de documento usa plantilla sin fallback claro y no valida campos faltantes de plantilla.
- **Documentos:** flujo de alta/baja funciona. Falla si `/api/*` no existen porque filtros dependen de ellas. Preview sin manejo de error en carga de iframe/img.
- **Calendario:** flujo de visualización y cobro rápido funciona, pero:
  - Eventos de facturas se sincronizan en un efecto separado sin cancelación robusta; puede haber race.
  - No se puede crear evento desde el calendario.
- **Configuración:** flujos de backup/restore/semillas son frágiles:
  - Backup solo exporta empresa/preferencias, no datos transaccionales.
  - Restore sobrescribe sin confirmar diferencias.
  - Seed real data es destructivo y sin gate de entorno.
- **Integridad de datos:** no se observa manejo de concurrencia ni optimistic locking.

### Acciones Correctivas
- [P1] Sincronizar store tras registrar pago y actualizar detalle sin recargar toda la lista.
- [P2] Reemplazar `/api/...` por llamadas a servicios directos en `documentos.tsx`.
- [P2] Agregar confirmación en restore con diff de config actual vs backup.
- [P0] Proteger seed con env gate y UI de confirmación con tabla de counts a eliminar.

---

## Matriz de Prioridades

| # | Hallazgo | Severidad | Esfuerzo | Archivo(s) |
|---|----------|-----------|----------|------------|
| 1 | Seed destructivo sin gate | Crítica | Bajo | `configuracion.tsx` |
| 2 | `dangerouslySetInnerHTML` sin sanitizar | Alta | Medio | `facturacion.tsx` |
| 3 | Cero validaciones en facturación | Alta | Medio | `facturacion.tsx` |
| 4 | Colores hardcodeados vs tema | Media | Bajo | `facturacion.tsx`, `calendario.tsx`, `configuracion.tsx` |
| 5 | Consultas redundantes en factura/calendario | Media | Medio | `facturacion.tsx`, `calendario.tsx` |
| 6 | `catch {}` silenciosos | Media | Bajo | `configuracion.tsx` |
| 7 | Re-render storm en calendario | Media | Medio | `calendario.tsx` |
| 8 | `confirm()` nativo en vez de Dialog | Media | Bajo | `facturacion.tsx`, `documentos.tsx`, `configuracion.tsx` |
| 9 | `/api/...` en documentos puede no existir | Media | Bajo | `documentos.tsx` |
| 10 | Falta `aria-label` en IconButtons | Baja | Bajo | múltiples rutas |
| 11 | Backup/restore incompletos y frágiles | Media | Alto | `configuracion.tsx` |

---

## Recomendación de Orden de Ejecución
1. **Semana 1:** mitigar seed destructivo y sanitizar HTML (P0).
2. **Semana 2:** validaciones de facturación + migración de colores a tema (P1-P2).
3. **Semana 3:** performance en calendario/facturacion y accesibilidad básica (P1-P2).
4. **Semana 4:** limpieza de `catch` y mejoras de flujos secundarios.

---

## Observaciones Generales
- El proyecto tiene una base sólida de theme y servicios centralizados, pero las rutas han crecido con lógica de estado local duplicada.
- La deuda mayor está en `configuracion.tsx` por volumen y riesgo de operación.
- `useCRMStore` necesita selectores y normalización de tipos para reducir re-renders.
