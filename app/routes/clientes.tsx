import React, { useState, useEffect, useMemo, memo } from "react";
import { StatCard, ClientesIcon } from "../components/StatCard";
import ExpandableCard from "../components/ExpandableCard";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid,
  Button, Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Pagination, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, CircularProgress, Tooltip,
  Card, CardContent, Drawer, Divider, useTheme, useMediaQuery, Skeleton, Tabs, Tab, Stack
} from "@mui/material"; // Importaciones de Material-UI
import { keyframes } from "@mui/material/styles";

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
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiFilter, FiCalendar, FiX, FiUsers, FiRefreshCw, FiPhone, FiMail, FiFileText, FiDownload, FiEye, FiMessageSquare, FiStar, FiBriefcase, FiTarget, FiAlertCircle, FiCpu } from "react-icons/fi";
import { clientesService } from "../services/database";
import { proyectosService, oportunidadesService, tareasService } from "../services/database";
import { facturasService } from "../services/facturacion";
import { contratosService } from "../services/facturacion";
import { transaccionesService } from "../services/database";
import { SupabaseStatus } from "../components/SupabaseTest";
import { format } from "date-fns";
import { EmptyState } from "../components/EmptyState";
import { useLocation } from "react-router"; // Corregido: estaba como string en algunos lugares
import ScannerTarjetas from "../components/ScannerTarjetas";
import type { Cliente } from "../types/crm";
import SafeChip from "../components/SafeChip";

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
  const [origenFilter, setOrigenFilter] = useState("all");
  const [favoritoFilter, setFavoritoFilter] = useState("all");
  const [proyectoFilter, setProyectoFilter] = useState("all");
  const [ultimaInteraccionFilter, setUltimaInteraccionFilter] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [proyectosOptions, setProyectosOptions] = useState<any[]>([]);
  const [allTransaccionesGlobal, setAllTransaccionesGlobal] = useState<any[]>([]);
  
  // Modales de Detalle e Historial
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [relatedProyectos, setRelatedProyectos] = useState<any[]>([]);
  const [relatedOportunidades, setRelatedOportunidades] = useState<any[]>([]);
  const [relatedTareas, setRelatedTareas] = useState<any[]>([]);
  const [relatedFacturas, setRelatedFacturas] = useState<any[]>([]);
  const [relatedContratos, setRelatedContratos] = useState<any[]>([]);
  const [relatedTransacciones, setRelatedTransacciones] = useState<any[]>([]);
  
  // Estados para el modal
  const [openModal, setOpenModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados escáner de tarjetas
  const [openScanner, setOpenScanner] = useState(false);

  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window !== 'undefined') {
      return (window.localStorage.getItem('theme_mode') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

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

  const loadProyectosOptions = async () => {
    try {
      const data = await proyectosService.getAll();
      setProyectosOptions(data || []);
    } catch {
      setProyectosOptions([]);
    }
  };

  useEffect(() => {
    loadClientes();
    loadProyectosOptions();
    (async () => {
      try {
        const tx = (await transaccionesService.getAll()) as any[];
        setAllTransaccionesGlobal(tx || []);
      } catch {
        // Silencioso: no romper el listado si falla la carga de transacciones
      }
    })();
  }, []);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cliente.telefono?.includes(searchTerm) ||
                           cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = estadoFilter === "all" || cliente.estado === estadoFilter;
      const matchesIndustria = industriaFilter === "all" || cliente.nicho === industriaFilter;
      const matchesOrigen = origenFilter === "all" || cliente.origen === origenFilter;
      const matchesFavorito = favoritoFilter === "all" || (favoritoFilter === "fav" ? cliente.favorito : !cliente.favorito);
      const matchesProyecto = proyectoFilter === "all" || (proyectosOptions.some(p => String(p.clienteId) === String(cliente.id) && String(p.id) === proyectoFilter));
      const matchesUltInter = !ultimaInteraccionFilter || cliente.ultima_interaccion >= ultimaInteraccionFilter;
      return matchesSearch && matchesEstado && matchesIndustria && matchesOrigen && matchesFavorito && matchesProyecto && matchesUltInter;
    });
  }, [clientes, searchTerm, estadoFilter, industriaFilter, origenFilter, favoritoFilter, proyectoFilter, ultimaInteraccionFilter, proyectosOptions]);

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

  const clientePaymentSummary = useMemo(() => {
    const summary = new Map<number, number>();
    filteredClientes.forEach(c => summary.set(c.id, 0));
    
    proyectosOptions.forEach((p: any) => {
      const cid = Number(p.clienteId || p.cliente_id);
      if (summary.has(cid)) {
        const current = summary.get(cid) || 0;
        summary.set(cid, current + Number(p.monto_pagado || p.presupuesto || 0));
      }
    });
    
    allTransaccionesGlobal.forEach((tx: any) => {
      const cid = Number(tx.cliente_id);
      if (summary.has(cid) && tx.tipo === 'ingreso') {
        const current = summary.get(cid) || 0;
        summary.set(cid, current + Number(tx.monto || 0));
      }
    });
    
    return summary;
  }, [filteredClientes, proyectosOptions, allTransaccionesGlobal]);

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbar({ open: true, message: "Email inválido", severity: "error" });
      return;
    }

    if (formData.telefono && !/\d{7,}/.test(formData.telefono.replace(/\D/g, ''))) {
      setSnackbar({ open: true, message: "Teléfono debe tener al menos 7 dígitos", severity: "error" });
      return;
    }

    const dup = findDuplicate(formData.nombre, formData.email, formData.telefono, editingClient?.id);
    if (dup) {
      const overwrite = confirm(`Posible duplicado: ${dup.nombre} (${dup.email}). ¿Deseas guardar de todas formas?`);
      if (!overwrite) return;
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
        const isEdit = !!(editingClient && editingClient.id > 0);
        if (isEdit) {
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
          
          const compatName = formData.empresa ? `${DOMPurify.sanitize(formData.nombre)} - ${DOMPurify.sanitize(formData.empresa)}` : DOMPurify.sanitize(formData.nombre);
          const compatData = {
            nombre: compatName,
            email: DOMPurify.sanitize(formData.email),
            telefono: DOMPurify.sanitize(formData.telefono || ''),
            estado: formData.estado,
            ultima_interaccion: formData.ultimaInteraccion
          };
          
          const isEditCompat = !!(editingClient && editingClient.id > 0);
          if (isEditCompat) {
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

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const confirmDelete = confirm(`¿Eliminar ${selectedIds.length} cliente(s) seleccionado(s)?`);
    if (!confirmDelete) return;
    try {
      await Promise.all(selectedIds.map(id => clientesService.delete(id)));
      setSnackbar({ open: true, message: `${selectedIds.length} cliente(s) eliminado(s)`, severity: "success" });
      setSelectedIds([]);
      await loadClientes();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error eliminando en lote: " + err.message, severity: "error" });
    }
  };

  const handleBulkSetEstado = async (estado: "Activo" | "Inactivo") => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map(id => clientesService.update(id, { estado })));
      setSnackbar({ open: true, message: `${selectedIds.length} cliente(s) actualizado(s) a ${estado}`, severity: "success" });
      setSelectedIds([]);
      await loadClientes();
    } catch (err: any) {
      setSnackbar({ open: true, message: "Error actualizando en lote: " + err.message, severity: "error" });
    }
  };

  const handleExportSelectedCSV = () => {
    const selected = clientes.filter(c => selectedIds.includes(c.id));
    if (!selected.length) {
      setSnackbar({ open: true, message: 'Selecciona clientes para exportar', severity: 'warning' });
      return;
    }
    const csvContent = [
      ['ID', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Última Interacción', 'Favorito'],
      ...selected.map(cliente => [
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
    link.setAttribute('download', `clientes_seleccionados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSnackbar({ open: true, message: `Exportados ${selected.length} clientes`, severity: 'success' });
  };

  // Funciones para las nuevas acciones
  const handleViewDetails = async (cliente: Cliente) => {
    const url = `/clientes/${cliente.id}`;
    window.location.href = url;
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

  const handleImportCSV = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSnackbar({ open: true, message: `Importando ${file.name}...`, severity: 'info' });

      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
        if (lines.length < 2) {
          setSnackbar({ open: true, message: 'CSV vacío o sin datos', severity: 'error' });
          return;
        }

        const headers: string[] = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h === 'nombre');
        const emailIdx = headers.findIndex(h => h === 'email');
        const phoneIdx = headers.findIndex(h => /telefono|tel/.test(h));
        const companyIdx = headers.findIndex(h => /empresa|compañia|company/.test(h));

        if (nameIdx < 0 || emailIdx < 0) {
          setSnackbar({ open: true, message: 'El CSV debe tener columnas: nombre, email', severity: 'error' });
          return;
        }

        const rows = lines.slice(1);
        const duplicates: string[] = [];
        let imported = 0;

        for (const row of rows) {
          const cols = row.split(',');
          const nombre = (cols[nameIdx] || '').trim();
          const email = (cols[emailIdx] || '').trim();
          const telefono = phoneIdx >= 0 ? (cols[phoneIdx] || '').trim() : '';
          const empresa = companyIdx >= 0 ? (cols[companyIdx] || '').trim() : undefined;

          if (!nombre || !email) continue;

          const exists = clientes.find(c => c.email.toLowerCase() === email.toLowerCase() || (telefono && c.telefono === telefono));
          if (exists) {
            duplicates.push(`${email} (ya existe como ${exists.nombre})`);
            continue;
          }

          await clientesService.create({
            nombre: DOMPurify.sanitize(nombre),
            email: DOMPurify.sanitize(email),
            telefono: DOMPurify.sanitize(telefono || ''),
            empresa: empresa ? DOMPurify.sanitize(empresa) : '',
            estado: 'Activo',
            ultima_interaccion: new Date().toISOString().split('T')[0]
          });
          imported++;
        }

        await loadClientes();

        const parts = [`Importados: ${imported}`];
        if (duplicates.length) {
          parts.push(`Duplicados omitidos: ${duplicates.length}`);
        }
        setSnackbar({
          open: true,
          message: parts.join('. '),
          severity: duplicates.length ? 'warning' : 'success'
        });
      } catch (err: any) {
        setSnackbar({ open: true, message: 'Error importando CSV: ' + err.message, severity: 'error' });
      }
    };
    input.click();
  };

  const findDuplicate = (nombre: string, email: string, telefono?: string, excludeId?: number) => {
    const n = nombre.trim().toLowerCase();
    const e = email.trim().toLowerCase();
    const t = (telefono || '').replace(/\D/g, '');
    return clientes.find(c => {
      if (excludeId && c.id === excludeId) return false;
      const sameEmail = c.email.toLowerCase() === e;
      const samePhone = t && c.telefono && c.telefono.replace(/\D/g, '') === t;
      const sameName = c.nombre.toLowerCase() === n;
      return sameEmail || samePhone || sameName;
    }) || null;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1, md: 1.5 } }}>
      {/* Indicador de conexión a Supabase */}
      <SupabaseStatus />
      
      {/* Header de sección con navegación clara - Responsive */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: { xs: 1.5, sm: 2 },
        backgroundColor: "background.paper",
        borderLeft: "5px solid",
        borderColor: "primary.main",
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
            <IconButton size="small" onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}>
              <FiCpu size={20} />
            </IconButton>
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
          <SafeChip 
            label={`${clientes.length} clientes`} 
            color="primary" 
            size="small" 
            sx={{ fontWeight: 500 }}
          />
          <SafeChip 
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
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 2,
            position: 'sticky',
            top: { xs: 56, sm: 10 },
            zIndex: 10,
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {selectedIds.length} cliente(s) seleccionado(s)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiMail />} 
              onClick={() => handleEmail({ email: clientes.filter(c => selectedIds.includes(c.id)).map(c => c.email).join(',') } as any)}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              Gmail
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiMessageSquare />} 
              onClick={() => handleMessage({ nombre: 'Grupo Seleccionado' } as any)}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              WhatsApp (IA)
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiDownload />} 
              onClick={handleExportSelectedCSV}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              Exportar selección
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => handleBulkSetEstado("Activo")}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              Marcar Activos
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => handleBulkSetEstado("Inactivo")}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            >
              Marcar Inactivos
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<FiTrash2 />} 
              onClick={handleBulkDelete}
              sx={{ bgcolor: 'error.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'error.dark' } }}
            >
              Eliminar
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setSelectedIds([])} 
              sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
            >
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}
      </Paper>

      {/* Tarjetas de Estadísticas */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
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
        p: 2, 
        mb: 2,
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 0 } }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            Lista ({filteredClientes.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
            <Button 
              variant="outlined"
              size="small"
              onClick={() => {
                const next = themeMode === 'dark' ? 'light' : 'dark';
                setThemeMode(next);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('theme_mode', next);
                  window.dispatchEvent(new CustomEvent('theme-changed', { detail: next }));
                }
              }}
              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
            >
              {themeMode === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
            </Button>
            <Button 
              variant="outlined"
              startIcon={<FiFileText size={16} />}
              onClick={handleImportCSV}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: "auto" } }}
            >
              Importar CSV
            </Button>
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
              sx={{ backgroundColor: "primary.main", whiteSpace: "nowrap", '&:hover': { backgroundColor: "primary.dark" }, minWidth: { xs: "100%", sm: "auto" } }}
            >
              Nuevo Cliente
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FiFileText size={18} />} 
              onClick={() => setOpenScanner(true)}
              sx={{ 
                minWidth: { xs: "100%", sm: "auto" },
                borderColor: "primary.main",
                color: "primary.main",
                fontWeight: 700,
                "&:hover": { borderColor: "primary.dark", bgcolor: "rgba(233,30,99,0.04)" }
              }}
            >
              Escanear Tarjeta
            </Button>
          </Box>
        </Box>

        {/* Desktop inline search */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
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
                <Card key={i} sx={{ p: 1.5, borderRadius: 3, '&:hover': { boxShadow: 3 } }}>
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
          <Grid container spacing={2}>
            {paginatedClientes.map((cliente) => {
              const totalPagado = clientePaymentSummary.get(cliente.id) || 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={cliente.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                    <CardContent sx={{ flexGrow: 1, py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5, pl: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {cliente.nombre?.charAt(0).toUpperCase()}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.9rem' }, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cliente.nombre}
                          </Typography>
                        </Box>
                        <SafeChip label={cliente.estado} color={getEstadoColor(cliente.estado)} size="small" sx={{ fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.7rem' }, height: 20 }} />
                      </Box>

                      <Stack spacing={0.25} sx={{ pl: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiMail size={12} color="text.secondary" />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>{cliente.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiPhone size={12} color="text.secondary" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{cliente.telefono || '—'}</Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 0.75, pl: 3 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Total Pagado</Typography>
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPagado)}
                        </Typography>
                      </Box>
                    </CardContent>

                    <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiTarget size={14} />}
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/proyectos?cliente_id=${cliente.id}`; }}
                      >
                        Proyectos
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiFileText size={14} />}
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/facturacion?cliente_id=${cliente.id}`; }}
                      >
                        Facturas
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiDownload size={14} />}
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/contratos?cliente_id=${cliente.id}`; }}
                      >
                        Contratos
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiCalendar size={14} />}
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/tareas?cliente_id=${cliente.id}`; }}
                      >
                        Tareas
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiMail size={14} />}
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/email-marketing?email=${encodeURIComponent(cliente.email)}`; }}
                      >
                        Email
                      </Button>
                      {cliente.telefono && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<FiMessageSquare size={14} />}
                          color="success"
                          onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + cliente.nombre + ', ¿cómo estás?')}`, '_blank'); }}
                        >
                          WhatsApp
                        </Button>
                      )}
                    </Box>

                    <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Tooltip title={cliente.favorito ? "Quitar de favoritos" : "Marcar como favorito"}>
                        <IconButton size="small" onClick={() => handleToggleFavorite(cliente)} sx={{ color: cliente.favorito ? '#ffb400' : '#ccc' }} aria-label={`Favorito ${cliente.nombre}`}>
                          <FiStar size={16} style={{ fill: cliente.favorito ? '#ffb400' : 'none' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleViewDetails(cliente)} sx={{ color: '#1976d2' }} aria-label={`Ver detalles de ${cliente.nombre}`}>
                          <FiEye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(cliente)} sx={{ color: '#ff9800' }} aria-label={`Editar a ${cliente.nombre}`}>
                          <FiEdit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(cliente)} sx={{ color: '#f44336' }} aria-label={`Eliminar a ${cliente.nombre}`}>
                          <FiTrash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {!loading && !error && filteredClientes.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <EmptyState
              title="No se encontraron clientes"
              description={searchTerm ? `No hay resultados para "${searchTerm}". Prueba con otros términos.` : "Tu base de datos de clientes está vacía. Comienza añadiendo tu primer cliente."}
              icon={<FiUsers size={40} />}
              actionLabel="Nuevo Cliente"
              onAction={handleOpenModal}
              color="primary.main"
            />
          </Box>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
                    <MenuItem value="Finanzas">Finanzas</MenuItem>
                    <MenuItem value="Alimentación">Alimentación</MenuItem>
                    <MenuItem value="Moda">Moda</MenuItem>
                    <MenuItem value="Logística">Logística</MenuItem>
                    <MenuItem value="Energía">Energía</MenuItem>
                    <MenuItem value="Construcción">Construcción</MenuItem>
                    <MenuItem value="Entretenimiento">Entretenimiento</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                    <MenuItem value="Consultoría">Consultoría</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Agricultura">Agricultura</MenuItem>
                    <MenuItem value="Manufactura">Manufactura</MenuItem>
                    <MenuItem value="Turismo">Turismo</MenuItem>
                    <MenuItem value="Transporte">Transporte</MenuItem>
                    <MenuItem value="Farmacéutica">Farmacéutica</MenuItem>
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
                <Tab label={`Historial (${relatedProyectos.length + relatedOportunidades.length + relatedTareas.length})`} />
                <Tab label="Proyectos" />
                <Tab label="Oportunidades" />
                <Tab label="Tareas" />
                <Tab label={`Facturas (${relatedFacturas.length})`} />
                <Tab label={`Contratos (${relatedContratos.length})`} />
                <Tab label={`Pagos (${relatedTransacciones.length})`} />
              </Tabs>
              <Divider sx={{ mb: 1 }} />

              {detailTab === 0 && (
                <Stack spacing={1}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">Nombre</Typography>
                      <Typography variant="body2">{selectedClient.nombre}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography variant="body2">{selectedClient.email}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Teléfono</Typography>
                      <Typography variant="body2">{selectedClient.telefono || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Empresa</Typography>
                      <Typography variant="body2">{selectedClient.empresa || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Nicho</Typography>
                      <Typography variant="body2">{selectedClient.nicho || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Estado</Typography>
                      <SafeChip size="small" label={selectedClient.estado} color={selectedClient.estado === 'Activo' ? 'success' : 'default'} />
                    </Box>
                  </Box>
                </Stack>
              )}

              {detailTab === 1 && (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <SafeChip size="small" label={`${relatedProyectos.length} proyectos`} color="primary" variant="outlined" />
                    <SafeChip size="small" label={`${relatedOportunidades.length} oportunidades`} color="secondary" variant="outlined" />
                    <SafeChip size="small" label={`${relatedTareas.length} tareas`} color="warning" variant="outlined" />
                  </Box>
                  {relatedProyectos.length === 0 && relatedOportunidades.length === 0 && relatedTareas.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Sin historial vinculado.</Typography>
                  )}
                  {relatedProyectos.slice(0, 5).map((p: any) => (
                    <Paper key={p.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">Proyecto • {p.estado} • {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(p.presupuesto || 0))}</Typography>
                    </Paper>
                  ))}
                  {relatedOportunidades.slice(0, 5).map((o: any) => (
                    <Paper key={o.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{o.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">Oportunidad • {o.etapa} • ${Number(o.valor || 0).toLocaleString('es-CO')}</Typography>
                    </Paper>
                  ))}
                  {relatedTareas.slice(0, 5).map((t: any) => (
                    <Paper key={t.id} sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{t.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">Tarea • {t.estado} • Prioridad: {t.prioridad}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {detailTab === 2 && (
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

              {detailTab === 3 && (
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

              {detailTab === 4 && (
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

              {detailTab === 5 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Facturas ({relatedFacturas.length})</Typography>
                  {relatedFacturas.length === 0 && <Typography variant="body2">Sin facturas vinculadas</Typography>}
                  {relatedFacturas.map((f: any) => (
                    <Paper key={f.id} sx={{ p: 1.2, borderLeft: '3px solid', borderColor: f.estado === 'pagada' ? '#4caf50' : f.estado === 'enviada' ? '#2196f3' : '#ff9800' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{f.numero || `#${f.id}`}</Typography>
                      <Typography variant="caption" color="text.secondary">{f.estado} • {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(f.total || 0))}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {detailTab === 6 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Contratos ({relatedContratos.length})</Typography>
                  {relatedContratos.length === 0 && <Typography variant="body2">Sin contratos vinculados</Typography>}
                  {relatedContratos.map((c: any) => (
                    <Paper key={c.id} sx={{ p: 1.2, borderLeft: '3px solid', borderColor: c.estado === 'firmado' ? '#4caf50' : c.estado === 'activo' ? '#2196f3' : '#ff9800' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{c.titulo || c.numero || `Contrato #${c.id}`}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.estado} • {c.tipo || 'General'}</Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {detailTab === 7 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Pagos ({relatedTransacciones.length})</Typography>
                  {relatedTransacciones.length === 0 && <Typography variant="body2">Sin pagos registrados</Typography>}
                  {relatedTransacciones.map((tx: any) => (
                    <Paper key={tx.id} sx={{ p: 1.2, borderLeft: '3px solid', borderColor: tx.tipo === 'ingreso' ? '#4caf50' : '#f44336' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{tx.descripcion || tx.categoria}</Typography>
                      <Typography variant="caption" color="text.secondary">{tx.tipo} • {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(tx.monto || 0))} • {tx.forma_pago}</Typography>
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
              {[...new Set(clientes.map(c => c.nicho).filter(Boolean) as string[])]
                .sort()
                .map((nicho: string) => (
                  <MenuItem key={nicho} value={nicho}>{nicho}</MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Proyecto</InputLabel>
            <Select
              value={proyectoFilter}
              label="Proyecto"
              onChange={(e) => setProyectoFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {proyectosOptions.map((p: any) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre} {p.clienteNombre ? `— ${p.clienteNombre}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Última interacción desde"
            type="date"
            fullWidth
            value={ultimaInteraccionFilter}
            onChange={(e) => setUltimaInteraccionFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Origen del Lead</InputLabel>
            <Select value={origenFilter} label="Origen del Lead" onChange={(e) => setOrigenFilter(e.target.value)}>
              <MenuItem value="all">Todos los orígenes</MenuItem>
              {[...new Set(clientes.map(c => c.origen).filter(Boolean) as string[])]
                .sort()
                .map((origen: string) => (
                  <MenuItem key={origen} value={origen}>{origen}</MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Favoritos</InputLabel>
            <Select value={favoritoFilter} label="Favoritos" onChange={(e) => setFavoritoFilter(e.target.value)}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="fav">⭐ Favoritos</MenuItem>
              <MenuItem value="nofav">Sin favorito</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button fullWidth variant="contained" onClick={() => setIsFilterDrawerOpen(false)}>
              Aplicar Filtros ({filteredClientes.length})
            </Button>
            <Button fullWidth variant="text" onClick={() => { setSearchTerm(""); setEstadoFilter("all"); setIndustriaFilter("all"); setOrigenFilter("all"); setFavoritoFilter("all"); setProyectoFilter("all"); setUltimaInteraccionFilter(""); }} sx={{ mt: 1 }}>
              Limpiar Filtros
            </Button>
          </Box>
        </Box>
      </Drawer>

      <ScannerTarjetas
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        onSave={async (data) => {
          setOpenScanner(false);
          setEditingClient({
            id: 0,
            nombre: data.nombre || '',
            email: data.email || '',
            telefono: data.telefono || '',
            empresa: data.empresa || '',
            nicho: '',
            origen: 'OCR',
            dolores: '',
            necesidades: '',
            intereses: '',
            estado: 'Activo',
            ultima_interaccion: new Date().toISOString().split('T')[0],
            favorito: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
          setOpenModal(true);
        }}
      />
    </Box>
  );
}

