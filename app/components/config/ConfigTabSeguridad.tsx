import React from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { FiLock } from "react-icons/fi";

interface Props {
  passwordNuevo: string;
  onChangePassword: () => Promise<void>;
  loading: boolean;
}

export const ConfigTabSeguridad: React.FC<Props> = ({ passwordNuevo, onChangePassword, loading }) => (
  <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>Seguridad de la Cuenta</Typography>
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>Cambiar Contraseña</Typography>
            <Typography variant="body2" color="text.secondary">Actualiza tu contraseña de acceso al CRM</Typography>
          </Box>
          <Button variant="outlined" startIcon={<FiLock />} onClick={onChangePassword} disabled={!passwordNuevo || loading}>Actualizar</Button>
        </Box>
      </CardContent>
    </Card>
  </Box>
);
