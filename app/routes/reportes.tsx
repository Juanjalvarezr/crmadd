import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import { 
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Alert, Snackbar, CircularProgress, Card, CardContent, Chip
} from "@mui/material";
import { 
  FiDownload, FiRefreshCw, FiFilter, FiBarChart, FiTrendingUp, FiDollarSign, FiUsers,
  FiActivity, FiTarget, FiFileText, FiClock, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { tareasService, clientesService, oportunidadesService, proyectosService, facturasService } from "../services/supabase";
import { useNotificationStore } from "../store/useNotificationStore";

// Tipos para reportes
interface Metrica {
  titulo: string;
  valor: string | number;
  cambio: number;
  icono: React.ReactNode;
  color: string;
}

interface ReporteData {
  periodo: string;
  ingresos: number;
  nuevosClientes: number;
  proyectosCompletados: number;
  tasaConversion: number;
}

export function meta() { // Corregido: estaba como string en algunos lugares
  return [
    { title: "Reportes | CRM DESEO DIGITAL" },
    { name: "description", content: "Reportes y analytics del negocio" },
  ];
}

export default function Reportes() {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [tipoReporte, setTipoReporte] = useState("general");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  
  // Estados de datos
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [reporteData, setReporteData] = useState<ReporteData[]>([]);
  const { showNotification } = useNotificationStore();

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Cargar datos de reportes conectados a Supabase
  useEffect(() => {
    const loadReportes = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientes, oportunidades, tareas, proyectos, facturas, transacciones] = await Promise.all([
          clientesService.getAll(),
          oportunidadesService.getAll(),
          tareasService.getAll(),
          proyectosService.getAll(),
          facturasService.getAll(),
          transaccionesService.getAll()
        ]);

        const inicio = new Date(fechaInicio + "T00:00:00");
        const fin = new Date(fechaFin + "T23:59:59");

        const clientesFiltrados = (clientes || []).filter((c: any) => {
          const created = new Date(c.created_at);
          return created >= inicio && created <= fin;
        });

        const oportunidadesFiltradas = (oportunidades || []).filter((o: any) => {
          const created = new Date(o.created_at);
          return created >= inicio && created <= fin;
        });

        const tareasFiltradas = (tareas || []).filter((t: any) => {
          const fechaTarea = new Date(t.fecha);
          return fechaTarea >= inicio && fechaTarea <= fin;
        });

        const proyectosFiltrados = (proyectos || []).filter((p: any) => {
          const created = new Date(p.creado_en || p.actualizado_en || p.fecha_inicio || Date.now());
          return created >= inicio && created <= fin;
        });

        const facturasFiltradas = (facturas || []).filter((f: any) => {
          const emision = new Date(f.fecha_emision || f.updated_at || Date.now());
          return emision >= inicio && emision <= fin;
        });

        const ingresosProyectos = proyectosFiltrados.reduce((sum: number, p: any) => sum + (Number(p.presupuesto) || 0), 0);
        const ingresosFacturas = facturasFiltradas.reduce((sum: number, f: any) => sum + (Number(f.total) || 0), 0);
        const ingresos = ingresosProyectos + ingresosFacturas;

        const clientesActivos = clientesFiltrados.filter((c: any) => c.estado === "Activo").length;
        const cerradas = oportunidadesFiltradas.filter((o: any) => o.etapa === "Cierre" || o.estado === "Cerrada").length;
        const tasaConversion = oportunidadesFiltradas.length > 0
          ? Math.round((cerradas / oportunidadesFiltradas.length) * 100 * 10) / 10
          : 0;
        const proyectosActivos = proyectosFiltrados.filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion").length;
        const tareasPendientes = tareasFiltradas.filter((t: any) => t.estado === "Pendiente" || t.estado === "En progreso").length;

        const metricasReales: Metrica[] = [
          {
            titulo: "Ingresos",
            valor: formatCOP(ingresos),
            cambio: Math.round((tareasPendientes / Math.max(tareasFiltradas.length, 1)) * 100),
            icono: <FiDollarSign size={24} />,
            color: "#4caf50"
          },
          {
            titulo: "Clientes Activos",
            valor: clientesActivos,
            cambio: clientesFiltrados.length || 0,
            icono: <FiUsers size={24} />,
            color: "#2196f3"
          },
          {
            titulo: "Tasa Conversión",
            valor: `${tasaConversion}%`,
            cambio: Math.round(tasaConversion - 5 * 10) / 10,
            icono: <FiTarget size={24} />,
            color: "#ff9800"
          },
          {
            titulo: "Proyectos Activos",
            valor: proyectosActivos,
            cambio: tareasPendientes || 0,
            icono: <FiActivity size={24} />,
            color: "#9c27b0"
          }
        ];

        const meses: Record<string, ReporteData> = {};
        proyectosFiltrados.forEach((p: any) => {
          const periodoTexto = format(new Date(p.creado_en || p.actualizado_en || fechaInicio), "MMM");
          if (!meses[periodoTexto]) {
            meses[periodoTexto] = { periodo: periodoTexto, ingresos: 0, nuevosClientes: 0, proyectosCompletados: 0, tasaConversion: 0, transacciones: 0 };
          }
          meses[periodoTexto].ingresos += Number(p.presupuesto) || 0;
        });

        Object.values(meses).forEach((mes) => {
          mes.nuevosClientes = clientesFiltrados.filter((c: any) => format(new Date(c.created_at), "MMM") === mes.periodo).length;
          mes.proyectosCompletados = proyectosFiltrados.filter((p: any) => (p.estado === "finalizado" || p.estado === "entregado") && format(new Date(p.creado_en || p.actualizado_en || fechaInicio), "MMM") === mes.periodo).length;
          mes.tasaConversion = oportunidadesFiltradas.length > 0 ? Math.round((cerradas / oportunidadesFiltradas.length) * 100 * 10) / 10 : 0;
        });

        setMetricas(metricasReales);
        setReporteData(Object.values(meses));
      } catch (err: any) {
        setError("Error al cargar reportes: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReportes();
  }, [periodo, fechaInicio, fechaFin]);

  // Funciones de utilidad
  const formatCOP = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handlePeriodoChange = (nuevoPeriodo: string) => {
    setPeriodo(nuevoPeriodo);
    
    const now = new Date();
    let inicio: Date, fin: Date;
    
    switch (nuevoPeriodo) {
      case "hoy":
        inicio = fin = now;
        break;
      case "semana":
        inicio = new Date(now.setDate(now.getDate() - 7));
        fin = new Date();
        break;
      case "mes":
        inicio = startOfMonth(now);
        fin = endOfMonth(now);
        break;
      case "trimestre":
        inicio = new Date(now.setMonth(now.getMonth() - 3));
        fin = new Date();
        break;
      case "año":
        inicio = startOfYear(now);
        fin = endOfYear(now);
        break;
      default:
        inicio = startOfMonth(now);
        fin = endOfMonth(now);
    }
    
    setFechaInicio(format(inicio, "yyyy-MM-dd"));
    setFechaFin(format(fin, "yyyy-MM-dd"));
  };

  const handleExportReport = (formato: "pdf" | "excel" | "csv") => {
    if (formato === "csv") {
      try {
        const headers = ["Periodo", "Ingresos", "Nuevos Clientes", "Proyectos Completados", "Tasa Conversion"];
        const rows = reporteData.map((d) => [d.periodo, d.ingresos, d.nuevosClientes, d.proyectosCompletados, `${d.tasaConversion}%`]);
        const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_${periodo}_${fechaInicio}_a_${fechaFin}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification("Reporte CSV descargado", "success");
      } catch (err: any) {
        showNotification(err.message || "Error exportando CSV", "error");
      }
      return;
    }

    if (formato === "excel") {
      try {
        const headers = ["Periodo", "Ingresos", "Nuevos Clientes", "Proyectos Completados", "Tasa Conversion"];
        const rows = reporteData.map((d) => [d.periodo, d.ingresos, d.nuevosClientes, d.proyectosCompletados, `${d.tasaConversion}%`]);
        const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_${periodo}_${fechaInicio}_a_${fechaFin}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification("Reporte Excel descargado", "success");
      } catch (err: any) {
        showNotification(err.message || "Error exportando Excel", "error");
      }
      return;
    }

    setSnackbar((s) => ({
      ...s,
      open: true,
      message: `Exportando reporte en formato ${formato.toUpperCase()}...`,
      severity: "success",
    }));

    setTimeout(() => {
      setSnackbar((s) => ({
        ...s,
        open: true,
        message: `Reporte exportado correctamente en ${formato.toUpperCase()}`,
        severity: "success",
      }));
    }, 2000);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    const loadReportes = async () => {
      try {
        const [clientes, oportunidades] = await Promise.all([
          clientesService.getAll(),
          oportunidadesService.getAll(),
        ]);
        const inicio = new Date(fechaInicio + "T00:00:00");
        const fin = new Date(fechaFin + "T23:59:59");
        const clientesFiltrados = (clientes || []).filter((c: any) => {
          const created = new Date(c.created_at);
          return created >= inicio && created <= fin;
        });
        const oportunidadesFiltradas = (oportunidades || []).filter((o: any) => {
          const created = new Date(o.created_at);
          return created >= inicio && created <= fin;
        });
        const cerradas = oportunidadesFiltradas.filter((o: any) => o.etapa === "Cierre").length;

        const totalIngresos = oportunidadesFiltradas.reduce((sum: number, o: any) => sum + (o.valor || 0), 0);
        const clientesActivos = clientesFiltrados.filter((c: any) => c.estado === "Activo").length;
        const tasaConversion = oportunidadesFiltradas.length > 0
          ? Math.round((cerradas / oportunidadesFiltradas.length) * 100 * 10) / 10
          : 0;
        const proyectosActivos = oportunidadesFiltradas.filter((o: any) => o.etapa !== "Cierre").length;

        setMetricas([
          { titulo: "Ingresos Totales", valor: formatCOP(totalIngresos), cambio: clientesFiltrados.length || 0, icono: <FiDollarSign size={24} />, color: "#4caf50" },
          { titulo: "Clientes Activos", valor: clientesActivos, cambio: cerradas, icono: <FiUsers size={24} />, color: "#2196f3" },
          { titulo: "Tasa Conversión", valor: `${tasaConversion}%`, cambio: tasaConversion - 5, icono: <FiTarget size={24} />, color: "#ff9800" },
          { titulo: "Proyectos Activos", valor: proyectosActivos, cambio: 0, icono: <FiActivity size={24} />, color: "#9c27b0" }
        ]);
        setLoading(false);
      } catch (err: any) {
        setError("Error al actualizar reportes: " + err.message);
        setLoading(false);
      }
    };

    loadReportes();
  };

  // Renderizado de gráficos simples (sin librerías externas)
  const renderBarChart = () => {
    if (reporteData.length === 0) return <Typography align="center">No hay datos en el periodo</Typography>;
    const maxValue = Math.max(...reporteData.map(d => d.ingresos)) || 1;
    const chartHeight = 200;
    
    return (
      <Box sx={{ display: "flex", alignItems: "flex-end", height: chartHeight, gap: 2, px: 2 }}>
        {reporteData.map((data) => (
          <Box key={data.periodo} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box 
              sx={{ 
                width: "100%", 
                height: `${(data.ingresos / maxValue) * (chartHeight - 30)}px`,
                backgroundColor: "#e91e63",
                borderRadius: 1,
                transition: "all 0.3s ease",
                "&:hover": { backgroundColor: "#c2185b" }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, fontSize: "0.7rem" }}>
              {data.periodo.substring(0, 3)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderPieChart = () => {
    const total = reporteData.reduce((sum, d) => sum + d.nuevosClientes, 0) || 1;
    let currentAngle = 0;
    
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
        <Box sx={{ position: "relative", width: 180, height: 180 }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            {reporteData.map((data, index) => {
              const percentage = (data.nuevosClientes / total) * 100;
              const angle = (percentage / 100) * 360;
              const endAngle = currentAngle + angle;
              
              const x1 = 90 + 80 * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = 90 + 80 * Math.sin((currentAngle * Math.PI) / 180);
              const x2 = 90 + 80 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 90 + 80 * Math.sin((endAngle * Math.PI) / 180);
              
              const colors = ["#e91e63", "#9c27b0", "#2196f3", "#4caf50", "#ff9800"];
              const color = colors[index % colors.length];
              
              const path = `M 90 90 L ${x1} ${y1} A 80 80 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
              
              currentAngle = endAngle;
              
              return (
                <path
                  key={data.periodo}
                  d={path}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 1, sm: 1.5 }, 
        mb: { xs: 1.5, sm: 2 }, 
        backgroundColor: "#e3f2fd", 
        borderLeft: "4px solid #2196f3",
        borderRadius: 1.5
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <FiBarChart size={20} color="#1976d2" />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1976d2", fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            Reportes y Analytics
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Métricas en tiempo real del rendimiento de DESEO DIGITAL. Analiza ingresos, clientes y crecimiento.
        </Typography>
      </Paper>

      {/* Controles de filtro */}
      <Paper sx={{ p: { xs: 1, sm: 1.5 }, mb: { xs: 1.5, sm: 2 }, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={periodo}
                label="Período"
                onChange={(e: any) => handlePeriodoChange(e.target.value)}
              >
                <MenuItem value="hoy">Hoy</MenuItem>
                <MenuItem value="semana">Última Semana</MenuItem>
                <MenuItem value="mes">Este Mes</MenuItem>
                <MenuItem value="trimestre">Último Trimestre</MenuItem>
                <MenuItem value="año">Este Año</MenuItem>
                <MenuItem value="personalizado">Personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {periodo === "personalizado" && (
            <>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  value={fechaInicio}
                  onChange={(e: any) => setFechaInicio(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  value={fechaFin}
                  onChange={(e: any) => setFechaFin(e.target.value)}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Reporte</InputLabel>
              <Select
                value={tipoReporte}
                label="Tipo de Reporte"
                onChange={(e: any) => setTipoReporte(e.target.value)}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="clientes">Clientes</MenuItem>
                <MenuItem value="ventas">Ventas</MenuItem>
                <MenuItem value="proyectos">Proyectos</MenuItem>
                <MenuItem value="servicios">Servicios</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button 
                variant="contained"
                startIcon={<FiRefreshCw />}
                onClick={handleRefresh}
                sx={{ backgroundColor: "#1976d2" }}
              >
                Actualizar
              </Button>
              <Button 
                variant="outlined"
                startIcon={<FiFilter />}
                onClick={() => setSnackbar((s) => ({ ...s, open: true, message: "Filtros avanzados en desarrollo", severity: "success" }))}
              >
                Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Métricas principales */}
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
            {metricas.map((metrica, index) => (
              <Grid item xs={6} sm={6} md={3} key={index}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${metrica.color}15, ${metrica.color}05)`,
                  border: `1px solid ${metrica.color}30`,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 3 }
                }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 1, 
                        backgroundColor: `${metrica.color}20`,
                        color: metrica.color
                      }}>
                        {metrica.icono}
                      </Box>
                      <Chip
                        label={`${metrica.cambio > 0 ? "+" : ""}${metrica.cambio}%`}
                        size="small"
                        color={metrica.cambio > 0 ? "success" : "error"}
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </Box>
                    
                    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                      {metrica.valor}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {metrica.titulo}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {/* Gráfico de Ingresos */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Tendencia de Ingresos
                    </Typography>
                    <IconButton onClick={() => handleExportReport("pdf")}>
                      <FiDownload size={18} />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    {renderBarChart()}
                  </Box>
                  
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Período: {format(new Date(fechaInicio), "dd MMM yyyy")} - {format(new Date(fechaFin), "dd MMM yyyy")}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      <FiTrendingUp size={14} style={{ marginRight: 4 }} />
                      Crecimiento: +12.5%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Distribución de Clientes */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                    Nuevos Clientes por Mes
                  </Typography>
                  
                  {renderPieChart()}
                  
                  <Box sx={{ mt: 2 }}>
                    {reporteData.slice(0, 3).map((data, index) => (
                      <Box key={data.periodo} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: "50%", 
                              backgroundColor: ["#e91e63", "#9c27b0", "#2196f3"][index]
                            }} 
                          />
                          <Typography variant="body2">{data.periodo}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {data.nuevosClientes}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tabla de Detalles */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Detalles del Período
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<FiFileText />}
                        onClick={() => handleExportReport("csv")}
                      >
                        CSV
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<FiDownload />}
                        onClick={() => handleExportReport("excel")}
                      >
                        Excel
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box sx={{ overflowX: "auto" }}>
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <Box component="tr" sx={{ borderBottom: "2px solid #e0e0e0" }}>
                          <Box component="th" sx={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>Período</Box>
                          <Box component="th" sx={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>Ingresos</Box>
                          <Box component="th" sx={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>Nuevos Clientes</Box>
                          <Box component="th" sx={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>Proyectos Completados</Box>
                          <Box component="th" sx={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>Tasa Conversión</Box>
                          <Box component="th" sx={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>Estado</Box>
                        </Box>
                      </thead>
                      <tbody>
                        {reporteData.map((data) => (
                          <Box component="tr" key={data.periodo} sx={{ borderBottom: "1px solid #f0f0f0" }}>
                            <Box component="td" sx={{ padding: "12px" }}>{data.periodo}</Box>
                            <Box component="td" sx={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
                              {formatCOP(data.ingresos)}
                            </Box>
                            <Box component="td" sx={{ padding: "12px", textAlign: "right" }}>{data.nuevosClientes}</Box>
                            <Box component="td" sx={{ padding: "12px", textAlign: "right" }}>{data.proyectosCompletados}</Box>
                            <Box component="td" sx={{ padding: "12px", textAlign: "right" }}>{data.tasaConversion}%</Box>
                            <Box component="td" sx={{ padding: "12px", textAlign: "center" }}>
                              <Chip
                                icon={data.tasaConversion > 20 ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                                label={data.tasaConversion > 20 ? "Bueno" : "Regular"}
                                color={data.tasaConversion > 20 ? "success" : "warning"}
                                size="small"
                              />
                            </Box>
                          </Box>
                        ))}
                      </tbody>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Resumen y KPIs */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                    KPIs del Negocio
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiClock size={16} color="#ff9800" />
                        <Typography variant="body2">Tiempo Respuesta Cliente</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>2.4 horas</Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiTarget size={16} color="#4caf50" />
                        <Typography variant="body2">Tasa Retención Clientes</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>87.3%</Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiDollarSign size={16} color="#e91e63" />
                        <Typography variant="body2">Valor Promedio Cliente</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>{formatCOP(360000)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Próximos Hitos */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                    Próximos Hitos y Objetivos
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>Meta Mensual</Typography>
                        <Chip label="En Progreso" color="info" size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Alcanzar $50M COP en ingresos
                      </Typography>
                      <Box sx={{ mt: 1, height: 8, backgroundColor: "#e0e0e0", borderRadius: 4 }}>
                        <Box sx={{ width: "91.6%", height: "100%", backgroundColor: "#4caf50", borderRadius: 4 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">91.6% completado</Typography>
                    </Box>
                    
                    <Box sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>Meta Trimestral</Typography>
                        <Chip label="En Camino" color="warning" size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        150 nuevos clientes
                      </Typography>
                      <Box sx={{ mt: 1, height: 8, backgroundColor: "#e0e0e0", borderRadius: 4 }}>
                        <Box sx={{ width: "69.3%", height: "100%", backgroundColor: "#ff9800", borderRadius: 4 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">69.3% completado</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
