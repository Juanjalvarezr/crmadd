# Auditoría UI/UX — CRM Agencia DESEO DIGITAL
**Fecha:** 2026-07-10  
**Alcance:** app/routes/*.tsx y app/components/*.tsx  
**Temas:** densidad, tarjetas grandes, responsive mobile, contrastes, grids, overflow, botones flotantes, tooltips  
**NP:** Solo lectura + reporte. Se proponen solo cambios `sx` concretos sin refactor.

---

## Hallazgos globales

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| G1 | `app/components/MainLayout.tsx` | 31 | Padding md=4 (32px) excesivo en desktop; reduce ancho útil de cards/tablas en pantallas medianas. | `p: { xs: 2, sm: 2, md: 2, lg: 3 }` |
| G2 | `app/components/SafeChip.tsx` | 5-11 | Colors hardcodeados (`#e0e0e0` / `#333333` como default) no tienen contraste suficiente en outlined sobre fondo claro, y no se adaptan a dark mode. | `default: { bg: "rgba(0,0,0,0.07)", text: "text.primary" }` (y en outlined usar `color: 'text.primary'`). |
| G3 | `app/components/EmptyState.tsx` | 25, 35, 54 | `p: 6` (48px) y `minHeight: 300` consumen mucho viewport en xs; título `color: "#333"` no adapta a dark. | `p: { xs: 4, sm: 6 }, minHeight: { xs: 200, sm: 300 }`; título `color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#333'`. |
| G4 | `app/components/Header.tsx` | 91 | Toolbar tiene `gap: 1` fijo que puede compactar iconos en xs (cortar tooltips). | `gap: { xs: 0.5, sm: 1 }`. |

---

## Rutas

### 1. Clientes (`app/routes/clientes.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| C1 | `clientes.tsx` | 1027-1158 | **Tarjetas muy grandes**. Grid `xs={12} sm={6} md={4} lg={3}` = 4 columnas en desktop, pero cada card es alta: checkbox + nombre + estado + email/tel/empresa + Total Pagado + 5 botones de navegación + 4 icon buttons. Densidad muy baja. | Cambiar a `xs={12} sm={6} md={4}` (3 columnas en lg). Dentro de card: reducir `pl: 3` a `pl: 2` (line 1044, 1082). Reducir padding del footer: `p: { xs: 0.75, sm: 1 }` (line 1092). |
| C2 | `clientes.tsx` | 884-953 | **Botones apilados en xs**. La fila de ~6 botones se convierte en 6 filas en mobile por `minWidth: '100%'`, ocupando >300px verticales. | Convertir acciones en `Swipeable` drawer o icon-only en xs. Fix rápido: `display: { xs: 'none', sm: 'flex' }` en exportar/escanear y quedar con 2 botones principales en xs (`minWidth: 'auto'` en Nuevo Cliente + Filtros). |
| C3 | `clientes.tsx` | 844-880 | **StatCards demasiado separados**. `gap: 2, mb: 2` (16px/32px) hacen que la fila ocupe 80-100px en desktop. | `gap: 1, mb: 1.5` y reducir padding interno de StatCard si es posible. |
| C4 | `clientes.tsx` | 1033 | Card dinámico puede quedar con alturas desiguales entre cards de diferente altura. | `height: '100%'` ya está; añadir en CardContent `display: 'flex', flexDirection: 'column', flexGrow: 1` y separar footer con `mt: 'auto'`. |

### 2. Proyectos (`app/routes/proyectos.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| P1 | `proyectos.tsx` | 1107 | **Cards muy grandes**. `xs={12} md={6} lg={4}` (3 columnas), cada ExpandableCard contiene título, descripción, fecha, monto, estado chip, fase chip, servicios chips, barra de progreso, actualizado y costo, y footer con 7 iconos. Altura estimada >280px. | Reducir a `xs={12} sm={6} lg={4}`. Dentro de ExpandableCard: compactar secciones (e.g., mover servicios a tooltip/píldora collapse cuando haya >3). |
| P2 | `proyectos.tsx` | 1113 | Fecha con emojis en mismo string rompe layout en móvil. | Usar Stack separado: `flexWrap: 'wrap', gap: 0.5` y typography `sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}` `noWrap`. |
| P3 | `proyectos.tsx` | 1514-1525 | **Modal detalle > Estrategia y Contenido**. 3 columnas `xs={12} md={4}` con Paper `p: 2` y List dense. En tablet horizontal queda apretado; en mobile mucho scroll. | Cambiar a `xs={12} md={6}` (2 columnas). Paper `p: { xs: 1.5, sm: 2 }`. |

### 3. Tareas (`app/routes/tareas.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| T1 | `tareas.tsx` | 409-421 | **6 StatCards en fila flex**. `flex: { xs: "100%", sm: "48%", md: "16%" }` — en md 16%*6 + gaps no cabe exacto, y en xs 6 cards de 100% consumen demasiado viewport. | Cambiar a Grid: `container spacing={1}` con `item xs={12} sm={6} md={4}` (2 en mobile, 3 en md, 6 en lg). |
| T2 | `tareas.tsx` | 487 | **Tabla sin `size="small"`**. Aumenta altura de filas (standard 53px vs small 37px). | Añadir `<Table size="small">`. Cell root: `py: { xs: 0.75, sm: 1 }`. |
| T3 | `tareas.tsx` | 491-495 | **Columnas visibles en xs**. Header muestra 6 columnas en xs sin adaptación; body tiene 7 celdas con contenido compuesto (cliente + nicho chip, timer + botones, acciones). | Header: `display: { xs: 'none', sm: 'table-cell' }` en Cliente y Fecha. Body: mismo display responsive. En xs mostrar solo Título, Prioridad/Estado, Acciones (3 columnas). |
| T4 | `tareas.tsx` | 504 | `TableCell py: { xs: 1, sm: 1.5 }` en filas ya genera altura 42px+ en xs; sumado a chips y subtarea summary. | Reducir a `py: { xs: 0.5, sm: 1 }` y compactar SafeChip internos: `height: 16, fontSize: '0.6rem'`. |
| T5 | `tareas.tsx` | 390 | Wrapper `p: { xs: 1, sm: 2, md: 3 }` OK, pero sumado al Paper `p: 2` del liner (line 425) hay doble padding en md (32+32=64px). | Quitar padding del Paper exterior y dejar solo el wrapper, o: `Paper sx={{ p: 0 }}`. |

### 4. Ventas / Oportunidades (`app/routes/ventas.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| V1 | `ventas.tsx` | 455 | **Kanban columns muy anchas**. `minWidth: 260` en cada columna hace que en móvil haya poco viewport para contenido. | Cambiar a `minWidth: { xs: 200, sm: 260 }`. |
| V2 | `ventas.tsx` | 492-499 | **Kanban cards muy espaciadas**. `p: 1, borderRadius: 2` con `mb: 1`. Botones con `padding: 0.25` difíciles de tap en touch. | Card: `p: 1, borderRadius: 1.5`. IconButton: `padding: 0.5`, `minWidth: 32, minHeight: 32`. |
| V3 | `ventas.tsx` | 335-385 | **Campañas tabla grid**. `gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr"` en sm esconde 4 columnas, OK. En xs el `display: { xs: 'block', sm: 'grid' }` causa que cada row ocupe máximo ancho con solo el asunto visible — mucho espacio desperdiciado. | En xs reducir `px: 2` a `px: 1` y compactar subtítulo. |
| V4 | `ventas.tsx` | 280 | Preview email con `p: 2` en barra superior y `p: 3` en inner preview. Consume mucho vertical. | Reducir inner preview `p: { xs: 1.5, sm: 2 }`. |

### 5. Facturación (`app/routes/facturacion.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| F1 | `facturacion.tsx` | 280 | `maxWidth: 1100` y `p: { xs: 1, sm: 1.5 }` OK. — no issue. | N/A |
| F2 | `facturacion.tsx` | 293-309 | **Stat cards fiscal grid**. `gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)', md: 'auto' }` y `CardContent py: 0.75, px: 1`. En xs: 3 columnas de 1/3 con números largos (COP) se cortan. | Cambiar a `{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'auto' }`. Añadir `&:last-child` para alinear. |
| F3 | `facturacion.tsx` | 313-388 | **Filtros avanzados muy altos**. 10 controles en Grid de 1 fila envuelven en 2-3 filas verticales de ~80px c/u en móvil, comiéndose el viewport antes de la tabla. | Agrupar "Limpiar" y "Exportar CSV" en un Box `sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}` y reducir TextField `size="small"` (ya lo es). Añadir `spacing={1}` y quitar `mb` innecesarios. |
| F4 | `facturacion.tsx` | 396-456 | **Tabla con 7 columnas** (`Número`, `Cliente`, `Proyecto`, `Tipo`, `Total`, `Estado`, `Acciones`). En móvil (<600px) se desborda horizontalmente. Table tiene `size="small"` pero row height sigue siendo 48px. | Añadir `display: { xs: 'none', sm: 'table-cell' }` a columnas Proyecto y Tipo en head y body. Table: `sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1, fontSize: '0.8rem' } }}`. |

### 6. Contratos (`app/routes/contratos.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| Co1 | `contratos.tsx` | 353-367 | **Tabla muy ancha**. 10 columnas (`Número`, `Título`, `Cliente`, `Proyecto`, `Tipo`, `Estado`, `Version`, `Factura`, `Renovación`, `Acciones`) + head con chip y fecha. Imposible ver en mobile. | En head+body: `display: { xs: 'none', sm: 'table-cell' }` para Proyecto, Tipo, Factura, Renovación en xs. Mantener visible Número/Título, Cliente, Estado, Acciones. Table: `size="small"`, `sx={{ '& .MuiTableCell-root': { py: 0.5, fontSize: '0.78rem' } }}`. |
| Co2 | `contratos.tsx` | 315 | Contenedor `maxWidth: 1200` sin overflow wrapper explícito para tabla. | Envolver `TableContainer` con `sx={{ overflowX: 'auto' }}` si no lo hereda. |

### 7. Calendario (`app/routes/calendario.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| Ca1 | `calendario.tsx` | 274 | `minHeight: { xs: 420, sm: 520 }` en Paper. 420px en xs (ej: iPhone SE 375px es ~50% viewport). Con header + KPIs + controls = ~700px, forzando scroll excesivo. | Cambiar a `minHeight: { xs: 280, sm: 400 }`. |
| Ca2 | `calendario.tsx` | 286 | Inner Box `height: { xs: 420, sm: 520, md: ... }, minHeight: 380`. Es casi duplicado del Paper y empuja aún más alto. | Ajustar a `height: { xs: 280, sm: 380, md: "calc(100vh - 300px)" }, minHeight: { xs: 260, sm: 320 }`. |
| Ca3 | `calendario.tsx` | 280 | `rbc-month-row: { minHeight: "70px" }` demasiado alto para mobile. | `minHeight: { xs: 40, sm: 55 }`. |
| Ca4 | `calendario.tsx` | 194-208 | **KPIs en xs: 4 columnas** (`xs=3`). En <360px de ancho, typography `h6` con `fontSize: '1rem'` queda muy apretado y pueden cortarse. | Cambiar a `xs=6` (2 columnas en xs) y reducir `Typography variant="caption" fontSize: '0.6rem'`. |

### 8. Email Marketing (`app/routes/email-marketing.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| E1 | `email-marketing.tsx` | 300-305 | **Preview muy alto**. `p: { xs: 2, sm: 3 }` + inner `p: 3, minHeight: 200` consumen demasiado vertical. | Preview wrapper `p: { xs: 1.5, sm: 2 }`, inner template `p: { xs: 2, sm: 2.5 }`, `minHeight: { xs: 160, sm: 200 }`. |
| E2 | `email-marketing.tsx` | 278 | Paper preview tiene `borderRadius: 2, overflow: 'hidden'` pero la barra interna usa `px: 2, py: 1` (16px vertical) visiblemente grande en xs. | Barra superior `py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 2 }`. |
| E3 | `email-marketing.tsx` | 152 | Stats cards con `xs={6}, sm={3}` y Paper `p: 1.5`. OK pero en xs 2 columnas con números largos pueden cortarse. | Añadir `textAlign: 'center'` y `noWrap` en typography de valor. |

### 9. Kanban (`app/routes/kanban.tsx`)

| # | Archivo | Línea | Problema | Fix sx |
|---|---------|-------|----------|--------|
| K1 | `kanban.tsx` | 53 | Column Paper con `p: 2, minWidth: 260`. Padding superiorinnen generoso; column anchas. | Cambiar a `p: { xs: 1, sm: 1.5 }, minWidth: { xs: 200, sm: 260 }`. |
| K2 | `kanban.tsx` | 61 | Card interna con `p: 2`. Kanban debe ser ultra-denso para ver más items. | Reducir a `p: 1, borderRadius: 1.5`. Typography `caption` en lugar de `body2` donde sea posible. |

---

## Notas sobre botones flotantes y overlays

- **MobileFab** (`MobileFab.tsx:137-183`): ubicado en `bottom: { xs: 20 }, right: { xs: 16 }`. `zIndex: 1400`. **No roto, pero en pantallas muy pequeñas (<360px) puede competir visualmente con el botón de IA.**
  - Fix opcional: subir a `bottom: { xs: 72 }` cuando el panel IA esté abierto, o redimensionar a `64x64` en xs.

- **FloatingAIAssistant** (`FloatingAIAssistant.tsx:144-183`): botón fijo en `bottom: 24, left: 24`. Panel full-width en xs (`top: 0, right: 0, bottom: 0`). `zIndex: 10000`. **Funciona correctamente, pero en xs el panel ocupa todo y puede tapar navegación si no hay backdrop.**
  - Fix recomendado: añadir `backdropFilter: 'blur(2px)', bgcolor: 'rgba(0,0,0,0.3)'` al overlay o Paper.

---

## Recomendaciones de contraste

1. **SafeChip outlined default**: `border: "1px solid #e0e0e0"` + `color: "#333333"` sobre fondo blanco tiene ratio ~5.5:1 (OK). Pero sobre gris claro (#f5f5f5) baja a ~3:1 (falla WCAG AA para UI). **Fix**: usar `color: 'text.primary'` con `borderColor: 'text.disabled'`.

2. **EmptyState título**: `color: "#333"` sobre `rgba(255,255,255,0.5)` en modo claro tiene ratio ~4:1 (borde AA). **Fix**: `color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#1f232e'`.

3. **Clientes card footer buttons**: `variant="outlined"` con border por defecto en modo claro tiene contraste aceptable, pero en dark mode si el tema tiene bordes tenues puede fallar. **Fix**: añadir `borderColor: 'divider'` y `color: 'text.primary'`.

---

## Resumen priorizado

| Prioridad | Hallazgo | Impacto |
|-----------|----------|---------|
| Alta | T1/C1: Tareas/Clientes filas flex vs Grid 6 cards (desalineación) | Layout shift en md |
| Alta | F1: Facturación 3 columnas xs corta números largos | Overflow de texto |
| Alta | Co1: Contratos tabla 11 columnas sin responsive | Imposible en móvil |
| Alta | P1: Proyectos cards muy grandes + footer muy ancho | Mucho scroll |
| Media | G3: EmptyState excesivo en móvil | Viewport desperdiciado |
| Media | Ca1/Ca2: Calendario 420px en xs | Mucho scroll |
| Media | V1: Kanban `minWidth: 260` en mobile | Scroll horizontal |
| Baja | G2: SafeChip default dark mode | Estilo inconsistente |
| Baja | G4: Header gap muy fijo | Tooltips truncados xs |

---

## Script sugerido de verificación

Para confirmar los overflows, se pueden buscar en consilla shell breakpoints críticos:
- `grep -n "minWidth:.*260\|minWidth:.*420\|minHeight:.*380" app/routes/*.tsx`
- `grep -n "display: { xs: 'none', sm: 'table-cell' }" app/routes/*.tsx` (si no existe, hay riesgo)
- `grep -n "Table >" app/routes/*.tsx` para ver tablas sin `size="small"`.

---

*Fin del informe.*
