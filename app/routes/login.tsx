import { Outlet, useNavigate, useLocation } from "react-router";
import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";

export default function Login() {
  const navigate = useNavigate();

  const handleAbrirPanel = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("crm_logged_in", "true");
    }
    navigate("/");
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
          maxWidth: 500,
          width: "92%",
          borderRadius: 6,
          bgcolor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)",
          p: { xs: 4, sm: 6 },
          textAlign: "center",
        }}
      >
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
            mt: 1.5,
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
            my: 4,
            borderRadius: 1,
          }}
        />
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mb: 1 }}>
          Bienvenido al panel principal
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mb: 4 }}>
          Accede para gestionar clientes, proyectos y operaciones.
        </Typography>
        <Button
          variant="contained"
          onClick={handleAbrirPanel}
          fullWidth
          sx={{
            bgcolor: "#e91e63",
            color: "#ffffff",
            fontWeight: 700,
            py: 1.4,
            letterSpacing: 1,
            "&:hover": { bgcolor: "#c2185b" },
          }}
        >
          Abrir panel
        </Button>
      </Paper>
    </Box>
  );
}