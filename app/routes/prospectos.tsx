// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Switch, LinearProgress, Avatar, Tooltip,
  Grid, Breadcrumbs, Link, useTheme, useMediaQuery, Stack,
  SwipeableDrawer, List, ListItem, ListItemButton, ListItemText, Divider,
  Popover, MenuItem, FormControl, InputLabel, Select, LinearProgress as MuiLinearProgress
} from "@mui/material";
import {
  FiPlus, FiEdit, FiTrash2, FiMail, FiMessageSquare, FiPhone,
  FiFileText, FiUpload, FiSearch, FiX, FiRefreshCw, FiUser
} from "react-icons/fi";
import { useNavigate } from "react-router";
import { prospectingService } from "../services/prospectingService";
import { whatsappService } from "../services/whatsappService";
import { enlacesService } from "../services/enlacesService";
import { parseCSV, rowToProspectoData } from "../services/csvParserService";
import { serviciosService } from "../services/supabase";
import ConfirmDialog from '../components/ConfirmDialog';
import type { Prospecto, EstadoProspecto } from "../types/crm";
import { ESTADOS_PROGRESS, ESTADO_COLORS } from "../types/crm";

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
  const [deleteTarget, setDeleteTarget] = useState<Prospecto | null>(null);
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
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const [editMsgOpen, setEditMsgOpen] = useState(false);
  const [editMsgAnchor, setEditMsgAnchor] = useState<null | HTMLElement>(null);
  const [editMsgProspecto, setEditMsgProspecto] = useState<Prospecto | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "mobile">("table");
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [personaProspecto, setPersonaProspecto] = useState<Prospecto | null>(null);
  const [personaNombre, setPersonaNombre] = useState("");
  const [showListos, setShowListos] = useState(false);
  const [personaAguardando, setPersonaAguardando] = useState<string | null>(null);
  const personInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus persona input cuando abre diálogo
  useEffect(() => {
    if (personaDialogOpen && personInputRef.current) {
      personInputRef.current.focus();
    }
  }, [personaDialogOpen]);

  // Cerrar popover al hacer click fuera
  const handleEditMsgClose = (e: any) => {
    if (editMsgAnchor && editMsgAnchor.contains(e?.currentTarget as HTMLElement)) return;
    setEditMsgOpen(false);
    setEditMsgAnchor(null);
  };

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

  const handleEliminarProspecto = (p: Prospecto) => setDeleteTarget(p);

  const confirmDeleteProspecto = async () => {
    if (!deleteTarget) return;
    try {
      await prospectingService.delete(deleteTarget.id);
      await loadData();
      setSnackbar({ open: true, message: "Prospecto eliminado", severity: "warning" });
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error: " + err.message, severity: "error" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSendEmail = (p: Prospecto) => {
    if (!p.email) {
      setSnackbar({ open: true, message: "Sin email", severity: "warning" });
      return;
    }
    window.open(`mailto:${p.email}?subject=Hola ${p.nombre} - DESEO DIGITAL`);
  };

  const handleSendWhatsApp = async (p: Prospecto, mensaje?: string) => {
    const phone = p.telefono?.replace(/[^\d+]/g, '');
    if (!phone) {
      setSnackbar({ open: true, message: "Sin teléfono para WhatsApp", severity: "warning" });
      return;
    }
    // Guardar último mensaje enviado
    await prospectingService.update(p.id, { ultimo_mensaje: mensaje || '', mensaje_enviado: 'envido' });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje || '')}`, '_blank');
    setSnackbar({ open: true, message: "WhatsApp abierto ✅", severity: "success" });
  };

  const openWhatsappPreview = (p: Prospecto, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const { mensaje } = whatsappService.getTemplate(p);
    setWhatsappMsg(mensaje);
    setEditMsgProspecto(p);
    setEditMsgAnchor(e.currentTarget as HTMLElement);
    setEditMsgOpen(true);
  };

  const confirmarWhatsapp = async () => {
    if (!editMsgProspecto) return;
    await handleSendWhatsApp(editMsgProspecto, whatsappMsg);
    setEditMsgOpen(false);
    setEditMsgAnchor(null);
    setEditMsgProspecto(null);
  };

  const handleMarcarContactado = async (p: Prospecto) => {
    await prospectingService.marcarContactado(p.id);
    setSnackbar({ open: true, message: `${p.nombre} marcado como Contactado ✅`, severity: "success" });
    await loadData();
    // Abrir diálogo de persona automáticamente
    setPersonaProspecto(p);
    setPersonaDialogOpen(true);
    setPersonaAguardando(p.nombre);
  };

  const guardarPersonaContacto = async () => {
    if (!personaProspecto || !personaNombre.trim()) {
      setSnackbar({ open: true, message: "Ingresá el nombre de la persona", severity: "warning" });
      return;
    }
    await prospectingService.updatePersonaContacto(personaProspecto.id, personaNombre.trim());
    await loadData();
    setPersonaDialogOpen(false);
    setPersonaProspecto(null);
    setPersonaNombre("");
    setSnackbar({ open: true, message: `Persona "${personaNombre}" guardada ✅`, severity: "success" });
  };

  const toggleShowListos = async () => {
    setShowListos(!showListos);
    if (!showListos) {
      // Sort for listos view
      const listos = [...prospectos].filter(p => p.listo_contactar).sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
      setProspectos(listos);
    } else {
      await loadData();
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
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
        const data = rowToProspectoData(row);
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
            <Link to="/dashboard" underline="hover" color="inherit">Inicio</Link>
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
          <Button variant="outlined" startIcon={<FiRefreshCw size={16} />} onClick={loadData}>Actualizar</Button>
          {showListos ? (
            <Button variant="outlined" color="warning" startIcon={<FiUser size={16} />} onClick={toggleShowListos}>
              ← Ver todos
            </Button>
          ) : prospectos.some(p => p.listo_contactar) && (
            <Button variant="outlined" color="warning" startIcon={<FiUser size={16} />} onClick={toggleShowListos}>
              Ver listos ({prospectos.filter(p => p.listo_contactar).length})
            </Button>
          )}
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
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid rgba(0,0,0,0.06)" }}>
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
      <Paper elevation={0} sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
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
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>Persona</TableCell>
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
                          bgcolor: `${getProgressColor(p.estado as EstadoProspecto)}15`,
                          color: getProgressColor(p.estado as EstadoProspecto),
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
                              bgcolor: getProgressColor(p.estado as EstadoProspecto),
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
                        {p.estado !== "Cliente" && p.estado !== "Perdido" && p.telefono && (
                          <>
                            <Tooltip title="Editar mensaje WhatsApp">
                              <IconButton size="small" onClick={(e) => openWhatsappPreview(p, e)} sx={{ color: "#25d366" }}>
                                <FiMessageSquare size={16} />
                              </IconButton>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleMarcarContactado(p)} sx={{ color: "#e91e63" }}>
                              <FiUser size={16} />
                            </IconButton>
                          </>
                        )}
                        {p.email && (
                          <Tooltip title="Enviar Email">
                            <IconButton size="small" onClick={() => handleSendEmail(p)} sx={{ color: "#2196f3" }}>
                              <FiMail size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.persona_contacto && (
                          <Tooltip title={p.persona_contacto}>
                            <Chip label={p.persona_contacto.charAt(0).toUpperCase() + p.persona_contacto.slice(1, 8)} size="small" sx={{ bgcolor: "rgba(76,175,80,0.1)", color: "#4caf50", fontSize: "0.65rem", height: 20 }} />
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

      {/* Popover para editar mensaje WhatsApp */}
      <Popover
        open={editMsgOpen}
        anchorEl={editMsgAnchor}
        onClose={handleEditMsgClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { width: 360, p: 2 } }}
      >
        {editMsgProspecto && (
          <>
            <Typography fontWeight={700} gutterBottom>✏️ Editar mensaje para {editMsgProspecto.nombre}</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              size="small"
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
              placeholder="Escribe tu mensaje personalizado..."
              sx={{ mb: 1.5 }}
            />
            <Alert severity="info" sx={{ mb: 1.5, fontSize: "0.8rem" }}>
              WhatsApp automático sin API — el mensaje se abre en tu app. Solo ajusta si querés agregar nombre o dato específico.
            </Alert>
            <DialogActions sx={{ p: 0, gap: 1 }}>
              <Button onClick={handleEditMsgClose} color="inherit" size="small">Cancelar</Button>
              <Button variant="contained" onClick={confirmarWhatsapp} size="small">
                Enviar por WhatsApp
              </Button>
            </DialogActions>
          </>
        )}
      </Popover>

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
            <TextField label="Persona Contacto" value={editForm.persona_contacto || ""} onChange={(e) => setEditForm({ ...editForm, persona_contacto: e.target.value })} fullWidth placeholder="Nombre de la persona que contactaste" />
            <TextField label="Categoría" value={editForm.categoria || ""} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} fullWidth placeholder="ej: hotel, restaurante, comercio..." />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <TextField label="Rating" value={editForm.rating ?? ""} type="number" onChange={(e) => setEditForm({ ...editForm, rating: e.target.value ? Number(e.target.value) : undefined })} fullWidth size="small" />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField label="Opiniones" value={editForm.opiniones ?? ""} type="number" onChange={(e) => setEditForm({ ...editForm, opiniones: e.target.value ? Number(e.target.value) : undefined })} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Canal Preferido" value={editForm.canal_preferido || "WhatsApp"} onChange={(e) => setEditForm({ ...editForm, canal_preferido: e.target.value })} SelectProps={{ native: true }} fullWidth>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Visita">Visita</option>
                </TextField>
              </Grid>
            </Grid>
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

      {/* Diálogo para guardar persona contacto */}
      <Dialog open={personaDialogOpen} onClose={() => setPersonaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>👤 Persona contacto — {personaAguardando}</Typography>
          <IconButton onClick={() => setPersonaDialogOpen(false)}><FiX /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Qué nombre tiene la persona con la que contactaste para{" "}
            <strong>{personaAguardando}</strong>?
          </Typography>
          <TextField
            inputRef={personInputRef}
            label="Nombre de la persona"
            fullWidth
            autoFocus
            value={personaNombre}
            onChange={(e) => setPersonaNombre(e.target.value)}
            placeholder="ej: María Rodríguez"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPersonaDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarPersonaContacto} disabled={!personaNombre.trim()}>
            Guardar persona
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
      <ConfirmDialog
        open={!!deleteTarget}
        mensaje={`¿Eliminar a "${deleteTarget?.nombre || ''}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteProspecto}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
