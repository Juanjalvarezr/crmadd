import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, Snackbar, Alert, ThemeProvider, CssBaseline, createTheme, Typography } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import GlobalSearch from "./components/GlobalSearch";

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

export default function Root() {
  useEffect(() => { document.title = "CRM DESEO DIGITAL"; }, []);
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

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
    },
    typography: {
      fontSize: 13.5,
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      h6: { fontSize: '1.1rem' },
      body2: { fontSize: '0.85rem' },
      caption: { fontSize: '0.75rem' },
    },
  }), [themeMode]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("crm_logged_in")
        : null;
    const isAuthenticated = stored === null ? true : stored === "true";
    const isLoginPage = location.pathname === "/login";

    if (!isAuthenticated && !isLoginPage) {
      navigate("/login", { replace: true });
    } else if (isAuthenticated && isLoginPage) {
      navigate("/", { replace: true });
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
    </ErrorBoundary>
  );
}