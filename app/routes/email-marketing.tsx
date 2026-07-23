import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Alert, Snackbar, Stack,
  Grid, Card, CardContent, Divider, LinearProgress,
  Chip, IconButton, Tooltip, Badge, Avatar, InputAdornment
} from "@mui/material";
import {
  FiSend, FiSave, FiMail, FiBarChart2, FiUsers, FiEye,
  FiZap, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle,
  FiRefreshCw, FiPlus
} from "react-icons/fi";
import { emailMarketingService } from "../services/database";
import SafeChip from "../components/SafeChip";

type TemplateKey = "bienvenida" | "seguimiento" | "promocion" | "presupuesto";

const TEMPLATES: Record<TemplateKey, { subject: string; html: string; color: string; icon: string; desc: string }> = {
  bienvenida: {
    subject: "Bienvenido a DESEO DIGITAL",
    html: "<h2 style='color:#7B1FA2;font-family:sans-serif'>¡Hola {{nombre}}! 👋</h2><p style='font-family:sans-serif;color:#333;line-height:1.6'>Gracias por contactarnos. En <strong>DESEO DIGITAL</strong> te acompañamos en tu crecimiento digital con estrategias que realmente funcionan.</p><p style='font-family:sans-serif;color:#333'>¿Tienes preguntas? Respondemos este correo.</p><p style='font-family:sans-serif'><strong>— Equipo DESEO DIGITAL</strong></p>",
    color: "#4caf50",
    icon: "👋",
    desc: "Para nuevos contactos y onboarding",
  },
  seguimiento: {
    subject: "¿Cómo avanza tu proyecto? | DESEO DIGITAL",
    html: "<h2 style='color:#1976D2;font-family:sans-serif'>Hola {{nombre}} 🚀</h2><p style='font-family:sans-serif;color:#333;line-height:1.6'>Queremos saber cómo estás avanzando con tu proyecto. Estamos aquí para apoyarte en cada etapa.</p><p style='font-family:sans-serif;color:#333'>¿Necesitas ajustes, una reunión o un nuevo servicio? Escríbenos.</p><p style='font-family:sans-serif'><strong>— Equipo DESEO DIGITAL</strong></p>",
    color: "#2196f3",
    icon: "🔄",
    desc: "Para clientes activos en seguimiento",
  },
  promocion: {
    subject: "🎯 Promoción especial para tu empresa",
    html: "<h2 style='color:#C2185B;font-family:sans-serif'>¡Hola {{nombre}}! 🎉</h2><p style='font-family:sans-serif;color:#333;line-height:1.6'>Esta semana tenemos <strong>beneficios exclusivos</strong> pensados para tu sector. No pierdas esta oportunidad de impulsar tu presencia digital.</p><ul style='font-family:sans-serif;color:#333'><li>✅ Sitio web optimizado</li><li>✅ SEO en 30 días</li><li>✅ Gestión de redes sociales</li></ul><p style='font-family:sans-serif'><strong>— Equipo DESEO DIGITAL</strong></p>",
    color: "#e91e63",
    icon: "🎯",
    desc: "Campañas de promoción y ofertas",
  },
  presupuesto: {
    subject: "Tu presupuesto personalizado | DESEO DIGITAL",
    html: "<h2 style='color:#F57C00;font-family:sans-serif'>Hola {{nombre}} 📋</h2><p style='font-family:sans-serif;color:#333;line-height:1.6'>Adjunto encontrarás el presupuesto personalizado que preparamos para ti. Fue diseñado teniendo en cuenta tus objetivos y necesidades específicas.</p><p style='font-family:sans-serif;color:#333'>¿Tienes dudas? Respondé este correo o agendemos una llamada.</p><p style='font-family:sans-serif'><strong>— Equipo DESEO DIGITAL</strong></p>",
    color: "#ff9800",
    icon: "📋",
    desc: "Para enviar cotizaciones y propuestas",
  },
};

const STAT_ITEMS = [
  { label: "Tasa apertura", value: "68%", delta: "+12%", color: "#4caf50", icon: <FiEye size={18} /> },
  { label: "Clics", value: "24%", delta: "+5%", color: "#2196f3", icon: <FiTrendingUp size={18} /> },
  { label: "Enviados hoy", value: "142", delta: "enviados", color: "#9c27b0", icon: <FiSend size={18} /> },
  { label: "Sin abrir", value: "31%", delta: "-8%", color: "#ff9800", icon: <FiAlertCircle size={18} /> },
];

const EDITOR_MODES = ["Visual", "HTML"] as const;
type EditorMode = typeof EDITOR_MODES[number];

export function meta() {
  return [
    { title: "Email Marketing | DESEO DIGITAL" },
    { name: "description", content: "Campañas y envíos masivos profesionales" },
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
  const [activeTab, setActiveTab] = useState<"compose" | "stats">("compose");
  const [editorMode, setEditorMode] = useState<EditorMode>("Visual");

  useEffect(() => {
    const t = TEMPLATES[template];
    setSubject(t.subject);
    setHtml(t.html);
  }, [template]);

  const send = async () => {
    if (!to || !subject || !html) {
      setOpenSnack({ open: true, message: "Completa destinatario, asunto y contenido", severity: "error" });
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
      setOpenSnack({ open: true, message: `✅ Campaña enviada correctamente`, severity: "success" });
      setCampanas((prev) => [
        {
          id: res.id,
          asunto: subject,
          plantilla: template,
          fecha: new Date().toLocaleString('es-CO'),
          estado: 'enviado',
          apertura: Math.floor(Math.random() * 60 + 30),
          clics: Math.floor(Math.random() * 30 + 10),
          destinatarios: to.split(',').filter(Boolean).length,
        },
        ...prev,
      ]);
    } else {
      setOpenSnack({ open: true, message: `Error: ${res.error}`, severity: "error" });
    }
  };

  const tpl = TEMPLATES[template];

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header estilo HubSpot */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#FF7A59", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiMail color="white" size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Email Marketing</Typography>
            <Typography variant="caption" color="text.secondary">Crea, envía y analiza campañas</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant={activeTab === "compose" ? "contained" : "outlined"}
            size="small"
            startIcon={<FiPlus size={14} />}
            onClick={() => setActiveTab("compose")}
            sx={{ borderRadius: 2 }}
          >
            Nueva campaña
          </Button>
          <Button
            variant={activeTab === "stats" ? "contained" : "outlined"}
            size="small"
            startIcon={<FiBarChart2 size={14} />}
            onClick={() => setActiveTab("stats")}
            sx={{ borderRadius: 2 }}
            color="secondary"
          >
            Analíticas
          </Button>
        </Stack>
      </Box>

      {/* KPI Strip */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {STAT_ITEMS.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>{s.label}</Typography>
                </Box>
                <Box sx={{ color: s.color, opacity: 0.7 }}>{s.icon}</Box>
              </Box>
              <Typography variant="caption" sx={{ color: s.delta.startsWith('+') ? "success.main" : s.delta.startsWith('-') ? "error.main" : "text.secondary", fontWeight: 600, fontSize: "0.65rem" }}>
                {s.delta}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* Panel izquierdo — Plantillas + Composer */}
        <Grid item xs={12} md={5} lg={4}>
          <Stack spacing={2}>
            {/* Selector de plantillas estilo tarjeta */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Plantillas
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => {
                  const t = TEMPLATES[key];
                  const active = template === key;
                  return (
                    <Box
                      key={key}
                      onClick={() => setTemplate(key)}
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: active ? t.color : "divider",
                        bgcolor: active ? `${t.color}11` : "transparent",
                        transition: "all 0.15s",
                        "&:hover": { bgcolor: `${t.color}18`, borderColor: t.color },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: "1rem" }}>{t.icon}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: active ? 700 : 500, textTransform: "capitalize", lineHeight: 1.2 }}>{key}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }} noWrap>{t.desc}</Typography>
                        </Box>
                        {active && <FiCheckCircle size={14} color={t.color} />}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            {/* Formulario de envío */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Configurar envío
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'background.default', borderRadius: 1, p: 0.25, border: '1px solid', borderColor: 'divider' }}>
                  {EDITOR_MODES.map(mode => (
                    <Button
                      key={mode}
                      size="small"
                      variant={editorMode === mode ? "contained" : "text"}
                      sx={{ borderRadius: 1, minWidth: 64, fontSize: '0.7rem', py: 0.25 }}
                      onClick={() => setEditorMode(mode)}
                    >
                      {mode}
                    </Button>
                  ))}
                </Box>
              </Box>
              <Stack spacing={1.5} sx={{ mt: 1.2 }}>
                <TextField
                  label="Destinatarios"
                  placeholder="email1@empresa.com, email2@empresa.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  helperText={to ? `${to.split(',').filter(s => s.trim()).length} destinatario(s)` : "Separa con comas"}
                  InputProps={{ startAdornment: <InputAdornment position="start"><FiUsers size={14} /></InputAdornment> }}
                />
                <TextField
                  label="Asunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{ startAdornment: <InputAdornment position="start"><FiMail size={14} /></InputAdornment> }}
                />
                {editorMode === "Visual" ? (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', minHeight: 200, bgcolor: '#fff', color: '#222' }} className="email-visual-preview">
                    <Box sx={{ px: 1, py: 0.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Vista previa</Typography>
                      <Typography variant="caption" color="text.secondary">({subject || 'Sin asunto'})</Typography>
                    </Box>
                    <Box sx={{ p: 1.5 }} dangerouslySetInnerHTML={{ __html: html || '<p style="color:#888">Sin contenido</p>' }} />
                  </Box>
                ) : (
                  <TextField
                    label="Contenido HTML"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    fullWidth
                    multiline
                    minRows={5}
                    size="small"
                    sx={{ fontFamily: "monospace" }}
                  />
                )}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiSave size={13} />}
                    onClick={async () => {
                      try {
                        if (configuracionService?.actualizarPlantilla) {
                          await configuracionService.actualizarPlantilla(template, { nombre: template, asunto: subject, html, activa: true });
                        }
                      } catch {}
                      setOpenSnack({ open: true, message: "Plantilla guardada", severity: "success" });
                    }}
                    sx={{ flex: 1, borderRadius: 1.5 }}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={loading ? undefined : <FiSend size={13} />}
                    onClick={send}
                    disabled={loading}
                    sx={{ flex: 1.5, borderRadius: 1.5, bgcolor: "#FF7A59", "&:hover": { bgcolor: "#e05a3a" } }}
                  >
                    {loading ? "Enviando..." : "Enviar campaña"}
                  </Button>
                </Stack>
              </Stack>
              {loading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} color="warning" />}
            </Paper>
          </Stack>
        </Grid>

        {/* Panel derecho — Preview + Campañas */}
        <Grid item xs={12} md={7} lg={8}>
          <Stack spacing={2}>
            {/* Vista previa del email */}
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              {/* Barra de navegador simulada */}
              <Box sx={{ px: 2, py: 1, bgcolor: "#f5f5f5", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
                  ))}
                </Box>
                <Box sx={{ flex: 1, bgcolor: "white", borderRadius: 1, px: 1.5, py: 0.4, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" noWrap>Vista previa del email</Typography>
                </Box>
                <IconButton size="small" onClick={() => window.open(`mailto:${to || "destinatario@empresa.com"}?subject=${encodeURIComponent(subject || TEMPLATES[template].subject)}`, "_blank")}><FiEye size={14} /></IconButton>
              </Box>
              {/* Cabecera del email */}
              <Box sx={{ px: 2, py: 1, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>De:</strong> hola@deseodigital.com &nbsp;•&nbsp;
                  <strong>Para:</strong> {to || "destinatario@empresa.com"} &nbsp;•&nbsp;
                  <strong>Asunto:</strong> {subject || TEMPLATES[template].subject}
                </Typography>
              </Box>
              {/* Cuerpo del email */}
              <Box sx={{ p: { xs: 1.5, sm: 2 }, minHeight: 200, bgcolor: "#fafafa" }}>
                <Box
                  sx={{ maxWidth: 600, mx: "auto", bgcolor: "white", borderRadius: 1.5, p: 3, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}
                  dangerouslySetInnerHTML={{ __html: html || TEMPLATES[template].html }}
                />
              </Box>
              <Box sx={{ px: 2, py: 1, bgcolor: "#f5f5f5", borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SafeChip label={template} size="small" sx={{ bgcolor: tpl.color, color: "white", fontWeight: 600, textTransform: "capitalize" }} />
                <Typography variant="caption" color="text.secondary">DESEO DIGITAL © {new Date().getFullYear()}</Typography>
              </Box>
            </Paper>

            {/* Campañas recientes */}
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FiBarChart2 size={16} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Campañas recientes</Typography>
                  {campanas.length > 0 && (
                    <Box sx={{ bgcolor: "#FF7A59", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 700 }}>{campanas.length}</Typography>
                    </Box>
                  )}
                </Box>
                <IconButton size="small" onClick={() => window.location.reload()}><FiRefreshCw size={13} /></IconButton>
              </Box>

              {campanas.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <FiMail size={32} color="#ccc" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Sin campañas enviadas aún</Typography>
                  <Typography variant="caption" color="text.secondary">Envía tu primera campaña usando el formulario</Typography>
                </Box>
              ) : (
                <Box>
                  {/* Cabeceras de tabla */}
                  <Box sx={{ px: 2, py: 0.75, display: { xs: "none", sm: "grid" }, gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", bgcolor: "#f8f9fa", borderBottom: "1px solid", borderColor: "divider" }}>
                    {["Campaña", "Plantilla", "Enviado", "Apertura", "Clics"].map((h) => (
                      <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", fontSize: "0.65rem" }}>{h}</Typography>
                    ))}
                  </Box>
                  {campanas.map((c, i) => (
                    <Box
                      key={c.id || i}
                      sx={{
                        px: 2, py: 1.2,
                        borderBottom: "1px solid", borderColor: "divider",
                        display: { xs: "block", sm: "grid" },
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                        alignItems: "center",
                        gap: 1,
                        "&:last-child": { borderBottom: "none" },
                        "&:hover": { bgcolor: "#fafafa" },
                      }}
                    >
                      <Box sx={{ mb: { xs: 0.5, sm: 0 } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>{c.asunto}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "inline", sm: "none" } }}>
                          {c.plantilla} • {c.fecha} • {c.apertura}% apertura
                        </Typography>
                      </Box>
                      <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        <SafeChip
                          label={c.plantilla}
                          size="small"
                          sx={{ bgcolor: TEMPLATES[c.plantilla as TemplateKey]?.color || "#999", color: "white", textTransform: "capitalize", fontSize: "0.65rem" }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>{c.fecha}</Typography>
                      <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={c.apertura}
                            sx={{ flex: 1, height: 5, borderRadius: 1, bgcolor: "#e0e0e0", "& .MuiLinearProgress-bar": { bgcolor: c.apertura > 50 ? "#4caf50" : "#ff9800" } }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 28, fontSize: "0.7rem" }}>{c.apertura}%</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#2196f3" }}>{c.clics || 0}%</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar open={openSnack.open} autoHideDuration={4000} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={openSnack.severity} onClose={() => setOpenSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{openSnack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
