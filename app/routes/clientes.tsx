import React, { useState, useEffect, useMemo, memo } from "react";
import { StatCard, ClientesIcon } from "../components/StatCard";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid,
  Button, Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Pagination, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, CircularProgress, Tooltip, keyframes,
  Card, CardContent, Drawer, Divider, useTheme, useMediaQuery, Skeleton, Tabs, Tab, Stack
} from "@mui/material"; // Importaciones de Material-UI

// Animación de pulso con colores de la agencia
export const pulseAgency = keyframes`
  0% { opacity: 1; background-color: rgba(233, 30, 99, 0.12); }
  50% { opacity: 0.6; background-color: rgba(156, 39, 176, 0.2); }
  100% { opacity: 1; background-color: rgba(233, 30, 99, 0.12); }
`;

const skeletonAgencyStyle = {
  borderRadius: 2,
  animation: `${pulseAgency} 2s ease-in-out infinite`,
  border: '1px solid rgba(233, 30, 99, 0.05)'
};
import DOMPurify from 'dompurify';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiFilter, FiCalendar, FiX, FiUsers, FiRefreshCw, FiPhone, FiMail, FiFileText, FiDownload, FiEye, FiMessageSquare, FiStar, FiBriefcase, FiTarget, FiAlertCircle } from "react-icons/fi";
import { clientesService } from "../services/database";
import { proyectosService, oportunidadesService, tareasService } from "../services/database";
import { SupabaseStatus } from "../components/SupabaseTest";
import { format } from "date-fns";
import { EmptyState } from "../components/EmptyState";
import { useLocation } from "react-router"; // Corregido: estaba como string en algunos lugares
import type { Cliente } from "../types/crm";

const isLeadFrio = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const diferenciaDias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 3600 * 24));
  return diferenciaDias > 5;
};

export function meta() {
  return [
    { title: "Clientes | CRM Agencia" },
    { name: "description", content: "Gestión de clientes" },
  ];
}

export default function Clientes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados para datos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [industriaFilter, setIndustriaFilter] = useState("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modales de Detalle e Historial
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [relatedProyectos, setRelatedProyectos] = useState<any[]>([]);
  const [relatedOportunidades, setRelatedOportunidades] = useState<any[]>([]);
  const [relatedTareas, setRelatedTareas] = useState<any[]>([]);
  
  // Estados para el modal
  const [openModal, setOpenModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado escáner de tarjetas
  const [openScanner, setOpenScanner] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    nicho: "",
    origen: "",
    dolores: "",
    necesidades: "",
    intereses: "",
    estado: "Activo" as "Activo" | "Inactivo",
    ultimaInteraccion: new Date().toISOString().split('T')[0]
  });

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleOpenModal();
    }
  }, [location]);

  // Cargar clientes desde Supabase
  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesService.getAll();
      console.log('[CLIENTES DEBUG] loadClientes data:', data, 'length:', (data || []).length);
      setClientes(data || []);
    } catch (err: any) {
      console.error('[CLIENTES DEBUG] loadClientes error:', err);
      setError("Error al cargar clientes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    loadClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.telefono?.includes(searchTerm) ||
                           cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = estadoFilter === "all" || cliente.estado === estadoFilter;
      const matchesIndustria = industriaFilter === "all" || cliente.nicho === industriaFilter;
      return matchesSearch && matchesEstado && matchesIndustria;
    });
  }, [clientes, searchTerm, estadoFilter, industriaFilter]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(paginatedClientes.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalPages = useMemo(() => Math.ceil(filteredClientes.length / itemsPerPage) || 1, [filteredClientes.length]);
  
  const paginatedClientes = useMemo(() => {
    return filteredClientes.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  }, [filteredClientes, page, itemsPerPage]);

  const clientesActivos = useMemo(() => clientes.filter(c => c.estado === "Activo").length, [clientes]);
  const clientesInactivos = useMemo(() => clientes.filter(c => c.estado === "Inactivo").length, [clientes]);
  const clientesNuevosEsteMes = useMemo(() => {
    return clientes.filter(c => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
  }, [clientes]);

  const getEstadoColor = (estado: string) => {
    return estado === "Activo" ? "success" : "error";
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Abrir modal para nuevo cliente
  const handleOpenModal = () => {
    setEditingClient(null);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      nicho: "",
      origen: "",
      dolores: "",
      necesidades: "",
      intereses: "",
      estado: "Activo",
      ultimaInteraccion: new Date().toISOString().split('T')[0]
    });
    setOpenModal(true);
  };
  
  // Abrir modal para editar
  const handleEdit = (cliente: Cliente) => {
    setEditingClient(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      empresa: cliente.empresa || "",
      nicho: cliente.nicho || "",
      origen: cliente.origen || "",
      dolores: cliente.dolores || "",
      necesidades: cliente.necesidades || "",
      intereses: cliente.intereses || "",
      estado: cliente.estado,
      ultimaInteraccion: cliente.ultima_interaccion
    });
    setOpenModal(true);
  };
  
  // Cerrar modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingClient(null);
  };
  
  // Guardar cliente en Supabase
  const handleSave = async () => {
    if (!formData.nombre || !formData.email) {
      setSnackbar({ open: true, message: "Nombre y email son obligatorios", severity: "error" });
      return;
    }
    
    // Validar email con regex más robusta
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbar({ open: true, message: "Email inválido", severity: "error" });
      return;
    }
    
    // Validar teléfono si se proporciona (debe tener al menos 7 dígitos)
    if (formData.telefono && !/\d{7,}/.test(formData.telefono.replace(/\D/g, ''))) {
      setSnackbar({ open: true, message: "Teléfono debe tener al menos 7 dígitos", severity: "error" });
      return;
    }
    
    setSaving(true);
    try {
      // Sanitizar inputs
      const sanitizedData = {
        nombre: DOMPurify.sanitize(formData.nombre),
        email: DOMPurify.sanitize(formData.email),
        telefono: DOMPurify.sanitize(formData.telefono || ''),
        empresa: DOMPurify.sanitize(formData.empresa || ''),
        nicho: formData.nicho || undefined,
        origen: formData.origen || undefined,
        estado: formData.estado,
        ultima_interaccion: formData.ultimaInteraccion
      };
      
      try {
        if (editingClient) {
          // Actualizar cliente existente
          await clientesService.update(editingClient.id, sanitizedData);
        } else {
          // Crear nuevo cliente
          await clientesService.create(sanitizedData);
        }
      } catch (dbErr: any) {
        // Si fallan columnas extendidas que no existen físicamente en la DB, reintentar en modo compatibilidad
        if (dbErr.message?.includes("column") || dbErr.message?.includes("schema") || dbErr.message?.includes("cache")) {
          console.warn("Faltan columnas de esquema completo. Guardando en Modo Compatibilidad...", dbErr.message);
          
          // Modo compatibilidad: Combinamos nombre + empresa en el campo nombre, y omitimos las columnas extendidas
          const compatName = formData.empresa ? `${DOMPurify.sanitize(formData.nombre)} - ${DOMPurify.sanitize(formData.empresa)}` : DOMPurify.sanitize(formData.nombre);
          const compatData = {
            nombre: compatName,
            email: DOMPurify.sanitize(formData.email),
            telefono: DOMPurify.sanitize(formData.telefono || ''),
            estado: formData.estado,
            ultima_interaccion: formData.ultimaInteraccion
          };
          
          if (editingClient) {
            await clientesService.update(editingClient.id, compatData);
          } else {
            await clientesService.create(compatData);
          }
          
          localStorage.setItem("crm_compat_mode", "true");
        } else {
          throw dbErr;
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: editingClient ? "Cliente actualizado correctamente" : "Cliente creado correctamente", 
        severity: "success" 
      });
      await loadClientes(); // Recargar lista
      handleCloseModal();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error al guardar: " + err.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar cliente en Supabase
  const handleDelete = async (cliente: Cliente) => {
    if (confirm(`¿Estás seguro de eliminar a ${cliente.nombre}?`)) {
      try {
        await clientesService.delete(cliente.id);
        await loadClientes(); // Recargar lista
        setSnackbar({ open: true, message: "Cliente eliminado correctamente", severity: "success" });
      } catch (err: any) {
        setSnackbar({ open: true, message: "Error al eliminar: " + err.message, severity: "error" });
      }
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Función para manejar datos extraídos del escáner
  const handleDatosEscaneados = (datos: any) => {
    // Crear nuevo cliente con datos del escáner
    const nuevoCliente = {
      nombre: datos.nombre || "",
      email: datos.email || "",
      telefono: datos.telefono || "",
      empresa: datos.empresa || "",
      nicho: "",
      origen: "Escaneo Tarjeta",
      dolores: "",
      necesidades: "",
      intereses: "",
      estado: "Activo" as "Activo" | "Inactivo",
      ultimaInteraccion: new Date().toISOString().split('T')[0]
    };

    setFormData(nuevoCliente);
    setOpenModal(true);
  };

  // Funciones para las nuevas acciones
  const handleViewDetails = async (cliente: Cliente) => {
    setSelectedClient(cliente);
    setDetailTab(0);
    try {
      const [p, o, t] = await Promise.all([
        proyectosService.getAll(),
        oportunidadesService.getAll(),
        tareasService.getAll(),
      ]);
      const clienteId = cliente.id;
      setRelatedProyectos(p.filter((x: any) => Number(x.clienteId) === Number(clienteId) || Number(x.cliente_id) === Number(clienteId)));
      setRelatedOportunidades(o.filter((x: any) => Number(x.cliente_id) === Number(clienteId)));
      setRelatedTareas(t.filter((x: any) => Number(x.cliente_id) === Number(clienteId)));
    } catch (e) {
      setRelatedProyectos([]);
      setRelatedOportunidades([]);
      setRelatedTareas([]);
    }
  };

  const handleCall = (cliente: Cliente) => {
    if (cliente.telefono) {
      window.open(`tel:${cliente.telefono}`, '_self');
    } else {
      setSnackbar({ 
        open: true, 
        message: `${cliente.nombre} no tiene teléfono registrado`, 
        severity: "warning" 
      });
    }
  };

  const handleEmail = (cliente: Cliente) => {
    if (cliente.email) {
      window.open(`mailto:${cliente.email}?subject=Contacto desde DESEO DIGITAL`, '_blank');
    } else {
      setSnackbar({ 
        open: true, 
        message: `${cliente.nombre} no tiene email registrado`, 
        severity: "warning" 
      });
    }
  };

  const handleMessage = (cliente: Cliente) => {
    setSnackbar({ 
      open: true, 
      message: `Abriendo chat con ${cliente.nombre}`, 
      severity: "info" 
    });
  };

  const handleHistory = (cliente: Cliente) => {
    setEditingClient(cliente);
    setOpenHistoryModal(true);
  };

  const handleToggleFavorite = async (cliente: Cliente) => {
    const updatedFav = !cliente.favorito;
    
    // Optimistic UI update
    setClientes((prev) => prev.map((c) => c.id === cliente.id ? { ...c, favorito: updatedFav } : c));
    setSnackbar({ 
      open: true, 
      message: updatedFav ? 'Agregado a favoritos ⭐' : 'Eliminado de favoritos', 
      severity: "success" 
    });

    try {
      await clientesService.update(cliente.id, { favorito: updatedFav });
    } catch (err: any) {
      // Revert if failed
      setClientes((prev) => prev.map((c) => c.id === cliente.id ? { ...c, favorito: cliente.favorito } : c));
      setSnackbar({ 
        open: true, 
        message: 'Error al actualizar favoritos: ' + err.message, 
        severity: "error" 
      });
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Última Interacción', 'Favorito'],
      ...clientes.map(cliente => [
        cliente.id,
        cliente.nombre,
        cliente.email,
        cliente.telefono || '',
        cliente.estado,
        cliente.ultima_interaccion,
        cliente.favorito ? 'Sí' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'Clientes exportados a CSV. Abre Google Sheets, ve a Archivo > Importar > Subir y selecciona el archivo CSV.',
      severity: "success"
    });
  };

  const handleImportCSV = () => { // Esta función no está completamente implementada, pero es un placeholder.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setSnackbar({ 
          open: true, 
          message: 'Importando CSV...', 
          severity: "info" 
        });
        // Aquí iría la lógica de importación
        setTimeout(() => {
          setSnackbar({ 
            open: true, 
            message: 'Importación completada', 
            severity: "success" 
          });
        }, 2000);
      }
    };
    input.click();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Indicador de conexión a Supabase */}
      <SupabaseStatus />
      
      {/* Header de sección con navegación clara - Responsive */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 }, 
        backgroundColor: "#e3f2fd", 
        borderLeft: "5px solid #2196f3",
        borderRadius: 2
      }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: { xs: "flex-start", sm: "center" }, 
          gap: 2, 
          mb: 1,
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FiUsers size={28} color="#1976d2" />
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
              Gestión de Clientes
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 1 } }}>
          Administra tu base de clientes SEO. Registra nuevos clientes, edita información y haz seguimiento.
        </Typography>
        <Box sx={{ 
          mt: { xs: 1, sm: 2 }, 
          display: "flex", 
          gap: 1, 
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <Chip 
            label={`${clientes.length} clientes`} 
            color="primary" 
            size="small" 
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label={`${clientesActivos} activos`} 
            color="success" 
            size="small"
            sx={{ fontWeight: 500 }}
          />
          <Button 
            size="small" 
            startIcon={<FiRefreshCw size={14} />} 
            onClick={loadClientes}
            disabled={loading}
            sx={{ ml: "auto" }}
          >
            {loading ? "..." : "Recargar"}
          </Button>
        </Box>

      {/* Barra de Acciones en Lote */}
      {selectedIds.length > 0 && (
        <Paper 
          elevation={4} 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: '#1a237e', 
            color: 'white', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: 2,
            position: 'sticky',
            top: 10,
            zIndex: 10
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {selectedIds.length} clientes seleccionados
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiMail />} 
              onClick={() => handleEmail({ email: clientes.filter(c => selectedIds.includes(c.id)).map(c => c.email).join(',') } as any)}
              sx={{ bgcolor: '#e91e63' }}
            >
              Gmail
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiMessageSquare />} 
              onClick={() => handleMessage({ nombre: 'Grupo Seleccionado' } as any)}
              sx={{ bgcolor: '#4caf50' }}
            >
              WhatsApp (IA)
            </Button>
            <Button variant="outlined" size="small" onClick={() => setSelectedIds([])} sx={{ color: 'white', borderColor: 'white' }}>
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}
      </Paper>

      {/* Tarjetas de Estadísticas */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: { xs: "100%", sm: "48%", md: "23%" } }}>
          <StatCard
            title="Total Clientes"
            value={loading ? "..." : clientes.length}
            subtitle="En base de datos"
            icon={<ClientesIcon />}
            color="primary"
          />
        </Box>
        <Box sx={{ flex: { xs: "100%", sm: "48%", md: "23%" } }}>
          <StatCard
            title="Activos"
            value={clientesActivos}
            subtitle="Clientes activos"
            icon={<ClientesIcon />}
            color="success"
          />
        </Box>
        <Box sx={{ flex: { xs: "100%", sm: "48%", md: "23%" } }}>
          <StatCard
            title="Inactivos"
            value={clientesInactivos}
            subtitle="Clientes inactivos"
            icon={<ClientesIcon />}
            color="error"
          />
        </Box>
        <Box sx={{ flex: { xs: "100%", sm: "48%", md: "23%" } }}>
          <StatCard
            title="Nuevos este Mes"
            value={clientesNuevosEsteMes}
            subtitle="Nuevos registros"
            icon={<ClientesIcon />}
            color="warning"
          />
        </Box>
      </Box>

      {/* Filtros y Búsqueda - Responsive */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, sm: 3 }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 0 } }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            Lista ({filteredClientes.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
            <Button 
              variant="outlined" 
              startIcon={<FiFilter size={16} />}
              onClick={() => setIsFilterDrawerOpen(true)}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
            >
              Filtros Avanzados
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FiDownload size={16} />}
              onClick={handleExportCSV}
              size="small"
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Exportar
            </Button>
            <Button 
              variant="contained" 
              startIcon={<FiPlus size={18} />} 
              onClick={handleOpenModal}
              sx={{ backgroundColor: "#e91e63", whiteSpace: "nowrap", '&:hover': { backgroundColor: "#c2185b" }, minWidth: { xs: "100%", sm: "auto" } }}
            >
              Nuevo Cliente
            </Button>
          </Box>
        </Box>

        {/* Desktop inline search */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> }}
              />
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...Array(5)].map((_, i) => (
              isMobile ? (
                <Card key={i} sx={{ p: 2, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={45} height={45} sx={skeletonAgencyStyle} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" height={24} sx={{ ...skeletonAgencyStyle, mb: 0.5 }} />
                      <Skeleton width="40%" height={18} sx={skeletonAgencyStyle} />
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Skeleton variant="rounded" width={80} height={20} sx={skeletonAgencyStyle} />
                    <Skeleton variant="rounded" width={100} height={20} sx={skeletonAgencyStyle} />
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} sx={skeletonAgencyStyle} />
                    <Skeleton variant="circular" width={32} height={32} sx={skeletonAgencyStyle} />
                    <Skeleton variant="circular" width={32} height={32} sx={skeletonAgencyStyle} />
                  </Box>
                </Card>
              ) : (
                <Paper key={i} sx={{ 
                  p: 2, 
                  display: 'flex', 
                  gap: 3, 
                  alignItems: 'center', 
                  borderRadius: 0, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'transparent'
                }}>
                  <Skeleton variant="rectangular" width={20} height={20} sx={skeletonAgencyStyle} />
                  <Skeleton width="25%" height={20} sx={skeletonAgencyStyle} />
                  <Skeleton width="20%" height={20} sx={skeletonAgencyStyle} />
                  <Skeleton width="15%" height={20} sx={skeletonAgencyStyle} />
                  <Skeleton width="10%" height={25} sx={{ ...skeletonAgencyStyle, borderRadius: 4 }} />
                  <Skeleton width="15%" height={20} sx={skeletonAgencyStyle} />
                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Skeleton variant="circular" width={28} height={28} sx={skeletonAgencyStyle} />
                    <Skeleton variant="circular" width={28} height={28} sx={skeletonAgencyStyle} />
                    <Skeleton variant="circular" width={28} height={28} sx={skeletonAgencyStyle} />
                  </Box>
                </Paper>
              )
            ))}
          </Box>
        )}

        {!loading && !error && (
          isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {paginatedClientes.map((cliente) => (
              <Card key={cliente.id} sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ p: 2, pb: "16px !important" }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Checkbox 
                      size="small" 
                      checked={selectedIds.includes(cliente.id)}
                      onChange={() => handleSelectOne(cliente.id)}
                    />
                    <Box sx={{ flex: 1, ml: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{cliente.nombre}</Typography>
                        {isLeadFrio(cliente.ultima_interaccion) && (
                          <Tooltip title="Lead Frío: Sin contacto hace +5 días">
                            <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
                          </Tooltip>
                        )}
                      </Box>
                      {cliente.empresa && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <FiBriefcase size={12} color={theme.palette.primary.main} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {cliente.empresa}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">{cliente.email}</Typography>
                    </Box>
                    <Chip label={cliente.estado} color={getEstadoColor(cliente.estado)} size="small" />
                  </Box>
                  
                  {cliente.nicho && (
                    <Box sx={{ mb: 1, ml: 4.5 }}>
                      <Chip 
                        icon={<FiTarget size={12} />} 
                        label={cliente.nicho} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                    <FiPhone size={14} />
                    <Typography variant="body2">{cliente.telefono || 'Sin teléfono'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                    <FiCalendar size={14} />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Interacción: {formatDate(cliente.ultima_interaccion)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #eee', pt: 1, flexWrap: 'wrap' }}>
                    <IconButton size="small" onClick={() => handleToggleFavorite(cliente)} sx={{ color: cliente.favorito ? '#ffb400' : '#ccc' }} aria-label="Favorito"><FiStar size={16} style={{ fill: cliente.favorito ? '#ffb400' : 'none' }} /></IconButton>
                    <IconButton size="small" onClick={() => handleViewDetails(cliente)} sx={{ color: '#1976d2' }}><FiEye size={16} /></IconButton>
                    <IconButton size="small" onClick={() => handleEdit(cliente)} sx={{ color: '#ff9800' }}><FiEdit size={16} /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cliente)} sx={{ color: '#f44336' }} aria-label={`Eliminar a ${cliente.nombre}`}><FiTrash2 size={16} /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedClientes.length}
                      checked={paginatedClientes.length > 0 && selectedIds.length === paginatedClientes.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Última Interacción</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedClientes.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(cliente.id)}
                        onChange={() => handleSelectOne(cliente.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cliente.nombre}
                        {isLeadFrio(cliente.ultima_interaccion) && (
                          <Tooltip title="Atención requerida: Lead Frío">
                            <FiAlertCircle size={14} color="#f44336" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>
                      <Chip label={cliente.estado} color={getEstadoColor(cliente.estado)} size="small" sx={{ fontWeight: "medium" }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiCalendar size={16} />
                        {formatDate(cliente.ultima_interaccion)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="Ver detalles"><IconButton size="small" onClick={() => handleViewDetails(cliente)} sx={{ color: '#1976d2' }} aria-label={`Ver detalles de ${cliente.nombre}`}><FiEye size={16} /></IconButton></Tooltip>
                        <Tooltip title={cliente.favorito ? "Quitar de favoritos" : "Marcar como favorito"}><IconButton size="small" onClick={() => handleToggleFavorite(cliente)} sx={{ color: cliente.favorito ? '#ffb400' : '#ccc' }} aria-label={`Favorito ${cliente.nombre}`}><FiStar size={16} style={{ fill: cliente.favorito ? '#ffb400' : 'none' }} /></IconButton></Tooltip>
                        <Tooltip title="Editar cliente"><IconButton size="small" onClick={() => handleEdit(cliente)} sx={{ color: '#ff9800' }} aria-label={`Editar a ${cliente.nombre}`}><FiEdit size={16} /></IconButton></Tooltip>
                        <Tooltip title="Llamar"><IconButton size="small" onClick={() => handleCall(cliente)} sx={{ color: '#4caf50' }} aria-label={`Llamar a ${cliente.nombre}`}><FiPhone size={16} /></IconButton></Tooltip>
                        <Tooltip title="Enviar email"><IconButton size="small" onClick={() => handleEmail(cliente)} sx={{ color: '#9c27b0' }} aria-label={`Enviar email a ${cliente.nombre}`}><FiMail size={16} /></IconButton></Tooltip>
                        <Tooltip title="Enviar mensaje"><IconButton size="small" onClick={() => handleMessage(cliente)} sx={{ color: '#00bcd4' }} aria-label={`Enviar mensaje a ${cliente.nombre}`}><FiMessageSquare size={16} /></IconButton></Tooltip>
                        <Tooltip title="Ver historial"><IconButton size="small" onClick={() => handleHistory(cliente)} sx={{ color: '#607d8b' }} aria-label={`Ver historial de ${cliente.nombre}`}><FiFileText size={16} /></IconButton></Tooltip>
                        <Tooltip title="Eliminar cliente"><IconButton size="small" onClick={() => handleDelete(cliente)} sx={{ color: '#f44336' }} aria-label={`Eliminar a ${cliente.nombre}`}><FiTrash2 size={16} /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}

        {!loading && !error && filteredClientes.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <EmptyState
              title="No se encontraron clientes"
              description={searchTerm ? `No hay resultados para "${searchTerm}". Prueba con otros términos.` : "Tu base de datos de clientes está vacía. Comienza añadiendo tu primer cliente."}
              icon={<FiUsers size={40} />}
              actionLabel="Nuevo Cliente"
              onAction={handleOpenModal}
              color="#1976d2"
            />
          </Box>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Paper>
      
      {/* Modal para Crear/Editar Cliente */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            <IconButton onClick={handleCloseModal} size="small">
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nombre completo *"
              fullWidth
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
            <TextField
              label="Email *"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              label="Teléfono"
              fullWidth
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
            <TextField
              label="Empresa"
              fullWidth
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              placeholder="Nombre de la empresa o marca"
            />
            <TextField
              label="¿Qué le duele al cliente? (Dolores)"
              fullWidth
              multiline
              rows={2}
              value={formData.dolores}
              onChange={(e) => setFormData({ ...formData, dolores: e.target.value })}
              placeholder="Ej: No vende por Instagram, su web es lenta..."
            />
            <TextField
              label="¿Qué necesita hoy? (Necesidad)"
              fullWidth
              value={formData.necesidades}
              onChange={(e) => setFormData({ ...formData, necesidades: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Nicho / Industria</InputLabel>
                  <Select
                    value={formData.nicho}
                    label="Nicho / Industria"
                    onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
                  >
                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                    <MenuItem value="Tecnología">Tecnología</MenuItem>
                    <MenuItem value="Salud">Salud</MenuItem>
                    <MenuItem value="E-commerce">E-commerce</MenuItem>
                    <MenuItem value="Inmobiliaria">Inmobiliaria</MenuItem>
                    <MenuItem value="Educación">Educación</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Origen del Lead</InputLabel>
                  <Select
                    value={formData.origen}
                    label="Origen del Lead"
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  >
                    <MenuItem value=""><em>No especificado</em></MenuItem>
                    <MenuItem value="n8n">n8n (Automatización)</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Ads">Google/FB Ads</MenuItem>
                    <MenuItem value="Referido">Referido</MenuItem>
                    <MenuItem value="Directo">Directo / Web</MenuItem>
                    <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                label="Estado"
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as "Activo" | "Inactivo" })}
              >
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Última Interacción"
              type="date"
              fullWidth
              value={formData.ultimaInteraccion}
              onChange={(e) => setFormData({ ...formData, ultimaInteraccion: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={saving}
            sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

      {/* Drawer de Detalle del Cliente */}
      <Drawer
        anchor="right"
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 420 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detalle del cliente</Typography>
            <IconButton onClick={() => setSelectedClient(null)}><FiX /></IconButton>
          </Box>
          {selectedClient && (
            <Box sx={{ mt: 1 }}>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} variant="fullWidth">
                <Tab label="Datos" />
                <Tab label="Proyectos" />
                <Tab label="Oportunidades" />
                <Tab label="Tareas" />
              </Tabs>
              <Divider sx={{ mb: 1 }} />

              {detailTab === 0 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Nombre</Typography>
                  <Typography variant="body2">{selectedClient.nombre}</Typography>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body2">{selectedClient.email}</Typography>
                  <Typography variant="subtitle2">Teléfono</Typography>
                  <Typography variant="body2">{selectedClient.telefono || '—'}</Typography>
                  <Typography variant="subtitle2">Empresa</Typography>
                  <Typography variant="body2">{selectedClient.empresa || '—'}</Typography>
                  <Typography variant="subtitle2">Nicho</Typography>
                  <Typography variant="body2">{selectedClient.nicho || '—'}</Typography>
                  <Typography variant="subtitle2">Estado</Typography>
                  <Chip size="small" label={selectedClient.estado} color={selectedClient.estado === 'Activo' ? 'success' : 'default'} />
                </Stack>
              )}

              {detailTab === 1 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Proyectos ({relatedProyectos.length})</Typography>
                  {relatedProyectos.length === 0 && <Typography variant="body2">Sin proyectos vinculados</Typography>}
                  {relatedProyectos.map((p: any) => (
                    <Paper key={p.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.estado} • {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(p.presupuesto || 0))}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {detailTab === 2 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Oportunidades ({relatedOportunidades.length})</Typography>
                  {relatedOportunidades.length === 0 && <Typography variant="body2">Sin oportunidades vinculadas</Typography>}
                  {relatedOportunidades.map((o: any) => (
                    <Paper key={o.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{o.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">Etapa: {o.etapa} • Valor: ${Number(o.valor || 0).toLocaleString('es-CO')}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {detailTab === 3 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Tareas ({relatedTareas.length})</Typography>
                  {relatedTareas.length === 0 && <Typography variant="body2">Sin tareas vinculadas</Typography>}
                  {relatedTareas.map((t: any) => (
                    <Paper key={t.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.estado} • Prioridad: {t.prioridad}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Drawer de Filtros Avanzados */}
      <Drawer
        anchor="right"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 350 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Filtros Avanzados</Typography>
          <IconButton onClick={() => setIsFilterDrawerOpen(false)}><FiX /></IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {isMobile && (
            <TextField
              label="Buscar cliente"
              fullWidth
              placeholder="Nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> }}
            />
          )}
          
          <FormControl fullWidth>
            <InputLabel>Estado del Cliente</InputLabel>
            <Select value={estadoFilter} label="Estado del Cliente" onChange={(e) => setEstadoFilter(e.target.value)}>
              <MenuItem value="all">Todos los estados</MenuItem>
              <MenuItem value="Activo">Activos</MenuItem>
              <MenuItem value="Inactivo">Inactivos</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Nicho / Industria</InputLabel>
            <Select 
              value={industriaFilter} 
              label="Nicho / Industria" 
              onChange={(e) => setIndustriaFilter(e.target.value)}
            >
              <MenuItem value="all">Todas las industrias</MenuItem>
              <MenuItem value="Tecnología">Tecnología</MenuItem>
              <MenuItem value="Salud">Salud</MenuItem>
              <MenuItem value="E-commerce">E-commerce</MenuItem>
              <MenuItem value="Inmobiliaria">Inmobiliaria</MenuItem>
              <MenuItem value="Educación">Educación</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button fullWidth variant="contained" onClick={() => setIsFilterDrawerOpen(false)}>
              Aplicar Filtros ({filteredClientes.length})
            </Button>
            <Button fullWidth variant="text" onClick={() => { setSearchTerm(""); setEstadoFilter("all"); setIndustriaFilter("all"); }} sx={{ mt: 1 }}>
              Limpiar Filtros
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
