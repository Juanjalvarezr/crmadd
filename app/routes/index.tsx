import { useEffect } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { useCRMStore } from "../store/useCRMStore";

export function meta() {
  return [{ title: "Inicio | CRM DESEO DIGITAL" }];
}

export default function Index() {
  const navigate = useNavigate();
  const { user } = useCRMStore();

  useEffect(() => {
    if (user) navigate("/proyectos", { replace: true });
  }, [user, navigate]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>CRM DESEO DIGITAL</h1>
        <p style={{ color: "#666", marginTop: 8 }}>Agencia Inteligente</p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/proyectos"><button style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#E91E63", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Ir a Proyectos</button></Link>
          <Link to="/clientes"><button style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#333", fontWeight: 600, cursor: "pointer" }}>Ver Clientes</button></Link>
        </div>
      </div>
    </div>
  );
}
