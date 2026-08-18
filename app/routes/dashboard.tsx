import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
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
import { StatCard } from "../components/StatCard";
import { useCRMStore } from "../store/useCRMStore";

const initialState = {
  proyectos: [],
  clientes: [],
  oportunidades: [],
  tareas: [],
  isUsingMockData: false,
};

export default function Dashboard() {
  const clientes = useCRMStore((s) => s.clientes);
  const proyectos = useCRMStore((s) => s.proyectos);
  const oportunidades = useCRMStore((s) => s.oportunidades);
  const tareas = useCRMStore((s) => s.tareas);
  const fetchDashboardData = useCRMStore((s) => s.fetchDashboardData);
  const storeIsLoading = useCRMStore((s) => s.isLoading);
  const storeError = useCRMStore((s) => s.error);

  const [data, setData] = useState(initialState);
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
  const [ready, setReady] = useState(false);
  const todayLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPresentationMode(detail === "on");
    };
    window.addEventListener("presentation-mode-changed", handler);
    setPresentationMode(localStorage.getItem("presentation_mode") === "true");
    return () => window.removeEventListener("presentation-mode-changed", handler);
  }, []);

  const timeoutRef = useRef<number | null>(null);
  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => setReady(true), 8000);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const retryWithTimeout = async () => {
    setReady(false);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setReady(true), 8000);
    try {
      await fetchDashboardData();
    } catch (networkError) {
      setError("No fue posible sincronizar con el backend. Intenta nuevamente.");
    }
  };

  useEffect(() => {
    (async () => {
      await retryWithTimeout();
    })();
  }, [fetchDashboardData]);

  useEffect(() => {
    setData({
      proyectos,
      clientes,
      oportunidades,
      tareas,
      isUsingMockData: false,
    } as any);
  }, [proyectos.length, clientes.length, oportunidades.length, tareas.length]);

  useEffect(() => {
    if (!storeIsLoading) {
      const proyectos = Array.isArray(data.proyectos) ? data.proyectos : [];
      const clientes = Array.isArray(data.clientes) ? data.clientes : [];
      const oportunidades = Array.isArray(data.oportunidades) ? data.oportunidades : [];
      const tareas = Array.isArray(data.tareas) ? data.tareas : [];

      const totalPresupuestado = proyectos.reduce((acc: number, current: any) => acc + (Number(current.presupuesto) || 0), 0);
      const totalRecaudado = proyectos.reduce((acc: number, current: any) => acc + (Number(current.montoPagado) || 0), 0);
      const valorPipeline = oportunidades
        .filter((oportunidad: any) => oportunidad.estado === "Abierta" || oportunidad.etapa === "Prospección" || oportunidad.etapa === "Propuesta")
        .reduce((acc: number, current: any) => acc + (Number(current.valor) || 0), 0);

      setStats({
        totalClientes: clientes.length,
        proyectosActivos: proyectos.filter((proyecto: any) => proyecto.estado === "en_progreso" || proyecto.estado === "planificacion").length,
        valorPipeline,
        totalPresupuestado,
        totalRecaudado,
        tareasPendientes: Array.isArray(tareas) ? tareas.filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada").length : 0,
      });
    }
  }, [storeIsLoading, data]);

  const refreshMetrics = async () => {
    setReady(false);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setReady(true), 8000);
    try {
      await fetchDashboardData();
    } catch (networkError) {
      setError("No fue posible sincronizar con el backend. Intenta nuevamente.");
    }
  };

  const formatCurrency = (value: number) =>
    presentationMode
      ? "••••••"
      : new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(value);

  const shouldBlock = storeIsLoading && !ready;
  if (shouldBlock) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>Sincronizando datos... Si esto tarda, podés seguir navegando.</Alert>
        <Button variant="contained" onClick={() => retryWithTimeout()}>Reintentar ahora</Button>
      </Box>
    );
  }

  if (storeError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{storeError}</Alert>
        <Button variant="contained" onClick={() => fetchDashboardData()}>Reintentar</Button>
      </Box>
    );
  }

  const hasData = (clientes?.length || proyectos?.length || oportunidades?.length || tareas?.length);
  if (!hasData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>No hay datos registrados aún. Comienza agregando clientes, proyectos o tareas.</Alert>
        <Button variant="contained" onClick={() => fetchDashboardData()}>Actualizar</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: { xs: 1, sm: 1.5 } }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 1, fontWeight: 600, fontSize: '0.7rem' }}
              >
                Panel de Control
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)'
                    : 'linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.15rem', sm: '1.5rem', md: '1.75rem' }
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

      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background:
                "linear-gradient(135deg, rgba(233,30,99,0.95) 0%, rgba(156,39,176,0.95) 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
              minHeight: 96,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 18px rgba(233,30,99,0.25)'
              }
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.12)",
                borderRadius: "50%",
                filter: "blur(14px)",
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <FiTrendingUp size={18} />
                <Typography variant="overline" sx={{ letterSpacing: 1, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem' }}>
                  Análisis AI
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 400, mb: 1 }}>
                {resumenAI.trim().length ? resumenAI : "Revisa tus tareas pendientes para comenzar el día."}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={storeIsLoading ? "Sincronizando..." : "Datos actualizados"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
                <Chip
                  label={stats.proyectosActivos > 0 ? `${stats.proyectosActivos} activos` : "Sin pendientes"}
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
                <Chip
                  icon={<FiCalendar size={12} />}
                  label="Hoy"
                  sx={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Proyectos"
            value={stats.proyectosActivos}
            subtitle="En ejecución"
            icon={<FiActivity size={22} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Ingresos"
            value={formatCurrency(stats.totalPresupuestado)}
            subtitle={`${stats.proyectosActivos} activos`}
            icon={<FiDollarSign size={22} />}
            color="primary"
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Recaudado"
            value={formatCurrency(stats.totalRecaudado)}
            subtitle={`${stats.totalClientes} clientes`}
            icon={<FiActivity size={22} />}
            color="success"
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Ventas"
            value={formatCurrency(stats.valorPipeline)}
            subtitle="Oportunidades"
            icon={<FiTrendingUp size={22} />}
            color="secondary"
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Clientes"
            value={stats.totalClientes}
            subtitle="Registrados"
            icon={<FiUsers size={22} />}
            color="info"
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Tareas"
            value={stats.tareasPendientes}
            subtitle="Pendientes"
            icon={<FiTarget size={22} />}
            color={stats.tareasPendientes > 0 ? "warning" : "success"}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
