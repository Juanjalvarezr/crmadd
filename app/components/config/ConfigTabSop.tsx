import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton } from "@mui/material";
import { FiList, FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";

interface Props {
  sops: any[];
  setSops: (sops: any[]) => void;
  nuevoSop: any;
  setNuevoSop: (sop: any) => void;
  setOpenSopModal: (open: boolean) => void;
  onAddSop: () => void;
  onDeleteSop: (id: number) => void;
}

export const ConfigTabSop = ({ sops, setSops, nuevoSop, setNuevoSop, setOpenSopModal, onAddSop, onDeleteSop }: Props) => (
  <Box sx={ display: "flex", flexDirection: "column", gap: 2 }>
                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>📄 Manual SOP</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Documenta procesos operativos y pasos obligatorios para el equipo.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField 
                  label="Título" 
                  size="small"
                  value={nuevoSop.titulo}
                  onChange={(e) => setNuevoSop({...nuevoSop, titulo: e.target.value})}
                />
                <TextField 
                  label="Categoría" 
                  size="small"
                  value={nuevoSop.categoria}
                  onChange={(e) => setNuevoSop({...nuevoSop, categoria: e.target.value})}
                />
                <Button variant="contained" onClick={() => { if (!nuevoSop.titulo.trim()) return; setSops([{ ...nuevoSop }, ...sops]); setNuevoSop({ titulo: "", descripcion: "", categoria: "operaciones" }); }} startIcon={<FiPlus />}>Guardar</Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descripción del proceso"
                  multiline
                  minRows={3}
                  value={nuevoSop.descripcion}
                  onChange={(e) => setNuevoSop({...nuevoSop, descripcion: e.target.value})}
                />
              </Box>

              <Grid container spacing={2}>
                {sops.map((sop, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e91e63' }}>{sop.titulo}</Typography>
                        <Chip label={sop.categoria} size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">{sop.descripcion}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {sops.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">No hay SOPs creados.</Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Campos y Estados Personalizados */}
  </Box>
);
