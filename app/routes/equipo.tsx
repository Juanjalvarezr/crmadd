import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Avatar, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  InputLabel, FormControl
} from "@mui/material";
import { FiUserPlus, FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";
import { equipoService } from '../services/database';

export default function Equipo() {
  const [miembros, setMiembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Técnico",
    especialidad: "",
    estado: "Activo"
  });

  const loadEquipo = async () => {
    setLoading(true);
    try {
      const data = await equipoService.getAll();
      setMiembros(data || []);
    } catch (err) {
      console.error("[EQUIPO] cargar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEquipo(); }, []);

  const handleOpenModal = (miembro?: any) => {
    if (miembro) {
      setEditingId(miembro.id);
      setFormData({
        nombre: miembro.nombre || "",
        email: miembro.email || "",
        rol: miembro.rol || "Técnico",
        especialidad: miembro.especialidad || "",
        estado: miembro.estado || "Activo"
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", email: "", rol: "Técnico", especialidad: "", estado: "Activo" });
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await equipoService.update(editingId, formData as any);
      } else {
        await equipoService.create(formData as any);
      }
      setOpenModal(false);
      loadEquipo();
    } catch (err) {
      console.error("[EQUIPO] guardar:", err);
      alert("Error guardando miembro");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este miembro del equipo?")) return;
    try {
      await equipoService.delete(id);
      setMiembros((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("[EQUIPO] eliminar:", err);
      alert("Error eliminando miembro");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando equipo...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: "#f0f7ff", borderLeft: "5px solid #2196f3" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>Equipo Técnico y Subagentes</Typography>
            <Typography variant="body2" color="text.secondary">Gestiona los especialistas de DESEO DIGITAL</Typography>
          </Box>
          <Button variant="contained" startIcon={<FiUserPlus />} onClick={() => handleOpenModal()}>
            Añadir Miembro
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {miembros.map((miembro) => (
          <Grid item xs={12} sm={6} md={4} key={miembro.id}>
            <Card sx={{
              borderRadius: 3,
              transition: "0.3s",
              "&:hover": { boxShadow: 6, transform: "translateY(-5px)" }
            }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: miembro.rol === 'Admin' ? '#e91e63' : '#2196f3', width: 56, height: 56 }}>
                    {(miembro.nombre || "??").substring(0,2).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>{miembro.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{miembro.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <Chip label={miembro.rol} size="small" color="primary" variant="outlined" />
                  <Chip label={miembro.especialidad || "General"} size="small" color="secondary" />
                  <Chip
                    label={miembro.estado || "Activo"}
                    size="small"
                    color={(miembro.estado || "Activo") === 'Activo' ? 'success' : 'default'}
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button size="small" startIcon={<FiMail />} href={`mailto:${miembro.email}`}>
                    Contactar
                  </Button>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenModal(miembro)} color="warning">
                      <FiEdit2 />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(miembro.id)}>
                      <FiTrash2 />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {miembros.length === 0 && (
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
              No hay miembros cargados. Agregá el primero.
            </Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? "Editar Miembro" : "Nuevo Miembro del Equipo"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.rol}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                <MenuItem value="Técnico">Técnico</MenuItem>
                <MenuItem value="Creativo">Creativo</MenuItem>
                <MenuItem value="Soporte">Soporte</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Vendedor">Vendedor</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Especialidad (Ej: SEO, React, Diseño)"
              fullWidth
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
