import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, TextField
} from "@mui/material";
import { FiCalendar, FiInfo, FiCreditCard, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNotificationStore } from "../store/useNotificationStore";
import { useCRMStore } from "../store/useCRMStore";
import { facturasService, pagosService } from "../services/supabase";

const locales = {
  "es": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function meta() {
  return [
    { title: "Calendario | DESEO DIGITAL" },
    { name: "description", content: "Calendario interactivo de agencia" },
  ];
}

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'tarea' | 'venta';
  color: string;
  desc?: string;
  facturaId?: number;
}

export default function Calendario() {
  const tareas = useCRMStore((s) => s.tareas);
  const oportunidades = useCRMStore((s) => s.oportunidades);
  const clientes = useCRMStore((s) => s.clientes);
  const fetchDashboardData = useCRMStore((s) => s.fetchDashboardData);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  
  // Estados para el Modal de Detalles
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", start: "", end: "", allDay: true, type: "tarea" as CalEvent["type"], color: "#2196f3", desc: "" });

  const { showNotification } = useNotificationStore();
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
            showNotification("Error al cargar eventos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tareasLocal = tareas || [];
    const ventas = oportunidades || [];
    const clientesLocal = clientes || [];

    const calendarEvents: CalEvent[] = [];

    // Mapear Tareas al calendario
    tareasLocal.forEach((t: any) => {
      if (t.fecha) {
        const date = new Date(t.fecha);
        const cliente = t.cliente_id ? clientesLocal.find((c: any) => String(c.id) === String(t.cliente_id)) : null;
        const clienteInfo = cliente ? ` (${cliente.nombre}${cliente.nicho ? ` - ${cliente.nicho}` : ''})` : '';

        calendarEvents.push({
          id: `tarea-${t.id}`,
          title: `[Tarea] ${t.titulo}${clienteInfo}`,
          start: date,
          end: date,
          allDay: true,
          type: 'tarea',
          color: t.estado === 'Completada' ? '#4caf50' : '#2196f3',
          desc: t.descripcion
        });
      }
    });

    // Mapear Oportunidades (Cierres proyectados)
    ventas.forEach((v: any) => {
      const date = new Date(v.created_at);
      date.setDate(date.getDate() + 15);
      
      calendarEvents.push({
        id: `venta-${v.id}`,
        title: `[Cierre] ${v.nombre}`,
        start: date,
        end: date,
        allDay: true,
        type: 'venta',
        color: '#e91e63',
        desc: `Oportunidad: ${v.cliente_nombre} - ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v.valor)}`
      });
    });

    setEvents(calendarEvents);
  }, [tareas.length, oportunidades.length, clientes.length]);

  // Sincronizar vencimientos de facturas al calendario
  useEffect(() => {
    let cancelled = false;
    const syncFacturas = async () => {
      try {
        const data = await facturasService.getAll();
        if (cancelled) return;
        const facturasList = data || [];
        const vencimientos = facturasList
          .filter((f: any) => f.fecha_vencimiento)
          .map((f: any) => {
            const date = new Date(f.fecha_vencimiento);
            return {
              id: `factura-vencimiento-${f.id}`,
              title: `[Vencimiento] Factura #${f.numero_factura || f.id}`,
              start: date,
              end: date,
              allDay: true,
              type: 'tarea',
              color: f.estado === "Pagada" ? '#4caf50' : f.estado === "Vencida" ? '#f44336' : '#ff9800',
              facturaId: f.id,
              desc: `Cliente: ${f.cliente?.nombre || `Cliente #${f.cliente_id}`} - Total: $${Number(f.total || 0).toFixed(0)} - Estado: ${f.estado || "Sin estado"}`
            } as any;
          });
        setEvents(prev => {
          const filtered = prev.filter(e => !String(e.id).startsWith("factura-vencimiento-"));
          return [...filtered, ...vencimientos];
        });
      } catch {}
    };
    syncFacturas();
    return () => { cancelled = true; };
  }, []);

  const handleSelectEvent = (event: CalEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({ title: "", start: "", end: "", allDay: true, type: "tarea", color: "#2196f3", desc: "" });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CalEvent) => {
    setEditingEvent(evt);
    const toLocalDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventForm({ title: evt.title, start: toLocalDate(new Date(evt.start)), end: toLocalDate(new Date(evt.end)), allDay: evt.allDay || false, type: evt.type, color: evt.color, desc: evt.desc || "" });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.start) {
        showNotification("Título y fecha requeridos", "warning");
        return;
      }
      const start = new Date(eventForm.start);
      const end = eventForm.end ? new Date(eventForm.end) : start;
      const title = eventForm.type === "tarea" ? `[Tarea] ${eventForm.title}` : eventForm.type === "venta" ? `[Cierre] ${eventForm.title}` : eventForm.title;
      const color = eventForm.type === "tarea" ? "#2196f3" : eventForm.type === "venta" ? "#e91e63" : eventForm.color;
      const newEvent: CalEvent = {
        id: editingEvent ? editingEvent.id : `cal-${Date.now()}`,
        title,
        start,
        end,
        allDay: eventForm.allDay,
        type: eventForm.type,
        color,
        desc: eventForm.desc
      };
      setEvents(prev => editingEvent ? prev.map(e => e.id === editingEvent.id ? newEvent : e) : [...prev, newEvent]);
      setEventModalOpen(false);
      showNotification(editingEvent ? "Evento actualizado" : "Evento creado", "success");
    } catch (err: any) {
      showNotification(err.message || "Error guardando evento", "error");
    }
  };

  const handleDeleteEvent = async (evt: CalEvent) => {
    if (!confirm(`¿Eliminar evento "${evt.title}"?`)) return;
    setEvents(prev => prev.filter(e => e.id !== evt.id));
    setIsModalOpen(false);
    showNotification("Evento eliminado", "success");
  };

  const filteredEvents = filterType ? events.filter(e => e.type === filterType) : events;

  const handleQuickPay = async () => {
    if (!selectedEvent?.facturaId) return;
    try {
      const facturasList = await facturasService.getAll();
      const factura = (facturasList || []).find((f: any) => f.id === selectedEvent.facturaId);
      if (!factura) { showNotification("Factura no encontrada", "warning"); return; }
      const total = Number(factura.total || 0);
      const pagosList = await pagosService.getByFactura(factura.id);
      const pagado = (pagosList || []).reduce((a, b) => a + Number(b.monto || 0), 0);
      const saldo = Math.max(total - pagado, 0);
      const telefono = factura.cliente?.telefono || "";
      const clienteNombre = factura.cliente?.nombre || `Cliente #${factura.cliente_id}`;
      const texto = encodeURIComponent(`Hola ${clienteNombre}, te compartimos tu factura #${factura.numero_factura || factura.id} por $${total.toFixed(0)}. Saldo pendiente: $${saldo.toFixed(0)}. Estado: ${factura.estado || "Borrador"}. Fecha vencimiento: ${factura.fecha_vencimiento || "Sin definir"}. Ante cualquier duda respondé este mensaje.`);
      if (telefono) {
        if (typeof window !== "undefined") window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
        showNotification("Abriendo WhatsApp...", "info");
      } else {
        showNotification("El cliente no tiene teléfono cargado", "warning");
      }
    } catch (err: any) { showNotification(err.message || "Error", "error"); }
  };

  const eventStyleGetter = (event: CalEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={60} sx={{ color: '#e91e63' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, height: { xs: 'calc(100vh - 100px)', sm: 'calc(100vh - 80px)' } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
        <FiCalendar size={20} color="#1976d2" />
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", flex: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Calendario</Typography>
        <Tooltip title="Sincroniza tus tareas y proyecciones de ventas en un solo lugar.">
          <IconButton color="primary" size="small"><FiInfo /></IconButton>
        </Tooltip>
        <Button size="small" variant="contained" startIcon={<FiPlus size={14} />} onClick={handleOpenCreateEvent}>Nuevo</Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Filtrar</InputLabel>
          <Select value={filterType} label="Filtrar" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="tarea">Tareas</MenuItem>
            <MenuItem value="venta">Cierres</MenuItem>
            <MenuItem value="factura">Vencimientos</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: { xs: 0.75, sm: 1 }, height: '100%', minHeight: { xs: 320, sm: 420 }, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          height={typeof window !== 'undefined' ? window.innerHeight - 220 : 700}
          culture="es"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView={Views.MONTH}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            noEventsInRange: "No hay eventos en este rango."
          }}
        />
      </Paper>

      {/* Modal de Detalle de Evento */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: selectedEvent.color }} />
              {selectedEvent.title}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                {selectedEvent.desc || "Sin descripción."}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', fontSize: '0.9rem' }}>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {format(selectedEvent.start, "dd 'de' MMMM, yyyy", { locale: es })}
                </Typography>
                <Chip size="small" label={selectedEvent.type} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<FiEdit2 size={14} />} onClick={() => handleOpenEditEvent(selectedEvent)}>Editar</Button>
              <Button startIcon={<FiTrash2 size={14} />} color="error" onClick={() => handleDeleteEvent(selectedEvent)}>Eliminar</Button>
              {selectedEvent.facturaId && <Button startIcon={<FiCreditCard size={14} />} onClick={handleQuickPay}>Cobrar por WhatsApp</Button>}
              <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal Crear/Editar Evento */}
      <Dialog open={eventModalOpen} onClose={() => setEventModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEvent ? "Editar evento" : "Nuevo evento"}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField label="Título" size="small" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} fullWidth />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <TextField label="Inicio" size="small" type="datetime-local" value={eventForm.start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm({ ...eventForm, start: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Fin" size="small" type="datetime-local" value={eventForm.end} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventForm({ ...eventForm, end: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={eventForm.type} label="Tipo" onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as CalEvent["type"] })}>
                <MenuItem value="tarea">Tarea</MenuItem>
                <MenuItem value="venta">Cierre</MenuItem>
                <MenuItem value="factura">Vencimiento</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Descripción" size="small" value={eventForm.desc} onChange={(e) => setEventForm({ ...eventForm, desc: e.target.value })} fullWidth multiline minRows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEvent}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
