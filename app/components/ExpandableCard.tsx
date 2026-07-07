import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Paper,
  useTheme,
} from "@mui/material";
import { FiChevronDown, FiChevronUp, FiMoreVertical } from "react-icons/fi";

export interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: { label: string; color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" };
  priority?: { label: string; color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" };
  date?: string;
  amount?: string | number;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode[];
  onClick?: () => void;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  icon,
  status,
  priority,
  date,
  amount,
  footer,
  children,
  actions = [],
  onClick,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const isDark = theme.palette.mode === "dark";
  const bgPaper = isDark ? "#12131a" : "#ffffff";
  const border = isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)";

  return (
    <Paper
      onClick={onClick}
      sx={{
        bgcolor: bgPaper,
        border,
        borderRadius: 2,
        p: 2,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark ? 3 : 1,
        },
      }}
    >
      {/* Encabezado compacto */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexShrink: 0 }}>
          {amount && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.8rem" }}>
              {amount}
            </Typography>
          )}
          {actions.length > 0 && (
            <IconButton size="small" sx={{ p: 0.5 }} onClick={(e) => { e.stopPropagation(); }}>
              <FiMoreVertical size={14} />
            </IconButton>
          )}
          <IconButton
            size="small"
            sx={{ p: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
          >
            {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </IconButton>
        </Box>
      </Box>

      {/* Chips compactos */}
      <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
        {status && (
          <Chip
            label={status.label}
            color={status.color || "default"}
            size="small"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
        {priority && (
          <Chip
            label={priority.label}
            color={priority.color || "default"}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
        {date && (
          <Chip
            label={date}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
      </Box>

      {/* Contenido expandible */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pt: 1.5, borderTop: border }}>{children}</Box>
      </Collapse>

      {/* Footer / acciones */}
      {footer && <Box sx={{ mt: open ? 2 : 0, pt: open ? 1.5 : 0, borderTop: open ? border : "none" }}>{footer}</Box>}
    </Paper>
  );
};

export default ExpandableCard;
