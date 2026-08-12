import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Box, Snackbar, Alert, CircularProgress, ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { useNotificationStore } from "./store/useNotificationStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileFab } from "./components/MobileFab";
import GlobalSearch from "./components/GlobalSearch";

const DRAWER_WIDTH = 260;

export default function Root() { useEffect(() => { document.title = "CRM DESEO DIGITAL"; }, []);
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
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      h4: { fontVariantNumeric: 'tabular-nums' },
      h5: { fontVariantNumeric: 'tabular-nums' },
      h6: { fontVariantNumeric: 'tabular-nums' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 14,
            transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundImage: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            minHeight: 36,
            padding: '6px 14px',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              fontWeight: 700,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
          },
        },
      },
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
              px: { xs: 1.5, sm: 2.5, md: 3.5 },
              py: { xs: 2, sm: 2.5, md: 3 },
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