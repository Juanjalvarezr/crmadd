import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Avatar, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  InputLabel, FormControl, Divider
} from "@mui/material";
import { FiUserPlus, FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";
import { subagentesService as equipoService } from '../services/supabase';

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
            if (typeof window !== "undefined") alert("Error guardando miembro");
    }
  };

  const handleDelete = async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar este miembro del equipo?")) return;
    try {
      await equipoService.delete(id);
      setMiembros((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
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
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1, sm: 1.5 }, backgroundColor: "#f0f7ff", borderLeft: "3px solid #2196f3" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", fontSize: { xs: '1rem', sm: '1.1rem' } }}>Equipo Técnico y Subagentes</Typography>
            <Typography variant="caption" color="text.secondary">Gestiona los especialistas de DESEO DIGITAL</Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<FiUserPlus />} onClick={() => handleOpenModal()}>
            Añadir Miembro
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {miembros.map((miembro) => (
          <Grid item xs={12} sm={6} md={4} key={miembro.id}>
            <Card sx={{ borderRadius: 2, transition: "0.2s", '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: miembro.rol === 'Admin' ? '#e91e63' : '#2196f3', width: 40, height: 40, fontSize: '0.8rem' }}>
                    {(miembro.nombre || "??").substring(0,2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", wordBreak: "break-word" }}>{miembro.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>{miembro.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, flexWrap: "wrap" }}>
                  <Chip label={miembro.rol} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Chip label={miembro.especialidad || "General"} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Chip
                    label={miembro.estado || "Activo"}
                    size="small"
                    color={(miembro.estado || "Activo") === 'Activo' ? 'success' : 'default'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Button size="small" startIcon={<FiMail size={14} />} href={`mailto:${miembro.email}`}>
                    Contactar
                  </Button>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenModal(miembro)} color="warning">
                      <FiEdit2 size={14} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(miembro.id)}>
                      <FiTrash2 size={14} />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {miembros.length === 0 && (
          <Grid item xs={12}>
            <Typography sx={{ textAlign: "center", color: "text.secondary", py: 3, fontSize: '0.85rem' }}>
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
