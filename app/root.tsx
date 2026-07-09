import React, { useEffect, useState, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { hydrateRoot } from "react-dom/client";
import { Box, Snackbar, Alert, CircularProgress, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import { FloatingAIAssistant } from "./components/FloatingAIAssistant";
import GlobalSearch from "./components/GlobalSearch";

// __INVALIDATE_BUILD_CACHE__ 2026-07-09T00:01:26.934Z
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

  const theme = React.useMemo(() => {
    const themeRaw = createTheme({
      palette: {
        mode: themeMode,
        primary: { main: '#e91e63', light: '#f48fb1', dark: '#c2185b', contrastText: '#ffffff' },
        secondary: { main: '#9c27b0', light: '#ce93d8', dark: '#7b1fa2', contrastText: '#ffffff' },
        success: { main: '#4caf50', light: '#81c784', dark: '#2e7d32', contrastText: '#ffffff' },
        warning: { main: '#ff9800', light: '#ffb74d', dark: '#f57c00', contrastText: '#ffffff' },
        info: { main: '#2196f3', light: '#64b5f6', dark: '#1976d2', contrastText: '#ffffff' },
        error: { main: '#f44336', light: '#e57373', dark: '#d32f2f', contrastText: '#ffffff' },
        background: { default: themeMode === 'dark' ? '#0d0e15' : '#f6f7fb', paper: themeMode === 'dark' ? '#12131a' : '#ffffff' },
        text: { primary: themeMode === 'dark' ? '#e2e8f0' : '#1f232e', secondary: themeMode === 'dark' ? '#a0aec0' : '#617182' },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: 'Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif',
        h4: { fontSize: { xs: '1.25rem', sm: '1.6rem', md: '2rem' }, fontWeight: 800 },
        h5: { fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 700 },
        h6: { fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      components: {
        MuiCard: { styleOverrides: { root: { borderRadius: 16, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } } },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiButton: { styleOverrides: { root: { borderRadius: 10, padding: '6px 12px' } } },
        MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid', borderColor: 'divider' } } },
      }
    });

    const p = themeRaw.palette as any;
    for (const c of ['primary','secondary','success','warning','info','error','grey','text','background']) {
      if (p[c] && !('contrastText' in p[c])) {
        (p[c] as any).contrastText = '#ffffff';
      }
    }
    return themeRaw;
  }, [themeMode]);

  useEffect(() => {
    const isAuthenticated =
      typeof window !== "undefined" &&
      window.localStorage.getItem("crm_logged_in") === "true";
    const isLoginPage = location.pathname === "/login";

    if (!isAuthenticated && !isLoginPage) {
      navigate("/login");
    } else if (isAuthenticated && isLoginPage) {
      navigate("/");
    }
  }, [navigate, location.pathname]);

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

  useEffect(() => {
    const handler = () => {
      const el = document.getElementById('floating-ai-assistant');
      if (el) el.dispatchEvent(new CustomEvent('open-assistant'));
    };
    window.addEventListener("open-ai-chat", handler as EventListener);
    return () => window.removeEventListener("open-ai-chat", handler as EventListener);
  }, []);

  if (location.pathname === "/login") {
    return <Outlet />;
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
              sm: isCollapsed ? "calc(100% - 72px)" : "calc(100% - 220px)",
              md: isCollapsed ? "calc(100% - 72px)" : `calc(100% - ${DRAWER_WIDTH}px)`,
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
              p: { xs: 1, sm: 2, md: 3 },
              backgroundColor: "background.default",
              minHeight: "calc(100vh - 96px)",
            }}
          >
            <Suspense
              fallback={
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <Outlet />
            </Suspense>
          </Box>
          <MobileFab />
          <FloatingAIAssistant />
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
