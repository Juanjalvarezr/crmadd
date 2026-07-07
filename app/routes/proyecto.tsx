import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Box, Typography, Container, Paper, Grid, LinearProgress,
  Chip, Card, CardContent, CircularProgress, Alert, Stack,
  Divider, Button, List, ListItem, ListItemIcon, ListItemText
} from "@mui/material";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiLayers, FiLink,
  FiCalendar, FiPlay, FiSmartphone, FiTrendingUp, FiActivity, FiStar
} from "react-icons/fi";
import { proyectosService } from "../services/database";
import type { Proyecto } from "../types/crm";

// Colores de fase administrativa
const getFaseColor = (fase: string) => {
  const colors: Record<string, string> = {
    propuesta: "#00b0ff",
    contrato: "#9c27b0",
    onboarding: "#ff9100",
    operacion: "#00c853",
    capacitacion: "#00e5ff",
    renovacion: "#e91e63",
  };
  return colors[fase] || "#9e9e9e";
};

// Traducciones legibles
const getFaseLabel = (fase: string) => {
  const labels: Record<string, string> = {
    propuesta: "Propuesta Comercial",
    contrato: "Contrato Firmado",
    onboarding: "Onboarding y Setup",
    operacion: "Operación Activa",
    capacitacion: "Capacitación",
    renovacion: "Renovación Mensual",
  };
  return labels[fase] || fase;
};

const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    planificacion: "En Planificación",
    en_progreso: "En Progreso Activo",
    pausado: "En Pausa Temporal",
    completado: "Completado Exitosamente",
    cancelado: "Cancelado",
  };
  return labels[estado] || estado;
};

export default function ProyectoInterno() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProyecto = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await proyectosService.getById(id);
        setProyecto(data as any);
      } catch (err: any) {
        console.error("Error al cargar proyecto:", err);
        setError("No pudimos cargar este proyecto. Verifica el identificador o intenta más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchProyecto();
  }, [id]);

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
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
              Proyecto no encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error || "El proyecto solicitado no existe o no está disponible."}
            </Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  const tareasCliente = proyecto.tareas || [];

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="lg">
        
        {/* Header Proyecto Interno */}
        <Paper sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          background: "linear-gradient(135deg, rgba(233, 30, 99, 0.06) 0%, rgba(156, 39, 176, 0.06) 100%)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Chip
                  label={getFaseLabel(proyecto.faseAdministrativa)}
                  size="small"
                  sx={{ bgcolor: `${getFaseColor(proyecto.faseAdministrativa)}18`, color: getFaseColor(proyecto.faseAdministrativa), fontWeight: "bold" }}
                />
                <Chip
                  label={getEstadoLabel(proyecto.estado)}
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.5 }}>
                {proyecto.nombre}
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {proyecto.descripcion || "Estrategia de posicionamiento digital y marketing estratégico."}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} color="text.secondary" fontSize="0.9rem">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FiBriefcase color="#E91E63" />
                  <strong>Cliente:</strong> {proyecto.clienteNombre}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FiClock color="#E91E63" />
                  <strong>Fecha Entrega:</strong> {proyecto.fechaFin}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FiCalendar color="#E91E63" />
                  <strong>Inicio:</strong> {proyecto.fechaInicio}
                </Box>
              </Stack>
            </Grid>

            {/* Progress Circle & Status */}
            <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", md: "center" } }}>
              <Box sx={{ width: "100%", maxWidth: "250px", textAlign: "center" }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: "uppercase", fontWeight: "bold" }}>
                  Progreso General
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(proyecto.progreso, 0), 100)}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", color: "secondary.main", minWidth: "3ch" }}>
                    {proyecto.progreso}%
                  </Typography>
                </Box>
                <Chip
                  label={getEstadoLabel(proyecto.estado)}
                  sx={{
                    bgcolor: proyecto.estado === "en_progreso" ? "rgba(0, 200, 83, 0.12)" : "rgba(255, 255, 255, 0.05)",
                    color: proyecto.estado === "en_progreso" ? "#00c853" : "text.primary",
                    fontWeight: "bold"
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Grid de contenido */}
        <Grid container spacing={4}>
          
          {/* Columna Izquierda: Checklist, Recursos y Tareas */}
          <Grid item xs={12} md={7}>
            
            {/* Checklist de Onboarding */}
            {proyecto.faseAdministrativa === 'onboarding' && (
              <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, color: "secondary.main" }}>
                  <FiLayers /> Checklist de Inicio (Onboarding)
                </Typography>
                <Divider sx={{ mb: 2.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Confirmá con el asesor comercial el estado de los entregables iniciales para habilitar el flujo completo:
                </Typography>
                
                <List>
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemIcon sx={{ color: proyecto.onboardingChecklist?.anticipo_50 ? "success.main" : "text.secondary" }}>
                      <FiCheckCircle style={{ fill: proyecto.onboardingChecklist?.anticipo_50 ? "rgba(0, 200, 83, 0.2)" : "none" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Confirmación del Anticipo 50%"
                      secondary="Obligatorio para iniciar operaciones comerciales"
                      primaryTypographyProps={{ sx: { fontWeight: proyecto.onboardingChecklist?.anticipo_50 ? "bold" : "normal" } }}
                    />
                    <Chip
                      label={proyecto.onboardingChecklist?.anticipo_50 ? "Confirmado" : "Pendiente"}
                      size="small"
                      color={proyecto.onboardingChecklist?.anticipo_50 ? "success" : "warning"}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemIcon sx={{ color: proyecto.onboardingChecklist?.analisis_presencia ? "success.main" : "text.secondary" }}>
                      <FiCheckCircle style={{ fill: proyecto.onboardingChecklist?.analisis_presencia ? "rgba(0, 200, 83, 0.2)" : "none" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Análisis de Presencia Digital"
                      secondary="Auditoría de marca y redes sociales realizada"
                      primaryTypographyProps={{ sx: { fontWeight: proyecto.onboardingChecklist?.analisis_presencia ? "bold" : "normal" } }}
                    />
                    <Chip
                      label={proyecto.onboardingChecklist?.analisis_presencia ? "Listo" : "En proceso"}
                      size="small"
                      color={proyecto.onboardingChecklist?.analisis_presencia ? "success" : "default"}
                    />
                  </ListItem>

                  <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemIcon sx={{ color: proyecto.onboardingChecklist?.solicitud_accesos ? "success.main" : "text.secondary" }}>
                      <FiCheckCircle style={{ fill: proyecto.onboardingChecklist?.solicitud_accesos ? "rgba(0, 200, 83, 0.2)" : "none" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Entrega de Accesos y Claves"
                      secondary="Facebook Business, Instagram, etc."
                      primaryTypographyProps={{ sx: { fontWeight: proyecto.onboardingChecklist?.solicitud_accesos ? "bold" : "normal" } }}
                    />
                    <Chip
                      label={proyecto.onboardingChecklist?.solicitud_accesos ? "Recibidos" : "Pendiente"}
                      size="small"
                      color={proyecto.onboardingChecklist?.solicitud_accesos ? "success" : "warning"}
                    />
                  </ListItem>
                </List>
              </Paper>
            )}

            {/* Recursos Estratégicos */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                <FiLink /> Carpeta y Recursos del Proyecto
              </Typography>
              <Divider sx={{ mb: 2.5 }} />
              
              {proyecto.recursos && proyecto.recursos.length > 0 ? (
                <Grid container spacing={2}>
                  {proyecto.recursos.map((rec, idx: number) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Card variant="outlined" sx={{ 
                        borderColor: "divider", 
                        "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
                        transition: "all 0.2s"
                      }}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, bgcolor: "rgba(233,30,99,0.1)", color: "primary.main", borderRadius: 1.5, display: "flex" }}>
                              <FiBriefcase size={18} />
                            </Box>
                            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: "bold" }}>
                                {rec.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                                {rec.tipo}
                              </Typography>
                            </Box>
                            <Button 
                              size="small" 
                              href={rec.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              variant="contained"
                              color="primary"
                              sx={{ minWidth: 40, p: 1 }}
                            >
                              Ir
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  No hay recursos cargados para este proyecto.
                </Typography>
              )}
            </Paper>

            {/* Tareas del Proyecto */}
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                <FiActivity /> Cronograma y Tareas
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {tareasCliente.length > 0 ? (
                <List>
                  {tareasCliente.map((tarea, idx: number) => (
                    <ListItem 
                      key={idx} 
                      sx={{ 
                        py: 1.5, 
                        px: 2, 
                        mb: 1.5, 
                        bgcolor: "rgba(255,255,255,0.02)", 
                        borderRadius: 2,
                        borderLeft: `4px solid ${tarea.completada ? "#00c853" : "#ff9100"}`
                      }}
                    >
                      <ListItemIcon sx={{ color: tarea.completada ? "success.main" : "warning.main" }}>
                        <FiCheckCircle style={{ fill: tarea.completada ? "rgba(0, 200, 83, 0.2)" : "none" }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={tarea.nombre} 
                        secondary={`Responsable: ${tarea.responsable || "Equipo interno"} • Límite: ${tarea.fechaLimite || "Sin fecha"}`} 
                        primaryTypographyProps={{ sx: { 
                          fontWeight: "bold", 
                          textDecoration: tarea.completada ? "line-through" : "none",
                          color: tarea.completada ? "text.secondary" : "text.primary"
                        } }}
                      />
                      <Chip 
                        label={tarea.completada ? "Completado" : "En Progreso"} 
                        size="small" 
                        color={tarea.completada ? "success" : "warning"} 
                        variant="outlined" 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  No hay tareas registradas para este proyecto.
                </Typography>
              )}
            </Paper>

          </Grid>

          {/* Columna Derecha: Plan de Contenido */}
          <Grid item xs={12} md={5}>
            
            {/* Plan de Redes Sociales (Reels y Stories) */}
            <Paper sx={{ p: 4, background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid", borderColor: "divider" }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, color: "secondary.main" }}>
                <FiSmartphone /> Plan de Contenidos
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Estrategia táctica y piezas confirmadas para el periodo actual:
              </Typography>
              
              <Divider sx={{ mb: 3 }} />

              {/* Reels */}
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                🎬 Reels Planificados
              </Typography>
              
              {proyecto.planContenido?.reels && proyecto.planContenido.reels.length > 0 ? (
                <Stack spacing={2} sx={{ mb: 4 }}>
                  {proyecto.planContenido.reels.map((reel: any, idx: number) => {
                    const text = typeof reel === 'object' ? reel.texto : reel;
                    return (
                      <Box key={idx} sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.02)", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                          Reel #{idx + 1}:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                          {text}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 4 }}>
                  El plan de reels se definirá según la fase del proyecto.
                </Typography>
              )}

              {/* Stories */}
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                ⭐ Stories y Dinámicas
              </Typography>

              {proyecto.planContenido?.stories && proyecto.planContenido.stories.length > 0 ? (
                <Stack spacing={1.5} sx={{ mb: 4 }}>
                  {proyecto.planContenido.stories.map((story: any, idx: number) => {
                    const text = typeof story === 'object' ? story.texto : story;
                    return (
                      <Box key={idx} sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.01)", borderRadius: 1.5, borderLeft: "3px solid #ff9100" }}>
                        <Typography variant="body2" color="text.primary">
                          {text}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 4 }}>
                  Historias y dinámicas en etapa de planeación.
                </Typography>
              )}

              {/* Pauta / ADS */}
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                📈 Pauta Publicitaria (Ads)
              </Typography>

              {proyecto.planContenido?.pauta && proyecto.planContenido.pauta.length > 0 ? (
                <Stack spacing={1.5}>
                  {proyecto.planContenido.pauta.map((ad: any, idx: number) => {
                    const text = typeof ad === 'object' ? ad.texto : ad;
                    return (
                      <Box key={idx} sx={{ p: 1.5, bgcolor: "rgba(233, 30, 99, 0.04)", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "primary.main" }}>
                          Estrategia de Anuncio #{idx + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {text}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Estrategia de inversión Ads en diseño comercial.
                </Typography>
              )}

            </Paper>

          </Grid>

        </Grid>
        
      </Container>
    </Box>
  );
}
