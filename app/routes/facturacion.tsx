import { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Alert, CircularProgress,
  Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Divider
} from "@mui/material";
import { FiRefreshCw, FiPlus, FiFileText, FiX, FiUpload } from "react-icons/fi";
import { facturasService, emailService, plantillasDocumentosService, pagosService, documentosService } from "../services/supabase";
import { storageHelper } from "../services/supabase";
import { useCRMStore } from "../store/useCRMStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { StatCard } from "../components/StatCard";

export function meta() {
  return [{ title: "Facturación | CRM Agencia" }];
}

export default function Facturacion() {
  const facturas = useCRMStore((s) => s.facturas);
  const clientes = useCRMStore((s) => s.clientes);
  const fetchFacturas = useCRMStore((s) => s.fetchFacturas);
  const fetchClientes = useCRMStore((s) => s.fetchClientes);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ numero_factura: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "", subtotal: "", iva: "", descuento: "", metodo_pago: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagoForm, setPagoForm] = useState({ monto: "", metodo_pago: "transferencia", referencia: "", comprobante_url: "" });
  const [plantilla, setPlantilla] = useState<any>(null);
  const [documentoGenerado, setDocumentoGenerado] = useState<string | null>(null);
  const [documentoUrl, setDocumentoUrl] = useState<string | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const { showNotification } = useNotificationStore();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        fetchFacturas().catch(() => []),
        fetchClientes().catch(() => []),
      ]);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        setError(`No fue posible sincronizar toda la información. Se muestran datos parciales (${failed} fuente(s) fallida).`);
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ numero_factura: "", estado: "Borrador", total: "", proyecto_id: "", cliente_id: "", fecha_vencimiento: "", subtotal: "", iva: "", descuento: "", metodo_pago: "", notas: "" });
    setOpenModal(true);
  };

  const openEdit = async (row: any) => {
    setEditing(row);
    setForm({ numero_factura: row.numero_factura || "", estado: row.estado || "Borrador", total: String(row.total ?? ""), proyecto_id: row.proyecto_id || "", cliente_id: row.cliente_id ? String(row.cliente_id) : "", fecha_vencimiento: row.fecha_vencimiento || "", subtotal: String(row.subtotal ?? ""), iva: String(row.iva ?? ""), descuento: String(row.descuento ?? ""), metodo_pago: row.metodo_pago || "", notas: row.notas || "" });
    setOpenModal(true);
    try { const data = await pagosService.getByFactura(row.id); setPagos(data || []); } catch { setPagos([]); }
    try { const tpl = await plantillasDocumentosService.getByTipo("factura"); setPlantilla(tpl || null); } catch { setPlantilla(null); }
  };

  const openDetail = (row: any) => {
    setSelected(row);
    setDetailOpen(true);
    pagosService.getByFactura(row.id).then(data => setPagos(data || [])).catch(() => setPagos([]));
    plantillasDocumentosService.getByTipo("factura").then(tpl => setPlantilla(tpl || null)).catch(() => setPlantilla(null));
  };

  const calcTotales = () => {
    const subtotal = Number(form.subtotal || 0);
    const iva = Number(form.iva || 0);
    const descuento = Number(form.descuento || 0);
    const total = Math.max(subtotal + iva - descuento, 0);
    return { subtotal, iva, descuento, total };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { cliente_id, proyecto_id, fecha_vencimiento, ...rest } = form;
      const { subtotal, iva, descuento, total } = calcTotales();
      const payload: any = { ...rest, subtotal, iva, descuento, total };
      if (cliente_id) payload.cliente_id = Number(cliente_id);
      if (proyecto_id) payload.proyecto_id = proyecto_id;
      if (fecha_vencimiento) payload.fecha_vencimiento = fecha_vencimiento;

      if (editing) {
        const allowed = ["Borrador", "Enviada", "Pagada", "Vencida", "Anulada"];
        const nextEstado = payload.estado || editing.estado;
        if (!allowed.includes(nextEstado)) {
          showNotification("Estado no válido", "warning");
          setSaving(false);
          return;
        }
        await facturasService.update(editing.id, payload);
        showNotification("Factura actualizada", "success");
      } else {
        if (!payload.numero_factura || !String(payload.numero_factura).includes('-')) {
          showNotification("Usá formato 001-001-101 para numeración", "warning");
          setSaving(false);
          return;
        }
        await facturasService.create(payload);
        showNotification("Factura creada", "success");
      }
      setOpenModal(false);
      await load();
    } catch (err: any) { showNotification(err.message || "Error guardando factura", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row: any) => {
    if (typeof window !== "undefined" && !confirm(`¿Eliminar factura #${row.id}?`)) return;
    try { await facturasService.delete(row.id); await load(); showNotification("Factura eliminada", "success"); }
    catch (err: any) { showNotification(err.message || "Error eliminando factura", "error"); }
  };

  const getClienteNombre = (clienteId: number | string | null | undefined) => {
    if (!clienteId) return "Sin cliente";
    const c = clientes.find((x: any) => Number(x.id) === Number(clienteId));
    return c ? (c.nombre || c.email || `Cliente #${clienteId}`) : `Cliente #${clienteId}`;
  };

  const resolveCliente = (row: any) => {
    const clienteId = row.cliente_id;
    if (!clienteId) return null;
    const fromJoin = row.cliente && (row.cliente.nombre || row.cliente.email || row.cliente.telefono) ? row.cliente : null;
    const fromStore = clientes.find((x: any) => Number(x.id) === Number(clienteId)) || null;
    const base = fromJoin || fromStore || {};
    return { ...base, id: clienteId, nombre: base.nombre || getClienteNombre(clienteId) };
  };

  const sendWhatsApp = async (row: any) => {
    const cliente = resolveCliente(row);
    const telefono = cliente?.telefono || "";
    if (!telefono) { showNotification("El cliente no tiene teléfono cargado", "warning"); return; }
    const link = documentoUrl ? `\nDocumento: ${documentoUrl}` : "";
    const texto = encodeURIComponent(`Hola ${cliente.nombre || "cliente"}, te compartimos tu factura #${row.numero_factura || row.id} por $${Number(row.total || 0).toFixed(0)}. Estado: ${row.estado || "Borrador"}. Fecha vencimiento: ${row.fecha_vencimiento || "Sin definir"}.${link} Ante cualquier duda respondé este mensaje.`);
    if (typeof window !== "undefined") window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
    showNotification("Abriendo WhatsApp...", "info");
  };

  const sendEmail = async (row: any) => {
    try {
      const cliente = resolveCliente(row);
      const to = cliente?.email || "";
      if (!to) { showNotification("El cliente no tiene email cargado", "warning"); return; }
      const subject = `Factura #${row.numero_factura || row.id} - DESEO DIGITAL`;
      const html = `<p>Hola ${cliente.nombre || "cliente"},</p><p>Adjuntamos tu factura <strong>#${row.numero_factura || row.id}</strong> por <strong>$${Number(row.total || 0).toFixed(0)}</strong>.</p><p>Estado: ${row.estado || "Borrador"}<br>Vencimiento: ${row.fecha_vencimiento || "Sin definir"}</p><p>Saludos,<br>DESEO DIGITAL</p>`;
      const res = await emailService.sendRealEmail([to], subject, html);
      showNotification(res?.message || "Factura enviada por email", "success");
    } catch (err: any) { showNotification(err.message || "Error enviando factura por email", "error"); }
  };

  const generarDocumento = async (row: any) => {
    try {
      const tpl = plantilla || await plantillasDocumentosService.getByTipo("factura");
      if (!tpl) { showNotification("Creá una plantilla de factura en Configuración primero", "warning"); return; }
      const cliente = clientes.find((x: any) => Number(x.id) === Number(row.cliente_id));
      const { subtotal, iva, descuento, total } = { subtotal: Number(row.subtotal || row.total || 0), iva: Number(row.iva || 0), descuento: Number(row.descuento || 0), total: Number(row.total || 0) };
      const ctx = {
        empresa: { nombre: "DESEO DIGITAL", email: "contacto@deseodigital.com", telefono: "320 369 8476", direccion: "Calle Principal #123-45", ciudad: "Bogotá", pais: "Colombia" },
        cliente: { nombre: cliente?.nombre || "Cliente", email: cliente?.email || "", telefono: cliente?.telefono || "", empresa: cliente?.empresa || "", nicho: cliente?.nicho || "" },
        proyecto: { nombre: "", id: row.proyecto_id || "", servicios: [] },
        factura: { numero: row.numero_factura || String(row.id), fecha_emision: row.fecha_emision || new Date().toISOString(), fecha_vencimiento: row.fecha_vencimiento || "", estado: row.estado || "Borrador", subtotal, iva, descuento, total },
        pagos: { realizados: pagos.reduce((a, b) => a + Number(b.monto || 0), 0), saldo: Math.max(total - pagos.reduce((a, b) => a + Number(b.monto || 0), 0), 0) },
        fecha: new Date().toLocaleDateString("es-CO"),
      };
      let html = tpl.contenido || "";
      Object.entries(ctx).forEach(([section, values]: any) => {
        Object.entries(values).forEach(([key, value]) => {
          html = html.split(`{{${section}.${key}}`).join(String(value ?? ""));
        });
      });

      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Factura #${row.numero_factura || row.id}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#222} .muted{color:#666} .right{text-align:right} table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f7f7f7}</style></head><body>${html}</body></html>`;
      const fileName = `factura-${row.numero_factura || row.id}-${Date.now()}.html`;
      const file = new Blob([fullHtml], { type: "text/html" });
      const url = await storageHelper.upload("crm-documents", `facturas/${fileName}`, file as any);

      try {
        await documentosService.create({ titulo: `Factura #${row.numero_factura || row.id}`, tipo: "factura", url, descripcion: `Generada automáticamente. Total: $${total}`, proyecto_id: row.proyecto_id || null, cliente_id: row.cliente_id || null, factura_id: row.id || null });
      } catch {}

      setDocumentoGenerado(fullHtml);
      setDocumentoUrl(url);
      showNotification("Factura generada", "success");
      if (typeof window !== "undefined") {
        const win = window.open();
        if (win) {
          win.document.write(fullHtml);
          win.document.close();
        }
      }
    } catch (err: any) { showNotification(err.message || "Error generando documento", "error"); }
  };

  const handleRegistrarPago = async () => {
    if (!selected || !pagoForm.monto) { showNotification("Monto requerido", "warning"); return; }
    try {
      setUploadingPayment(true);
      const monto = Number(pagoForm.monto);
      let comprobante_url = pagoForm.comprobante_url;
      if (paymentFile) {
        const fileName = `payment-${Date.now()}.${paymentFile.name.split('.').pop()}`;
        comprobante_url = await storageHelper.upload('crm-documents', `payments/${fileName}`, paymentFile);
      }
      const payload: any = { factura_id: selected.id, monto, metodo_pago: pagoForm.metodo_pago, referencia: pagoForm.referencia, comprobante_url };
      await pagosService.create(payload);
      const data = await pagosService.getByFactura(selected.id); setPagos(data || []);
      setPagoForm({ monto: "", metodo_pago: "transferencia", referencia: "", comprobante_url: "" });
      setPaymentFile(null);
      showNotification("Pago registrado", "success");
      const saldo = Number(selected.total || 0) - data.reduce((a, b) => a + Number(b.monto || 0), 0);
      if (saldo <= 0) { await facturasService.update(selected.id, { estado: "Pagada" }); await load(); }
    } catch (err: any) { showNotification(err.message || "Error registrando pago", "error"); }
    finally { setUploadingPayment(false); }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, mb: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
        <FiFileText size={18} color="#009688" />
        <Typography variant="h6" sx={{ color: "#009688", fontWeight: "bold", flex: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Facturación</Typography>
        <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={load} disabled={loading}>Recargar</Button>
        <Button variant="contained" size="small" startIcon={<FiPlus size={14} />} onClick={openCreate}>Nueva</Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <StatCard title="Total" value={loading ? "..." : facturas.length} subtitle="Facturas" color="primary" />
        </Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <StatCard title="Pagadas" value={facturas.filter((f: any) => f.estado === "Pagada").length} subtitle="Pagadas" color="success" />
        </Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <StatCard title="Vencidas" value={facturas.filter((f: any) => f.estado === "Vencida").length} subtitle="Vencidas" color="error" />
        </Box>
        <Box sx={{ flex: { xs: "50%", sm: "25%" }, minWidth: 0 }}>
          <StatCard title="Total $" value={Number(facturas.reduce((a: number, b: any) => a + Number(b.total || 0), 0)).toFixed(0)} subtitle="Monto" color="warning" />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: { xs: 1, sm: 1.5 } }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2, sm: 3 } }}><CircularProgress size={28} /></Box>
      ) : facturas.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">No hay facturas registradas.</Typography>
          <Button size="small" variant="text" onClick={openCreate}>Crear la primera</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 1 } }}>
          {facturas.slice(0, 20).map((f: any) => (
            <Paper key={f.id} sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 2, display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>Factura #{f.id}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>{f.numero_factura || ""}</Typography>
              </Box>
              <Chip size="small" label={f.estado || "Borrador"} sx={{ height: { xs: 20, sm: 24 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />
              <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>${Number(f.total || 0).toFixed(0)}</Typography>
              <Box sx={{ display: "flex", gap: { xs: 0.25, sm: 0.5 }, flexWrap: "wrap" }}>
                <Button size="small" variant="text" onClick={() => openDetail(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>Ver</Button>
                <Button size="small" variant="text" onClick={() => openEdit(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>Editar</Button>
                <Button size="small" variant="text" onClick={() => generarDocumento(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>Generar</Button>
                <Button size="small" color="error" variant="text" onClick={() => handleDelete(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>Eliminar</Button>
                <Button size="small" variant="text" onClick={() => sendWhatsApp(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>WhatsApp</Button>
                <Button size="small" variant="text" onClick={() => sendEmail(f)} sx={{ minHeight: { xs: 28, sm: 32 } }}>Email</Button>
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

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Factura #{selected?.id}<IconButton onClick={() => setDetailOpen(false)} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              <Typography variant="subtitle2">#{selected.numero_factura || selected.id}</Typography>
              <Typography variant="body2">Cliente: {getClienteNombre(selected.cliente_id)}</Typography>
              <Chip size="small" label={selected.estado || "Borrador"} />
              <Typography variant="body2">Total: ${Number(selected.total || 0).toFixed(0)}</Typography>
              <Typography variant="body2">Vencimiento: {selected.fecha_vencimiento || "Sin definir"}</Typography>
              <Divider />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" onClick={() => generarDocumento(selected)}>Generar documento</Button>
                <Button size="small" variant="outlined" onClick={() => sendWhatsApp(selected)}>WhatsApp</Button>
                <Button size="small" variant="outlined" onClick={() => sendEmail(selected)}>Email</Button>
              </Box>
              <Divider />
              <Typography variant="subtitle2">Pagos</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <TextField label="Monto" size="small" type="number" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Método</InputLabel>
                  <Select value={pagoForm.metodo_pago} label="Método" onChange={(e) => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}>
                    <MenuItem value="transferencia">Transferencia</MenuItem>
                    <MenuItem value="nequi">Nequi</MenuItem>
                    <MenuItem value="daviplata">Daviplata</MenuItem>
                    <MenuItem value="efectivo">Efectivo</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Referencia" size="small" value={pagoForm.referencia} onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })} />
                <Button size="small" variant="outlined" component="label" startIcon={<FiUpload size={14} />} disabled={uploadingPayment}>
                  {paymentFile ? paymentFile.name : "Comprobante"}
                  <input type="file" hidden onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} />
                </Button>
                <Button size="small" variant="contained" onClick={handleRegistrarPago} disabled={uploadingPayment}>
                  {uploadingPayment ? "Guardando..." : "Registrar pago"}
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {pagos.map((p) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 1.2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: "bold" }}>${Number(p.monto || 0).toFixed(0)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{p.metodo_pago || ""} {p.referencia ? `• ${p.referencia}` : ""}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-CO") : ""}</Typography>
                  </Paper>
                ))}
                {pagos.length === 0 && <Typography variant="body2" color="text.secondary">Sin pagos registrados</Typography>}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!documentoGenerado} onClose={() => setDocumentoGenerado(null)} maxWidth="md" fullWidth>
        <DialogTitle>Documento generado<IconButton onClick={() => setDocumentoGenerado(null)} size="small" sx={{ float: "right" }}><FiX /></IconButton></DialogTitle>
        <DialogContent dividers>
          <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 1, border: "1px solid", borderColor: "divider", maxHeight: 500, overflow: "auto" }}>
            <div dangerouslySetInnerHTML={{ __html: documentoGenerado || "" }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDocumentoGenerado(null)}>Cerrar</Button>
          <Button variant="contained" onClick={() => { if (documentoGenerado) { window.print(); } }}>Imprimir / Guardar PDF</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
