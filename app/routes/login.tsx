import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { authService } from "../services/database";

export function meta() {
  return [{ title: "CRM DESEO DIGITAL · Ingreso" }];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.session()
      .then(session => {
        if (!mounted) return;
        if (session) navigate("/", { replace: true });
        else setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.error) throw new Error(result.error.message || "Credenciales inválidas");
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error al ingresar");
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f0f13", color: "#fff", fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f0f13,#1a1224)", color: "#fff", padding: 24, fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#14141a", border: "1px solid #2a2a35", borderRadius: 20, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.45)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 1 }}>CRM</div>
          <div style={{ color: "#d1d1d6", fontSize: 14, marginTop: 6 }}>DESEO DIGITAL · Ingreso seguro</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0c0c11", color: "#fff", border: "1px solid #2a2a35", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#0c0c11", color: "#fff", border: "1px solid #2a2a35", outline: "none" }}
            />
          </div>

          {error && <div style={{ color: "#ff8a8a", fontSize: 13, background: "#2a1414", border: "1px solid #3a2020", padding: "10px 12px", borderRadius: 12 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg,#c026d3,#9333ea)",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div style={{ marginTop: 18, color: "#a1a1aa", fontSize: 12, textAlign: "center" }}>
          Acceso exclusivo para DESEO DIGITAL
        </div>
      </div>
    </div>
  );
}
