import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Route } from "./+types/proyectos";
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Stack,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Avatar,
  Tooltip,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Collapse
} from "@mui/material";
import {
  Folder, Plus, Edit2, Trash2, Calendar, Users, CheckCircle, Clock,
  Play, Pause, X, Eye, DollarSign, Target, Activity, RefreshCw, ExternalLink, FileText, Layout, 
  Video, Camera, Zap, Award, FileCheck, Share2, Mail, Send
} from "lucide-react";
import { format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { emailService, equipoService, logsService, clientesService, proyectosService, credencialesService } from "../services/database";
import { TareasTab } from "./TareasTab";
import { ProyectoKanban } from "../components/ProyectoKanban";
import { ProyectoTimeline } from "../components/ProyectoTimeline";
import { ProyectoComentarios } from "../components/ProyectoComentarios";
import { ProyectoAdjuntos } from "../components/ProyectoAdjuntos";
import { ProyectoDocuments } from "../components/ProyectoDocuments";
import ExpandableCard from "../components/ExpandableCard";
import type { Proyecto, TareaProyecto, RecursoProyecto, PlanItem } from "../types/crm";
import { aiService } from "../services/ai";
import { useNotificationStore } from "../store/useNotificationStore";
import SafeChip from "../components/SafeChip";

// Esquema de validación con Zod
const proyectoSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().min(10, "La descripción debe ser más detallada"),
  clienteId: z.union([z.string(), z.number()]).transform(val => String(val)),
  servicios: z.array(z.string()).min(1, "Selecciona al menos un servicio"),
  estado: z.enum(["planificacion", "en_progreso", "pausado", "completado", "cancelado"]),
  prioridad: z.enum(["baja", "media", "alta", "urgente"]),
  fechaInicio: z.string().min(1, "Fecha requerida"),
  fechaFin: z.string().min(1, "Fecha requerida"),
  presupuesto: z.number().min(0, "El presupuesto no puede ser negativo")
});

export function meta() {
  return [
    { title: "Proyectos | CRM DESEO DIGITAL" },
    { name: "description", content: "Gestión de proyectos por cliente" },
  ];
}

export default function Proyectos() {
  const { showNotification } = useNotificationStore();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("activos");
  const [openProyectoModal, setOpenProyectoModal] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState(0);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Simulación de rol (En el futuro esto vendrá de tu sistema de Auth/Supabase)
  const [isAdmin] = useState(true);

  // Estados para Recursos
  const [nuevoRecursoNombre, setNuevoRecursoNombre] = useState("");
  const [nuevoRecursoUrl, setNuevoRecursoUrl] = useState("");
  
  // Estado para modo de vista
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  
  // Estados de filtros
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  
  // Estados para Vista Previa de Email
  const [openPreviewEmailModal, setOpenPreviewEmailModal] = useState(false);
  const [previewEmailContent, setPreviewEmailContent] = useState<{asunto: string, cuerpo: string} | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [credenciales, setCredenciales] = useState<any[]>([]);
  const [ mostrarPwd, setMostrarPwd ] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      if (!selectedProyecto) return;
      try {
        const data = await credencialesService.getAll(String(selectedProyecto.id));
        setCredenciales(data);
        (selectedProyecto as any).__credentials = data;
      } catch {}
    })();
  }, [selectedProyecto]);

  // React Hook Form con Zod
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      clienteId: "",
      servicios: [] as string[],
      estado: "planificacion" as Proyecto["estado"],
      prioridad: "media" as Proyecto["prioridad"],
      fechaInicio: "",
      fechaFin: "",
      presupuesto: 0
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar clientes y proyectos reales
        const [clientesData, proyectosData] = await Promise.all([
          clientesService.getAll(),
          proyectosService.getAll()
        ]);
        
        setClientes(clientesData);
        
        setProyectos(proyectosData);
      } catch (err: any) {
        setError("Error al cargar datos: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 600);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  // Sistema de Magic Links: Genera una URL pública temporal para el cliente
  const handleGenerateMagicLink = (proyecto: Proyecto) => {
    const baseUrl = window.location.origin;
    // Sugerencia: Asegúrate de crear la ruta /public/proyecto/$id para que el cliente acceda
    const magicUrl = `${baseUrl}/public/proyecto/${proyecto.id}`;
    
    navigator.clipboard.writeText(magicUrl);
    
    showNotification(
      "¡Magic Link copiado! El cliente ahora puede ver su avance sin loguearse. 🚀", 
      "success"
    );
  };

  // Generar vista previa del email de cierre
  const prepararPreviewEmailCierre = async (proyecto: Proyecto) => {
    try {
      setLoading(true);
      const emailData = await aiService.generarResumenCierreProyecto(proyecto);
      setPreviewEmailContent(emailData);
      setSelectedProyecto(proyecto);
      setOpenPreviewEmailModal(true);
    } catch (error) {
      showNotification("Error al generar la vista previa del email", "error");
    } finally {
      setLoading(false);
    }
  };

  // Enviar el email después de la vista previa
  const handleEnviarEmailCierre = async () => {
    if (!selectedProyecto || !previewEmailContent) return;
    
    setSendingEmail(true);
    try {
      const cliente = clientes.find(c => String(c.id) === String(selectedProyecto.clienteId));
      if (!cliente?.email) return;

      await emailService.sendRealEmail(
        [cliente.email],
        previewEmailContent.asunto,
        previewEmailContent.cuerpo
      );

      showNotification("¡Email de cierre enviado exitosamente! 📧", "success");
      setOpenPreviewEmailModal(false);
    } catch (error) {
      showNotification("Error al enviar el email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  // Función para disparar celebración
  const dispararCelebracion = async () => {
    const confettiModule = await import("canvas-confetti");
    const confetti = confettiModule.default || confettiModule;
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#e91e63", "#daa520", "#2196f3"]
    });
  };

  // Funciones de manejo
  const handleOpenProyectoModal = (proyecto?: Proyecto) => {
    if (proyecto) {
      setEditingProyecto(proyecto);
      reset({
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion,
        clienteId: proyecto.clienteId,
        servicios: proyecto.servicios,
        estado: proyecto.estado,
        prioridad: proyecto.prioridad,
        fechaInicio: proyecto.fechaInicio,
        fechaFin: proyecto.fechaFin,
        presupuesto: proyecto.presupuesto
      });
    } else {
      setEditingProyecto(null);
      reset({
        nombre: "",
        descripcion: "",
        clienteId: "",
        servicios: [],
        estado: "planificacion",
        prioridad: "media",
        fechaInicio: "",
        fechaFin: "",
        presupuesto: 0
      });
    }
    setOpenProyectoModal(true);
  };

  const handleCloseProyectoModal = () => {
    setOpenProyectoModal(false);
    setEditingProyecto(null);
  };

  const handleSaveProyecto = async (data: z.infer<typeof proyectoSchema>) => {
    try {
      // Validación profesional: No permitir completar si hay tareas pendientes vía modal
      if (data.estado === "completado") {
        const tareasActuales = editingProyecto?.tareas || [];
        const pendientes = tareasActuales.filter((t: TareaProyecto) => !t.completada).length;
        
        if (pendientes > 0 && !isAdmin) {
          showNotification(
            `Acción bloqueada: No se puede completar el proyecto mientras existan ${pendientes} tareas pendientes.`, 
            "warning"
          );
          return;
        } else if (pendientes > 0 && isAdmin) {
          // Si es admin, permitimos pero avisamos
          showNotification(
            `Proyecto forzado a completado por Administrador (${pendientes} pendientes ignoradas).`, 
            "info"
          );
        }
      }

      const cliente = clientes.find(c => String(c.id) === String(data.clienteId));
      const equipoReal = (await equipoService.getAll()) || [];
      if (!data.clienteId || String(data.clienteId).trim() === "") {
        showNotification("Selecciona un cliente antes de guardar el proyecto", "error");
        setGeneratingPlan(false);
        return;
      }

      const responsablePrincipal = equipoReal.length > 0 ? equipoReal[0].nombre : "Juan José";
      
      // --- LÓGICA DE PLANTILLAS AUTOMÁTICAS ---
      let tareasIniciales: TareaProyecto[] = editingProyecto?.tareas || [];
      
      if (!editingProyecto) {
        // Si es un proyecto nuevo, buscamos plantillas que coincidan con los servicios elegidos
        const plantillasDisponibles = [
          { servicio: "SEO", tareas: ["Auditoría Técnica", "Keyword Research", "Optimización On-Page", "Reporte Mensual"] },
          { servicio: "Social Media", tareas: ["Guiones de Reels", "Grabación", "Edición Jessica López", "Publicación"] },
          { servicio: "Diseño Web", tareas: ["Estructura", "Diseño UI", "Desarrollo", "Lanzamiento"] }
        ];

        const tareasDePlantilla = data.servicios.flatMap(serv => {
          const plantilla = plantillasDisponibles.find(p => p.servicio === serv || serv.includes(p.servicio));
          return plantilla ? plantilla.tareas : [];
        });

        if (tareasDePlantilla.length > 0) {
          tareasIniciales = tareasDePlantilla.map((nombre, idx) => ({
            id: `temp-${Date.now()}-${idx}`,
            nombre,
            completada: false,
            responsable: nombre.includes("Edición") ? (equipoReal.find((e: any) => e.especialidad.includes("Reels"))?.nombre || "Jessica López") : responsablePrincipal,
            fechaLimite: new Date(Date.now() + (idx + 1) * 86400000).toISOString().split('T')[0]
          }));
        }
      }

      const nuevoProyecto: Proyecto = {
        id: editingProyecto?.id || Date.now().toString(),
        nombre: data.nombre,
        descripcion: data.descripcion,
        clienteId: Number(data.clienteId),
        clienteNombre: cliente?.nombre || "Cliente Desconocido",
        servicios: data.servicios,
        estado: data.estado,
        prioridad: data.prioridad,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        progreso: editingProyecto?.progreso || 0,
        presupuesto: data.presupuesto,
        costoActual: editingProyecto?.costoActual || 0,
        tareas: tareasIniciales,
        recursos: editingProyecto?.recursos || [],
        faseAdministrativa: editingProyecto?.faseAdministrativa || "operacion",
        montoPagado: editingProyecto?.montoPagado || 0,
        estadoPago: editingProyecto?.estadoPago || (data.presupuesto > 0 ? "pendiente" : "pagado"),
        metodoPago: editingProyecto?.metodoPago,
        onboardingChecklist: editingProyecto?.onboardingChecklist || {
          analisis_presencia: false,
          identidad_digital: false,
          solicitud_accesos: false,
          creacion_cronograma: false,
          anticipo_50: false
        },
        planContenido: editingProyecto?.planContenido || { reels: [], stories: [], pauta: [] },
        creadoEn: editingProyecto?.creadoEn || new Date().toISOString(),
        actualizadoEn: new Date().toISOString()
      };

      if (editingProyecto) {
        await proyectosService.update(editingProyecto.id, nuevoProyecto);
        setProyectos(prev => prev.map(p => p.id === editingProyecto.id ? nuevoProyecto : p));
        showNotification("Proyecto actualizado correctamente", "success");

        await logsService.create({
          accion: "Actualización de Proyecto",
          modulo: "Proyectos",
          detalle: `Se actualizó el proyecto ${nuevoProyecto.nombre}`,
          usuario: "Juan José Álvarez"
        });
        
        if (nuevoProyecto.estado === "completado" && editingProyecto?.estado !== "completado") {
          dispararCelebracion();
          prepararPreviewEmailCierre(nuevoProyecto);
        }
      } else {
        await proyectosService.create(nuevoProyecto);
        setProyectos(prev => [...prev, nuevoProyecto]);
        showNotification("Proyecto creado correctamente", "success");
      }

      handleCloseProyectoModal();
    } catch (err: any) {
      showNotification("Error al guardar proyecto: " + err.message, "error");
    }
  };

  const handleDeleteProyecto = async (proyecto: Proyecto) => {
    if (confirm(`¿Estás seguro de eliminar el proyecto "${proyecto.nombre}"?`)) {
      try {
        await proyectosService.delete(proyecto.id);
        setProyectos(prev => prev.filter(p => p.id !== proyecto.id));
        showNotification("Proyecto eliminado correctamente", "success");
      } catch (err: any) {
        showNotification("Error al eliminar proyecto: " + err.message, "error");
      }
    }
  };

  const handleAddTarea = async (nombre: string) => {
    if (!selectedProyecto || !nombre.trim()) return;
    
    const nueva: TareaProyecto = {
      id: Date.now().toString(),
      nombre: nombre,
      completada: false,
      responsable: "Por asignar",
      fechaLimite: new Date().toISOString().split('T')[0]
    };

    const tareasActualizadas = [...(selectedProyecto.tareas || []), nueva];
    const totalTareas = tareasActualizadas.length;
    const tareasCompletadas = tareasActualizadas.filter(t => t.completada).length;
    const nuevoProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // Lógica de cambio automático de estado
    let nuevoEstado = selectedProyecto.estado;
    if (nuevoProgreso === 100) {
      nuevoEstado = "completado";
    } else if (selectedProyecto.estado === "completado" && nuevoProgreso < 100) {
      nuevoEstado = "en_progreso";
    }

    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { 
        tareas: tareasActualizadas,
        progreso: nuevoProgreso,
        estado: nuevoEstado
      });
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      showNotification("Error al añadir tarea", "error");
    }
  };

  const handleToggleTarea = async (tareaId: string) => {
    if (!selectedProyecto) return;
    
    // --- REGLA DE ORO FINANCIERA (DESEO DIGITAL) ---
    const anticipoConfirmado = selectedProyecto.onboardingChecklist?.anticipo_50;
    if (!anticipoConfirmado) {
      showNotification(
        "⚠️ ALERTA: Confirma el cobro del anticipo (50%) en Onboarding antes de marcar tareas como hechas.", 
        "warning"
      );
      return;
    }

    const tareasActualizadas = selectedProyecto.tareas.map((t: TareaProyecto) => 
      t.id === tareaId ? { ...t, completada: !t.completada } : t
    );

    const totalTareas = tareasActualizadas.length;
    const tareasCompletadas = tareasActualizadas.filter((t: TareaProyecto) => t.completada).length;
    const nuevoProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // Lógica de cambio automático de estado
    let nuevoEstado = selectedProyecto.estado;
    if (nuevoProgreso === 100) {
      nuevoEstado = "completado";
    } else if (selectedProyecto.estado === "completado" && nuevoProgreso < 100) {
      nuevoEstado = "en_progreso";
    }

    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { 
        tareas: tareasActualizadas,
        progreso: nuevoProgreso,
        estado: nuevoEstado
      });

      if (nuevoProgreso === 100 && selectedProyecto.progreso < 100) {
        dispararCelebracion();
        prepararPreviewEmailCierre(proyectoActualizado);
      }

      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      showNotification("Error al actualizar tarea", "error");
    }
  };

  const handleExportProjectToCSV = (proyecto: Proyecto) => {
    const headers = [
      "ID Proyecto", "Nombre Proyecto", "Descripción", "Cliente ID", "Cliente Nombre",
      "Servicios", "Estado", "Prioridad", "Fecha Inicio", "Fecha Fin", "Progreso",
      "Presupuesto", "Costo Actual", "Monto Pagado", "Estado Pago", "Fase Administrativa",
      "Reels (Texto::Completada::Responsable)",
      "Stories (Texto::Completada::Responsable)",
      "Pauta (Texto::Completada::Responsable)",
      "Recursos (Nombre::URL::Tipo)",
      "Tareas (Nombre::Completada::Responsable::Fecha Límite)",
      "Onboarding Checklist (Analisis Presencia)", "Onboarding Checklist (Identidad Digital)",
      "Onboarding Checklist (Solicitud Accesos)", "Onboarding Checklist (Creacion Cronograma)",
      "Onboarding Checklist (Anticipo 50%)",
      "Creado En", "Actualizado En"
    ];

    const rowData = [
      proyecto.id, proyecto.nombre, proyecto.descripcion, proyecto.clienteId, proyecto.clienteNombre,
      proyecto.servicios.join(';'), proyecto.estado, proyecto.prioridad, proyecto.fechaInicio,
      proyecto.fechaFin, proyecto.progreso, proyecto.presupuesto, proyecto.costoActual,
      proyecto.montoPagado, proyecto.estadoPago, proyecto.faseAdministrativa,
      formatNestedItemsForCSV(proyecto.planContenido?.reels || [], 'plan'),
      formatNestedItemsForCSV(proyecto.planContenido?.stories || [], 'plan'),
      formatNestedItemsForCSV(proyecto.planContenido?.pauta || [], 'plan'),
      formatNestedItemsForCSV(proyecto.recursos || [], 'resource'),
      formatNestedItemsForCSV(proyecto.tareas || [], 'task'),
      proyecto.onboardingChecklist?.analisis_presencia ? 'Sí' : 'No',
      proyecto.onboardingChecklist?.identidad_digital ? 'Sí' : 'No',
      proyecto.onboardingChecklist?.solicitud_accesos ? 'Sí' : 'No',
      proyecto.onboardingChecklist?.creacion_cronograma ? 'Sí' : 'No',
      proyecto.onboardingChecklist?.anticipo_50 ? 'Sí' : 'No',
      proyecto.creadoEn, proyecto.actualizadoEn
    ];

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      rowData.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proyecto_${proyecto.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Datos del proyecto "${proyecto.nombre}" exportados a CSV.`, "success");
  };

  const handleDeleteTarea = async (tareaId: string) => {
    if (!selectedProyecto) return;
    
    // --- REGLA DE ORO DE DESEO DIGITAL ---
    // No permitir avanzar tareas si no hay anticipo confirmado
    const anticipoConfirmado = selectedProyecto.onboardingChecklist?.anticipo_50;
    if (!anticipoConfirmado) {
      showNotification(
        "⚠️ ALERTA FINANCIERA: No se pueden completar tareas hasta que se confirme el pago del 50% inicial.", 
        "warning"
      );
      return;
    }

    const tareasActualizadas = selectedProyecto.tareas.filter(t => t.id !== tareaId);
    const totalTareas = tareasActualizadas.length;
    const tareasCompletadas = tareasActualizadas.filter(t => t.completada).length;
    const nuevoProgreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // Lógica de cambio automático de estado
    let nuevoEstado = selectedProyecto.estado;
    if (nuevoProgreso === 100 && totalTareas > 0) {
      nuevoEstado = "completado";
    } else if (selectedProyecto.estado === "completado" && nuevoProgreso < 100) {
      nuevoEstado = "en_progreso";
    }

    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { 
        tareas: tareasActualizadas,
        progreso: nuevoProgreso,
        estado: nuevoEstado
      });
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      showNotification("Error al eliminar tarea", "error");
    }
  };

  const handleAddRecurso = async (tipo: RecursoProyecto["tipo"]) => {
    if (!selectedProyecto || !nuevoRecursoUrl.trim()) return;

    const nuevo: RecursoProyecto = {
      id: Date.now().toString(),
      tipo,
      nombre: nuevoRecursoNombre || (tipo === 'drive' ? 'Carpeta Drive' : tipo === 'sheet' ? 'Google Sheet' : 'Documento'),
      url: nuevoRecursoUrl.startsWith('http') ? nuevoRecursoUrl : `https://${nuevoRecursoUrl}`
    };

    const recursosActualizados = [...(selectedProyecto.recursos || []), nuevo];
    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { recursos: recursosActualizados });
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
      setNuevoRecursoNombre("");
      setNuevoRecursoUrl("");
    } catch (err: any) {
      showNotification("Error al añadir recurso", "error");
    }
  };

  const handleDeleteRecurso = async (recursoId: string) => {
    if (!selectedProyecto) return;
    
    const recursosActualizados = selectedProyecto.recursos.filter(r => r.id !== recursoId);
    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { recursos: recursosActualizados });
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      showNotification("Error al eliminar recurso", "error");
    }
  };

  // Helper to format nested array items for CSV
  const formatNestedItemsForCSV = (items: (string | PlanItem)[] | RecursoProyecto[] | TareaProyecto[], type: 'plan' | 'resource' | 'task') => {
    if (!items || items.length === 0) return '';
    return items.map(item => {
      if (type === 'plan') {
        const planItem = item as (string | PlanItem);
        const texto = typeof planItem === 'string' ? planItem : planItem.texto;
        const completada = typeof planItem === 'string' ? false : planItem.completada;
        const responsable = typeof planItem === 'string' ? '' : (planItem.responsable || '');
        return `${texto}::${completada ? 'Sí' : 'No'}::${responsable}`;
      } else if (type === 'resource') {
        const resourceItem = item as RecursoProyecto;
        return `${resourceItem.nombre}::${resourceItem.url}::${resourceItem.tipo}`;
      } else if (type === 'task') {
        const taskItem = item as TareaProyecto;
        return `${taskItem.nombre}::${taskItem.completada ? 'Sí' : 'No'}::${taskItem.responsable}::${taskItem.fechaLimite}`;
      }
      return '';
    }).join(' | '); // Use pipe as a separator for multiple items
  };

  const handleGenerarPlanIA = async () => {
    if (!selectedProyecto) return;
    
    setGeneratingPlan(true);
    try {
      const plan = await aiService.generarPlanContenido(selectedProyecto);
      
      // Convertir strings de la IA a objetos PlanItem para gestionar el estado de "Grabado"
      const formattedPlan = {
        reels: plan.reels.map(texto => ({ texto, completada: false, responsable: "Jessica López" })),
        stories: plan.stories.map(texto => ({ texto, completada: false, responsable: "Juan José" })),
        pauta: plan.pauta.map(texto => ({ texto, completada: false, responsable: "Jessica López" }))
      };

      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { 
        planContenido: formattedPlan 
      });
      
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
      showNotification("¡Plan de contenido generado con éxito! ✨", "success");
    } catch (err: any) {
      console.error(err);
      showNotification("Error al generar el plan con IA", "error");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleTogglePlanItem = async (tipo: "reels" | "stories" | "pauta", index: number) => {
    if (!selectedProyecto || !selectedProyecto.planContenido) return;

    const nuevoPlan = { ...selectedProyecto.planContenido };
    const items = [...(nuevoPlan[tipo] || [])];
    
    const item = items[index];
    if (typeof item === 'string') {
      items[index] = { texto: item, completada: true };
    } else {
      items[index] = { ...item, completada: !item.completada };
    }
    
    nuevoPlan[tipo] = items;

    try {
      const proyectoActualizado = await proyectosService.update(selectedProyecto.id, { 
        planContenido: nuevoPlan 
      });
      setProyectos(prev => prev.map(p => p.id === selectedProyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      console.error(err);
      showNotification("Error al actualizar item del plan", "error");
    }
  };

  const handleUpdateOnboarding = async (proyecto: Proyecto, key: string, value: boolean) => {
    const nuevaChecklist = { 
      ...(proyecto.onboardingChecklist || {}), 
      [key]: value 
    };

    try {
      const proyectoActualizado = await proyectosService.update(proyecto.id, { 
        onboardingChecklist: nuevaChecklist 
      });
      setProyectos(prev => prev.map(p => p.id === proyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
    } catch (err: any) {
      showNotification("Error al actualizar checklist", "error");
    }
  };

  const handleUpdatePago = async (proyecto: Proyecto, monto: number) => {
    try {
      const nuevoMonto = Number(monto);
      let nuevoEstadoPago: Proyecto["estadoPago"] = "pendiente";
      
      if (nuevoMonto >= proyecto.presupuesto) nuevoEstadoPago = "pagado";
      else if (nuevoMonto > 0) nuevoEstadoPago = "parcial";

      const proyectoActualizado = await proyectosService.update(proyecto.id, { 
        montoPagado: nuevoMonto,
        estadoPago: nuevoEstadoPago
      });
      
      setProyectos(prev => prev.map(p => p.id === proyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
      showNotification("Pago actualizado ✓", "success");
    } catch (err: any) {
      showNotification("Error al actualizar pago", "error");
    }
  };

  const handleCambiarFase = async (proyecto: Proyecto, nuevaFase: Proyecto["faseAdministrativa"]) => {
    try {
      const actualizadoEn = new Date().toISOString();
      const proyectoActualizado = await proyectosService.update(proyecto.id, { 
        faseAdministrativa: nuevaFase, 
        actualizadoEn 
      });
      
      setProyectos(prev => prev.map(p => p.id === proyecto.id ? proyectoActualizado : p));
      setSelectedProyecto(proyectoActualizado);
      showNotification(
        `Fase de proyecto actualizada a ${nuevaFase.toUpperCase()}`, 
        "success"
      );
    } catch (err: any) {
      showNotification("Error al actualizar la fase del proyecto", "error");
    }
  };

  const handleCambiarEstado = async (proyecto: Proyecto, nuevoEstado: Proyecto["estado"]) => {
    try {
      // Validación profesional: No permitir completar si hay tareas pendientes vía botones rápidos
      if (nuevoEstado === "completado") {
        const pendientes = proyecto.tareas?.filter(t => !t.completada).length || 0;
        
        if (pendientes > 0 && !isAdmin) {
          showNotification(
            `Control de Calidad: El proyecto tiene ${pendientes} tareas pendientes. Finalízalas todas antes de completar el proyecto.`, 
            "warning"
          );
          return;
        } else if (pendientes > 0 && isAdmin) {
          // Notificación de forzado
          showNotification(
            "Forzando cierre de proyecto (Rol Admin).", 
            "info"
          );
        }
      }

      const actualizadoEn = new Date().toISOString();
      await proyectosService.update(proyecto.id, { estado: nuevoEstado, actualizadoEn: actualizadoEn });
      
      setProyectos(prev => prev.map(p => 
        p.id === proyecto.id 
          ? { ...p, estado: nuevoEstado, actualizadoEn }
          : p
      ));

      if (nuevoEstado === "completado") {
        dispararCelebracion();
        prepararPreviewEmailCierre(proyecto);
      }

      showNotification(
        `Estado del proyecto cambiado a "${nuevoEstado}"`, 
        "success"
      );
    } catch (err: any) {
      showNotification("Error al cambiar estado: " + err.message, "error");
    }
  };

  // Funciones de filtrado
  const getProyectosFiltrados = () => {
    return (proyectos || []).filter(proyecto => {
      const coincideCliente = !filtroCliente ||
        proyecto.clienteNombre.toLowerCase().includes(filtroCliente.toLowerCase());
      const coincideEstado = !filtroEstado || proyecto.estado === filtroEstado;
      const coincidePrioridad = !filtroPrioridad || proyecto.prioridad === filtroPrioridad;

      return coincideCliente && coincideEstado && coincidePrioridad;
    });
  };

  const getProyectosPorTab = () => {
    const filtrados = getProyectosFiltrados();
    
    switch (activeTab) {
      case "activos":
        return filtrados.filter(p => p.estado === "planificacion" || p.estado === "en_progreso");
      case "completados":
        return filtrados.filter(p => p.estado === "completado");
      case "pausados":
        return filtrados.filter(p => p.estado === "pausado");
      case "todos":
      default:
        return filtrados;
    }
  };

  // Detectar proyectos con alertas de vencimiento
  const getProyectosVencimiento = () => {
    const hoy = new Date();
    return proyectos.filter(p => {
      if (p.estado === "completado" || p.estado === "cancelado") return false;
      const fin = new Date(p.fechaFin);
      const diff = differenceInCalendarDays(fin, hoy);
      return diff <= 7; // Alerta si faltan 7 o menos días
    });
  };

  const handleUpdateCosto = async (proyecto: Proyecto, nuevoCosto: number) => {
    try {
      const actualizado = await proyectosService.update(proyecto.id, {
        costoActual: nuevoCosto
      });
      setProyectos(prev => prev.map(p => p.id === proyecto.id ? actualizado : p));
      if (selectedProyecto?.id === proyecto.id) {
        setSelectedProyecto(actualizado);
      }
      showNotification("Costo actualizado", "success");
    } catch (err: any) {
      showNotification("Error al actualizar costo", "error");
    }
  };

  // Funciones de utilidad
  const getEstadoColor = (estado: Proyecto["estado"]) => {
    const colors = {
      planificacion: "#ff9800",
      en_progreso: "#2196f3",
      pausado: "#9e9e9e",
      completado: "#4caf50",
      cancelado: "#f44336",
      renovacion: "#e91e63"
    };
    return colors[estado] || "#666";
  };

  const getPrioridadColor = (prioridad: Proyecto["prioridad"]) => {
    const colors = {
      baja: "#4caf50",
      media: "#ff9800",
      alta: "#f44336",
      urgente: "#9c27b0"
    };
    return colors[prioridad] || "#666";
  };

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const proyectosFiltrados = getProyectosPorTab();

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 }, 
        backgroundColor: "#e3f2fd", 
        borderLeft: "5px solid #2196f3",
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Folder size={28} color="#1976d2" />
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            Gestión de Proyectos
          </Typography>
          <Box
            sx={{
              ml: 'auto',
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
            }}
            onClick={() => {
              const project = selectedProyecto || editingProyecto;
              window.dispatchEvent(new CustomEvent('open-assistant', {
                detail: {
                  route: '/proyectos',
                  entity: project ? 'Proyecto' : '',
                  label: project?.nombre || '',
                  brief: project?.brief,
                  cronograma: project?.cronograma,
                  canales: project?.canales,
                }
              }));
              window.dispatchEvent(new CustomEvent('open-ai-chat'));
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
            </svg>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Organiza y gestiona todos los proyectos por cliente. Asigna servicios, seguimiento y controla el progreso.
        </Typography>
      </Paper>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Buscar Cliente"
              fullWidth
              size="small"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Users size={16} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="planificacion">Planificación</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="pausado">Pausado</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filtroPrioridad}
                label="Prioridad"
                onChange={(e) => setFiltroPrioridad(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => handleOpenProyectoModal()}
                sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
              >
                Nuevo Proyecto
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshCw />}
                onClick={() => window.location.reload()}
              >
                Actualizar
              </Button>
              <Tooltip title={viewMode === "list" ? "Vista en lista" : "Vista kanban"}>
                <Button
                  variant={viewMode === "list" ? "contained" : "outlined"}
                  onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
                  sx={{ minWidth: 40 }}
                >
                  {viewMode === "list" ? "☰" : "☷"}
                </Button>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Pestañas de navegación */}
      <Paper sx={{ p: 1, mb: 2, borderRadius: 2, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
          <Button
            variant={activeTab === "activos" ? "contained" : "text"}
            size="small"
            startIcon={<Play />}
            onClick={() => setActiveTab("activos")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "activos" ? "#e91e63" : "transparent",
              borderColor: activeTab === "activos" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "activos" ? "white" : "#666"
            }}
          >
            Activos ({proyectos.filter(p => p.estado === "planificacion" || p.estado === "en_progreso").length})
          </Button>
          <Button
            variant={activeTab === "completados" ? "contained" : "outlined"}
            startIcon={<CheckCircle />}
            onClick={() => setActiveTab("completados")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "completados" ? "#e91e63" : "transparent",
              borderColor: activeTab === "completados" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "completados" ? "white" : "#666"
            }}
          >
            Completados ({proyectos.filter(p => p.estado === "completado").length})
          </Button>
          <Button
            variant={activeTab === "pausados" ? "contained" : "outlined"}
            startIcon={<Pause />}
            onClick={() => setActiveTab("pausados")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "pausados" ? "#e91e63" : "transparent",
              borderColor: activeTab === "pausados" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "pausados" ? "white" : "#666"
            }}
          >
            Pausados ({proyectos.filter(p => p.estado === "pausado").length})
          </Button>
          <Button
            variant={activeTab === "todos" ? "contained" : "text"}
            size="small"
            startIcon={<Folder />}
            onClick={() => setActiveTab("todos")}
            sx={{ 
              borderRadius: 2,
              backgroundColor: activeTab === "todos" ? "#e91e63" : "transparent",
              borderColor: activeTab === "todos" ? "#e91e63" : "#e0e0e0",
              color: activeTab === "todos" ? "white" : "#666"
            }}
          >
            Todos ({proyectos.length})
          </Button>
        </Box>
      </Paper>

      {/* Alertas de vencimiento */}
      {(() => {
        const proyectosVencimiento = getProyectosVencimiento();
        if (proyectosVencimiento.length === 0) return null;
        return (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <strong>Proyectos próximos a vencer:</strong>
              {proyectosVencimiento.map(p => {
                const dias = differenceInCalendarDays(new Date(p.fechaFin), new Date());
                return (
                  <SafeChip
                    key={p.id}
                    label={`${p.nombre} (${dias <= 0 ? Math.abs(dias) + " días vencido" : dias + " días restantes"})`}
                    size="small"
                    color={dias <= 0 ? "error" : "warning"}
                    sx={{ cursor: "pointer" }}
                    onClick={() => setSelectedProyecto(p)}
                  />
                );
              })}
            </Box>
          </Alert>
        );
      })()}

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
        <Grid container spacing={1.25} sx={{ overflowX: "hidden" }}>
          {proyectosFiltrados.map((proyecto) => (
            <Grid item xs={12} key={proyecto.id}>
              <ExpandableCard
                title={proyecto.nombre}
                subtitle={proyecto.descripcion ? `${proyecto.descripcion.slice(0, 100)}${proyecto.descripcion.length > 100 ? "…" : ""}` : "Sin descripción"}
                status={{ label: proyecto.estado.replace("_", " "), color: getEstadoColor(proyecto.estado) }}
                priority={{ label: proyecto.prioridad, color: getPrioridadColor(proyecto.prioridad) }}
                date={`📅 ${format(new Date(proyecto.fechaInicio), "dd/MM/yyyy")} · ${format(new Date(proyecto.fechaFin), "dd/MM/yyyy")}`}
                amount={`Presupuesto: ${formatCOP(proyecto.presupuesto)}`}
                compact
                defaultExpanded={false}
                titleColor={getEstadoColor(proyecto.estado)}
                footer={
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Tooltip title="Compartir progreso con cliente (Magic Link)">
                      <IconButton size="small" color="primary" onClick={() => handleGenerateMagicLink(proyecto)}>
                        <Share2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => setSelectedProyecto(proyecto)}>
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenProyectoModal(proyecto)}>
                        <Edit2 size={18} />
                      </IconButton>
                    </Tooltip>
                    {proyecto.estado === "en_progreso" && (
                      <Tooltip title="Pausar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "pausado")}>
                          <Pause size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {proyecto.estado === "pausado" && (
                      <Tooltip title="Reanudar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "en_progreso")}>
                          <Play size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {proyecto.estado === "en_progreso" && (
                      <Tooltip title="Completar">
                        <IconButton size="small" onClick={() => handleCambiarEstado(proyecto, "completado")}>
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDeleteProyecto(proyecto)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                onClick={() => setSelectedProyecto(proyecto)}
              >
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Cliente: {proyecto.clienteNombre}
                    </Typography>
                    <SafeChip
                      label={proyecto.faseAdministrativa || "operacion"}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.65rem',
                        height: 20,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        textTransform: 'uppercase'
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(proyecto.servicios || []).map((servicio, index) => (
                      <SafeChip
                        key={index}
                        label={servicio}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.65rem", height: 22 }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Progreso: {proyecto.progreso}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={proyecto.progreso}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getEstadoColor(proyecto.estado)
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Actualizado: {formatDistanceToNow(new Date(proyecto.actualizadoEn), { addSuffix: true, locale: es })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Costo: {formatCOP(proyecto.costoActual)}
                  </Typography>
                </Box>
              </ExpandableCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal para crear/editar proyecto */}
      <Dialog open={openProyectoModal} onClose={handleCloseProyectoModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {editingProyecto ? "Editar Proyecto" : "Nuevo Proyecto"}
            <IconButton onClick={handleCloseProyectoModal}>
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSaveProyecto)}>
          <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nombre del Proyecto *"
              fullWidth
              {...register("nombre")}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              {...register("descripcion")}
              error={!!errors.descripcion}
              helperText={errors.descripcion?.message}
            />
            
            <FormControl fullWidth error={!!errors.clienteId}>
              <InputLabel>Cliente *</InputLabel>
              <Select
                label="Cliente *"
                {...register("clienteId")}
                value={watch("clienteId")}
                onChange={(e) => setValue("clienteId", e.target.value as string)}
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth error={!!errors.servicios}>
              <InputLabel>Servicios Incluidos *</InputLabel>
              <Select
                multiple
                label="Servicios Incluidos *"
                value={watch("servicios") || []}
                onChange={(e) => setValue("servicios", typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <SafeChip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {["SEO", "SEM", "Social Media", "Diseño Web", "Contenido", "Analytics", "E-commerce"].map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    label="Estado"
                    {...register("estado")}
                    value={watch("estado")}
                    onChange={(e) => setValue("estado", e.target.value as Proyecto["estado"])}
                  >
                    <MenuItem value="planificacion">Planificación</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pausado">Pausado</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    label="Prioridad"
                    {...register("prioridad")}
                    value={watch("prioridad")}
                    onChange={(e) => setValue("prioridad", e.target.value as Proyecto["prioridad"])}
                  >
                    <MenuItem value="baja">Baja</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="urgente">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Inicio"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("fechaInicio")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Fin"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("fechaFin")}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Presupuesto (COP)"
              type="number"
              fullWidth
              {...register("presupuesto", { valueAsNumber: true })}
              error={!!errors.presupuesto}
              helperText={errors.presupuesto?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProyectoModal}>Cancelar</Button>
          <Button 
            type="submit"
            variant="contained"
            sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
          >
            {editingProyecto ? "Actualizar" : "Crear"} Proyecto
          </Button>
        </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Detalles del Proyecto con Pestaña de Tareas */}
      <Dialog 
        open={Boolean(selectedProyecto)} 
        onClose={() => setSelectedProyecto(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedProyecto && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{selectedProyecto.nombre}</Typography>
                  <Tooltip title="Generar enlace público de seguimiento">
                    <IconButton size="small" color="primary" onClick={() => handleGenerateMagicLink(selectedProyecto)}>
                      <Share2 size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <IconButton onClick={() => setSelectedProyecto(null)}><X /></IconButton>
              </Box>
              <Tabs 
                value={activeProjectTab} 
                onChange={(_, v) => setActiveProjectTab(v)}
                textColor="primary"
                indicatorColor="primary"
                sx={{ mt: 1, flexWrap: 'wrap' }}
                variant="scrollable"
                allowScrollButtonsMobile
              >
                <Tab label="Información General" />
                <Tab label={`Tareas (${selectedProyecto.tareas?.length || 0})`} />
                <Tab label="Brief" />
                <Tab label="Cronograma" />
                <Tab label="Estrategia y Contenido" />
                <Tab label="Canales" />
                <Tab label="Credenciales" />
                <Tab label={`Recursos (${selectedProyecto.recursos?.length || 0})`} />
              </Tabs>
            </DialogTitle>
            <DialogContent dividers>
              {activeProjectTab === 0 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">Descripción</Typography>
                  <Typography variant="body1" paragraph>{selectedProyecto.descripcion}</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{selectedProyecto.clienteNombre}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Presupuesto</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCOP(selectedProyecto.presupuesto)}</Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                        <Typography variant="subtitle2" gutterBottom>💰 Control de Pagos (50/50)</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Anticipo (50%): {formatCOP(selectedProyecto.presupuesto * 0.5)}</Typography>
                          <SafeChip
                            label={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "RECIBIDO" : "PENDIENTE"}
                            size="small"
                            variant={selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5) ? "filled" : "outlined"}
                            sx={{
                              ...(selectedProyecto.montoPagado >= (selectedProyecto.presupuesto * 0.5)
                                ? { bgcolor: '#4caf50', color: '#fff' }
                                : { borderColor: '#ff9800', color: '#ff9800' })
                            }}
                          />
                        </Box>
                        <TextField
                          label="Monto Recibido"
                          size="small"
                          type="number"
                          fullWidth
                          sx={{ mb: 1, bgcolor: 'white' }}
                          onBlur={(e) => handleUpdatePago(selectedProyecto, Number(e.target.value))}
                          defaultValue={selectedProyecto.montoPagado}
                        />
                        <LinearProgress 
                          variant="determinate" 
                          value={(selectedProyecto.montoPagado / selectedProyecto.presupuesto) * 100} 
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>📋 Onboarding Manual (Acciones Clave)</Typography>
                      {Object.entries(selectedProyecto.onboardingChecklist).map(([key, val]) => (
                        <FormControlLabel
                          key={key}
                          control={
                            <Checkbox 
                              size="small" 
                              checked={val} 
                              onChange={(e) => handleUpdateOnboarding(selectedProyecto, key, e.target.checked)} 
                            />
                          }
                          label={<Typography variant="caption">{key.replace('_', ' ').toUpperCase()}</Typography>}
                        />
                      ))}
                    </Grid>
                  </Grid>
                </Box>
              ) : activeProjectTab === 1 ? (
                <TareasTab
                  proyecto={selectedProyecto!}
                  onAddTarea={handleAddTarea}
                  onToggleTarea={handleToggleTarea}
                  onDeleteTarea={handleDeleteTarea}
                />
              ) : activeProjectTab === 2 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Brief Creativo</Typography>
                  <TextField
                    label="Responde las preguntas del brief de forma libre"
                    size="small"
                    fullWidth
                    multiline
                    minRows={8}
                    value={typeof selectedProyecto.brief === 'string' ? selectedProyecto.brief : JSON.stringify(selectedProyecto.brief || {}, null, 2)}
                    onChange={(e) => proyectosService.update(selectedProyecto.id, { brief: e.target.value })}
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  />
                </Box>
              ) : activeProjectTab === 3 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Cronograma del Proyecto</Typography>
                  {(() => {
                    const items = Array.isArray(selectedProyecto.cronograma) ? selectedProyecto.cronograma : [];
                    const [nuevo, setNuevo] = useState('');
                    const add = async () => {
                      if (!nuevo.trim()) return;
                      await proyectosService.updateCronograma(selectedProyecto.id, [...items, { titulo: nuevo.trim(), completado: false, fecha: new Date().toISOString().split('T')[0] }]);
                      setSelectedProyecto(await proyectosService.getById(selectedProyecto.id));
                      setNuevo('');
                    };
                    const toggle = async (idx: number) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], completado: !next[idx].completado };
                      await proyectosService.updateCronograma(selectedProyecto.id, next);
                      setSelectedProyecto(await proyectosService.getById(selectedProyecto.id));
                    };
                    return (
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Ej: Grabación reel semana 2"
                            value={nuevo}
                            onChange={(e) => setNuevo(e.target.value)}
                          />
                          <Button variant="contained" size="small" onClick={add} disabled={!nuevo.trim()}>Agregar</Button>
                        </Stack>
                        <List dense>
                          {items.map((item: any, i: number) => (
                            <ListItem key={i} disableGutters secondaryAction={
                              <IconButton size="small" onClick={() => toggle(i)}>
                                {item.completado ? <CheckCircle size={16} color="#4caf50" /> : <Play size={16} color="#9e9e9e" />}
                              </IconButton>
                            }>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {item.completado ? <CheckCircle size={18} color="#4caf50" /> : <Clock size={18} color="#9e9e9e" />}
                              </ListItemIcon>
                              <ListItemText primaryTypographyProps={{ fontSize: '0.75rem', sx: { textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? 'text.disabled' : 'text.primary' } }} primary={item.titulo || item} secondary={item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : undefined} secondaryTypographyProps={{ fontSize: '0.65rem' }} />
                            </ListItem>
                          ))}
                          {items.length === 0 && <ListItem disableGutters><ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="Pendiente por definir" /></ListItem>}
                        </List>
                      </Stack>
                    );
                  })()}
                </Box>
              ) : activeProjectTab === 4 ? (
                /* PESTAÑA DE ESTRATEGIA Y CONTENIDO */
                <Box sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Award size={18} color="#e91e63" /> Fase Administrativa Actual
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={generatingPlan ? <CircularProgress size={14} /> : <Zap size={14} />}
                      onClick={handleGenerarPlanIA}
                      disabled={generatingPlan}
                      sx={{ color: '#e91e63', borderColor: '#e91e63' }}
                    >
                      {generatingPlan ? "Generando..." : "Generar Plan con IA"}
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
                    {["propuesta", "contrato", "onboarding", "operacion", "capacitacion", "renovacion"].map((fase) => (
                      <SafeChip 
                        key={fase}
                        label={fase.toUpperCase()}
                        onClick={() => handleCambiarFase(selectedProyecto, fase as any)}
                        color={selectedProyecto.faseAdministrativa === fase ? "primary" : "default"}
                        variant={selectedProyecto.faseAdministrativa === fase ? "filled" : "outlined"}
                        size="small"
                      />
                    ))}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff5f8' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Video size={14} /> IDEAS DE REELS
                        </Typography>
                        <List dense>
                          {(selectedProyecto.planContenido?.reels || []).map((idea, i) => {
                            const texto = typeof idea === 'string' ? idea : idea.texto;
                            const completada = typeof idea === 'string' ? false : idea.completada;
                            const responsable = typeof idea === 'string' ? undefined : idea.responsable;
                            return (
                              <ListItem key={i} disableGutters>
                                <ListItemIcon 
                                  sx={{ minWidth: 30, cursor: 'pointer' }} 
                                  onClick={() => handleTogglePlanItem('reels', i)}
                                >
                                  {completada ? <CheckCircle size={16} color="#4caf50" /> : <Play size={16} color="#9e9e9e" />}
                                </ListItemIcon>
                                <ListItemText 
                                  primaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    sx: { 
                                      textDecoration: completada ? 'line-through' : 'none',
                                      color: completada ? 'text.disabled' : 'text.primary'
                                    }
                                  }} 
                                  primary={texto}
                                  secondary={responsable ? `Encargado: ${responsable}` : undefined}
                                  secondaryTypographyProps={{ fontSize: '0.65rem' }}
                                />
                              </ListItem>
                            );
                          })}
                          {(!selectedProyecto.planContenido?.reels || selectedProyecto.planContenido.reels.length === 0) && (
                            <ListItem disableGutters><ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="• Pendiente por definir" /></ListItem>
                          )}
                        </List>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f7ff' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Camera size={14} /> IDEAS STORIES
                        </Typography>
                        <List dense>
                          {(selectedProyecto.planContenido?.stories || []).map((idea, i) => {
                            const texto = typeof idea === 'string' ? idea : idea.texto;
                            const completada = typeof idea === 'string' ? false : idea.completada;
                            return (
                              <ListItem key={i} disableGutters>
                                <ListItemIcon 
                                  sx={{ minWidth: 30, cursor: 'pointer' }} 
                                  onClick={() => handleTogglePlanItem('stories', i)}
                                >
                                  {completada ? <CheckCircle size={16} color="#4caf50" /> : <Play size={16} color="#9e9e9e" />}
                                </ListItemIcon>
                                <ListItemText 
                                  primaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    sx: { 
                                      textDecoration: completada ? 'line-through' : 'none',
                                      color: completada ? 'text.disabled' : 'text.primary'
                                    }
                                  }} 
                                  primary={texto} 
                                />
                              </ListItem>
                            );
                          })}
                          {(!selectedProyecto.planContenido?.stories || selectedProyecto.planContenido.stories.length === 0) && (
                            <ListItem disableGutters><ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="• 5 diarias según estrategia" /></ListItem>
                          )}
                        </List>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f6ffed' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Zap size={14} /> VIDEOS PAUTA
                        </Typography>
                        <List dense>
                          {(selectedProyecto.planContenido?.pauta || []).map((idea, i) => {
                            const texto = typeof idea === 'string' ? idea : idea.texto;
                            const completada = typeof idea === 'string' ? false : idea.completada;
                            return (
                              <ListItem key={i} disableGutters>
                                <ListItemIcon 
                                  sx={{ minWidth: 30, cursor: 'pointer' }} 
                                  onClick={() => handleTogglePlanItem('pauta', i)}
                                >
                                  {completada ? <CheckCircle size={16} color="#4caf50" /> : <Play size={16} color="#9e9e9e" />}
                                </ListItemIcon>
                                <ListItemText 
                                  primaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    sx: { 
                                      textDecoration: completada ? 'line-through' : 'none',
                                      color: completada ? 'text.disabled' : 'text.primary'
                                    }
                                  }} 
                                  primary={texto} 
                                />
                              </ListItem>
                            );
                          })}
                          {(!selectedProyecto.planContenido?.pauta || selectedProyecto.planContenido.pauta.length === 0) && (
                            <ListItem disableGutters><ListItemText primaryTypographyProps={{fontSize: '0.75rem'}} primary="• Gancho + Beneficio + CTA" /></ListItem>
                          )}
                        </List>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              ) : activeProjectTab === 5 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Canales Digitales</Typography>
                  <Stack spacing={1}>
                    {['Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Google Business', 'Página Web'].map((canal) => {
                      const link = (selectedProyecto.canales || {})[canal];
                      return (
                        <Box key={canal} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={canal} size="small" variant="outlined" sx={{ minWidth: 160 }} />
                          <TextField
                            size="small"
                            fullWidth
                            placeholder={`https://...`}
                            value={link || ''}
                            onChange={(e) => {
                              const updated = { ...(selectedProyecto.canales || {}), [canal]: e.target.value };
                              proyectosService.update(selectedProyecto.id, { canales: updated });
                              setSelectedProyecto({ ...selectedProyecto, canales: updated });
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ) : activeProjectTab === 6 ? (
                <Box sx={{ py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Contrato y Facturación</Typography>
                  <Stack spacing={1}>
                    <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
                      try {
                        const pdfUrl = await contratosService.generarContratoPDF(selectedProyecto);
                        showNotification('Contrato generado: descargalo desde /contratos', 'success');
                      } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
                    }}>Generar contrato</Button>
                    <Button variant="outlined" size="small" startIcon={<FiFileText />} onClick={async () => {
                      try {
                        const pdfUrl = await facturasService.generarFacturaPDF(selectedProyecto);
                        showNotification('Factura generada', 'success');
                      } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
                    }}>Generar factura</Button>
                    {(selectedProyecto as any).contrato_url && (
                      <Button size="small" variant="text" href={(selectedProyecto as any).contrato_url} target="_blank">Abrir contrato</Button>
                    )}
                    {selectedProyecto.facturacion_detalle && (
                      <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>{typeof selectedProyecto.facturacion_detalle === 'string' ? selectedProyecto.facturacion_detalle : JSON.stringify(selectedProyecto.facturacion_detalle, null, 2)}</Alert>
                    )}
                  </Stack>
                </Box>
              ) : (
                /* PESTAÑA DE CREDENCIALES */
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Credenciales y Accesos</Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        const canal = prompt('Canal (Google, Hostinger, Meta, Tiendanube...)', 'Google') || '';
                        const usuario = prompt('Usuario / email') || '';
                        const contrasena = prompt('Contraseña', '') || '';
                        const url = prompt('URL (opcional)') || '';
                        if (!canal) return;
                        try {
                          await credencialesService.create({ proyecto_id: String(selectedProyecto.id), tipo: 'cuenta', canal, usuario, contrasena, url });
                          showNotification('Credencial guardada', 'success');
                        } catch (e: any) { showNotification('Error: ' + e.message, 'error'); }
                      }}
                      startIcon={<Plus size={14} />}
                    >Agregar</Button>
                  </Stack>
                  {credenciales.length === 0 && (
                    <Alert severity="info">Sin credenciales cargadas.</Alert>
                  )}
                  <List dense>
                    {credenciales.map((c: any) => (
                      <ListItem key={c.id} disableGutters secondaryAction={
                        <IconButton size="small" color="error" onClick={async () => { try { await credencialesService.delete(c.id); setCredenciales((prev: any[]) => prev.filter((x: any) => x.id !== c.id)); showNotification('Eliminado', 'success'); } catch (e:any) { showNotification('Error','error'); } }}>
                          <Trash2 size={16} />
                        </IconButton>
                      }>
                        <ListItemIcon sx={{ minWidth: 32 }}><ExternalLink size={18} /></ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{c.canal} · {c.usuario}</Typography>}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{mostrarPwd[c.id] ? (c.contrasena || '') : '••••••••'}</Typography>
                              <IconButton size="small" onClick={() => setMostrarPwd((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}>
                                {mostrarPwd[c.id] ? <Eye size={14} color="#9e9e9e"/> : <Eye size={14} color="#9e9e9e"/>}
                              </IconButton>
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Modal de Vista Previa de Email de Cierre */}
      <Dialog open={openPreviewEmailModal} onClose={() => setOpenPreviewEmailModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0f7ff' }}>
          <Mail color="#2196f3" />
          Vista Previa: Email de Cierre y Encuesta
        </DialogTitle>
        <DialogContent dividers>
          {previewEmailContent ? (
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>Asunto:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fafafa' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{previewEmailContent.asunto}</Typography>
              </Paper>
              
              <Typography variant="subtitle2" color="primary" gutterBottom>Cuerpo del Mensaje:</Typography>
              <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fff', minHeight: 200 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewEmailContent.cuerpo}
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fffde7', borderRadius: 1, border: '1px solid #ffd600' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Zap size={14} /> La IA ha incluido automáticamente una sección de <strong>Encuesta de Satisfacción</strong> y una mención a la reseña de Google.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={30} sx={{ mb: 2 }} />
              <Typography>Redactando email de cierre con IA...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPreviewEmailModal(false)} variant="outlined">Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleEnviarEmailCierre}
            disabled={sendingEmail || !previewEmailContent}
            startIcon={sendingEmail ? <CircularProgress size={16} color="inherit" /> : <Send />}
          >
            Enviar Email al Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

