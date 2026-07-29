import React from "react";
import { useTheme } from "@mui/material";

const SAFE_COLORS: Record<string, { bg: string; text: string; contrastText?: string }> = {
  default: { bg: "rgba(0,0,0,0.07)", text: "text.primary", contrastText: "#333333" },
  primary: { bg: "#e91e63", text: "#ffffff", contrastText: "#ffffff" },
  secondary: { bg: "#9c27b0", text: "#ffffff", contrastText: "#ffffff" },
  success: { bg: "#4caf50", text: "#ffffff", contrastText: "#ffffff" },
  warning: { bg: "#ff9800", text: "#ffffff", contrastText: "#ffffff" },
  info: { bg: "#2196f3", text: "#ffffff", contrastText: "#ffffff" },
  error: { bg: "#f44336", text: "#ffffff", contrastText: "#ffffff" },
};

interface SafeChipProps {
  label: string;
  color?: keyof typeof SAFE_COLORS;
  size?: "small" | "medium";
  variant?: "filled" | "outlined" | "tonal";
  sx?: Record<string, any>;
  icon?: React.ReactNode;
  hover?: boolean;
  [key: string]: any;
}

const SafeChip: React.FC<SafeChipProps> = ({
  label,
  color = "default",
  size = "small",
  variant = "filled",
  sx = {},
  icon,
  ...rest
}) => {
  const safe = SAFE_COLORS[color] || SAFE_COLORS.default;
  const isSmall = size === "small";

  const tonalBg = variant === "tonal" ? `${safe.bg}18` : undefined;
  const tonalBorder = variant === "tonal" ? `1px solid ${safe.bg}55` : undefined;

  const base: Record<string, any> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isSmall ? "0 7px" : "0 11px",
    height: isSmall ? 20 : 32,
    borderRadius: "18px",
    fontSize: isSmall ? "0.68rem" : "0.78rem",
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
    color: safe.text,
    backgroundColor: variant === "outlined" ? "transparent" : variant === "tonal" ? tonalBg : safe.bg,
    border: variant === "outlined" ? `1px solid ${safe.bg}` : variant === "tonal" ? tonalBorder : "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    ...(hover ? { cursor: "pointer", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 4px 10px rgba(0,0,0,0.08)" } } : {}),
    ...sx,
  };

  return (
    <span style={base} {...rest}>
      {icon && <span style={{ display: 'inline-flex', marginRight: '0.25rem', alignItems: 'center' }}>{icon}</span>}
      {label}
    </span>
  );
};

export default SafeChip;
