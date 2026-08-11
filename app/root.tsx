import React, { useMemo } from "react";
import { Outlet } from "react-router";
import { Box, ThemeProvider, CssBaseline, createTheme } from "@mui/material";

const DRAWER_WIDTH = 260;

export default function Root() {
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">(() => {
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, minHeight: "100vh", bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
