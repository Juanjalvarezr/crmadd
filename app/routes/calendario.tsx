import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip
} from "@mui/material";
import { FiCalendar, FiPlus, FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css"; // Estilos de react-big-calendar
import {
  tareasService, 
  clientesService, 
  oportunidadesService 
} from "../services/database"; // Corregido el typo "Serrvices"
import { useNotificationStore } from "../store/useNotificationStore";
import { useCRMStore } from "../store/useCRMStore";

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
}

export default function Calendario() {
  const tareas = useCRMStore((s) => s.tareas);
  const oportunidades = useCRMStore((s) => s.oportunidades);
  const clientes = useCRMStore((s) => s.clientes);
  const fetchDashboardData = useCRMStore((s) => s.fetchDashboardData);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Detalles
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showNotification } = useNotificationStore();
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error al cargar calendario", error);
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
      // Simulamos que el created_at + 15 días es la fecha de cierre si no hay otra
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


  const handleSelectEvent = (event: CalEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, height: 'calc(100vh - 80px)' }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <FiCalendar size={22} color="#1976d2" />
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", flex: 1 }}>Calendario</Typography>
        <Tooltip title="Sincroniza tus tareas y proyecciones de ventas en un solo lugar.">
          <IconButton color="primary" size="small"><FiInfo /></IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ p: 2, height: '100%', minHeight: { xs: 420, sm: 520 }, borderRadius: 2 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '100%' }}
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
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
