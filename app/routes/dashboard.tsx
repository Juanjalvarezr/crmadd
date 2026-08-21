import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Inicio | CRM DESEO DIGITAL" }];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { proyectos, clientes, facturas } = useCRMStore();
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (intro) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff", gap: 24
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 24, background: "linear-gradient(135deg,#E91E63,#9C27B0)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 800,
          animation: "pulse 1.2s ease-in-out infinite"
        }}>DD</div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>DESEO DIGITAL</h1>
        <p style={{ color: "#aaa", fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase" }}>Agencia Inteligente</p>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.85}}`}</style>
      </div>
    );
  }

  const stats = [
    { label: "Proyectos", value: proyectos.length, to: "/proyectos", color: "#E91E63" },
    { label: "Clientes", value: clientes.length, to: "/clientes", color: "#2196F3" },
    { label: "Facturas", value: facturas.length, to: "/facturacion", color: "#4CAF50" },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>Panel de Inicio</h1>
          <p style={{ color: "#666", marginTop: 4 }}>Resumen del CRM en un vistazo</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {stats.map((s) => (
            <button key={s.label} onClick={() => navigate(s.to)} style={{
              background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 20, cursor: "pointer",
              textAlign: "left", transition: "all .2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Proyectos", "Clientes", "Ventas", "Tareas", "Facturación", "Cotizaciones", "Documentos", "Calendario"].map((tab) => (
            <button key={tab} onClick={() => navigate(`/${tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)} style={{
              padding: "8px 14px", borderRadius: 999, border: "1px solid #e5e5e5", background: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#333"
            }}>{tab}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
