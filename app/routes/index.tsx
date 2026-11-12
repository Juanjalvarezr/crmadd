import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import { supabase } from "../services/supabase";

export function meta() {
  return [{ title: "CRM DESEO DIGITAL" }];
}

// Ruta "/" liviana: solo decide a dónde ir. Evita descargar el chunk
// pesado del dashboard (recharts) a los visitantes sin sesión.
export default function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        navigate(data.session ? "/dashboard" : "/login", { replace: true });
      })
      .catch(() => {
        if (alive) navigate("/login", { replace: true });
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={40} sx={{ color: "#e91e63" }} />
    </Box>
  );
}
