import React from "react";
import { Box, Typography, SvgIconProps } from "@mui/material";
import { FiInbox } from "react-icons/fi";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title = "Sin datos",
  description = "Todavía no hay registros para mostrar en esta sección.",
  actionLabel,
  onAction,
  icon = <FiInbox size={28} color="#9ca3af" />,
}: EmptyStateProps) => (
  <Box sx={{ py: { xs: 3, sm: 4 }, textAlign: "center" }}>
    <Box sx={{ mb: 1, opacity: 0.8 }}>{icon}</Box>
    <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>
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
