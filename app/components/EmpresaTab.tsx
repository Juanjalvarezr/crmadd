import React from "react";
import { Box, Typography, Paper, Grid, TextField, Button, Avatar, CircularProgress } from "@mui/material";
import { FiSave, FiCamera, FiEdit } from "react-icons/fi";

interface EmpresaConfig {
  nombre: string;
  logo: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  pais: string;
  website: string;
  descripcion: string;
  googleBusinessLink?: string;
}

interface EmpresaTabProps {
  config: EmpresaConfig;
  onChange: (updates: Partial<EmpresaConfig>) => void;
  onSave: () => Promise<void>;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  loading: boolean;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
}

export const EmpresaTab: React.FC<EmpresaTabProps> = ({ config, onChange, onSave, onLogoUpload, loading, logoInputRef }) => {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        Información de la Empresa
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre de la Empresa"
            fullWidth
            value={config.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Sitio Web"
            fullWidth
            value={config.website}
            onChange={(e) => onChange({ website: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Teléfono"
            fullWidth
            value={config.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Email"
            fullWidth
            type="email"
            value={config.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={config.descripcion}
            onChange={(e) => onChange({ descripcion: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Avatar 
              src={config.logo}
              sx={{ width: 60, height: 60, backgroundColor: "#e91e63" }}
            >
              {!config.logo && <FiEdit size={24} color="white" />}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>Logo</Typography>
              <input type="file" hidden accept="image/*" ref={logoInputRef} onChange={onLogoUpload} />
              <Button size="small" startIcon={<FiCamera />} onClick={() => logoInputRef.current?.click()}>
                Subir Logo
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <FiSave />}
          onClick={onSave}
          disabled={loading}
          sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
        >
          Guardar Empresa
        </Button>
      </Box>
    </Paper>
  );
};