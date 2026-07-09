import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { 
  Box, Typography, Container, Paper, Grid, LinearProgress, 
  Chip, Card, CardContent, CircularProgress, Alert, Stack, 
  Divider, Button, List, ListItem, ListItemIcon, ListItemText,
  ThemeProvider, createTheme, CssBaseline
} from "@mui/material";
import { 
  FiBriefcase, FiCheckCircle, FiClock, FiLayers, FiLink, 
  FiCalendar, FiPlay, FiSmartphone, FiTrendingUp, FiActivity, FiStar 
} from "react-icons/fi";
import { proyectosService } from "../services/database";
import type { Proyecto } from "../types/crm";
import SafeChip from "../components/SafeChip";

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

export default function PublicProyecto() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear un tema premium exclusivo para clientes (Dark Mode)
  const clientTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#E91E63", // Magenta Deseo Digital
        dark: "#C2185B",
        contrastText: "#fff",
      },
      secondary: {
        main: "#FFD700", // Dorado Deseo Digital
        dark: "#F9A825",
        contrastText: "#111",
      },
      background: {
        default: "#090d16",
        paper: "#111726",
      },
      text: {
        primary: "#f8fafc",
        secondary: "#94a3b8",
      },
      divider: "rgba(255, 255, 255, 0.08)",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      h4: { fontWeight: 800 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
  });

  useEffect(() => {
    const fetchProyecto = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await proyectosService.getById(id);
        setProyecto(data as any);
      } catch (err: any) {
        console.error("Error al cargar proyecto público:", err);
        setError("No pudimos validar el Magic Link de este proyecto. Confirma el enlace con tu asesor estratégico.");
      } finally {
        setLoading(false);
      }
    };

    fetchProyecto();
  }, [id]);

  if (loading) {
    return (
      <ThemeProvider theme={clientTheme}>
        <CssBaseline />
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "background.default" }}>
          <CircularProgress color="primary" sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">Accediendo a tu Portal de Cliente...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !proyecto) {
    return (
      <ThemeProvider theme={clientTheme}>
        <CssBaseline />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", p: 3, bgcolor: "background.default" }}>
          <Container maxWidth="sm">
            <Paper sx={{ p: 4, textAlign: "center", border: "1px solid rgba(233, 30, 99, 0.15)", boxShadow: "0 8px 32px rgba(233, 30, 99, 0.1)" }}>
              <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: "bold" }}>⚠️ Enlace Invalido</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || "El proyecto solicitado no existe o ha sido archivado."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: "block" }}>
                Si necesitas ayuda, comunícate con Juan José Álvarez al <strong>320 369 8476</strong>
              </Typography>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  // Filtrar tareas relevantes para clientes (reels a grabar, hitos principales)
  const tareasCliente = proyecto.tareas || [];

  return (
    <ThemeProvider theme={clientTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          
          {/* Header Portal Cliente */}
          <Paper sx={{ 
            p: { xs: 3, md: 5 }, 
            mb: 4, 
            background: "linear-gradient(135deg, rgba(233, 30, 99, 0.08) 0%, rgba(156, 39, 176, 0.08) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: 4
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <SafeChip 
                    label="Magic Link Activo" 
                    size="small" 
                    sx={{ bgcolor: "rgba(0, 229, 255, 0.12)", color: "#00e5ff", fontWeight: "bold" }} 
                  />
                  <SafeChip 
                    label={getFaseLabel(proyecto.faseAdministrativa)} 
                    size="small" 
                    sx={{ bgcolor: `${getFaseColor(proyecto.faseAdministrativa)}20`, color: getFaseColor(proyecto.faseAdministrativa), fontWeight: "bold" }} 
                  />
                </Stack>
                
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.5 }}>
                  {proyecto.nombre}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {proyecto.descripcion || "Tu estrategia de posicionamiento digital y marketing estratégico."}
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
                        value={proyecto.progreso} 
                        sx={{ height: 10, borderRadius: 5, bgcolor: "rgba(255,255,255,0.05)" }} 
                      />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                      {proyecto.progreso}%
                    </Typography>
                  </Box>
                  <SafeChip 
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
            
            {/* Columna Izquierda: Recursos y Tareas */}
            <Grid item xs={12} md={7}>
              
              {/* Checklist de Onboarding */}
              {proyecto.faseAdministrativa === 'onboarding' && (
                <Paper sx={{ p: 4, mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, color: "secondary.main" }}>
                    <FiLayers /> Checklist de Inicio (Onboarding)
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Por favor confirma con tu asesor comercial el estado de tus entregables iniciales para habilitar el flujo completo:
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
                      <SafeChip 
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
                      <SafeChip 
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
                      <SafeChip 
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
                  <FiLink /> Carpeta y Recursos del Cliente
                </Typography>
                <Divider sx={{ mb: 2.5 }} />
                
                {proyecto.recursos && proyecto.recursos.length > 0 ? (
                  <Grid container spacing={2}>
                    {proyecto.recursos.map((rec: any, idx: number) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Card variant="outlined" sx={{ 
                          borderColor: "rgba(255,255,255,0.06)", 
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
                    Tu asesor de marca cargará tus accesos a Drive y cronogramas de Sheets próximamente.
                  </Typography>
                )}
              </Paper>

              {/* Tareas del Proyecto */}
              <Paper sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                  <FiActivity /> Plan de Acción e Hitos
                </Typography>
                <Divider sx={{ mb: 2.5 }} />

                {tareasCliente.length > 0 ? (
                  <List>
                    {tareasCliente.map((tarea: any, idx: number) => (
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
                          secondary={`Asignado a: ${tarea.responsable || "Equipo estratégico"} • Límite: ${tarea.fechaLimite || "Sin fecha"}`} 
                          primaryTypographyProps={{ sx: { 
                            fontWeight: "bold", 
                            textDecoration: tarea.completada ? "line-through" : "none",
                            color: tarea.completada ? "text.secondary" : "text.primary"
                          } }}
                        />
                        <SafeChip 
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
                    Estamos diseñando las fases tácticas para este mes comercial.
                  </Typography>
                )}
              </Paper>

            </Grid>

            {/* Columna Derecha: Plan de Contenido */}
            <Grid item xs={12} md={5}>
              
              {/* Plan de Redes Sociales (Reels y Stories) */}
              <Paper sx={{ p: 4, background: "linear-gradient(180deg, #111726 0%, #0d1220 100%)", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, color: "secondary.main" }}>
                  <FiSmartphone /> Plan de Contenidos Activo
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Estrategia táctica de marca para el mes en curso:
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
                        <Box key={idx} sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.02)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.04)" }}>
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
                    El plan de reels se activará una vez completada la fase de Onboarding.
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
                    Historias y dinámicas en etapa de planeación comercial.
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
                        <Box key={idx} sx={{ p: 1.5, bgcolor: "rgba(233, 30, 99, 0.04)", borderRadius: 1.5, border: "1px solid rgba(233, 30, 99, 0.1)" }}>
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
          
          {/* Footer del portal */}
          <Box sx={{ mt: 6, py: 4, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Typography variant="body2" color="text.secondary">
              © 2026 DESEO DIGITAL • Agencia de Marketing & Estrategia Digital de Elite
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Este portal se actualiza automáticamente con el avance del equipo técnico estratégico.
            </Typography>
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}
