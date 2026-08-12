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
} from "../services/supabase"; // Corregido el typo "Serrvices"
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
  const [filterType, setFilterType] = useState<'todos' | 'tarea' | 'venta'>('todos');
  
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
          color: t.estado === 'Completada' ? '#2e7d32' : '#1976d2',
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
        color: '#d81b60',
        desc: `Oportunidad: ${v.cliente_nombre || 'Cliente'} - ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v.valor || 0)}`
      });
    });

    setEvents(calendarEvents);
  }, [tareas.length, oportunidades.length, clientes.length]);

  const filteredEvents = React.useMemo(() => {
    if (filterType === 'todos') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const handleSelectEvent = (event: CalEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const eventStyleGetter = (event: CalEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '6px',
        opacity: 0.95,
        color: '#ffffff',
        border: 'none',
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 600,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        padding: '3px 6px'
      }
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress size={50} sx={{ color: '#1976d2' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header and Controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
            <FiCalendar size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' }, tracking: '-0.01em' }}>
              Calendario de Operaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Sincronización de tareas y cierres de ventas
            </Typography>
          </Box>
        </Box>

        {/* Legend & Filters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip 
            label="Todos" 
            size="small" 
            color={filterType === 'todos' ? 'primary' : 'default'}
            variant={filterType === 'todos' ? 'filled' : 'outlined'}
            onClick={() => setFilterType('todos')}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
          <Chip 
            label="Tareas" 
            size="small" 
            color={filterType === 'tarea' ? 'info' : 'default'}
            variant={filterType === 'tarea' ? 'filled' : 'outlined'}
            onClick={() => setFilterType('tarea')}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
          <Chip 
            label="Cierres / Ventas" 
            size="small" 
            color={filterType === 'venta' ? 'secondary' : 'default'}
            variant={filterType === 'venta' ? 'filled' : 'outlined'}
            onClick={() => setFilterType('venta')}
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
          <Tooltip title="Visualiza tus compromisos, fechas límite de proyectos y cierres financieros.">
            <IconButton color="primary" size="small"><FiInfo /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Calendar Paper Container */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1.5, sm: 2.5 }, 
          height: { xs: 'calc(100vh - 210px)', sm: 'calc(100vh - 190px)' }, 
          minHeight: { xs: 450, sm: 550 }, 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden' 
        }}
      >
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '100%' }}
          culture="es"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView={Views.MONTH}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            noEventsInRange: "No hay eventos registrados en este periodo."
          }}
        />
      </Paper>

      {/* Modal de Detalle de Evento */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: selectedEvent.color, flexShrink: 0 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', flex: 1 }}>
                {selectedEvent.title}
              </Typography>
              <Chip 
                label={selectedEvent.type === 'tarea' ? 'Tarea' : 'Cierre Financiero'} 
                size="small" 
                sx={{ bgcolor: `${selectedEvent.color}22`, color: selectedEvent.color, fontWeight: 700 }} 
              />
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                  Descripción / Detalle
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 0.5, color: 'text.primary', fontWeight: 500 }}>
                  {selectedEvent.desc || "Sin descripción adicional."}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', fontSize: '0.875rem', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: 2 }}>
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Fecha programada:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                    {format(selectedEvent.start, "EEEE, dd 'de' MMMM, yyyy", { locale: es })}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={() => setIsModalOpen(false)} sx={{ borderRadius: 2 }}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
