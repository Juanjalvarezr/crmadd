import { Outlet, useNavigate, useLocation } from "react-router";
import { useState } from "react";
import { Box, Typography, Paper, Button, Stack, Chip } from "@mui/material";
import { Folder, Plus, Play, Pause, CheckCircle, X } from "lucide-react";
import SafeChip from "../components/SafeChip";

type Estado = "planificacion" | "en_progreso" | "pausado" | "completado" | "cancelado";

interface Proyecto {
  id: string;
  nombre: string;
  estado: Estado;
  cliente?: string;
}

const columnas: { key: Estado; label: string; color: string }[] = [
  { key: "planificacion", label: "Por hacer", color: "#9e9e9e" },
  { key: "en_progreso", label: "En progreso", color: "#2196f3" },
  { key: "pausado", label: "Pausados", color: "#ff9800" },
  { key: "completado", label: "Entregados", color: "#4caf50" },
  { key: "cancelado", label: "Cancelados", color: "#f44336" },
];

const getIcon = (estado: Estado) => {
  switch (estado) {
    case "en_progreso": return <FiPlay size={16} />;
    case "pausado": return <FiPause size={16} />;
    case "completado": return <FiCheckCircle size={16} />;
    case "cancelado": return <FiX size={16} />;
    default: return <FiFolder size={16} />;
  }
};

export default function Kanban() {
  const [proyectos] = useState<Proyecto[]>([
    { id: "1", nombre: "Rediseño web", estado: "planificacion", cliente: "Cliente A" },
    { id: "2", nombre: "Campaña Instagram", estado: "en_progreso", cliente: "Cliente B" },
    { id: "3", nombre: "Landing page", estado: "pausado", cliente: "Cliente C" },
    { id: "4", nombre: "SEO Local", estado: "completado", cliente: "Cliente A" },
  ]);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", sm: "2rem" } }}>Kanban de Proyectos</Typography>
        <Button variant="contained" startIcon={<FiPlus />}>Nuevo Proyecto</Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
        {columnas.map((col) => {
          const items = proyectos.filter((p) => p.estado === col.key);
          return (
            <Paper key={col.key} sx={{ minWidth: 260, flex: 1, borderRadius: 3, border: "1px solid", borderColor: "divider", p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <SafeChip label={items.length} size="small" sx={{ bgcolor: col.color, color: "#fff" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{col.label}</Typography>
              </Box>

              <Stack spacing={1.5}>
                {items.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", cursor: "pointer" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      {getIcon(item.estado)}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.nombre}</Typography>
                    </Box>
                    {item.cliente && (
                      <Typography variant="caption" color="text.secondary">{item.cliente}</Typography>
                    )}
                  </Paper>
                ))}
                {items.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Sin proyectos</Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
