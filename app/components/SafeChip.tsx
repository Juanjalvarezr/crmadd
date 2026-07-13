import React from "react";

const SAFE_COLORS: Record<string, { bg: string; text: string; contrastText?: string }> = {
  default: { bg: "#e0e0e0", text: "#333333", contrastText: "#333333" },
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
  variant?: "filled" | "outlined";
  sx?: Record<string, any>;
  icon?: React.ReactNode;
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

  const base: Record<string, any> = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isSmall ? "0 6px" : "0 10px",
    height: isSmall ? 18 : 30,
    borderRadius: "16px",
    fontSize: isSmall ? "0.65rem" : "0.75rem",
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    color: safe.text,
    backgroundColor: variant === "outlined" ? "transparent" : safe.bg,
    border: variant === "outlined" ? `1px solid ${safe.bg}` : "none",
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
