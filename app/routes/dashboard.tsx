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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Menu,
  alpha,
  useTheme,
} from "@mui/material";
import {
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { proyectosService, clientesService, oportunidadesService, tareasService } from "../services/database";

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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: theme.palette.text.secondary }}
              >
                Panel de Control
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {todayLabel}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<FiRefreshCw />}
              onClick={refreshMetrics}
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

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(233,30,99,0.92) 0%, rgba(156,39,176,0.92) 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              minHeight: 110,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -18,
                right: -18,
                width: 110,
                height: 110,
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                filter: "blur(14px)",
              }}
            />
            <CardContent>
              <Typography variant="overline" sx={{ letterSpacing: 1 }}>
                Análisis Estratégico AI
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <FiTrendingUp size={28} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {resumenAI.trim().length
                    ? resumenAI
                    : "Revisa tus tareas pendientes para comenzar el día."}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={loading ? "Sincronizando..." : "Datos actualizados"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
                <Chip
                  label={stats.proyectosActivos > 0 ? `${stats.proyectosActivos} activos` : "Sin pendientes"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
                <Chip
                  icon={<FiCalendar size={14} />}
                  label="Hoy"
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Ingresos Totales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {formatCurrency(stats.totalPresupuestado)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Proyectos en curso: {stats.proyectosActivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Recaudado
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {formatCurrency(stats.totalRecaudado)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clientes registrados: {stats.totalClientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Ventas
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <FiTrendingUp color="#e91e63" />
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(stats.valorPipeline)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Oportunidades abiertas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <FiUsers color="#e91e63" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Clientes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats.totalClientes}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Activos en esta semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <FiCalendar color="#e91e63" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Agenda
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats.proyectosActivos}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Proyectos en ejecución
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <FiUsers color="#e91e63" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Tareas pendientes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats.tareasPendientes}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Sin completar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
