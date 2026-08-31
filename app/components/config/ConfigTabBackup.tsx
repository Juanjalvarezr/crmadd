import { Box, Typography, Paper, Button, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Alert } from "@mui/material";
import { FiDatabase, FiDownload } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";

interface Props {
  onBackup: () => void;
  onRestore?: (...args: any[]) => void | Promise<void>;
}

export const ConfigTabBackup = ({ onBackup, onRestore }: Props) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Backup y Restauración</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gestioná copias de seguridad de tu CRM.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <Button variant="contained" startIcon={<FiDownload />} onClick={onBackup}>Crear Backup</Button>
        <Button variant="outlined" onClick={onRestore}>Restaurar Backup</Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Los backups se guardan en formato JSON y contienen toda la configuración y datos.
      </Alert>

      <List>
        <ListItem>
          <ListItemIcon><FiDatabase /></ListItemIcon>
          <ListItemText primary="Backup Manual - 8 de Mayo 2026" secondary="Tamaño: 2.1 MB • Completado exitosamente" />
          <ListItemSecondaryAction>
            <Button size="small" startIcon={<FiDownload />}>Descargar</Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </Paper>
  </Box>
);
