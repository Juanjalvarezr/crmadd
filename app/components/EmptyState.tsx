import { Box, Typography, Button } from "@mui/material";
import { FiPlus } from "react-icons/fi";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
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
