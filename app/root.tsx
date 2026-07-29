import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, Snackbar, Alert, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import { FloatingAIAssistant } from "./components/FloatingAIAssistant";
import GlobalSearch from "./components/GlobalSearch";
import { OnboardingTour } from "./components/OnboardingTour";
import { supabase } from "./services/supabase";

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("theme_mode") as "light" | "dark") || "dark";
    }
    return "dark";
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState(true);

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
        background: { default: themeMode === 'dark' ? '#12131a' : '#f6f7fb', paper: themeMode === 'dark' ? '#1a1c24' : '#ffffff' },
        text: { primary: themeMode === 'dark' ? '#f1f5f9' : '#1f232e', secondary: themeMode === 'dark' ? '#cbd5e1' : '#617182' },
      },

      shape: { borderRadius: 10 },
      typography: {
        fontFamily: 'Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif',
        h4: { fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, fontWeight: 800, lineHeight: 1.2 },
        h5: { fontSize: { xs: '1.05rem', sm: '1.15rem' }, fontWeight: 700, lineHeight: 1.25 },
        h6: { fontSize: { xs: '0.95rem', sm: '1.05rem' }, fontWeight: 700, lineHeight: 1.3 },
        body2: { fontSize: '0.82rem', lineHeight: 1.45 },
        caption: { fontSize: '0.72rem', lineHeight: 1.35 },
        button: { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem' },
      },
      components: {
        MuiCard: { styleOverrides: { root: { borderRadius: 14, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'box-shadow .15s ease, transform .15s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' } } } },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiButton: { styleOverrides: { root: { borderRadius: 10, padding: '6px 12px', transition: 'transform .15s ease, box-shadow .15s ease', '&:active': { transform: 'translateY(0)' } } } },
        MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid', borderColor: 'divider', padding: '6px 12px', transition: 'background .15s ease', '&:focus-visible': { backgroundColor: 'rgba(255,255,255,0.04)', outline: 'none' } } } },
        MuiChip: { styleOverrides: { root: { transition: 'all .15s ease', '&:hover': { transform: 'translateY(-0.5px)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset' } } } },
      }
    });

    themeRaw.palette.primary.contrastText = '#ffffff';
    themeRaw.palette.secondary.contrastText = '#ffffff';
    themeRaw.palette.success.contrastText = '#ffffff';
    themeRaw.palette.warning.contrastText = '#ffffff';
    themeRaw.palette.info.contrastText = '#ffffff';
    themeRaw.palette.error.contrastText = '#ffffff';
    return themeRaw;
  }, [themeMode]);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout en checkAuth')), 8000)
        );
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ]);
        if (!cancelled) {
          setIsAuthenticated(!!data?.session);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const isLoginPage = location.pathname === "/login";

    if (isAuthenticated && isLoginPage) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'light' || detail === 'dark') {
        setThemeMode(detail);
      }
    };
    window.addEventListener('theme-changed', handler as EventListener);
    return () => window.removeEventListener('theme-changed', handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => {
      setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };
    window.addEventListener('toggle-theme', handler as EventListener);
    return () => window.removeEventListener('toggle-theme', handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("open-global-search", handler as EventListener);
    return () => window.removeEventListener("open-global-search", handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener("open-onboarding", handler as EventListener);
    return () => window.removeEventListener("open-onboarding", handler as EventListener);
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

  const renderLayout = () => (
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
            <Outlet />
          </Box>
          <MobileFab />
          <FloatingAIAssistant />
          <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
          {showOnboarding && <OnboardingTour open={showOnboarding} onClose={() => setShowOnboarding(false)} />}
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

  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "background.default" }}>
        <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      </Box>
    );
  }

  if (location.pathname === "/" || location.pathname === "/clientes") {
    return renderLayout();
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

  return renderLayout();
}
