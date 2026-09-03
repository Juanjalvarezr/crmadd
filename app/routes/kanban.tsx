import { useState, useEffect, useMemo } from "react";
import { useCRMStore } from "../store/useCRMStore";
import { crmEventsService } from "../services/supabase";
import {
  Box, Typography, Paper, Chip, IconButton, Tooltip, Alert, Snackbar,
  Select, MenuItem
} from "@mui/material";
import { FiRefreshCw, FiClock, FiUser, FiFolder } from "react-icons/fi";

type Estado = "Pendiente" | "En progreso" | "Completada" | "En revisión";
type Prioridad = "Baja" | "Media" | "Alta";

interface TareaKanban {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: Estado;
  prioridad?: Prioridad;
  fecha?: string;
  cliente_id?: number | null;
  proyecto_id?: string | null;
  cliente_nombre?: string | null;
  proyecto_nombre?: string | null;
}

const COLUMNAS: { key: Estado; label: string; color: string }[] = [
  { key: "Pendiente", label: "Por hacer", color: "#9E9E9E" },
  { key: "En progreso", label: "En curso", color: "#2196F3" },
  { key: "En revisión", label: "Revisión", color: "#FF9800" },
  { key: "Completada", label: "Entregado", color: "#4CAF50" },
];

export function meta() {
  return [{ title: "Kanban | CRM DESEO DIGITAL" }];
}

export default function Kanban() {
  const { tareas, proyectos, clientes, fetchTareas, fetchProyectos, fetchClientes } = useCRMStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [filterCliente, setFilterCliente] = useState<string>("");
  const [filterProyecto, setFilterProyecto] = useState<string>("");
  const [filterPrioridad, setFilterPrioridad] = useState<string>("");

  const clientesMap = useMemo(() => {
    const m: Record<number, string> = {};
    (clientes || []).forEach((c: any) => { m[c.id] = c.nombre || `Cliente #${c.id}`; });
    return m;
  }, [clientes]);

  const proyectosMap = useMemo(() => {
    const m: Record<string, string> = {};
    (proyectos || []).forEach((p: any) => { m[String(p.id)] = p.nombre || `Proyecto #${p.id}`; });
    return m;
  }, [proyectos]);

  const tareasNormalizadas = useMemo<TareaKanban[]>(() => {
    return (tareas || []).map((t: any) => {
      const estado = (["Pendiente", "En progreso", "Completada"].includes(t.estado) ? t.estado : "Pendiente") as Estado;
      const clienteNombre = t.cliente_id ? (clientesMap[Number(t.cliente_id)] || null) : null;
      const proyectoNombre = t.proyecto_id ? (proyectosMap[String(t.proyecto_id)] || null) : null;
      return {
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        estado,
        prioridad: (t.prioridad || "Media") as Prioridad,
        fecha: t.fecha || t.fecha_vencimiento || null,
        cliente_id: t.cliente_id ?? null,
        proyecto_id: t.proyecto_id ?? null,
        cliente_nombre: clienteNombre,
        proyecto_nombre: proyectoNombre,
      };
    });
  }, [tareas, clientesMap, proyectosMap]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchTareas(), fetchProyectos(), fetchClientes()]);
      } catch (e: any) {
        if (mounted) setError(e.message || "Error cargando datos");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchTareas, fetchProyectos, fetchClientes]);

  const updateEstado = async (tareaId: number, nuevoEstado: Estado) => {
    try {
      const current = (tareas || []).find((t: any) => t.id === tareaId);
      if (!current) return;
      
      useCRMStore.getState().updateTarea(tareaId, { estado: nuevoEstado });

      await crmEventsService.create("tarea_guardada", {
        tarea_id: tareaId,
        estado: nuevoEstado,
        titulo: current.titulo,
      });
      
      setSnack({ open: true, message: "Tarea actualizada", severity: "success" });
    } catch (e: any) {
      setSnack({ open: true, message: e.message || "Error actualizando tarea", severity: "error" });
    }
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: Estado) => {
    e.preventDefault();
    const tareaId = Number(e.dataTransfer.getData("text/plain"));
    if (!tareaId) return;
    updateEstado(tareaId, nuevoEstado);
  };

  const handleDragStart = (e: React.DragEvent, tareaId: number) => {
    e.dataTransfer.setData("text/plain", String(tareaId));
    e.dataTransfer.effectAllowed = "move";
  };

  const estaVencida = (fecha?: string) => {
    if (!fecha) return false;
    const hoy = new Date().toISOString().split("T")[0];
    return fecha < hoy;
  };

  if (loading && tareas.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography color="text.secondary">Cargando tablero...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 120px)", minHeight: 500, p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>Kanban</Typography>
          <Typography variant="body2" color="text.secondary">
            Arrastra las tarjetas para cambiar el estado
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip size="small" label={`${tareasNormalizadas.length} tareas`} />
          <Tooltip title="Recargar">
            <IconButton size="small" onClick={() => fetchTareas()}>
              <FiRefreshCw size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Select size="small" value={filterCliente} label="Cliente" onChange={(e) => setFilterCliente(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">Todos</MenuItem>
          {(clientes || []).map((c: any) => <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>)}
        </Select>
        <Select size="small" value={filterProyecto} label="Proyecto" onChange={(e) => setFilterProyecto(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">Todos</MenuItem>
          {(proyectos || []).map((p: any) => <MenuItem key={p.id} value={String(p.id)}>{p.nombre}</MenuItem>)}
        </Select>
        <Select size="small" value={filterPrioridad} label="Prioridad" onChange={(e) => setFilterPrioridad(e.target.value)} sx={{ minWidth: 120 }}>
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="Alta">Alta</MenuItem>
          <MenuItem value="Media">Media</MenuItem>
          <MenuItem value="Baja">Baja</MenuItem>
        </Select>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: { xs: 1, sm: 2 },
          overflowX: "auto",
          pb: 1,
          height: "100%",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 3 },
        }}
      >
        {COLUMNAS.map((col) => {
          const tareasCol = tareasNormalizadas.filter((t) => {
            if (filterCliente && String(t.cliente_id ?? "") !== filterCliente) return false;
            if (filterProyecto && String(t.proyecto_id ?? "") !== filterProyecto) return false;
            if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
            return t.estado === col.key;
          });
          return (
            <Paper
              key={col.key}
              sx={{
                minWidth: { xs: 260, sm: 280 },
                flex: "1 1 260px",
                maxWidth: 320,
                display: "flex",
                flexDirection: "column",
                bgcolor: "#1b1d23",
                borderTop: `3px solid ${col.color}`,
                borderRadius: 2,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <Box sx={{ p: { xs: 1, sm: 1.5 }, pb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {col.label}
                  </Typography>
                  <Chip label={tareasCol.length} size="small" sx={{ height: 22, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.08)", color: "text.secondary" }} />
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 1, sm: 1.5 }, pb: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                {tareasCol.length === 0 && (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      Sin tareas
                    </Typography>
                  </Box>
                )}
                {tareasCol.map((tarea) => (
                  <Paper
                    key={tarea.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tarea.id)}
                    sx={{
                      p: { xs: 1.2, sm: 1.5 },
                      cursor: "grab",
                      border: "1px solid",
                      borderColor: "rgba(255,255,255,0.08)",
                      bgcolor: estaVencida(tarea.fecha) ? "rgba(244,67,54,0.12)" : "rgba(255,255,255,0.04)",
                      borderRadius: 1.5,
                      "&:active": { cursor: "grabbing" },
                      transition: "transform .08s, box-shadow .08s",
                      "&:hover": { transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, wordBreak: "break-word", flex: 1 }}>
                        {tarea.titulo}
                      </Typography>
                      <Chip label={tarea.prioridad} size="small" sx={{ height: 18, fontSize: "0.65rem", flexShrink: 0, bgcolor: tarea.prioridad === "Alta" ? "rgba(244,67,54,0.2)" : tarea.prioridad === "Media" ? "rgba(255,152,0,0.18)" : "rgba(255,255,255,0.07)", color: tarea.prioridad === "Alta" ? "#ff8a80" : tarea.prioridad === "Media" ? "#ffcc80" : "text.secondary" }} />
                    </Box>

                    {tarea.descripcion && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tarea.descripcion}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center", mt: 0.5 }}>
                      {tarea.proyecto_nombre && (
                        <Chip icon={<FiFolder size={12} />} label={tarea.proyecto_nombre} size="small" sx={{ height: 22, fontSize: "0.65rem", bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "text.secondary" }} />
                      )}
                      {tarea.cliente_nombre && (
                        <Chip icon={<FiUser size={12} />} label={tarea.cliente_nombre} size="small" sx={{ height: 22, fontSize: "0.65rem", bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "text.secondary" }} />
                      )}
                      {tarea.fecha && (
                        <Chip
                          icon={<FiClock size={12} />}
                          label={tarea.fecha}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.65rem",
                            bgcolor: estaVencida(tarea.fecha) ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.06)",
                            color: estaVencida(tarea.fecha) ? "#ff8a80" : "text.secondary",
                            border: estaVencida(tarea.fecha) ? "1px solid rgba(244,67,54,0.3)" : "1px solid rgba(255,255,255,0.12)",
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
