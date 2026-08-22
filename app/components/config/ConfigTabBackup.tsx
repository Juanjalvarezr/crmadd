import { Box, Typography, Paper, Button, Alert, CircularProgress } from "@mui/material";
import { FiDatabase, FiDownload, FiUpload } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";

interface Props {
  onBackup: () => void;
  onRestore: () => void;
}

export const ConfigTabBackup = ({ onBackup, onRestore }: Props) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Backup y Restauración
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiDownload size={24} color={BRAND.success} />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Crear Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Descarga una copia completa de tu configuración y datos del CRM
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiDownload />}
                        onClick={() => setOpenBackupDialog(true)}
                        sx={{ backgroundColor: BRAND.success, '&:hover': { backgroundColor: "#388e3c" } }}
                      >
                        Descargar Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiUpload size={24} color="#ff9800" />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Restaurar Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sube un archivo de backup para restaurar tu configuración
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiUpload />}
                        onClick={() => setOpenRestoreDialog(true)}
                        sx={{ backgroundColor: "#ff9800", '&:hover': { backgroundColor: "#f57c00" } }}
                      >
                        Subir Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>              
              <Divider sx={{ my: 3 }} />              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Historial de Backups
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Automático - 11 de Mayo 2026"
                    secondary="Tamaño: 2.4 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Manual - 8 de Mayo 2026"
                    secondary="Tamaño: 2.1 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          )}
  </Box>
);
