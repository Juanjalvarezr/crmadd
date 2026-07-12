import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Chip, Stack, Tooltip, IconButton, Alert, Snackbar, InputAdornment, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Badge
} from "@mui/material";
import { FiMessageSquare, FiSend, FiCopy, FiSearch, FiRefreshCw, FiPlus, FiArrowLeft } from "react-icons/fi";
import SafeChip from "../components/SafeChip";
import { clientesService, proyectosService, tareasService, oportunidadesService } from "../services/database";
import { useNotificationStore } from "../store/useNotificationStore";

const TEMPLATES = [
  { key: "hello", label: "Saludo inicial", text: "Hola {nombre}, soy de DESEO DIGITAL. ¿Cómo estás? Te escribo para contarte cómo podemos ayudarte a crecer." },
  { key: "presupuesto", label: "Presupuesto", text: "Hola {nombre}, te compartimos el presupuesto para el servicio {servicio}. Quedo atento a tus comentarios." },
  { key: "seguimiento", label: "Seguimiento", text: "Hola {nombre}, te hacemos seguimiento al proyecto {proyecto}. Avísame si tienes preguntas." },
  { key: "recordatorio", label: "Recordatorio", text: "Hola {nombre}, te recordamos que la fecha de entrega es {fecha}. ¿Todo bien por tu lado?" },
  { key: "cierre", label: "Cierre venta", text: "Hola {nombre}, confirmemos los detalles para cerrar esta oportunidad. ¿Te sirve una llamada hoy?" },
];

const HISTORY_KEY = "crm_whatsapp_history_v1";

export function meta() {
  return [{ title: "WhatsApp | DESEO DIGITAL" }, { name: "description", content: "Integración browser de WhatsApp" }];
}

export default function WhatsApp() {
  const navigate = useNavigate();
  const { showNotification } = useNotificationStore();

  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [openClientId, setOpenClientId] = useState<number | null>(null);
  const [templateKey, setTemplateKey] = useState("");
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    (async () => {
      try {
        const [cli] = await Promise.all([clientesService.getAll()]);
        setClients(cli as any[]);
        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) setHistory(JSON.parse(saved));
      } catch (e: any) {
        showNotification("Error cargando clientes: " + e.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = clients.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.nombre || "").toLowerCase().includes(q) || (c.telefono || "").includes(q);
  });

  const openComposer = (cliente: any) => {
    setOpenClientId(cliente.id);
    setTemplateKey("");
    setCustomText("");
  };

  const getMessage = (cliente: any) => {
    const nombre = cliente?.nombre || "";
    const clienteObj = clients.find(c => c.id === cliente.id) || cliente;
    const proyecto = (clienteObj?.proyectos || []).slice(0, 1)[0]?.nombre || "";
    const servicio = (clienteObj?.servicios || []).slice(0, 1)[0]?.nombre || "";
    const today = new Date().toISOString().split("T")[0];

    if (templateKey && templateKey !== "__custom") {
      const tpl = TEMPLATES.find(t => t.key === templateKey);
      if (!tpl) return customText || "";
      return tpl.text
        .replaceAll("{nombre}", nombre)
        .replaceAll("{servicio}", servicio)
        .replaceAll("{proyecto}", proyecto)
        .replaceAll("{fecha}", today);
    }
    return customText;
  };

  const sendWhatsApp = async (cliente: any) => {
    const telefono = (cliente.telefono || "").replace(/[^\d]/g, "");
    if (!telefono) {
      setSnack({ open: true, msg: "El cliente no tiene teléfono", severity: "error" });
      return;
    }
    const msg = getMessage(cliente).trim();
    if (!msg) {
      setSnack({ open: true, msg: "Escribe un mensaje", severity: "error" });
      return;
    }
    setSending(true);
    try {
      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");

      const newHistory = [{ id: Date.now(), clienteId: cliente.id, clienteNombre: cliente.nombre, telefono, text: msg, date: new Date().toISOString() }, ...history].slice(0, 100);
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      showNotification("Abriendo WhatsApp...", "success");
      setOpenClientId(null);
    } catch (e: any) {
      setSnack({ open: true, msg: "Error abriendo WhatsApp: " + e.message, severity: "error" });
    } finally {
      setSending(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setSnack({ open: true, msg: "Mensaje copiado", severity: "success" }));
  };

  const navigateToClient = (id: number) => navigate(`/clientes?focus=${id}`);

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1100, mx: "auto" }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderLeft: "4px solid #25D366", bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37,211,102,0.08)' : '#f6fbf7' }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#25D366", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><FiMessageSquare size={20} /></Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>WhatsApp</Typography>
              <Typography variant="caption" color="text.secondary">Apertura directa desde el CRM • sin API oficial</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Volver"><IconButton size="small" onClick={() => navigate(-1)}><FiArrowLeft size={16} /></IconButton></Tooltip>
            <Tooltip title="Recargar"><IconButton size="small" onClick={() => window.location.reload()}><FiRefreshCw size={16} /></IconButton></Tooltip>
          </Stack>
        </Box>
      </Paper>

      <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 340px" }, gap: 1.5, alignItems: "start" }}>
        <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch size={16} /></InputAdornment> }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ maxHeight: { xs: 320, md: "calc(100vh - 220px)" }, overflowY: "auto" }}>
            {loading ? (
              <Typography variant="body2" color="text.secondary">Cargando contactos...</Typography>
            ) : (
              <List dense disablePadding>
                {filtered.map((c, idx) => (
                  <React.Fragment key={c.id}>
                    {idx > 0 && <Divider />}
                    <ListItem id={`wa-${c.id}`} button onClick={() => openComposer(c)} sx={{ py: 1 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "primary.main", color: "primary.contrastText", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, mr: 1.5, flexShrink: 0 }}>
                        {(c.nombre || "?").charAt(0).toUpperCase()}
                      </Box>
                      <ListItemText primary={c.nombre} secondary={c.telefono || "Sin teléfono"} primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: "0.9rem" } }} secondaryTypographyProps={{ sx: { fontSize: "0.75rem" } }} />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Abrir chat"><IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${(c.telefono || "").replace(/[^\d]/g, "")}`, "_blank"); }} disabled={!c.telefono}><FiSend size={14} /></IconButton></Tooltip>
                          <Tooltip title="Componer"><IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); openComposer(c); }}><FiMessageSquare size={14} /></IconButton></Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
                {filtered.length === 0 && <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Sin contactos</Typography></Box>}
              </List>
            )}
          </Box>
        </Paper>

        <Stack spacing={1.5}>
          <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Componer mensaje</Typography>
            {openClientId === null ? (
              <Alert severity="info" sx={{ py: 1 }}>Selecciona un contacto para escribir</Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SafeChip label={(clients.find(c => c.id === openClientId)?.nombre) || ""} color="primary" size="small" onClick={() => navigateToClient(openClientId)} sx={{ cursor: "pointer" }} />
                  <Button size="small" variant="text" color="error" onClick={() => setOpenClientId(null)}>Cancelar</Button>
                </Stack>
                <FormControl size="small">
                  <InputLabel>Plantilla</InputLabel>
                  <Select value={templateKey} label="Plantilla" onChange={(e) => setTemplateKey(e.target.value)}>
                    <MenuItem value="">Ninguna</MenuItem>
                    {TEMPLATES.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                    <MenuItem value="__custom">Personalizado</MenuItem>
                  </Select>
                </FormControl>
                {(!templateKey || templateKey === "__custom") && (
                  <TextField
                    multiline
                    minRows={4}
                    size="small"
                    placeholder="Escribe tu mensaje. Usa {nombre}, {servicio}, {proyecto} y {fecha} como variables."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                  />
                )}
                {(templateKey && templateKey !== "__custom") && (
                  <TextField multiline minRows={4} size="small" value={getMessage(clients.find(c => c.id === openClientId))} onChange={(e) => setCustomText(e.target.value)} />
                )}
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                  <Button size="small" variant="outlined" startIcon={<FiCopy />} onClick={() => copy(getMessage(clients.find(c => c.id === openClientId) || {}))} disabled={!getMessage(clients.find(c => c.id === openClientId) || {})}>Copiar</Button>
                  <Button size="small" variant="contained" color="success" startIcon={<FiSend />} onClick={() => sendWhatsApp(clients.find(c => c.id === openClientId))} disabled={sending}>Enviar</Button>
                </Box>
              </Box>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Historial</Typography>
            <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
              {history.length === 0 ? (
                <Typography variant="caption" color="text.secondary">Sin envíos aún</Typography>
              ) : (
                <List dense disablePadding>
                  {history.slice(0, 20).map((h) => (
                    <React.Fragment key={h.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={<Typography variant="caption" sx={{ fontWeight: 600 }}>{h.clienteNombre}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                              {h.text}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip label={h.telefono} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 20 }} />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Stack>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
