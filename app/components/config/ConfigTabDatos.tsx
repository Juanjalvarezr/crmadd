import { Box, Typography, Paper, Button, Alert, CircularProgress, Chip } from "@mui/material";
import { FiDatabase, FiCheck, FiAlertCircle } from "react-icons/fi";

interface Props {
  dbStatus: any;
  loading: boolean;
  onSeed: () => void;
}

export const ConfigTabDatos = ({ dbStatus, loading }: Props) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Datos Reales</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Inicialización con Datos Reales de DESEO DIGITAL. Esto limpiará las tablas existentes de prueba y las poblará con datos de alta fidelidad.
      </Typography>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Nota:</strong> Esta acción borrará los registros de prueba actuales de Clientes, Ventas, Tareas y Proyectos.
      </Alert>
      <Button variant="contained" disabled={loading} onClick={onSeed} sx={{ backgroundColor: "#e91e63", "&:hover": { backgroundColor: "#c2185b" } }}>
        Cargar Datos Reales
      </Button>
    </Paper>
  </Box>
);
