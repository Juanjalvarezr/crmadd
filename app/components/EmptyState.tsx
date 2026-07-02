import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
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
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 4,
        border: "2px dashed #e0e0e0",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        minHeight: 300,
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
          backgroundColor: `${color}15`,
          color: color,
          mb: 1
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
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
