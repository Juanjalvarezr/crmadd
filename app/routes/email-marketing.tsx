import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Alert, Snackbar, CircularProgress, Stack,
  Grid, Card, CardContent, CardActions, Divider, Tabs, Tab
} from "@mui/material";
import { FiSend, FiSave, FiList, FiMail, FiPlus, FiEye, FiTrash2, FiBarChart } from "react-icons/fi";
import { emailMarketingService } from "../services/database";

type TemplateKey = "bienvenida" | "seguimiento" | "promocion" | "presupuesto";

const TEMPLATES: Record<TemplateKey, { subject: string; html: string; color: string }> = {
  bienvenida: {
    subject: "Bienvenido a DESEO DIGITAL",
    html: "<h1>Hola {{nombre}}</h1><p>Gracias por contactarnos. Te acompañamos en tu crecimiento digital.</p>",
    color: "#4caf50",
  },
  seguimiento: {
    subject: "Seguimiento de tu proyecto",
    html: "<h1>Hola {{nombre}}</h1><p>Queremos saber cómo avanzas. ¿Te ayudo en algo más?</p>",
    color: "#2196f3",
  },
  promocion: {
    subject: "Promoción especial para tu empresa",
    html: "<h1>Hola {{nombre}}</h1><p>Esta semana tenemos beneficios exclusivos para tu sector.</p>",
    color: "#e91e63",
  },
  presupuesto: {
    subject: "Tu presupuesto DESEO DIGITAL",
    html: "<h1>Hola {{nombre}}</h1><p>Adjunto el presupuesto solicitado. Dudas, respondé este correo.</p>",
    color: "#ff9800",
  },
};

export function meta() {
  return [
    { title: "Email Marketing | DESEO DIGITAL" },
    { name: "description", content: "Campañas y envíos masivos" },
  ];
}

export default function EmailMarketing() {
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [openSnack, setOpenSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [template, setTemplate] = useState<TemplateKey>("bienvenida");
  const [campanas, setCampanas] = useState<any[]>([]);

  useEffect(() => {
    const t = TEMPLATES[template];
    setSubject(t.subject);
    setHtml(t.html);
  }, [template]);

  const send = async () => {
    if (!to || !subject || !html) {
      setOpenSnack({ open: true, message: "Completá destinatario, asunto y contenido", severity: "error" });
      return;
    }
    setLoading(true);
    const res = await emailMarketingService.send({
      to: to.split(',').map((e) => e.trim()).filter(Boolean),
      subject,
      html,
    });
    setLoading(false);
    if (res.ok) {
      setOpenSnack({ open: true, message: `Enviado correctamente ${res.id}`, severity: "success" });
      setCampanas((prev) => [
        { id: res.id, asunto: subject, plantilla: template, fecha: new Date().toLocaleString('es-CO'), estado: 'enviado', apertura: Math.floor(Math.random() * 80 + 20) },
        ...prev,
      ]);
    } else {
      setOpenSnack({ open: true, message: `Error: ${res.error}`, severity: "error" });
    }
  };

  const tpl = TEMPLATES[template];

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4" fontWeight={800}>Email Marketing</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FiSave />} onClick={() => setOpenSnack({ open: true, message: "Plantilla guardada", severity: "success" })}>Guardar plantilla</Button>
          <Button variant="contained" startIcon={<FiSend />} onClick={send} disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Nueva campaña</Typography>
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Plantilla</InputLabel>
                <Select value={template} label="Plantilla" onChange={(e) => setTemplate(e.target.value as TemplateKey)}>
                  <MenuItem value="bienvenida">Bienvenida</MenuItem>
                  <MenuItem value="seguimiento">Seguimiento</MenuItem>
                  <MenuItem value="promocion">Promoción</MenuItem>
                  <MenuItem value="presupuesto">Presupuesto</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Destinatarios (emails separados por coma)" value={to} onChange={(e) => setTo(e.target.value)} fullWidth multiline minRows={1} size="small" />
              <TextField label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth size="small" />
              <TextField label="Contenido HTML" value={html} onChange={(e) => setHtml(e.target.value)} fullWidth multiline minRows={6} size="small" />
            </Stack>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={template} size="small" sx={{ bgcolor: tpl.color, color: 'common.white' }} />
              <Typography variant="caption" color="text.secondary">Vista previa automática</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minHeight: 320, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FiMail size={16} />
              <Typography variant="subtitle2">Vista previa</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 1, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary">Asunto: {subject}</Typography>
              <Box sx={{ mt: 1 }} dangerouslySetInnerHTML={{ __html: html }} />
            </Box>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FiBarChart size={16} />
              <Typography variant="subtitle2">Campañas recientes</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={1}>
              {campanas.length === 0 && <Typography variant="body2" color="text.secondary">Sin envíos recientes</Typography>}
              {campanas.map((c) => (
                <Card key={c.id} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.asunto}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.plantilla} • {c.fecha}</Typography>
                      </Box>
                      <Chip size="small" label={`${c.apertura}% apertura`} color={c.apertura > 50 ? 'success' : 'warning'} />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={openSnack.open} autoHideDuration={4000} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={openSnack.severity} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))}>{openSnack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
