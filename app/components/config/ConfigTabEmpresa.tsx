import React from "react";
import { Box, Typography, TextField, Grid, Button } from "@mui/material";

interface Props {
  config: any;
  onChange: (updates: any) => void;
  onSave: () => Promise<void>;
  loading: boolean;
}

export const ConfigTabEmpresa: React.FC<Props> = ({ config, onChange, onSave, onLogoUpload, loading, logoInputRef }) => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Información de la Empresa</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField label="Nombre de la Empresa" fullWidth value={config.nombre} onChange={(e) => onChange({ nombre: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Sitio Web" fullWidth value={config.website} onChange={(e) => onChange({ website: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Teléfono" fullWidth value={config.telefono} onChange={(e) => onChange({ telefono: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Email" fullWidth value={config.email} onChange={(e) => onChange({ email: e.target.value })} />
        </Grid>
      </Grid>
      <Button variant="contained" onClick={onSave} disabled={loading} sx={{ mt: 3 }}>Guardar Cambios</Button>
    </Box>
  );
};
