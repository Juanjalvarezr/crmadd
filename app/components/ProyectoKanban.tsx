import React, { useState } from "react";
import {
  Box, Typography, Paper, Chip, Stack, IconButton, Tooltip
} from "@mui/material";
import {
  Play, Pause, CheckCircle, X, Folder, Edit2, Trash2, Eye
} from "lucide-react";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";

type Estado = "planificacion" | "en_progreso" | "pausado" | "completado" | "cancelado";

interface ProyectoKanbanProps {
  proyectos: Proyecto[];
  onView: (proyecto: Proyecto) => void;
  onEdit: (proyecto: Proyecto) => void;
  onDelete: (proyecto: Proyecto) => void;
  onStatusChange: (proyecto: Proyecto, estado: Estado) => void;
}

const columnas: { key: Estado; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "planificacion", label: "Planificación", color: "#9e9e9e", icon: <Folder size={16} /> },
  { key: "en_progreso", label: "En Progreso", color: "#2196f3", icon: <Play size={16} /> },
  { key: "pausado", label: "Pausados", color: "#ff9800", icon: <Pause size={16} /> },
  { key: "completado", label: "Completados", color: "#4caf50", icon: <CheckCircle size={16} /> },
  { key: "cancelado", label: "Cancelados", color: "#f44336", icon: <X size={16} /> },
];

export function ProyectoKanban({
  proyectos,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: ProyectoKanbanProps) {
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (estado: Estado) => {
    if (!dragging) return;
    const proyecto = proyectos.find(p => p.id === dragging);
    if (proyecto && proyecto.estado !== estado) {
      onStatusChange(proyecto, estado);
    }
    setDragging(null);
  };

  return (
    <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
      {columnas.map((col) => {
        const items = proyectos.filter((p) => p.estado === col.key);
        return (
          <Paper
            key={col.key}
            sx={{
              minWidth: { xs: 260, md: 280 },
              flex: 1,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 2,
              bgcolor: dragging ? "action.hover" : "background.paper",
              transition: "background-color 0.2s"
            }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.key)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SafeChip
                label={items.length}
                size="small"
                sx={{ bgcolor: col.color, color: "#fff", fontWeight: "bold" }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {col.icon}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                  {col.label}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.5}>
              {items.map((proyecto) => (
                <Paper
                  key={proyecto.id}
                  draggable
                  onDragStart={() => handleDragStart(proyecto.id)}
                  onDragEnd={() => setDragging(null)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: dragging === proyecto.id ? "primary.main" : "divider",
                    cursor: "grab",
                    bgcolor: "background.paper",
                    "&:hover": { boxShadow: 2 }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {proyecto.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    {proyecto.clienteNombre}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
                    {(proyecto.servicios || []).slice(0, 2).map((serv) => (
                      <SafeChip key={serv} label={serv} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />
                    ))}
                    {(proyecto.servicios || []).length > 2 && (
                      <SafeChip label={`+${proyecto.servicios.length - 2}`} size="small" sx={{ fontSize: "0.65rem" }} />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <SafeChip
                      label={`${proyecto.progreso}%`}
                      size="small"
                      sx={{
                        bgcolor: proyecto.progreso === 100 ? "#4caf50" : "#e3f2fd",
                        color: proyecto.progreso === 100 ? "#fff" : "#1976d2",
                        fontWeight: "bold",
                        fontSize: "0.7rem"
                      }}
                    />
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Ver">
                        <IconButton size="small" onClick={() => onView(proyecto)}>
                          <Eye size={14} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(proyecto)}>
                          <Edit2 size={14} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => onDelete(proyecto)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              ))}
              {items.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ py: 2, textAlign: "center", display: "block" }}>
                  Sin proyectos
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
