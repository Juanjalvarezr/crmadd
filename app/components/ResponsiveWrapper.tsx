import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  sx?: any;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  return (
    <Box
      sx={{
        ...sx,
        // Mejoras de accesibilidad
        "& *": {
          "&:focus": {
            outline: "2px solid #1976d2",
            outlineOffset: "2px",
          },
          "&:focus-visible": {
            outline: "2px solid #1976d2",
            outlineOffset: "2px",
          },
        },
        // Mejoras de responsividad
        overflowX: "auto",
        maxWidth: "100%",
      }}
      role="main"
      aria-label="Contenido principal"
    >
      {children}
    </Box>
  );
};

export const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  return {
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveValue: <T,>(mobile: T, tablet: T, desktop: T): T => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
  };
};
