import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { FiFolder, FiPlus, FiPlay, FiPause, FiCheckCircle, FiX } from "react-icons/fi";
import SafeChip from "../components/SafeChip";
import { proyectosService } from "../services/database";
import type { Proyecto } from "../types/crm";


type Estado = Proyecto["estado"];


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
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await proyectosService.getAll();
        setProyectos((data as Proyecto[]) || []);
      } catch {
        setProyectos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
            <Paper key={col.key} sx={{ minWidth: 220, flex: 1, borderRadius: 3, border: "1px solid", borderColor: "divider", p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <SafeChip label={items.length} size="small" sx={{ bgcolor: col.color, color: "#fff" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{col.label}</Typography>
              </Box>

              <Stack spacing={1.5}>
                {items.map((item) => (
                  <Paper key={item.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", cursor: "pointer" }}>
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
