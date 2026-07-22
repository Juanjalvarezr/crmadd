import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Box, Typography, Container, Paper, Grid, LinearProgress,
  Alert, Stack,
  Divider, Button, List, ListItem, ListItemIcon, ListItemText,
  Tabs, Tab, TextField, Snackbar
} from "@mui/material";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiLayers,
  FiCalendar, FiMail, FiSend, FiFileText, FiDownload, FiEdit2,
  FiShare2, FiEye, FiFileText, FiZap, FiUser, FiCpu, FiActivity, FiShield, FiPlay
} from "react-icons/fi";
import { proyectosService, tareasService, emailService } from "../services/database";
import { facturasService, contratosService } from "../services/facturacion";
import { documentosService } from "../services/supabase";
import { getCachedProjects, getCachedTasks, getCachedInvoices, getCachedContracts, getCachedDocuments } from "../utils/routeCache";
import { aiService } from "../services/ai";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";
import ExpandableCard from "../components/ExpandableCard";
import GenerarDocumentoButton from "../components/GenerarDocumentoButton";
import ProjectUnifiedPanel from "../components/ProjectUnifiedPanel";
import { getFaseColor, getFaseLabel, getEstadoLabel, getPublicProyectoUrl, copyToClipboard } from "../utils/proyectoHelpers";

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }

const TabPanel = ({ children, value, index, ...rest }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} {...rest} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
    {value === index && <>{children}</>}
  </Box>
);

export default function ProyectoInterno() {
  const { id } = useParams<{ id: string }>();
  const idLimpio = String(id || '').trim();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [panelAbierto, setPanelAbierto] = useState(false);

  useEffect(() => {
    if (!loading && !error && proyecto) {
      setPanelAbierto(true);
    }
  }, [loading, error, proyecto]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelAbierto) setPanelAbierto(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [panelAbierto]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({ open: false, message: '', severity: 'success' });

  const [estrategia, setEstrategia] = useState<any>({ objetivo: '', publico_objetivo: '', diferenciador: '', cronograma: '' });
  const [canales, setCanales] = useState<any>({ redes: false, ads: false, email: false, seo: false });
  const [tareas, setTareas] = useState<any[]>([]);
  const [facturacion, setFacturacion] = useState<any>({ cuotas: [], monto_total: 0, monto_pagado: 0, estado: 'pendiente' });
  const [facturasProyecto, setFacturasProyecto] = useState<any[]>([]);
  const [contratosProyecto, setContratosProyecto] = useState<any[]>([]);
  const [documentosProyecto, setDocumentosProyecto] = useState<any[]>([]);
  const [editEstrategia, setEditEstrategia] = useState(false);
  const [bypassNotFound, setBypassNotFound] = useState(false);

  useEffect(() => {
    if (error || !proyecto) {
      if (!loading) setBypassNotFound(true);
    }
  }, [error, proyecto, loading]);

  const load = async () => {
    if (!idLimpio) {
      setError('Falta el identificador del proyecto.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [proyectosRaw, t, f, c, d] = await Promise.all([
        (async () => {
          try { return await proyectosService.getAll(); } catch (e) { return []; }
        })(),
        (async () => {
          try { return await tareasService.getAll(); } catch (e) { return []; }
        })(),
        (async () => {
          try { return await facturasService.getAll(); } catch (e) { return []; }
        })(),
        (async () => {
          try { return await contratosService.getAll(); } catch (e) { return []; }
        })(),
        (async () => {
          try { return await documentosService.getAll(); } catch (e) { return []; }
        })(),
      ]);
      const proyectoAny = (proyectosRaw || []).find((proj: any) => String(proj.id) === String(idLimpio) || String((proj as any).codigo || '') === String(idLimpio)) || null;
      if (!proyectoAny && (proyectosRaw || []).length > 0) {
        console.warn('[PROYECTO DEBUG] No match for', idLimpio, 'available ids/codigos:', (proyectosRaw || []).map((p: any) => `${p.id}/${(p as any).codigo}`).join(', '));
      }
      console.log('[PROYECTO DEBUG] idLimpio=', idLimpio, 'proyectosRaw count=', (proyectosRaw || []).length, 'found=', !!proyectoAny);
      setProyecto(proyectoAny);
      setEstrategia((proyectoAny?.estrategia || { objetivo: '', publico_objetivo: '', diferenciador: '', cronograma: '' }));
      setCanales((proyectoAny?.canales || { redes: false, ads: false, email: false, seo: false }));
      setFacturacion((proyectoAny?.facturacion_detalle || { cuotas: [], monto_total: 0, monto_pagado: 0, estado: 'pendiente' }));
      setTareas((t || []).filter((t: any) => String(t.proyecto_id) === String(idLimpio)));
      setFacturasProyecto((f || []).filter((x: any) => String(x.proyecto_id) === String(idLimpio)));
      setContratosProyecto((c || []).filter((x: any) => String(x.proyecto_id) === String(idLimpio)));
      setDocumentosProyecto((d || []).filter((x: any) => String(x.entidad_id || x.proyecto_id || '') === String(idLimpio)));
    } catch (err: any) {
      setError('No pudimos cargar este proyecto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [idLimpio]);

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
        <Box sx={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite", mb: 2 }} />
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
            <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>id: {idLimpio}</Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!proyecto) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", p: 3 }}>
        <Alert severity="warning" sx={{ p: 3, maxWidth: 'sm', width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Proyecto vacío</Typography>
          <Typography variant="body2" color="text.secondary">Se cargó la ruta, pero el proyecto viene sin datos completos.</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>id: {idLimpio}</Typography>
        </Alert>
      </Box>
    );
  }

  // Fallback final: si llegamos aquí, el proyecto debería existir
  if (!proyecto?.nombre) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", p: 3 }}>
        <Alert severity="info" sx={{ p: 3, maxWidth: 'sm', width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Proyecto incompleto</Typography>
          <Typography variant="body2" color="text.secondary">El proyecto cargó pero falta el nombre. Revisa los datos en Supabase.</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>id: {idLimpio}</Typography>
        </Alert>
      </Box>
    );
  }

  const presupuesto = Number(proyecto.presupuesto || 0);
  const pagado = Number((facturacion as any)?.monto_pagado || proyecto.monto_pagado || 0);
  const saldo = Math.max(presupuesto - pagado, 0);
  const progreso = Math.min(Math.max(proyecto.progreso || 0, 0), 100);

  const tareasProyecto = (tareas || []).filter((t: any) => t.proyecto_id === idLimpio || t.proyectoId === idLimpio || t.proyecto === idLimpio);
  const facturacionProyecto = (facturacion as any) || proyecto.facturacion_detalle || {};
  const estrategiaProyecto = estrategia || proyecto.estrategia || {};
  const canalesProyecto = canales || proyecto.canales || {};
  const cronogramaProyecto = Array.isArray((proyecto as any).cronograma) ? (proyecto as any).cronograma : [];
  const credencialesProyecto = Array.isArray((proyecto as any).credenciales) ? (proyecto as any).credenciales : [];

  const handleCompartirPortal = async () => {
    if (!proyecto?.id) return;
    const url = getPublicProyectoUrl(proyecto.id);
    const ok = await copyToClipboard(url);
    setSnackbar({ open: true, message: ok ? '¡Enlace del portal copiado al portapapeles!' : 'No se pudo copiar el enlace.', severity: ok ? 'success' : 'error' });
  };

  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}><strong>Presupuesto:</strong> ${presupuesto.toLocaleString()}</Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: "uppercase", fontWeight: "bold" }}>Progreso General</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ flexGrow: 1 }}><LinearProgress variant="determinate" value={progreso} sx={{ height: 8, borderRadius: 4 }} /></Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "secondary.main", minWidth: "3ch" }}>{progreso}%</Typography>
              </Box>
              <SafeChip label={getEstadoLabel(proyecto.estado)} sx={{ bgcolor: proyecto.estado === "en_progreso" ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.05)", color: proyecto.estado === "en_progreso" ? "#00c853" : "text.primary", fontWeight: "bold" }} />
              <Box sx={{ mt: 1.5, textAlign: { xs: 'left', md: 'right' }, display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                <GenerarDocumentoButton
                  entidadTipo="proyecto"
                  entidadId={String(proyecto.id)}
                  tipo="pdf"
                  titulo={`Proyecto - ${proyecto.nombre}`}
                  usuario="Juan José"
                  domElement={document.body}
                  label="Documento"
                  variant="outlined"
                  size="small"
                />
                {(proyecto as any).contrato_url && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiDownload size={16} />}
                    href={(proyecto as any).contrato_url}
                    target="_blank"
                  >
                    Contrato
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FiCpu size={16} />}
                  sx={{ background: 'linear-gradient(135deg, #7c4dff, #2196f3)', color: '#fff', fontWeight: 'bold' }}
                  onClick={async () => {
                    try {
                      const brief = null;
                      window.dispatchEvent(new CustomEvent('open-ai-chat'));
                      window.dispatchEvent(new CustomEvent('open-assistant', { detail: { brief } }));
                    } catch (e) {
                      console.error('Error generando brief:', e);
                    }
                  }}
                >
                  Brief IA
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FiLayers size={16} />}
                  onClick={() => setPanelAbierto(true)}
                >
                  Panel inteligente
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <ProjectUnifiedPanel open={panelAbierto} onClose={() => setPanelAbierto(false)} proyecto={proyecto} />

        {/* Acceso directo al panel en mobile */}
        <Box sx={{ mt: 2, display: { xs: 'block', md: 'none' } }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<FiLayers size={16} />}
            onClick={() => setPanelAbierto(true)}
          >
            Ver panel del proyecto
          </Button>
        </Box>

        {/* Secciones compactas expandibles */}
        <Stack spacing={2} sx={{ mt: 3 }}>
          <ExpandableCard title="Estrategia" icon={<FiActivity size={16} />} summary={estrategiaProyecto?.objetivo || 'Sin objetivo definido'}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Estrategia del Proyecto</Typography>
              {!editEstrategia ? (
                <Button startIcon={<FiEdit2 size={14} />} size="small" onClick={() => setEditEstrategia(true)}>Editar</Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={handleSaveEstrategia}>Guardar</Button>
                  <Button size="small" onClick={() => setEditEstrategia(false)}>Cancelar</Button>
                </Stack>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="Objetivo principal" fullWidth multiline rows={2} size="small" disabled={!editEstrategia} value={(estrategiaProyecto as any)?.objetivo || ""} onChange={(e) => setEstrategia({ ...estrategiaProyecto, objetivo: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Público objetivo" fullWidth size="small" disabled={!editEstrategia} value={(estrategiaProyecto as any)?.publico_objetivo || ""} onChange={(e) => setEstrategia({ ...estrategiaProyecto, publico_objetivo: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Diferenciador" fullWidth size="small" disabled={!editEstrategia} value={(estrategiaProyecto as any)?.diferenciador || ""} onChange={(e) => setEstrategia({ ...estrategiaProyecto, diferenciador: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField label="Cronograma" fullWidth multiline rows={3} size="small" disabled={!editEstrategia} value={(estrategiaProyecto as any)?.cronograma || ""} onChange={(e) => setEstrategia({ ...estrategiaProyecto, cronograma: e.target.value })} helperText="Hitos mensuales y entregables clave" /></Grid>
            </Grid>
          </ExpandableCard>

          <ExpandableCard title="Canales" icon={<FiMail size={16} />} summary={Object.entries(canalesProyecto as any).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Sin activos'}>
            <Grid container spacing={2}>
              {["redes", "ads", "email", "seo", "whatsapp"].map((canal) => {
                const activo = !!(canalesProyecto as any)[canal];
                return (
                  <Grid item xs={6} md={2} key={canal}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", borderColor: activo ? "primary.main" : "divider", bgcolor: activo ? "rgba(233,30,99,0.04)" : "background.paper" }}>
                      <Typography variant="caption" sx={{ textTransform: "capitalize", fontWeight: 700 }}>{canal}</Typography>
                      <Box sx={{ mt: 0.5 }}><SafeChip label={activo ? "Activo" : "Inactivo"} size="small" color={activo ? "success" : "default"} /></Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </ExpandableCard>

          <ExpandableCard title="Cronograma" icon={<FiCalendar size={16} />} summary={`${cronogramaProyecto.length} hitos`}>
            {cronogramaProyecto.length > 0 ? (
              <Grid container spacing={2}>
                {cronogramaProyecto.map((hito: any, idx: number) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{hito.fecha || 'Sin fecha'}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{hito.titulo || `Hito ${idx + 1}`}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{hito.descripcion || ''}</Typography>
                      <SafeChip label={hito.estado || 'Pendiente'} size="small" color={hito.estado === 'Completado' ? 'success' : hito.estado === 'En progreso' ? 'warning' : 'default'} sx={{ mt: 1 }} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">Sin cronograma definido. Generalo automáticamente con IA.</Alert>
            )}
          </ExpandableCard>

          <ExpandableCard title="Tareas" icon={<FiPlay size={16} />} summary={`${tareas.length} tareas`}>
            {tareasProyecto.length === 0 ? (
              <Alert severity="info">Sin tareas registradas para este proyecto.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {tareasProyecto.slice(0, 50).map((tarea: any) => (
                  <Paper key={tarea.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Box sx={{ color: tarea.estado === 'Completada' ? '#00c853' : tarea.estado === 'En progreso' ? '#ff9100' : 'text.secondary' }}>
                        {tarea.estado === 'Completada' ? <FiCheckCircle /> : <FiClock />}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>{tarea.titulo}</Typography>
                      <SafeChip label={tarea.estado || 'Pendiente'} size="small" color={tarea.estado === 'Completada' ? 'success' : tarea.estado === 'En progreso' ? 'warning' : 'default'} sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Vence: {tarea.fecha} • Prioridad: {tarea.prioridad || 'Media'}</Typography>
                    <LinearProgress variant="determinate" value={tarea.estado === 'Completada' ? 100 : tarea.estado === 'En progreso' ? 50 : 0} sx={{ height: 6, borderRadius: 3 }} />
                  </Paper>
                ))}
              </Stack>
            )}
          </ExpandableCard>

          <ExpandableCard title="Documentos" icon={<FiFileText size={16} />} summary={`${documentosProyecto.length} archivos`}>
            {documentosProyecto.length > 0 ? (
              <Stack spacing={1.5}>
                {documentosProyecto.map((doc: any) => (
                  <Paper key={doc.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{doc.nombre || doc.titulo || 'Documento'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block', mb: 1 }}>{doc.url}</Typography>
                    {doc.url && <Button size="small" variant="contained" startIcon={<FiDownload size={14} />} href={doc.url} target="_blank">Descargar</Button>}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Sin documentos adjuntos.</Alert>
            )}
          </ExpandableCard>

          <ExpandableCard title="Facturación" icon={<span style={{fontWeight: 900}}>$</span>} summary={`${(facturacionProyecto as any)?.estado === 'pagada' ? 'Pagada' : (facturacionProyecto as any)?.estado || 'pendiente'}`}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Presupuesto</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>${presupuesto.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Pagado</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: "#00c853" }}>${pagado.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Saldo</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: saldo > 0 ? "#ff9100" : "#00c853" }}>${saldo.toLocaleString()}</Typography></Paper></Grid>
              <Grid item xs={6} md={3}><Paper sx={{ p: 2, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Estado</Typography><SafeChip label={(facturacionProyecto as any)?.estado || "pendiente"} size="small" sx={{ mt: 1 }} /></Paper></Grid>
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Facturas Emitidas</Typography>
                  <Button variant="outlined" size="small" component={Link} to={`/facturacion?proyecto=${proyecto.id}`}>Emitir Factura</Button>
                </Stack>
                {facturasProyecto.length === 0 ? (
                  <Alert severity="info">No hay facturas emitidas para este proyecto.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {facturasProyecto.map((factura: any) => (
                      <Paper key={factura.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <FiFileText color="#ff5722" size={20} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{factura.numero || `FAC-${factura.id.slice(0,8)}`}</Typography>
                            <Typography variant="caption" color="text.secondary">Fecha: {factura.fecha_emision || '—'} • Tipo: {factura.tipo || 'servicio'}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>${Number(factura.total || 0).toLocaleString()}</Typography>
                            <SafeChip label={factura.estado} size="small" color={factura.estado === 'pagada' ? 'success' : factura.estado === 'borrador' ? 'default' : 'warning'} />
                          </Box>
                        </Stack>
                        {factura.pdf_url && (
                          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" href={factura.pdf_url} target="_blank">Ver PDF</Button>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Plan de Cuotas</Typography>
                {(facturacionProyecto as any)?.cuotas?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {(facturacionProyecto as any).cuotas.map((cuota: any, idx: number) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 2, borderColor: 'divider', borderRadius: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <span style={{fontWeight: 900, color: cuota.pagada ? '#00c853' : '#ff9100'}}>$</span>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>Cuota {idx + 1}</Typography>
                          <SafeChip label={cuota.pagada ? 'Pagada' : 'Pendiente'} size="small" color={cuota.pagada ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>${Number(cuota.monto || 0).toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Vence: {cuota.fecha || '—'}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">Sin cuotas registradas.</Alert>
                )}
              </Grid>
            </Grid>
          </ExpandableCard>

          <ExpandableCard title="Contratos" icon={<FiShield size={16} />} summary={`${contratosProyecto.length} contratos`}>
            {contratosProyecto.length === 0 ? (
              <Alert severity="info">Sin contratos asociados.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {contratosProyecto.map((c: any) => (
                  <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.titulo || c.nombre || 'Contrato'}</Typography>
                    <Typography variant="caption" color="text.secondary">Estado: {c.estado || 'Sin estado'} {c.fecha_inicio ? `• ${c.fecha_inicio}` : ''}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </ExpandableCard>

          <ExpandableCard title="Brief" icon={<FiCpu size={16} />} summary="Brief y contexto IA">
            <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{typeof proyecto.brief === 'string' ? proyecto.brief : JSON.stringify(proyecto.brief || {}, null, 2) || 'Sin brief generado.'}</Typography>
            </Paper>
          </ExpandableCard>
        </Stack>
      </Container>
    </Box>
  );
}
