import React from "react";
import { Box, Typography, SvgIconProps, useTheme } from "@mui/material";
import { FiInbox } from "react-icons/fi";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  color?: string;
}

export const EmptyState = ({
  title = "Sin datos",
  description = "Todavía no hay registros para mostrar en esta sección.",
  actionLabel,
  onAction,
  icon = <FiInbox size={28} color="#9ca3af" />,
  color,
}: EmptyStateProps) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      py: { xs: 4, sm: 6 }, 
      minHeight: { xs: 200, sm: 300 },
      textAlign: "center" 
    }}>
      <Box sx={{ mb: 1, opacity: 0.8, ...(color ? { color } : {}) }}>{icon}</Box>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 600, 
          color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#1f232e',
          mb: 0.5 
        }}
      >
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: actionLabel ? 1.5 : 0 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Box sx={{ mt: 0.5 }}>
          {/* Action button left for parent to render to keep component generic */}
        </Box>
      )}
    </Box>
  );
};
