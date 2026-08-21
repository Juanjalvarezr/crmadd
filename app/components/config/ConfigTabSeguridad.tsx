import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

interface Props {
  passwordNuevo: string;
  onChange: (updates: any) => void;
  onChangePassword: () => Promise<void>;
  loading: boolean;
}

export const ConfigTabSeguridad: React.FC<Props> = ({ passwordNuevo, onChange, onChangePassword, loading }) => (
  <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Seguridad de la Cuenta</Typography>
    <TextField label="Nueva Contraseña" type="password" fullWidth value={passwordNuevo} onChange={(e) => onChange({ passwordNuevo: e.target.value })} sx={{ mb: 2 }} />
    <Button variant="contained" onClick={onChangePassword} disabled={loading || !passwordNuevo}>Actualizar Contraseña</Button>
  </Box>
);
