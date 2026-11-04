import React, { useEffect, useState, lazy, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, ThemeProvider, CssBaseline, Typography } from "@mui/material";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
const GlobalSearch = lazy(() => import("./components/GlobalSearch"));
const FloatingAIAssistant = lazy(() =>
  import("./components/FloatingAIAssistant").then((m) => ({ default: m.FloatingAIAssistant }))
);
import { darkTheme, lightTheme } from "./theme";
import GlobalSnackbar from "./components/GlobalSnackbar";
import { crmPollingService } from "./services/crmPollingService";
import { supabase } from "./services/supabase";
import { getCurrentRol, isSensitive, type Rol } from "./utils/rbac";

const PUBLIC_PREFIXES = ["/login", "/public/proyecto"];

const DRAWER_WIDTH = 260;

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("CRM ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, color: "error.main" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Error en la aplicación</Typography>
          <Typography variant="body2" sx={{ mb: 1, whiteSpace: "pre-wrap" }}>{this.state.error?.message || String(this.state.error)}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>{this.state.error?.stack}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

export function meta() {
  return [
    { title: "CRM DESEO DIGITAL" },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" },
    { name: "theme-color", content: "#e91e63" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
  ];
}

export default function Root() {
  useEffect(() => { document.title = "CRM DESEO DIGITAL"; }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("theme_mode") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  const theme = themeMode === "dark" ? darkTheme : lightTheme;

  const [authState, setAuthState] = useState<"checking" | "authed" | "guest">("checking");
  const [rol, setRol] = useState<Rol | null>(null);
  const isPublic = PUBLIC_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  // Guard real: sesión Supabase (no localStorage). /login y /public/proyecto/:id son públicas.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthState(data.session ? "authed" : "guest");
    }).catch(() => { if (mounted) setAuthState("guest"); });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session ? "authed" : "guest");
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (authState === "checking") return;
    if (authState === "guest" && !isPublic) {
      navigate("/login", { replace: true });
    } else if (authState === "authed" && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [authState, isPublic, location.pathname, navigate]);

  // RBAC: cargar rol y bloquear rutas sensibles para viewer
  useEffect(() => {
    if (authState !== "authed") { setRol(null); return; }
    let mounted = true;
    getCurrentRol().then((r) => { if (mounted) setRol(r); }).catch(() => { if (mounted) setRol("viewer"); });
    return () => { mounted = false; };
  }, [authState]);

  useEffect(() => {
    if (rol === "viewer" && isSensitive(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [rol, location.pathname, navigate]);

  // PWA: manifest + iconos en <head> (root no exporta Layout)
  useEffect(() => {
    const head = document.head;
    if (!head.querySelector('link[rel="manifest"]')) {
      const l = document.createElement("link");
      l.rel = "manifest"; l.href = "/manifest.json";
      head.appendChild(l);
    }
    if (!head.querySelector('link[rel="apple-touch-icon"]')) {
      const l = document.createElement("link");
      l.rel = "apple-touch-icon"; l.href = "/icon-192.png";
      head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "light" || detail === "dark") {
        setThemeMode(detail);
      }
    };
    window.addEventListener("theme-changed", handler as EventListener);
    return () => window.removeEventListener("theme-changed", handler as EventListener);
  }, []);

  // Polling: handlers Fase 1 viven en crmPollingService (email + documento + audit + follow-up).
  // No re-registrar aquí: register() sobrescribe y degradaría la lógica real.
  useEffect(() => {
    const id = setInterval(() => {
      crmPollingService.tick();
    }, 30000);
    // primer tick inmediato
    crmPollingService.tick();
    return () => clearInterval(id);
  }, []);

  // Búsqueda global: Ctrl/Cmd+K + evento del Header
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onOpen = () => setSearchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-global-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-global-search", onOpen);
    };
  }, []);

  // PWA: registrar service worker (antes se desregistraba)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (authState === "checking" && !isPublic) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f13", color: "#fff" }}>
        <Typography variant="body2">Verificando sesión...</Typography>
      </Box>
    );
  }

  if (isPublic) {
    return (
      <Box id="main-content" sx={{ outline: "none" }}>
        <Outlet />
      </Box>
    );
  }

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sidebar_collapsed", String(nextState));
    }
  };

  const handleToggleTheme = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme_mode", nextMode);
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: nextMode }));
    }
  };

  return (
    <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", overflowX: "hidden" }}>
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            width: {
              xs: "100%",
              sm: isCollapsed ? "calc(100% - 70px)" : "calc(100% - 200px)",
              md: isCollapsed ? "calc(100% - 70px)" : `calc(100% - ${DRAWER_WIDTH}px)`,
            },
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowX: "hidden",
          }}
        >
          <Header onMenuClick={handleDrawerToggle} themeMode={themeMode} onToggleTheme={handleToggleTheme} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 1, sm: 1.5, md: 2 },
              backgroundColor: "background.default",
              minHeight: "calc(100vh - 120px)",
            }}
          >
            <Box id="main-content" sx={{ outline: "none" }}>
          <Outlet />
        </Box>
          </Box>
          <MobileFab />
          <Suspense fallback={null}>
            <FloatingAIAssistant />
            <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
          </Suspense>
          <GlobalSnackbar />
        </Box>
      </Box>
    </ThemeProvider>
    </ErrorBoundary>
  );
}