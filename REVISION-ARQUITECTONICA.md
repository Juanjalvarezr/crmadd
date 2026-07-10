# Revisión Arquitectónica CRM — Resumen Ejecutivo

## Acciones Realizadas
- Revisión completa de estructura RRv7, rutas, stores, servicios y SQL.
- `npx tsc --noEmit` identificó errores de tipo reales.
- `npm run build` compiló con éxito (pero no ejecuta `tsc --noEmit`).
- Verificación de consistencia entre migraciones SQL y tipos TypeScript.

## Hallazgos Críticos — Código Roto Detectado

### 1. `app/routes/kanban.tsx` (CRÍTICO)
- Usa `FiPlay`, `FiPause`, `FiCheckCircle`, `FiX`, `FiFolder`, `FiPlus` sin importar.
- Importó `Play`, `Pause`, etc. desde `lucide-react` en lugar de `react-icons/fi`.
- **Efecto:** `ReferenceError` al navegar a `/kanban`.
- También tiene imports no usados (`Outlet`, `useNavigate`, `useLocation`, `Chip`).

### 2. `app/components/MobileFab.tsx` (CRÍTICO)
- `clientesService.getAll().then(setForm)` asigna un array de clientes al estado `form` (objeto). Destruye el estado del componente en el primer render.
- `navigate` importado pero nunca usado.
- Falta chequear posible `null` en `factura.numero`.

### 3. `app/components/ProyectoDocuments.tsx` (CRÍTICO)
- `Tooltip` usado sin importar → `ReferenceError` al renderizar pestaña "Documentos".
- `.catch()` llamado sobre `PromiseLike<any[]>` (método inexistente) → rompe carga de adjuntos.

### 4. `app/components/SafeChip.tsx` (CRÍTICO)
- `Import declaration conflicts with local declaration of 'SafeChip'`.
- Tiene una declaración local que colisiona con la importada.

### 5. `app/routes/agentes.tsx` (CRÍTICO)
- Accede a `rutas_activas` en tipo `Agente`, pero esta propiedad no existe en `types/crm.ts`.
- Rompe al renderizar la sección de agentes.

### 6. `app/routes/facturacion.tsx`
- Props requeridas faltantes (`onSave` no provisto) según `tsc`.

### 7. `app/routes/login.tsx` (MENOR)
- Importa `useNavigate` tanto de `react-router` como `react-router-dom`. Inconsistente con RRv7 donde `react-router` es canónico.

### 8. `app/routes/dashboard.tsx` (MENOR)
- Errores de tipo `never[]` en `setData` por mezcla de tipos implícitos.

## Hallazgos Arquitectónicos y Estructurales

### Rutas
- `/dashboard` no existe como ruta; `index("routes/dashboard.tsx")` mapea a `/`.
- Acceder directamente a `/dashboard` produce 404 dentro del SPA.
- No hay redirect configurado de `/dashboard` → `/`.

### SQL / Migraciones
- **Inconsistente:** `database_reset.sql` define `proyectos.id = TEXT`, mientras `database_fix.sql` y `supabase_setup.sql` definen `UUID`.
- **FK rota potencial:** `supabase_facturacion.sql` asume `proyecto_id TEXT` (comentario explícito en el archivo), pero el setup principal usa UUID.
- **RLS:** Políticas `USING (true) WITH CHECK (true)` desactivan efectivamente RLS. No es un bug funcional para desarrollo, pero es riesgo de seguridad para producción.

### Tipos TypeScript
- 379 usos de `: any` (deuda técnica alta).
- Inconsistencias entre `types/crm.ts` y propiedades usadas en componentes (`Agente.rutas_activas`).

### SCSS/CSS y Layout
- Sin SCSS propio; usa Tailwind v4 + MUI `sx` props.
- Layout móvil/escritorio correcto en `/proyectos`, `/clientes`, `/dashboard`, `/proyecto/:id`.

### Scanner Tarjetas
- Componente activo e integrado en `clientes.tsx`.
- Sin rotos detectados.

### Vercel
- `vercel.json` rewrite `/(.*) -> /` correcto para SPA.

## Estado del Build
```
npm run build  → COMPILA CON ÉXITO
tsc --noEmit   → ~60 errores de tipo (muchos noUnusedLocals, pero varios funcionales)
```

## Riesgo Residual
Algunos componentes (Kanban, ProyectoDocuments, SafeChip, Agentes) tienen código que producirá errores en runtime si el usuario navega a esas rutas, pese a que el build bundled sin fallos.
