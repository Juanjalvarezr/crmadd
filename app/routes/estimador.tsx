import { useState } from "react";
import { Box, Typography, Paper, TextField, Button, Chip, Stack, Alert, Snackbar } from "@mui/material";
import { FiZap, FiSend } from "react-icons/fi";
import { aiService } from "../services/ai";

export default function Estimador() {
  const [alcance, setAlcance] = useState("");
  const [servicios, setServicios] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    setLoading(true);
    setResultado("");
    try {
      const prompt = `Genera estimación de proyecto: Alcance: ${alcance}. Servicios: ${servicios}. Devuelve JSON con { presupuestoCOP, plazoDias, cronograma: string[], riesgos: string[] }.`;
      const texto = await aiService.generarPropuesta({
        clienteNombre: "Estimación Interna",
        clienteEmpresa: "",
        servicios: servicios.split(",").map((s) => s.trim()).filter(Boolean),
        notasAdicionales: `Alcance: ${alcance}`,
      });
      setResultado(typeof texto === "string" ? texto : JSON.stringify(texto, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Estimador de Proyectos</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <TextField label="Alcance" multiline rows={4} value={alcance} onChange={(e) => setAlcance(e.target.value)} />
          <TextField label="Servicios separados por coma" value={servicios} onChange={(e) => setServicios(e.target.value)} />
          <Button variant="contained" startIcon={<FiZap />} onClick={generar} disabled={!alcance || !servicios || loading}>
            {loading ? "Calculando..." : "Generar estimación"}
          </Button>
        </Stack>
      </Paper>

      {resultado && (
        <Paper sx={{ mt: 3, p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", whiteSpace: "pre-wrap" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Resultado</Typography>
          {resultado}
        </Paper>
      )}
    </Box>
  );
}
