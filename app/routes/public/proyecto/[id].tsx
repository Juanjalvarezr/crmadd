import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Stack, Alert, Button, Divider, List, ListItem, ListItemText
} from "@mui/material";
import { FiArrowLeft, FiFileText, FiDollarSign, FiCalendar, FiUser } from "react-icons/fi";
import { proyectosService, facturasService } from "../../../../services/database";

export function meta() {
  return [{ title: "Proyecto | DESEO DIGITAL" }, { name: "description", content: "Vista pública del proyecto" }];
}

export default function PublicProyecto() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<any | null>(null);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [proys, facs] = await Promise.all([proyectosService.getAll(), facturasService.getAll()]);
        const found = (proys as any[]).find(p => String(p.id) === String(id));
        if (!found) { setError("Proyecto no encontrado"); setLoading(false); return; }
        setProyecto(found);
        setFacturas((facs as any[]).filter(f => String(f.proyecto_id) === String(id)));
      } catch (e: any) { setError(e?.message || "Error"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Box sx={{ p: 4 }}><Typography>Cargando vista pública…</Typography></Box>;
  if (error || !proyecto) return <Box sx={{ p: 4 }}><Alert severity="error">{error || "No disponible"}</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="text" startIcon={<FiArrowLeft />} component={Link} to="/proyectos">Volver</Button>
      </Stack>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <FiFileText />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{proyecto.nombre}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip label={proyecto.estado} color={proyecto.estado === 'completado' ? 'success' : 'primary'} size="small" />
          <Chip label={`Prioridad: ${proyecto.prioridad}`} variant="outlined" size="small" />
          <Chip label={`Progreso: ${ proyecto.progreso ?? 0 }%`} color={ (proyecto.progreso ?? 0) === 100 ? 'success' : 'warning'} size="small" />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography variant="body2"><FiUser style={{ display: 'inline', marginRight: 8 }} />Cliente: {proyecto.cliente_id || 'Sin asignar'}</Typography>
          <Typography variant="body2"><FiCalendar style={{ display: 'inline', marginRight: 8 }} />Inicio: {new Date(proyecto.fecha_inicio || Date.now()).toLocaleDateString('es-CO')} · Fin: {new Date(proyecto.fecha_fin || Date.now()).toLocaleDateString('es-CO')}</Typography>
          <Typography variant="body2"><FiDollarSign style={{ display: 'inline', marginRight: 8 }} />Presupuesto: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(proyecto.presupuesto || 0))}</Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Facturas asociadas</Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <List disablePadding>
            {facturas.length === 0 && <ListItem><ListItemText primary="Sin facturas" /></ListItem>}
            {facturas.map(f => (
              <ListItem key={f.id} divider>
                <ListItemText primary={f.numero || `Factura #${f.id}`} secondary={`Valor: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(f.valor || 0))} · Estado: ${f.estado}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Paper>
    </Box>
  );
}
