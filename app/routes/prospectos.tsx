import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Switch, LinearProgress, Avatar, Tooltip,
  Grid, Breadcrumbs, Link, useTheme, useMediaQuery, Stack
} from "@mui/material";
import {
  FiPlus, FiEdit, FiTrash2, FiMail, FiMessageSquare, FiPhone,
  FiFileText, FiUpload, FiSearch, FiX, FiRefresh
} from "react-icons/fi";
import { useNavigate } from "react-router";
import { prospectingService } from "../services/prospectingService";
import { enlacesService } from "../services/enlacesService";
import { csvParserService } from "../services/csvParserService";
import { serviciosService } from "../services/supabase";
import type { Prospecto, EstadoProspecto, ESTADOS_PROGRESS, ESTADO_COLORS } from "../types/crm";

const ESTADOS: EstadoProspecto[] = [
  'Nuevo', 'Pendiente', 'Contactado', 'En Revisión',
  'Propuesta', 'Cotización', 'Contratos', 'Facturación', 'Cliente', 'Perdido'
];

function getProgressColor(estado: EstadoProspecto) {
  const colors: Record<EstadoProspecto, string> = {
    Nuevo: '#4caf50',
    Pendiente: '#2196f3',
    Contactado: '#e91e63',
    'En Revisión': '#ff9800',
    Propuesta: '#9c27b0',
    Cotización: '#ff9800',
    Contratos: '#2196f3',
    Facturación: '#009688',
    Cliente: '#4caf50',
    Perdido: '#f44336',
  };
  return colors[estado] || '#9e9e9e';
}

export function meta() {
  return [
    { title: "Prospectos | CRM Agencia" },
    { name: "description", content: "Gestión de prospectos y pipeline de ventas" },
  ];
}

export default function ProspectosView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoProspecto | "all">("all");

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingProspecto, setEditingProspecto] = useState<Prospecto | null>(null);
  const [editForm, setEditForm] = useState<Partial<Prospecto>>({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: "", severity: "info" });

  const [csvData, setCsvData] = useState<{ headers: string[], rows: any[], funcionales: any[], noFuncionales: any[] } | null>(null);
  const [selectedCsvRows, setSelectedCsvRows] = useState<number[]>([]);
  const [converting, setConverting] = useState(false);
  const [enlaceForm, setEnlaceForm] = useState<any>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pros, servs] = await Promise.all([
        prospectingService.getAll(),
        serviciosService.getAll().catch(() => []),
      ]);
      setProspectos(pros);
      setServicios(servs);
      setError(null);
    } catch (err: any) {
      setError("Error al cargar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddProspecto = () => {
    setEditingProspecto(null);
    setEditForm({ nombre: "", estado: "Nuevo", es_prospecto: true, listo_contactar: false, canal_preferido: "WhatsApp" });
    setOpenEditDialog(true);
  };

  const handleEditProspecto = (p: Prospecto) => {
    setEditingProspecto(p);
    setEditForm({ ...p });
    setOpenEditDialog(true);
  };

  const handleSaveProspecto = async () => {
    if (!editForm.nombre?.trim()) {
      setSnackbar({ open: true, message: "El nombre es obligatorio", severity: "error" });
      return;
    }
    setSaving(true);
    try {
      if (editingProspecto?.id) {
        await prospectingService.update(editingProspecto.id, editForm);
        setSnackbar({ open: true, message: "Prospecto actualizado ✅", severity: "success" });
      } else {
        await prospectingService.create(editForm);
        setSnackbar({ open: true, message: "Prospecto creado ✅", severity: "success" });
      }
      setOpenEditDialog(false);
      await loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error: " + err.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleListo = async (p: Prospecto) => {
    await prospectingService.toggleListoContactar(p.id, !p.listo_contactar);
    await loadData();
  };

  const handleCambiarEstado = async (p: Prospecto, estado: EstadoProspecto) => {
    await prospectingService.updateEstado(p.id, estado);
    await loadData();
    setSnackbar({ open: true, message: `Estado cambiado a "${estado}"`, severity: "info" });
  };

  const handleEliminarProspecto = async (p: Prospecto) => {
    if (!confirm(`¿Eliminar a "${p.nombre}"?`)) return;
    try {
      await prospectingService.delete(p.id);
      await loadData();
      setSnackbar({ open: true, message: "Prospecto eliminado", severity: "warning" });
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error: " + err.message, severity: "error" });
    }
  };

  const handleSendWhatsApp = (p: Prospecto) => {
    const phone = p.telefono?.replace(/[^\d+]/g, '');
    if (!phone) {
      setSnackbar({ open: true, message: "Sin teléfono para WhatsApp", severity: "warning" });
      return;
    }
    const msj = encodeURIComponent(`Hola ${p.nombre}, soy de DESEO DIGITAL. ¿Tienes un minuto?`);
    window.open(`https://wa.me/${phone}?text=${msj}`, '_blank');
  };

  const handleSendEmail = (p: Prospecto) => {
    if (!p.email) {
      setSnackbar({ open: true, message: "Sin email", severity: "warning" });
      return;
    }
    window.open(`mailto:${p.email}?subject=Hola ${p.nombre} - DESEO DIGITAL`);
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = csvParserService.parseCSV(text);
      setCsvData(parsed);
      setSelectedCsvRows([]);
    };
    reader.readAsText(file);
  };

  const handleToggleCsvRow = (idx: number) => {
    setSelectedCsvRows(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleConvertirCSV = async () => {
    if (!csvData || selectedCsvRows.length === 0) {
      setSnackbar({ open: true, message: "Seleccioná al menos un registro funcional", severity: "warning" });
      return;
    }
    setConverting(true);
    try {
      let count = 0;
      for (const idx of selectedCsvRows) {
        const row = csvData.rows[idx];
        const data = csvParserService.rowToProspectoData(row);
        if (data.esFuncional) {
          await prospectingService.create({
            nombre: data.nombre || 'Sin nombre',
            telefono: data.telefono,
            email: data.email,
            direccion: data.direccion,
            ubicacion: data.ubicacion,
            origen: data.origen || 'Presto Map - Google Maps',
            fecha_extraccion: new Date().toISOString().split('T')[0],
            estado: 'Nuevo',
            es_prospecto: true,
            listo_contactar: !!(data.telefono || data.email),
            canal_preferido: data.telefono ? 'WhatsApp' : 'Email',
          });
          count++;
        }
      }
      setSnackbar({ open: true, message: `Convertidos ${count} prospectos ✅`, severity: "success" });
      setCsvData(null);
      setSelectedCsvRows([]);
      await loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error: " + err.message, severity: "error" });
    } finally {
      setConverting(false);
    }
  };

  const getProspectosFiltrados = () => {
    return prospectos.filter(p => {
      const matchesSearch = !searchTerm ||
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefono?.includes(searchTerm);
      const matchesEstado = estadoFilter === "all" || p.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  };

  const totalProspectos = prospectos.length;
  const clientesCount = prospectos.filter(p => p.estado === 'Cliente').length;
  const conversionRate = totalProspectos > 0 ? Math.round((clientesCount / totalProspectos) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, bgcolor: "rgba(0,0,0,0.02)", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Breadcrumbs separator="›" sx={{ mb: 0.5 }}>
            <Link to="/" underline="hover" color="inherit">Inicio</Link>
            <Typography color="inherit" fontWeight={600}>Prospectos</Typography>
          </Breadcrumbs>
          <Typography variant="h5" fontWeight={700} color="primary">📊 Pipeline de Prospectos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestión de leads y seguimiento de ventas
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" startIcon={<FiPlus size={16} />} onClick={handleAddProspecto}>
            + Nuevo Prospecto
          </Button>
          <Button variant="outlined" startIcon={<FiUpload size={16} />} component="label">
            Importar CSV
            <input type="file" accept=".csv" hidden onChange={handleCSVFileChange} />
          </Button>
          <Button variant="outlined" startIcon={<FiRefresh size={16} />} onClick={loadData}>Actualizar</Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(233,30,99,0.04)", borderRadius: 2, border: "1px solid rgba(233,30,99,0.1)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Prospectos</Typography>
                <Typography variant="h4" fontWeight={800} color="primary">{totalProspectos}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: "rgba(233,30,99,0.1)", color: "#e91e63", fontSize: 28 }}>👤</Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(76,175,80,0.04)", borderRadius: 2, border: "1px solid rgba(76,175,80,0.1)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Clientes Confirmados</Typography>
                <Typography variant="h4" fontWeight={800} color="green">{clientesCount}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: "rgba(76,175,80,0.1)", color: "#4caf50", fontSize: 28 }}>✓</Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(33,150,243,0.04)", borderRadius: 2, border: "1px solid rgba(33,150,243,0.1)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Tasa de Conversión</Typography>
                <Typography variant="h4" fontWeight={800} color="info">{conversionRate}%</Typography>
              </Box>
              <Avatar sx={{ bgcolor: "rgba(33,150,243,0.1)", color: "#2196f3", fontSize: 28 }}>📈</Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(255,152,0,0.04)", borderRadius: 2, border: "1px solid rgba(255,152,0,0.1)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Listos para Contactar</Typography>
                <Typography variant="h4" fontWeight={800} color="warning">
                  {prospectos.filter(p => p.listo_contactar).length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: "rgba(255,152,0,0.1)", color: "#ff9800", fontSize: 28 }}>📞</Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "white", borderRadius: 2, border: "1px solid rgba(0,0,0,0.06)" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              placeholder="Buscar prospecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><FiSearch size={18} color="#999" /></InputAdornment>
              }}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as any)}
              label="Estado"
              size="small"
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="all">Todos los estados</option>
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Paper elevation={0} sx={{ bgcolor: "white", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(233,30,99,0.04)" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Prospecto</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Progreso</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Listo</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Canal</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getProspectosFiltrados().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ bgcolor: "rgba(0,0,0,0.04)", color: "#999", fontSize: 40 }}>👤</Avatar>
                      <Typography color="text.secondary">No hay prospectos para mostrar</Typography>
                      <Button variant="contained" size="small" startIcon={<FiPlus size={14} />} onClick={handleAddProspecto}>
                        + Crear primer prospecto
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                getProspectosFiltrados().map((p) => (
                  <TableRow key={p.id} hover sx={{ "&:hover": { bgcolor: "rgba(233,30,99,0.02)" } }}>
                    <TableCell>
                      <Chip
                        label={p.codigo}
                        size="small"
                        sx={{
                          bgcolor: "rgba(233,30,99,0.06)",
                          color: "#e91e63",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: "rgba(233,30,99,0.08)", color: "#e91e63", width: 32, height: 32, fontSize: "0.8rem", fontWeight: 700 }}>
                          {p.nombre?.charAt(0).toUpperCase() || "?"}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize="0.85rem">{p.nombre}</Typography>
                          {p.tipo_negocio && (
                            <Typography fontSize="0.7rem" color="text.secondary">{p.tipo_negocio}</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {p.telefono ? (
                        <Typography fontSize="0.8rem" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <FiPhone size={12} />
                          {p.telefono}
                        </Typography>
                      ) : (
                        <Typography fontSize="0.75rem" color="text.disabled">Sin teléfono</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.email ? (
                        <Typography fontSize="0.8rem" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <FiMail size={12} />
                          {p.email}
                        </Typography>
                      ) : (
                        <Typography fontSize="0.75rem" color="text.disabled">Sin email</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.estado}
                        size="small"
                        sx={{
                          bgcolor: `${getProgressColor(p.estado)}15`,
                          color: getProgressColor(p.estado),
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={ESTADOS_PROGRESS[p.estado as keyof typeof ESTADOS_PROGRESS] || 0}
                          sx={{
                            bgcolor: "rgba(0,0,0,0.06)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: getProgressColor(p.estado),
                              borderRadius: 1,
                            }
                          }}
                        />
                        <Typography fontSize="0.6rem" color="text.secondary" sx={{ mt: 0.25, textAlign: "right" }}>
                          {ESTADOS_PROGRESS[p.estado as keyof typeof ESTADOS_PROGRESS] || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!!p.listo_contactar}
                        onChange={() => handleToggleListo(p)}
                        size="small"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.canal_preferido || "—"}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 22 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                        {p.estado !== "Cliente" && p.estado !== "Perdido" && (
                          <Tooltip title="Enviar propuesta">
                            <IconButton size="small" onClick={() => navigate(`/proyectos?prospecto=${p.id}&action=new`)} sx={{ color: "#9c27b0" }}>
                              <FiFileText size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.estado !== "Cliente" && p.estado !== "Perdido" && (
                          <Tooltip title="Enviar WhatsApp">
                            <IconButton size="small" onClick={() => handleSendWhatsApp(p)} sx={{ color: "#25d366" }}>
                              <FiMessageSquare size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.email && (
                          <Tooltip title="Enviar Email">
                            <IconButton size="small" onClick={() => handleSendEmail(p)} sx={{ color: "#2196f3" }}>
                              <FiMail size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditProspecto(p)} sx={{ color: "#ff9800" }}>
                            <FiEdit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => handleEliminarProspecto(p)} sx={{ color: "#f44336" }}>
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog Editar */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>{editingProspecto?.id ? "Editar Prospecto" : "Nuevo Prospecto"}</Typography>
          <IconButton onClick={() => setOpenEditDialog(false)}><FiX /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre *" value={editForm.nombre || ""} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} fullWidth autoFocus />
            <TextField label="Tipo de Negocio" value={editForm.tipo_negocio || ""} onChange={(e) => setEditForm({ ...editForm, tipo_negocio: e.target.value })} fullWidth placeholder="ej: Restaurante, Arquitecto..." />
            <TextField label="Dirección" value={editForm.direccion || ""} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} fullWidth />
            <TextField label="Ubicación" value={editForm.ubicacion || ""} onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })} placeholder="ej: Villavicencio, Granada" fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" value={editForm.telefono || ""} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><FiPhone size={18} color="#999" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><FiMail size={18} color="#999" /></InputAdornment> }} />
              </Grid>
            </Grid>
            <TextField select label="Canal Preferido" value={editForm.canal_preferido || "WhatsApp"} onChange={(e) => setEditForm({ ...editForm, canal_preferido: e.target.value })} SelectProps={{ native: true }} fullWidth>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Llamada">Llamada</option>
              <option value="Visita">Visita</option>
            </TextField>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" fontWeight={600}>Listo para Contactar</Typography>
              <Switch checked={!!editForm.listo_contactar} onChange={(e) => setEditForm({ ...editForm, listo_contactar: e.target.checked })} color="success" size="small" />
            </Box>
            <TextField label="¿Qué necesita el cliente?" value={editForm.necesidades || ""} onChange={(e) => setEditForm({ ...editForm, necesidades: e.target.value })} multiline rows={2} fullWidth placeholder="Describa qué problema tiene el cliente..." />
            <TextField label="Solución propuesta (valor agregado)" value={editForm.solucion_propuesta || ""} onChange={(e) => setEditForm({ ...editForm, solucion_propuesta: e.target.value })} multiline rows={2} fullWidth placeholder="Describa qué solución le ofrecés al cliente..." />
            <TextField select label="Estado" value={editForm.estado || "Nuevo"} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} SelectProps={{ native: true }} fullWidth>
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenEditDialog(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProspecto} disabled={saving}>
            {saving ? "Guardando..." : editingProspecto?.id ? "Actualizar" : "Crear Prospecto"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog CSV */}
      <Dialog open={!!csvData} onClose={() => { setCsvData(null); setSelectedCsvRows([]) }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography fontWeight={700}>Importar CSV de Maps</Typography>
            <Typography variant="body2" color="text.secondary">
              {csvData?.rows.length || 0} registros encontrados
            </Typography>
          </Box>
          <IconButton onClick={() => setCsvData(null)}><FiX /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {csvData && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>{csvData.funcionales.length}</strong> registros con datos de contacto ✓
                  <br />
                  <strong>{csvData.noFuncionales.length}</strong> registros sin datos de contacto ✗
                </Typography>
              </Alert>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      {csvData.headers.map(h => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                          {h}
                        </TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem" }}>Funcional</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData.rows.map((row, idx) => {
                      const isFuncional = csvData.funcionales.some(r => JSON.stringify(r) === JSON.stringify(row));
                      return (
                        <TableRow key={idx} hover>
                          <TableCell padding="checkbox">
                            <Switch
                              checked={selectedCsvRows.includes(idx)}
                              onChange={() => handleToggleCsvRow(idx)}
                              disabled={!isFuncional}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          {csvData.headers.map(h => (
                            <TableCell key={h} sx={{ fontSize: "0.7rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {String(row[h] || '')}
                            </TableCell>
                          ))}
                          <TableCell>
                            <Chip
                              label={isFuncional ? "✅ Sí" : "❌ No"}
                              size="small"
                              sx={{
                                bgcolor: isFuncional ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)",
                                color: isFuncional ? "#4caf50" : "#f44336",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                height: 20,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCsvData(null)} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConvertirCSV}
            disabled={selectedCsvRows.length === 0 || converting}
          >
            {converting ? "Convirtiendo..." : `Convertir ${selectedCsvRows.length} prospectos`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled" />
      </Snackbar>
    </Box>
  );
}
