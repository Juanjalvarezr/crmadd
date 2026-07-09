import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, Button, Card, CardContent, CardActions,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Snackbar, Alert,
  CircularProgress, Divider, List, ListItem, ListItemText, ListItemSecondaryAction
} from "@mui/material";
import { 
  FiPackage, FiPlus, FiEdit, FiTrash2, FiStar, FiClock, FiCheck, FiX, FiPlusCircle 
} from "react-icons/fi";
import { serviciosService } from "../services/database";
import SafeChip from "../components/SafeChip";

export function meta() {
  return [
    { title: "Servicios | CRM DESEO DIGITAL" },
    { name: "description", content: "Gestión de paquetes y servicios de la agencia" },
  ];
}

export default function Servicios() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "SEO",
    descripcion: "",
    precio_base: 0,
    duracion: "",
    incluye: [] as string[],
    estado: "Activo" as "Activo" | "Inactivo",
    popularidad: 3,
    tipo: "individual" as "paquete" | "individual",
    paquete_dias: 5 as 3 | 5 | 7,
    objetivo: [] as string[],
    incluye_paquete: [] as string[],
    precio_paquete: 0,
  });

  const [nuevoItemIncluye, setNuevoItemIncluye] = useState("");
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoItemPaquete, setNuevoItemPaquete] = useState("");

  const loadServicios = async () => {
    try {
      setLoading(true);
      const data = await serviciosService.getAll();
      setServicios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServicios();
  }, []);

  const handleOpenModal = (servicio?: any) => {
    if (servicio) {
      setEditingServicio(servicio);
      setFormData({
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        descripcion: servicio.descripcion || "",
        precio_base: servicio.precio_base,
        duracion: servicio.duracion || "",
        incluye: servicio.incluye || [],
        estado: servicio.estado,
        popularidad: servicio.popularidad,
        tipo: servicio.tipo || "individual",
        paquete_dias: servicio.paquete_dias || 5,
        objetivo: servicio.objetivo || [],
        incluye_paquete: servicio.incluye_paquete || [],
        precio_paquete: servicio.precio_paquete || 0,
      });
    } else {
      setEditingServicio(null);
      setFormData({
        nombre: "",
        categoria: "SEO",
        descripcion: "",
        precio_base: 0,
        duracion: "",
        incluye: [],
        estado: "Activo",
        popularidad: 3,
        tipo: "individual",
        paquete_dias: 5,
        objetivo: [],
        incluye_paquete: [],
        precio_paquete: 0,
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingServicio(null);
    setNuevoItemIncluye("");
    setNuevoObjetivo("");
    setNuevoItemPaquete("");
  };

  const handleAddItemIncluye = () => {
    if (nuevoItemIncluye.trim()) {
      setFormData(prev => ({
        ...prev,
        incluye: [...prev.incluye, nuevoItemIncluye.trim()]
      }));
      setNuevoItemIncluye("");
    }
  };

  const handleRemoveItemIncluye = (index: number) => {
    setFormData(prev => ({
      ...prev,
      incluye: prev.incluye.filter((_, i) => i !== index)
    }));
  };

  const handleAddObjetivo = () => {
    if (nuevoObjetivo.trim()) {
      setFormData(prev => ({
        ...prev,
        objetivo: [...prev.objetivo, nuevoObjetivo.trim()]
      }));
      setNuevoObjetivo("");
    }
  };

  const handleRemoveObjetivo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objetivo: prev.objetivo.filter((_, i) => i !== index)
    }));
  };

  const handleAddItemPaquete = () => {
    if (nuevoItemPaquete.trim()) {
      setFormData(prev => ({
        ...prev,
        incluye_paquete: [...prev.incluye_paquete, nuevoItemPaquete.trim()]
      }));
      setNuevoItemPaquete("");
    }
  };

  const handleRemoveItemPaquete = (index: number) => {
    setFormData(prev => ({
      ...prev,
      incluye_paquete: prev.incluye_paquete.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.nombre || formData.precio_base <= 0) {
      setSnackbar({ open: true, message: "Nombre y precio base son obligatorios", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editingServicio) {
        await serviciosService.update(editingServicio.id, formData);
        setSnackbar({ open: true, message: "Servicio actualizado correctamente", severity: "success" });
      } else {
        await serviciosService.create(formData as any);
        setSnackbar({ open: true, message: "Servicio creado correctamente", severity: "success" });
      }
      loadServicios();
      handleCloseModal();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error al guardar: " + err.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este servicio?")) {
      try {
        await serviciosService.delete(id);
        setSnackbar({ open: true, message: "Servicio eliminado", severity: "success" });
        loadServicios();
      } catch (err: any) {
        setSnackbar({ open: true, message: "Error al eliminar: " + err.message, severity: "error" });
      }
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        backgroundColor: "#fce4ec", 
        borderLeft: "5px solid #e91e63",
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FiPackage size={28} color="#e91e63" />
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#e91e63" }}>
              Portafolio de Servicios
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => handleOpenModal()}
            sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
          >
            Nuevo Servicio
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Gestiona los paquetes, precios y entregables de la agencia DESEO DIGITAL.
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {servicios.map((servicio) => (
            <Grid item xs={12} sm={6} md={4} key={servicio.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <SafeChip label={servicio.categoria} size="small" color="primary" variant="outlined" />
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#daa520' }}>
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={14} fill={i < servicio.popularidad ? "#daa520" : "none"} />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{servicio.nombre}</Typography>
                  <Typography variant="h5" sx={{ color: '#e91e63', fontWeight: 'bold', mb: 2 }}>
                    {formatCurrency(servicio.precio_base)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {servicio.descripcion}
                  </Typography>
                  
                  {servicio.duracion && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                      <FiClock size={14} />
                      <Typography variant="caption">Duración: {servicio.duracion}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Incluye:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {servicio.incluye?.map((item: string, i: number) => (
                      <SafeChip key={i} label={item} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <IconButton size="small" onClick={() => handleOpenModal(servicio)} color="primary">
                    <FiEdit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(servicio.id)} color="error">
                    <FiTrash2 />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal Crear/Editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingServicio ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre del Servicio"
                fullWidth
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.categoria}
                  label="Categoría"
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <MenuItem value="SEO">SEO</MenuItem>
                  <MenuItem value="SEM">SEM</MenuItem>
                  <MenuItem value="Social Media">Social Media</MenuItem>
                  <MenuItem value="Diseño Web">Diseño Web</MenuItem>
                  <MenuItem value="Contenido">Contenido</MenuItem>
                  <MenuItem value="Analytics">Analytics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio Base (COP)"
                type="number"
                fullWidth
                value={formData.precio_base}
                onChange={e => setFormData({ ...formData, precio_base: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  label="Tipo"
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as "paquete" | "individual" })}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="paquete">Paquete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.tipo === "paquete" && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Días del Paquete</InputLabel>
                    <Select
                      value={formData.paquete_dias}
                      label="Días del Paquete"
                      onChange={e => setFormData({ ...formData, paquete_dias: Number(e.target.value) as 3 | 5 | 7 })}
                    >
                      <MenuItem value={3}>3 días</MenuItem>
                      <MenuItem value={5}>5 días</MenuItem>
                      <MenuItem value={7}>7 días</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio Paquete (COP)"
                    type="number"
                    fullWidth
                    value={formData.precio_paquete}
                    onChange={e => setFormData({ ...formData, precio_paquete: Number(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Objetivo</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Añadir objetivo..."
                      value={nuevoObjetivo}
                      onChange={e => setNuevoObjetivo(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddObjetivo()}
                    />
                    <Button variant="outlined" onClick={handleAddObjetivo}><FiPlusCircle /></Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {formData.objetivo.map((item, index) => (
                      <SafeChip
                        key={index}
                        label={item}
                        size="small"
                        onDelete={() => handleRemoveObjetivo(index)}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {formData.objetivo.length === 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>No hay objetivos añadidos</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Incluye (Paquete)</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Añadir item del paquete..."
                      value={nuevoItemPaquete}
                      onChange={e => setNuevoItemPaquete(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddItemPaquete()}
                    />
                    <Button variant="outlined" onClick={handleAddItemPaquete}><FiPlusCircle /></Button>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, maxHeight: 150, overflow: 'auto' }}>
                    <List dense>
                      {formData.incluye_paquete.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={item} />
                          <ListItemSecondaryAction>
                            <IconButton size="small" edge="end" onClick={() => handleRemoveItemPaquete(index)}>
                              <FiX />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                      {formData.incluye_paquete.length === 0 && (
                        <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>No hay items añadidos</Typography>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                multiline
                rows={3}
                fullWidth
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duración"
                fullWidth
                placeholder="Ej: Mensual, 15 días"
                value={formData.duracion}
                onChange={e => setFormData({ ...formData, duracion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Popularidad (1-5)</InputLabel>
                <Select
                  value={formData.popularidad}
                  label="Popularidad (1-5)"
                  onChange={e => setFormData({ ...formData, popularidad: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(v => <MenuItem key={v} value={v}>{v} Estrellas</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Items Incluidos</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField 
                  size="small" 
                  fullWidth 
                  placeholder="Añadir item..." 
                  value={nuevoItemIncluye}
                  onChange={e => setNuevoItemIncluye(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddItemIncluye()}
                />
                <Button variant="outlined" onClick={handleAddItemIncluye}><FiPlusCircle /></Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 150, overflow: 'auto' }}>
                <List dense>
                  {formData.incluye.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={item} />
                      <ListItemSecondaryAction>
                        <IconButton size="small" edge="end" onClick={() => handleRemoveItemIncluye(index)}>
                          <FiX />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {formData.incluye.length === 0 && (
                    <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>No hay items añadidos</Typography>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={saving}
            sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}