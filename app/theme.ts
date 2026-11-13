import { createTheme, type ThemeOptions } from "@mui/material";

const base: ThemeOptions = {
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    mode: "dark",
    primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#ffffff" },
    secondary: { main: "#e91e63", light: "#ec407a", dark: "#c2185b", contrastText: "#ffffff" },
    success: { main: "#4caf50", light: "#81c784", dark: "#388e3c", contrastText: "#ffffff" },
    warning: { main: "#ff9800", light: "#ffb74d", dark: "#f57c00", contrastText: "#ffffff" },
    error: { main: "#f44336", light: "#e57373", dark: "#d32f2f", contrastText: "#ffffff" },
    info: { main: "#00e5ff", light: "#18ffff", dark: "#00acc1", contrastText: "#000000" },
    background: { default: "#0f1115", paper: "#161b22" },
    text: { primary: "#e6edf3", secondary: "#8b949e" },
  },
  shape: { borderRadius: 10 },
  spacing: 4,
  typography: {
    fontSize: 13.5,
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: { fontSize: "1.1rem", fontWeight: 700 },
    body2: { fontSize: "0.85rem" },
    caption: { fontSize: "0.75rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased", textRendering: "optimizeLegibility" },
        "::selection": { background: "rgba(233, 30, 99, 0.28)" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: 14,
          border: "1px solid",
          borderColor: theme.palette.divider,
          transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
          },
        }),
      },
      defaultProps: { elevation: 0 },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { boxShadow: "none" },
        },
        sizeSmall: { padding: "5px 10px", fontSize: "0.78rem" },
        sizeMedium: { padding: "7px 14px", fontSize: "0.82rem" },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { height: 24, fontSize: "0.7rem", fontWeight: 600, borderRadius: 8, "&.MuiChip-sizeSmall": { height: 22, fontSize: "0.65rem" } },
      },
      defaultProps: { size: "small" },
    },
    MuiTableCell: {
      styleOverrides: { root: { paddingTop: 10, paddingBottom: 10 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 18 } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { paddingTop: 16 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: "0.72rem" } },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2, borderRadius: 2 },
        root: { minHeight: 36 },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...base,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    ...base.palette,
    mode: "light" as const,
    background: { default: "#f6f8fa", paper: "#ffffff" },
    text: { primary: "#1f2328", secondary: "#57606a" },
  },
});

export const darkTheme = createTheme(base);

export const BRAND = {
  primary: "#1976d2",
  secondary: "#e91e63",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#00e5ff",
  purple: "#9c27b0",
  gold: "#ffd700",
  blue: "#2196f3",
} as const;

export const SURFACE = {
  main: "#161b22",
  raised: "#1c2129",
  subtle: "#0f1115",
} as const;

export const STATUS = {
  enProgreso: BRAND.primary,
  completado: BRAND.success,
  pausado: BRAND.warning,
  cancelado: BRAND.error,
  planificacion: BRAND.info,
  alta: BRAND.error,
  media: BRAND.warning,
  baja: BRAND.success,
  urgente: BRAND.secondary,
} as const;

export const SEMANTIC = {
  ...BRAND,
  ...SURFACE,
  ...STATUS,
} as const;

export type BrandColor = keyof typeof BRAND;
export type StatusColor = keyof typeof STATUS;
