import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography, Stack, Chip, Divider, Paper, Grid, LinearProgress
} from "@mui/material";
import { X } from "lucide-react";

export interface Field {
  label: string;
  value: string | number | React.ReactNode;
  accent?: boolean;
  span?: number;
}

interface EntityDetailPanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  fields?: Field[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({ open, title, subtitle, onClose, fields = [], children, actions }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, pr: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title || "Detalle"}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <IconButton onClick={onClose} size="small"><X size={16} /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.default" }}>
        {fields.length > 0 && (
          <Grid container spacing={2}>
            {fields.map((f, i) => (
              <Grid item xs={12} md={f.span ? (f.span === 2 ? 6 : 12) : 6} key={i}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{f.label}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, wordBreak: "break-word", color: f.accent ? "primary.main" : "text.primary" }}>
                    {typeof f.value === "boolean" ? (f.value ? "Sí" : "No") : f.value ?? "—"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "background.default" }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">{actions}</Stack>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default EntityDetailPanel;
