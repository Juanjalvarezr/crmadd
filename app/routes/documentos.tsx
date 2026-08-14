import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress, Alert } from "@mui/material";
import { FiFileText, FiPlus, FiX, FiEye, FiDownload, FiUpload } from "react-icons/fi";
import { documentosService } from "../services/supabase";
import { useNotificationStore } from "../store/useNotificationStore";

export function meta() {
  return [{ title: "Documentos | CRM Agencia" }];
}

export default function Documentos() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ titulo: "", tipo: "propuesta", proyecto_id: "", cliente_id: "", url: "", descripcion: "" });
  const { showNotification } = useNotificationStore();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentosService.getAll();
      setItems(data || []);
    } catch (err: any) {
      setError(err?.message || "Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ titulo: "", tipo: "propuesta", proyecto_id: "", cliente_id: "", url: "", descripcion: "" });
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && !form.titulo) {
      setForm({ ...form, titulo: selected.name });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let url = form.url;
      if (file) {
        setUploading(true);
        url = await documentosService.upload(file);
        setUploading(false);
      }
      const payload = { ...form, proyecto_id: form.proyecto_id || null, cliente_id: form.cliente_id ? Number(form.cliente_id) : null, url };
      await documentosService.create(payload);
      showNotification("Documento creado", "success");
      setOpen(false);
      setFile(null);
      await load();
    } catch (err: any) {
      showNotification(err.message || "Error guardando documento", "error");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar documento #${row.id}?`)) return;
    try { await documentosService.delete(row.id); await load(); showNotification("Documento eliminado", "success"); }
    catch (err: any) { showNotification(err.message || "Error eliminando documento", "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 1.5 } }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>Documentos</Typography>
        <Button variant="contained" size="small" startIcon={<FiPlus size={16} />} onClick={openCreate}>Nuevo</Button>
      </Box>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gap: 1 }}>
        {items.map((row) => (
          <Paper key={row.id} variant="outlined" sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "0.85rem" }}>{row.titulo}</Typography>
              <Typography variant="caption" color="text.secondary">{row.tipo} {row.url ? `• <a href="${row.url}" target="_blank" rel="noreferrer">Ver</a>` : ""}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {row.url && <IconButton size="small" href={row.url} target="_blank" rel="noreferrer"><FiDownload size={16} /></IconButton>}
              <IconButton size="small" color="error" onClick={() => handleDelete(row)}><FiX size={16} /></IconButton>
            </Box>
          </Paper>
        ))}
        {!loading && items.length === 0 && <Typography variant="body2" color="text.secondary">Sin documentos</Typography>}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo documento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField label="Título" size="small" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} fullWidth />
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={form.tipo} label="Tipo" onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <MenuItem value="propuesta">Propuesta</MenuItem>
                <MenuItem value="contrato">Contrato</MenuItem>
                <MenuItem value="factura">Factura</MenuItem>
                <MenuItem value="brief">Brief</MenuItem>
                <MenuItem value="cronograma">Cronograma</MenuItem>
                <MenuItem value="identidad">Identidad</MenuItem>
                <MenuItem value="idea">Idea</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" component="label" startIcon={<FiUpload size={16} />}>
              {file ? file.name : "Subir archivo"}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            <TextField label="URL" size="small" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} fullWidth />
            <TextField label="Descripción" size="small" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving || uploading}>Cancelar</Button>
          <Button variant="contained" disabled={saving || uploading || !form.titulo} onClick={handleSave}>{uploading ? "Subiendo..." : saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
