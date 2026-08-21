import { useState, useEffect } from "react";
import { useCRMStore } from "../store/useCRMStore";
import { globalSnack } from "../components/GlobalSnackbar";
import { exportCsv } from "../utils/exportCsv";
import {
  Box, Typography, Paper, Button, CircularProgress, ToggleButtonGroup, ToggleButton
} from "@mui/material";
import { FiDownload } from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, DoughnutChart, Doughnut, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";

type Tab = "resumen" | "ventas" | "proyectos" | "clientes" | "facturacion";
type Range = "7d" | "30d" | "90d" | "all";

export function meta() {
  return [{ title: "Inicio | CRM DESEO DIGITAL" }];
}

function filterByDate(items: any[], dateField = "created_at", range: Range) {
  if (range === "all") return items;
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return items.filter((it: any) => {
    const d = new Date(it[dateField] || it.created_at || now);
    return d >= from;
  });
}

export default function Dashboard() {
  const { proyectos, clientes, facturas, tareas, cotizaciones, fetchDashboardData } = useCRMStore();
  const [tab, setTab] = useState<Tab>("resumen");
  const [intro, setIntro] = useState(true);
  const [range, setRange] = useState<Range>("30d");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDashboardData();
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [fetchDashboardData]);

  if (!ready) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={50} sx={{ color: "#e91e63" }} />
      </Box>
    );
  }

  const proyectosF = filterByDate(proyectos, "created_at", range);
  const clientesF = filterByDate(clientes, "created_at", range);
  const facturasF = filterByDate(facturas, "created_at", range);
  const tareasF = filterByDate(tareas, "created_at", range);
  const cotizacionesF = filterByDate(cotizaciones || [], "created_at", range);

  const totalProyectos = proyectosF.length;
  const proyectosActivos = proyectosF.filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion").length;
  const totalClientes = clientesF.length;
  const clientesActivos = clientesF.filter((c: any) => c.estado === "Activo").length;
  const totalFacturas = facturasF.length;
  const facturasPagadas = facturasF.filter((f: any) => f.estado === "pagada").length;
  const facturasVencidas = facturasF.filter((f: any) => f.estado === "vencida").length;
  const valorFacturado = facturasF.reduce((acc: number, f: any) => acc + Number((f as any).total || (f as any).monto || 0), 0);
  const valorPipeline = cotizacionesF.reduce((acc: number, c: any) => acc + Number(c.total || 0), 0);
  const cotizacionesPendientes = cotizacionesF.filter((c: any) => c.estado === "pendiente" || c.estado === "enviada").length;
  const tareasPendientes = tareasF.filter((t: any) => t.estado !== "Completada").length;

  const facturacionMensual = facturasF.reduce((acc: any[], f: any) => {
    const d = new Date(f.created_at || f.fecha_emision || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = acc.find((r) => r.mes === key);
    const monto = Number((f as any).total || (f as any).monto || 0);
    if (row) row.monto += monto; else acc.push({ mes: key, monto });
    return acc;
  }, []).sort((a, b) => a.mes.localeCompare(b.mes));

  const pipelinePorEtapa = (cotizacionesF || []).reduce((acc: any[], c: any) => {
    const etapa = c.etapa || c.estado || "Sin etapa";
    const row = acc.find((r) => r.etapa === etapa);
    if (row) row.valor += Number(c.total || 0); else acc.push({ etapa, valor: Number(c.total || 0) });
    return acc;
  }, []);

  const distribucionProyectos = [
    { name: "Activos", value: proyectosF.filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion").length },
    { name: "Cerrados", value: proyectosF.filter((p: any) => p.estado === "cerrado" || p.estado === "finalizado").length },
    { name: "Otros", value: Math.max(0, proyectosF.length - proyectosF.filter((p: any) => ["en_progreso", "planificacion", "cerrado", "finalizado"].includes(p.estado)).length) },
  ].filter((x) => x.value > 0);

  const kpiCard = (title: string, value: string | number, sub: string, color: string) => (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", flex: "1 1 200px" }}>
      <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color, mt: 0.5 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{sub}</Typography>
    </Paper>
  );

  const handleExport = (filename: string, headers: string[], rows: any[]) => {
    try {
      exportCsv(filename, headers, rows);
      globalSnack.show("CSV exportado", "success");
    } catch (e: any) {
      globalSnack.show(e.message || "Error exportando CSV", "error");
    }
  };

  if (intro) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff", gap: 3, overflow: "hidden", position: "relative" }}>
        <Box sx={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "radial-gradient(circle at 20% 30%, #E91E63 0%, transparent 45%), radial-gradient(circle at 80% 70%, #9C27B0 0%, transparent 45%)" }} />
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #E91E63, #9C27B0, transparent)", animation: "slide 1.6s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #9C27B0, #E91E63, transparent)", animation: "slide 1.6s ease-in-out infinite reverse" }} />
        <Box sx={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", width: 1, height: 120, background: "linear-gradient(180deg, transparent, #E91E63, transparent)", animation: "fade 1.6s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", width: 1, height: 120, background: "linear-gradient(180deg, transparent, #9C27B0, transparent)", animation: "fade 1.6s ease-in-out infinite reverse" }} />

        <Box sx={{ width: 120, height: 120, borderRadius: 28, background: "linear-gradient(135deg,#E91E63,#9C27B0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800, boxShadow: "0 20px 60px rgba(233,30,99,0.35)", animation: "float 2.2s ease-in-out infinite", zIndex: 1 }}>DD</Box>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.03em", zIndex: 1 }}>DESEO DIGITAL</Typography>
        <Typography variant="body2" sx={{ color: "#bbb", letterSpacing: "0.3em", textTransform: "uppercase", zIndex: 1 }}>Agencia Inteligente</Typography>

        <style>{`
          @keyframes slide{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
          @keyframes fade{0%,100%{opacity:0.25}50%{opacity:1}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        `}</style>
      </Box>
    );
  }

  const ranges: { key: Range; label: string }[] = [
    { key: "7d", label: "7 días" },
    { key: "30d", label: "30 días" },
    { key: "90d", label: "90 días" },
    { key: "all", label: "Todo" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Panel de Inicio</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>Métricas y datos del CRM</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, next) => next && setRange(next)}>
              {ranges.map((r) => (<ToggleButton key={r.key} value={r.key}>{r.label}</ToggleButton>))}
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" exclusive value={tab} onChange={(_, next) => next && setTab(next)}>
              {(["resumen", "ventas", "proyectos", "clientes", "facturacion"] as Tab[]).map((t) => (<ToggleButton key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</ToggleButton>))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {tab === "resumen" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {kpiCard("Proyectos", totalProyectos, `${proyectosActivos} activos`, "#E91E63")}
              {kpiCard("Clientes", totalClientes, `${clientesActivos} activos`, "#2196F3")}
              {kpiCard("Facturación", totalFacturas, `${facturasPagadas} pagadas`, "#4CAF50")}
              {kpiCard("Pipeline", `$${Number(valorPipeline).toLocaleString("es-CO")}`, `${cotizacionesPendientes} pendientes`, "#9C27B0")}
              {kpiCard("Facturado", `$${Number(valorFacturado).toLocaleString("es-CO")}`, "Facturas emitidas", "#009688")}
              {kpiCard("Tareas", tareasF.length, `${tareasPendientes} pendientes`, "#FF9800")}
            </Box>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Facturación mensual</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={facturacionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="monto" stroke="#E91E63" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Paper sx={{ p: 2, borderRadius: 2, flex: "1 1 300px" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Pipeline por etapa</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelinePorEtapa}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etapa" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="valor" fill="#9C27B0" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 2, flex: "1 1 240px" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Proyectos</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <DoughnutChart data={distribucionProyectos}>
                    <RechartsTooltip />
                    <Legend />
                    <Doughnut dataKey="value" />
                  </DoughnutChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
            <Box>
              <Button variant="outlined" startIcon={<FiDownload size={16} />} onClick={() => handleExport("dashboard_resumen.csv", ["métrica", "valor"], [
                { métrica: "Proyectos", valor: totalProyectos },
                { métrica: "Clientes", valor: totalClientes },
                { métrica: "Facturas", valor: totalFacturas },
                { métrica: "Pipeline", valor: valorPipeline },
                { métrica: "Facturado", valor: valorFacturado },
              ])}>Exportar CSV</Button>
            </Box>
          </Box>
        )}

        {tab === "ventas" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {kpiCard("Pipeline", `$${Number(valorPipeline).toLocaleString("es-CO")}`, "Cotizaciones activas", "#E91E63")}
              {kpiCard("Pendientes", cotizacionesPendientes, "Por cerrar", "#FF9800")}
              {kpiCard("Conversión", cotizacionesF.length ? `${Math.round((cotizacionesF.filter((c: any) => c.estado === "aceptada").length / cotizacionesF.length) * 100)}%` : "0%", "Aceptadas / total", "#4CAF50")}
            </Box>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pipeline por etapa</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelinePorEtapa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etapa" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="valor" fill="#E91E63" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
            <Button variant="outlined" startIcon={<FiDownload size={16} />} onClick={() => handleExport("dashboard_ventas.csv", ["etapa", "valor"], pipelinePorEtapa)}>Exportar CSV</Button>
          </Box>
        )}

        {tab === "proyectos" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {kpiCard("Total", totalProyectos, "Proyectos", "#E91E63")}
              {kpiCard("Activos", proyectosActivos, "En progreso / planificación", "#2196F3")}
            </Box>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Distribución</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <DoughnutChart data={distribucionProyectos}>
                  <RechartsTooltip />
                  <Legend />
                  <Doughnut dataKey="value" />
                </DoughnutChart>
              </ResponsiveContainer>
            </Paper>
            <Button variant="outlined" startIcon={<FiDownload size={16} />} onClick={() => handleExport("dashboard_proyectos.csv", ["id", "nombre", "estado"], proyectosF.map((p: any) => ({ id: p.id, nombre: p.nombre, estado: p.estado })))}>Exportar CSV</Button>
          </Box>
        )}

        {tab === "clientes" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {kpiCard("Total", totalClientes, "Clientes", "#2196F3")}
              {kpiCard("Activos", clientesActivos, "Con estado Activo", "#4CAF50")}
            </Box>
            <Button variant="outlined" startIcon={<FiDownload size={16} />} onClick={() => handleExport("dashboard_clientes.csv", ["id", "nombre", "estado"], clientesF.map((c: any) => ({ id: c.id, nombre: c.nombre, estado: c.estado })))}>Exportar CSV</Button>
          </Box>
        )}

        {tab === "facturacion" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {kpiCard("Total", totalFacturas, "Emitidas", "#4CAF50")}
              {kpiCard("Pagadas", facturasPagadas, "Cobradas", "#009688")}
              {kpiCard("Vencidas", facturasVencidas, "Requieren gestión", "#f44336")}
              {kpiCard("Monto", `$${Number(valorFacturado).toLocaleString("es-CO")}`, "Suma total", "#FF9800")}
            </Box>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Facturación mensual</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={facturacionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="monto" stroke="#4CAF50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
            <Button variant="outlined" startIcon={<FiDownload size={16} />} onClick={() => handleExport("dashboard_facturacion.csv", ["id", "estado", "monto"], facturasF.map((f: any) => ({ id: f.id, estado: f.estado, monto: Number((f as any).total || (f as any).monto || 0) })))}>Exportar CSV</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
