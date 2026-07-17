# Configuración de Producción - CRM DESEO DIGITAL

## Variables de Entorno Requeridas

### Supabase
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

**Cómo obtenerlas:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a Settings > API
4. Copia la URL y la anon key

### Opcional: Variables Adicionales
```bash
# Sentry para monitoring de errores
VITE_SENTRY_DSN=https://tu-sentry-dsn@sentry.io/project-id

# Google Analytics
VITE_GA_ID=G-XXXXXXXXXX

# WhatsApp Business API
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
VITE_WHATSAPP_ACCESS_TOKEN=tu-access-token

# OpenAI para AI Assistant
VITE_OPENAI_API_KEY=sk-...
```

## Configuración en Vercel

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Login en Vercel
```bash
vercel login
```

### 3. Configurar Variables de Entorno
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### 4. Deploy
```bash
vercel --prod
```

## Configuración en Netlify

### 1. Crear archivo netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Configurar Variables en Netlify Dashboard
1. Ve a Site settings > Environment variables
2. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Configuración de Backups en Supabase

### Backups Automáticos (Plan Pro)
1. Ve a https://supabase.com/dashboard
2. Settings > Database > Backups
3. Habilita "Daily backups" (incluido en plan Pro)
4. Configura hora de backup (recomendado: 3:00 AM)

### Backups Manuales
```sql
-- Exportar datos
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

-- Importar datos
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

## Configuración de Sentry (Error Monitoring)

### 1. Crear proyecto en Sentry
1. Ve a https://sentry.io
2. Crea cuenta y proyecto React
3. Copia el DSN

### 2. Instalar Sentry
```bash
npm install @sentry/react
```

### 3. Configurar en main.tsx
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

## Checklist Pre-Deploy

- [ ] Ejecutar migraciones SQL en Supabase
- [ ] Configurar variables de entorno en producción
- [ ] Habilitar backups automáticos en Supabase
- [ ] Configurar Sentry para error tracking
- [ ] Probar login y autenticación
- [ ] Probar recuperación de contraseña
- [ ] Verificar RLS policies
- [ ] Probar lead scoring automático
- [ ] Probar sanitización de formularios
- [ ] Configurar dominio custom
- [ ] Configurar SSL/HTTPS
- [ ] Probar en móvil (responsive)
- [ ] Verificar performance (Lighthouse)

## Dominio Custom

### En Vercel
1. Project Settings > Domains
2. Agregar dominio (ej: crm.deseodigital.com)
3. Configurar DNS en tu proveedor:
   - CNAME: crm.deseodigital.com -> cname.vercel-dns.com

### En Netlify
1. Domain settings > Add custom domain
2. Configurar DNS:
   - CNAME: crm.deseodigital.com -> tu-site.netlify.app

## Security Headers

### Agregar en netlify.toml o vercel.json
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
```

## CI/CD con GitHub Actions

### Crear .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoreo y Logs

### Supabase Logs
- Dashboard > Database > Logs
- Revisar queries lentas
- Monitorear conexiones

### Vercel Analytics
- Dashboard > Analytics
- Métricas de rendimiento
- Core Web Vitals

## Recomendaciones de Seguridad

1. **Nunca** commitear variables de entorno en el repo
2. Usar secrets de GitHub/Vercel/Netlify
3. Rotar claves regularmente
4. Habilitar 2FA en todas las cuentas
5. Limitar acceso a Supabase por IP
6. Usar RLS policies restrictivas
7. Habilitar audit logging en Supabase

## Soporte y Emergencias

- **Supabase Status**: https://status.supabase.com
- **Vercel Status**: https://status.vercel.com
- **Documentación Supabase**: https://supabase.com/docs
- **Documentación Vercel**: https://vercel.com/docs
