import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Box, Typography, Container, Paper, Grid, LinearProgress,
  Card, CardContent, CircularProgress, Alert, Stack,
  Divider, Button, List, ListItem, ListItemIcon, ListItemText,
  Tabs, Tab, Collapse, TextField, IconButton, Tooltip
} from "@mui/material";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiLayers, FiLink,
  FiCalendar, FiPlay, FiSmartphone, FiTrendingUp, FiActivity, FiStar,
  FiMail, FiSend, FiFileText, FiDownload, FiEdit2, FiTrash2,
  FiPlus, FiShare2, FiEye, FiDollarSign, FiTarget, FiZap, FiUser
} from "react-icons/fi";
import { proyectosService, tareasService, emailService } from "../services/database";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";

const getFaseColor = (fase: string) => {
  const colors: Record<string, string> = {
    propuesta: "#00b0ff", contrato: "#9c27b0", onboarding: "#ff9100",
    operacion: "#00c853", capacitacion: "#00e5ff", renovacion: "#e91e63",
  };
  return colors[fase] || "#9e9e9e";
};

const getFaseLabel = (fase: string) => ({
  propuesta: "Propuesta Comercial", contrato: "Contrato Firmado",
  onboarding: "Onboarding y Setup", operacion: "Operación Activa",
  capacitacion: "Capacitación", renovacion: "Renovación Mensual",
}[fase] || fase);

const getEstadoLabel = (estado: string) => ({
  planificacion: "En Planificación", en_progreso: "En Progreso Activo",
  pausado: "En Pausa Temporal", completado: "Completado Exitosamente", cancelado: "Cancelado",
}[estado] || estado);

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }

const TabPanel = ({ children, value, index, ...rest }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} {...rest} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
    {value === index && <>{children}</>}
  </Box>
);

export default function ProyectoInterno() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  const [estrategia, setEstrategia] = useState<any>({ objetivo: "", publico_objetivo: "", diferenciador: "", cronograma: "" });
  const [canales, setCanales] = useState<any>({ redes: false, ads: false, email: false, seo: false });
  const [tareas, setTareas] = useState<any[]>([]);
  const [facturacion, setFacturacion] = useState<any>({ cuotas: [], monto_total: 0, monto_pagado: 0, estado: "pendiente" });
  const [editEstrategia, setEditEstrategia] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const p = await proyectosService.getById(id);
      setProyecto(p as any);
      setEstrategia((p as any)?.estrategia || { objetivo: "", publico_objetivo: "", diferenciador: "", cronograma: "" });
      setCanales((p as any)?.canales || { redes: false, ads: false, email: false, seo: false });
      setFacturacion((p as any)?.facturacion_detalle || { cuotas: [], monto_total: 0, monto_pagado: 0, estado: "pendiente" });
      try {
        const t = await tareasService.getAll();
        setTareas(t.filter((t: any) => t.proyecto_id === id || t.proyectoId === id || t.proyecto === id));
      } catch {
        setTareas([]);
      }
    } catch (err: any) {
      setError("No pudimos cargar este proyecto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveEstrategia = async () => {
    if (!proyecto?.id) return;
    await proyectosService.update(proyecto.id, { estrategia, canales } as any);
    setEditEstrategia(false);
  };

  const handleSendContract = async () => {
    if (!proyecto?.clienteNombre || !(proyecto as any)?.contrato_url) return;
    await emailService.sendRealEmail(
      [proyecto.clienteNombre],
      "Contrato de Proyecto - DESEO DIGITAL",
      `Hola ${proyecto.clienteNombre}, adjunto encontrarás el contrato del proyecto ${proyecto.nombre}.`
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress color="primary" sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Cargando proyecto...</Typography>
      </Box>
    );
  }

  if (error || !proyecto) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", p: 3 }}>
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Proyecto no encontrado</Typography>
            <Typography variant="body2" color="text.secondary">{error || "El proyecto no existe o no está disponible."}</Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  const presupuesto = Number(proyecto.presupuesto || 0);
  const pagado = Number(facturacion.monto_pagado || 0);
  const saldo = Math.max(presupuesto - pagado, 0);
  const progreso = Math.min(Math.max(proyecto.progreso || 0, 0), 100);

  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="lg">
        {/* Encabezado compacto */}
        <Paper sx={{
          p: { xs: 2.5, md: 4 }, mt: 3, mb: 3,
          border: "1px solid", borderColor: "divider", borderRadius: 3,
          bgcolor: "background.paper"
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1.2} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                <SafeChip label={getFaseLabel(proyecto.faseAdministrativa)} size="small" sx={{ bgcolor: `${getFaseColor(proyecto.faseAdministrativa)}18`, color: getFaseColor(proyecto.faseAdministrativa), fontWeight: "bold" }} />
                <SafeChip label={getEstadoLabel(proyecto.estado)} size="small" variant="outlined" />
                {proyecto.codigo && <SafeChip label={proyecto.codigo} size="small" color="secondary" variant="outlined" />}
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.5 }}>{proyecto.nombre}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{proyecto.descripcion || "Estrategia de posicionamiento digital y marketing estratégico."}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} color="text.secondary" fontSize="0.85rem">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><FiBriefcase color="#E91E63" size={16} /> <strong>Cliente:</strong> {proyecto.clienteNombre}</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><FiCalendar color="#E91E63" size={16} /> <strong>Inicio:</strong> {proyecto.fechaInicio}</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><FiClock color="#E91E63" size={16} /> <strong>Entrega:</strong> {proyecto.fechaFin}</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><FiDollarSign color="#E91E63" size={16} /> <strong>Presupuesto:</strong> ${presupuesto.toLocaleString()}</Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: "uppercase", fontWeight: "bold" }}>Progreso General</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ flexGrow: 1 }}><LinearProgress variant="determinate" value={progreso} sx={{ height: 8, borderRadius: 4 }} /></Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "secondary.main", minWidth: "3ch" }}>{progreso}%</Typography>
              </Box>
              <SafeChip label={getEstadoLabel(proyecto.estado)} sx={{ bgcolor: proyecto.estado === "en_progreso" ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.05)", color: proyecto.estado === "en_progreso" ? "#00c853" : "text.primary", fontWeight: "bold" }} />
            </Grid>
          </Grid>
        </Paper>

        {/* Dashboard compacto unificado */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Cliente */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(233,30,99,0.08)" }}><FiUser color="#E91E63" size={16} /></Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Cliente</Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Nombre:</strong> {proyecto.clienteNombre}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5, wordBreak: "break-word" }}><strong>Correo:</strong> {(proyecto as any).clienteEmail || "No registrado"}</Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}><strong>Teléfono:</strong> {(proyecto as any).clienteTelefono || "No registrado"}</Typography>
            </Paper>
          </Grid>

          {/* Pagos */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,200,83,0.08)" }}><FiDollarSign color="#00c853" size={16} /></Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pagos</Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>${presupuesto.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Pagado</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#00c853" }}>${pagado.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Saldo</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: saldo > 0 ? "#ff9100" : "#00c853" }}>${saldo.toLocaleString()}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress variant="determinate" value={presupuesto > 0 ? (pagado / presupuesto) * 100 : 0} sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="caption" color="text.secondary">{Math.round(presupuesto > 0 ? (pagado / presupuesto) * 100 : 0)}% pagado</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Accesos rápidos */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, height: "100%", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,176,255,0.08)" }}><FiZap color="#00b0ff" size={16} /></Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Accesos</Typography>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" variant="outlined" startIcon={<FiShare2 size={14} />} onClick={() => alert("Magic link generado")}>Compartir</Button>
                <Button size="small" variant="outlined" startIcon={<FiFileText size={14} />} component={Link} to={`/contratos?proyecto=${proyecto.id}`}>Contrato</Button>
                <Button size="small" variant="outlined" startIcon={<FiMail size={14} />} component={Link} to={`/facturacion?proyecto=${proyecto.id}`}>Factura</Button>
                {(proyecto as any).contrato_url && (
                  <Button size="small" variant="contained" startIcon={<FiDownload size={14} />} href={(proyecto as any).contrato_url} target="_blank">Descargar</Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs detallados */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 600, fontSize: "0.85rem" } }}
          >
            <Tab label={`Estrategia` + (estrategia.objetivo ? " ✓" : "")} />
            <Tab label={`Canales`} />
            <Tab label="Calendario" />
            <Tab label={`Tareas (${tareas.length})`} />
            <Tab label="Documentos" />
            <Tab label={`Facturación (${facturacion.estado || "pendiente"})`} />
            <Tab label="Contratos" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Estrategia del Proyecto</Typography>
              {!editEstrategia ? (
                <Button startIcon={<FiEdit2 size={16} />} size="small" onClick={() => setEditEstrategia(true)}>Editar</Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={handleSaveEstrategia}>Guardar</Button>
                  <Button size="small" onClick={() => setEditEstrategia(false)}>Cancelar</Button>
                </Stack>
              )}
            </Stack>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}><TextField label="Objetivo principal" fullWidth multiline rows={2} size="small" disabled={!editEstrategia} value={estrategia.objetivo || ""} onChange={(e) => setEstrategia({ ...estrategia, objetivo: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Público objetivo" fullWidth size="small" disabled={!editEstrategia} value={estrategia.publico_objetivo || ""} onChange={(e) => setEstrategia({ ...estrategia, publico_objetivo: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Diferenciador" fullWidth size="small" disabled={!editEstrategia} value={estrategia.diferenciador || ""} onChange={(e) => setEstrategia({ ...estrategia, diferenciador: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField label="Cronograma" fullWidth multiline rows={3} size="small" disabled={!editEstrategia} value={estrategia.cronograma || ""} onChange={(e) => setEstrategia({ ...estrategia, cronograma: e.target.value })} helperText="Hitos mensuales y entregables clave" /></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Canales Digitales</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              {["redes", "ads", "email", "seo"].map((canal) => {
                const activo = !!(canales as any)[canal];
                return (
                  <Grid item xs={6} md={3} key={canal}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: activo ? "primary.main" : "divider", bgcolor: activo ? "rgba(233,30,99,0.04)" : "background.paper" }}>
                      <Typography variant="h6" sx={{ textTransform: "capitalize", fontWeight: 700 }}>{canal}</Typography>
                      <SafeChip label={activo ? "Activo" : "Inactivo"} size="small" color={activo ? "success" : "default"} sx={{ mt: 1 }} />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Calendario del Proyecto</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><Paper sx={{ p: 3, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Inicio</Typography><Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>{proyecto.fechaInicio}</Typography></Paper></Grid>
              <Grid item xs={12} md={4}><Paper sx={{ p: 3, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Entrega</Typography><Typography variant="h5" sx={{ fontWeight: 800, color: "secondary.main" }}>{proyecto.fechaFin}</Typography></Paper></Grid>
              <Grid item xs={12} md={4}><Paper sx={{ p: 3, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Fase</Typography><SafeChip label={getFaseLabel(proyecto.faseAdministrativa)} color="primary" sx={{ mt: 1 }} /></Paper></Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tareas del Proyecto</Typography>
            <Divider sx={{ mb: 2 }} />
            {tareas.length === 0 ? (
              <Alert severity="info">Sin tareas registradas para este proyecto.</Alert>
            ) : (
              <List>
                {tareas.slice(0, 12).map((tarea: any) => (
                  <ListItem key={tarea.id} sx={{ px: 0, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <ListItemIcon sx={{ color: tarea.estado === "Completada" ? "success.main" : "text.secondary" }}>
                      {tarea.estado === "Completada" ? <FiCheckCircle /> : <FiClock />}
                    </ListItemIcon>
                    <ListItemText primary={tarea.titulo} secondary={`Responsable: ${tarea.responsable_id || "Sin asignar"} • Vence: ${tarea.fecha}`} />
                    <SafeChip label={tarea.estado || "Pendiente"} size="small" color={tarea.estado === "Completada" ? "success" : tarea.estado === "En progreso" ? "warning" : "default"} />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Documentos</Typography>
            <Divider sx={{ mb: 2 }} />
            {(proyecto as any).recursos?.length > 0 ? (
              <List>
                {(proyecto as any).recursos.map((recurso: any) => (
                  <ListItem key={recurso.id} sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon><FiFileText color="#E91E63" /></ListItemIcon>
                    <ListItemText primary={recurso.nombre} secondary={recurso.url} />
                    <Button size="small" startIcon={<FiDownload size={14} />} href={recurso.url} target="_blank">Descargar</Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">Sin documentos adjuntos.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tab} index={5}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Facturación</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Presupuesto</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>${presupuesto.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Pagado</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "#00c853" }}>${pagado.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Saldo</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "#ff9100" }}>${saldo.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Estado</Typography><SafeChip label={facturacion.estado || "pendiente"} size="small" sx={{ mt: 1 }} /></Paper></Grid>
            </Grid>
            {facturacion.cuotas?.length > 0 && (
              <List sx={{ mt: 2 }}>
                {facturacion.cuotas.map((cuota: any, idx: number) => (
                  <ListItem key={idx} sx={{ px: 0, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                    <ListItemText primary={`Cuota ${idx + 1} • $${Number(cuota.monto || 0).toLocaleString()}`} secondary={cuota.fecha || ""} />
                    <SafeChip label={cuota.pagada ? "Pagada" : "Pendiente"} size="small" color={cuota.pagada ? "success" : "warning"} />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tab} index={6}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Contratos</Typography>
            <Divider sx={{ mb: 3 }} />
            {(proyecto as any).contrato_url ? (
              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<FiEye size={16} />} href={(proyecto as any).contrato_url} target="_blank">Ver Contrato</Button>
                <Button variant="outlined" startIcon={<FiDownload size={16} />} href={(proyecto as any).contrato_url} target="_blank">Descargar</Button>
                <Button variant="text" color="secondary" startIcon={<FiSend size={16} />} onClick={handleSendContract}>Enviar por Email</Button>
              </Stack>
            ) : (
              <Alert severity="warning">Sin contrato adjunto. Subilo desde documentos o generalo desde una plantilla.</Alert>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}
