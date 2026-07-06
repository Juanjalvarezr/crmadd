import { useState, useEffect } from 'react';
import { RouteSkeleton, RouteErrorBoundary } from '../components/RouteGuard';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { FiPlus, FiFilter, FiFileText, FiShoppingCart, FiDownload, FiEye, FiEdit, FiTrash2, FiX, FiSearch, FiMessageSquare, FiMail } from "react-icons/fi";
import { facturasService } from "../services/facturacion";
import { clientesService } from "../services/database";
import { proyectosService } from "../services/database";

export default function Facturacion() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [facturasData, clientesData, proyectosData] = await Promise.all([
        facturasService.getAll(),
        clientesService.getAll(),
        proyectosService.getAll()
      ]);
      setItems(facturasData);
      setClientes(clientesData);
      setProyectos(proyectosData);
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
    const data: any = {
      numero: String(fd.get('numero') || ''),
      tipo: String(fd.get('tipo') || 'servicio'),
      subtotal: Number(fd.get('subtotal') || 0),
      iva: Number(fd.get('iva') || 0),
      total: Number(fd.get('total') || 0),
      moneda: String(fd.get('moneda') || 'COP'),
      estado: String(fd.get('estado') || 'borrador'),
      notas: String(fd.get('notas') || ''),
      cliente_id: fd.get('cliente_id') ? Number(fd.get('cliente_id')) : null,
      proyecto_id: fd.get('proyecto_id') ? String(fd.get('proyecto_id')) : null,
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
              <TableCell>Cliente</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const cliente = clientes.find((c: any) => String(c.id) === String(item.cliente_id));
              const proyecto = proyectos.find((p: any) => String(p.id) === String(item.proyecto_id));
              const telefono = cliente?.telefono || cliente?.telefono_whatsapp || '';
              const email = cliente?.email || '';
              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{item.numero}</TableCell>
                  <TableCell>{cliente?.nombre || '-'}</TableCell>
                  <TableCell>{proyecto?.nombre || '-'}</TableCell>
                  <TableCell><Chip label={item.tipo} size="small" /></TableCell>
                  <TableCell>{item.moneda} {item.total?.toLocaleString()}</TableCell>
                  <TableCell><Chip label={item.estado} size="small" color={item.estado === 'pagada' ? 'success' : item.estado === 'enviada' ? 'info' : 'default'} /></TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Tooltip title="Ver"><IconButton size="small"><FiEye /></IconButton></Tooltip>
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditItem(item); setOpen(true); }}><FiEdit /></IconButton></Tooltip>
                      <Tooltip title="WhatsApp"><IconButton size="small" onClick={() => {
                        const msg = encodeURIComponent(`Hola ${cliente?.nombre || ''}, te comparto la factura ${item.numero || item.id} por un valor de ${item.moneda} ${item.total?.toLocaleString()}`);
                        window.open(`https://wa.me/${telefono.replace(/[^\d]/g, '')}?text=${msg}`, '_blank');
                      }} disabled={!telefono}><FiMessageSquare /></IconButton></Tooltip>
                      <Tooltip title="Email"><IconButton size="small" onClick={async () => {
                        if (!email) return setError('El cliente no tiene email');
                        try {
                          const html = `<p>Hola ${cliente?.nombre || ''},</p><p>Adjunto factura ${item.numero || item.id} por ${item.moneda} ${item.total?.toLocaleString()}.</p>`;
                          const res = await facturasService.enviarEmail(item, html);
                          setSuccess('Correo enviado');
                        } catch (e) { setError('Error enviando correo'); }
                      }} disabled={!email}><FiMail /></IconButton></Tooltip>
                      <Tooltip title="PDF"><IconButton size="small" onClick={() => {
                        const pdf = facturasService.pdf(item, cliente);
                        pdf.save(`factura-${item.numero || item.id}.pdf`);
                      }}><FiFileText /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(item.id)}><FiTrash2 /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">Sin facturas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
        <DialogContent>
          <form id="factura-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Número" name="numero" required defaultValue={editItem?.numero || ''} sx={{ flex: 1 }} />
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Cliente</InputLabel>
                  <Select name="cliente_id" label="Cliente" defaultValue={editItem?.cliente_id || ''}>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {clientes.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Proyecto</InputLabel>
                  <Select name="proyecto_id" label="Proyecto" defaultValue={editItem?.proyecto_id || ''}>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 140, flex: 1 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'servicio'}>
                    <MenuItem value="servicio">Servicio</MenuItem>
                    <MenuItem value="producto">Producto</MenuItem>
                    <MenuItem value="mixto">Mixto</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Subtotal" name="subtotal" type="number" defaultValue={editItem?.subtotal || ''} sx={{ flex: 1 }} />
                <TextField label="IVA" name="iva" type="number" defaultValue={editItem?.iva || ''} sx={{ flex: 1 }} />
                <TextField label="Total" name="total" type="number" defaultValue={editItem?.total || ''} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel>Moneda</InputLabel>
                  <Select name="moneda" label="Moneda" defaultValue={editItem?.moneda || 'COP'}>
                    <MenuItem value="COP">COP</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 140, flex: 1 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select name="estado" label="Estado" defaultValue={editItem?.estado || 'borrador'}>
                    <MenuItem value="borrador">Borrador</MenuItem>
                    <MenuItem value="enviada">Enviada</MenuItem>
                    <MenuItem value="pagada">Pagada</MenuItem>
                    <MenuItem value="anulada">Anulada</MenuItem>
                  </Select>
                </FormControl>
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
