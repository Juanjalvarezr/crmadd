import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Stack, Alert, Button, Divider, Tabs, Tab, List, ListItem, ListItemText, Avatar, IconButton
} from "@mui/material";
import {
  FiArrowLeft, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiFileText,
  FiDollarSign, FiCheckSquare, FiFolder, FiMessageSquare, FiEye
} from "react-icons/fi";
import {
  clientesService, proyectosService, facturasService, contratosService, tareasService
} from "../../services/database";
import SafeChip from "../../components/SafeChip";
import { formatCOP } from "../../services/pdf";

interface ClienteDetalle {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  nicho?: string;
  estado?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  website?: string;
  origen?: string;
  ultima_interaccion?: string;
}

export function meta() {
  return [{ title: "Cliente | DESEO DIGITAL" }, { name: "description", content: "Vista 360° del cliente" }];
}

export default function Cliente360() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cls, proys, facs, conts, tasks] = await Promise.all([
          clientesService.getAll(),
          proyectosService.getAll(),
          facturasService.getAll(),
          contratosService.getAll(),
          tareasService.getAll(),
        ]);
        const found = (cls as ClienteDetalle[]).find(c => String(c.id) === String(id));
        if (!found) { setError("Cliente no encontrado"); setLoading(false); return; }
        setCliente(found);
        setProyectos((proys as any[]).filter((p: any) => String(p.cliente_id) === String(id)));
        setFacturas((facs as any[]).filter((f: any) => String(f.cliente_id) === String(id)));
        setContratos((conts as any[]).filter((c: any) => String(c.cliente_id) === String(id)));
        setTareas((tasks as any[]).filter((t: any) => String(t.cliente_id) === String(id)));
      } catch (e: any) { setError(e?.message || "Error"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <Box sx={{ p: 4 }}><Typography>Cargando vista 360°…</Typography></Box>;
  if (error || !cliente) return <Box sx={{ p: 4 }}><Alert severity="error">{error || "No disponible"}</Alert></Box>;

  const tabs = [
    { label: 'Resumen', icon: <FiUser /> },
    { label: `Proyectos (${proyectos.length})`, icon: <FiFolder /> },
    { label: `Facturas (${facturas.length})`, icon: <FiFileText /> },
    { label: `Contratos (${contratos.length})`, icon: <FiFileText /> },
    { label: `Tareas (${tareas.length})`, icon: <FiCheckSquare /> },
  ];

  const wa = `https://wa.me/${(cliente.telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + cliente.nombre)}`;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Button variant="text" startIcon={<FiArrowLeft />} component={Link} to="/clientes">Volver</Button>
        <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
          {cliente.telefono && (
            <IconButton size="small" color="success" component="a" href={wa} target="_blank" rel="noreferrer">
              <FiMessageSquare />
            </IconButton>
          )}
          {cliente.email && (
            <IconButton size="small" component="a" href={`mailto:${cliente.email}`}>
              <FiMail />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            {(cliente.nombre || cliente.empresa || '?').slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{cliente.nombre}</Typography>
            <Typography variant="body2" color="text.secondary">{cliente.empresa} {cliente.nicho && <SafeChip label={cliente.nicho} size="small" sx={{ ml: 1 }} />}</Typography>
          </Box>
          <Chip label={cliente.estado || 'Activo'} color={cliente.estado === 'Activo' ? 'success' : 'default'} size="small" sx={{ ml: 'auto' }} />
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {cliente.email && <Typography variant="body2"><FiMail style={{ display: 'inline', marginRight: 6 }} />{cliente.email}</Typography>}
          {cliente.telefono && <Typography variant="body2"><FiPhone style={{ display: 'inline', marginRight: 6 }} />{cliente.telefono}</Typography>}
          {cliente.ciudad && <Typography variant="body2"><FiMapPin style={{ display: 'inline', marginRight: 6 }} />{cliente.ciudad}</Typography>}
          {cliente.website && (
            <Button size="small" variant="text" href={cliente.website} target="_blank" rel="noreferrer">
              <FiEye style={{ marginRight: 4 }} />Web
            </Button>
          )}
          <Button size="small" variant="outlined" startIcon={<FiCalendar />} onClick={async () => {
            const url = 'https://meet.google.com/new';
            try { await navigator.clipboard?.writeText(url); } catch {}
            window.open(url, '_blank');
          }}>Agendar reunión</Button>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Resumen financiero</Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${proyectos.length} proyectos`} color="primary" size="small" />
            <Chip label={`${tareas.length} tareas`} color="warning" size="small" />
            <Chip label={`${facturas.length} facturas`} color="success" size="small" />
            <Chip label={`${contratos.length} contratos`} color="secondary" size="small" />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            Origen: {cliente.origen || '-'} · Última interacción: {cliente.ultima_interaccion ? new Date(cliente.ultima_interaccion).toLocaleDateString('es-CO') : '-'}
          </Typography>
        </Paper>
      )}

      {tab === 1 && (
        <Stack spacing={1}>
          {proyectos.length === 0 && <Alert severity="info">Sin proyectos</Alert>}
          {proyectos.map((p: any) => (
            <Paper key={p.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FiFolder />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                <Chip label={p.estado} size="small" color={p.estado === 'completado' ? 'success' : 'primary'} />
                <Typography variant="caption" color="text.secondary">{p.prioridad}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={1}>
          {facturas.length === 0 && <Alert severity="info">Sin facturas</Alert>}
          {facturas.map((f: any) => (
            <Paper key={f.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>#{f.numero || f.id}</Typography>
                  <Typography variant="caption" color="text.secondary">{f.estado} · {f.fecha_emision || 'sin fecha'}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCOP(f.valor || f.total || 0)}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {tab === 3 && (
        <Stack spacing={1}>
          {contratos.length === 0 && <Alert severity="info">Sin contratos</Alert>}
          {contratos.map((c: any) => (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.titulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.tipo} · {c.estado}</Typography>
                </Box>
                <Chip label={`v${c.version || 1}`} size="small" variant="outlined" />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {tab === 4 && (
        <Stack spacing={1}>
          {tareas.length === 0 && <Alert severity="info">Sin tareas</Alert>}
          {tareas.map((t: any) => (
            <Paper key={t.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <SafeChip label={t.estado} size="small" color={t.estado === 'Completada' ? 'success' : 'default'} />
                  <Typography variant="body2">{t.titulo}</Typography>
                </Box>
                <Chip label={t.prioridad} size="small" variant="outlined" />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
