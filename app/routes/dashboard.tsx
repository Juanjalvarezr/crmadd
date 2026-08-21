import { useState, useEffect } from "react";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Inicio | CRM DESEO DIGITAL" }];
}

type Tab = "resumen" | "ventas" | "proyectos" | "clientes" | "facturacion";

export default function Dashboard() {
    const { proyectos, clientes, facturas } = useCRMStore();
  const [tab, setTab] = useState<Tab>("resumen");
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const totalProyectos = proyectos.length;
  const proyectosActivos = proyectos.filter((p: any) => p.estado === "en_progreso" || p.estado === "planificacion").length;
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter((c: any) => c.estado === "Activo").length;
  const totalCotizaciones = 0;
  const cotizacionesPendientes = 0;
  const totalFacturas = facturas.length;
  const facturasPagadas = facturas.filter((f: any) => f.estado === "pagada").length;
  const facturasVencidas = facturas.filter((f: any) => f.estado === "vencida").length;

  const valorPipeline = 0;
  const valorFacturado = facturas.reduce((acc: number, f: any) => acc + Number((f as any).total || (f as any).monto || 0), 0);

  if (intro) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff", gap: 24, overflow: "hidden", position: "relative"
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "radial-gradient(circle at 20% 30%, #E91E63 0%, transparent 45%), radial-gradient(circle at 80% 70%, #9C27B0 0%, transparent 45%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #E91E63, #9C27B0, transparent)", animation: "slide 1.6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #9C27B0, #E91E63, transparent)", animation: "slide 1.6s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", width: 1, height: 120, background: "linear-gradient(180deg, transparent, #E91E63, transparent)", animation: "fade 1.6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", width: 1, height: 120, background: "linear-gradient(180deg, transparent, #9C27B0, transparent)", animation: "fade 1.6s ease-in-out infinite reverse" }} />

        <div style={{
          width: 130, height: 130, borderRadius: 28, background: "linear-gradient(135deg,#E91E63,#9C27B0)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 800,
          boxShadow: "0 20px 60px rgba(233,30,99,0.35)", animation: "float 2.2s ease-in-out infinite", zIndex: 1
        }}>DD</div>

        <h1 style={{ fontSize: "2.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", zIndex: 1 }}>DESEO DIGITAL</h1>
        <p style={{ color: "#bbb", fontSize: 14, letterSpacing: "0.3em", textTransform: "uppercase", zIndex: 1 }}>Agencia Inteligente</p>

        <style>{`
          @keyframes slide{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
          @keyframes fade{0%,100%{opacity:0.25}50%{opacity:1}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        `}</style>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "ventas", label: "Ventas" },
    { key: "proyectos", label: "Proyectos" },
    { key: "clientes", label: "Clientes" },
    { key: "facturacion", label: "Facturación" },
  ];

  const kpiCard = (title: string, value: string | number, sub: string, color: string) => (
    <div style={{
      background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: 18, flex: "1 1 200px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>Panel de Inicio</h1>
            <p style={{ color: "#666", marginTop: 4 }}>Métricas y datos del CRM</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "8px 14px", borderRadius: 999, border: "1px solid " + (tab === t.key ? "#E91E63" : "#e5e5e5"),
                background: tab === t.key ? "#E91E63" : "#fff", color: tab === t.key ? "#fff" : "#333",
                fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === "resumen" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {kpiCard("Proyectos", totalProyectos, `${proyectosActivos} activos`, "#E91E63")}
            {kpiCard("Clientes", totalClientes, `${clientesActivos} activos`, "#2196F3")}
            {kpiCard("Cotizaciones", totalCotizaciones, `${cotizacionesPendientes} pendientes`, "#FF9800")}
            {kpiCard("Facturación", totalFacturas, `${facturasPagadas} pagadas`, "#4CAF50")}
            {kpiCard("Valor Pipeline", `$${Number(valorPipeline).toLocaleString("es-CO")}`, "Cotizaciones activas", "#9C27B0")}
            {kpiCard("Valor Facturado", `$${Number(valorFacturado).toLocaleString("es-CO")}`, "Facturas emitidas", "#009688")}
          </div>
        )}

        {tab === "ventas" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {kpiCard("Pipeline", valorPipeline, "Valor total cotizaciones", "#E91E63")}
            {kpiCard("Pendientes", cotizacionesPendientes, "Cotizaciones por cerrar", "#FF9800")}
            {kpiCard("Conversión", "0%", "Aceptadas / total", "#4CAF50")}
          </div>
        )}

        {tab === "proyectos" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {kpiCard("Total", totalProyectos, "Proyectos registrados", "#E91E63")}
            {kpiCard("Activos", proyectosActivos, "En progreso / planificación", "#2196F3")}
          </div>
        )}

        {tab === "clientes" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {kpiCard("Total", totalClientes, "Clientes registrados", "#2196F3")}
            {kpiCard("Activos", clientesActivos, "Con estado Activo", "#4CAF50")}
          </div>
        )}

        {tab === "facturacion" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {kpiCard("Total", totalFacturas, "Facturas emitidas", "#4CAF50")}
            {kpiCard("Pagadas", facturasPagadas, "Cobradas", "#009688")}
            {kpiCard("Vencidas", facturasVencidas, "Requieren gestión", "#f44336")}
            {kpiCard("Monto facturado", `$${Number(valorFacturado).toLocaleString("es-CO")}`, "Suma total", "#FF9800")}
          </div>
        )}
      </div>
    </div>
  );
}
