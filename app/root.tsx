import React from "react";
import { Outlet } from "react-router";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

const theme = React.useMemo(() => createTheme({
  palette: { mode: "dark" },
  typography: {
    fontSize: { xs: 13, sm: 14, md: 15 },
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
  },
}), []);

export default function Root() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Outlet />
      </Box>
    </ThemeProvider>
  );
}
