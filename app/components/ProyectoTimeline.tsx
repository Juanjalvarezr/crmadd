import React, { useMemo } from "react";
import {
  Box, Typography, Paper, Chip, Stack
} from "@mui/material";
import {
  Calendar, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import type { Proyecto } from "../types/crm";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface ProyectoTimelineProps {
  proyecto: Proyecto;
}

const ESTADOS_FASE: { key: Proyecto["faseAdministrativa"]; label: string; color: string }[] = [
  { key: "propuesta", label: "Propuesta", color: "#e91e63" },
  { key: "contrato", label: "Contrato", color: "#9c27b0" },
  { key: "onboarding", label: "Onboarding", color: "#ff9800" },
  { key: "operacion", label: "Operación", color: "#2196f3" },
  { key: "capacitacion", label: "Capacitación", color: "#00bcd4" },
  { key: "renovacion", label: "Renovación", color: "#4caf50" },
];

export function ProyectoTimeline({ proyecto }: ProyectoTimelineProps) {
  const faseActualIndex = ESTADOS_FASE.findIndex(f => f.key === proyecto.faseAdministrativa);

  const diasRestantes = useMemo(() => {
    const hoy = new Date();
    const fin = new Date(proyecto.fechaFin);
    return differenceInDays(fin, hoy);
  }, [proyecto.fechaFin]);

  const estaVencido = diasRestantes < 0 && proyecto.estado !== "completado";
  const estaProximo = diasRestantes >= 0 && diasRestantes <= 7 && proyecto.estado !== "completado";

  return (
    <Box sx={{ py: 1 }}>
      <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: "#fafafa" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Calendar size={20} color="#1976d2" />
          Cronograma del Proyecto
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
          <Chip
            icon={<Clock size={16} />}
            label={`Inicio: ${format(new Date(proyecto.fechaInicio), "dd/MM/yyyy")}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Fin: ${format(new Date(proyecto.fechaFin), "dd/MM/yyyy")}`}
            variant="outlined"
            size="small"
            color={estaVencido ? "error" : estaProximo ? "warning" : "default"}
          />
          {estaVencido && (
            <Chip
              icon={<AlertTriangle size={16} />}
              label={`Vencido hace ${Math.abs(diasRestantes)} días`}
              color="error"
              size="small"
            />
          )}
          {estaProximo && !estaVencido && (
            <Chip
              label={`Faltan ${diasRestantes} días`}
              color="warning"
              size="small"
            />
          )}
          {proyecto.estado === "completado" && (
            <Chip
              icon={<CheckCircle size={16} />}
              label="Completado"
              color="success"
              size="small"
            />
          )}
        </Stack>

        {/* Timeline de fases */}
        <Box sx={{ position: "relative", pl: 3 }}>
          {ESTADOS_FASE.map((fase, idx) => {
            const esCompletada = idx < faseActualIndex;
            const esActual = idx === faseActualIndex;
            return (
              <Box key={fase.key} sx={{ position: "relative", pb: idx < ESTADOS_FASE.length - 1 ? 4 : 0 }}>
                {/* Línea conectora */}
                {idx < ESTADOS_FASE.length - 1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: -19,
                      top: 28,
                      bottom: -12,
                      width: 2,
                      bgcolor: esCompletada ? "success.main" : esActual ? fase.color : "#e0e0e0"
                    }}
                  />
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bgcolor: esCompletada || esActual ? fase.color : "#e0e0e0",
                      border: esCompletada || esActual ? "none" : "2px solid #ccc",
                      position: "absolute",
                      left: -23,
                      top: 2
                    }}
                  />
                  <Chip
                    label={fase.label}
                    size="small"
                    sx={{
                      bgcolor: esCompletada || esActual ? fase.color : "transparent",
                      color: esCompletada || esActual ? "#fff" : "text.secondary",
                      fontWeight: esActual ? "bold" : "normal",
                      border: esCompletada || esActual ? "none" : "1px dashed #ccc"
                    }}
                  />
                  {esCompletada && <CheckCircle size={16} color="#4caf50" />}
                  {esActual && <Clock size={16} color={fase.color} />}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
