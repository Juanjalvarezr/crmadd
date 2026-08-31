import { Box, Typography, Paper, Button, Card, CardContent, Grid, Chip, TextField, Alert } from "@mui/material";
import { FiPlus } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";
import { useEffect } from "react";
import { reglasAIService } from "../../services/supabase";

interface Props {
  sops: any[];
  setSops: (sops: any[]) => void;
  nuevoSop: any;
  setNuevoSop: (sop: any) => void;
  setOpenSopModal?: (open: boolean) => void;
  onAddSop?: () => void;
  onDeleteSop?: (id: number) => void;
}

export const ConfigTabSop = ({ sops, setSops, nuevoSop, setNuevoSop, onAddSop, onDeleteSop }: Props) => {
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await reglasAIService.getAll();
        if (mounted) setSops(data || []);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [setSops]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Manual SOP</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Documenta procesos operativos y pasos obligatorios para el equipo.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField label="Título" size="small" value={nuevoSop.titulo} onChange={(e) => setNuevoSop({...nuevoSop, titulo: e.target.value})} />
        <TextField label="Categoría" size="small" value={nuevoSop.categoria} onChange={(e) => setNuevoSop({...nuevoSop, categoria: e.target.value})} />
        <Button variant="contained" onClick={onAddSop} startIcon={<FiPlus />} disabled={!nuevoSop.titulo.trim()}>Guardar</Button>
      </Box>

      <TextField fullWidth size="small" label="Descripción del proceso" multiline minRows={3} value={nuevoSop.descripcion} onChange={(e) => setNuevoSop({...nuevoSop, descripcion: e.target.value})} sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {sops.map((sop) => (
          <Grid item xs={12} md={4} key={sop.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{sop.titulo}</Typography>
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
  </Box>
  );
}
