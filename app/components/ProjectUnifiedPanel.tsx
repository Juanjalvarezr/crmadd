import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Drawer, Stack, Grid, Button,
  Chip, LinearProgress, Divider, IconButton, Link as MuiLink,
  Snackbar, Alert, TextField
} from "@mui/material";
import {
  FiBriefcase, FiFileText, FiDownload, FiShare2, FiCheckCircle, FiClock,
  FiCalendar as FiCal, FiCpu, FiMail, FiMessageCircle, FiStar,
  FiAlertCircle, FiServer, FiLink2, FiRefreshCw, FiEye, FiSend, FiX, FiEdit2, FiSave, FiXCircle
} from "react-icons/fi";
import { tareasService } from "../services/database";
import { facturasService, contratosService } from "../services/facturacion";
import { documentosService } from "../services/supabase";
import { aiService } from "../services/ai";
import { useChatStore } from "../store/useChatStore";
import { openAiRoute } from "../components/FloatingAIAssistant";
import { getPublicProyectoUrl, copyToClipboard } from "../utils/proyectoHelpers";

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const handleCopyLink = async (msg: string) => {
    if (!proyecto?.id) return;
    const url = getPublicProyectoUrl(proyecto.id);
    const ok = await copyToClipboard(url);
    if (ok) {
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (!open || !proyecto?.id) return;
    setCargando(true);
    Promise.all([
      tareasService.getAll().catch(() => []),
      facturasService.getAll().catch(() => []),
      contratosService.getAll().catch(() => []),
      documentosService.getAll().catch(() => []),
      Promise.resolve(null),
    ])
      .then(([tareas, facturas, contratos, documentos, brief]) => {
        const tareasProyecto = (tareas || []).filter((t: any) =>
          t.proyecto_id === proyecto.id || t.proyectoId === proyecto.id || t.proyecto === proyecto.id,
        );
        const facturasProyecto = (facturas || []).filter((x: any) =>
          String(x.proyecto_id) === String(proyecto.id),
        );
        const contratosProyecto = (contratos || []).filter((x: any) =>
          String(x.proyecto_id) === String(proyecto.id),
        );
        const documentosProyecto = (documentos || []).filter((x: any) =>
          String(x.entidad_id || x.proyecto_id || '') === String(proyecto.id),
        );
        setResumen({ tareasProyecto, facturasProyecto, contratosProyecto, documentosProyecto, brief, pagado: 0 });
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
          <Typography variant="h6" sx={{ fontWeight: 900, flexGrow: 1 }}>Proyecto</Typography>
          <Chip label={proyecto?.estado || "activo"} size="small" sx={{ color: STATUS_COLOR[proyecto?.estado] || "#fff", bgcolor: STATUS_COLOR[proyecto?.estado] || "#888", fontWeight: "bold" }} />
          <IconButton onClick={onClose}><FiX /></IconButton>
        </Stack>

        {cargando && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!cargando && (
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
            <Typography variant="body2"><strong>Inicio:</strong> {proyecto?.fechaInicio || "—"}</Typography>
            <Typography variant="body2"><strong>Entrega:</strong> {proyecto?.fechaFin || "—"}</Typography>
            <Typography variant="body2"><strong>Presupuesto:</strong> ${Number(proyecto?.presupuesto || 0).toLocaleString()}</Typography>
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
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#00c853" }}>${Number(resumen?.pagado || 0).toLocaleString()}</Typography>
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
              <Button size="small" variant="outlined" startIcon={<FiShare2 size={14} />} onClick={() => handleCopyLink("¡Enlace de pago copiado!")}>Compartir pago</Button>
            </Stack>
          </Paper>

          {/* Estrategia */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(156,39,176,0.08)" }}>
                <FiStar size={16} color="#9c27b0" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Estrategia</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {(proyecto?.estrategia?.objetivo || proyecto?.estrategia?.publico_objetivo || proyecto?.estrategia?.diferenciador) ? (
              <Stack spacing={1}>
                {proyecto.estrategia.objetivo && <Typography variant="body2"><strong>Objetivo:</strong> {proyecto.estrategia.objetivo}</Typography>}
                {proyecto.estrategia.publico_objetivo && <Typography variant="body2"><strong>Público:</strong> {proyecto.estrategia.publico_objetivo}</Typography>}
                {proyecto.estrategia.diferenciador && <Typography variant="body2"><strong>Diferenciador:</strong> {proyecto.estrategia.diferenciador}</Typography>}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Sin estrategia registrada.</Typography>
            )}
          </Paper>

          {/* Canales */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,152,0,0.08)" }}>
                <FiMail size={16} color="#ff9800" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Canales</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {["redes", "ads", "email", "seo", "whatsapp"].map((canal) => {
                const activo = !!(proyecto?.canales || {})[canal];
                return (
                  <Chip
                    key={canal}
                    label={canal}
                    size="small"
                    color={activo ? "primary" : "default"}
                    sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, textTransform: "capitalize" }}
                  />
                );
              })}
            </Stack>
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
            {Array.isArray(proyecto?.cronograma) && proyecto.cronograma.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {proyecto.cronograma.slice(0, 5).map((hito: any, idx: number) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1.2, borderRadius: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{hito.titulo || `Hito ${idx + 1}`}</Typography>
                    <Typography variant="caption" color="text.secondary">{hito.fecha || "Sin fecha"} • {hito.estado || "Pendiente"}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
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

          {/* Documentos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(76,175,80,0.08)" }}>
                <FiFileText size={16} color="#4caf50" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Documentos ({resumen?.documentosProyecto?.length || 0})</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {!resumen?.documentosProyecto?.length && <Typography variant="body2" color="text.secondary">Sin documentos.</Typography>}
            <Stack spacing={1}>
              {(resumen?.documentosProyecto || []).slice(0, 5).map((doc: any) => (
                <Paper key={doc.id} variant="outlined" sx={{ p: 1.2, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{doc.nombre || doc.titulo || "Documento"}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all", display: "block", mb: 0.5 }}>{doc.url}</Typography>
                  {doc.url && <Button size="small" variant="contained" startIcon={<FiDownload size={12} />} href={doc.url} target="_blank">Descargar</Button>}
                </Paper>
              ))}
            </Stack>
          </Paper>

          {/* Contratos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(156,39,176,0.08)" }}>
                <FiFileText size={16} color="#9c27b0" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Contratos ({resumen?.contratosProyecto?.length || 0})</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {!resumen?.contratosProyecto?.length && <Typography variant="body2" color="text.secondary">Sin contratos.</Typography>}
            <Stack spacing={1}>
              {(resumen?.contratosProyecto || []).slice(0, 5).map((c: any) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.2, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.titulo || c.nombre || "Contrato"}</Typography>
                  <Typography variant="caption" color="text.secondary">Estado: {c.estado || "Sin estado"} {c.fecha_inicio ? `• ${c.fecha_inicio}` : ""}</Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>

          {/* Facturas */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(233,30,99,0.08)" }}>
                <span style={{fontWeight: 900, color: "#E91E63"}}>$</span>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Facturas ({resumen?.facturasProyecto?.length || 0})</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {!resumen?.facturasProyecto?.length && <Typography variant="body2" color="text.secondary">Sin facturas.</Typography>}
            <Stack spacing={1}>
              {(resumen?.facturasProyecto || []).slice(0, 5).map((f: any) => (
                <Paper key={f.id} variant="outlined" sx={{ p: 1.2, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Factura {f.numero || f.id}</Typography>
                  <Typography variant="caption" color="text.secondary">${Number(f.total || 0).toLocaleString()} • {f.estado || "N/A"}</Typography>
                </Paper>
              ))}
            </Stack>
          </Paper>

          {/* Brief IA */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(124,77,255,0.08)" }}>
                <FiCpu size={16} color="#7c4dff" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Brief IA</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            {resumen?.brief ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{typeof resumen.brief === "string" ? resumen.brief : JSON.stringify(resumen.brief, null, 2)}</Typography>
            ) : (
              <Button size="small" variant="text" startIcon={<FiCpu size={14} />} onClick={async () => {
                const brief = null;
                openAiRoute("proyecto", String(proyecto.id), proyecto.nombre);
                setAssistantOpen(false);
              }}>Generar brief con IA</Button>
            )}
          </Paper>

          {/* Acciones rápidas */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,176,255,0.08)" }}>
                <FiServer size={16} color="#00b0ff" />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Acciones</Typography>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button size="small" variant="contained" startIcon={<FiCpu size={14} />} onClick={() => { openAiRoute("proyecto", String(proyecto.id), proyecto.nombre); setAssistantOpen(false); }}>Abrir copiloto</Button>
              <Button size="small" variant="outlined" startIcon={<FiShare2 size={14} />} onClick={() => handleCopyLink("¡Enlace del portal copiado!")}>Magic link</Button>
              <Button size="small" variant="outlined" startIcon={<FiRefreshCw size={14} />} onClick={onClose}>Cerrar panel</Button>
            </Stack>
          </Paper>
        </Stack>
        )}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ fontWeight: 700 }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Drawer>
  );
}