import { useState, useEffect } from "react";
import {
  Box, Pagination, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Tooltip
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiX, FiUpload, FiFileText, FiEdit, FiTrash2 } from "react-icons/fi";
import { contratosService } from "../services/supabase";
import { storageHelper } from "../services/supabase";
import { useCRMStore } from "../store/useCRMStore";
import { globalSnack } from "../components/GlobalSnackbar";
import { EmptyState } from "../components/EmptyState";

export function meta() {
  return [{ title: "Contratos | CRM Agencia" }];
}

export default function Contratos() {
  const contratos = useCRMStore((s) => s.contratos);
  const fetchContratos = useCRMStore((s) => s.fetchContratos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ estado: "Activo", valor: "", proyecto_id: "", cliente_id: "", factura_id: "", fecha_inicio: "", fecha_fin: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const [file, setFile] = useState<File | null>(null);
    
  const load = async () => {
    try { setLoading(true); setError(null); await fetchContratos(); }
    catch (err: any) { setError(err.message || "Error al cargar contratos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ estado: "Activo", valor: "", proyecto_id: "", cliente_id: "", factura_id: "", fecha_inicio: "", fecha_fin: "", url: "" });
    setFile(null);
    setOpenModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ estado: row.estado || "Activo", valor: String(row.valor ?? ""), proyecto_id: row.proyecto_id || "", cliente_id: row.cliente_id ? String(row.cliente_id) : "", factura_id: row.factura_id ? String(row.factura_id) : "", fecha_inicio: row.fecha_inicio || "", fecha_fin: row.fecha_fin || "", url: row.url || "" });
    setFile(null);
    setOpenModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let url = form.url;
      if (file) {
        const fileName = `contract-${Date.now()}.${file.name.split('.').pop()}`;
        url = await storageHelper.upload('crm-documents', `contracts/${fileName}`, file);
      }
      const payload = { ...form, valor: Number(form.valor || 0), cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined, proyecto_id: form.proyecto_id || undefined, factura_id: form.factura_id ? Number(form.factura_id) : undefined, fecha_inicio: form.fecha_inicio || undefined, fecha_fin: form.fecha_fin || undefined, url };
      if (editing) { await contratosService.update(editing.id, payload); globalSnack.show("Contrato actualizado", "success"); }
      else { await contratosService.create(payload); globalSnack.show("Contrato creado", "success"); }
      setOpenModal(false); await load();
    } catch (err: any) { globalSnack.show(err.message || "Error guardando contrato", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await contratosService.delete(deleteTarget.id); await load(); globalSnack.show("Contrato eliminado", "success"); }
    catch (err: any) { globalSnack.show(err.message || "Error eliminando contrato", "error"); }
    finally { setDeleteTarget(null); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header compacto mobile */}
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Contratos</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={load} disabled={loading}>Recargar</Button>
            <Button size="small" variant="contained" startIcon={<FiPlus />} onClick={openCreate}>Nuevo</Button>
          </Box>
        </Box>
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField size="small" placeholder="Buscar contrato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ minWidth: 200 }} />
          <Chip label="Activos" onClick={() => setFilterEstado("")} color={filterEstado === "" ? "primary" : "default"} size="small" />
          <Chip label="Activo" onClick={() => setFilterEstado("Activo")} color={filterEstado === "Activo" ? "success" : "default"} size="small" />
          <Chip label="Finalizado" onClick={() => setFilterEstado("Finalizado")} color={filterEstado === "Finalizado" ? "info" : "default"} size="small" />
          <Chip label="Cancelado" onClick={() => setFilterEstado("Cancelado")} color={filterEstado === "Cancelado" ? "error" : "default"} size="small" />

        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 0.75 }, mb: { xs: 0.75, sm: 1 } }}>
        <Chip label={`${contratos.length} contratos`} size="small" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: { xs: 1, sm: 1.5 } }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2, sm: 3 } }}><CircularProgress /></Box>
      ) : contratos.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <EmptyState
            title="Sin contratos"
            description="Creá el primer contrato para formalizar acuerdos."
            actionLabel="Crear contrato"
            onAction={openCreate}
          />
          <Button size="small" variant="text" onClick={openCreate}>Crear el primero</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.75, sm: 1 } }}>
          {(() => {
            const term = searchTerm.toLowerCase();
            const filtered = (contratos || []).filter((c: any) => {
              const matchS = (c.estado || "").toLowerCase().includes(term) || (c.url || "").toLowerCase().includes(term);
              const matchE = !filterEstado || c.estado === filterEstado;
              return matchS && matchE;
            });
            return filtered.map((c: any) => {
              const estado = c.estado || "Activo";
              const estadoColor = estado === "Activo" ? "success" : estado === "Finalizado" ? "info" : estado === "Cancelado" ? "error" : "default";
              return (
                <Paper key={c.id} sx={{ 
                  p: { xs: 1, sm: 1.25 }, 
                  borderRadius: 1.75, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: { xs: 0.75, sm: 1 }, 
                  flexWrap: "wrap",
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>Contrato #{c.id}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString() : ""}</Typography>
                  </Box>
                  <Chip size="small" label={estado} color={estadoColor as any} sx={{ height: { xs: 22, sm: 26 }, fontSize: { xs: '0.65rem', sm: '0.7rem' } }} />
                  <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>${Number(c.valor || 0).toFixed(0)}</Typography>
                  {c.url && (
                    <Typography variant="caption" sx={{ display: 'block', width: '100%' }}>
                      <a href={c.url} target="_blank" rel="noreferrer">Ver documento</a>
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: { xs: 0.25, sm: 0.5 }, flexWrap: "wrap" }}>
                    <Tooltip title="Editar contrato"><IconButton size="small" onClick={() => openEdit(c)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiEdit size={16}/></IconButton></Tooltip>
                    <Tooltip title="Eliminar contrato"><IconButton size="small" color="error" onClick={() => handleDelete(c)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiTrash2 size={16}/></IconButton></Tooltip>
                  </Box>
                </Paper>
              );
            }) as any;
          })() as any}
        </Box>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
        <Pagination count={Math.max(1, Math.ceil((contratos.length || 0) / pageSize))} page={page} onChange={(_, p) => setPage(p)} size="small" />
      </Box>
      
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar contrato</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de eliminar el contrato #{deleteTarget?.id}? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button color="error" onClick={confirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

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
            <Button variant="outlined" size="small" component="label" startIcon={<FiUpload size={14} />}>
              {file ? file.name : "Subir contrato"}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            {form.url && (
              <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                <FiFileText size={12} style={{ marginRight: 4 }} />
                <a href={form.url} target="_blank" rel="noreferrer">Ver documento</a>
              </Typography>
            )}
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