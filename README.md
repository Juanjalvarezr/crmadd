# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

## Despliegue Automatizado (Netlify CLI)

Para no arrastrar la carpeta manualmente, usa la CLI de Netlify:

1. **Instalación:** `npm install -g netlify-cli`
2. **Login:** `netlify login`
3. **Vincular:** `netlify link`
4. **Desplegar:** `npm run deploy` (Configurado en package.json)

### Estructura de salida:
```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Uso Rápido del CRM

1. Copia `.env.example` a `.env`.
2. Completa estas variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_RESEND_API_KEY`
3. Ejecuta:
   ```bash
   npm install
   npm run dev
   ```
4. Abre `http://localhost:5173`.

## Estado actual del MVP

- Este proyecto ya tiene navegación, dashboard, clientes, servicios, oportunidades, tareas, proyectos y email marketing.
- No hay un formulario de login/publicación de usuarios completo en la UI actual.
- El sistema de autenticación está preparado en `app/services/supabase.ts`, pero falta integrar la pantalla de acceso y la protección de rutas.

## Tablas de Supabase necesarias

El CRM usa las siguientes tablas y algunas no están descritas aún en la guía original:

- `clientes`
- `servicios`
- `oportunidades`
- `tareas`
- `subagentes`
- `proyectos`
- `campanas_email`
- `plantillas_email`
- `configuracion_empresa`
- `reglas_negocio_ai`
- `audit_logs`

Si falta alguna de estas tablas, algunas páginas quedarán sin datos o con errores al cargar.

## Mejora recomendada

- Añadir una pantalla de login / control de acceso.
- Completar las tablas adicionales de Supabase.
- Crear reglas de negocio en `reglas_negocio_ai` para que la IA tenga contexto.
- Cargar datos de ejemplo en Supabase para poder usar el dashboard de inmediato.

---

Built with ❤️ using React Router.
