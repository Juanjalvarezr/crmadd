import React from "react";
import { Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { FiSun, FiMoon, FiGlobe } from "react-icons/fi";

interface Props {
  preferenciasConfig: any;
  onChange: (updates: any) => void;
}

export const ConfigTabPreferencias: React.FC<Props> = ({ preferenciasConfig, onChange }) => (
  <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Preferencias de Usuario</Typography>
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Tema</InputLabel>
          <Select value={preferenciasConfig.tema} label="Tema" onChange={(e) => onChange({ ...preferenciasConfig, tema: e.target.value as "light" | "dark" | "auto" })}>
            <MenuItem value="light"><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><FiSun size={16} /> Claro</Box></MenuItem>
            <MenuItem value="dark"><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><FiMoon size={16} /> Oscuro</Box></MenuItem>
            <MenuItem value="auto"><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><FiGlobe size={16} /> Automático</Box></MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  </Box>
);
