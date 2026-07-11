import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState } from "react";
import { Box, Typography, Button, Paper, TextField, Alert } from "@mui/material";
import { authService } from "../services/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await authService.signIn(email, password);
      if (error) {
        setError(error.message ?? "Credenciales inválidas");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        bgcolor: "#0b0c10",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(233,30,99,0.18) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)",
          filter: "blur(14px)",
        }}
      />
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 420,
          width: "92%",
          borderRadius: 6,
          bgcolor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)",
          p: { xs: 3, sm: 5 },
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: 6,
              color: "#e91e63",
              textTransform: "uppercase",
            }}
          >
            DESEO
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              letterSpacing: 8,
              color: "#ffffff",
              mt: 0.5,
            }}
          >
            DIGITAL
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: 1.2,
            }}
          >
            Agencia Inteligente
          </Typography>
          <Box
            sx={{
              width: 64,
              height: 3,
              bgcolor: "#e91e63",
              mx: "auto",
              my: 3,
              borderRadius: 1,
            }}
          />
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mb: 1 }}>
            Inicia sesión para continuar
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)" }}>
            Gestiona clientes, proyectos y operaciones en un solo lugar.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiInputBase-root": { color: "#fff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              "& .MuiInputBase-input": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiInputBase-root": { color: "#fff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              "& .MuiInputBase-input": { color: "#fff" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            }}
          />
          {error && (
            <Alert severity="error" sx={{ bgcolor: "rgba(211,47,47,0.15)", color: "#ff8a80" }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              bgcolor: "#e91e63",
              color: "#ffffff",
              fontWeight: 700,
              py: 1.3,
              letterSpacing: 1,
              "&:hover": { bgcolor: "#c2185b" },
              "&.Mui-disabled": { bgcolor: "rgba(233,30,99,0.5)" },
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}