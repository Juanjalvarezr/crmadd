import { useState, useEffect } from 'react';
import { RouteSkeleton, RouteErrorBoundary } from '../components/RouteGuard';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert, Fade } from "@mui/material";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiFileText, FiMessageSquare, FiMail, FiFilter, FiSend, FiShoppingCart, FiDownload } from "react-icons/fi";
import { contratosService } from "../services/facturacion";
import { clientesService } from "../services/database";
import { proyectosService } from "../services/database";
import { generarContratoPDF } from "../services/pdf";
import { uploadPDFToStorage } from "../services/storage";
import ScannerTarjetas from "../components/ScannerTarjetas";

export default function Contratos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, clientesData, proyectosData] = await Promise.all([
        contratosService.getAll(),
        clientesService.getAll(),
        proyectosService.getAll()
      ]);
      setItems(data);
      setClientes(clientesData);
      setProyectos(proyectosData);
      setError(null);
    } catch (e) {
      setError('Error cargando contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getClienteNombre = (id: any) => {
    const c = clientes.find((x: any) => String(x.id) === String(id));
    return c?.nombre || c?.empresa || '-';
  };

  const getProyectoNombre = (id: any) => {
    const p = proyectos.find((x: any) => String(x.id) === String(id));
    return p?.nombre || '-';
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: any = {
      tipo: String(fd.get('tipo') || 'prestacion_servicios'),
      titulo: String(fd.get('titulo') || ''),
      contenido: String(fd.get('contenido') || ''),
      numero: String(fd.get('numero') || ''),
      estado: String(fd.get('estado') || 'borrador'),
      valor: Number(fd.get('valor') || 0),
      cliente_id: fd.get('cliente_id') ? Number(fd.get('cliente_id')) : null,
      proyecto_id: fd.get('proyecto_id') ? String(fd.get('proyecto_id')) : null,
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

  const handlePDF = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const pdfBlob = await generarContratoPDF(row, cliente);
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${row.numero || row.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const telefono = cliente?.telefono || cliente?.telefono_whatsapp || '';
    if (!telefono) return setError('El cliente no tiene teléfono');

    setSendingWhatsApp(row.id);
    try {
      const pdfBlob = await generarContratoPDF(row, cliente);
      const path = `contratos/${row.numero || row.id}`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, path);

      const msg = encodeURIComponent(`Hola ${cliente?.nombre || ''}, te comparto el contrato ${row.numero || row.id}: ${row.titulo}. Descargalo aqui: ${pdfUrl}`);
      window.open(`https://wa.me/${telefono.replace(/[^\d]/g, '')}?text=${msg}`, '_blank');
    } catch (e) {
      setError('Error generando PDF para WhatsApp');
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const handleEmail = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const email = cliente?.email || '';
    if (!email) return setError('El cliente no tiene email');

    try {
      const pdfBlob = await generarContratoPDF(row, cliente);
      const path = `contratos/${row.numero || row.id}`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, path);

      const html = `<p>Hola ${cliente?.nombre || ''},</p><p>Adjunto contrato ${row.numero || row.id}: ${row.titulo}.</p><p><a href="${pdfUrl}">Descargar contrato</a></p>`;
      const res = await contratosService.enviarEmail(row, html);
      setSuccess('Correo enviado');
    } catch (e) {
      setError('Error enviando correo');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = String(item.numero || item.titulo || item.id).toLowerCase().includes(search.toLowerCase()) ||
      getClienteNombre(item.cliente_id).toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filterEstado === 'all' || item.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Contratos</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<FiFilter />} onClick={() => setFilterEstado('all')}>Limpiar filtros</Button>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setEditItem(null); setOpen(true); }}>Nuevo Contrato</Button>
          <Button variant="contained" color="secondary" startIcon={<FiShoppingCart />} onClick={() => setScannerOpen(true)}>Escanear</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> }} sx={{ flex: 1, minWidth: 200 }} />
          <Select size="small" value={filterEstado} onChange={(e) => setFilterEstado(String(e.target.value))} sx={{ minWidth: 160 }}>
            <MenuItem value="all">Todos los estados</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="activo">Activo</MenuItem>
            <MenuItem value="firmado">Firmado</MenuItem>
            <MenuItem value="finalizado">Finalizado</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </Select>
        </Box>
      </Paper>

      {loading ? (
        <RouteSkeleton />
      ) : (
        <Fade in>
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const cliente = clientes.find((c: any) => String(c.id) === String(item.cliente_id));
                  const proyecto = proyectos.find((p: any) => String(p.id) === String(item.proyecto_id));
                  const telefono = cliente?.telefono || cliente?.telefono_whatsapp || '';
                  const email = cliente?.email || '';
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{item.numero || '—'}</TableCell>
                      <TableCell>{item.titulo}</TableCell>
                      <TableCell>{cliente?.nombre || '-'}</TableCell>
                      <TableCell>{proyecto?.nombre || '-'}</TableCell>
                      <TableCell><Chip label={item.tipo} size="small" /></TableCell>
                      <TableCell>
                        <Chip
                          label={item.estado}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            bgcolor: item.estado === 'firmado' ? 'info.main' : item.estado === 'activo' ? 'success.main' : item.estado === 'cancelado' ? 'error.main' : 'warning.main',
                            color: 'common.white',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Tooltip title="Ver"><IconButton size="small"><FiEye /></IconButton></Tooltip>
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditItem(item); setOpen(true); }}><FiEdit /></IconButton></Tooltip>
                          <Tooltip title="WhatsApp"><IconButton size="small" onClick={() => handleWhatsApp(item)} disabled={!telefono || sendingWhatsApp === item.id}><FiMessageSquare /></IconButton></Tooltip>
                          <Tooltip title="Email"><IconButton size="small" onClick={() => handleEmail(item)} disabled={!email}><FiMail /></IconButton></Tooltip>
                          <Tooltip title="PDF"><IconButton size="small" onClick={() => handlePDF(item)}><FiFileText /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(item.id)}><FiTrash2 /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">Sin contratos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}

      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
        <DialogContent>
          <form id="contrato-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Título" name="titulo" required defaultValue={editItem?.titulo || ''} sx={{ flex: 1 }} />
                <TextField label="Número" name="numero" defaultValue={editItem?.numero || ''} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Cliente</InputLabel>
                  <Select name="cliente_id" label="Cliente" defaultValue={editItem?.cliente_id || ''}>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {clientes.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Proyecto</InputLabel>
                  <Select name="proyecto_id" label="Proyecto" defaultValue={editItem?.proyecto_id || ''}>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'prestacion_servicios'}>
                    <MenuItem value="prestacion_servicios">Prestación de servicios</MenuItem>
                    <MenuItem value="acuerdo_confidencialidad">Acuerdo de confidencialidad</MenuItem>
                    <MenuItem value="propiedad_intelectual">Propiedad intelectual</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
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
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Valor" name="valor" type="number" defaultValue={editItem?.valor || ''} sx={{ flex: 1 }} />
              </Box>
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

      <ScannerTarjetas open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </Box>
  );
}
