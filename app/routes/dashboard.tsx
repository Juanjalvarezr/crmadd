import { Outlet, useNavigate, useLocation } from "react-router";
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
  Tooltip,
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
} from "react-icons/fi";
import { proyectosService, clientesService, oportunidadesService, tareasService, transaccionesService } from "../services/database";
import { getCachedProjects, getCachedClients, getCachedTasks, getCachedTransactions } from "../utils/routeCache";
import { StatCard } from "../components/StatCard";
import SafeChip from "../components/SafeChip";

const initialState = {
  proyectos: [],
  clientes: [],
  oportunidades: [],
  tareas: [],
  transacciones: [],
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

      // oportunidades se calcula desde proyectos/tareas para evitar 5ta consulta paralela
      const oportunidades = [
        ...(proyectos || []).filter((p: any) => p.estado === 'Abierta' || p.estado === 'en_progreso').map((p: any) => ({
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
        proyectos: Array.isArray(proyectos) ? proyectos : [],
        clientes: Array.isArray(clientes) ? clientes : [],
        oportunidades,
        tareas: Array.isArray(tareas) ? tareas : [],
        transacciones: Array.isArray(transacciones) ? transacciones : [],
        isUsingMockData: false,
      });
    } catch (err: any) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  return (
    <Box sx={{ p: { xs: 0.5, sm: 0 } }}>
      {/* Header tipo Notion */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Dashboard
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'capitalize' }}>
            {todayLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title={hideSensitive ? 'Mostrar datos' : 'Ocultar datos sensibles'}>
            <IconButton
              onClick={() => setHideSensitive(v => !v)}
              size="small"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
            >
              {hideSensitive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar">
            <IconButton
              onClick={() => fetchDashboardData(true)}
              disabled={loading}
              size="small"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
            >
              <FiRefreshCw size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* FAB expandible + IA */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button size="small" variant="contained" onClick={() => navigate('/documentos?new=1')}>Documento</Button>
          <Button size="small" variant="contained" onClick={() => navigate('/facturacion?new=1')}>Factura</Button>
          <Button size="small" variant="contained" onClick={() => navigate('/tareas?new=1')}>Tarea</Button>
          <Button size="small" variant="contained" onClick={() => navigate('/clientes?new=1')}>Cliente</Button>
          <Button size="small" variant="contained" onClick={() => navigate('/proyectos?new=1')}>Proyecto</Button>
        </Box>
        <IconButton onClick={() => setFabOpen(v => !v)} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 3, width: 48, height: 48, '&:hover': { bgcolor: 'action.hover' } }}>
          <FiTarget size={22} />
        </IconButton>
      </Box>

      {/* Botón IA visible */}
      <Box sx={{ position: 'fixed', bottom: 20, left: { xs: 70, sm: 20 }, zIndex: 1300 }}>
        <Button variant="contained" startIcon={<FiCpu size={16} />} onClick={() => { window.dispatchEvent(new CustomEvent('open-ai-chat')); window.dispatchEvent(new CustomEvent('open-assistant')); }} sx={{ bgcolor: '#1a1a2e', color: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#16213e' } }}>IA</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      {loading && (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiRefreshCw size={14} />
            <Typography variant="body2">Actualizando datos…</Typography>
          </Box>
        </Alert>
      )}

      {/* Acciones rápidas */}
      <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" startIcon={<FiUsers size={14} />} onClick={() => exportCSV('clientes')} disabled={!!exportLoading || !data.clientes.length}>
          {exportLoading === 'clientes' ? 'Exportando…' : 'Clientes CSV'}
        </Button>
        <Button size="small" variant="outlined" startIcon={<FiActivity size={14} />} onClick={() => exportCSV('proyectos')} disabled={!!exportLoading || !data.proyectos.length}>
          {exportLoading === 'proyectos' ? 'Exportando…' : 'Proyectos CSV'}
        </Button>
        <Button size="small" variant="outlined" startIcon={<FiClock size={14} />} onClick={() => exportCSV('tareas')} disabled={!!exportLoading || !data.tareas.length}>
          {exportLoading === 'tareas' ? 'Exportando…' : 'Tareas CSV'}
        </Button>
      </Box>

      {/* KPI strip compacto — 4 cols mobile, 8 desktop */}
      <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 1 }}>
        {[
          { title: "Clientes", value: clientes.length, icon: <FiUsers size={12} />, color: "#4caf50", bg: "#e8f5e9", sensitive: false },
          { title: "Proyectos", value: proyectos.filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion").length, icon: <FiActivity size={12} />, color: "#2196f3", bg: "#e3f2fd", sensitive: false },
          { title: "Pipeline", value: formatCOP(valorPipeline), icon: <FiTarget size={12} />, color: "#ff9800", bg: "#fff3e0", sensitive: true },
          { title: "Recaudado", value: formatCOP(totalRecaudado), icon: <FiTrendingUp size={12} />, color: "#9c27b0", bg: "#f3e5f5", sensitive: true },
          { title: "Presupuestado", value: formatCOP(totalPresupuestado), icon: <FiDollarSign size={12} />, color: "#00897b", bg: "#e0f2f1", sensitive: true },
          { title: "Tareas pend.", value: tareas.filter((t: any) => t.estado !== "Completada" && t.estado !== "Cancelada").length, icon: <FiClock size={12} />, color: "#f44336", bg: "#ffebee", sensitive: false },
          { title: "Transacciones", value: transacciones.length, icon: <FiActivity size={12} />, color: "#607d8b", bg: "#eceff1", sensitive: false },
          { title: "Mov. ($)", value: formatCOP(montoTransacciones), icon: <FiDollarSign size={12} />, color: "#1976d2", bg: "#e3f2fd", sensitive: true },
        ].map((kpi) => (
          <Grid item xs={3} sm={3} md={3} key={kpi.title}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 0.5, sm: 0.75 },
                borderRadius: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: 1 },
              }}
            >
              <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
                {kpi.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', lineHeight: 1, display: 'block' }}>{kpi.title}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: kpi.color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {kpi.sensitive && hideSensitive ? '•••••' : kpi.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Contenido principal: 2 columnas */}
      <Grid container spacing={1.5}>
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
    </Box>
  );
}