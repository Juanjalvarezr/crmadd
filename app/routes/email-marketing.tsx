import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Alert, Snackbar, CircularProgress, Stack
} from "@mui/material";
import { FiSend, FiSave, FiList, FiMail, FiPlus } from "react-icons/fi";
import { emailMarketingService } from "../services/database";

type TemplateKey = "bienvenida" | "seguimiento" | "promocion" | "presupuesto";

const TEMPLATES: Record<TemplateKey, { subject: string; html: string }> = {
  bienvenida: {
    subject: "Bienvenido a DESEO DIGITAL",
    html: "<h1>Hola {{nombre}}</h1><p>Gracias por contactarnos. Te acompañamos en tu crecimiento digital.</p>",
  },
  seguimiento: {
    subject: "Seguimiento de tu proyecto",
    html: "<h1>Hola {{nombre}}</h1><p>Queremos saber cómo avanzas. ¿Te ayudo en algo más?</p>",
  },
  promocion: {
    subject: "Promoción especial para tu empresa",
    html: "<h1>Hola {{nombre}}</h1><p>Esta semana tenemos beneficios exclusivos para tu sector.</p>",
  },
  presupuesto: {
    subject: "Tu presupuesto DESEO DIGITAL",
    html: "<h1>Hola {{nombre}}</h1><p>Adjunto el presupuesto solicitado. Dudas, respondé este correo.</p>",
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
    } else {
      setOpenSnack({ open: true, message: `Error: ${res.error}`, severity: "error" });
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4" fontWeight={700}>Email Marketing</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FiSave />} onClick={() => setOpenSnack({ open: true, message: "Plantilla guardada", severity: "success" })}>Guardar plantilla</Button>
          <Button variant="contained" startIcon={<FiSend />} onClick={send} disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Plantilla</InputLabel>
            <Select value={template} label="Plantilla" onChange={(e) => setTemplate(e.target.value as TemplateKey)}>
              <MenuItem value="bienvenida">Bienvenida</MenuItem>
              <MenuItem value="seguimiento">Seguimiento</MenuItem>
              <MenuItem value="promocion">Promoción</MenuItem>
              <MenuItem value="presupuesto">Presupuesto</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Destinatarios (emails separados por coma)" value={to} onChange={(e) => setTo(e.target.value)} fullWidth multiline minRows={1} />
          <TextField label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth />
          <TextField label="Contenido HTML" value={html} onChange={(e) => setHtml(e.target.value)} fullWidth multiline minRows={8} />
        </Stack>
      </Paper>

      <Snackbar open={openSnack.open} autoHideDuration={4000} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={openSnack.severity} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))}>{openSnack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
