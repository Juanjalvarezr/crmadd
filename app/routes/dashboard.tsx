import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert,
  Button,
  useTheme,
} from "@mui/material";
import {
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiTarget,
  FiActivity,
} from "react-icons/fi";
import { proyectosService, clientesService, oportunidadesService, tareasService } from "../services/database";
import { StatCard } from "../components/StatCard";

const initialState = {
  proyectos: [],
  clientes: [],
  oportunidades: [],
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
  });
  const [resumenAI] = useState<string>("");
  const [presentationMode, setPresentationMode] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [syncObservation, setSyncObservation] = useState("");
  const [syncAnchorEl, setSyncAnchorEl] = useState<null | HTMLElement>(null);
  const todayLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

  const calculateStats = useCallback(
    (source: any) => {
      const proyectos = Array.isArray(source.proyectos) ? source.proyectos : [];
      const clientes = Array.isArray(source.clientes) ? source.clientes : [];
      const oportunidades = Array.isArray(source.oportunidades)
        ? source.oportunidades
        : [];
      const tareas = Array.isArray(source.tareas) ? source.tareas : [];

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
        .reduce(
          (acc: number, current: any) => acc + (Number(current.valor) || 0),
          0
        );

      setStats({
        totalClientes: clientes.length,
        proyectosActivos: proyectos.filter(
          (proyecto: any) =>
            proyecto.estado === "en_progreso" ||
            proyecto.estado === "planificacion"
        ).length,
        valorPipeline,
        totalPresupuestado,
        totalRecaudado,
        tareasPendientes: Array.isArray(tareas)
          ? tareas.filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada").length
          : 0,
      });
    },
    [setStats]
  );

  const fetchDashboardData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        const proyectosPromise = proyectosService
          .getAll()
          .then((proyectos) => ({ proyectos, source: "real" }))
          .catch(() => ({ proyectos: [], source: "empty" }));

        const clientesPromise = clientesService
          .getAll()
          .then((clientes) => ({ clientes, source: "real" }))
          .catch(() => ({ clientes: [], source: "empty" }));

        const oportunidadesPromise = oportunidadesService
          .getAll()
          .then((oportunidades) => ({ oportunidades, source: "real" }))
          .catch(() => ({ oportunidades: [], source: "empty" }));

        const tareasPromise = tareasService
          .getAll()
          .then((tareas) => ({ tareas, source: "real" }))
          .catch(() => ({ tareas: [], source: "empty" }));

        const [proyectosResult, clientesResult, oportunidadesResult, tareasResult] =
          await Promise.all([
            proyectosPromise,
            clientesPromise,
            oportunidadesPromise,
            tareasPromise,
          ]);

        const proyectos = proyectosResult.proyectos;
        const clientes = clientesResult.clientes;
        const oportunidades = oportunidadesResult.oportunidades;
        const tareas = tareasResult.tareas;
        const isUsingMockData =
          proyectosResult.source === "empty" &&
          clientesResult.source === "empty" &&
          oportunidadesResult.source === "empty" &&
          tareasResult.source === "empty";

        setData({
          proyectos,
          clientes,
          oportunidades,
          tareas,
          isUsingMockData,
        } as any);
      } catch (networkError) {
        console.error("No fue posible sincronizar con el backend:", networkError);
        setError("No fue posible sincronizar con el backend. Intenta nuevamente.");
        setData({
          proyectos: [],
          clientes: [],
          oportunidades: [],
          isUsingMockData: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [setData]
  );

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!loading) {
      calculateStats(data);
    }
  }, [loading, data, calculateStats]);

  const loadDashboardData = useCallback(
    async (forceRefresh = false) => {
      await fetchDashboardData(forceRefresh);
    },
    [fetchDashboardData]
  );

  const refreshMetrics = async () => {
    setSyncAnchorEl(null);
    try {
      await loadDashboardData(true);
    } catch (refreshError) {
      console.error("No se pudo refrescar el dashboard:", refreshError);
    }
  };

  const handleOpenSyncDialog = () => setSyncDialog(true);
  const handleCloseSyncDialog = () => setSyncDialog(false);

  const submitSyncObservation = () => {
    console.log("Observación guardada para sincronizar:", syncObservation);
    setSyncDialog(false);
    setSyncObservation("");
  };

  const formatCurrency = (value: number) =>
    presentationMode
      ? "••••••"
      : new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(value);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 1, fontWeight: 600 }}
              >
                Panel de Control
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 900,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)'
                    : 'linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                }}
              >
                {todayLabel}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<FiRefreshCw />}
              onClick={refreshMetrics}
              sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
            >
              Sincronizar
            </Button>
          </Box>
        </Grid>
      </Grid>

      {error ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(233,30,99,0.95) 0%, rgba(156,39,176,0.95) 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              minHeight: 120,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(233,30,99,0.3)'
              }
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -24,
                right: -24,
                width: 120,
                height: 120,
                background: "rgba(255,255,255,0.12)",
                borderRadius: "50%",
                filter: "blur(16px)",
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FiTrendingUp size={22} />
                <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                  Análisis Estratégico AI
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 400, mb: 2 }}>
                {resumenAI.trim().length
                  ? resumenAI
                  : "Revisa tus tareas pendientes para comenzar el día."}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={loading ? "Sincronizando..." : "Datos actualizados"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.75rem'
                  }}
                />
                <Chip
                  label={stats.proyectosActivos > 0 ? `${stats.proyectosActivos} activos` : "Sin pendientes"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.75rem'
                  }}
                />
                <Chip
                  icon={<FiCalendar size={13} />}
                  label="Hoy"
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Proyectos"
            value={stats.proyectosActivos}
            subtitle="En ejecución"
            icon={<FiActivity size={28} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Proyectos"
            value={stats.proyectosActivos}
            subtitle="En ejecución"
            icon={<FiActivity size={28} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ingresos Totales"
            value={formatCurrency(stats.totalPresupuestado)}
            subtitle={`${stats.proyectosActivos} proyectos en curso`}
            icon={<FiDollarSign size={28} />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recaudado"
            value={formatCurrency(stats.totalRecaudado)}
            subtitle={`${stats.totalClientes} clientes registrados`}
            icon={<FiActivity size={28} />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Ventas"
            value={formatCurrency(stats.valorPipeline)}
            subtitle="Oportunidades abiertas"
            icon={<FiTrendingUp size={28} />}
            color="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Clientes"
            value={stats.totalClientes}
            subtitle="Activos en esta semana"
            icon={<FiUsers size={28} />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tareas pendientes"
            value={stats.tareasPendientes}
            subtitle="Sin completar"
            icon={<FiTarget size={28} />}
            color={stats.tareasPendientes > 0 ? "warning" : "success"}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
