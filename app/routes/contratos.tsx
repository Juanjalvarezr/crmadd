import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiFileText, FiX } from "react-icons/fi";
import { contratosService } from "../services/supabase";
import { useCRMStore } from "../store/useCRMStore";
import { useNotificationStore } from "../store/useNotificationStore";

export function meta() {
  return [{ title: "Contratos | CRM Agencia" }];
}

export default function Contratos() {
  const contratos = useCRMStore((s) => s.contratos);
  const fetchContratos = useCRMStore((s) => s.fetchContratos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ estado: "Activo", valor: "", proyecto_id: "", cliente_id: "", factura_id: "", fecha_inicio: "", fecha_fin: "" });
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotificationStore();

  const load = async () => {
    try { setLoading(true); setError(null); await fetchContratos(); }
    catch (err: any) { setError(err.message || "Error al cargar contratos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ estado: "Activo", valor: "", proyecto_id: "", cliente_id: "", factura_id: "", fecha_inicio: "", fecha_fin: "" });
    setOpenModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ estado: row.estado || "Activo", valor: String(row.valor ?? ""), proyecto_id: row.proyecto_id || "", cliente_id: row.cliente_id ? String(row.cliente_id) : "", factura_id: row.factura_id ? String(row.factura_id) : "", fecha_inicio: row.fecha_inicio || "", fecha_fin: row.fecha_fin || "" });
    setOpenModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, valor: Number(form.valor || 0), cliente_id: form.cliente_id ? Number(form.cliente_id) : null, proyecto_id: form.proyecto_id || null, factura_id: form.factura_id ? Number(form.factura_id) : null, fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null };
      if (editing) { await contratosService.update(editing.id, payload); showNotification("Contrato actualizado", "success"); }
      else { await contratosService.create(payload); showNotification("Contrato creado", "success"); }
      setOpenModal(false); await load();
    } catch (err: any) { showNotification(err.message || "Error guardando contrato", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar contrato #${row.id}?`)) return;
    try { await contratosService.delete(row.id); await load(); showNotification("Contrato eliminado", "success"); }
    catch (err: any) { showNotification(err.message || "Error eliminando contrato", "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header compacto mobile */}
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Contratos</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={loadContratos} disabled={loading}>Recargar</Button>
          <Button size="small" variant="contained" startIcon={<FiPlus />} onClick={openCreate}>Nuevo</Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`${contratos.length} contratos`} size="small" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
      ) : contratos.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}><Typography color="text.secondary">No hay contratos registrados.</Typography></Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {contratos.slice(0, 20).map((c: any) => (
            <Paper key={c.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Contrato #{c.id}</Typography>
                <Typography variant="caption" color="text.secondary">{c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : ""}</Typography>
              </Box>
              <Chip size="small" label={c.estado || "Activo"} />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>${Number(c.valor || 0).toFixed(0)}</Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button size="small" onClick={() => openEdit(c)}>Editar</Button>
                <Button size="small" color="error" onClick={() => handleDelete(c)}>Eliminar</Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar Contrato" : "Nuevo Contrato"}<IconButton onClick={() => setOpenModal(false)} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={form.estado} label="Estado" onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Finalizado">Finalizado</MenuItem>
                <MenuItem value="Cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Valor" fullWidth value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            <TextField label="Cliente ID" fullWidth value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} />
            <TextField label="Proyecto ID" fullWidth value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })} />
            <TextField label="Factura ID" fullWidth value={form.factura_id} onChange={(e) => setForm({ ...form, factura_id: e.target.value })} />
            <TextField label="Fecha inicio" type="date" fullWidth value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha fin" type="date" fullWidth value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
