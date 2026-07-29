import { useNavigate } from "react-router";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Tooltip,
  Collapse,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
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
  FiCpu,
  FiEye,
  FiEyeOff,
  FiChevronUp,
  FiChevronDown,
  FiPlus,
  FiList,
  FiGrid,
  FiInbox,
} from "react-icons/fi";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { proyectosService, clientesService, oportunidadesService, tareasService, transaccionesService } from "../services/database";
import { getCachedProjects, getCachedClients, getCachedTasks, getCachedTransactions } from "../utils/routeCache";
import { StatCard } from "../components/StatCard";
import SafeChip from "../components/SafeChip";
import ScannerTarjetas from "../components/ScannerTarjetas";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, Filler, ChartTooltip, Legend);

const initialState = {
  proyectos: [] as any[],
  clientes: [] as any[],
  oportunidades: [] as any[],
  tareas: [] as any[],
  transacciones: [] as any[],
  isUsingMockData: false,
};

export default function Dashboard() {
  const theme = useTheme();
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState<{ proyectos: any[]; clientes: any[]; oportunidades: any[]; tareas: any[]; transacciones: any[] } | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);
  const [expandProyectos, setExpandProyectos] = useState(true);
  const [expandTareas, setExpandTareas] = useState(true);
  const [expandFilters, setExpandFilters] = useState(false);
  const [tab, setTab] = useState(0);
  const [filtros, setFiltros] = useState<{ estado: string; prioridad: string }>({ estado: '', prioridad: '' });
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window !== 'undefined') return window.localStorage.getItem('dashboard_autorefresh') !== '0';
    return true;
  });

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setPartial(null);

    try {
      const [proyectos, clientes, tareas, transacciones] = await Promise.all([
        getCachedProjects(),
        getCachedClients(),
        getCachedTasks(),
        getCachedTransactions(),
      ]);

      const proyectosSeguros = Array.isArray(proyectos) ? proyectos : [];
      const clientesSeguros = Array.isArray(clientes) ? clientes : [];
      const tareasSeguras = Array.isArray(tareas) ? tareas : [];
      const transaccionesSeguras = Array.isArray(transacciones) ? transacciones : [];

      const oportunidades = [
        ...proyectosSeguros.filter((p: any) => p.estado === 'Abierta' || p.estado === 'en_progreso').map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          cliente_nombre: p.cliente_nombre || '',
          valor: Number(p.presupuesto) || 0,
          estado: 'Abierta',
          etapa: p.fase_administrativa || 'Propuesta',
          probabilidad: p.progreso || 0,
        })),
      ];

      setData({
        proyectos: proyectosSeguros,
        clientes: clientesSeguros,
        oportunidades,
        tareas: tareasSeguras,
        transacciones: transaccionesSeguras,
        isUsingMockData: false,
      });
    } catch (err: any) {
      setPartial(prev => prev || { proyectos: [], clientes: [], oportunidades: [], tareas: [], transacciones: [] });
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchDashboardData]);

  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const exportCSV = async (type: 'clientes' | 'proyectos' | 'tareas') => {
    setExportLoading(type);
    try {
      let rows: any[] = [];
      let filename = '';
      if (type === 'clientes') {
        rows = data.clientes.map((c: any) => ({ Nombre: c.nombre, Email: c.email, Teléfono: c.telefono, Empresa: c.empresa, Nicho: c.nicho, Origen: c.origen, Estado: c.estado }));
        filename = 'clientes.csv';
      } else if (type === 'proyectos') {
        rows = data.proyectos.map((p: any) => ({ Nombre: p.nombre, Cliente: p.cliente_nombre, Estado: p.estado, Prioridad: p.prioridad, Progreso: `${p.progreso || 0}%`, Presupuesto: p.presupuesto, Costo: p.costo_actual }));
        filename = 'proyectos.csv';
      } else if (type === 'tareas') {
        rows = data.tareas.map((t: any) => ({ Título: t.titulo, Fecha: t.fecha, Prioridad: t.prioridad, Estado: t.estado, Tipo: t.tipo }));
        filename = 'tareas.csv';
      }
      const csvContent = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Error al exportar CSV: ' + err.message);
    } finally {
      setExportLoading(null);
    }
  };
  const proyectosActivos = (data.proyectos || [])
    .filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion")
    .slice(0, 8);

  const proximasTareas = (data.tareas || [])
    .filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada")
    .sort((a: any, b: any) => (a.fecha || "").localeCompare(b.fecha || ""))
    .slice(0, 8);

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

  const todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const proyectos = data.proyectos || [];
  const clientes = data.clientes || [];
  const oportunidades = data.oportunidades || [];
  const tareas = data.tareas || [];
  const transacciones = data.transacciones || [];

  const hayDatos = proyectos.length || clientes.length || tareas.length || transacciones.length;

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

  const tabs = [
    { label: 'General', icon: <FiActivity size={14} /> },
    { label: 'Proyectos', icon: <FiTarget size={14} />, badge: proyectosActivos.length },
    { label: 'Tareas', icon: <FiClock size={14} />, badge: proximasTareas.length },
    { label: 'Datos', icon: <FiUsers size={14} />, badge: clientes.length },
  ];

  const proyectosFiltrados = useMemo(() => {
    const base = tab === 1 ? proyectosActivos : proyectos;
    return base.filter((p: any) => {
      if (filtros.estado && p.estado !== filtros.estado) return false;
      if (filtros.prioridad && p.prioridad !== filtros.prioridad) return false;
      return true;
    });
  }, [tab, proyectos, proyectosActivos, filtros.estado, filtros.prioridad]);

  const actividadesRecientes = useMemo(() => {
    const items = [
      ...proyectos.slice(0, 5).map((p: any) => ({
        id: `proyecto-${p.id}`,
        title: p.nombre || 'Proyecto',
        meta: p.estado || '',
        time: p.fecha_creacion || p.updated_at || '',
        color: '#2196f3',
      })),
      ...tareas.slice(0, 5).map((t: any) => ({
        id: `tarea-${t.id}`,
        title: t.titulo || t.descripcion || 'Tarea',
        meta: t.estado || '',
        time: t.fecha || t.created_at || '',
        color: t.prioridad === 'Alta' ? '#f44336' : t.prioridad === 'Media' ? '#ff9800' : '#4caf50',
      })),
    ];
    return items
      .sort((a, b) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 8);
  }, [proyectos, tareas]);

  const chartData = useMemo(() => ({
    labels: proyectos.slice(0, 6).map((p: any) => p.nombre || ''),
    datasets: [
      {
        type: 'line' as const,
        label: 'Presupuesto',
        data: proyectos.slice(0, 6).map((p: any) => Number(p.presupuesto) || 0),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33,150,243,0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
      {
        type: 'bar' as const,
        label: 'Recaudado',
        data: proyectos.slice(0, 6).map((p: any) => Number(p.montoPagado) || 0),
        backgroundColor: 'rgba(76,175,80,0.6)',
      },
    ],
  }), [proyectos]);

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } } },
    scales: { x: { ticks: { font: { size: 10 } }, grid: { display: false } }, y: { ticks: { font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } } },
  };

  const kpis = [
    { title: 'Clientes', value: clientes.length, icon: <FiUsers size={12} />, color: '#4caf50', bg: '#e8f5e9', sensitive: false, trend: clientes.length ? 6 : 0 },
    { title: 'Proyectos', value: proyectos.filter((p: any) => p.estado === 'en_progreso' || p.estado === 'planificacion').length, icon: <FiActivity size={12} />, color: '#2196f3', bg: '#e3f2fd', sensitive: false, trend: proyectos.length ? 3 : 0 },
    { title: 'Pipeline', value: formatCOP(valorPipeline), icon: <FiTarget size={12} />, color: '#ff9800', bg: '#fff3e0', sensitive: true, trend: valorPipeline ? 8 : 0 },
    { title: 'Recaudado', value: formatCOP(totalRecaudado), icon: <FiTrendingUp size={12} />, color: '#9c27b0', bg: '#f3e5f5', sensitive: true, trend: totalRecaudado ? 5 : 0 },
    { title: 'Presupuestado', value: formatCOP(totalPresupuestado), icon: <FiDollarSign size={12} />, color: '#00897b', bg: '#e0f2f1', sensitive: true, trend: totalPresupuestado ? 2 : 0 },
    { title: 'Tareas pend.', value: tareas.filter((t: any) => t.estado !== 'Completada' && t.estado !== 'Cancelada').length, icon: <FiClock size={12} />, color: '#f44336', bg: '#ffebee', sensitive: false, trend: tareas.length ? -2 : 0 },
    { title: 'Transacciones', value: transacciones.length, icon: <FiActivity size={12} />, color: '#607d8b', bg: '#eceff1', sensitive: false, trend: transacciones.length ? 4 : 0 },
    { title: 'Mov. ($)', value: formatCOP(montoTransacciones), icon: <FiDollarSign size={12} />, color: '#1976d2', bg: '#e3f2fd', sensitive: true, trend: montoTransacciones ? 6 : 0 },
  ];

  const autores = [...new Set(actividadesRecientes.map((item) => item.title))];

  return (
    <Box sx={{ p: { xs: 0.5, sm: 0 } }}>
      {/* Header tipo Notion */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
            Dashboard
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'capitalize', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {todayLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title={hideSensitive ? 'Mostrar datos' : 'Ocultar datos sensibles'}>
            <IconButton onClick={() => setHideSensitive(v => !v)} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              {hideSensitive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar">
            <IconButton onClick={() => fetchDashboardData(true)} disabled={loading} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <FiRefreshCw size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title={autoRefresh ? 'Desactivar auto-refresh' : 'Activar auto-refresh'}>
            <IconButton onClick={() => { const next = !autoRefresh; setAutoRefresh(next); if (typeof window !== 'undefined') window.localStorage.setItem('dashboard_autorefresh', next ? '1' : '0'); }} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <FiCalendar size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
        <Button size="small" variant="contained" startIcon={<FiPlus size={14} />} onClick={() => navigate('/clientes?new=1')}>Nuevo</Button>
        <ScannerTarjetas />
      </Box>

      <Collapse in={expandFilters} timeout="auto" unmountOnExit>
        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5, mb: 1 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel id="filtro-estado">Estado</InputLabel>
                <Select labelId="filtro-estado" label="Estado" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} displayEmpty>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="en_progreso">En progreso</MenuItem>
                  <MenuItem value="planificacion">Planificación</MenuItem>
                  <MenuItem value="entregado">Entregado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel id="filtro-prioridad">Prioridad</InputLabel>
                <Select labelId="filtro-prioridad" label="Prioridad" value={filtros.prioridad} onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })} displayEmpty>
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button size="small" variant="text" onClick={() => setFiltros({ estado: '', prioridad: '' })}>Limpiar</Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Tabs con badge */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ minHeight: 36 }}>
          {tabs.map((t, i) => (
            <Tab key={t.label} icon={t.icon} label={t.badge !== undefined ? `${t.label} (${t.badge})` : t.label} sx={{ minHeight: 36, textTransform: 'none', fontSize: '0.78rem' }} />
          ))}
        </Tabs>
      </Box>

      {/* KPI strip compacto */}
      {loading && kpis.some((_, i) => i < 4) ? (
        <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={3} sm={3} md={3} key={i}>
              <Paper variant="outlined" sx={{ p: 0.75, borderRadius: 1.5, borderColor: 'divider' }}>
                <Skeleton variant="text" sx={{ fontSize: '0.75rem' }} />
                <Skeleton variant="text" sx={{ fontSize: '0.9rem', mt: 0.5 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
          {kpis.map((kpi) => (
            <Grid item xs={3} sm={3} md={3} key={kpi.title}>
              <StatCard
                title={kpi.title}
                value={kpi.sensitive && hideSensitive ? '•••••' : kpi.value}
                color={kpi.color === '#e8f5e9' || kpi.color === '#e3f2fd' || kpi.color === '#fff3e0' || kpi.color === '#f3e5f5' || kpi.color === '#e0f2f1' || kpi.color === '#eceff1' ? 'primary' : 'success'}
                icon={kpi.icon}
                trend={kpi.trend ? { value: Math.abs(kpi.trend), isPositive: kpi.trend > 0 } : undefined}
                compact
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Contenido principal: 2 columnas */}
      <Grid container spacing={1}>
        {/* Proyectos activos */}
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer'
              }}
              onClick={() => setExpandProyectos(v => !v)}
            >
              <FiActivity size={14} color={theme.palette.info.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Proyectos activos</Typography>
              <Box sx={{ bgcolor: 'info.main', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{proyectosActivos.length}</Typography>
              </Box>
              <Box sx={{ color: 'text.secondary' }}>{expandProyectos ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}</Box>
            </Box>

            <Collapse in={expandProyectos} timeout="auto" unmountOnExit>
              {proyectosActivos.length === 0 && !loading ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <FiActivity size={28} color="#ccc" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Sin proyectos activos</Typography>
                </Box>
              ) : (
                <Box>
                  {/* Cabeceras */}
                  <Box sx={{ px: 1.5, py: 0.75, display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: '2fr 1fr 1fr 60px', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
                    {['Proyecto', 'Cliente', 'Estado', '%'].map(h => (
                      <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.62rem' }}>{h}</Typography>
                    ))}
                  </Box>
                  {proyectosActivos.map((proyecto: any, i: number) => (
                    <Box
                      key={proyecto.id}
                      sx={{
                        px: 1.5, py: 0.75,
                        borderBottom: i < proyectosActivos.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        display: { xs: 'block', sm: 'grid' },
                        gridTemplateColumns: '2fr 1fr 1fr 60px',
                        gap: 1,
                        alignItems: 'center',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background 0.1s'
                      }}
                    >
                      <Box sx={{ mb: { xs: 0.25, sm: 0 } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '0.78rem', sm: '0.85rem' } }} noWrap>{proyecto.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                          {proyecto.clienteNombre || 'Sin cliente'} • {proyecto.estado}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' }, fontSize: { xs: '0.72rem', sm: '0.8rem' } }}>
                        {proyecto.clienteNombre || 'Sin cliente'}
                      </Typography>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <SafeChip
                          label={proyecto.estado === 'en_progreso' ? 'En progreso' : 'Planificación'}
                          size="small"
                          color={getEstadoColor(proyecto.estado) as any}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }}
                        />
                      </Box>
                      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ flex: 1, height: 4, borderRadius: 1, bgcolor: '#e0e0e0', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${proyecto.progreso || 0}%`, bgcolor: proyecto.progreso >= 80 ? '#4caf50' : proyecto.progreso >= 40 ? '#2196f3' : '#ff9800', borderRadius: 1, transition: 'width 0.4s' }} />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', minWidth: 24 }}>{proyecto.progreso || 0}%</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Collapse>
          </Paper>
        </Grid>

        {/* Próximas tareas */}
        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer'
              }}
              onClick={() => setExpandTareas(v => !v)}
            >
              <FiClock size={14} color={theme.palette.warning.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Próximas tareas</Typography>
              {proximasTareas.length > 0 && (
                <Box sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.5 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700 }}>{proximasTareas.length}</Typography>
                </Box>
              )}
              <Box sx={{ color: 'text.secondary' }}>{expandTareas ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}</Box>
            </Box>

            <Collapse in={expandTareas} timeout="auto" unmountOnExit>
              {proximasTareas.length > 0 ? (
                <Box>
                  {proximasTareas.map((tarea: any, i: number) => (
                    <Box
                      key={tarea.id}
                      sx={{
                        px: 1.5, py: 0.75,
                        borderBottom: i < proximasTareas.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background 0.1s'
                      }}
                    >
                      <Box sx={{ width: 4, height: 28, borderRadius: 1, bgcolor: tarea.prioridad === 'Alta' ? '#f44336' : tarea.prioridad === 'Media' ? '#ff9800' : '#4caf50', flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '0.78rem', sm: '0.85rem' } }} noWrap>
                          {tarea.titulo || tarea.descripcion || 'Sin título'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                          {tarea.fecha ? new Date(tarea.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Sin fecha'}
                          {tarea.prioridad && ` • ${tarea.prioridad}`}
                        </Typography>
                      </Box>
                      <SafeChip
                        label={tarea.estado || 'Pendiente'}
                        size="small"
                        color={tarea.prioridad === 'Alta' ? 'error' : tarea.prioridad === 'Media' ? 'warning' : 'default'}
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, flexShrink: 0 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <FiClock size={28} color="#ccc" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No hay tareas pendientes</Typography>
                </Box>
              )}
            </Collapse>
          </Paper>
        </Grid>
      </Grid>

      {/* Panel inferior compacto */}
      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiActivity size={14} color={theme.palette.success.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Ingresos vs Presupuesto</Typography>
              <Chip size="small" label="6 proyectos" sx={{ height: 20, fontSize: '0.6rem' }} />
            </Box>
            <Box sx={{ p: 1.5, height: 220 }}>
              {proyectos.length ? <Line data={chartData} options={chartOptions} /> : <Typography variant="caption" color="text.secondary">Sin datos para el gráfico</Typography>}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiClock size={14} color={theme.palette.warning.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Actividad reciente</Typography>
              <Chip size="small" label={actividadesRecientes.length} sx={{ height: 20, fontSize: '0.6rem' }} />
            </Box>
            <Box sx={{ maxHeight: 220, overflow: 'auto' }}>
              {!actividadesRecientes.length ? (
                <Box sx={{ py: 3, textAlign: 'center' }}><FiInbox size={24} color="#ccc" /><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Sin actividad reciente</Typography></Box>
              ) : (
                actividadesRecientes.map((item, i) => (
                  <Box key={item.id} sx={{ px: 1.5, py: 0.75, borderBottom: i < actividadesRecientes.length - 1 ? '1px solid' : 'none', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.1s' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '0.72rem', sm: '0.78rem' } }} noWrap>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{item.meta}</Typography>
                    </Box>
                    {item.time ? <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>{new Date(item.time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</Typography> : null}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {!hayDatos && !loading && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <FiInbox size={32} color="#ccc" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Dashboard vacío</Typography>
            <Button size="small" variant="contained" startIcon={<FiPlus size={14} />} onClick={() => navigate('/clientes?new=1')} sx={{ mt: 1 }}>Crear primer cliente</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}