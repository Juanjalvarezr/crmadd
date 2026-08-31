import { globalSnack } from "../components/GlobalSnackbar";
import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Pagination } from "@mui/material";
import { FiX, FiDownload, FiUpload, FiFileText } from "react-icons/fi";
import { documentosService, storageHelper, clientesService, facturasService, proyectosService } from "../services/supabase";
import { CompactStatCard } from "../components/CompactStatCard";
import { EmptyState } from "../components/EmptyState";
import { ListToolbar } from "../components/ListToolbar";

export function meta() {
  return [{ title: "Documentos | CRM Agencia" }];
}

export default function Documentos() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ titulo: "", tipo: "propuesta", proyecto_id: "", cliente_id: "", factura_id: "", url: "", descripcion: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [filters, setFilters] = useState({ proyecto_id: "", cliente_id: "", tipo: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
      
  useEffect(() => {
    loadDocumentos();
    loadOptions();
  }, [filters.proyecto_id, filters.cliente_id, filters.tipo, searchTerm]);

  const openCreate = () => {
    setForm({ titulo: "", tipo: "propuesta", proyecto_id: "", cliente_id: "", factura_id: "", url: "", descripcion: "" });
    setOpen(true);
  };

  const refreshOptions = async () => {
    await loadOptions();
    globalSnack.show("Opciones actualizadas", "info");
  };

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docs, proy, cli, fac] = await Promise.all([
        documentosService.getAll(),
        proyectosService.getAll(),
        clientesService.getAll(),
        facturasService.getAll(),
      ]);
      setDocumentos(docs || []);
      setProyectos(proy || []);
      setClientes(cli || []);
      setFacturas(fac || []);
    } catch (err: any) {
      setError(err?.message || "Error cargando documentos");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [proy, cli, fac] = await Promise.all([
        proyectosService.getAll(),
        clientesService.getAll(),
        facturasService.getAll(),
      ]);
      setProyectos(proy || []);
      setClientes(cli || []);
      setFacturas(fac || []);
    } catch {}
  };

  const filteredDocumentos = documentos.filter((row: any) => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch = !term || [row.titulo, row.tipo, row.url, row.descripcion].some((v: any) => String(v || "").toLowerCase().includes(term));
    const matchProyecto = !filters.proyecto_id || String(row.proyecto_id) === String(filters.proyecto_id);
    const matchCliente = !filters.cliente_id || String(row.cliente_id) === String(filters.cliente_id);
    const matchTipo = !filters.tipo || row.tipo === filters.tipo;
    return matchSearch && matchProyecto && matchCliente && matchTipo;
  });

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
        url = await storageHelper.upload('crm-documents', `doc-${Date.now()}.${(file.name.split('.').pop() || 'bin').toLowerCase()}`, file);
        setUploading(false);
      }
      const payload = { ...form, proyecto_id: form.proyecto_id || null, cliente_id: form.cliente_id || null, factura_id: form.factura_id || null, url };
      await documentosService.create(payload);
      globalSnack.show("Documento creado", "success");
      setOpen(false);
      setFile(null);
      setForm({ titulo: "", tipo: "propuesta", proyecto_id: "", cliente_id: "", factura_id: "", url: "", descripcion: "" });
      await loadDocumentos();
    } catch (err: any) {
      globalSnack.show(err.message || "Error guardando documento", "error");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  
  const handleDelete = async (row: any) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar documento #${row.id}?`)) return;
    try { await documentosService.delete(row.id); await loadDocumentos(); globalSnack.show("Documento eliminado", "success"); }
    catch (err: any) { globalSnack.show(err.message || "Error eliminando documento", "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <ListToolbar
        title="Documentos"
        onCreate={openCreate}
        onRefresh={refreshOptions}
        searchPlaceholder="Buscar documento..."
        onSearch={setSearchTerm}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <CompactStatCard title="Total" value={loading ? "..." : documentos.length} subtitle="Documentos" color="primary" />
        </Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <CompactStatCard title="Con URL" value={documentos.filter((i: any) => i.url).length} subtitle="Enlaces" color="success" />
        </Box>
      </Box>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && filteredDocumentos.length === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: "center", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">Sin documentos</Typography>
          <Button size="small" variant="text" onClick={openCreate}>Crear el primero</Button>
        </Paper>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Proyecto</InputLabel>
          <Select value={filters.proyecto_id} label="Proyecto" onChange={(e) => setFilters({ ...filters, proyecto_id: e.target.value })}>
            <MenuItem value="">Todos</MenuItem>
            {(proyectos || []).map((p: any) => <MenuItem key={p.id} value={Number(p.id)}>{p.nombre || `Proyecto #${p.id}`}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Cliente</InputLabel>
          <Select value={filters.cliente_id} label="Cliente" onChange={(e) => setFilters({ ...filters, cliente_id: e.target.value })}>
            <MenuItem value="">Todos</MenuItem>
            {(clientes || []).map((c: any) => <MenuItem key={c.id} value={Number(c.id)}>{c.nombre || c.email || `Cliente #${c.id}`}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filters.tipo} label="Tipo" onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}>
            <MenuItem value="">Todos</MenuItem>
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
      </Box>
      <Box sx={{ display: "grid", gap: 1 }}>
        {filteredDocumentos.slice((page - 1) * pageSize, page * pageSize).map((row: any) => (
          <Paper key={row.id} variant="outlined" sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "0.85rem" }}>{row.titulo}</Typography>
              <Typography variant="caption" color="text.secondary">
                {row.tipo}
                {row.proyecto_id ? ` • Proyecto ${row.proyecto_id}` : ""}
                {row.cliente_id ? ` • Cliente ${row.cliente_id}` : ""}
                {row.url ? ` • <a href="${row.url}" target="_blank" rel="noreferrer">Ver</a>` : ""}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {row.url && <IconButton size="small" aria-label="Acción" href={row.url} target="_blank" rel="noreferrer" title="Descargar"><FiDownload size={16} /></IconButton>}
              {row.url && <IconButton size="small" aria-label="Acción" onClick={() => setPreview(row.url)} title="Vista previa"><FiFileText size={16} /></IconButton>}
              <IconButton size="small" aria-label="Acción" color="error" onClick={() => handleDelete(row)} title="Eliminar"><FiX size={16} /></IconButton>
            </Box>
          </Paper>
        ))}
        {!loading && documentos.length === 0 && (
        <EmptyState
          title="Sin documentos"
          description="Subí el primer documento para organizar la información."
          actionLabel="Subir documento"
          onAction={openCreate}
        />
      )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
        <Pagination count={Math.max(1, Math.ceil((filteredDocumentos.length || 0) / pageSize))} page={page} onChange={(_: any, p: number) => setPage(p)} size="small" />
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
            <FormControl size="small" fullWidth>
              <InputLabel>Proyecto</InputLabel>
              <Select value={form.proyecto_id} label="Proyecto" onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}>
                <MenuItem value="">Sin vincular</MenuItem>
                {(proyectos || []).map((p: any) => <MenuItem key={p.id} value={String(p.id)}>{p.nombre || `Proyecto #${p.id}`}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select value={form.cliente_id} label="Cliente" onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                <MenuItem value="">Sin vincular</MenuItem>
                {(clientes || []).map((c: any) => <MenuItem key={c.id} value={String(c.id)}>{c.nombre || c.email || `Cliente #${c.id}`}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Factura</InputLabel>
              <Select value={form.factura_id} label="Factura" onChange={(e) => setForm({ ...form, factura_id: e.target.value })}>
                <MenuItem value="">Sin vincular</MenuItem>
                {(facturas || []).map((f: any) => <MenuItem key={f.id} value={String(f.id)}>{`#${f.numero_factura || f.id} - $${Number(f.total || 0).toFixed(0)}`}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción" size="small" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving || uploading}>Cancelar</Button>
          <Button variant="contained" disabled={saving || uploading || !form.titulo} onClick={handleSave}>{uploading ? "Subiendo..." : saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Vista previa<IconButton onClick={() => setPreview(null)} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent dividers>
          {preview && (
            <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 1, border: "1px solid", borderColor: "divider", maxHeight: 500, overflow: "auto" }}>
              {preview.match(/\.(pdf|PDF)$/) ? (
                <iframe src={preview} title="preview" style={{ width: "100%", height: 450, border: 0 }} />
              ) : preview.match(/\.(html|HTML)$/) || preview.includes("text/html") ? (
                <iframe src={preview} title="preview" style={{ width: "100%", height: 450, border: 0 }} />
              ) : (
                <img src={preview} alt="preview" style={{ maxWidth: "100%", height: "auto" }} />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreview(null)}>Cerrar</Button>
          {preview && <Button variant="contained" href={preview} target="_blank" rel="noreferrer">Abrir original</Button>}
        </DialogActions>
      </Dialog>

    </Box>
  );
}