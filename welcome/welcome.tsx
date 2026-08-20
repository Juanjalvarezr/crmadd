import { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, Card, CardContent, Button } from "@mui/material";
import { FiUsers, FiFolder, FiCheckCircle, FiDollarSign } from "react-icons/fi";
import { clientesService, proyectosService, facturasService } from "../services/supabase";

export default function Welcome() {
  const [stats, setStats] = useState({ clientes: 0, proyectos: 0, facturas: 0, ingresos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clientes, proyectos, facturas] = await Promise.all([
          clientesService.getAll(),
          proyectosService.getAll(),
          facturasService.getAll()
        ]);
        const ingresos = (facturas || []).reduce((s: number, f: any) => s + (Number(f.total) || 0), 0);
        setStats({
          clientes: (clientes || []).length,
          proyectos: (proyectos || []).length,
          facturas: (facturas || []).length,
          ingresos
        });
      } catch (err: any) {
        setError(err?.message || "Error al cargar la bienvenida");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, borderRadius: 2, background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)", color: "common.white" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", fontSize: { xs: "1.1rem", sm: "1.4rem" } }}>Bienvenido a DESEO DIGITAL</Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5 }}>Tu CRM está listo. Acá tenés un resumen real del negocio.</Typography>
      </Paper>

      {error && <Paper sx={{ p: 1.5, mb: 2, borderLeft: "3px solid #f44336" }}><Typography color="error">{error}</Typography></Paper>}

      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <Grid container spacing={{ xs: 1, sm: 1.5 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Clientes</Typography>
                <Typography variant="h6">{stats.clientes}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Proyectos</Typography>
                <Typography variant="h6">{stats.proyectos}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Facturas</Typography>
                <Typography variant="h6">{stats.facturas}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Ingresos</Typography>
                <Typography variant="h6">${stats.ingresos.toLocaleString("es-CO")}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
