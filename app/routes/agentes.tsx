import { Outlet, useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { agentesService } from "../services/agentes";
import type { Agente } from "../types/crm";
import {
  Box, Typography, Paper, Button, TextField, Chip, Stack, Tooltip, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Switch, CircularProgress
} from "@mui/material";
import { FiPlus, FiEdit3, FiTrash2, FiX } from "react-icons/fi";

export function meta() {
  return [{ title: "Agentes | CRM Agencia" }];
}

const tipos = [
  { value: "ventas", label: "Ventas" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "facturacion", label: "Facturación" },
  { value: "soporte", label: "Soporte" },
  { value: "custom", label: "Custom" },
] as const;

const triggers = [
  { value: "manual", label: "Manual" },
  { value: "evento", label: "Evento" },
  { value: "cron", label: "Cron" },
  { value: "webhook", label: "Webhook" },
] as const;

const RUTAS_DISPONIBLES = [
  { value: "/clientes", label: "Clientes" },
  { value: "/servicios", label: "Servicios" },
  { value: "/ventas", label: "Ventas" },
  { value: "/tareas", label: "Tareas" },
  { value: "/proyectos", label: "Proyectos" },
  { value: "/facturacion", label: "Facturación" },
  { value: "/email-marketing", label: "Email Marketing" },
  { value: "/chatbot", label: "Chatbot" },
  { value: "/calendario", label: "Calendario" },
  { value: "/reportes", label: "Reportes" },
  { value: "/estimador", label: "Estimador" },
  { value: "/equipo", label: "Equipo" },
  { value: "/contratos", label: "Contratos" },
  { value: "/agentes", label: "Agentes" },
  { value: "/configuracion", label: "Configuración" },
] as const;

export default function Agentes() {
  const [items, setItems] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agente | null>(null);
  const [form, setForm] = useState({
    nombre: "", descripcion: "", tipo: "ventas" as Agente["tipo"],
    estado: "borrador" as Agente["estado"], prompts: "", herramientas: "",
    trigger: "manual" as Agente["trigger"], activo: false, rutas_activas: [] as string[]
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await agentesService.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ nombre: "", descripcion: "", tipo: "ventas", estado: "borrador", prompts: "", herramientas: "", trigger: "manual", activo: false, rutas_activas: [] });
    setOpen(true);
  };

  const openEdit = (row: Agente) => {
    setEditing(row);
    setForm({
      nombre: row.nombre, descripcion: row.descripcion ?? "", tipo: row.tipo,
      estado: row.estado, prompts: [...(row.prompts ?? [])].join("\n"),
      herramientas: [...(row.herramientas ?? [])].join("\n"),
      trigger: row.trigger, activo: row.activo, rutas_activas: row.rutas_activas ?? []
    });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      estado: form.estado,
      prompts: form.prompts.split("\n").map(s => s.trim()).filter(Boolean),
      herramientas: form.herramientas.split("\n").map(s => s.trim()).filter(Boolean),
      trigger: form.trigger,
      activo: form.activo,
      rutas_activas: form.rutas_activas,
    };
    if (!payload.nombre) return;
    if (editing) {
      await agentesService.update(editing.id, payload);
    } else {
      await agentesService.create({
        ...payload,
        ultima_ejecucion: null,
        metricas: { ejecuciones: 0, exito: 0, fallos: 0 },
      });
    }
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await agentesService.remove(id);
    await load();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>Agentes</Typography>
          <Typography variant="body2" color="text.secondary">Configura y opera tus agentes automatizables.</Typography>
        </Box>
        <Button variant="contained" startIcon={<FiPlus />} onClick={openNew}>Nuevo agente</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Trigger</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell>Rutas</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{a.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.descripcion}</Typography>
                    </TableCell>
                    <TableCell><SafeChip size="small" label={a.tipo} /></TableCell>
                    <TableCell><SafeChip size="small" label={a.estado} color={a.estado === "activo" ? "success" : a.estado === "pausado" ? "warning" : "default"} /></TableCell>
                    <TableCell><SafeChip size="small" label={a.trigger} variant="outlined" /></TableCell>
                    <TableCell><Switch size="small" checked={a.activo} onChange={async (_, checked) => { await agentesService.update(a.id, { activo: checked }); load(); }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {(a.rutas_activas ?? []).map((ruta) => {
                          const found = RUTAS_DISPONIBLES.find(r => r.value === ruta);
                          return <SafeChip key={ruta} size="small" label={found ? found.label : ruta} variant="outlined" sx={{ fontSize: "0.7rem", height: 24 }} />;
                        })}
                        {(!a.rutas_activas || a.rutas_activas.length === 0) && <Typography variant="caption" color="text.secondary">—</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(a)}><FiEdit3 /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => remove(a.id)}><FiTrash2 /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>Sin agentes creados.</Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {editing ? "Editar agente" : "Nuevo agente"}
          <IconButton onClick={() => setOpen(false)}><FiX /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Nombre" fullWidth value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextField label="Descripción" fullWidth multiline minRows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
                  {tipos.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Trigger</InputLabel>
                <Select label="Trigger" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as any })}>
                  {triggers.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ width: "100%", color: "text.secondary" }}>Rutas activas:</Typography>
              {RUTAS_DISPONIBLES.map((r) => {
                const active = form.rutas_activas.includes(r.value);
                return (
                  <Chip
                    key={r.value}
                    label={r.label}
                    size="small"
                    onClick={() => setForm({ ...form, rutas_activas: active ? form.rutas_activas.filter(x => x !== r.value) : [...form.rutas_activas, r.value] })}
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    sx={{ fontWeight: 600 }}
                  />
                );
              })}
            </Box>
            <TextField label="Prompts" fullWidth multiline minRows={3} value={form.prompts} onChange={(e) => setForm({ ...form, prompts: e.target.value })} helperText="Uno por línea" />
            <TextField label="Herramientas" fullWidth multiline minRows={2} value={form.herramientas} onChange={(e) => setForm({ ...form, herramientas: e.target.value })} helperText="Uno por línea" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { SafeChip } from "../components/SafeChip";
