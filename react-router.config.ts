import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false, // Mantener en false para SPA
  routes: [
    {
      path: "/*", // Todas las rutas se manejan desde Root
      file: "app/root.tsx"
    }
  ]
} satisfies Config;
