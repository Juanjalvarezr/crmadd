import { Box, Typography, Button } from "@mui/material";
import { FiPlus } from "react-icons/fi";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  color,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
      {icon && <Box sx={{ color: color || 'text.secondary', mb: 1 }}>{icon}</Box>}
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button size="small" variant="text" startIcon={<FiPlus size={14} />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
