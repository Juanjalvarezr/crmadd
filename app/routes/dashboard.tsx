import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Alert,
  Button,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiTarget,
  FiActivity,
  FiClock,
} from "react-icons/fi";
import { proyectosService, clientesService, oportunidadesService, tareasService, transaccionesService } from "../services/database";
import { StatCard } from "../components/StatCard";

const initialState = {
  proyectos: [],
  clientes: [],
  oportunidades: [],
  tareas: [],
  transacciones: [],
  isUsingMockData: false,
};

export default function Dashboard() {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClientes: 0,
    proyectosActivos: 0,
    valorPipeline: 0,
    totalPresupuestado: 0,
    totalRecaudado: 0,
    tareasPendientes: 0,
    totalTransacciones: 0,
    montoTransacciones: 0,
  });
  const [presentationMode, setPresentationMode] = useState(false);
  const todayLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const theme = useTheme();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPresentationMode(detail === "on");
    };
    window.addEventListener("presentation-mode-changed", handler);
    if (typeof window !== "undefined") {
      setPresentationMode(localStorage.getItem("presentation_mode") === "true");
    }
    return () => window.removeEventListener("presentation-mode-changed", handler);
  }, []);

  const calculateStats = useCallback((source: any) => {
    const proyectos = Array.isArray(source.proyectos) ? source.proyectos : [];
    const clientes = Array.isArray(source.clientes) ? source.clientes : [];
    const oportunidades = Array.isArray(source.oportunidades) ? source.oportunidades : [];
    const tareas = Array.isArray(source.tareas) ? source.tareas : [];
    const transacciones = Array.isArray(source.transacciones) ? source.transacciones : [];

    const totalPresupuestado = proyectos.reduce(
      (acc: number, current: any) => acc + (Number(current.presupuesto) || 0),
      0
    );
    const totalRecaudado = proyectos.reduce(
      (acc: number, current: any) => acc + (Number(current.montoPagado) || 0),
      0
    );
    const valorPipeline = oportunidades
      .filter(
        (oportunidad: any) =>
          oportunidad.estado === "Abierta" ||
          oportunidad.etapa === "Prospección" ||
          oportunidad.etapa === "Propuesta"
      )
      .reduce((acc: number, current: any) => acc + (Number(current.valor) || 0), 0);

    const montoTransacciones = transacciones.reduce(
      (acc: number, current: any) => acc + (Number(current.monto) || Number(current.valor) || 0),
      0
    );

    setStats({
      totalClientes: clientes.length,
      proyectosActivos: proyectos.filter(
        (proyecto: any) =>
          proyecto.estado === "en_progreso" || proyecto.estado === "planificacion"
      ).length,
      valorPipeline,
      totalPresupuestado,
      totalRecaudado,
      tareasPendientes: Array.isArray(tareas)
        ? tareas.filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada").length
        : 0,
      totalTransacciones: transacciones.length,
      montoTransacciones,
    });
  }, [setStats]);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [proyectos, clientes, oportunidades, tareas, transacciones] =
        await Promise.all([
          proyectosService.getAll(),
          clientesService.getAll(),
          oportunidadesService.getAll(),
          tareasService.getAll(),
          transaccionesService.getAll(),
        ]);

      const source = {
        proyectos,
        clientes,
        oportunidades,
        tareas,
        transacciones,
      };

      setData({
        proyectos,
        clientes,
        oportunidades,
        tareas,
        transacciones,
        isUsingMockData: false,
      });

      calculateStats(source);
    } catch (err: any) {
      setError("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const proyectosActivos = (data.proyectos || [])
    .filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion")
    .slice(0, 6);

  const proximasTareas = (data.tareas || [])
    .filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada")
    .sort((a: any, b: any) => (a.fecha || "").localeCompare(b.fecha || ""))
    .slice(0, 5);

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "en_progreso":
        return "info";
      case "planificacion":
        return "warning";
      case "entregado":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box>
          <Typography 
            variant={presentationMode ? "h4" : "h5"} 
            sx={{ 
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            Dashboard
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              textTransform: 'capitalize',
              fontWeight: 500
            }}
          >
            {todayLabel}
          </Typography>
        </Box>
        <IconButton 
          onClick={() => fetchDashboardData(true)} 
          disabled={loading}
          size="small"
          sx={{ 
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' }
          }}
        >
          <FiRefreshCw size={18} />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {presentationMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FiActivity size={20} />
            <Typography variant="body2">
              Modo presentación activo — los valores están ocultos
            </Typography>
          </Box>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Clientes"
            value={stats.totalClientes}
            subtitle={presentationMode ? "" : "Total registrados"}
            icon={<FiUsers size={20} />}
            color="primary"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Proyectos activos"
            value={stats.proyectosActivos}
            color="info"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Pipeline"
            value={presentationMode ? "•••" : formatCOP(stats.valorPipeline)}
            subtitle={presentationMode ? "" : "En ventas"}
            icon={<FiTarget size={20} />}
            color="warning"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Presupuestado"
            value={presentationMode ? "•••" : formatCOP(stats.totalPresupuestado)}
            subtitle={presentationMode ? "" : "Total proyectos"}
            icon={<FiDollarSign size={20} />}
            color="success"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Recaudado"
            value={presentationMode ? "•••" : formatCOP(stats.totalRecaudado)}
            subtitle={presentationMode ? "" : "Vs presupuesto"}
            icon={<FiTrendingUp size={20} />}
            trend={
              stats.totalPresupuestado > 0
                ? {
                    value: Math.round((stats.totalRecaudado / stats.totalPresupuestado) * 100),
                    isPositive: stats.totalRecaudado >= stats.totalPresupuestado * 0.5,
                  }
                : undefined
            }
            color="success"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Tareas pendientes"
            value={stats.tareasPendientes}
            color="error"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Transacciones"
            value={stats.totalTransacciones}
            subtitle={presentationMode ? "" : "Total operaciones"}
            icon={<FiActivity size={20} />}
            color="warning"
            compact
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2.4}>
          <StatCard
            title="Monto transacciones"
            value={presentationMode ? "•••" : formatCOP(stats.montoTransacciones)}
            subtitle={presentationMode ? "" : "En movimientos"}
            icon={<FiDollarSign size={20} />}
            color="success"
            compact
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {proyectosActivos.length > 0 && (
          <Grid item xs={12} lg={7}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2
              }}>
                <FiActivity size={18} color={theme.palette.info.main} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Proyectos Activos
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1.5 
              }}>
                {proyectosActivos.map((proyecto: any) => (
                  <Box
                    key={proyecto.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      gap: 1
                    }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {proyecto.nombre}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.25 }}
                        >
                          {proyecto.clienteNombre || "Sin cliente"}
                        </Typography>
                      </Box>
                      <Chip
                        label={proyecto.estado === "en_progreso" ? "En progreso" : "Planificación"}
                        size="small"
                        color={getEstadoColor(proyecto.estado) as any}
                        sx={{ 
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          flexShrink: 0
                        }}
                      />
                    </Box>
                    {proyecto.presupuesto && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          {presentationMode ? "•••" : formatCOP(Number(proyecto.presupuesto))}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {proyecto.progreso || 0}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {proyectosActivos.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <FiActivity size={48} color={theme.palette.text.secondary} />
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                Sin proyectos activos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Crea tu primer proyecto para ver el seguimiento aquí
              </Typography>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12} lg={5}>
          <Paper sx={{ 
            p: 2, 
            height: '100%',
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2
            }}>
              <FiClock size={18} color={theme.palette.warning.main} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Próximas Tareas
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1 
            }}>
              {proximasTareas.length > 0 ? (
                proximasTareas.map((tarea: any) => (
                  <Box
                    key={tarea.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tarea.titulo || tarea.descripcion || "Sin título"}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 0.5
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {tarea.fecha ? new Date(tarea.fecha).toLocaleDateString("es-CO", { 
                          day: "numeric", 
                          month: "short" 
                        }) : "Sin fecha"}
                      </Typography>
                      <Chip
                        label={tarea.estado || "Pendiente"}
                        size="small"
                        color={tarea.prioridad === "Alta" ? "error" : tarea.prioridad === "Media" ? "warning" : "default"}
                        sx={{ 
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 3 }}
                >
                  No hay tareas pendientes
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
