import React from "react";
import { Box, Typography, Button, Paper, useTheme } from "@mui/material";
import { FiPlus } from "react-icons/fi";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  color = "#e91e63"
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      sx={{
        p: { xs: 4, sm: 6 },
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 4,
        border: "2px dashed",
        borderColor: 'divider',
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : "rgba(0,0,0,0.02)",
        minHeight: 260,
        boxShadow: "none"
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? alpha(color, 0.2) : `${color}15`,
          color: color,
          mb: 1
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: "bold", color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 2 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={onAction}
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: color,
              opacity: 0.9,
              transform: "translateY(-2px)"
            },
            transition: "all 0.2s"
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

function alpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
