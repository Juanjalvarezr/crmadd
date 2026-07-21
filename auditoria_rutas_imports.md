# Auditoría de arquitectura, estructura e imports — CRM `crm-agencia`

## Resumen ejecutivo
- Repo: `C:\Users\jujoa\crm-agencia`
- Archivo maestro de rutas: `app/routes.ts`
- Directorio rutas: `app/routes/` con **31 archivos**.
- Conclusión: hay **3 fallos críticos silenciosos** que rompen render en secciones clave; **3 imports rotos confirmados**; **1 naming estructural inconsistente** entre rutas/archivos; y varias inconsistencias menores de naming/imports que no rompen build pero complican mantenimiento.

---

## 1. Coherencia rutas declaradas ↔ archivos existentes

| Ruta declarada en `routes.ts` | Archivo declarado | Estado |
|-------------------------------|-------------------|--------|
| `/` | `routes/home.tsx` | ✅ |
| `/login` | `routes/login.tsx` | ✅ |
| `/reset-password` | `routes/reset-password.tsx` | ✅ |
| `/dashboard` | `routes/dashboard.tsx` | ✅ |
| `/clientes` | `routes/clientes.tsx` | ✅ |
| `/clientes/:id` | `routes/clientes-vista.tsx` | ✅ |
| `/servicios` | `routes/servicios.tsx` | ✅ |
| `/ventas` | `routes/ventas.tsx` | ✅ |
| `/tareas` | `routes/tareas.tsx` | ✅ |
| `/proyectos` | `routes/proyectos.tsx` | ✅ |
| `/email-marketing` | `routes/email-marketing.tsx` | ✅ |
| `/chatbot` | `routes/chatbot.tsx` | ✅ |
| `/calendario` | `routes/calendario.tsx` | ✅ |
| `/reportes` | `routes/reportes.tsx` | ✅ |
| `/estimador` | `routes/estimador.tsx` | ✅ |
| `/kanban` | `routes/kanban.tsx` | ✅ |
| `/configuracion` | `routes/configuracion.tsx` | ✅ |
| `/equipo` | `routes/equipo.tsx` | ✅ |
| `/facturacion` | `routes/facturacion.tsx` | ✅ |
| `/contratos` | `routes/contratos.tsx` | ✅ |
| `/documentos` | `routes/documentos.tsx` | ✅ |
| `/agentes` | `routes/agentes.tsx` | ✅ |
| `/whatsapp` | `routes/whatsapp.tsx` | ✅ |
| `/public/proyecto/:id` | `routes/public-proyecto.tsx` | ✅ |
| `/proyecto/:id` | `routes/proyecto.tsx` | ✅ |

Observaciones estructurales:
- No hay “rutas huérfanas” ni archivos sin ruta.
- Existen archivos adicionales en `app/routes/` que **no están mapeados en `routes.ts`** pero no son rutas accesibles:  
  - `proyectos_dialog_fragment.tsx`  
  - `TareasTab.tsx`  
  - `SeguridadTab.tsx`  
  Esto es aceptable si son subcomponentes internos importados por otros archivos; no es fallo.
- Hay una **inconsistencia de naming plural/singular en la ruta pública vs privada**: `/proyecto/:id` y `/public/proyecto/:id` usan singular, mientras que el listado está en `/proyectos`. Funciona, pero difiere de la convención usada en clientes (`/clientes` + `/clientes/:id`).

---

## 2. Imports rotos / referencias inexistentes detectadas

| Archivo | Import roto | Síntoma |
|---------|-------------|---------|
| `app/routes/finanzas.tsx` | `getCachedTransactions` usada en `load()` pero **no importada** | `ReferenceError: getCachedTransactions is not defined` → Finanzas se rompe al cargar. |
| `app/routes/tareas.tsx` | `setProyectos(proyData)` sin estado declarado | `ReferenceError: Cannot access 'setProyectos' before initialization` → Tareas se rompe al cargar. |
| `app/routes/proyectos.tsx` | `baseUrl` usada para Magic Link pero **no definida** en scope | `ReferenceError: baseUrl is not defined` → copia de Magic Link falla silenciosamente. |

Bibliotecas externas inconsistentes (no rompen build si están instaladas, pero generan ruido):
- `lucide-react` vs `react-icons/fi`: `proyectos.tsx` importa de **`lucide-react`** mientras casi todo el resto usa **`react-icons/fi`**.
- Rutas mixtas: algunos archivos importan `react-router`, otros `react-router-dom`, otros ambos.

---

## 3. Naming inconsistente

| Patrón | Archivos afectados | Impacto |
|--------|--------------------|---------|
| `react-router` vs `react-router-dom` | mezclado en `dashboard.tsx`, `reportes.tsx`, `tareas.tsx`, `ventas.tsx`, `clientes-vista.tsx`, etc. | No rompe build, pero dificulta migraciones y genera warnings en strict mode. |
| `lucide-react` en `proyectos.tsx` mientras el resto usa `react-icons/fi` | `proyectos.tsx` | Código visualmente inconsistente; menor problema si ambos paquetes existen. |
| `Outlet` importado pero no usado | `dashboard.tsx`, `reportes.tsx`, `ventas.tsx`, `tareas.tsx`, `equipo.tsx`, `configuracion.tsx`, `finanzas.tsx`, `email-marketing.tsx`, `chatbot.tsx`, `calendario.tsx`, `kanban.tsx` | Inofensivo, pero expone ruido. |
| Archivos sueltos en carpeta rutas que no son rutas | `proyectos_dialog_fragment.tsx`, `TareasTab.tsx`, `SeguridadTab.tsx` | Mejor mover a `components/` o `routes/components/`. |
| Plural en listado y singular en detalle | `/proyectos` + `/proyecto/:id`; `/clientes` + `/clientes/:id` | Menor, pero divergente entre dominios. |

---

## 4. Fallos silenciosos que impiden render

### P0 — Finanzas no renderiza
- Ubicación: `app/routes/finanzas.tsx`
- Causa: `getCachedTransactions()` invocada sin import.
- Resultado en runtime: `ReferenceError` al montar; pantalla en blanco o fallo parcial.

### P0 — Tareas no renderiza
- Ubicación: `app/routes/tareas.tsx`
- Causa: `setProyectos` no declarado como state setter; sin embargo se usa en `loadTareas`.
- Resultado en runtime: `ReferenceError` inmediato al entrar a `/tareas`.

### P0 — Magic Link roto en Proyectos
- Ubicación: `app/routes/proyectos.tsx`
- Causa: `baseUrl` no está definida antes de generar la URL pública.
- Resultado: copia un enlace incompleto; acción aparentemente funciona pero URL no sirve.

### P1 — `recharts` declarado sin verificación
- Ubicación: `app/routes/reportes.tsx`
- Nota: usa `recharts` y `BarChart`, `PieChart`, etc. Si el paquete no está en `package.json`, build falla. No confirmado en archivos inspeccionados.

### P1 — Dependencias por `./logo-light.svg` / `./logo-dark.svg` desde ruta
- Varias páginas importan logos con rutas relativas al estilo `./logo-light.svg` desde dentro de `app/routes/`. Si esos assets no existen exactamente en esa ruta, bundler falla.

---

## 5. Lista priorizada de fixes estructurales

1. **FIX CRÍTICO** — `finanzas.tsx`: agregar `getCachedTransactions` al import desde `../utils/routeCache`.  
2. **FIX CRÍTICO** — `tareas.tsx`: declarar estado `const [proyectos, setProyectos] = useState<any[]>([]);` antes de usarlo en `loadTareas()`.  
3. **FIX CRÍTICO** — `proyectos.tsx`: definir `const baseUrl = ...` antes de `handleGenerateMagicLink` (ej. `typeof window !== 'undefined' ? window.location.origin : ''`).  
4. **FIX ALTO** — Estandarizar imports de router: preferir `react-router` en rutas y `react-router-dom` solo donde se requiera `<Link>`.  
5. **FIX ALTO** — Unificar iconografía: migrar `proyectos.tsx` a `react-icons/fi` o consolidar en `lucide-react` según decisión de equipo.  
6. **FIX MEDIO** — Sacar `proyectos_dialog_fragment.tsx`, `TareasTab.tsx`, `SeguridadTab.tsx` de `app/routes/` a `app/components/` o `app/routes/components/`.  
7. **FIX MEDIO** — Definir convención de rutas plural para listados y singular para detalle, o alinear `/proyecto/:id` a `/proyectos/:id` para evitar discrepancias.
8. **FIX MEDIO** — Verificar y, si faltan, agregar en `package.json`: `recharts`, `react-big-calendar`, `@hello-pangea/dnd`, `canvas-confetti`, `tesseract.js`, `html2canvas`, `dompurify`.  
9. **FIX BAJO** — Remover `Outlet` no usado de rutas que no tienen layouts anidados comprobables.  
10. **FIX BAJO** — Corregir `database.ts` línea 197: cadena de autorización Resend mal escrita `*** ${apiKey}`` → debe ser `Bearer ${apiKey}` (aunque está envuelto en fallback simulado, el bug existe).

---

## 6. Evidencia de inspección
- `app/routes.ts`: todas las rutas declaradas tienen archivo homónimo, a excepción de archivos internos no-ruta.
- `app/routes/finanzas.tsx`: no importa `getCachedTransactions` pero lo invoca en `load()`.
- `app/routes/tareas.tsx`: usa `setProyectos(proyData)` sin declaración previa.
- `app/routes/proyectos.tsx`: usa `baseUrl` no definida.
- `app/routes/reportes.tsx`: importa `recharts`; requiere validación de existencia del paquete.
- `app/components/` no contiene `ChatbotWhatsApp.tsx`, `Header.tsx`, `Sidebar.tsx`, `FloatingAIAssistant.tsx` en lugar de `services/`, y existen en components.
