import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Avatar, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  InputLabel, FormControl, Divider
} from "@mui/material";
import { FiUserPlus, FiMail, FiEdit2, FiTrash2 } from "react-icons/fi";
import { subagentesService as equipoService, agentePermisosService, agenteActividadService } from '../services/supabase';
import { perfilesAgente, type RolAgente, modulosCrm } from '../constants/agentes';
import type { AgentePermiso } from '../types/crm';

export default function Equipo() {
  const [miembros, setMiembros] = useState<any[]>([]);
  const [actividades, setActividades] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Técnico",
    especialidad: "",
    estado: "Activo",
    bio: "",
    avatar_url: "",
    skills: [] as string[],
    herramientas: [] as string[],
    capacidad_max_proyectos: 3,
    modo_operativo: "activo" as const,
    agent_prompt_slug: ""
  });
  const [permisos, setPermisos] = useState<AgentePermiso[]>([]);

  const loadEquipo = async () => {
    setLoading(true);
    try {
      const data = await equipoService.getAll();
      setMiembros(data || []);
      try {
        const acts = await agenteActividadService.getByAgente(0, 200);
        const grouped: Record<number, any[]> = {};
        for (const item of acts) {
          const key = Number(item.agente_id);
          if (!grouped[key]) grouped[key] = [];
          if (grouped[key].length < 5) grouped[key].push(item);
        }
        setActividades(grouped);
      } catch {
        setActividades({});
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEquipo(); }, []);

  const handleOpenModal = async (miembro?: any) => {
    if (miembro) {
      setEditingId(miembro.id);
      setFormData({
        nombre: miembro.nombre || "",
        email: miembro.email || "",
        rol: miembro.rol || "Técnico",
        especialidad: miembro.especialidad || "",
        estado: miembro.estado || "Activo",
        bio: miembro.bio || "",
        avatar_url: miembro.avatar_url || "",
        skills: Array.isArray(miembro.skills) ? miembro.skills : [],
        herramientas: Array.isArray(miembro.herramientas) ? miembro.herramientas : [],
        capacidad_max_proyectos: Number(miembro.capacidad_max_proyectos || 3),
        modo_operativo: miembro.modo_operativo || "activo",
        agent_prompt_slug: miembro.agent_prompt_slug || ""
      });
      try {
        const perms = await agentePermisosService.getByAgente(miembro.id);
        setPermisos(perms);
      } catch {
        setPermisos([]);
      }
    } else {
      setEditingId(null);
      setFormData({
        nombre: "",
        email: "",
        rol: "Técnico",
        especialidad: "",
        estado: "Activo",
        bio: "",
        avatar_url: "",
        skills: [],
        herramientas: [],
        capacidad_max_proyectos: 3,
        modo_operativo: "activo",
        agent_prompt_slug: ""
      });
      setPermisos([]);
    }
    setOpenModal(true);
  };

  const handleRolChange = (rol: string) => {
    setFormData((prev) => {
      const perfil = perfilesAgente[rol as RolAgente];
      return {
        ...prev,
        rol,
        especialidad: prev.especialidad || perfil?.descripcion || "",
        skills: perfil?.skills_sugeridas || [],
        herramientas: perfil?.herramientas_sugeridas || [],
        capacidad_max_proyectos: perfil?.max_proyectos ?? prev.capacidad_max_proyectos,
        agent_prompt_slug: perfil?.prompt_sugerido || prev.agent_prompt_slug
      };
    });
  };

  const handleSave = async () => {
    try {
      const payload: any = { ...formData };
      if (!editingId) {
        const perfil = perfilesAgente[formData.rol as RolAgente];
        if (perfil && !payload.agent_prompt_slug) payload.agent_prompt_slug = perfil.prompt_sugerido;
      }
      const saved = editingId
        ? await equipoService.update(editingId, payload)
        : await equipoService.create(payload);

      if (saved?.id) {
        try { await agenteActividadService.create(saved.id, editingId ? 'perfil_actualizado' : 'perfil_creado', 'equipo', saved.id); } catch {}

        for (const modulo of modulosCrm) {
          const checked = permisos.find((p) => p.modulo === modulo);
          if (checked) {
            try { await agentePermisosService.setPermiso(saved.id, modulo, checked.acciones); } catch {}
          } else {
            try { await agentePermisosService.removePermiso(saved.id, modulo); } catch {}
          }
        }
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

                {actividades[miembro.id]?.length ? (
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f7f9fc', borderRadius: 1, fontSize: 12 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Actividad reciente
                    </Typography>
                    {actividades[miembro.id].slice(0, 3).map((act, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 0.3 }}>
                        <Typography variant="caption" sx={{ flex: 1 }}>{act.accion}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {new Date(act.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}
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

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? "Editar Miembro" : "Nuevo Miembro del Equipo"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Nombre Completo"
                sx={{ flex: '1 1 240px' }}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
              <TextField
                label="Email"
                sx={{ flex: '1 1 240px' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ flex: '1 1 220px' }}>
                <InputLabel>Perfil / Rol</InputLabel>
                <Select
                  value={formData.rol}
                  label="Perfil / Rol"
                  onChange={(e) => handleRolChange(e.target.value)}
                >
                  {(Object.keys(perfilesAgente) as RolAgente[]).map((rol) => (
                    <MenuItem key={rol} value={rol}>
                      {perfilesAgente[rol].icono} {rol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Especialidad / Función visible"
                sx={{ flex: '2 1 300px' }}
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              />
            </Box>

            <TextField
              label="Bio corta"
              fullWidth
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Avatar URL"
                sx={{ flex: '1 1 240px' }}
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
              <TextField
                label="Prompt slug"
                sx={{ flex: '1 1 240px' }}
                value={formData.agent_prompt_slug}
                onChange={(e) => setFormData({ ...formData, agent_prompt_slug: e.target.value })}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                label="Capacidad máx. proyectos"
                type="number"
                sx={{ width: 180 }}
                value={formData.capacidad_max_proyectos}
                onChange={(e) => setFormData({ ...formData, capacidad_max_proyectos: Number(e.target.value || 0) })}
              />
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Modo operativo</InputLabel>
                <Select
                  value={formData.modo_operativo}
                  label="Modo operativo"
                  onChange={(e) => setFormData({ ...formData, modo_operativo: e.target.value as any })}
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="solo_lectura">Solo lectura</MenuItem>
                  <MenuItem value="vacaciones">Vacaciones</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2">Permisos por módulo</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {modulosCrm.map((modulo) => {
                  const checked = !!permisos.find((p) => p.modulo === modulo);
                  return (
                    <Chip
                      key={modulo}
                      label={modulo}
                      clickable
                      color={checked ? "primary" : "default"}
                      variant={checked ? "filled" : "outlined"}
                      onClick={() =>
                        setPermisos((prev) => {
                          if (prev.find((p) => p.modulo === modulo)) {
                            return prev.filter((p) => p.modulo !== modulo);
                          }
                          return [...prev, { agente_id: 0, modulo, acciones: ['leer', 'crear', 'editar'] }];
                        })
                      }
                    />
                  );
                })}
              </Box>
            </Box>
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
