import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiFileText, FiX } from "react-icons/fi";
import { facturasService } from "../services/database";
import { useCRMStore } from "../store/useCRMStore";
import { useNotificationStore } from "../store/useNotificationStore";

export function meta() {
  return [{ title: "Facturación | CRM Agencia" }];
}

export default function Facturacion() {
  const facturas = useCRMStore((s) => s.facturas);
  const fetchFacturas = useCRMStore((s) => s.fetchFacturas);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ numero_factura: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "" });
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotificationStore();

  const load = async () => {
    try { setLoading(true); setError(null); await fetchFacturas(); }
    catch (err: any) { setError(err.message || "Error al cargar facturas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ numero_factura: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "" });
    setOpenModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ numero_factura: row.numero_factura || "", estado: row.estado || "Borrador", total: String(row.total ?? ""), proyecto_id: row.proyecto_id || "", cliente_id: row.cliente_id ? String(row.cliente_id) : "", fecha_vencimiento: row.fecha_vencimiento || "" });
    setOpenModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, total: Number(form.total || 0), cliente_id: form.cliente_id ? Number(form.cliente_id) : null, proyecto_id: form.proyecto_id || null, fecha_vencimiento: form.fecha_vencimiento || null };
      if (editing) { await facturasService.update(editing.id, payload); showNotification("Factura actualizada", "success"); }
      else { await facturasService.create(payload); showNotification("Factura creada", "success"); }
      setOpenModal(false); await load();
    } catch (err: any) { showNotification(err.message || "Error guardando factura", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`¿Eliminar factura #${row.id}?`)) return;
    try { await facturasService.delete(row.id); await load(); showNotification("Factura eliminada", "success"); }
    catch (err: any) { showNotification(err.message || "Error eliminando factura", "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <FiFileText size={22} color="#009688" />
        <Typography variant="h6" sx={{ color: "#009688", fontWeight: "bold", flex: 1 }}>Facturación</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={load} disabled={loading}>Recargar</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={16} />} onClick={openCreate}>Nueva</Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`${facturas.length} facturas`} size="small" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
      ) : facturas.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}><Typography color="text.secondary">No hay facturas registradas.</Typography></Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {facturas.slice(0, 20).map((f: any) => (
            <Paper key={f.id} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Factura #{f.id}</Typography>
                <Typography variant="caption" color="text.secondary">{f.numero_factura || ""}</Typography>
              </Box>
              <Chip size="small" label={f.estado || "Borrador"} />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>${Number(f.total || 0).toFixed(0)}</Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button size="small" onClick={() => openEdit(f)}>Editar</Button>
                <Button size="small" color="error" onClick={() => handleDelete(f)}>Eliminar</Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar Factura" : "Nueva Factura"}<IconButton onClick={() => setOpenModal(false)} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField label="Número factura" fullWidth value={form.numero_factura} onChange={(e) => setForm({ ...form, numero_factura: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={form.estado} label="Estado" onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <MenuItem value="Borrador">Borrador</MenuItem>
                <MenuItem value="Enviada">Enviada</MenuItem>
                <MenuItem value="Pagada">Pagada</MenuItem>
                <MenuItem value="Vencida">Vencida</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Total" fullWidth value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            <TextField label="Cliente ID" fullWidth value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} />
            <TextField label="Proyecto ID" fullWidth value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })} />
            <TextField label="Fecha vencimiento" type="date" fullWidth value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} InputLabelProps={{ shrink: true }} />
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
