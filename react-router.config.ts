import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true, // Temporal: probar SSR para confirmar causa del error useState
  routes: [
    {
      path: "/*", // Todas las rutas se manejan desde Root
      file: "app/root.tsx"
    }
  ]
} satisfies Config;
