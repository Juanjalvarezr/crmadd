import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Avatar, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  InputLabel, FormControl, Divider, Snackbar, Alert
} from "@mui/material";
import { FiUserPlus, FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";
import { equipoService } from '../services/database';
import SafeChip from "../components/SafeChip";

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

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
        setSnackbar({ open: true, message: "Miembro del equipo actualizado con éxito", severity: "success" });
      } else {
        await equipoService.create(formData as any);
        setSnackbar({ open: true, message: "Nuevo miembro añadido con éxito", severity: "success" });
      }
      setOpenModal(false);
      loadEquipo();
    } catch (err) {
      console.error("[EQUIPO] guardar:", err);
      setSnackbar({ open: true, message: "Error guardando miembro del equipo", severity: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este miembro del equipo?")) return;
    try {
      await equipoService.delete(id);
      setMiembros((prev) => prev.filter((m) => m.id !== id));
      setSnackbar({ open: true, message: "Miembro del equipo eliminado", severity: "success" });
    } catch (err) {
      console.error("[EQUIPO] eliminar:", err);
      setSnackbar({ open: true, message: "Error al eliminar miembro", severity: "error" });
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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2, borderLeft: '4px solid #2196f3' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Equipo Técnico y Subagentes</Typography>
            <Typography variant="caption" color="text.secondary">Gestiona los especialistas de DESEO DIGITAL</Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<FiUserPlus />} onClick={() => handleOpenModal()}>
            Añadir Miembro
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {miembros.map((miembro) => (
          <Paper key={miembro.id} variant="outlined" sx={{ p: { xs: 1, sm: 1.25 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <Avatar sx={{ bgcolor: miembro.rol === 'Admin' ? '#e91e63' : '#2196f3', width: 36, height: 36, fontSize: '0.75rem' }}>
                {(miembro.nombre || '??').substring(0,2).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '0.78rem', sm: '0.85rem' } }} noWrap>{miembro.nombre}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>{miembro.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <SafeChip label={miembro.rol} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                <SafeChip label={miembro.especialidad || 'General'} size="small" color="secondary" sx={{ height: 20, fontSize: '0.6rem' }} />
                <SafeChip label={miembro.estado || 'Activo'} size="small" color={(miembro.estado || 'Activo') === 'Activo' ? 'success' : 'default'} sx={{ height: 20, fontSize: '0.6rem' }} />
                <IconButton size="small" onClick={() => handleOpenModal(miembro)} color="warning" sx={{ p: 0.5 }}>
                  <FiEdit2 size={16} />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(miembro.id)} sx={{ p: 0.5 }}>
                  <FiTrash2 size={16} />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        ))}
        {miembros.length === 0 && (
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>No hay miembros cargados. Agregá el primero.</Typography>
        )}
      </Box>

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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
