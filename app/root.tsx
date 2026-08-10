import { useState, useMemo, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, Snackbar, Alert, CircularProgress, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import GlobalSearch from "./components/GlobalSearch";
import { supabase as supabaseClient } from "./services/supabase";
import { authService } from "./services/database";

const DRAWER_WIDTH = 260;

export default function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const { open, message, severity, hideNotification } = useNotificationStore();

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
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const theme = useMemo(() => createTheme({
    palette: { mode: themeMode },
    typography: {
      fontSize: 14,
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    },
  }), [themeMode]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const session = await authService.session();
        if (!mounted) return;
        setIsAuthenticated(Boolean(session));
      } catch (err) {
        if (!mounted) return;
        console.error("Auth init error:", err);
        setIsAuthenticated(false);
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    init();

    const { data: sub } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const isLoginPage = location.pathname === "/login";
    if (!authReady) return;

    if (!isAuthenticated && !isLoginPage) {
      navigate("/login", { replace: true });
    } else if (isAuthenticated && isLoginPage) {
      navigate("/", { replace: true });
    }
  }, [authReady, isAuthenticated, navigate, location.pathname]);

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

  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <Outlet />;
  }

  if (!authReady) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return null;
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

  const mainWidth: Record<string, string> = useMemo(() => {
    const collapsed = isCollapsed ? "calc(100% - 70px)" : "calc(100% - 200px)";
    return {
      xs: "100%",
      sm: collapsed,
      md: isCollapsed ? "calc(100% - 70px)" : `calc(100% - ${DRAWER_WIDTH}px)`,
    };
  }, [isCollapsed]);

  return (
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
            width: mainWidth,
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
            <Outlet />
          </Box>
          <MobileFab />
          <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Box>
      </Box>
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={hideNotification} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
