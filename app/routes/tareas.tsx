import React, { useState, useEffect } from "react";
import { StatCard, ActividadIcon } from "../components/StatCard";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, CircularProgress
} from "@mui/material";
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiSearch, FiCalendar, FiX, FiRefreshCw, FiCheckSquare, FiTarget, FiUser } from "react-icons/fi";
import { tareasService, clientesService } from "../services/database";
import { useNotificationStore } from "../store/useNotificationStore";
import { useCRMStore } from "../store/useCRMStore";
import { format, startOfDay, isBefore } from "date-fns";
import { EmptyState } from "../components/EmptyState";
import { useLocation } from "react-router";

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
  created_at: string; // Corregido: estaba como string en algunos lugares
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

export default function Tareas() {
  const tareas = useCRMStore((s) => s.tareas);
  const clientes = useCRMStore((s) => s.clientes);
  const fetchTareas = useCRMStore((s) => s.fetchTareas);
  const fetchClientes = useCRMStore((s) => s.fetchClientes);
  const [equipo, setEquipo] = useState<any[]>([]);
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
    responsable_id: "" as string | number,
  });

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
      await Promise.all([
        fetchTareas(),
        fetchClientes()
      ]);
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

  const isVencida = (tarea: Tarea) =>
    isBefore(new Date(tarea.fecha), today) && tarea.estado !== "Completada";

  const handleOpenModal = () => {
    setEditingTarea(null);
    setFormData({ 
      titulo: "", 
      descripcion: "", 
      fecha: new Date().toISOString().split("T")[0], 
      prioridad: "Media", 
      estado: "Pendiente",
      cliente_id: "",
      responsable_id: ""
    });
    setOpenModal(true);
  };

  const handleEdit = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setFormData({ 
      titulo: tarea.titulo, 
      descripcion: tarea.descripcion, 
      fecha: tarea.fecha, 
      prioridad: tarea.prioridad, 
      estado: tarea.estado,
      cliente_id: tarea.cliente_id || "",
      responsable_id: (tarea as any).responsable_id || ""
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!formData.titulo) {
      showNotification("El título es obligatorio", "error");
      return;
    }
    setSaving(true);
    
    const payload = {
      ...formData,
      cliente_id: formData.cliente_id === "" ? null : Number(formData.cliente_id),
      responsable_id: formData.responsable_id === "" ? null : Number(formData.responsable_id)
    };

    try {
      if (editingTarea) {
        await tareasService.update(editingTarea.id, payload as any);
        showNotification("Tarea actualizada ✓", "success");
      } else {
        await tareasService.create(payload as any);
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
      await tareasService.update(tarea.id, { estado: "Completada" });
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header compacto */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <FiCheckSquare size={22} color="#9C27B0" />
        <Typography variant="h6" sx={{ color: "#7B1FA2", fontWeight: "bold", flex: 1 }}>Tareas</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={loadTareas} disabled={loading} sx={{ minHeight: 32 }}>{loading ? "..." : "Recargar"}</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={16} />} onClick={handleOpenModal} sx={{ minHeight: 32 }}>Nueva</Button>
      </Box>

      {/* KPIs compactos */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Pendientes" value={loading ? "..." : pendientes} subtitle="Pendientes" color="warning" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="En curso" value={loading ? "..." : enProgreso} subtitle="En progreso" color="primary" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Completadas" value={loading ? "..." : completadas} subtitle="Completadas" color="success" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" } }}><StatCard title="Alta" value={loading ? "..." : altaPrioridad} subtitle="Alta prioridad" color="error" /></Box>
      </Box>

      {/* Filtros compactos */}
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
                <Skeleton variant="circular" width={32} height={32} sx={skeletonAgencyStyle} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" height={18} sx={{ ...skeletonAgencyStyle, mb: 0.5 }} />
                  <Skeleton width="40%" height={16} sx={skeletonAgencyStyle} />
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin tareas" description="Crea tu primera tarea para comenzar a organizar el trabajo." />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((t) => (
            <Paper key={t.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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
              <TableBody>
                {filtered.map((tarea) => (
                  <TableRow key={tarea.id} hover sx={{ backgroundColor: isVencida(tarea) ? "#fff3e0" : "inherit" }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>{tarea.titulo}</Typography>
                      {isVencida(tarea) && <Typography variant="caption" color="error">⚠️ Vencida</Typography>}
                    </TableCell>
                    <TableCell>
                      {tarea.cliente_id ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {clientes.find(c => c.id === tarea.cliente_id)?.nombre || 'Cargando...'}
                          </Typography>
                          {clientes.find(c => c.id === tarea.cliente_id)?.nicho && (
                            <Chip 
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
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                        {tarea.descripcion?.substring(0, 60)}{tarea.descripcion?.length > 60 ? "..." : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <FiCalendar size={14} />
                        <Typography variant="body2">{formatDate(tarea.fecha)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={tarea.prioridad} color={getPrioridadColor(tarea.prioridad)} size="small" /></TableCell>
                    <TableCell><Chip label={tarea.estado} color={getEstadoColor(tarea.estado)} size="small" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        <Button size="small" startIcon={<FiEdit />} onClick={() => handleEdit(tarea)}>Editar</Button>
                        {tarea.estado !== "Completada" && (
                          <Button size="small" color="success" startIcon={<FiCheck />} onClick={() => handleComplete(tarea)}>
                            Completar
                          </Button>
                        )}
                        <Button size="small" color="error" startIcon={<FiTrash2 />} onClick={() => handleDelete(tarea)}>
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingTarea ? "✏️ Editar Tarea" : "➕ Nueva Tarea"}
            <IconButton onClick={() => setOpenModal(false)} size="small"><FiX /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
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
                  <Chip label={clientes.find(c => c.id === formData.cliente_id)?.nicho || 'Sin nicho'} size="small" color="primary" sx={{ mt: 0.5 }} />
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
