import React from "react";
import { 
  Paper, Typography, Grid, Card, CardContent, Box, Button, TextField, Switch 
} from "@mui/material";
import { FiLock, FiCheck, FiRefreshCw } from "react-icons/fi";

interface SeguridadTabProps {
  config: any;
  onChange: (updates: any) => void;
  onUpdatePassword: () => Promise<void>;
}

export const SeguridadTab: React.FC<SeguridadTabProps> = ({ config, onChange, onUpdatePassword }) => {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
        Seguridad de la Cuenta
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>Cambiar Contraseña</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Actualiza tu contraseña de acceso al CRM
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => onChange({ cambiarPassword: !config.cambiarPassword })}
                >
                  {config.cambiarPassword ? "Cancelar" : "Cambiar"}
                </Button>
              </Box>
              
              {config.cambiarPassword && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        type="password"
                        label="Contraseña Actual"
                        fullWidth
                        value={config.passwordActual}
                        onChange={(e) => onChange({ passwordActual: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        type="password"
                        label="Nueva Contraseña"
                        fullWidth
                        value={config.passwordNuevo}
                        onChange={(e) => onChange({ passwordNuevo: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        fullWidth
                        value={config.passwordConfirmar}
                        onChange={(e) => onChange({ passwordConfirmar: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<FiCheck />}
                        onClick={onUpdatePassword}
                        sx={{ backgroundColor: "#4caf50", '&:hover': { backgroundColor: "#388e3c" } }}
                      >
                        Actualizar Contraseña
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>Autenticación 2FA</Typography>
                  <Typography variant="body2" color="text.secondary">Añade una capa extra de seguridad</Typography>
                </Box>
                <Switch checked={config.autenticacion2FA} onChange={(e) => onChange({ autenticacion2FA: e.target.checked })} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>Sesiones Activas</Typography>
                  <Typography variant="body2" color="text.secondary">{config.sesionesActivas} dispositivos conectados</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};