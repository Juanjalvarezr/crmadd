import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, Snackbar, Alert, CircularProgress, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import GlobalSearch from "./components/GlobalSearch";

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

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: "#6366f1" },
          secondary: { main: "#ec4899" },
          background: { default: themeMode === "dark" ? "#0f172a" : "#f8fafc", paper: themeMode === "dark" ? "#1e293b" : "#ffffff" },
        },
        typography: { fontFamily: 'Inter, system-ui, sans-serif' },
      }),
    [themeMode]
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<"light" | "dark">;
      if (custom.detail) setThemeMode(custom.detail);
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
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme_mode", nextMode);
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: nextMode }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Header onToggleSidebar={handleDrawerToggle} onToggleTheme={handleToggleTheme} themeMode={themeMode} />
        <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, minHeight: "100vh", bgcolor: "background.default" }}>
          <Snackbar open={open} autoHideDuration={3000} onClose={hideNotification} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert onClose={hideNotification} severity={severity} sx={{ width: "100%" }}>
              {message}
            </Alert>
          </Snackbar>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Outlet />
          </Box>
        </Box>
        <MobileFab />
      </Box>
    </ThemeProvider>
  );
}
