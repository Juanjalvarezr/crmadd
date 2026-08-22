import { Box, Typography, Paper, Button, Card, CardContent, Grid, Chip, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, IconButton, Divider } from "@mui/material";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { globalSnack } from "../GlobalSnackbar";

interface Props {
  catalogos: any;
  setCatalogos: (c: any) => void;
  nuevoItem: any;
  setNuevoItem: (item: any) => void;
  handleSaveCatalogos: (c: any) => void;
  handleAddItem: () => void;
  handleDeleteItem: (tipo: string, item: string) => void;
}

export const ConfigTabCampos = ({ catalogos, setCatalogos, nuevoItem, setNuevoItem, handleSaveCatalogos, handleAddItem, handleDeleteItem }: Props) => {
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await configuracionService.getEmpresa();
        if (mounted && data?.catalogos) setCatalogos(data.catalogos);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [setCatalogos]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Personalización de Campos e Items</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ajusta las celdas, dropdowns y estados de todos los módulos del CRM. Los cambios se aplicarán al sistema.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sección / Dropdown</InputLabel>
          <Select size="small" value={nuevoItem.tipo} label="Sección / Dropdown" onChange={(e) => setNuevoItem({...nuevoItem, tipo: e.target.value})}>
            <MenuItem value="estadosCliente">Estados de Cliente</MenuItem>
            <MenuItem value="etapasVenta">Etapas de Ventas (Pipeline)</MenuItem>
            <MenuItem value="prioridadesTarea">Prioridades de Tareas</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth size="small" placeholder="Ej: Pendiente de Pago" value={nuevoItem.valor} onChange={(e) => setNuevoItem({...nuevoItem, valor: e.target.value})} />
        <Button variant="contained" onClick={handleAddItem} startIcon={<FiPlus />} sx={{ backgroundColor: '#e91e63', '&:hover': { backgroundColor: '#c2185b' } }}>Añadir Item</Button>
      </Box>

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 2 }}>Estados de Cliente</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense>
                {(catalogos.estadosCliente || []).map((item: string) => (
                  <ListItem key={item} secondaryAction={<IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("estadosCliente", item)}><FiTrash2 size={14} /></IconButton>}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 2 }}>Etapas de Ventas (Pipeline)</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense>
                {(catalogos.etapasVenta || []).map((item: string) => (
                  <ListItem key={item} secondaryAction={<IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("etapasVenta", item)}><FiTrash2 size={14} /></IconButton>}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f44336', mb: 2 }}>Prioridades de Tarea</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense>
                {(catalogos.prioridadesTarea || []).map((item: string) => (
                  <ListItem key={item} secondaryAction={<IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("prioridadesTarea", item)}><FiTrash2 size={14} /></IconButton>}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  </Box>
  );
}
