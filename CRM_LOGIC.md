# Lógica Oficial del CRM - Versión 1.0

## Entidades y Relaciones

### Cliente (clientes)
- **1 Cliente** → **N Proyectos**
- **1 Cliente** → **N Tareas** (directo o vía proyecto)
- **1 Cliente** → **N Facturas** (directo o vía proyecto)
- **1 Cliente** → **N Contratos**
- **1 Cliente** → **N Documentos**
- **1 Cliente** → **N Oportunidades**

### Proyecto (proyectos)
- **1 Proyecto** → **1 Cliente** (obligatorio)
- **1 Proyecto** → **N Tareas**
- **1 Proyecto** → **N Facturas**
- **1 Proyecto** → **N Contratos**
- **1 Proyecto** → **N Documentos**
- **1 Proyecto** → **N Oportunidades**

### Tarea (tareas)
- **1 Tarea** → **1 Proyecto** (opcional)
- **1 Tarea** → **1 Cliente** (opcional, vía proyecto)
- **1 Tarea** → puede generar **1 Factura** (si es facturable)

### Factura (facturas)
- **1 Factura** → **1 Proyecto** (obligatorio)
- **1 Factura** → **1 Cliente** (obligatorio, vía proyecto)
- **1 Factura** → puede estar vinculada a **1 Contrato**

### Contrato (contratos)
- **1 Contrato** → **1 Cliente** (obligatorio)
- **1 Contrato** → **1 Proyecto** (opcional)
- **1 Contrato** → **N Facturas**
- **1 Contrato** → **N Documentos**

### Documento (documentos)
- **1 Documento** → puede pertenecer a **Cliente**, **Proyecto**, **Contrato** o **Factura**
- Tipos: pdf, doc, xls, img, etc.

### Oportunidad (oportunidades)
- **1 Oportunidad** → **1 Cliente** (opcional)
- **1 Oportunidad** → **1 Proyecto** (opcional, al ganarse)

### Equipo (equipo)
- **1 Miembro** → puede estar asignado a **N Proyectos**
- **1 Miembro** → puede tener **N Tareas**

---

## Reglas de Negocio

1. **Todo proyecto pertenece a un cliente**: no se puede crear proyecto sin cliente
2. **Toda factura se asocia a un proyecto y cliente**: para trazabilidad contable
3. **Todo documento debe tener una entidad padre**: cliente, proyecto, contrato o factura
4. **Las tareas pueden ser independientes o ligadas a proyecto**: flexibilidad
5. **Los contratos pueden ser generales (cliente) o específicos (proyecto)**
6. **Las oportunidades se convierten en proyectos al ganarlas**

---

## Roadmap de Mejoras por Ruta

### Fase 1: Conexiones Visibles (sin cambiar lógica)
- [ ] **Clientes**: mostrar contadores de proyectos, tareas, facturas, contratos
- [ ] **Proyectos**: mostrar tarjetas de cliente, tareas pendientes, facturas
- [ ] **Tareas**: permitir seleccionar proyecto y cliente automáticamente
- [ ] **Facturas**: mostrar datos del proyecto y cliente automáticamente
- [ ] **Contratos**: mostrar cliente y proyecto relacionados
- [ ] **Documentos**: selector de entidad padre (cliente/proyecto/contrato/factura)

### Fase 2: Enriquecimiento de Datos
- [ ] **Clientes**: agregar campos de scoring, origen, estado de onboarding
- [ ] **Proyectos**: agregar plan de contenidos, cronograma, brief
- [ ] **Tareas**: agregar prioridad, fecha límite, responsable
- [ ] **Facturas**: agregar estado de pago, recordatorios automáticos
- [ ] **Documentos**: generación automática desde plantillas

### Fase 3: Automatización
- [ ] Alertas de vencimiento de contratos
- [ ] Recordatorios de pago automáticos
- [ ] Generación de propuestas PDF desde plantillas
- [ ] Sincronización con Google Calendar

---

## Principios

1. **No romper flujos existentes**: cualquier cambio se integra sin afectar lo que ya funciona
2. **Datos reales, no de prueba**: todo debe estar relacionado con JUAN JOSE o clientes reales
3. **Sin IDs duplicados**: constraints en BD y validaciones en UI
4. **Errores visibles**: nunca fallos silenciosos
5. **Mobile-first**: compacto y usable en celular
