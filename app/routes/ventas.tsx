
import React, { useState, useEffect } from "react";
import { StatCard, VentasIcon } from "../components/StatCard";
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Grid, Button, Chip, LinearProgress, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Snackbar, Slider, CircularProgress, Tooltip, Skeleton,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";

// Animación de pulso con colores de la agencia
const pulseAgency = keyframes`
  0% { opacity: 1; background-color: rgba(233, 30, 99, 0.12); }
  50% { opacity: 0.6; background-color: rgba(156, 39, 176, 0.2); }
  100% { opacity: 1; background-color: rgba(233, 30, 99, 0.12); }
`;

const skeletonAgencyStyle = {
  borderRadius: 2,
  animation: `${pulseAgency} 2s ease-in-out infinite`,
  border: '1px solid rgba(233, 30, 99, 0.05)'
};
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiRefreshCw, FiTrendingUp, FiMove, FiFileText, FiMessageSquare, FiCopy, FiZap } from "react-icons/fi";
import { tareasService, serviciosService, clientesService, oportunidadesService, proyectosService } from "../services/database";

import { aiService } from "../services/ai";
import { useNotificationStore } from "../store/useNotificationStore";
import { EmptyState } from "../components/EmptyState";
import { useLocation } from "react-router";
import type { Oportunidad, Cliente } from "../types/crm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SafeChip from "../components/SafeChip";
import { openAiRoute } from "../components/FloatingAIAssistant";

export function meta() {
  return [
    { title: "Oportunidades | DESEO DIGITAL" },
    { name: "description", content: "Gestión de oportunidades de venta" },
  ];
}

const getEtapaColor = (etapa: string): "primary" | "secondary" | "success" | "warning" | "error" => {
  const colors: Record<string, "primary" | "secondary" | "success" | "warning" | "error"> = {
    "Prospección": "secondary",
    "Propuesta": "primary",
    "Negociación": "warning",
    "Cierre": "success",
  };
  return colors[etapa] || "primary";
};

const formatCOP = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Ventas() {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("all");
  const [presentationMode, setPresentationMode] = useState(false);

  // Escuchar cambio de Modo Presentación
  useEffect(() => {
    const handlePresentationChange = (e: any) => setPresentationMode(e.detail === 'on');
    if (typeof window !== "undefined") {
      setPresentationMode(localStorage.getItem("presentation_mode") === "true");
      window.addEventListener("presentation-mode-changed", handlePresentationChange);
    }
    return () => window.removeEventListener("presentation-mode-changed", handlePresentationChange);
  }, []);

  const formatValue = (val: number) => presentationMode ? "••••••" : formatCOP(val);

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Oportunidad | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para Propuesta IA
  const [openPropuestaModal, setOpenPropuestaModal] = useState(false);
  const [propuestaGenerada, setPropuestaPropuesta] = useState("");
  const [resumenWhatsApp, setResumenWhatsApp] = useState("");
  const [loadingPropuesta, setLoadingPropuesta] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    cliente_nombre: "",
    valor: 0,
    etapa: "Prospección" as Oportunidad["etapa"],
    probabilidad: 25,
    servicios_interes: [] as string[],
  });

  const { showNotification } = useNotificationStore();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleOpenModal();
    }
  }, [location]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [opps, clis, servs] = await Promise.all([
        oportunidadesService.getAll(),
        clientesService.getAll(),
        serviciosService.getAll()
      ]);
      setOportunidades(opps as Oportunidad[]);
      setClientes(clis);
      setServiciosDisponibles(servs);
    } catch (err: any) {
      setError("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = oportunidades.filter(o => {
    const matchSearch = o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEtapa = etapaFilter === "all" || o.etapa === etapaFilter;
    return matchSearch && matchEtapa;
  });

  const totalValor = filtered.reduce((acc, o) => acc + (o.valor || 0), 0);
  const avgProb = filtered.length > 0
    ? Math.round(filtered.reduce((acc, o) => acc + (o.probabilidad || 0), 0) / filtered.length)
    : 0;
  const enCierre = filtered.filter(o => o.etapa === "Cierre").length;

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic update
    const oppId = parseInt(draggableId);
    const newEtapa = destination.droppableId as Oportunidad["etapa"];
    const oppObj = oportunidades.find(o => o.id === oppId);
    if (!oppObj) return;
    
    setOportunidades(prev => prev.map(o => o.id === oppId ? { ...o, etapa: newEtapa } : o));

    try {
      await oportunidadesService.update(oppId, { etapa: newEtapa });
      
      // LOGICA DE AUTOMATIZACION: Si pasa a Cierre, disparar trigger
      if (newEtapa === "Cierre") {
        if (oppObj) {
          // 1. Notificación de éxito (usando el store global)
          showNotification(
            `Venta cerrada: "${oppObj.nombre}" para ${oppObj.cliente_nombre}`,
            'success',
            '¡Nueva Venta Cerrada! 🎉'
          );
          
          // 2. CREACIÓN AUTOMÁTICA DE PROYECTO CON SALVAGUARDA DE DUPLICADOS (Nivel Agencia Pro)
          const proyectosExistentes = await proyectosService.getAll();
          const proyectoDuplicado = proyectosExistentes.find(
            p => Number(p.oportunidadId) === Number(oppObj.id)
          );

          if (proyectoDuplicado) {
            console.warn("Proyecto ya existe para esta oportunidad. Evitando duplicado.");
            showNotification(
              `El proyecto para "${oppObj.nombre}" ya había sido creado anteriormente.`,
              'info',
              'Proyecto ya registrado 📁'
            );
          } else {
            await proyectosService.create({
              nombre: oppObj.nombre,
              descripcion: `Venta cerrada: ${oppObj.nombre}.`,
              clienteId: oppObj.cliente_id,
              clienteNombre: oppObj.cliente_nombre,
              oportunidadId: oppObj.id,
              presupuesto: oppObj.valor,
              estado: 'planificacion',
              prioridad: 'media',
              fechaInicio: new Date().toISOString().split('T')[0],
              // Heredar servicios de la oportunidad
              servicios: (oppObj.servicios_interes && oppObj.servicios_interes.length > 0) 
                ? [...oppObj.servicios_interes] 
                : ['Servicio General'],
              progreso: 0,
              faseAdministrativa: 'onboarding',
              onboardingChecklist: { anticipo_50: true, analisis_presencia: false, solicitud_accesos: false },
              tareas: []
            });

            // 3. Crear Tarea Automática para Onboarding
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            
            await tareasService.create({
              titulo: `Onboarding: ${oppObj.cliente_nombre}`,
              descripcion: `Venta cerrada automáticamente ("${oppObj.nombre}"). Iniciar proceso de onboarding con el cliente.`,
              fecha: mañana.toISOString().split('T')[0],
              prioridad: 'Alta',
              estado: 'Pendiente',
              tipo: 'Tarea'
            });

            // 4. Tarea automática para Jessica López si incluye Reels
            if (oppObj.servicios_interes?.includes("Reels")) {
              await tareasService.create({
                titulo: `🎬 Coordinar Reels: ${oppObj.cliente_nombre}`,
                descripcion: `Jessica, el nuevo proyecto "${oppObj.nombre}" incluye Reels. Por favor, inicia la planeación de contenido y solicita los clips necesarios.`,
                fecha: mañana.toISOString().split('T')[0],
                prioridad: 'Media',
                estado: 'Pendiente',
                tipo: 'Tarea',
                cliente_id: oppObj.cliente_id || undefined
              });
            }
          }
        }
      }

      // Reload para asegurar sincronización con DB
      const data = await oportunidadesService.getAll();
      setOportunidades(data as Oportunidad[]);
    } catch (err: any) {
      loadData(); // Revertir en caso de error
      showNotification("Error al mover tarjeta: " + err.message, "error");
    }
  };

  const handleGenerarPropuestaAI = async (opp: Oportunidad) => {
    setLoadingPropuesta(true);
    setOpenPropuestaModal(true);
    try {
      const clienteInfo = clientes.find((c) => c.id === opp.cliente_id);
      const propuesta = await aiService.generarPropuesta({
        clienteNombre: opp.cliente_nombre,
        clienteEmpresa: clienteInfo?.empresa || opp.cliente_nombre,
        servicios: opp.servicios_interes || ["Servicios Digitales 360"],
        notasAdicionales: `Valor: ${formatCOP(opp.valor)}. Etapa: ${opp.etapa}`,
        dolorNecesidad: clienteInfo?.dolores || "",
        presenciaRedes: clienteInfo?.origen || "",
        objetivos: clienteInfo?.necesidades || "",
        presupuestoEstimado: opp.valor
      });
      setPropuestaPropuesta(propuesta);
      
      const whatsapp = await aiService.prepararPropuestaWhatsApp(propuesta);
      setResumenWhatsApp(whatsapp);
    } catch (err) { // Usar el Snackbar global
      showNotification("Error al generar propuesta", "error");
    } finally {
      setLoadingPropuesta(false);
    }
  };

  const handleOpenModal = () => {
    setEditingOpp(null);
    setFormData({ 
      nombre: "", cliente_nombre: "", valor: 0, 
      etapa: "Prospección", probabilidad: 25, servicios_interes: [] 
    });
    setOpenModal(true);
  };

  const handleEdit = (opp: Oportunidad) => {
    setEditingOpp(opp);
    setFormData({
      nombre: opp.nombre,
      cliente_nombre: opp.cliente_nombre,
      valor: opp.valor,
      etapa: opp.etapa,
      probabilidad: opp.probabilidad,
      servicios_interes: opp.servicios_interes || [],
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.cliente_nombre || formData.cliente_nombre === "__otro__") {
      showNotification("Debes asignar un cliente real a la oportunidad.", "error");
      return;
    }

    if (formData.valor <= 0) {
      showNotification("Asigna un valor estimado para proyectar tus ingresos.", "warning");
    }

    if ((formData.etapa === "Negociación" || formData.etapa === "Cierre") && formData.valor <= 0) {
      showNotification("Se requiere un valor mayor a 0 para esta etapa.", "error");
      return;
    }

    setSaving(true);
    try {
      const matchedCliente = clientes.find((c) => c.nombre.toLowerCase() === formData.cliente_nombre.toLowerCase());
      const payload = {
        nombre: formData.nombre,
        cliente_id: matchedCliente ? matchedCliente.id : undefined,
        cliente_nombre: formData.cliente_nombre,
        valor: formData.valor,
        etapa: formData.etapa,
        probabilidad: Math.max(0, Math.min(100, formData.probabilidad)),
        servicios_interes: formData.servicios_interes,
        estado: "Abierta",
      };
      if (editingOpp) {
        await oportunidadesService.update(editingOpp.id, payload);
        showNotification("Oportunidad actualizada ✓", "success");
      } else {
        await oportunidadesService.create(payload);
        showNotification("Oportunidad creada ✓", "success");
      }
      await loadData();
      setOpenModal(false);
    } catch (err: any) {
      showNotification("Error al guardar: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (opp: Oportunidad) => {
    if (!confirm(`¿Eliminar "${opp.nombre}"?`)) return;
    try {
      await oportunidadesService.delete(opp.id);
      await loadData(); // Usar el Snackbar global
      showNotification("Oportunidad eliminada", "success");
    } catch (err: any) {
      showNotification("Error al eliminar: " + err.message, "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, background: "linear-gradient(135deg, #fce4ec 0%, #fff8e1 100%)", borderLeft: "5px solid #E91E63" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
          <FiTrendingUp size={28} color="#E91E63" />
          <Typography variant="h5" sx={{ color: "#C2185B", flex: 1 }}>
            Pipeline de Oportunidades
          </Typography>
          <IconButton size="small" onClick={() => openAiRoute('ventas', 'Oportunidades', 'Pipeline de ventas')}>
            <SafeChip label="CPU" size="small" />
          </IconButton>
          <Button size="small" startIcon={<FiRefreshCw size={14} />} onClick={loadData} disabled={loading}>
            {loading ? "..." : "Recargar"}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Gestiona y avanza tus oportunidades de negocio a través del embudo de ventas.
        </Typography>
      </Paper>

      {/* KPIs */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {[
          { title: "Total Oportunidades", value: loading ? "..." : filtered.length, subtitle: "En pipeline", color: "primary" },
          { title: "Valor Potencial", value: loading ? "..." : formatValue(totalValor), subtitle: "Ingresos esperados", color: "success" },
          { title: "Prob. Promedio", value: loading ? "..." : `${avgProb}%`, subtitle: "De conversión", color: "warning" },
          { title: "En Cierre", value: loading ? "..." : enCierre, subtitle: "Listas para cerrar", color: "info" },
        ].map((kpi) => (
          <Box key={kpi.title} sx={{ flex: { xs: "100%", sm: "48%", md: "23%" } }}>
            <StatCard title={kpi.title} value={kpi.value} subtitle={kpi.subtitle} icon={<VentasIcon />} color={kpi.color as any} />
          </Box>
        ))}
      </Box>

      {/* Tabla */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
          <Typography variant="h6">Lista ({filtered.length})</Typography>
          <Button variant="contained" startIcon={<FiPlus />} onClick={handleOpenModal}>
            Nueva Oportunidad
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexDirection: { xs: "column", md: "row" } }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre o cliente..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch /></InputAdornment> }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Etapa</InputLabel>
            <Select value={etapaFilter} label="Etapa" onChange={(e: any) => setEtapaFilter(e.target.value)}>
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="Prospección">Prospección</MenuItem>
              <MenuItem value="Propuesta">Propuesta</MenuItem>
              <MenuItem value="Negociación">Negociación</MenuItem>
              <MenuItem value="Cierre">Cierre</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1.5 }}>
            {["Prospección", "Propuesta", "Negociación", "Cierre"].map((col) => (
              <Paper 
                key={col} 
                sx={{ 
                  minWidth: 280, 
                  flex: 1, 
                  p: 1.5, 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Skeleton variant="text" width="60%" height={28} sx={{ ...skeletonAgencyStyle, mb: 0.5 }} />
                <Skeleton variant="text" width="40%" height={22} sx={{ ...skeletonAgencyStyle, mb: 1.5 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[1, 2].map((j) => (
                    <Paper 
                      key={j} 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        border: '1px solid rgba(255,255,255,0.05)',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#12131a' : '#fff'
                      }}
                    >
                      <Skeleton variant="text" width="80%" height={22} sx={skeletonAgencyStyle} />
                      <Skeleton variant="text" width="50%" height={18} sx={{ ...skeletonAgencyStyle, mb: 1.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton variant="rounded" width={80} height={18} sx={skeletonAgencyStyle} />
                        <Skeleton variant="circular" width={22} height={22} sx={skeletonAgencyStyle} />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        ) : filtered.length > 0 ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, minHeight: 340 }}>
              {["Prospección", "Propuesta", "Negociación", "Cierre"].map(col => {
                const oppsCol = filtered.filter(o => o.etapa === col);
                const sumValor = oppsCol.reduce((a, b) => a + b.valor, 0);
                
                return (
                  <Paper key={col} sx={{ minWidth: 260, flex: 1, p: 1, bgcolor: '#f8f9fa', borderTop: `3px solid ${getEtapaColor(col) === 'primary' ? '#2196f3' : getEtapaColor(col) === 'success' ? '#4caf50' : getEtapaColor(col) === 'warning' ? '#ff9800' : '#e91e63'}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: '-0.01em', fontSize: '0.8rem' }}>{col}</Typography>
                      <SafeChip label={String(oppsCol.length)} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 700, fontSize: '0.75rem' }}>
                      {formatValue(sumValor)}
                    </Typography>
                    
                    <Droppable droppableId={col}>
                      {(provided, snapshot) => (
                        <Box 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          sx={{ 
                            minHeight: 160, 
                            bgcolor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.06)' : 'transparent', 
                            transition: 'background-color 0.15s', 
                            borderRadius: 1 
                          }}
                        >
                          {oppsCol.map((opp, index) => (
                            <Draggable key={opp.id} draggableId={opp.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <Box
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   sx={{ mb: 1 }}
                                >
                                  <Paper
                                    elevation={snapshot.isDragging ? 3 : 0}
                                    sx={{ 
                                       p: 1, 
                                       borderRadius: 2, 
                                      border: '1px solid',
                                      borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                                      transition: 'all 0.15s', 
                                      transform: snapshot.isDragging ? 'scale(1.01)' : 'none',
                                      borderLeft: `3px solid ${getEtapaColor(opp.etapa) === 'primary' ? '#2196f3' : getEtapaColor(opp.etapa) === 'success' ? '#4caf50' : getEtapaColor(opp.etapa) === 'warning' ? '#ff9800' : '#e91e63'}`
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: '0.8rem' }} noWrap>{opp.nombre}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>{opp.cliente_nombre}</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, ml: 1 }}>
                                        <Tooltip title="Generar Propuesta IA">
                                          <IconButton size="small" onClick={() => handleGenerarPropuestaAI(opp)} sx={{ color: '#daa520', padding: 0.25 }} aria-label="Generar propuesta">
                                            <FiZap size={14} />
                                          </IconButton>
                                        </Tooltip>
                                        <Box 
                                          {...provided.dragHandleProps} 
                                          sx={{ 
                                            cursor: 'grab', 
                                            color: 'text.disabled', 
                                            '&:active': { cursor: 'grabbing', color: 'primary.main' }
                                          }}
                                        >
                                          <FiMove size={16} />
                                        </Box>
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: "success.dark" }}>{formatValue(opp.valor)}</Typography>
                                      <SafeChip label={`${opp.probabilidad}%`} size="small" color={opp.probabilidad >= 75 ? 'success' : opp.probabilidad >= 40 ? 'warning' : 'error'} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                                      <IconButton size="small" onClick={() => handleEdit(opp)} sx={{ color: 'text.secondary', padding: 0.25 }} aria-label="Editar"><FiEdit size={12}/></IconButton>
                                      <IconButton size="small" onClick={() => handleDelete(opp)} color="error" sx={{ padding: 0.25 }} aria-label="Eliminar"><FiTrash2 size={12}/></IconButton>
                                    </Box>
                                  </Paper>
                                </Box>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Paper>
                );
              })}
            </Box>
          </DragDropContext>
        ) : null}

        {!loading && !error && filtered.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <EmptyState
              title="No hay oportunidades"
              description={searchTerm ? `No hay resultados para "${searchTerm}".` : "Tu pipeline de ventas está vacío. Comienza creando tu primera oportunidad de negocio."}
              icon={<FiTrendingUp size={40} />}
              actionLabel="Nueva Oportunidad"
              onAction={handleOpenModal}
              color="#E91E63"
            />
          </Box>
        )}
      </Paper>

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingOpp ? "✏️ Editar Oportunidad" : "➕ Nueva Oportunidad"}
            <IconButton onClick={() => setOpenModal(false)} size="small"><FiX /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField label="Nombre de la oportunidad *" fullWidth value={formData.nombre}
              onChange={(e: any) => setFormData({ ...formData, nombre: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Cliente *</InputLabel>
              <Select value={formData.cliente_nombre} label="Cliente *"
                onChange={(e: any) => setFormData({ ...formData, cliente_nombre: e.target.value })}>
                {clientes.map(c => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
                <MenuItem value="__otro__"><em>+ Otro (escribir nombre)</em></MenuItem>
              </Select>
            </FormControl>
            {(formData.cliente_nombre === "__otro__" || !clientes.find(c => c.nombre === formData.cliente_nombre)) && (
              <TextField label="Nombre del cliente *" fullWidth value={formData.cliente_nombre === "__otro__" ? "" : formData.cliente_nombre}
                onChange={(e: any) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                placeholder="Escribe el nombre del cliente" />
            )}
            
            <FormControl fullWidth>
              <InputLabel>Servicios de Interés</InputLabel>
              <Select
                multiple
                value={formData.servicios_interes}
                label="Servicios de Interés"
                onChange={(e: any) => setFormData({ ...formData, servicios_interes: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                renderValue={(selected: any) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: any) => (
                      <SafeChip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {serviciosDisponibles.map((s) => (
                  <MenuItem key={s.id} value={s.nombre}>{s.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Valor (COP) *" type="number" fullWidth value={formData.valor || ""}
              onChange={(e: any) => setFormData({ ...formData, valor: Number(e.target.value) })} />
            <FormControl fullWidth>
              <InputLabel>Etapa</InputLabel>
              <Select value={formData.etapa} label="Etapa"
                onChange={(e: any) => setFormData({ ...formData, etapa: e.target.value as typeof formData.etapa })}>
                <MenuItem value="Prospección">🔍 Prospección</MenuItem>
                <MenuItem value="Propuesta">📄 Propuesta</MenuItem>
                <MenuItem value="Negociación">🤝 Negociación</MenuItem>
                <MenuItem value="Cierre">✅ Cierre</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" gutterBottom>Probabilidad de cierre: <strong>{formData.probabilidad}%</strong></Typography>
              <Slider value={formData.probabilidad} onChange={(_: any, v: any) => setFormData({ ...formData, probabilidad: v as number })}
                min={0} max={100} step={5} marks valueLabelDisplay="auto"
                sx={{ color: "#E91E63" }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FiPlus />}>
            {saving ? "Guardando..." : (editingOpp ? "Guardar Cambios" : "Crear Oportunidad")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Propuesta Generada */}
      <Dialog open={openPropuestaModal} onClose={() => setOpenPropuestaModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fce4ec' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiZap color="#E91E63" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#C2185B' }}>Propuesta Estratégica IA</Typography>
          </Box>
          <IconButton onClick={() => setOpenPropuestaModal(false)} size="small"><FiX /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingPropuesta ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
              <CircularProgress color="secondary" />
              <Typography variant="body1">La IA está diseñando la estrategia de cierre...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' } }}>
              <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 7' } }}>
                <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>📄 Documento de Propuesta (Markdown)</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fdfdfd', maxHeight: 300, overflowY: 'auto' }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {propuestaGenerada}
                  </Typography>
                </Paper>
                <Button 
                  startIcon={<FiCopy />} 
                  fullWidth 
                  variant="text" 
                  sx={{ mt: 1 }}
                  onClick={() => { // Usar el Snackbar global
                    navigator.clipboard.writeText(propuestaGenerada);
                    showNotification("Propuesta copiada al portapapeles", "success");
                  }}
                >
                  Copiar Propuesta Completa
                </Button>
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 5' } }}>
                <Typography variant="subtitle2" gutterBottom color="success.main" sx={{ fontWeight: 'bold' }}>💬 Resumen para WhatsApp</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#e8f5e9', border: '1px solid #4caf50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {resumenWhatsApp}
                  </Typography>
                </Paper>
                <Button 
                  startIcon={<FiMessageSquare />} 
                  fullWidth 
                  variant="contained" 
                  color="success"
                  sx={{ mt: 1.5 }}
                  onClick={() => {
                    navigator.clipboard.writeText(resumenWhatsApp);
                    showNotification("Resumen de WhatsApp copiado ✓", "success");
                  }}
                >
                  Copiar para WhatsApp
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

