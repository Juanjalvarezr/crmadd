import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Drawer, Stack, Grid, Button,
  Chip, LinearProgress, Divider, IconButton, Link as MuiLink
} from "@mui/material";
import {
  FiBriefcase, FiFileText, FiDownload, FiShare2, FiCheckCircle, FiClock,
  FiCalendar as FiCal, FiCpu, FiMail, FiMessageCircle, FiStar,
  FiAlertCircle, FiServer, FiLink2, FiRefreshCw, FiEye, FiSend
} from "react-icons/fi";
import { tareasService } from "../services/database";
import { aiService } from "../services/ai";
import { useChatStore } from "../store/useChatStore";
import { openAiRoute } from "../components/FloatingAIAssistant";

export type ProjectUnifiedPanelProps = {
  open: boolean;
  onClose: () => void;
  proyecto: any;
};

const STATUS_COLOR: Record<string, string> = {
  planificacion: "#90caf9",
  en_progreso: "#ffcc80",
  pausado: "#b39ddb",
  completado: "#a5d6a7",
  cancelado: "#ef9a9a",
};

export default function ProjectUnifiedPanel({ open, onClose, proyecto }: ProjectUnifiedPanelProps) {
  const { setAssistantOpen } = useChatStore();
  const [resumen, setResumen] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!open || !proyecto?.id) return;
    setCargando(true);
    Promise.all([
      tareasService.getAll().catch(() => []),
      aiService.generarBriefProyecto(String(proyecto.id)).catch(() => null),
    ])
      .then(([tareas, brief]) => {
        const tareasProyecto = (tareas || []).filter((t: any) =>
          t.proyecto_id === proyecto.id || t.proyectoId === proyecto.id || t.proyecto === proyecto.id,
        );
        setResumen({ tareasProyecto, pagado: 0, brief });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [open, proyecto?.id]);

  const drawerWidth = { xs: "100vw", md: "420px" };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
    >
      <Box sx={{ p: 2, height: "100%", overflowY: "auto" }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, flexGrow: 1 }}>Panel inteligente</Typography>
          <Chip label={proyecto?.estado || "activo"} size="small" sx={{ color: STATUS_COLOR[proyecto?.estado] || "#fff", bgcolor: STATUS_COLOR[proyecto?.estado] || "#888", fontWeight: "bold" }} />
          <IconButton onClick={onClose}><FiX /></IconButton>
        </Stack>

        <Stack spacing={2}>
          {/* Identidad */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(233,30,99,0.08)" }}>
                <FiBriefcase size={16} color="#E91E63" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Identidad</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body2"><strong>Proyecto:</strong> {proyecto?.nombre}</Typography>
            <Typography variant="body2"><strong>Cliente:</strong> {proyecto?.clienteNombre}</Typography>
            <Typography variant="body2"><strong>Código:</strong> {proyecto?.codigo || "—"}</Typography>
            <Typography variant="body2"><strong>Fase:</strong> {proyecto?.faseAdministrativa || "—"}</Typography>
          </Paper>

          {/* Facturación */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,200,83,0.08)" }}>
                <FiFileText size={16} color="#00c853" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Facturación</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Presupuesto</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>${Number(proyecto?.presupuesto || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Pagado</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#00c853" }}>${resumen?.pagado || 0}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Por cobrar</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#ff9100" }}>
                  ${Math.max(Number(proyecto?.presupuesto || 0) - Number(resumen?.pagado || 0), 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress variant="determinate" value={Number(proyecto?.presupuesto || 1) > 0 ? (Number(resumen?.pagado || 0) / Number(proyecto?.presupuesto || 1)) * 100 : 0} sx={{ height: 6, borderRadius: 3 }} />
              <Typography variant="caption" color="text.secondary">{Math.round(Number(proyecto?.presupuesto || 1) > 0 ? (Number(resumen?.pagado || 0) / Number(proyecto?.presupuesto || 1)) * 100 : 0)}%</Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" startIcon={<FiMail size={14} />} component={MuiLink} href={`/facturacion?proyecto=${proyecto?.id}`}>Factura</Button>
              <Button size="small" variant="outlined" startIcon={<FiShare2 size={14} />} onClick={() => alert("Magic link generado")}>Compartir pago</Button>
            </Stack>
          </Paper>

          {/* Contratos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(156,39,176,0.08)" }}>
                <FiFileText size={16} color="#9c27b0" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Contratos</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {(proyecto?.contrato_url) ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" startIcon={<FiEye size={14} />} href={proyecto.contrato_url} target="_blank">Ver</Button>
                <Button size="small" variant="outlined" startIcon={<FiDownload size={14} />} href={proyecto.contrato_url} target="_blank">Descargar</Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Sin contrato adjunto.</Typography>
            )}
          </Paper>

          {/* Cronograma */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,176,255,0.08)" }}>
                <FiCal size={16} color="#00b0ff" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Cronograma</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body2"><strong>Inicio:</strong> {proyecto?.fechaInicio || "—"}</Typography>
            <Typography variant="body2"><strong>Entrega:</strong> {proyecto?.fechaFin || "—"}</Typography>
            {(resumen?.brief?.objetivo || resumen?.brief?.cronograma) ? (
              <Paper variant="outlined" sx={{ p: 1.2, mt: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.02)" }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>IA Brief</Typography>
                <Typography variant="body2">{String(resumen.brief.objetivo || "").slice(0, 180)}</Typography>
                <Typography variant="caption" color="text.secondary">{(resumen.brief.cronograma || "").slice(0, 180)}</Typography>
              </Paper>
            ) : (
              <Box sx={{ mt: 1.5 }}>
                <Button size="small" variant="text" startIcon={<FiCpu size={14} />} onClick={async () => {
                  const brief = await aiService.generarBriefProyecto(String(proyecto.id));
                  openAiRoute("proyecto", String(proyecto.id), proyecto.nombre);
                  setResumen((s: any) => ({ ...s, brief }));
                  setAssistantOpen(false);
                }}>Generar brief con IA</Button>
              </Box>
            )}
          </Paper>

          {/* Calendario compacto */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,145,0,0.08)" }}>
                <FiCal size={16} color="#ff9100" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Calendario</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body2">{proyecto?.fechaInicio || "—"} → {proyecto?.fechaFin || "—"}</Typography>
            <Typography variant="caption" color="text.secondary">Fase: {proyecto?.faseAdministrativa || "—"}</Typography>
          </Paper>

          {/* Tareas */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(33,150,243,0.08)" }}>
                <FiCheckCircle size={16} color="#2196f3" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Tareas ({resumen?.tareasProyecto?.length || 0})</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {!resumen?.tareasProyecto?.length && <Typography variant="body2" color="text.secondary">Sin tareas.</Typography>}
            <Stack spacing={1}>
              {(resumen?.tareasProyecto || []).slice(0, 8).map((t: any, i: number) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.2, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.estado} • Vence {t.fecha}</Typography>
                  <Chip label={t.estado || "Pendiente"} size="small" sx={{ mt: 0.5, fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
                </Paper>
              ))}
            </Stack>
          </Paper>

          {/* Recordatorios */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,23,68,0.08)" }}>
                <FiAlertCircle size={16} color="#ff1744" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Recordatorios</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="Renovación dominio" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
              <Chip label="Suscripción hosting" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
              <Chip label="Suscripción herramientas" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
              <Chip label="Cuota mensual" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
              <Chip label="Pago proveedores" size="small" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Agenda recordatorios en el calendario para no perder fechas.</Typography>
          </Paper>

          {/* Acciones rápidas IA */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,176,255,0.08)" }}>
                <FiCpu size={16} color="#00b0ff" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>IA Acciones</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button size="small" variant="contained" startIcon={<FiCpu size={14} />} onClick={() => { openAiRoute("proyecto", String(proyecto.id), proyecto.nombre); setAssistantOpen(false); }}>Abrir copiloto</Button>
              <Button size="small" variant="outlined" startIcon={<FiShare2 size={14} />} onClick={() => alert("Magic link enviado al cliente")}>Magic link</Button>
              <Button size="small" variant="outlined" startIcon={<FiRefreshCw size={14} />} onClick={onClose}>Cerrar panel</Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Drawer>
  );
}
