import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, CircularProgress, Chip, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiSearch, FiRefreshCw, FiCheckSquare, FiX } from "react-icons/fi";
import { tareasService, clientesService } from "../services/supabase";
import { useNotificationStore } from "../store/useNotificationStore";
import { useCRMStore } from "../store/useCRMStore";
import { format, startOfDay, isBefore } from "date-fns";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";

export function meta() {
  return [{ title: "Tareas | DESEO DIGITAL" }];
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
}

const getPrioridadColor = (p: string) => {
  const map: Record<string, "success" | "warning" | "error"> = { Baja: "success", Media: "warning", Alta: "error" };
  return map[p] || "warning";
};

const getEstadoColor = (e: string) => {
  const map: Record<string, "default" | "primary" | "success"> = { Pendiente: "default", "En progreso": "primary", Completada: "success" };
  return map[e] || "default";
};

export default function Tareas() {
  const tareas = useCRMStore((s) => s.tareas);
  const clientes = useCRMStore((s) => s.clientes);
  const fetchTareas = useCRMStore((s) => s.fetchTareas);
  const fetchClientes = useCRMStore((s) => s.fetchClientes);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("all");
  const [estadoFilter, setEstadoFilter] = useState("all");
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
  });

  const loadTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchTareas(), fetchClientes()]);
    } catch (err: any) {
      setError("Error al cargar tareas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTareas(); }, []);

  const filtered = tareas.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPrioridad = prioridadFilter === "all" || t.prioridad === prioridadFilter;
    const matchEstado = estadoFilter === "all" || t.estado === estadoFilter;
    return matchSearch && matchPrioridad && matchEstado;
  });

  const today = startOfDay(new Date());
  const pendientes = filtered.filter(t => t.estado === "Pendiente").length;
  const enProgreso = filtered.filter(t => t.estado === "En progreso").length;
  const completadas = filtered.filter(t => t.estado === "Completada").length;
  const altaPrioridad = filtered.filter(t => t.prioridad === "Alta").length;
  const vencidas = filtered.filter(t => isBefore(new Date(t.fecha), today) && t.estado !== "Completada").length;

  const formatDate = (d: string) => {
    try { return format(new Date(d), "dd/MM/yyyy"); } catch { return d; }
  };

  const isVencida = (tarea: Tarea) => isBefore(new Date(tarea.fecha), today) && tarea.estado !== "Completada";

  const handleOpenModal = () => {
    setEditingTarea(null);
    setFormData({ titulo: "", descripcion: "", fecha: new Date().toISOString().split("T")[0], prioridad: "Media", estado: "Pendiente", cliente_id: "" });
    setOpenModal(true);
  };

  const handleEdit = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setFormData({ titulo: tarea.titulo, descripcion: tarea.descripcion, fecha: tarea.fecha, prioridad: tarea.prioridad, estado: tarea.estado, cliente_id: tarea.cliente_id || "" });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!formData.titulo) { showNotification("El título es obligatorio", "error"); return; }
    setSaving(true);
    const payload = { ...formData, cliente_id: formData.cliente_id === "" ? null : Number(formData.cliente_id) };
    try {
      if (editingTarea) { await tareasService.update(editingTarea.id, payload as any); showNotification("Tarea actualizada ✓", "success"); }
      else { await tareasService.create(payload as any); showNotification("Tarea creada ✓", "success"); }
      await loadTareas();
      setOpenModal(false);
    } catch (err: any) { showNotification("Error: " + err.message, "error"); }
    finally { setSaving(false); }
  };

  const handleComplete = async (tarea: Tarea) => {
    try { await tareasService.update(tarea.id, { estado: "Completada" }); await loadTareas(); showNotification("¡Tarea completada! ✓", "success"); }
    catch (err: any) { showNotification("Error: " + err.message, "error"); }
  };

  const handleDelete = async (tarea: Tarea) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar "${tarea.titulo}"?`)) return;
    try { await tareasService.delete(tarea.id); await loadTareas(); showNotification("Tarea eliminada", "success"); }
    catch (err: any) { showNotification("Error: " + err.message, "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header compacto mobile */}
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Tareas</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={loadTareas} disabled={loading}>Recargar</Button>
          <Button size="small" variant="contained" startIcon={<FiPlus />} onClick={openCreate}>Nueva</Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Pendientes" value={loading ? "..." : pendientes} subtitle="Pendientes" color="warning" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="En curso" value={loading ? "..." : enProgreso} subtitle="En progreso" color="primary" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Completadas" value={loading ? "..." : completadas} subtitle="Completadas" color="success" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Alta" value={loading ? "..." : altaPrioridad} subtitle="Alta prioridad" color="error" /></Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <TextField fullWidth size="small" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch size={16} /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Prioridad</InputLabel>
          <Select value={prioridadFilter} label="Prioridad" onChange={(e) => setPrioridadFilter(e.target.value)}>
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="Alta">Alta</MenuItem>
            <MenuItem value="Media">Media</MenuItem>
            <MenuItem value="Baja">Baja</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={estadoFilter} label="Estado" onChange={(e) => setEstadoFilter(e.target.value)}>
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="En progreso">En curso</MenuItem>
            <MenuItem value="Completada">Completada</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Paper key={i} sx={{ p: 1.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={18} sx={{ borderRadius: 2, mb: 0.5 }} />
                  <Skeleton width="40%" height={16} sx={{ borderRadius: 2 }} />
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((t) => (
            <Paper key={t.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{t.titulo}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(t.fecha)}</Typography>
              </Box>
              <Chip size="small" label={t.estado} color={getEstadoColor(t.estado)} />
              <Chip size="small" label={t.prioridad} color={getPrioridadColor(t.prioridad)} />
              {isVencida(t) && <Chip size="small" label="Vencida" color="error" />}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => handleComplete(t)}><FiCheck size={16} /></IconButton>
                <IconButton size="small" onClick={() => handleEdit(t)}><FiEdit size={16} /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(t)}><FiTrash2 size={16} /></IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {!loading && filtered.length === 0 && (
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

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingTarea ? "Editar Tarea" : "Nueva Tarea"}
            <IconButton onClick={() => setOpenModal(false)} size="small"><FiX /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField label="Título *" fullWidth value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            <TextField label="Descripción" fullWidth multiline rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Vincular a Cliente</InputLabel>
              <Select value={formData.cliente_id} label="Vincular a Cliente" onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}>
                <MenuItem value="">Ninguno</MenuItem>
                {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Fecha límite" type="date" fullWidth value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select value={formData.prioridad} label="Prioridad" onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}>
                <MenuItem value="Baja">Baja</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={formData.estado} label="Estado" onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="En progreso">En progreso</MenuItem>
                <MenuItem value="Completada">Completada</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : editingTarea ? "Guardar Cambios" : "Crear Tarea"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
