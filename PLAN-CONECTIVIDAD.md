# PLAN DE CONECTIVIDAD TOTAL — CRM DESEO DIGITAL

## ANÁLISIS ACTUAL
- **Rutas**: 18 rutas funcionales
- **Servicios**: 6 servicios (AI, Polling, DB, OCR, Oportunidades, Supabase)
- **Componentes**: 20 componentes reutilizables
- **Stores**: 2 stores (Chat, CRM)
- **Eventos**: 5 tipos insertándose en `crm_events`
- **Polling**: cada 30s, handlers con emails genéricos
- **IA**: Gemini integrado pero sin conectar a UI
- **WhatsApp**: componente existe pero sin API real
- **Service Worker**: desregistrado manualmente

---

## FASE 1 — CERRAR HANDLERS CON LÓGICA REAL (ALTA)
**Objetivo**: Que cada evento dispare acciones concretas del negocio.

**Cambios:**
1. `factura_pagada`:
   - Generar PDF con html2pdf o template
   - Guardar PDF en bucket `crm-documents`
   - Vincular a contrato si existe
   - Notificar al cliente por email/WhatsApp

2. `cotizacion_guardada`:
   - Crear follow-up tarea automática
   - Generar PDF de cotización
   - Notificar al equipo comercial

3. `tarea_guardada`:
   - Notificar responsable por email
   - Crear recordatorio si fecha_vencimiento < 48h
   - Vincular a proyecto

4. `documento_creado`:
   - Notificar equipo
   - Vincular a proyecto
   - Si es factura → generar PDF

5. `email_enviado`:
   - Auditar en `logs`
   - Vincular a cliente/proyecto

**Archivos a modificar:**
- `app/services/crmPollingService.ts` (agregar handlers reales)
- `app/services/supabase.ts` (agregar uploadPDF, generarDocumento)
- `app/routes/*` (inyectar payload completo)

---

## FASE 2 — INTEGRAR GEMINI EN RUTAS (ALTA)
**Objetivo**: IA conectada a la UI para decisiones reales.

**Cambios:**
1. `CerebroAITab.tsx` → conectar a proyectos/clientes:
   - Análisis automático de proyecto
   - Recomendaciones de acciones
   - Generación de contenido

2. `FloatingAIAssistant.tsx` → acciones seguras:
   - Resumir proyecto
   - Generar mensaje WhatsApp
   - Analizar pipeline

3. `app/services/ai.ts`:
   - Cerrar fallback de modelos
   - Agregar contexto de CRM en prompts

**Archivos a modificar:**
- `app/components/CerebroAITab.tsx`
- `app/components/FloatingAIAssistant.tsx`
- `app/services/ai.ts`

---

## FASE 3 — WHATSAPP REAL (MEDIA)
**Objetivo**: Envío real por Meta Cloud API.

**Cambios:**
1. Configurar credenciales en Supabase secrets:
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_ID`

2. Crear servicio `whatsappService.ts`:
   - Enviar mensaje de texto
   - Enviar plantilla
   - Enviar documento PDF

3. Conectar a handlers de Fase 1:
   - `factura_pagada` → WhatsApp al cliente
   - `cotizacion_guardada` → WhatsApp al equipo

**Archivos a crear/modificar:**
- `app/services/whatsappService.ts` (nuevo)
- `app/services/supabase.ts` (agregar método sendWhatsApp)
- `app/services/crmPollingService.ts` (integrar)

---

## FASE 4 — DASHBOARD CON MÉTRICAS REALES (MEDIA)
**Objetivo**: Reemplazar placeholders por datos reales.

**Cambios:**
1. `app/routes/dashboard.tsx`:
   - Ventas desde `ventas`
   - Pipeline desde `oportunidades`
   - Facturación desde `facturas`
   - Proyectos activos desde `proyectos`
   - Tareas pendientes desde `tareas`

2. `app/components/SalesChart.tsx`:
   - Datos reales de facturación mensual

3. Export CSV real:
   - Botón funcional en dashboard
   - Exportar a CSV desde cualquier tabla

**Archivos a modificar:**
- `app/routes/dashboard.tsx`
- `app/components/SalesChart.tsx`
- `app/components/CompactTable.tsx` (agregar export)

---

## FASE 5 — RBAC EN RUTAS SENSIBLES (BAJA)
**Objetivo**: Roles y permisos.

**Cambios:**
1. Tabla `usuarios` con roles:
   - `admin`: acceso total
   - `editor`: crear/editar, no eliminar
   - `viewer`: solo lectura

2. Middleware en rutas:
   - `/finanzas`, `/contratos`, `/configuracion` requieren `admin` o `editor`
   - Botones/acciones condicionales por rol

3. UI de gestión de usuarios:
   - Crear usuario
   - Asignar rol
   - Ver logs de acceso

**Archivos a modificar:**
- `app/routes/configuracion.tsx` (agregar pestaña usuarios)
- `app/components/Sidebar.tsx` (ocultar rutas por rol)
- Servicios: agregar `usuariosService`

---

## FASE 6 — EMAIL MARKETING REAL (BAJA)
**Objetivo**: Campañas automáticas.

**Cambios:**
1. `app/routes/email-marketing.tsx`:
   - Lista de contactos desde `clientes`
   - Plantillas desde `plantillas_email`
   - Envío masivo con Resend

2. Automatizaciones:
   - Bienvenida a cliente nuevo
   - Seguimiento post-cotización
   - Recordatorio de pago

---

## ORDEN DE EJECUCIÓN RECOMENDADO
1. **Fase 1** (handlers reales) — cierra el 80% del valor
2. **Fase 4** (dashboard real) — cierra visibilidad
3. **Fase 2** (Gemini en UI) — cierra IA
4. **Fase 3** (WhatsApp real) — cierra comunicación
5. **Fase 5** (RBAC) — cierra seguridad
6. **Fase 6** (email marketing) — cierra growth

---

## CRITERIOS DE ÉXITO POR FASE
- Fase 1: crear factura → PDF guardado en `documentos` + email enviado
- Fase 2: abrir proyecto → ver análisis IA en `CerebroAITab`
- Fase 3: factura pagada → WhatsApp enviado
- Fase 4: dashboard muestra métricas reales, CSV exporta datos
- Fase 5: `/configuracion` tiene gestión de usuarios
- Fase 6: campaña de email enviada a lista de clientes
