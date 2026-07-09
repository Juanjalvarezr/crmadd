import React, { useState, useEffect } from "react";
import { StatCard, ActividadIcon } from "../components/StatCard";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, CircularProgress,
  Checkbox, FormControlLabel, Collapse, List, ListItem, ListItemText, ListItemIcon, Tooltip, Tabs, Tab, Divider, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiSearch, FiCalendar, FiX, FiRefreshCw, FiCheckSquare, FiTarget, FiUser, FiPlay, FiPause, FiFlag, FiPaperclip, FiMessageSquare, FiBell, FiClock, FiCpu } from "react-icons/fi";
import { tareasService, clientesService, equipoService, emailService } from "../services/database";
import { useNotificationStore } from "../store/useNotificationStore";
import { format, startOfDay, isBefore } from "date-fns";
import { EmptyState } from "../components/EmptyState";
import { useLocation } from "react-router";
import SafeChip from "../components/SafeChip";

export function meta() {
  return [
    { title: "Tareas | DESEO DIGITAL" },
    { name: "description", content: "Gestión de tareas y actividades" },
  ];
}

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: "Baja" | "Media" | "Alta";
  estado: "Pendiente" | "En progreso" | "Completada";
  cliente_id?: number;
  created_at: string;
  tipo?: "Tarea" | "Cita" | "Llamada" | "Seguimiento";
  link_reunion?: string;
  proyecto_id?: string;
  oportunidad_id?: number;
  responsable_id?: number;
  dependencias?: number[];
  subtareas?: any[];
  adjuntos?: any[];
  comentarios?: any[];
  recordatorios?: any[];
  tiempo_inicio?: string;
  tiempo_pausa?: string;
  tiempo_fin?: string;
  tiempo_total?: number;
  timer_activo?: boolean;
}

const getPrioridadColor = (p: string): "success" | "warning" | "error" => {
  const map: Record<string, "success" | "warning" | "error"> = { Baja: "success", Media: "warning", Alta: "error" };
  return map[p] || "warning";
};

const getEstadoColor = (e: string): "default" | "primary" | "success" => {
  const map: Record<string, "default" | "primary" | "success"> = {
    "Pendiente": "default", "En progreso": "primary", "Completada": "success"
  };
  return map[e] || "default";
};

const formatSegundos = (s?: number) => {
  if (!s) return '0h 0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [responsableFilter, setResponsableFilter] = useState("all");
  const [clienteFilter, setClienteFilter] = useState("all");
  const [soloVencidas, setSoloVencidas] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotificationStore();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    prioridad: "Media" as "Baja" | "Media" | "Alta",
    estado: "Pendiente" as "Pendiente" | "En progreso" | "Completada",
    cliente_id: "" as string | number,
    responsable_id: "" as string | number,
    dependencias: [] as number[],
  });

  const [modalTab, setModalTab] = useState<"detalle" | "subtareas" | "adjuntos" | "comentarios" | "recordatorios" | "timer">("detalle");
  const [newSubtarea, setNewSubtarea] = useState("");
  const [newComentario, setNewComentario] = useState("");
  const [newRecordatorio, setNewRecordatorio] = useState({ tipo: "email" as "email" | "whatsapp", fecha: new Date().toISOString().slice(0, 16) });
  const [newAdjunto, setNewAdjunto] = useState<File | null>(null);
  const [adjuntosUrl, setAdjuntosUrl] = useState<string[]>([]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleOpenModal();
    }
  }, [location]);

  const loadTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, cliData, eqData] = await Promise.all([
        tareasService.getAll(),
        clientesService.getAll(),
        equipoService.getAll()
      ]);
      setTareas(data as Tarea[]);
      setClientes(cliData);
      setEquipo(eqData);
    } catch (err: any) {
      setError("Error al cargar tareas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTareas(); }, []);

  const filtered = tareas.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPrioridad = prioridadFilter === "all" || t.prioridad === prioridadFilter;
    const matchEstado = estadoFilter === "all" || t.estado === estadoFilter;
    const matchResponsable = responsableFilter === "all" || t.responsable_id === Number(responsableFilter);
    const matchCliente = clienteFilter === "all" || t.cliente_id === Number(clienteFilter);
    const matchVencida = !soloVencidas || isBefore(new Date(t.fecha), today);
    return matchSearch && matchPrioridad && matchEstado && matchResponsable && matchCliente && matchVencida;
  });

  const today = startOfDay(new Date());
  const pendientes = filtered.filter(t => t.estado === "Pendiente").length;
  const enProgreso = filtered.filter(t => t.estado === "En progreso").length;
  const completadas = filtered.filter(t => t.estado === "Completada").length;
  const altaPrioridad = filtered.filter(t => t.prioridad === "Alta").length;
  const vencidas = filtered.filter(t => isBefore(new Date(t.fecha), today) && t.estado !== "Completada").length;

  const isVencida = (tarea: Tarea) =>
    isBefore(new Date(tarea.fecha), today) && tarea.estado !== "Completada";

  const handleOpenModal = (tarea?: Tarea) => {
    if (tarea) {
      setEditingTarea(tarea);
      setFormData({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || "",
        fecha: tarea.fecha,
        prioridad: tarea.prioridad,
        estado: tarea.estado,
        cliente_id: tarea.cliente_id || "",
        responsable_id: tarea.responsable_id || "",
        dependencias: tarea.dependencias || [],
      });
    } else {
      setEditingTarea(null);
      setFormData({
        titulo: "",
        descripcion: "",
        fecha: new Date().toISOString().split("T")[0],
        prioridad: "Media",
        estado: "Pendiente",
        cliente_id: "",
        responsable_id: "",
        dependencias: [],
      });
    }
    setModalTab("detalle");
    setNewSubtarea("");
    setNewComentario("");
    setNewRecordatorio({ tipo: "email", fecha: new Date().toISOString().slice(0, 16) });
    setNewAdjunto(null);
    setAdjuntosUrl([]);
    setOpenModal(true);
  };

  const handleEdit = (tarea: Tarea) => {
    handleOpenModal(tarea);
  };

  const handleSave = async () => {
    if (!formData.titulo) {
      showNotification("El título es obligatorio", "error");
      return;
    }
    setSaving(true);

    let finalResponsableId = formData.responsable_id === "" ? null : Number(formData.responsable_id);
    if (!finalResponsableId && !editingTarea) {
      const eq = [...equipo].sort((a, b) => {
        const ac = tareas.filter(t => t.responsable_id === a.id && t.estado !== "Completada").length;
        const bc = tareas.filter(t => t.responsable_id === b.id && t.estado !== "Completada").length;
        return ac - bc;
      });
      if (eq.length > 0) finalResponsableId = eq[0].id;
    }

    const payload: any = {
      ...formData,
      cliente_id: formData.cliente_id === "" ? null : Number(formData.cliente_id),
      responsable_id: finalResponsableId,
      dependencias: formData.dependencias,
      subtareas: editingTarea?.subtareas || [],
      adjuntos: editingTarea?.adjuntos || [],
      comentarios: editingTarea?.comentarios || [],
      recordatorios: editingTarea?.recordatorios || [],
      tiempo_total: editingTarea?.tiempo_total || 0,
      timer_activo: editingTarea?.timer_activo || false,
    };

    try {
      if (editingTarea) {
        await tareasService.update(editingTarea.id, payload);
        showNotification("Tarea actualizada ✓", "success");
      } else {
        await tareasService.create(payload);
        showNotification("Tarea creada ✓", "success");
      }
      await loadTareas();
      setOpenModal(false);
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (tarea: Tarea) => {
    try {
      await tareasService.update(tarea.id, { estado: "Completada", tiempo_fin: new Date().toISOString(), timer_activo: false });
      await loadTareas();
      showNotification("¡Tarea completada! ✓", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleDelete = async (tarea: Tarea) => {
    if (!confirm(`¿Eliminar "${tarea.titulo}"?`)) return;
    try {
      await tareasService.delete(tarea.id);
      await loadTareas();
      showNotification("Tarea eliminada", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleStartTimer = async (tarea: Tarea) => {
    try {
      await tareasService.startTimer(tarea.id);
      await loadTareas();
      showNotification("Timer iniciado", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handlePauseTimer = async (tarea: Tarea) => {
    try {
      await tareasService.pauseTimer(tarea.id);
      await loadTareas();
      showNotification("Timer pausado", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleFinishTimer = async (tarea: Tarea) => {
    try {
      await tareasService.finishTimer(tarea.id);
      await loadTareas();
      showNotification("Tarea finalizada por timer", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleToggleSubtarea = async (tarea: Tarea, subtareaId: string) => {
    try {
      await tareasService.toggleSubtarea(tarea.id, subtareaId);
      await loadTareas();
    } catch (err: any) {
      showNotification("Error subtarea: " + err.message, "error");
    }
  };

  const handleAddSubtarea = async () => {
    if (!newSubtarea.trim() || !editingTarea) return;
    try {
      await tareasService.addSubtarea(editingTarea.id, newSubtarea.trim());
      setNewSubtarea("");
      await loadTareas();
      showNotification("Subtarea añadida", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleAddAdjunto = async () => {
    if (!newAdjunto || !editingTarea) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const adjunto = { id: Date.now().toString(), nombre: newAdjunto.name, url: reader.result as string, fecha: new Date().toISOString() };
        const current = editingTarea.adjuntos || [];
        await tareasService.setAdjuntos(editingTarea.id, [...current, adjunto]);
        setNewAdjunto(null);
        await loadTareas();
        showNotification("Adjunto añadido", "success");
      };
      reader.readAsDataURL(newAdjunto);
    } catch (err: any) {
      showNotification("Error adjunto: " + err.message, "error");
    }
  };

  const handleAddComentario = async () => {
    if (!newComentario.trim() || !editingTarea) return;
    try {
      const currentUser = "Usuario actual"; // En producción from auth
      const mencionados = newComentario.match(/@\w+/g) || [];
      const comentario = {
        id: Date.now().toString(),
        texto: newComentario.trim(),
        usuario: currentUser,
        created_at: new Date().toISOString(),
        menciones: mencionados,
      };
      await tareasService.addComentario(editingTarea.id, comentario);
      setNewComentario("");
      await loadTareas();
      showNotification("Comentario añadido", "success");
    } catch (err: any) {
      showNotification("Error comentario: " + err.message, "error");
    }
  };

  const handleAddRecordatorio = async () => {
    if (!editingTarea) return;
    try {
      const recordatorio = {
        id: Date.now().toString(),
        tipo: newRecordatorio.tipo,
        fecha_envio: newRecordatorio.fecha,
        enviado: false,
      };
      await tareasService.addRecordatorio(editingTarea.id, recordatorio);
      setNewRecordatorio({ tipo: "email", fecha: new Date().toISOString().slice(0, 16) });
      await loadTareas();
      showNotification("Recordatorio programado", "success");
    } catch (err: any) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleSendRecordatorio = async (tarea: Tarea, tipo: string) => {
    try {
      const cliente = clientes.find(c => c.id === tarea.cliente_id);
      const responsable = equipo.find(e => e.id === tarea.responsable_id);
      const destino = tipo === 'whatsapp' ? cliente?.telefono || responsable?.email : cliente?.email || responsable?.email;
      if (!destino) {
        showNotification("Sin destino para " + tipo, "error");
        return;
      }
      const html = `<h3>Recordatorio: ${tarea.titulo}</h3><p>${tarea.descripcion}</p><p>Fecha límite: ${tarea.fecha}</p>`;
      await emailService.sendRealEmail([destino], `Recordatorio: ${tarea.titulo}`, html);
      showNotification(`Recordatorio ${tipo} enviado`, "success");
    } catch (err: any) {
      showNotification("Error envío: " + err.message, "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, background: "linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)", borderLeft: "4px solid #9C27B0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
          <FiCheckSquare size={22} color="#9C27B0" />
          <Typography variant="h6" sx={{ color: "#7B1FA2", flex: 1, letterSpacing: '-0.01em' }}>Tareas y Actividades</Typography>
          <IconButton size="small" onClick={() => openAiRoute('tareas', 'Actividades', 'Tareas')}>
            <FiCpu size={16} />
          </IconButton>
          <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={loadTareas} disabled={loading}>
            {loading ? "..." : "Recargar"}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Organiza y prioriza tus actividades diarias. Nunca pierdas un seguimiento importante.
        </Typography>
      </Paper>

      {/* KPIs */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        {[
          { title: "Pendientes", value: loading ? "..." : pendientes, color: "warning" },
          { title: "En Progreso", value: loading ? "..." : enProgreso, color: "primary" },
          { title: "Completadas", value: loading ? "..." : completadas, color: "success" },
          { title: "Alta Prioridad", value: loading ? "..." : altaPrioridad, color: "error" },
          { title: "Vencidas", value: loading ? "..." : vencidas, color: "error" },
          { title: "En Timer", value: loading ? "..." : filtered.filter(t => t.timer_activo).length, color: "info" },
        ].map((kpi) => (
          <Box key={kpi.title} sx={{ flex: { xs: "100%", sm: "48%", md: "16%" } }}>
            <StatCard title={kpi.title} value={kpi.value} subtitle="" icon={<ActividadIcon />} color={kpi.color as any} />
          </Box>
        ))}
      </Box>

      {/* Tabla */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Lista de Tareas ({filtered.length})</Typography>
          <Button variant="contained" size="small" startIcon={<FiPlus />} onClick={handleOpenModal}>Nueva Tarea</Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexDirection: { xs: "column", md: "row" } }}>
          <TextField
            fullWidth placeholder="Buscar tareas..."
            value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Prioridad</InputLabel>
            <Select value={prioridadFilter} label="Prioridad" onChange={(e: any) => setPrioridadFilter(e.target.value)}>
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="Alta">Alta</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
              <MenuItem value="Baja">Baja</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={estadoFilter} label="Estado" onChange={(e: any) => setEstadoFilter(e.target.value)}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="Pendiente">Pendiente</MenuItem>
              <MenuItem value="En progreso">En progreso</MenuItem>
              <MenuItem value="Completada">Completada</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 170 }}>
            <InputLabel>Responsable</InputLabel>
            <Select value={responsableFilter} label="Responsable" onChange={(e: any) => setResponsableFilter(e.target.value)}>
              <MenuItem value="all">Todos</MenuItem>
              {equipo.map(m => (
                <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 170 }}>
            <InputLabel>Cliente</InputLabel>
            <Select value={clienteFilter} label="Cliente" onChange={(e: any) => setClienteFilter(e.target.value)}>
              <MenuItem value="all">Todos</MenuItem>
              {clientes.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }} displayFlex alignItems="center">
            <FormControlLabel
              control={<Checkbox checked={soloVencidas} onChange={(e: any) => setSoloVencidas(e.target.checked)} />}
              label="Solo vencidas"
            />
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress color="primary" /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f3e5f5' }}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1 }}>Título</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1, display: { xs: 'none', sm: 'table-cell' } }}>Cliente / Nicho</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1 }}>Prioridad / Estado</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1, display: { xs: 'none', md: 'table-cell' } }}>Fecha</TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1 }}>Timer</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' }, fontWeight: "bold", py: 1 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((tarea) => {
                  const subtareasCompletadas = (tarea.subtareas || []).filter((s: any) => s.completada).length;
                  const subtareasTotal = (tarea.subtareas || []).length;
                  return (
                  <TableRow key={tarea.id} hover sx={{ backgroundColor: isVencida(tarea) ? (theme => theme.palette.mode === 'dark' ? 'rgba(255,87,34,0.15)' : "#fff3e0") : "inherit", '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: { xs: 1, sm: 1.5 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {tarea.titulo && (
                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{tarea.titulo}</Typography>
                        )}
                        {isVencida(tarea) && <SafeChip label="⚠️ Vencida" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      </Box>
                      {subtareasTotal > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Subtareas: {subtareasCompletadas}/{subtareasTotal}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {tarea.cliente_id ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {clientes.find(c => c.id === tarea.cliente_id)?.nombre || 'Cargando...'}
                          </Typography>
                          {clientes.find(c => c.id === tarea.cliente_id)?.nicho && (
                            <SafeChip
                              label={clientes.find(c => c.id === tarea.cliente_id)?.nicho}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">Interno</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <SafeChip label={tarea.prioridad} color={getPrioridadColor(tarea.prioridad)} size="small" />
                        <SafeChip label={tarea.estado} color={getEstadoColor(tarea.estado)} size="small" variant="outlined" />
                        {tarea.dependencias && tarea.dependencias.length > 0 && (
                          <Typography variant="caption" color="text.secondary">Depende de {tarea.dependencias.length}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <FiCalendar size={14} />
                        <Typography variant="body2">{format(new Date(tarea.fecha), "dd/MM/yyyy")}</Typography>
                      </Box>
                      {tarea.recordatorios && tarea.recordatorios.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                          {(tarea.recordatorios as any[]).map((r: any) => (
                            <SafeChip key={r.id} icon={r.tipo === 'whatsapp' ? <FiMessageSquare size={12} /> : <FiBell size={12} />} label={r.tipo} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {tarea.timer_activo ? (
                        <Button size="small" color="error" startIcon={<FiPause />} onClick={() => handlePauseTimer(tarea)}>Pausar</Button>
                      ) : tarea.estado !== "Completada" ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {tarea.tiempo_total ? (
                            <Typography variant="caption" color="text.secondary">{formatSegundos(tarea.tiempo_total)}</Typography>
                          ) : (
                            <Button size="small" color="primary" variant="outlined" startIcon={<FiPlay />} onClick={() => handleStartTimer(tarea)}>Iniciar</Button>
                          )}
                          {tarea.tiempo_total && (
                            <Button size="small" color="success" variant="contained" startIcon={<FiCheck />} onClick={() => handleFinishTimer(tarea)}>Fin</Button>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption">{formatSegundos(tarea.tiempo_total)}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        <IconButton size="small" onClick={() => handleOpenModal(tarea)} title="Editar / Detalles">
                          <FiEdit />
                        </IconButton>
                        {tarea.estado !== "Completada" && (
                          <IconButton size="small" color="success" onClick={() => handleComplete(tarea)} title="Completar">
                            <FiCheck />
                          </IconButton>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDelete(tarea)} title="Eliminar">
                          <FiTrash2 />
                        </IconButton>
                        <IconButton size="small" onClick={() => {
                          handleOpenModal(tarea);
                          setModalTab("subtareas");
                        }} title="Subtareas">
                          <FiTarget />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <EmptyState
              title="No hay tareas pendientes"
              description={searchTerm ? `No hay resultados para "${searchTerm}".` : "Tu lista de tareas está limpia. ¡Buen trabajo! O crea una nueva tarea para hoy."}
              icon={<FiCheckSquare size={40} />}
              actionLabel="Nueva Tarea"
              onAction={handleOpenModal}
              color="#9C27B0"
            />
          </Box>
        )}
      </Paper>

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingTarea ? "✏️ Editar Tarea" : "➕ Nueva Tarea"}
            <IconButton onClick={() => setOpenModal(false)} size="small"><FiX /></IconButton>
          </Box>
          <Tabs value={modalTab} onChange={(_, v) => setModalTab(v as any)} variant="scrollable" scrollButtons="auto" sx={{ mt: 1 }}>
            <Tab label="Detalle" value="detalle" />
            <Tab label="Subtareas" value="subtareas" />
            <Tab label="Adjuntos" value="adjuntos" />
            <Tab label="Comentarios" value="comentarios" />
            <Tab label="Recordatorios" value="recordatorios" />
            <Tab label="Timer" value="timer" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {modalTab === "detalle" && (
              <>
                <TextField label="Título *" fullWidth value={formData.titulo}
                  onChange={(e: any) => setFormData({ ...formData, titulo: e.target.value })} />
                <TextField label="Descripción" fullWidth multiline rows={3} value={formData.descripcion}
                  onChange={(e: any) => setFormData({ ...formData, descripcion: e.target.value })} />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <FormControl fullWidth>
                    <InputLabel>Vincular a Cliente</InputLabel>
                    <Select
                      value={formData.cliente_id}
                      label="Vincular a Cliente"
                      onChange={(e: any) => setFormData({ ...formData, cliente_id: e.target.value })}
                    >
                      <MenuItem value=""><em>Ninguno (Tarea Interna)</em></MenuItem>
                      {clientes.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {formData.cliente_id && (
                    <Paper variant="outlined" sx={{ p: 1, minWidth: 120, bgcolor: '#f0f7ff', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">Nicho Heredado</Typography>
                      <SafeChip label={clientes.find(c => c.id === formData.cliente_id)?.nicho || 'Sin nicho'} size="small" color="primary" sx={{ mt: 0.5 }} />
                    </Paper>
                  )}
                </Box>

                <TextField label="Fecha límite" type="date" fullWidth value={formData.fecha}
                  onChange={(e: any) => setFormData({ ...formData, fecha: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select value={formData.prioridad} label="Prioridad"
                    onChange={(e: any) => setFormData({ ...formData, prioridad: e.target.value as typeof formData.prioridad })}>
                    <MenuItem value="Baja">🟢 Baja</MenuItem>
                    <MenuItem value="Media">🟡 Media</MenuItem>
                    <MenuItem value="Alta">🔴 Alta</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select value={formData.estado} label="Estado"
                    onChange={(e: any) => setFormData({ ...formData, estado: e.target.value as typeof formData.estado })}>
                    <MenuItem value="Pendiente">⏳ Pendiente</MenuItem>
                    <MenuItem value="En progreso">🔄 En progreso</MenuItem>
                    <MenuItem value="Completada">✅ Completada</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Asignar a Responsable</InputLabel>
                  <Select
                    value={formData.responsable_id}
                    label="Asignar a Responsable"
                    onChange={(e: any) => setFormData({ ...formData, responsable_id: e.target.value })}
                  >
                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                    {equipo.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.nombre} ({m.rol})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Dependencias de otras tareas</InputLabel>
                  <Select multiple value={formData.dependencias} label="Dependencias de otras tareas"
                    onChange={(e: any) => setFormData({ ...formData, dependencias: e.target.value as number[] })}>
                    {tareas.filter(t => !editingTarea || t.id !== editingTarea.id).map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.titulo || t.id}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            {modalTab === "subtareas" && editingTarea && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Subtareas</Typography>
                {(editingTarea.subtareas || []).map((s: any) => (
                  <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox checked={!!s.completada} onChange={() => handleToggleSubtarea(editingTarea, s.id)} />
                    <ListItemText primary={s.titulo} sx={{ textDecoration: s.completada ? 'line-through' : 'none' }} />
                  </Box>
                ))}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField size="small" fullWidth value={newSubtarea} onChange={(e: any) => setNewSubtarea(e.target.value)} label="Nueva subtarea" />
                  <Button variant="contained" onClick={handleAddSubtarea}>Añadir</Button>
                </Box>
              </Box>
            )}
            {modalTab === "adjuntos" && editingTarea && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Adjuntos</Typography>
                {(editingTarea.adjuntos || []).map((a: any) => (
                  <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                    <FiPaperclip />
                    <Typography variant="body2">{a.nombre}</Typography>
                    <Button size="small" component="a" href={a.url} target="_blank" rel="noreferrer">Ver</Button>
                  </Box>
                ))}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField size="small" type="file" onChange={(e: any) => setNewAdjunto(e.target.files?.[0] || null)} />
                  <Button variant="contained" onClick={handleAddAdjunto} disabled={!newAdjunto}>Subir</Button>
                </Box>
              </Box>
            )}
            {modalTab === "comentarios" && editingTarea && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Comentarios y menciones (@usuario)</Typography>
                {(editingTarea.comentarios || []).map((c: any) => (
                  <Box key={c.id} sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">{c.usuario} • {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</Typography>
                    <Typography variant="body2">{c.texto}</Typography>
                    {c.menciones && c.menciones.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {c.menciones.map((m: string) => (
                          <SafeChip key={m} label={m} size="small" />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField size="small" fullWidth value={newComentario} onChange={(e: any) => setNewComentario(e.target.value)} label="Comentario (usa @ para mencionar)" />
                  <Button variant="contained" onClick={handleAddComentario} disabled={!newComentario.trim()}>Enviar</Button>
                </Box>
              </Box>
            )}
            {modalTab === "recordatorios" && editingTarea && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Recordatorios programados</Typography>
                {(editingTarea.recordatorios || []).map((r: any) => (
                  <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SafeChip label={r.tipo} size="small" />
                    <Typography variant="body2">{format(new Date(r.fecha_envio), 'dd/MM/yyyy HH:mm')}</Typography>
                    <Button size="small" onClick={() => handleSendRecordatorio(editingTarea, r.tipo)}>Enviar ahora</Button>
                  </Box>
                ))}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Select
                    size="small"
                    value={newRecordatorio.tipo}
                    onChange={(e: any) => setNewRecordatorio({ ...newRecordatorio, tipo: e.target.value })}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  </Select>
                  <TextField size="small" type="datetime-local" value={newRecordatorio.fecha} onChange={(e: any) => setNewRecordatorio({ ...newRecordatorio, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
                  <Button variant="contained" onClick={handleAddRecordatorio}>Programar</Button>
                </Box>
              </Box>
            )}
            {modalTab === "timer" && editingTarea && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Control de tiempo</Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Typography>Tiempo total: {formatSegundos(editingTarea.tiempo_total)}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {editingTarea.estado === "Completada" ? (
                    <Typography variant="caption" color="text.secondary">Tarea finalizada</Typography>
                  ) : (
                    <>
                      {!editingTarea.timer_activo ? (
                        <Button variant="outlined" startIcon={<FiPlay />} onClick={() => handleStartTimer(editingTarea)}>Iniciar</Button>
                      ) : (
                        <Button variant="outlined" color="error" startIcon={<FiPause />} onClick={() => handlePauseTimer(editingTarea)}>Pausar</Button>
                      )}
                      <Button variant="contained" color="success" startIcon={<FiFlag />} onClick={() => handleFinishTimer(editingTarea)} disabled={!editingTarea.tiempo_inicio}>Finalizar</Button>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FiPlus />}>
            {saving ? "Guardando..." : (editingTarea ? "Guardar Cambios" : "Crear Tarea")}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
