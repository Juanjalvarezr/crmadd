import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, CircularProgress, Chip, Tooltip
} from "@mui/material";
import { FiPlus, FiEdit, FiTrash2, FiFileText, FiRefreshCw, FiMessageSquare, FiX } from "react-icons/fi";
import { cotizacionesService, clientesService, documentosService } from "../services/supabase";
import { plantillasDocumentosService } from "../services/supabase";
import { storageHelper } from "../services/supabase";
import { useNotificationStore } from "../store/useNotificationStore";
import { StatCard } from "../components/StatCard";

export function meta() {
  return [{ title: "Cotizaciones | CRM Agencia" }];
}

export default function Cotizaciones() {
  const [items, setItems] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ numero_cotizacion: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "", subtotal: "", iva: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotificationStore();
    
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, cRes] = await Promise.allSettled([
        cotizacionesService.getAll(),
        clientesService.getAll(),
        
      ]);
      setItems(data.status === "fulfilled" ? (data.value || []) : []);
      setClientes(cRes.status === "fulfilled" ? (cRes.value || []) : []);
      
    } catch (err: any) {
      setError(err?.message || "Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ numero_cotizacion: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "", subtotal: "", iva: "", notas: "" });
    setOpenModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ numero_cotizacion: row.numero_cotizacion || "", estado: row.estado || "Borrador", total: String(row.total ?? ""), proyecto_id: row.proyecto_id || "", cliente_id: row.cliente_id ? String(row.cliente_id) : "", fecha_vencimiento: row.fecha_vencimiento || "", subtotal: String(row.subtotal ?? ""), iva: String(row.iva ?? ""), notas: row.notas || "" });
    setOpenModal(true);
  };

  const calcTotales = () => {
    const subtotal = Number(form.subtotal || 0);
    const iva = Number(form.iva || 0);
    const total = Math.max(subtotal + iva, 0);
    return { subtotal, iva, total };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { cliente_id, proyecto_id, fecha_vencimiento, ...rest } = form;
      const { subtotal, iva, total } = calcTotales();
      const payload: any = { ...rest, subtotal, iva, total };
      if (cliente_id) payload.cliente_id = Number(cliente_id);
      if (proyecto_id) payload.proyecto_id = proyecto_id;
      if (fecha_vencimiento) payload.fecha_vencimiento = fecha_vencimiento;
      if (editing) {
        await cotizacionesService.update(editing.id, payload);
        showNotification("Cotización actualizada", "success");
      } else {
        await cotizacionesService.create(payload);
        showNotification("Cotización creada", "success");
      }
      setOpenModal(false);
      await load();
    } catch (err: any) { showNotification(err.message || "Error guardando cotización", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar cotización #${row.id}?`)) return;
    try { await cotizacionesService.delete(row.id); await load(); showNotification("Cotización eliminada", "success"); }
    catch (err: any) { showNotification(err.message || "Error eliminando cotización", "error"); }
  };

  const getClienteNombre = (clienteId: number | string | null | undefined) => {
    if (!clienteId) return "Sin cliente";
    const c = clientes.find((x: any) => Number(x.id) === Number(clienteId));
    return c ? (c.nombre || c.email || `Cliente #${clienteId}`) : `Cliente #${clienteId}`;
  };

  const sendWhatsApp = async (row: any) => {
    const cliente = getClienteNombre(row.cliente_id);
    const clienteObj = clientes.find((x: any) => Number(x.id) === Number(row.cliente_id));
    const telefono = clienteObj?.telefono || "";
    if (!telefono) { showNotification(`El cliente "${cliente}" no tiene teléfono cargado`, "warning"); return; }
    const texto = encodeURIComponent(`Hola ${cliente}, te compartimos tu cotización #${row.numero_cotizacion || row.id} por $${Number(row.total || 0).toFixed(0)}. Estado: ${row.estado || "Borrador"}. Vencimiento: ${row.fecha_vencimiento || "Sin definir"}. Ante cualquier duda respondé este mensaje.`);
    if (typeof window !== "undefined") window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
    showNotification("Abriendo WhatsApp...", "info");
  };

  const generarDocumento = async (row: any) => {
    try {
      const tpl = await plantillasDocumentosService.getByTipo("cotizacion") || await plantillasDocumentosService.getByTipo("factura");
      if (!tpl) { showNotification("Creá una plantilla de cotización en Configuración primero", "warning"); return; }
      const cliente = clientes.find((x: any) => Number(x.id) === Number(row.cliente_id));
      const { subtotal, iva, descuento, total } = { subtotal: Number(row.subtotal || row.total || 0), iva: Number(row.iva || 0), descuento: Number(row.descuento || 0), total: Number(row.total || 0) };
      const ctx = {
        empresa: { nombre: "DESEO DIGITAL", email: "contacto@deseodigital.com", telefono: "320 369 8476", direccion: "Calle Principal #123-45", ciudad: "Bogotá", pais: "Colombia" },
        cliente: { nombre: cliente?.nombre || "Cliente", email: cliente?.email || "", telefono: cliente?.telefono || "", empresa: cliente?.empresa || "", nicho: cliente?.nicho || "" },
        proyecto: { nombre: "", id: row.proyecto_id || "", servicios: [] },
        factura: { numero: row.numero_cotizacion || String(row.id), fecha_emision: row.fecha_emision || new Date().toISOString(), fecha_vencimiento: row.fecha_vencimiento || "", estado: row.estado || "Borrador", subtotal, iva, descuento, total },
        pagos: { realizados: 0, saldo: total },
        fecha: new Date().toLocaleDateString("es-CO"),
      };
      let html = tpl.contenido || "";
      Object.entries(ctx).forEach(([section, values]: any) => {
        Object.entries(values).forEach(([key, value]) => {
          html = html.split(`{{${section}.${key}}`).join(String(value ?? ""));
        });
      });
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Cotización #${row.numero_cotizacion || row.id}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#222} .muted{color:#666} .right{text-align:right} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f7f7f7}</style></head><body>${html}</body></html>`;
      const fileName = `cotizacion-${row.numero_cotizacion || row.id}-${Date.now()}.html`;
      const file = new Blob([fullHtml], { type: "text/html" });
      const url = await storageHelper.upload("crm-documents", `cotizaciones/${fileName}`, file as any);
      try { await documentosService.create({ titulo: `Cotización #${row.numero_cotizacion || row.id}`, tipo: "cotizacion", url, descripcion: `Generada automáticamente. Total: $${total}`, proyecto_id: row.proyecto_id || null, cliente_id: row.cliente_id || null, factura_id: null }); } catch {}
      showNotification("Cotización generada", "success");
      if (typeof window !== "undefined") {
        const win = window.open();
        if (win) { win.document.write(fullHtml); win.document.close(); }
      }
    } catch (err: any) { showNotification(err.message || "Error generando cotización", "error"); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
        <FiFileText size={18} color="#009688" />
        <Typography variant="h6" sx={{ color: "#009688", fontWeight: "bold", flex: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Cotizaciones</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={load} disabled={loading}>Recargar</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={14} />} onClick={openCreate}>Nueva</Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}><StatCard title="Total" value={loading ? "..." : items.length} subtitle="Cotizaciones" color="primary" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}><StatCard title="Aceptadas" value={items.filter((x: any) => x.estado === "Aceptada").length} subtitle="Aceptadas" color="success" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}><StatCard title="Enviadas" value={items.filter((x: any) => x.estado === "Enviada").length} subtitle="Enviadas" color="info" /></Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}><StatCard title="Total $" value={Number(items.reduce((a: number, b: any) => a + Number(b.total || 0), 0)).toFixed(0)} subtitle="Monto" color="warning" /></Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: { xs: 1, sm: 1.5 } }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2, sm: 3 } }}><CircularProgress size={28} /></Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">No hay cotizaciones registradas.</Typography>
          <Button size="small" variant="text" onClick={openCreate}>Crear la primera</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 1 } }}>
          {itemsPaginated.map((row: any) => {
            const estado = row.estado || "Borrador";
            const estadoColor = estado === "Aceptada" ? "success" : estado === "Enviada" ? "info" : estado === "Rechazada" ? "error" : estado === "Vencida" ? "error" : "default";
            return (
              <Paper key={row.id} sx={{ p: { xs: 1, sm: 1.25 }, borderRadius: 1.75, display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, flexWrap: "wrap", border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>{row.numero_cotizacion || `#${row.id}`}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{getClienteNombre(row.cliente_id)}</Typography>
                </Box>
                <Chip size="small" label={estado} color={estadoColor as any} sx={{ height: { xs: 22, sm: 26 }, fontSize: { xs: '0.65rem', sm: '0.7rem' } }} />
                <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>${Number(row.total || 0).toFixed(0)}</Typography>
                <Box sx={{ display: "flex", gap: { xs: 0.25, sm: 0.5 }, flexWrap: "wrap" }}>
                  <Tooltip title="Generar documento"><IconButton size="small" onClick={() => generarDocumento(row)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiFileText size={16}/></IconButton></Tooltip>
                  <Tooltip title="Enviar por WhatsApp"><IconButton size="small" color="success" onClick={() => sendWhatsApp(row)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiMessageSquare size={16}/></IconButton></Tooltip>
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(row)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiEdit size={16}/></IconButton></Tooltip>
                  <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(row)} sx={{ p: { xs: '2px', sm: '4px' } }}><FiTrash2 size={16}/></IconButton></Tooltip>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
            
      <Dialog open={openModal} onClose={() => { setOpenModal(false); setFormError(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar Cotización" : "Nueva Cotización"}<IconButton onClick={() => { setOpenModal(false); setFormError(null); }} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Número cotización *" fullWidth value={form.numero_cotizacion} onChange={(e) => setForm({ ...form, numero_cotizacion: e.target.value })} error={!form.numero_cotizacion} helperText={!form.numero_cotizacion ? "Requerido" : ""} />
            <FormControl fullWidth error={!form.cliente_id}>
              <InputLabel>Cliente *</InputLabel>
              <Select value={form.cliente_id} label="Cliente" onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                <MenuItem value="">Sin cliente</MenuItem>
                {clientes.map((c: any) => <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField label="Subtotal *" type="number" sx={{ flex: 1 }} value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} error={Number(form.subtotal || 0) < 0} helperText={Number(form.subtotal || 0) < 0 ? "Debe ser mayor a 0" : ""} />
              <TextField label="IVA" type="number" sx={{ flex: 1 }} value={form.iva} onChange={(e) => setForm({ ...form, iva: e.target.value })} />
            </Box>
            <TextField label="Total *" type="number" fullWidth value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} error={Number(form.total || 0) < 0} helperText={Number(form.total || 0) < 0 ? "Debe ser mayor a 0" : ""} />
            <TextField label="Fecha vencimiento" type="date" fullWidth value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenModal(false); setFormError(null); }} variant="outlined" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}