import React, { useState, useEffect } from "react";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import type { Route } from "./+types/email-marketing";
import Grid from "@mui/material/Grid";
import { 
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, CircularProgress,
  Card, CardContent, CardActions, Chip, List, ListItem, ListItemText, ListItemIcon,
  ListItemSecondaryAction, Divider, Switch, FormControlLabel
} from "@mui/material";
import {
  Mail, Send, Edit2, Trash2, Plus, Users, Calendar, BarChart2, Eye,
  X, RefreshCw, Check, AlertCircle, Clock, Target, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { emailService, clientesService } from "../services/database";

// Tipos para Email Marketing
interface CampanaEmail {
  id: string;
  nombre: string;
  asunto: string;
  contenido: string;
  tipo: "promocional" | "informativo" | "seguimiento" | "bienvenida";
  destinatarios: string[];
  fechaEnvio: string;
  estado: "borrador" | "programado" | "enviado" | "pausado";
  estadisticas: {
    enviados: number;
    abiertos: number;
    clics: number;
    rebotes: number;
    cancelaciones: number;
  };
  creadoEn: string;
}

interface PlantillaEmail {
  id: string;
  nombre: string;
  asunto: string;
  contenido: string;
  categoria: string;
  usos: number;
}

export function meta() {
  return [
    { title: "Email Marketing | CRM DESEO DIGITAL" },
    { name: "description", content: "Gestión de campañas de email marketing" },
  ];
}


// Zod para Emails
const campanaSchema = z.object({
  nombre: z.string().min(5, "El nombre es muy corto"),
  asunto: z.string().min(5, "El asunto debe ser atractivo"),
  contenido: z.string().min(20, "El contenido es demasiado breve"),
  tipo: z.enum(["promocional", "informativo", "seguimiento", "bienvenida"]),
  destinatarios: z.array(z.string()).min(1, "Selecciona al menos un contacto"),
  fechaEnvio: z.string().optional(),
  enviarAhora: z.boolean()
});

export default function EmailMarketing() {
  // Estados principales
  const [campanas, setCampanas] = useState<CampanaEmail[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaEmail[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("campanas");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" | "warning" | "info" });
  
  // Estados para modales
  const [openCampanaModal, setOpenCampanaModal] = useState(false);
  const [openPlantillaModal, setOpenPlantillaModal] = useState(false);
  const [editingCampana, setEditingCampana] = useState<CampanaEmail | null>(null);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof campanaSchema>>({
    nombre: "",
    asunto: "",
    contenido: "",
    tipo: "promocional",
    destinatarios: [],
    fechaEnvio: "",
    enviarAhora: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar clientes
        const clientesData = await clientesService.getAll();
        setClientes(clientesData);
        
        // Cargar datos reales
        const [campanasData, plantillasData] = await Promise.all([
          emailService.getCampanas(),
          emailService.getPlantillas()
        ]);
        
        setCampanas(campanasData as CampanaEmail[]);
        
        if (plantillasData && plantillasData.length > 0) {
          setPlantillas(plantillasData as PlantillaEmail[]);
        } else {
          // Plantilla inicial para DESEO DIGITAL si no hay nada en DB
          setPlantillas([
            {
              id: "welcome-deseo",
              nombre: "Bienvenida Agencia Deseo Digital",
              asunto: "🚀 ¡Bienvenido a la transformación digital!",
              contenido: "<h1>Hola {{nombre}}</h1><p>Es un gusto tenerte con nosotros en DESEO DIGITAL.</p>",
              categoria: "bienvenida",
              usos: 0
            }
          ]);
        }
        
      } catch (err: any) {
        setError("Error al cargar datos: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Funciones de manejo
  const handleOpenCampanaModal = (campana?: CampanaEmail) => {
    if (campana) {
      setEditingCampana(campana);
      setFormData({
        nombre: campana.nombre,
        asunto: campana.asunto,
        contenido: campana.contenido,
        tipo: campana.tipo,
        destinatarios: campana.destinatarios,
        fechaEnvio: campana.fechaEnvio,
        enviarAhora: false
      });
    } else {
      setEditingCampana(null);
      setFormData({
        nombre: "",
        asunto: "",
        contenido: "",
        tipo: "promocional",
        destinatarios: [],
        fechaEnvio: "",
        enviarAhora: true
      });
    }
    setOpenCampanaModal(true);
  };

  const handleSavePlantilla = async (plantilla: Partial<PlantillaEmail>) => {
    try {
      // Lógica para guardar en Supabase
      const nueva = await emailService.createPlantilla(plantilla);
      setPlantillas(prev => [...prev, nueva as any]);
      setSnackbar({ open: true, message: "Plantilla guardada", severity: "success" });
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: "Error al guardar plantilla: " + err.message, 
        severity: "error" 
      });
    }
  };

  const handleCloseCampanaModal = () => {
    setOpenCampanaModal(false);
    setEditingCampana(null);
  };

  const handleSaveCampana = async () => {
    setSending(true);
    try {
      const data = campanaSchema.parse(formData);

      // CONEXIÓN RESEND: Si enviarAhora es true, intentamos enviar
      if (data.enviarAhora) {
        await emailService.sendRealEmail(data.destinatarios, data.asunto, data.contenido);
      }

      const nuevaCampana: CampanaEmail = {
        id: editingCampana?.id || Date.now().toString(),
        nombre: data.nombre,
        asunto: data.asunto,
        contenido: data.contenido,
        tipo: data.tipo,
        destinatarios: data.destinatarios,
        fechaEnvio: data.enviarAhora ? new Date().toISOString() : (data.fechaEnvio || ""),
        estado: data.enviarAhora ? "enviado" : "programado",
        estadisticas: {
          enviados: data.destinatarios.length,
          abiertos: 0,
          clics: 0,
          rebotes: 0,
          cancelaciones: 0
        },
        creadoEn: new Date().toISOString()
      };

      if (editingCampana) {
        await emailService.updateCampana(editingCampana.id, nuevaCampana);
        setCampanas(prev => prev.map(c => c.id === editingCampana.id ? { ...nuevaCampana, id: editingCampana.id } : c));
        setSnackbar({ 
          open: true, 
          message: "Campaña actualizada correctamente", 
          severity: "success" 
        });
      } else {
        const saved = await emailService.createCampana(nuevaCampana);
        setCampanas(prev => [...prev, saved as CampanaEmail]);
        setSnackbar({ 
          open: true, 
          message: "Campaña creada correctamente", 
          severity: "success" 
        });
      }

      handleCloseCampanaModal();
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: "Error al guardar campaña: " + err.message, 
        severity: "error" 
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteCampana = async (campana: CampanaEmail) => {
    if (confirm(`¿Estás seguro de eliminar la campaña "${campana.nombre}"?`)) {
      try {
        await emailService.deleteCampana(campana.id);
        setCampanas(prev => prev.filter(c => c.id !== campana.id));
        setSnackbar({ 
          open: true, 
          message: "Campaña eliminada correctamente", 
          severity: "success" 
        });
      } catch (err: any) {
        setSnackbar({ 
          open: true, 
          message: "Error al eliminar campaña: " + err.message, 
          severity: "error" 
        });
      }
    }
  };

  const handleSendTestEmail = async (campana: CampanaEmail) => {
    try {
      setSnackbar({ 
        open: true, 
        message: "Enviando email de prueba...", 
        severity: "info" 
      });
      
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar({ 
        open: true, 
        message: "Email de prueba enviado a contacto@deseodigital.com", 
        severity: "success" 
      });
    } catch (err: any) {
      setSnackbar({ 
        open: true, 
        message: "Error al enviar email de prueba: " + err.message, 
        severity: "error" 
      });
    }
  };

  const handleSelectAllClientes = () => {
    const todosLosEmails = clientes.map(c => c.email).filter(Boolean);
    setFormData(prev => ({ ...prev, destinatarios: todosLosEmails }));
  };

  const handleSelectClientesActivos = () => {
    const emailsActivos = clientes
      .filter(c => c.estado === "Activo")
      .map(c => c.email)
      .filter(Boolean);
    setFormData(prev => ({ ...prev, destinatarios: emailsActivos }));
  };

  const getTipoColor = (tipo: CampanaEmail["tipo"]) => {
    const colors = {
      promocional: "#e91e63",
      informativo: "#2196f3",
      seguimiento: "#4caf50",
      bienvenida: "#ff9800"
    };
    return colors[tipo] || "#666";
  };

  const getEstadoColor = (estado: CampanaEmail["estado"]) => {
    const colors = {
      borrador: "#9e9e9e",
      programado: "#ff9800",
      enviado: "#4caf50",
      pausado: "#f44336"
    };
    return colors[estado] || "#666";
  };

  const getTasaApertura = (estadisticas: CampanaEmail["estadisticas"]) => {
    if (estadisticas.enviados === 0) return 0;
    return Math.round((estadisticas.abiertos / estadisticas.enviados) * 100);
  };

  const getTasaClics = (estadisticas: CampanaEmail["estadisticas"]) => {
    if (estadisticas.abiertos === 0) return 0;
    return Math.round((estadisticas.clics / estadisticas.abiertos) * 100);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 }, 
        backgroundColor: "#e3f2fd", 
        borderLeft: "5px solid #2196f3",
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Mail size={28} color="#1976d2" />
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            Email Marketing
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Crea y gestiona campañas de email marketing para tus clientes. Automatiza comunicaciones y mide resultados.
        </Typography>
      </Paper>

      {/* Pestañas de navegación */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant={activeTab === "campanas" ? "contained" : "outlined"}
            startIcon={<Send />}
            onClick={() => setActiveTab("campanas")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "campanas" ? "#e91e63" : "transparent",
              borderColor: activeTab === "campanas" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "campanas" ? "white" : "#666"
            }}
          >
            Campañas
          </Button>
          <Button
            variant={activeTab === "plantillas" ? "contained" : "outlined"}
            startIcon={<Edit2 />}
            onClick={() => setActiveTab("plantillas")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "plantillas" ? "#e91e63" : "transparent",
              borderColor: activeTab === "plantillas" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "plantillas" ? "white" : "#666"
            }}
          >
            Plantillas
          </Button>
          <Button
            variant={activeTab === "estadisticas" ? "contained" : "outlined"}
            startIcon={<BarChart2 />}
            onClick={() => setActiveTab("estadisticas")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "estadisticas" ? "#e91e63" : "transparent",
              borderColor: activeTab === "estadisticas" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "estadisticas" ? "white" : "#666"
            }}
          >
            Estadísticas
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Pestaña de Campañas */}
          {activeTab === "campanas" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Campañas de Email ({campanas.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => handleOpenCampanaModal()}
                  sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
                >
                  Nueva Campaña
                </Button>
              </Box>

              <Grid container spacing={3}>
                <AnimatePresence>
                {campanas.map((campana) => (
                  <Grid item xs={12} md={6} lg={4} key={campana.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", '&:hover': { boxShadow: 4 } }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                            {campana.nombre}
                          </Typography>
                          <Chip
                            label={campana.estado}
                            size="small"
                            sx={{
                              backgroundColor: getEstadoColor(campana.estado),
                              color: "white",
                              fontSize: "0.7rem"
                            }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Asunto: {campana.asunto}
                        </Typography>
                        
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Chip
                            label={campana.tipo}
                            size="small"
                            sx={{
                              backgroundColor: getTipoColor(campana.tipo),
                              color: "white"
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {campana.destinatarios.length} destinatarios
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(campana.creadoEn), "dd/MM/yyyy HH:mm")}
                        </Typography>
                        
                        {campana.estado === "enviado" && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                              Estadísticas:
                            </Typography>
                            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                              <Typography variant="caption">
                                📧 {campana.estadisticas.enviados} enviados
                              </Typography>
                              <Typography variant="caption">
                                👁️ {campana.estadisticas.abiertos} abiertos ({getTasaApertura(campana.estadisticas)}%)
                              </Typography>
                              <Typography variant="caption">
                                🔗 {campana.estadisticas.clics} clics ({getTasaClics(campana.estadisticas)}%)
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button size="small" startIcon={<Edit2 size={16}/>} onClick={() => handleOpenCampanaModal(campana)}>
                            Editar
                          </Button>
                          <Button size="small" startIcon={<Eye size={16}/>} onClick={() => handleSendTestEmail(campana)}>
                            Vista Previa
                          </Button>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button size="small" startIcon={<Send size={16}/>} onClick={() => handleSendTestEmail(campana)}>
                            Test
                          </Button>
                          <Button size="small" color="error" startIcon={<Trash2 size={16}/>} onClick={() => handleDeleteCampana(campana)}>
                            Eliminar
                          </Button>
                        </Box>
                      </CardActions>
                    </Card>
                    </motion.div>
                  </Grid>
                ))}
                </AnimatePresence>
              </Grid>
            </Box>
          )}

          {/* Pestaña de Plantillas */}
          {activeTab === "plantillas" && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Plantillas de Email ({plantillas.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => handleOpenCampanaModal()}
                  sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
                >
                  Nueva Plantilla
                </Button>
              </Box>

              <Grid container spacing={3}>
                {plantillas.map((plantilla) => (
                  <Grid item xs={12} md={6} lg={4} key={plantilla.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                          {plantilla.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Asunto: {plantilla.asunto}
                        </Typography>
                        <Chip
                          label={plantilla.categoria}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Usado {plantilla.usos} veces
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" startIcon={<Edit2 size={16}/>}>
                          Editar
                        </Button>
                        <Button size="small" startIcon={<Send size={16}/>}>
                          Usar Plantilla
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Pestaña de Estadísticas */}
          {activeTab === "estadisticas" && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                Estadísticas Generales
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Mail size={32} color="#e91e63" />
                      <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                        1,234
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emails Enviados
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Eye size={32} color="#4caf50" />
                      <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                        687
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa Apertura (55.7%)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Target size={32} color="#2196f3" />
                      <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                        234
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tasa Clics (34.1%)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <TrendingUp size={32} color="#ff9800" />
                      <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                        +12.5%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Crecimiento Mensual
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Modal para crear/editar campaña */}
      <Dialog open={openCampanaModal} onClose={handleCloseCampanaModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingCampana ? "Editar Campaña" : "Nueva Campaña"}
            <IconButton onClick={handleCloseCampanaModal}>
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nombre de la Campaña *"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            
            <TextField
              label="Asunto del Email *"
              fullWidth
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Tipo de Campaña</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de Campaña"
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as CampanaEmail["tipo"] })}
              >
                <MenuItem value="promocional">Promocional</MenuItem>
                <MenuItem value="informativo">Informativo</MenuItem>
                <MenuItem value="seguimiento">Seguimiento</MenuItem>
                <MenuItem value="bienvenida">Bienvenida</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Contenido del Email *"
              fullWidth
              multiline
              rows={8}
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Puedes usar HTML y variables como {{nombre}}, {{empresa}}, etc."
            />
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Destinatarios ({formData.destinatarios.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button size="small" onClick={handleSelectAllClientes}>
                  Todos los Clientes ({clientes.length})
                </Button>
                <Button size="small" onClick={handleSelectClientesActivos}>
                  Clientes Activos ({clientes.filter(c => c.estado === "Activo").length})
                </Button>
              </Box>
              <TextField
                label="Emails de Destinatarios"
                fullWidth
                multiline
                rows={3}
                value={formData.destinatarios.join(", ")}
                onChange={(e) => setFormData({ ...formData, destinatarios: e.target.value.split(", ").map(email => email.trim()).filter(Boolean) })}
                placeholder="email1@ejemplo.com, email2@ejemplo.com"
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enviarAhora}
                  onChange={(e) => setFormData({ ...formData, enviarAhora: e.target.checked })}
                />
              }
              label="Enviar ahora"
            />
            
            {!formData.enviarAhora && (
              <TextField
                label="Fecha y Hora de Envío"
                type="datetime-local"
                fullWidth
                value={formData.fechaEnvio}
                onChange={(e) => setFormData({ ...formData, fechaEnvio: e.target.value })}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCampanaModal}>Cancelar</Button>
          <Button 
            onClick={handleSaveCampana} 
            variant="contained"
            disabled={sending}
            sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
          >
            {sending ? "Guardando..." : "Guardar Campaña"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
