import React from "react";
import { useTheme } from "@mui/material";
import { Box } from "@mui/material";
import { Header } from "./Header";
import { Sidebar, DRAWER_WIDTH_CONST as DRAWER_WIDTH } from "./Sidebar";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: "flex", 
      minHeight: "100vh", 
      backgroundColor: theme.palette.background.default,
      transition: 'background-color 0.3s ease'
    }}>
      <Box component="a" href="#main-content" sx={{ position: "absolute", left: -9999, top: 6, background: "black", color: "white", p: 0.5, borderRadius: 0.5, zIndex: 9999, textDecoration: "none", fontSize: 0 }} onFocus={(e) => { (e.target as HTMLElement).style.left = "6px"; }} onBlur={(e) => { (e.target as HTMLElement).style.left = "-9999px"; }}>Saltar al contenido principal</Box>
      <Sidebar />
      <Box sx={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        minHeight: "100vh"
      }}>
        <Header />
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '1600px',
            mx: 'auto',
            transition: 'padding 0.3s ease'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
