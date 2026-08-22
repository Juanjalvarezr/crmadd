import { Box, Typography, Paper, Button, Card, CardContent, Grid, Chip, IconButton } from "@mui/material";
import { FiPlus, FiEdit, FiX } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";
import { plantillasDocumentosService } from "../../services/supabase";

interface Props {
  plantillasDocs: any[];
  setPlantillasDocs: (docs: any[]) => void;
  setEditingDocTemplateId: (id: number | null) => void;
  setDocTemplateForm: (form: any) => void;
  setOpenDocTemplateModal: (open: boolean) => void;
}

export const ConfigTabPlantillas = ({ plantillasDocs, setPlantillasDocs, setEditingDocTemplateId, setDocTemplateForm, setOpenDocTemplateModal }: Props) => {
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await plantillasDocumentosService.getAll();
        if (mounted) setPlantillasDocs(data || []);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [setPlantillasDocs]);
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>Plantillas</Typography>
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => { setEditingDocTemplateId(null); setDocTemplateForm({ tipo: "cotizacion", nombre: "", contenido: "", iva_porcentaje: 19, color_primario: "#1976d2", color_secundario: "#e91e63", logo_url: "", activo: true }); setOpenDocTemplateModal(true); }} startIcon={<FiPlus size={14} />}>Nueva plantilla</Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {plantillasDocs.map((p) => (
                  <Grid item xs={6} md={4} key={p.id}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Chip size="small" label={p.tipo} sx={{ height: 22, fontSize: "0.7rem" }} />
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton size="small" onClick={() => { setEditingDocTemplateId(p.id); setDocTemplateForm({ tipo: p.tipo, nombre: p.nombre, contenido: p.contenido, iva_porcentaje: Number(p.iva_porcentaje || 19), color_primario: p.color_primario || "#1976d2", color_secundario: p.color_secundario || "#e91e63", logo_url: p.logo_url || "", activo: !!p.activo }); setOpenDocTemplateModal(true); }}><FiEdit size={14} /></IconButton>
                            <IconButton size="small" color="error" onClick={async () => { if (!confirm(`¿Eliminar plantilla #${p.id}?`)) return; await plantillasDocumentosService.remove(p.id); setPlantillasDocs(plantillasDocs.filter((x: any) => x.id !== p.id)); globalSnack.show("Plantilla eliminada", "success"); }}><FiX size={14} /></IconButton>
                          </Box>
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{p.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>IVA: {p.iva_porcentaje ?? 19}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {plantillasDocs.length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Sin plantillas. Creá una para cotizaciones/facturas/contratos/recibos.</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
  </Box>
);