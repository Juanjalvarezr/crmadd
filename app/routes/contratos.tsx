import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiFileText } from "react-icons/fi";
import { contratosService } from "../services/facturacion";

export default function Contratos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await contratosService.getAll();
      setItems(data);
      setError(null);
    } catch (e) {
      setError('Error cargando contratos');
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
      tipo: String(fd.get('tipo') || 'prestacion_servicios'),
      titulo: String(fd.get('titulo') || ''),
      contenido: String(fd.get('contenido') || ''),
      numero: String(fd.get('numero') || ''),
      estado: String(fd.get('estado') || 'borrador'),
      valor: Number(fd.get('valor') || 0),
    };

    try {
      if (editItem?.id) {
        await contratosService.update(editItem.id, data);
        setSuccess('Contrato actualizado');
      } else {
        await contratosService.create(data);
        setSuccess('Contrato creado');
      }
      setOpen(false);
      setEditItem(null);
      form.reset();
      load();
    } catch (e) {
      setError('Error guardando contrato');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar contrato?')) return;
    await contratosService.delete(id);
    load();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Contratos</Typography>
        <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setEditItem(null); setOpen(true); }}>Nuevo Contrato</Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{item.numero || '—'}</TableCell>
                <TableCell>{item.titulo}</TableCell>
                <TableCell><Chip label={item.tipo} size="small" /></TableCell>
                <TableCell><Chip label={item.estado} size="small" color={item.estado === 'activo' ? 'success' : item.estado === 'firmado' ? 'info' : 'default'} /></TableCell>
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
              <TableRow><TableCell colSpan={5} align="center">Sin contratos</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
        <DialogContent>
          <form id="contrato-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Título" name="titulo" required defaultValue={editItem?.titulo || ''} />
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'prestacion_servicios'}>
                    <MenuItem value="prestacion_servicios">Prestación de servicios</MenuItem>
                    <MenuItem value="acuerdo_confidencialidad">Acuerdo de confidencialidad</MenuItem>
                    <MenuItem value="propiedad_intelectual">Propiedad intelectual</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select name="estado" label="Estado" defaultValue={editItem?.estado || 'borrador'}>
                    <MenuItem value="borrador">Borrador</MenuItem>
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="firmado">Firmado</MenuItem>
                    <MenuItem value="finalizado">Finalizado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField label="Número" name="numero" defaultValue={editItem?.numero || ''} />
              <TextField label="Valor" name="valor" type="number" defaultValue={editItem?.valor || ''} />
              <TextField label="Contenido" name="contenido" multiline rows={6} defaultValue={editItem?.contenido || ''} />
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditItem(null); }}>Cancelar</Button>
          <Button type="submit" form="contrato-form" variant="contained">Guardar</Button>
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
