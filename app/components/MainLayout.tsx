import React from "react";
import { Box } from "@mui/material";
import { Header } from "./Header";
import { Sidebar, DRAWER_WIDTH_CONST } from "./Sidebar";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header />
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            ml: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
