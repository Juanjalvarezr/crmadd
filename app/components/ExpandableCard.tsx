import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  useTheme,
} from "@mui/material";
import { FiChevronDown, FiChevronUp, FiMoreVertical } from "react-icons/fi";
import SafeChip from "../components/SafeChip";

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
  compact?: boolean;
  defaultExpanded?: boolean;
  titleColor?: string;
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
  compact = false,
  defaultExpanded = false,
  titleColor,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultExpanded);

  const isDark = theme.palette.mode === "dark";
  const bgPaper = isDark ? "#12131a" : "#ffffff";
  const border = isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)";
  const accentColor = titleColor || (isDark ? "#8b5cf6" : "#4f46e5");

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const toggleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <Paper
      onClick={onClick}
      sx={{
        bgcolor: bgPaper,
        border,
        borderRadius: 2.5,
        p: compact ? 1.5 : 2,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        overflow: "hidden",
        boxShadow: open ? (isDark ? 3 : 2) : (isDark ? 1 : 0.5),
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: isDark ? 3 : 2,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: accentColor,
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
                fontWeight: 800,
                color: accentColor,
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: { xs: 2, md: 1 },
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            {subtitle && (!compact || open) && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.35, alignItems: "center", flexShrink: 0 }}>
          {amount && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.78rem" }}>
              {amount}
            </Typography>
          )}
          {actions.length > 0 && (
            <IconButton size="small" sx={{ p: 0.5 }} onClick={handleActionClick}>
              <FiMoreVertical size={14} />
            </IconButton>
          )}
          <IconButton size="small" sx={{ p: 0.5 }} onClick={toggleOpen}>
            {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
        {status && (
          <SafeChip
            label={status.label}
            color={status.color || "default"}
            size="small"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
        {priority && (
          <SafeChip
            label={priority.label}
            color={priority.color || "default"}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
        {date && (
          <SafeChip
            label={date}
            size="small"
            variant="outlined"
            sx={{ height: 22, fontSize: "0.7rem", borderRadius: 1 }}
          />
        )}
      </Box>

      {compact && !open && subtitle && (
        <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {subtitle}
        </Typography>
      )}

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1.5, pt: 1.25, borderTop: border }}>{children}</Box>
      </Collapse>

      {footer && <Box sx={{ mt: open ? 1.5 : 0, pt: open ? 1.25 : 0, borderTop: open ? border : "none" }}>{footer}</Box>}
    </Paper>
  );
};

export default ExpandableCard;
