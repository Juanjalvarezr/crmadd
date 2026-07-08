import { useState, useEffect } from 'react';
import { RouteSkeleton } from '../components/RouteGuard';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert, Fade, Accordion, AccordionSummary, AccordionDetails, Divider, List, ListItem, ListItemText, Switch, FormControlLabel } from "@mui/material";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiFileText, FiMessageSquare, FiMail, FiFilter, FiShoppingCart, FiShield, FiGitBranch, FiList, FiAlertTriangle, FiCopy } from "react-icons/fi";
import { contratosService, contratoVersionesService, contratoClausulasService } from "../services/facturacion";
import { clientesService } from "../services/database";
import { proyectosService } from "../services/database";
import { facturasService } from "../services/facturacion";
import { generarContratoPDF } from "../services/pdf";
import { uploadPDFToStorage } from "../services/storage";
import ScannerTarjetas from "../components/ScannerTarjetas";
import type { Contrato, ContratoVersion, ContratoClausula } from "../types/crm";

const TIPOS_CONTRATO = [
  { value: "prestacion_servicios", label: "Prestación de servicios" },
  { value: "acuerdo_confidencialidad", label: "Acuerdo de confidencialidad" },
  { value: "propiedad_intelectual", label: "Propiedad intelectual" },
  { value: "otro", label: "Otro" },
];

const ESTADOS_CONTRATO = [
  { value: "borrador", label: "Borrador" },
  { value: "activo", label: "Activo" },
  { value: "firmado", label: "Firmado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function Contratos() {
  const [items, setItems] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Contrato | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");
  const [clausulasDisponibles, setClausulasDisponibles] = useState<ContratoClausula[]>([]);
  const [versionHistory, setVersionHistory] = useState<ContratoVersion[]>([]);
  const [versionesAbierto, setVersionesAbierto] = useState(false);
  const [detallesAbierto, setDetallesAbierto] = useState(false);
  const [itemDetalle, setItemDetalle] = useState<Contrato | null>(null);
  const [firmaAbierto, setFirmaAbierto] = useState(false);
  const [firmaForm, setFirmaForm] = useState({ nombre: "", dni: "", dispositivo: "" });
  const [obligaciones, setObligaciones] = useState<{ descripcion: string; fecha_vencimiento?: string | null; estado: string }[]>([]);
  const [vencimientos, setVencimientos] = useState<{ descripcion: string; fecha: string; recordatorio_dias: number; cumplido: boolean }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [data, clientesData, proyectosData, facturasData, clausulas] = await Promise.all([
        contratosService.getAll(),
        clientesService.getAll(),
        proyectosService.getAll(),
        facturasService.getAll(),
        contratoClausulasService.getAll(),
      ]);
      setItems(data);
      setClientes(clientesData);
      setProyectos(proyectosData);
      setFacturas(facturasData);
      setClausulasDisponibles(clausulas);
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

  const getFacturaNumero = (id: any) => {
    if (!id) return '-';
    const f = facturas.find((x: any) => String(x.id) === String(id));
    return f?.numero || '-';
  };

  const generarNumeroContrato = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `CON-${year}-`;
    const existentes = items.filter((it) => (it.numero || '').startsWith(prefix));
    const maxNum = existentes.reduce((max, it) => {
      const n = parseInt((it.numero || prefix + '0000').replace(prefix, ''), 10);
      return n > max ? n : max;
    }, 0);
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const tipo = String(fd.get('tipo') || 'prestacion_servicios');

    // Agregar cláusulas predefinidas seleccionadas al contenido si es creación
    let contenido = String(fd.get('contenido') || '');
    const clausulasSeleccionadas = Array.from(form.querySelectorAll('input[name="clausulas"]:checked') as NodeListOf<HTMLInputElement>);
    if (clausulasSeleccionadas.length > 0) {
      const seleccionadas = clausulasDisponibles.filter((c) => clausulasSeleccionadas.some((el) => el.value === c.id));
      if (seleccionadas.length) {
        const nuevas = seleccionadas
          .sort((a, b) => a.orden - b.orden)
          .map((c) => `\n\n## ${c.titulo}\n${c.contenido}`)
          .join('\n');
        contenido = `${contenido}${nuevas}`;
      }
    }

    const data: any = {
      tipo,
      titulo: String(fd.get('titulo') || ''),
      contenido,
      numero: String(fd.get('numero') || ''),
      estado: String(fd.get('estado') || 'borrador'),
      valor: Number(fd.get('valor') || 0),
      cliente_id: fd.get('cliente_id') ? Number(fd.get('cliente_id')) : null,
      proyecto_id: fd.get('proyecto_id') ? String(fd.get('proyecto_id')) : null,
      factura_id: fd.get('factura_id') ? String(fd.get('factura_id')) : null,
      fecha_renovacion: fd.get('fecha_renovacion') ? String(fd.get('fecha_renovacion')) : null,
      alerta_renovacion_dias: fd.get('alerta_renovacion_dias') ? Number(fd.get('alerta_renovacion_dias')) : 30,
      obligaciones: obligaciones.length ? obligaciones : (editItem?.obligaciones || []),
      vencimientos: vencimientos.length ? vencimientos : (editItem?.vencimientos || []),
    };

    try {
      let guardado: Contrato;
      if (editItem?.id) {
        // Crear versión previa
        await contratoVersionesService.crear({
          contrato_id: editItem.id,
          version: (editItem.version || 1),
          contenido: editItem.contenido,
          variables: editItem.variables || {},
          cambios: { titulo: data.titulo, tipo: data.tipo },
          usuario: 'Usuario actual',
        });
        data.version = (editItem.version || 1) + 1;
        guardado = await contratosService.update(editItem.id, data);
        setSuccess('Contrato actualizado y versión registrada');
      } else {
        data.version = 1;
        guardado = await contratosService.create(data);
        // Registrar versión inicial
        await contratoVersionesService.crear({
          contrato_id: guardado.id,
          version: 1,
          contenido: guardado.contenido,
          variables: guardado.variables || {},
          cambios: { creado: true },
          usuario: 'Usuario actual',
        });
        // Generar número automático si falta
        if (!data.numero && guardado.id) {
          const num = await generarNumeroContrato();
          await contratosService.update(guardado.id, { numero: num });
        }
        setSuccess('Contrato creado');
      }
      setOpen(false);
      setEditItem(null);
      setObligaciones([]);
      setVencimientos([]);
      setSelectedPlantilla('');
      load();
    } catch (e) {
      setError('Error guardando contrato');
    }
  };

  const handleEdit = async (item: Contrato) => {
    setEditItem(item);
    setSelectedPlantilla('');
    setObligaciones(item.obligaciones || []);
    setVencimientos(item.vencimientos || []);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar contrato?')) return;
    await contratosService.delete(id);
    load();
  };

  const handlePDF = async (row: Contrato) => {
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

  const handleWhatsApp = async (row: Contrato) => {
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

  const handleEmail = async (row: Contrato) => {
    const cliente = clientes.find((c: any) => String(c.id) === String(row.cliente_id));
    const email = cliente?.email || '';
    if (!email) return setError('El cliente no tiene email');

    try {
      const pdfBlob = await generarContratoPDF(row, cliente);
      const path = `contratos/${row.numero || row.id}`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, path);

      const html = `<p>Hola ${cliente?.nombre || ''},</p><p>Adjunto contrato ${row.numero || row.id}: ${row.titulo}.</p><p><a href="${pdfUrl}">Descargar contrato</a></p>`;
      await fetch('/api/email-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: [email], subject: `Contrato ${row.numero || row.id}: ${row.titulo}`, html }) });
      setSuccess('Correo enviado');
    } catch (e) {
      setError('Error enviando correo');
    }
  };

  const handleShowVersiones = async (row: Contrato) => {
    const hist = await contratoVersionesService.getAll(row.id);
    setVersionHistory(hist);
    setVersionesAbierto(true);
    setEditItem(row);
  };

  const handleFirmar = async () => {
    if (!editItem?.id) return;
    if (!firmaForm.nombre) return setError('El nombre es requerido para la firma');
    try {
      await contratosService.firmar(editItem.id, { ...firmaForm, fecha: new Date().toISOString() });
      setSuccess('Contrato firmado digitalmente');
      setFirmaAbierto(false);
      setFirmaForm({ nombre: "", dni: "", dispositivo: "" });
      load();
    } catch (e) {
      setError('Error firmando contrato');
    }
  };

  const handleAgregarObligacion = () => {
    setObligaciones([...obligaciones, { descripcion: "", fecha_vencimiento: null, estado: "pendiente" }]);
  };

  const handleCambiarObligacion = (idx: number, campo: string, valor: any) => {
    setObligaciones(obligaciones.map((o, i) => i === idx ? ({ ...o, [campo]: valor } as any) : o));
  };

  const handleEliminarObligacion = (idx: number) => {
    setObligaciones(obligaciones.filter((_, i) => i !== idx));
  };

  const handleAgregarVencimiento = () => {
    setVencimientos([...vencimientos, { descripcion: "", fecha: "", recordatorio_dias: 30, cumplido: false }]);
  };

  const handleCambiarVencimiento = (idx: number, campo: string, valor: any) => {
    setVencimientos(vencimientos.map((v, i) => i === idx ? ({ ...v, [campo]: valor } as any) : v));
  };

  const handleEliminarVencimiento = (idx: number) => {
    setVencimientos(vencimientos.filter((_, i) => i !== idx));
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = String(item.numero || item.titulo || item.id).toLowerCase().includes(search.toLowerCase()) ||
      getClienteNombre(item.cliente_id).toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filterEstado === 'all' || item.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const renovacionesProximas = filteredItems.filter((it) => {
    if (!it.fecha_renovacion) return false;
    const hoy = new Date();
    const diff = Math.ceil((new Date(it.fecha_renovacion).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= (it.alerta_renovacion_dias || 30);
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 1.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Contratos</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<FiFilter />} onClick={() => setFilterEstado('all')}>Limpiar filtros</Button>
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => { setEditItem(null); setObligaciones([]); setVencimientos([]); setSelectedPlantilla(''); setOpen(true); }}>Nuevo Contrato</Button>
          <Button variant="contained" color="secondary" startIcon={<FiShoppingCart />} onClick={() => setScannerOpen(true)}>Escanear</Button>
        </Box>
      </Box>

      {renovacionesProximas.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.main', bgcolor: 'warning.light' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}>
            <FiAlertTriangle /> Renovaciones próximas ({renovacionesProximas.length})
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.dark' }}>
            {renovacionesProximas.map((r) => `${r.numero || r.id} - ${getClienteNombre(r.cliente_id)} (vence: ${r.fecha_renovacion || 'sin fecha'})`).join(', ')}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <Select size="small" value={filterEstado} onChange={(e) => setFilterEstado(String(e.target.value))} sx={{ minWidth: 160 }}>
            <MenuItem value="all">Todos los estados</MenuItem>
            {ESTADOS_CONTRATO.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </Select>
        </Box>
      </Paper>

      {loading ? (
        <RouteSkeleton />
      ) : (
        <Fade in>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.75, fontSize: '0.85rem' } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>Renovación</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const cliente = clientes.find((c: any) => String(c.id) === String(item.cliente_id));
                  const proyecto = proyectos.find((p: any) => String(p.id) === String(item.proyecto_id));
                  const telefono = cliente?.telefono || cliente?.telefono_whatsapp || '';
                  const email = cliente?.email || '';
                  const bloqueado = !!item.bloqueado_post_firma;
                  const renovacionCercana = item.fecha_renovacion && new Date(item.fecha_renovacion) >= new Date() && new Date(item.fecha_renovacion) <= new Date(Date.now() + (item.alerta_renovacion_dias || 30) * 86400000);
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
                            bgcolor: item.estado === 'firmado' ? 'info.main' : item.estado === 'activo' ? 'success.main' : item.estado === 'cancelado' ? 'error.main' : item.estado === 'finalizado' ? 'grey.main' : 'warning.main',
                            color: 'common.white',
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.version || '-'}</TableCell>
                      <TableCell>{getFacturaNumero(item.factura_id)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          {item.fecha_renovacion && <Typography variant="caption">{item.fecha_renovacion}</Typography>}
                          {renovacionCercana && <Chip size="small" color="warning" label={`En ${Math.ceil((new Date(item.fecha_renovacion!).getTime() - Date.now()) / 86400000)} días`} />}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Tooltip title="Ver"><IconButton size="small" onClick={() => { setItemDetalle(item); setDetallesAbierto(true); }}><FiEye /></IconButton></Tooltip>
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => handleEdit(item)} disabled={bloqueado}><FiEdit /></IconButton></Tooltip>
                          <Tooltip title="Historial"><IconButton size="small" onClick={() => handleShowVersiones(item)}><FiGitBranch /></IconButton></Tooltip>
                          <Tooltip title={bloqueado ? "Bloqueado post-firma" : "Firmar"}><IconButton size="small" disabled={bloqueado || item.estado === 'cancelado'} onClick={() => { setEditItem(item); setFirmaAbierto(true); }}><FiShield /></IconButton></Tooltip>
                          <Tooltip title="WhatsApp"><IconButton size="small" onClick={() => handleWhatsApp(item)} disabled={!telefono || sendingWhatsApp === item.id}><FiMessageSquare /></IconButton></Tooltip>
                          <Tooltip title="Email"><IconButton size="small" onClick={() => handleEmail(item)} disabled={!email}><FiMail /></IconButton></Tooltip>
                          <Tooltip title="PDF"><IconButton size="small" onClick={() => handlePDF(item)}><FiFileText /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(item.id)} disabled={bloqueado}><FiTrash2 /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center">Sin contratos</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}

      <Dialog open={open} onClose={() => { setOpen(false); setEditItem(null); }} maxWidth="md" fullWidth>
        <DialogTitle>{editItem?.id ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
        <DialogContent dividers>
          <form id="contrato-form" onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Plantilla</InputLabel>
                  <Select label="Plantilla" value={selectedPlantilla} onChange={(e) => setSelectedPlantilla(String(e.target.value))}>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {TIPOS_CONTRATO.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedPlantilla && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      const plantilla = clausulasDisponibles.find((c) => c.tipo === selectedPlantilla);
                      if (plantilla) {
                        alert(`Plantilla activa: ${plantilla.titulo}`);
                      }
                    }}
                  >
                    Usar plantilla
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Título" name="titulo" required defaultValue={editItem?.titulo || ''} sx={{ flex: 1 }} />
                <TextField label="Número" name="numero" defaultValue={editItem?.numero || ''} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select name="tipo" label="Tipo" defaultValue={editItem?.tipo || 'prestacion_servicios'}>
                    {TIPOS_CONTRATO.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select name="estado" label="Estado" defaultValue={editItem?.estado || 'borrador'}>
                    {ESTADOS_CONTRATO.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Cliente" name="cliente_id" select defaultValue={editItem?.cliente_id || ''} sx={{ flex: 1 }}>
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {clientes.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </TextField>
                <TextField label="Proyecto" name="proyecto_id" select defaultValue={editItem?.proyecto_id || ''} sx={{ flex: 1 }}>
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {proyectos.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Factura vinculada" name="factura_id" select defaultValue={editItem?.factura_id || ''} sx={{ flex: 1 }}>
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {facturas.map((f: any) => <MenuItem key={f.id} value={f.id}>{f.numero || f.id} - {f.estado}</MenuItem>)}
                </TextField>
                <TextField label="Valor" name="valor" type="number" defaultValue={editItem?.valor || ''} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Fecha de renovación" name="fecha_renovacion" type="date" defaultValue={editItem?.fecha_renovacion || ''} sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                <TextField label="Días alerta renovación" name="alerta_renovacion_dias" type="number" defaultValue={editItem?.alerta_renovacion_dias || 30} sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField label="Fecha inicio" name="fecha_inicio" type="date" defaultValue={editItem?.fecha_inicio || ''} sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                <TextField label="Fecha fin" name="fecha_fin" type="date" defaultValue={editItem?.fecha_fin || ''} sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
              </Box>

              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FiCopy /> Cláusulas predefinidas</Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense>
                  {clausulasDisponibles.filter((c) => c.tipo === (editItem?.tipo || 'prestacion_servicios') || c.tipo === 'otro').map((c) => (
                    <ListItem key={c.id} dense>
                      <ListItemText primary={c.titulo} secondary={c.contenido.slice(0, 120) + (c.contenido.length > 120 ? '...' : '')} />
                      <Button size="small" variant="text" onClick={() => {
                        const textarea = document.getElementById('contenido-textarea') as HTMLTextAreaElement;
                        const actual = textarea?.value || '';
                        const nuevo = `${actual}\n\n## ${c.titulo}\n${c.contenido}`;
                        if (textarea) textarea.value = nuevo;
                      }}>Añadir</Button>
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <TextField label="Contenido" name="contenido" multiline rows={8} defaultValue={editItem?.contenido || ''} inputProps={{ id: 'contenido-textarea' }} />

              <Accordion>
                <AccordionSummary expandIcon={<FiList />}>
                  <Typography variant="subtitle2">Obligaciones y vencimientos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {obligaciones.map((o, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField label="Descripción" value={o.descripcion} onChange={(e) => handleCambiarObligacion(idx, 'descripcion', e.target.value)} sx={{ flex: 2 }} size="small" />
                        <TextField label="Vencimiento" type="date" value={o.fecha_vencimiento || ''} onChange={(e) => handleCambiarObligacion(idx, 'fecha_vencimiento', e.target.value)} sx={{ flex: 1 }} size="small" InputLabelProps={{ shrink: true }} />
                        <Select size="small" value={o.estado} onChange={(e) => handleCambiarObligacion(idx, 'estado', e.target.value)} sx={{ minWidth: 120 }}>
                          <MenuItem value="pendiente">Pendiente</MenuItem>
                          <MenuItem value="cumplida">Cumplida</MenuItem>
                          <MenuItem value="vencida">Vencida</MenuItem>
                        </Select>
                        <IconButton size="small" color="error" onClick={() => handleEliminarObligacion(idx)}><FiTrash2 /></IconButton>
                      </Box>
                    ))}
                    <Button size="small" variant="outlined" startIcon={<FiPlus />} onClick={handleAgregarObligacion}>Agregar obligación</Button>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {vencimientos.map((v, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField label="Descripción" value={v.descripcion} onChange={(e) => handleCambiarVencimiento(idx, 'descripcion', e.target.value)} sx={{ flex: 2 }} size="small" />
                        <TextField label="Fecha" type="date" value={v.fecha} onChange={(e) => handleCambiarVencimiento(idx, 'fecha', e.target.value)} sx={{ flex: 1 }} size="small" InputLabelProps={{ shrink: true }} />
                        <TextField label="Días recordatorio" type="number" value={v.recordatorio_dias} onChange={(e) => handleCambiarVencimiento(idx, 'recordatorio_dias', Number(e.target.value))} sx={{ width: 120 }} size="small" />
                        <FormControlLabel control={<Switch checked={v.cumplido} onChange={(e) => handleCambiarVencimiento(idx, 'cumplido', e.target.checked)} />} label="Cumplido" />
                        <IconButton size="small" color="error" onClick={() => handleEliminarVencimiento(idx)}><FiTrash2 /></IconButton>
                      </Box>
                    ))}
                    <Button size="small" variant="outlined" startIcon={<FiPlus />} onClick={handleAgregarVencimiento}>Agregar vencimiento</Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditItem(null); }}>Cancelar</Button>
          <Button type="submit" form="contrato-form" variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={versionesAbierto} onClose={() => setVersionesAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de versiones</DialogTitle>
        <DialogContent dividers>
          {versionHistory.length === 0 ? (
            <Typography variant="body2">Sin versiones registradas</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {versionHistory.map((v) => (
                <Paper key={v.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">v{v.version}</Typography>
                    <Typography variant="caption">{new Date(v.created_at).toLocaleString()}</Typography>
                  </Box>
                  <Typography variant="caption">Por: {v.usuario || '-'}</Typography>
                  {v.cambios && <Typography variant="body2">Cambios: {JSON.stringify(v.cambios)}</Typography>}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{v.contenido.slice(0, 300)}</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setVersionesAbierto(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={detallesAbierto} onClose={() => setDetallesAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle del contrato</DialogTitle>
        <DialogContent dividers>
          {itemDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">{itemDetalle.titulo}</Typography>
              <Typography variant="body2">Número: {itemDetalle.numero || '-'}</Typography>
              <Typography variant="body2">Cliente: {getClienteNombre(itemDetalle.cliente_id)}</Typography>
              <Typography variant="body2">Proyecto: {getProyectoNombre(itemDetalle.proyecto_id)}</Typography>
              <Typography variant="body2">Factura: {getFacturaNumero(itemDetalle.factura_id)}</Typography>
              <Typography variant="body2">Versión: {itemDetalle.version}</Typography>
              <Typography variant="body2">Fecha renovación: {itemDetalle.fecha_renovacion || '-'}</Typography>
              <Typography variant="body2">Alerta renovación: {itemDetalle.alerta_renovacion_dias} días</Typography>
              {itemDetalle.firma_datos && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FiShield /> Firma digital</Typography>
                  <Typography variant="body2">Nombre: {itemDetalle.firma_datos.nombre}</Typography>
                  {itemDetalle.firma_datos.dni && <Typography variant="body2">DNI: {itemDetalle.firma_datos.dni}</Typography>}
                  <Typography variant="body2">Fecha: {itemDetalle.firma_datos.fecha}</Typography>
                  {itemDetalle.firma_datos.dispositivo && <Typography variant="body2">Dispositivo: {itemDetalle.firma_datos.dispositivo}</Typography>}
                </Paper>
              )}
              {itemDetalle.bloqueado_post_firma && (
                <Chip color="error" label="Bloqueado post-firma" />
              )}
              <Divider />
              <Typography variant="subtitle2">Obligaciones</Typography>
              {(itemDetalle.obligaciones || []).length === 0 && <Typography variant="body2" color="text.secondary">Sin obligaciones registradas</Typography>}
              {(itemDetalle.obligaciones || []).map((o: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{o.descripcion}</Typography>
                  <Chip size="small" label={o.estado} />
                </Box>
              ))}
              <Typography variant="subtitle2">Vencimientos</Typography>
              {(itemDetalle.vencimientos || []).length === 0 && <Typography variant="body2" color="text.secondary">Sin vencimientos registrados</Typography>}
              {(itemDetalle.vencimientos || []).map((v: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{v.descripcion} - {v.fecha}</Typography>
                  <Chip size="small" label={v.cumplido ? 'Cumplido' : 'Pendiente'} />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetallesAbierto(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={firmaAbierto} onClose={() => setFirmaAbierto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Firma digital simulada</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">Al firmar, el contrato quedará bloqueado para edición.</Typography>
            <TextField label="Nombre completo" value={firmaForm.nombre} onChange={(e) => setFirmaForm({ ...firmaForm, nombre: e.target.value })} required />
            <TextField label="DNI / Identificación" value={firmaForm.dni} onChange={(e) => setFirmaForm({ ...firmaForm, dni: e.target.value })} />
            <TextField label="Dispositivo (ej: Móvil, PC)" value={firmaForm.dispositivo} onChange={(e) => setFirmaForm({ ...firmaForm, dispositivo: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFirmaAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleFirmar}>Firmar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>

      <ScannerTarjetas open={scannerOpen} onClose={() => setScannerOpen(false)} onSave={() => setScannerOpen(false)} />
    </Box>
  );
}
