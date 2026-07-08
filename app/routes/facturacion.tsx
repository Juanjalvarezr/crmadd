import { useState, useEffect, useMemo } from 'react';
import { RouteSkeleton, RouteErrorBoundary } from '../components/RouteGuard';
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert,
  Fade, Grid, Card, CardContent, InputAdornment
} from "@mui/material";
import {
  FiPlus, FiDownload, FiEye, FiEdit, FiTrash2, FiX, FiSearch,
  FiMessageSquare, FiMail, FiFilter, FiSend, FiFileText, FiShoppingCart, FiCpu
} from "react-icons/fi";
import { facturasService } from "../services/facturacion";
import { clientesService } from "../services/database";
import { proyectosService } from "../services/database";
import { generarFacturaPDF } from "../services/pdf";
import { uploadPDFToStorage } from "../services/storage";
import ScannerTarjetas from "../components/ScannerTarjetas";

export default function Facturacion() {
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
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterEstadoPago, setFilterEstadoPago] = useState("all");
  const [filterCliente, setFilterCliente] = useState("");
  const [filterProyecto, setFilterProyecto] = useState("");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);
  const [numeroSugerido, setNumeroSugerido] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [anulacionOpen, setAnulacionOpen] = useState(false);
  const [anulacionItem, setAnulacionItem] = useState<any>(null);
  const [anulacionMotivo, setAnulacionMotivo] = useState("");

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

  useEffect(() => {
    if (open && !editItem) {
      const year = new Date().getFullYear();
      facturasService.getSiguienteNumero(String(year)).then(setNumeroSugerido);
    }
  }, [open, editItem]);

  const getClienteNombre = (id: any) => {
    const c = clientes.find((x: any) => String(x.id) === String(id));
    return c?.nombre || c?.empresa || '-';
  };

  const getProyectoNombre = (id: any) => {
    const p = proyectos.find((x: any) => String(x.id) === String(id));
    return p?.nombre || '-';
  };

  const formatCOP = (v: any) => `$${Number(v || 0).toLocaleString("es-CO")}`;

  const resumen = useMemo(() => {
    return items.reduce((acc, item) => {
      const total = Number(item.total || 0);
      acc.total += total;
      acc.cantidad += 1;
      if (item.estado === 'pagada') acc.pagado += total;
      else if (item.estado === 'enviada') acc.enviado += total;
      else if (item.estado === 'anulada') acc.anulado += total;
      else acc.pendiente += total;
      return acc;
    }, { total: 0, cantidad: 0, pagado: 0, enviado: 0, anulado: 0, pendiente: 0 });
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = String(item.numero || item.id).toLowerCase().includes(search.toLowerCase()) ||
        getClienteNombre(item.cliente_id).toLowerCase().includes(search.toLowerCase());
      const matchesEstado = filterEstado === 'all' || item.estado === filterEstado;
      const matchesTipo = filterTipo === 'all' || item.tipo === filterTipo;
      const matchesEstadoPago = filterEstadoPago === 'all' || item.estado_pago === filterEstadoPago;
      const matchesCliente = !filterCliente || String(item.cliente_id) === String(filterCliente);
      const matchesProyecto = !filterProyecto || String(item.proyecto_id) === String(filterProyecto);
      const matchesFechaDesde = !filterFechaDesde || String(item.fecha_emision || '') >= filterFechaDesde;
      const matchesFechaHasta = !filterFechaHasta || String(item.fecha_emision || '') <= filterFechaHasta;
      return matchesSearch && matchesEstado && matchesTipo && matchesEstadoPago && matchesCliente && matchesProyecto && matchesFechaDesde && matchesFechaHasta;
    });
  }, [items, search, filterEstado, filterTipo, filterEstadoPago, filterCliente, filterProyecto, filterFechaDesde, filterFechaHasta, clientes, proyectos]);

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
      estado_pago: String(fd.get('estado_pago') || 'pendiente'),
      notas: String(fd.get('notas') || ''),
      fecha_emision: String(fd.get('fecha_emision') || new Date().toISOString().slice(0, 10)),
      fecha_vencimiento: String(fd.get('fecha_vencimiento') || ''),
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

  const handlePDF = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const pdfBlob = await generarFacturaPDF(row, cliente);
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${row.numero || row.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const pdfBlob = await generarFacturaPDF(row, cliente);
    const url = URL.createObjectURL(pdfBlob);
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleWhatsApp = async (row: any) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const telefono = cliente?.telefono || cliente?.telefono_whatsapp || '';
    if (!telefono) return setError('El cliente no tiene teléfono');

    setSendingWhatsApp(row.id);
    try {
      const pdfBlob = await generarFacturaPDF(row, cliente);
      const path = `facturas/${row.numero || row.id}`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, path);

      const msg = encodeURIComponent(`Hola ${cliente?.nombre || ''}, te comparto la factura ${row.numero || row.id} por un valor de ${row.moneda} ${formatCOP(row.total)}. Descargala aqui: ${pdfUrl}`);
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
      const pdfBlob = await generarFacturaPDF(row, cliente);
      const path = `facturas/${row.numero || row.id}`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, path);

      const html = `<p>Hola ${cliente?.nombre || ''},</p><p>Adjunto factura ${row.numero || row.id} por ${row.moneda} ${formatCOP(row.total)}.</p><p><a href="${pdfUrl}">Descargar factura</a></p>`;
      const res = await facturasService.enviarEmail(row, html);
      setSuccess('Correo enviado');
    } catch (e) {
      setError('Error enviando correo');
    }
  };

  const handleSolicitarAnulacion = (item: any) => {
    setAnulacionItem(item);
    setAnulacionMotivo("");
    setAnulacionOpen(true);
  };

  const handleConfirmarAnulacion = async () => {
    if (!anulacionItem || !anulacionMotivo.trim()) return;
    try {
      await facturasService.anular(anulacionItem.id, anulacionMotivo.trim());
      setSuccess('Factura anulada');
      setAnulacionOpen(false);
      setAnulacionItem(null);
      setAnulacionMotivo("");
      load();
    } catch (e) {
      setError('Error anulando factura');
    }
  };

  const exportCSV = () => {
    const headers = ['Número', 'Cliente', 'Proyecto', 'Tipo', 'Subtotal', 'IVA', 'Total', 'Moneda', 'Estado', 'EstadoPago', 'FechaEmision', 'Notas'];
    const rows = filteredItems.map(item => [
      item.numero,
      getClienteNombre(item.cliente_id),
      getProyectoNombre(item.proyecto_id),
      item.tipo,
      item.subtotal,
      item.iva,
      item.total,
      item.moneda,
      item.estado,
      item.estado_pago,
      item.fecha_emision,
      (item.notas || '').replace(/"/g, '""')
    ]);
    const csvContent = [headers, ...rows].map(e => e.map((cell: any) => `"${String(cell || '')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setFilterEstado("all");
    setFilterTipo("all");
    setFilterEstadoPago("all");
    setFilterCliente("");
    setFilterProyecto("");
    setFilterFechaDesde("");
    setFilterFechaHasta("");
  };

  return (
    <Box sx={{ maxWidth: { xs: '100%', md: 1100 }, mx: 'auto', p: { xs: 1, sm: 1.5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Facturación</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <IconButton size="small" onClick={() => openAiRoute('facturacion', 'Facturas', 'Facturación')}>
            <FiCpu size={18} />
          </IconButton>
          <Button variant="contained" color="secondary" startIcon={<FiShoppingCart />} onClick={() => setScannerOpen(true)} size="small">Escanear</Button>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setEditItem(null); setOpen(true); }} size="small">Nueva Factura</Button>
        </Box>
      </Box>

      {/* Resumen Fiscal */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)', md: 'auto' }, gap: 1.5, mb: 2, overflowX: { md: 'auto' } }}>
        {[
          { label: 'Facturas', value: resumen.cantidad },
          { label: 'Total', value: formatCOP(resumen.total) },
          { label: 'Pagado', value: formatCOP(resumen.pagado), color: 'success' as const },
          { label: 'Enviado', value: formatCOP(resumen.enviado), color: 'info' as const },
          { label: 'Pendiente', value: formatCOP(resumen.pendiente), color: 'warning' as const },
          { label: 'Anulado', value: formatCOP(resumen.anulado), color: 'error' as const },
        ].map((item) => (
          <Card key={item.label} variant="outlined" sx={{ minWidth: { md: 110 }, borderColor: item.color ? `${item.color}.main` : 'divider' }}>
            <CardContent sx={{ py: 0.75, px: 1, '&:last-child': { pb: 0.75 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>{item.label}</Typography>
              <Typography variant="subtitle2" sx={{ fontSize: { xs: '1rem', md: '0.85rem' }, fontWeight: 700, color: item.color ? `${item.color}.main` : 'inherit' }}>{item.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filtros avanzados */}
      <Paper sx={{ p: 1, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              placeholder="Buscar factura o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> }}
              fullWidth
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={filterEstado} label="Estado" onChange={(e) => setFilterEstado(String(e.target.value))}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="borrador">Borrador</MenuItem>
                <MenuItem value="enviada">Enviada</MenuItem>
                <MenuItem value="pagada">Pagada</MenuItem>
                <MenuItem value="anulada">Anulada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={filterTipo} label="Tipo" onChange={(e) => setFilterTipo(String(e.target.value))}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="servicio">Servicio</MenuItem>
                <MenuItem value="producto">Producto</MenuItem>
                <MenuItem value="mixto">Mixto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado pago</InputLabel>
              <Select value={filterEstadoPago} label="Estado pago" onChange={(e) => setFilterEstadoPago(String(e.target.value))}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="anticipo">Anticipo</MenuItem>
                <MenuItem value="parcial">Parcial</MenuItem>
                <MenuItem value="pago_final">Pago final</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<FiFilter />} onClick={limpiarFiltros} size="small">Limpiar</Button>
            <Button variant="outlined" startIcon={<FiDownload />} onClick={exportCSV} size="small">Exportar CSV</Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select value={filterCliente} label="Cliente" onChange={(e) => setFilterCliente(String(e.target.value))}>
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.nombre || c.empresa}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Proyecto</InputLabel>
              <Select value={filterProyecto} label="Proyecto" onChange={(e) => setFilterProyecto(String(e.target.value))}>
                <MenuItem value="">Todos</MenuItem>
                {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField size="small" label="Desde" type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField size="small" label="Hasta" type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      {loading ? (
        <RouteSkeleton />
      ) : (
        <Fade in>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.75, fontSize: '0.85rem' } }}>
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
                {filteredItems.map((item) => {
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
                      <TableCell>{item.moneda} {formatCOP(item.total)}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.estado}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            bgcolor: item.estado === 'pagada' ? 'success.main' : item.estado === 'enviada' ? 'info.main' : item.estado === 'anulada' ? 'error.main' : 'warning.main',
                            color: 'common.white',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Tooltip title="Vista previa"><IconButton size="small" onClick={() => handlePreview(item)}><FiEye /></IconButton></Tooltip>
                          <Tooltip title="PDF"><IconButton size="small" onClick={() => handlePDF(item)}><FiFileText /></IconButton></Tooltip>
                          <Tooltip title="WhatsApp"><IconButton size="small" onClick={() => handleWhatsApp(item)} disabled={!telefono || sendingWhatsApp === item.id}><FiMessageSquare /></IconButton></Tooltip>
                          <Tooltip title="Email"><IconButton size="small" onClick={() => handleEmail(item)} disabled={!email}><FiMail /></IconButton></Tooltip>
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditItem(item); setOpen(true); }}><FiEdit /></IconButton></Tooltip>
                          {item.estado !== 'anulada' && (
                            <Tooltip title="Anular"><IconButton size="small" color="error" onClick={() => handleSolicitarAnulacion(item)}><FiX /></IconButton></Tooltip>
                          )}
                          <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(item.id)}><FiTrash2 /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">Sin facturas</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}

      {/* Dialog Factura */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
        <DialogContent>
          <form id="factura-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Número"
                    name="numero"
                    required
                    value={editItem ? editItem.numero || '' : numeroSugerido}
                    onChange={(e) => setNumeroSugerido(e.target.value)}
                    fullWidth
                    helperText={editItem ? '' : 'Consecutivo automático por año'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cliente</InputLabel>
                    <Select name="cliente_id" label="Cliente" defaultValue={editItem?.cliente_id || ''}>
                      <MenuItem value="">Seleccionar...</MenuItem>
                      {clientes.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Proyecto</InputLabel>
                    <Select name="proyecto_id" label="Proyecto" defaultValue={editItem?.proyecto_id || ''}>
                      <MenuItem value="">Seleccionar...</MenuItem>
                      {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'servicio'}>
                      <MenuItem value="servicio">Servicio</MenuItem>
                      <MenuItem value="producto">Producto</MenuItem>
                      <MenuItem value="mixto">Mixto</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Subtotal" name="subtotal" type="number" defaultValue={editItem?.subtotal || ''} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="IVA" name="iva" type="number" defaultValue={editItem?.iva || ''} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Total" name="total" type="number" defaultValue={editItem?.total || ''} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Moneda</InputLabel>
                    <Select name="moneda" label="Moneda" defaultValue={editItem?.moneda || 'COP'}>
                      <MenuItem value="COP">COP</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select name="estado" label="Estado" defaultValue={editItem?.estado || 'borrador'}>
                      <MenuItem value="borrador">Borrador</MenuItem>
                      <MenuItem value="enviada">Enviada</MenuItem>
                      <MenuItem value="pagada">Pagada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado de pago</InputLabel>
                    <Select name="estado_pago" label="Estado de pago" defaultValue={editItem?.estado_pago || 'pendiente'}>
                      <MenuItem value="anticipo">Anticipo</MenuItem>
                      <MenuItem value="parcial">Parcial</MenuItem>
                      <MenuItem value="pago_final">Pago final</MenuItem>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Fecha emisión" name="fecha_emision" type="date" defaultValue={editItem?.fecha_emision || new Date().toISOString().slice(0, 10)} InputLabelProps={{ shrink: true }} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Fecha vencimiento" name="fecha_vencimiento" type="date" defaultValue={editItem?.fecha_vencimiento || ''} InputLabelProps={{ shrink: true }} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Notas" name="notas" multiline rows={2} defaultValue={editItem?.notas || ''} fullWidth />
                </Grid>
              </Grid>
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditItem(null); }}>Cancelar</Button>
          <Button type="submit" form="factura-form" variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Preview PDF */}
      <Dialog open={previewOpen} onClose={() => { setPreviewOpen(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }} maxWidth="md" fullWidth>
        <DialogTitle>Vista previa factura</DialogTitle>
        <DialogContent>
          {previewUrl && <embed src={previewUrl} type="application/pdf" width="100%" height="600px" />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPreviewOpen(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Anulación */}
      <Dialog open={anulacionOpen} onClose={() => { setAnulacionOpen(false); setAnulacionItem(null); setAnulacionMotivo(""); }}>
        <DialogTitle>Anular factura {anulacionItem?.numero}</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 400 }}>
            <TextField
              label="Motivo de anulación"
              multiline
              rows={3}
              fullWidth
              value={anulacionMotivo}
              onChange={(e) => setAnulacionMotivo(e.target.value)}
              placeholder="Indica el motivo de la anulación..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAnulacionOpen(false); setAnulacionItem(null); setAnulacionMotivo(""); }}>Cancelar</Button>
          <Button onClick={handleConfirmarAnulacion} color="error" variant="contained" disabled={!anulacionMotivo.trim()}>Anular</Button>
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
