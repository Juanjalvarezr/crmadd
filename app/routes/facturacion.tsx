import { useState, useEffect } from 'react';
import { RouteSkeleton, RouteErrorBoundary } from '../components/RouteGuard';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { FiPlus, FiFilter, FiFileText, FiShoppingCart, FiDownload, FiEye, FiEdit, FiTrash2, FiX, FiSearch } from "react-icons/fi";
import { facturasService } from "../services/facturacion";

export default function Facturacion() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await facturasService.getAll();
      setItems(data);
      setError(null);
    } catch (e) {
      setError('Error cargando facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      numero: String(fd.get('numero') || ''),
      tipo: String(fd.get('tipo') || 'servicio'),
      subtotal: Number(fd.get('subtotal') || 0),
      iva: Number(fd.get('iva') || 0),
      total: Number(fd.get('total') || 0),
      moneda: String(fd.get('moneda') || 'COP'),
      estado: String(fd.get('estado') || 'borrador'),
      notas: String(fd.get('notas') || ''),
    };

    try {
      if (editItem?.id) {
        await facturasService.update(editItem.id, data);
        setSuccess('Factura actualizada');
      } else {
        await facturasService.create(data);
        setSuccess('Factura creada');
      }
      setOpen(false);
      setEditItem(null);
      form.reset();
      load();
    } catch (e) {
      setError('Error guardando factura');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar factura?')) return;
    await facturasService.delete(id);
    load();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Facturación</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FiDownload />} onClick={() => alert('Exportar CSV próximamente')}>Exportar</Button>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setEditItem(null); setOpen(true); }}>Nueva Factura</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Buscar factura..." InputProps={{ startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> }} />
          <Select size="small" defaultValue="all" sx={{ minWidth: 140 }}>
            <MenuItem value="all">Todos los estados</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="enviada">Enviada</MenuItem>
            <MenuItem value="pagada">Pagada</MenuItem>
            <MenuItem value="anulada">Anulada</MenuItem>
          </Select>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{item.numero}</TableCell>
                <TableCell><Chip label={item.tipo} size="small" /></TableCell>
                <TableCell>{item.moneda} {item.total?.toLocaleString()}</TableCell>
                <TableCell><Chip label={item.estado} size="small" color={item.estado === 'pagada' ? 'success' : item.estado === 'enviada' ? 'info' : 'default'} /></TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="Ver"><IconButton size="small"><FiEye /></IconButton></Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditItem(item); setOpen(true); }}><FiEdit /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(item.id)}><FiTrash2 /></IconButton></Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">Sin facturas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
        <DialogContent>
          <form id="factura-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Número" name="numero" required defaultValue={editItem?.numero || ''} />
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'servicio'}>
                    <MenuItem value="servicio">Servicio</MenuItem>
                    <MenuItem value="producto">Producto</MenuItem>
                    <MenuItem value="mixto">Mixto</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Moneda</InputLabel>
                  <Select name="moneda" label="Moneda" defaultValue={editItem?.moneda || 'COP'}>
                    <MenuItem value="COP">COP</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select name="estado" label="Estado" defaultValue={editItem?.estado || 'borrador'}>
                    <MenuItem value="borrador">Borrador</MenuItem>
                    <MenuItem value="enviada">Enviada</MenuItem>
                    <MenuItem value="pagada">Pagada</MenuItem>
                    <MenuItem value="anulada">Anulada</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Subtotal" name="subtotal" type="number" defaultValue={editItem?.subtotal || ''} sx={{ flex: 1 }} />
                <TextField label="IVA" name="iva" type="number" defaultValue={editItem?.iva || ''} sx={{ flex: 1 }} />
                <TextField label="Total" name="total" type="number" defaultValue={editItem?.total || ''} sx={{ flex: 1 }} />
              </Box>
              <TextField label="Notas" name="notas" multiline rows={3} defaultValue={editItem?.notas || ''} />
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditItem(null); }}>Cancelar</Button>
          <Button type="submit" form="factura-form" variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
