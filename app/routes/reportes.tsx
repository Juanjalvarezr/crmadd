import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import type { Route } from "./+types/reportes";
import Grid from "@mui/material/Grid";
import { 
  Box, Typography, Paper, Button, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  IconButton, Alert, Snackbar, CircularProgress, Card, CardContent, Divider
} from "@mui/material";
import { 
  FiDownload, FiRefreshCw, FiFilter, FiBarChart, FiTrendingUp, FiDollarSign, FiUsers, FiCalendar,
  FiPieChart, FiActivity, FiTarget, FiFileText, FiX, FiClock, FiCheckCircle, FiAlertCircle, FiCpu
} from "react-icons/fi";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import SafeChip from "../components/SafeChip";
import {
  tareasService,
  clientesService,
  oportunidadesService
} from "../services/database";
import { aiService } from "../services/ai";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

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
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [tipoReporte, setTipoReporte] = useState("general");
  const [reportesSnackbar, setReportesSnackbar] = useState<{open: boolean, message: string, severity: "info" | "warning" | "error" | "success"}>({ open: false, message: "", severity: "info" });
  const [analisisIA, setAnalisisIA] = useState<string>("");
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const handleCloseReportesSnackbar = () => setReportesSnackbar({ ...reportesSnackbar, open: false });

  // Estados de datos
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [reporteData, setReporteData] = useState<ReporteData[]>([]);

  // Cargar datos de reportes (simulado - conectar con Supabase después)
  useEffect(() => {
    const loadReportes = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientes, oportunidades, tareas] = await Promise.all([
          clientesService.getAll(),
          oportunidadesService.getAll(),
          tareasService.getAll(),
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

        const totalIngresos = oportunidadesFiltradas.reduce((sum: number, o: any) => sum + (o.valor || 0), 0);
        const clientesActivos = (clientes || []).filter((c: any) => c.estado === "Activo").length;
        const cerradas = (oportunidadesFiltradas || []).filter((o: any) => o.etapa === "Cierre").length;
        const tasaConversion = oportunidadesFiltradas.length > 0
          ? Math.round((cerradas / oportunidadesFiltradas.length) * 100 * 10) / 10
          : 0;
        const proyectosActivos = (oportunidadesFiltradas || []).filter((o: any) => o.etapa !== "Cierre").length;

        const metricasReales: Metrica[] = [
          {
            titulo: "Ingresos Totales",
            valor: formatCOP(totalIngresos),
            cambio: clientesFiltrados.length || 0,
            icono: <FiDollarSign size={24} />,
            color: "#4caf50"
          },
          {
            titulo: "Clientes Activos",
            valor: clientesActivos,
            cambio: cerradas,
            icono: <FiUsers size={24} />,
            color: "#2196f3"
          },
          {
            titulo: "Tasa Conversión",
            valor: `${tasaConversion}%`,
            cambio: tasaConversion - 5,
            icono: <FiTarget size={24} />,
            color: "#ff9800"
          },
          {
            titulo: "Proyectos Activos",
            valor: proyectosActivos,
            cambio: tareasFiltradas.length || 0,
            icono: <FiActivity size={24} />,
            color: "#9c27b0"
          }
        ];

        const meses: Record<string, ReporteData> = {};
        oportunidadesFiltradas.forEach((o: any) => {
          const periodoTexto = format(new Date(o.created_at), "MMM");
          if (!meses[periodoTexto]) {
            meses[periodoTexto] = {
              periodo: periodoTexto,
              ingresos: 0,
              nuevosClientes: 0,
              proyectosCompletados: 0,
              tasaConversion: 0,
            };
          }
          meses[periodoTexto].ingresos += o.valor || 0;
          if (o.etapa === "Cierre") meses[periodoTexto].proyectosCompletados += 1;
          meses[periodoTexto].tasaConversion = oportunidadesFiltradas.length > 0
            ? Math.round((cerradas / oportunidadesFiltradas.length) * 100 * 10) / 10
            : 0;
        });

        Object.values(meses).forEach((mes) => {
          mes.nuevosClientes = clientesFiltrados.filter((c: any) => format(new Date(c.created_at), "MMM") === mes.periodo).length;
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
    setReportesSnackbar({ 
      open: true, 
      message: `Exportando reporte en formato ${formato.toUpperCase()}...`, 
      severity: "info" 
    });
    try {
      if (formato === 'csv') {
        const rows = (reporteData || []).map((r: any) => Object.values(r).join(',')).join('\n');
        const blob = new Blob([rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reporte.csv'; a.click(); URL.revokeObjectURL(url);
      }
    } catch {}
    setTimeout(() => {
      setReportesSnackbar({ 
        open: true, 
        message: `Reporte exportado correctamente en ${formato.toUpperCase()}`, 
        severity: "success" 
      });
    }, 1000);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    const loadReportes = async () => {
      try {
        const [clientes, oportunidades, tareas] = await Promise.all([
          clientesService.getAll(),
          oportunidadesService.getAll(),
          tareasService.getAll(),
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

  const handleAnalizarCRM = async () => {
    try {
      setLoadingAnalisis(true);
      setAnalisisIA("");
      const resultado = await aiService.analizarDatosCRM();
      setAnalisisIA(resultado);
    } catch (e: any) {
      setAnalisisIA("No pude generar el análisis ahora.");
    } finally {
      setLoadingAnalisis(false);
    }
  };

  // Renderizado de gráficos simples (sin librerías externas)
  const renderBarChart = () => {
    if (reporteData.length === 0) return <Typography align="center">No hay datos en el periodo</Typography>;
    const maxValue = Math.max(...reporteData.map(d => d.ingresos)) || 1;
    const chartHeight = 200;
    
    return (
      <Box sx={{ display: "flex", alignItems: "flex-end", height: chartHeight, gap: 2, px: 2 }}>
        {reporteData.map((data, index) => (
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
    <Box sx={{ p: { xs: 1, sm: 1, md: 1.5 } }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: { xs: 1.5, sm: 2 },
        backgroundColor: "#e3f2fd",
        borderLeft: "5px solid #2196f3",
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FiBarChart size={28} color="#1976d2" />
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            Reportes y Analytics
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Métricas en tiempo real del rendimiento de DESEO DIGITAL. Analiza ingresos, clientes y crecimiento.
        </Typography>
      </Paper>

      {/* Controles de filtro */}
      <Paper sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  value={fechaInicio}
                  onChange={(e: any) => setFechaInicio(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
          
          <Grid item xs={12} md={3}>
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
                startIcon={<FiCpu />}
                onClick={handleAnalizarCRM}
                disabled={loadingAnalisis}
              >
                {loadingAnalisis ? "Analizando..." : "Análisis IA"}
              </Button>
              <Button 
                variant="outlined"
                startIcon={<FiFilter />}
                onClick={() => setReportesSnackbar({ open: true, message: "Filtros avanzados en desarrollo", severity: "info" })}
              >
                Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {analisisIA && !loadingAnalisis && (
        <Alert severity="info" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>Análisis IA</Typography>
          {analisisIA}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
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
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {metricas.map((metrica, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${metrica.color}15, ${metrica.color}05)`,
                  border: `1px solid ${metrica.color}30`,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 3 }
                }}>
                  <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Box sx={{ 
                        p: 0.5, 
                        borderRadius: 0.5, 
                        backgroundColor: `${metrica.color}20`,
                        color: metrica.color
                      }}>
                        {metrica.icono}
                      </Box>
                      <SafeChip
                        label={`${metrica.cambio > 0 ? "+" : ""}${metrica.cambio}%`}
                        size="small"
                        color={metrica.cambio > 0 ? "success" : "error"}
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    </Box>
                  
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25, lineHeight: 1 }}>
                        {metrica.valor}
                      </Typography>
                    
                      <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 500 }}>
                        {metrica.titulo}
                      </Typography>
                    </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3}>
            {/* Gráfico de Ingresos */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
                  
                  <Box sx={{ mt: 1.5 }}>
                    {reporteData.slice(0, 3).map((data, index) => (
                      <Box key={data.periodo} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
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

            {/* Gráficos visuales */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Ingresos (barras)</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricas.map((m) => ({ name: m.titulo, valor: typeof m.valor === 'number' ? m.valor : 0, color: m.color }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} hide />
                        <YAxis tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                          }}
                        />
                        <Bar dataKey="valor">
                          {metricas.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Distribución</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ name: 'Ingresos', value: metricas[0]?.valor ? Number(metricas[0].valor) : 0 }, { name: 'Otros', value: Math.max(0, (metricas[1]?.valor ? Number(metricas[1].valor) : 0)) }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                          <Cell fill="#e91e63" />
                          <Cell fill="#9c27b0" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                          }}
                        />
                        <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tabla de Detalles */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
                          <Box component="th" sx={{ padding: "8px", textAlign: "left", fontWeight: "bold" }}>Período</Box>
                          <Box component="th" sx={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>Ingresos</Box>
                          <Box component="th" sx={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>Nuevos Clientes</Box>
                          <Box component="th" sx={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>Proyectos Completados</Box>
                          <Box component="th" sx={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>Tasa Conversión</Box>
                          <Box component="th" sx={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>Estado</Box>
                        </Box>
                      </thead>
                      <tbody>
                        {reporteData.map((data, index) => (
                          <Box component="tr" key={data.periodo} sx={{ borderBottom: "1px solid #f0f0f0" }}>
                            <Box component="td" sx={{ padding: "8px" }}>{data.periodo}</Box>
                            <Box component="td" sx={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                              {formatCOP(data.ingresos)}
                            </Box>
                            <Box component="td" sx={{ padding: "8px", textAlign: "right" }}>{data.nuevosClientes}</Box>
                            <Box component="td" sx={{ padding: "8px", textAlign: "right" }}>{data.proyectosCompletados}</Box>
                            <Box component="td" sx={{ padding: "8px", textAlign: "right" }}>{data.tasaConversion}%</Box>
                            <Box component="td" sx={{ padding: "8px", textAlign: "center" }}>
                              <SafeChip
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
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiClock size={16} color="#ff9800" />
                        <Typography variant="body2">Tiempo Respuesta Cliente</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>2.4 horas</Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiTarget size={16} color="#4caf50" />
                        <Typography variant="body2">Tasa Retención Clientes</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>87.3%</Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
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
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ p: 1.5, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>Meta Mensual</Typography>
                        <SafeChip label="En Progreso" color="info" size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Alcanzar $50M COP en ingresos
                      </Typography>
                      <Box sx={{ mt: 1, height: 8, backgroundColor: "#e0e0e0", borderRadius: 4 }}>
                        <Box sx={{ width: "91.6%", height: "100%", backgroundColor: "#4caf50", borderRadius: 4 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">91.6% completado</Typography>
                    </Box>
                    
                    <Box sx={{ p: 1.5, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>Meta Trimestral</Typography>
                        <SafeChip label="En Camino" color="warning" size="small" />
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
        open={reportesSnackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseReportesSnackbar}
      >
        <Alert 
          onClose={handleCloseReportesSnackbar} 
          severity={reportesSnackbar.severity}
          sx={{ width: '100%' }}
        >
          {reportesSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

