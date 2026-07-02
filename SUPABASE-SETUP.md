# 🚀 GUÍA DE CONFIGURACIÓN SUPABASE - DESEO DIGITAL

## PASO 1: Crear Cuenta Gratis en Supabase

1. Ve a https://supabase.com
2. Click en "Start your project"
3. Regístrate con Google/GitHub/Email (gratis)
4. Crea una nueva organización: "DESEO DIGITAL"
5. Crea un nuevo proyecto:
   - Nombre: `crm-deseo-digital`
   - Database Password: (genera una segura y guárdala)
   - Region: `East US (N. Virginia)` (más cercano a Colombia)
   - Plan: Free Tier (gratis)

6. Espera 2-3 minutos a que se cree el proyecto

---

## PASO 2: Obtener Credenciales

Una vez creado el proyecto:

1. En el dashboard de Supabase, ve a: **Project Settings** → **API**
2. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxxxxxxxxx.supabase.co`
   - **Project API keys** → `anon public`: `eyJhbG...`

3. Guarda estos valores, los necesitarás en el PASO 4

---

## PASO 3: Crear Tablas en la Base de Datos

En el dashboard de Supabase, ve a: **Table Editor** → **New Table**

Crea estas 4 tablas (una por una):

### TABLA 1: clientes
```sql
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  cargo TEXT,
  empresa TEXT,
  website TEXT,
  nicho TEXT,
  linkedin TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  ultima_interaccion DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar datos de ejemplo
INSERT INTO clientes (nombre, email, telefono, estado) VALUES
  ('Empresa Tech Solutions', 'contact@techsol.com', '555-1234', 'Activo'),
  ('Marketing Digital Pro', 'info@mdpro.com', '555-5678', 'Activo'),
  ('Diseño Creativo Studio', 'studio@diseno.com', '555-9012', 'Activo'),
  ('Consultoría Empresarial', 'info@consultoria.com', '555-3456', 'Inactivo'),
  ('E-commerce Global', 'sales@ecommerce.com', '555-7890', 'Activo');
```

### TABLA 2: servicios
```sql
CREATE TABLE servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'SEO' CHECK (categoria IN ('SEO', 'SEM', 'Social Media', 'Diseño Web', 'Contenido', 'Analytics')),
  descripcion TEXT,
  precio_base INTEGER NOT NULL,
  duracion TEXT,
  incluye TEXT[],
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  popularidad INTEGER DEFAULT 3 CHECK (popularidad BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar servicios de DESEO DIGITAL
INSERT INTO servicios (nombre, categoria, descripcion, precio_base, duracion, incluye, estado, popularidad) VALUES
  ('SEO On-Page Optimización', 'SEO', 'Optimización técnica de tu sitio web para motores de búsqueda', 800000, '1 mes', 
   ARRAY['Auditoría técnica completa', 'Optimización de meta tags', 'Mejora de velocidad', 'Schema markup'], 
   'Activo', 5),
  ('SEO Off-Page - Link Building', 'SEO', 'Estrategia de construcción de enlaces de calidad', 1200000, '3 meses', 
   ARRAY['Análisis de backlinks', 'Guest posting', 'Perfiles en directorios', 'Link baiting'], 
   'Activo', 4),
  ('Google Ads - SEM', 'SEM', 'Gestión profesional de campañas publicitarias en Google Ads', 600000, 'Mensual', 
   ARRAY['Creación de campañas', 'Investigación de keywords', 'A/B testing', 'Optimización diaria'], 
   'Activo', 5),
  ('Gestión Redes Sociales', 'Social Media', 'Administración profesional de perfiles sociales', 900000, 'Mensual', 
   ARRAY['3-5 posts semanales', 'Diseño gráfico', 'Gestión de 3 redes', 'Reporte de métricas'], 
   'Activo', 5),
  ('Diseño Web Profesional', 'Diseño Web', 'Diseño y desarrollo de sitios web optimizados', 2500000, '1-2 meses', 
   ARRAY['Diseño UX/UI', 'Desarrollo responsive', 'Optimización SEO', 'Google Analytics'], 
   'Activo', 4),
  ('Marketing de Contenidos', 'Contenido', 'Creación de contenido estratégico: blogs, ebooks', 700000, 'Mensual', 
   ARRAY['4 artículos de blog', '1 ebook mensual', '2 infografías', 'Keyword research'], 
   'Activo', 4),
  ('Google Analytics 4 Setup', 'Analytics', 'Configuración avanzada de Analytics con eventos', 500000, '1 mes', 
   ARRAY['Migración a GA4', 'Eventos personalizados', 'Dashboards', 'Search Console'], 
   'Activo', 3),
  ('SEO Local - Google My Business', 'SEO', 'Optimización para búsquedas locales y Google Maps', 600000, '2 meses', 
   ARRAY['Optimización GMB', 'Citas locales', 'Gestión de reseñas', 'Schema local'], 
   'Activo', 4);
```

### TABLA 3: oportunidades
```sql
CREATE TABLE oportunidades (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id),
  cliente_nombre TEXT,
  valor INTEGER NOT NULL,
  etapa TEXT DEFAULT 'Prospección' CHECK (etapa IN ('Prospección', 'Propuesta', 'Negociación', 'Cierre')),
  probabilidad INTEGER DEFAULT 25 CHECK (probabilidad BETWEEN 0 AND 100),
  estado TEXT DEFAULT 'Abierta',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar oportunidades de ejemplo
INSERT INTO oportunidades (nombre, cliente_id, cliente_nombre, valor, etapa, probabilidad) VALUES
  ('Proyecto Web Completo', 1, 'Empresa Tech Solutions', 15000000, 'Propuesta', 75),
  ('Auditoría SEO', 2, 'Marketing Digital Pro', 5000000, 'Negociación', 50),
  ('Rebranding', 3, 'Diseño Creativo Studio', 12000000, 'Prospección', 25),
  ('Consultoría Estratégica', 5, 'E-commerce Global', 20000000, 'Propuesta', 85),
  ('Mantenimiento Anual', 4, 'Consultoría Empresarial', 8000000, 'Cierre', 95);
```

### TABLA 4: tareas
```sql
CREATE TABLE tareas (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta')),
  tipo TEXT DEFAULT 'Tarea',
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En progreso', 'Completada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar tareas de ejemplo
INSERT INTO tareas (titulo, descripcion, fecha, prioridad, estado) VALUES
  ('Seguimiento cliente Tech Solutions', 'Llamada de seguimiento post-proyecto', '2024-05-10', 'Alta', 'Pendiente'),
  ('Enviar propuesta a Marketing Digital', 'Propuesta de SEO mensual', '2024-05-12', 'Alta', 'En progreso'),
  ('Revisión de contrato E-commerce', 'Revisar términos del nuevo contrato', '2024-05-15', 'Media', 'Pendiente'),
  ('Presentación con cliente nuevo', 'Reunión virtual de descubrimiento', '2024-05-13', 'Alta', 'Pendiente'),
  ('Actualizar portafolio web', 'Subir nuevos proyectos al sitio', '2024-05-20', 'Baja', 'Pendiente');
```

---

## TABLAS ADICIONALES NECESARIAS

Estas tablas se usan en el CRM y no estaban detalladas en la guía original. Crea cada una en Supabase si quieres que todas las funcionalidades funcionen.

### TABLA: subagentes
```sql
CREATE TABLE subagentes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT DEFAULT 'Soporte' CHECK (rol IN ('Admin', 'Soporte', 'Técnico', 'Creativo')),
  especialidad TEXT,
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### TABLA: proyectos
```sql
CREATE TABLE proyectos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cliente_id INTEGER REFERENCES clientes(id),
  cliente_nombre TEXT,
  servicios TEXT[],
  oportunidad_id INTEGER REFERENCES oportunidades(id),
  estado TEXT DEFAULT 'planificacion',
  prioridad TEXT DEFAULT 'media',
  fecha_inicio DATE,
  fecha_fin DATE,
  progreso INTEGER DEFAULT 0,
  presupuesto INTEGER DEFAULT 0,
  costo_actual INTEGER DEFAULT 0,
  tareas JSONB DEFAULT '[]',
  recursos JSONB DEFAULT '[]',
  monto_pagado INTEGER DEFAULT 0,
  onboarding_checklist JSONB DEFAULT '{}',
  estado_pago TEXT DEFAULT 'pendiente',
  metodo_pago TEXT,
  fase_administrativa TEXT DEFAULT 'operacion',
  plan_contenido JSONB DEFAULT '{}',
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### TABLA: campanas_email
```sql
CREATE TABLE campanas_email (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT,
  tipo TEXT,
  destinatarios TEXT[],
  fecha_envio TIMESTAMP WITH TIME ZONE,
  estado TEXT,
  estadisticas JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### TABLA: plantillas_email
```sql
CREATE TABLE plantillas_email (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  asunto TEXT,
  contenido TEXT,
  categoria TEXT,
  usos INTEGER DEFAULT 0
);
```

### TABLA: configuracion_empresa
```sql
CREATE TABLE configuracion_empresa (
  id SERIAL PRIMARY KEY,
  nombre_agencia TEXT,
  email_contacto TEXT,
  telefono TEXT,
  website TEXT,
  logo_url TEXT,
  colores JSONB,
  descripcion TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  google_business_link TEXT,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### TABLA: reglas_negocio_ai
```sql
CREATE TABLE reglas_negocio_ai (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  instruccion TEXT NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### TABLA: audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalle TEXT,
  usuario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABLA: conocimiento (para búsqueda semántica y Cerebro IA)
-- Habilitar extensión de vectores para búsqueda por significado
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE conocimiento (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  embedding vector(768), -- 768 dimensiones para text-embedding-004 de Gemini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índice para búsquedas rápidas de IA
CREATE INDEX ON conocimiento USING hnsw (embedding vector_cosine_ops);
```

---

## PASO 4: Configurar Variables de Entorno

En tu proyecto local, crea un archivo `.env` en la raíz:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Reemplaza:
- `https://tu-proyecto.supabase.co` con tu **Project URL**
- `tu-anon-key-aqui` con tu **anon public key**

⚠️ **IMPORTANTE**: Nunca subas este archivo `.env` a GitHub (ya está en .gitignore)

---

## PASO 5: Políticas de Seguridad (Row Level Security)

En Supabase, ve a: **Authentication** → **Policies**

Para cada tabla, crea estas políticas (temporalmente abiertas para desarrollo):

### Política para tabla "clientes":
```sql
-- Permitir todo (solo para desarrollo)
CREATE POLICY "Allow all" ON clientes FOR ALL USING (true) WITH CHECK (true);
```

### Política para tabla "servicios":
```sql
CREATE POLICY "Allow all" ON servicios FOR ALL USING (true) WITH CHECK (true);
```

### Política para tabla "oportunidades":
```sql
CREATE POLICY "Allow all" ON oportunidades FOR ALL USING (true) WITH CHECK (true);
```

### Política para tabla "tareas":
```sql
CREATE POLICY "Allow all" ON tareas FOR ALL USING (true) WITH CHECK (true);
```

⚠️ **NOTA**: Cuando tengas autenticación, estas políticas deben ser más restrictivas.

---

## PASO 6: Probar la Conexión

Una vez configurado todo, reinicia el servidor de desarrollo:

```bash
npm run dev
```

Abre el CRM y deberías ver los datos cargando desde Supabase.

Para verificar la conexión, abre la consola del navegador (F12) y ejecuta:

```javascript
// En la consola del navegador
import('./app/services/supabase').then(m => m.testConnection()).then(console.log)
```

Debería mostrar: `{ success: true, message: 'Conexión exitosa a Supabase' }`

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Cuenta creada en Supabase
- [ ] Proyecto creado (crm-deseo-digital)
- [ ] URL y Anon Key copiados
- [ ] Tablas creadas (clientes, servicios, oportunidades, tareas)
- [ ] Datos de ejemplo insertados
- [ ] Archivo `.env` creado con credenciales
- [ ] Políticas de seguridad configuradas
- [ ] Servidor reiniciado
- [ ] Conexión probada y funcionando

---

## 📊 LÍMITES DEL PLAN GRATIS (Free Tier)

| Recurso | Límite |
|---------|--------|
| Base de datos | 500 MB |
| Transferencia | 2 GB/mes |
| Usuarios auth | 50,000/mes |
| Storage | 1 GB |
| Costo | **$0/mes** |

**¿Cuándo necesitas pagar?**
- Cuando tengas más de 500MB de datos (≈ 10,000+ clientes)
- O más de 50,000 usuarios autenticados/mes

Para una agencia como DESEO DIGITAL, el plan gratis dura **años**.

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Failed to fetch"
- Verifica que el servidor esté corriendo (`npm run dev`)
- Verifica que la URL de Supabase esté correcta en `.env`
- Verifica tu conexión a internet

### Error: "Invalid API key"
- Copia exactamente el **anon public key** (no el service_role key)
- No incluyas comillas ni espacios extras

### Error: "new row violates row-level security policy"
- Ve a Authentication → Policies en Supabase
- Asegúrate de tener las políticas "Allow all" creadas
- O recarga la página de políticas (a veces tardan en aplicarse)

### Los datos no se guardan
- Abre DevTools → Console (F12)
- Mira si hay errores rojos
- Verifica que las tablas existen en Table Editor

---

## 📞 CONTACTO

**Proyecto**: DESEO DIGITAL CRM
**Creado por**: Juan José Álvarez
**Tel**: 320 369 8476
**Documento creado**: 2024

---

## 🚀 BENEFICIOS DE SUPABASE

✅ **Gratis**: 500MB, sin límites de tiempo
✅ **Rápido**: Consultas en milisegundos
✅ **Seguro**: SSL/TLS, backups automáticos
✅ **Escalable**: Crece con tu agencia
✅ **Multi-dispositivo**: Accede desde PC, tablet, celular
✅ **API REST**: Cualquier lenguaje puede conectarse
✅ **Realtime**: Datos en tiempo real (si lo necesitas luego)
✅ **PostgreSQL**: Base de datos profesional

**¡Tu CRM está listo para crecer!** 🎉
