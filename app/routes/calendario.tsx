import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, IconButton, Tooltip, CircularProgress, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, Grid
} from "@mui/material";
import { FiCalendar, FiInfo, FiRefreshCw, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isToday } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  tareasService,
  clientesService,
  oportunidadesService,
  proyectosService
} from "../services/database";
import { useNotificationStore } from "../store/useNotificationStore";
import SafeChip from "../components/SafeChip";

const locales = { "es": es };

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

const TYPE_CONFIG = {
  tarea: { label: "Tarea", color: "#2196f3", completedColor: "#4caf50" },
  venta: { label: "Cierre proyectado", color: "#e91e63" },
};

export default function Calendario() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "tarea" | "venta">("all");
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [filterProyecto, setFilterProyecto] = useState(() => {
    try { return localStorage.getItem('filtros-calendario-proyecto') || 'all'; } catch { return 'all'; }
  });

  const { showNotification } = useNotificationStore();

  useEffect(() => { loadEvents(); }, [filterProyecto]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [tareas, ventas, clientes, proyectos] = await Promise.all([
        tareasService.getAll(),
        oportunidadesService.getAll(),
        clientesService.getAll(),
        proyectosService.getAll()
      ]);

      const proyectosMap = new Map((proyectos || []).map((p: any) => [String(p.id), p]));

      const calendarEvents: CalEvent[] = [];

      tareas.forEach((t: any) => {
        const matchProyecto = filterProyecto === 'all' || String(t.proyecto_id || t.proyecto || '') === String(filterProyecto);
        if (!matchProyecto) return;
        if (t.fecha) {
          const date = new Date(t.fecha);
          const cliente = t.cliente_id ? clientes.find((c: any) => c.id === t.cliente_id) : null;
          const proyecto = t.proyecto_id || t.proyecto ? proyectosMap.get(String(t.proyecto_id || t.proyecto)) : null;
          const clienteInfo = cliente ? ` • ${cliente.nombre}` : '';
          const proyectoInfo = proyecto?.nombre ? ` • ${proyecto.nombre}` : '';
          calendarEvents.push({
            id: `tarea-${t.id}`,
            title: `${t.titulo}${clienteInfo}${proyectoInfo}`,
            start: date,
            end: date,
            allDay: true,
            type: 'tarea',
            color: t.estado === 'Completada' ? '#4caf50' : '#2196f3',
            desc: t.descripcion
          });
        }
      });

      ventas.forEach((v: any) => {
        const matchProyecto = filterProyecto === 'all' || String(v.proyecto_id || v.proyecto || '') === String(filterProyecto);
        if (!matchProyecto) return;
        const date = new Date(v.created_at);
        date.setDate(date.getDate() + 15);
        const proyecto = v.proyecto_id || v.proyecto ? proyectosMap.get(String(v.proyecto_id || v.proyecto)) : null;
        const proyectoInfo = proyecto?.nombre ? ` • ${proyecto.nombre}` : '';
        calendarEvents.push({
          id: `venta-${v.id}`,
          title: `[Cierre] ${v.nombre}${proyectoInfo}`,
          start: date,
          end: date,
          allDay: true,
          type: 'venta',
          color: '#e91e63',
          desc: `Oportunidad: ${v.cliente_nombre} — ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v.valor)}`
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      showNotification("Error al cargar eventos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const eventStyleGetter = (event: CalEvent) => {
    const icon = event.type === 'tarea' ? '☑️' : event.type === 'venta' ? '💰' : '📌';
    const time = event.start ? format(event.start, 'HH:mm') : '';
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.68rem',
        fontWeight: 600,
        padding: '2px 6px',
        boxShadow: `0 1px 4px ${event.color}55`,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }
    };
  };

  const eventPropGetter = (event: CalEvent) => ({
    event: {
      title: `${event.type === 'tarea' ? '☑️' : event.type === 'venta' ? '💰' : '📌'} ${event.title}`,
      ...(event.start ? ({ time: format(event.start, 'HH:mm') } as any) : {})
    }
  });

  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter);

  const tareas = events.filter(e => e.type === "tarea");
  const ventas = events.filter(e => e.type === "venta");
  const hoy = events.filter(e => isToday(e.start));

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: 2 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <Typography color="text.secondary" variant="body2">Cargando eventos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, height: "100%", display: "flex", flexDirection: "column", gap: 1.5, overflow: "hidden" }}>
      {/* Header compacto */}
      <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 2 }, borderRadius: 2, borderLeft: "4px solid #1976d2" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiCalendar size={18} color="#1976d2" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Calendario</Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
            {/* Filtro por proyecto */}
            <Select
              size="small"
              value={filterProyecto}
              onChange={(e) => setFilterProyecto(String(e.target.value))}
              sx={{ minWidth: 170, fontSize: '0.7rem' }}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              <MenuItem value="">Sin proyecto</MenuItem>
              {(proyectos || []).map((p: any) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.nombre}</MenuItem>
              ))}
            </Select>

            {/* Filtros por tipo */}
            {(["all", "tarea", "venta"] as const).map((f) => (
              <Chip
                key={f}
                label={f === "all" ? "Todos" : f === "tarea" ? "Tareas" : "Cierres"}
                size="small"
                variant={filter === f ? "filled" : "outlined"}
                onClick={() => setFilter(f)}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  bgcolor: filter === f ? (f === "tarea" ? "#2196f3" : f === "venta" ? "#e91e63" : "#1976d2") : "transparent",
                  color: filter === f ? "white" : "inherit",
                  borderColor: f === "tarea" ? "#2196f3" : f === "venta" ? "#e91e63" : "divider",
                  "&:hover": { opacity: 0.85 },
                }}
              />
            ))}
            <Tooltip title="Recargar eventos">
              <IconButton size="small" onClick={loadEvents}><FiRefreshCw size={14} /></IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* KPIs rápidos */}
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {[
            { label: "Total eventos", value: events.length, color: "#1976d2" },
            { label: "Tareas", value: tareas.length, color: "#2196f3" },
            { label: "Cierres", value: ventas.length, color: "#e91e63" },
            { label: "Hoy", value: hoy.length, color: "#4caf50" },
          ].map((s) => (
            <Grid item xs={3} key={s.label}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, lineHeight: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem" }}>{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Controles de vista — mobile friendly */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
          <IconButton size="small" onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() - 1);
            setDate(d);
          }} sx={{ borderRadius: 0 }}>
            <FiChevronLeft size={16} />
          </IconButton>
          <Button
            size="small"
            onClick={() => setDate(new Date())}
            sx={{ borderRadius: 0, px: 1.5, fontSize: "0.72rem", fontWeight: 600, minWidth: 0 }}
          >
            Hoy
          </Button>
          <IconButton size="small" onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 1);
            setDate(d);
          }} sx={{ borderRadius: 0 }}>
            <FiChevronRight size={16} />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
          {[
            { label: "Mes", val: Views.MONTH },
            { label: "Semana", val: Views.WEEK },
            { label: "Día", val: Views.DAY },
          ].map((v) => (
            <Button
              key={v.val}
              size="small"
              onClick={() => setView(v.val)}
              sx={{
                borderRadius: 0,
                px: { xs: 1, sm: 1.5 },
                fontSize: "0.72rem",
                fontWeight: 600,
                bgcolor: view === v.val ? "primary.main" : "transparent",
                color: view === v.val ? "#ffffff" : "text.primary",
                "&:hover": { bgcolor: view === v.val ? "primary.dark" : "action.hover" },
              }}
            >
              {v.label}
            </Button>
          ))}
        </Box>

        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", ml: "auto" }}>
          {format(date, "MMMM yyyy", { locale: es }).toUpperCase()}
        </Typography>
      </Box>

      {/* Calendario principal */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          borderRadius: 2,
          overflow: "hidden",
          height: { xs: 380, md: "calc(100vh - 300px)" },
          minHeight: 340,
          display: "flex",
          flexDirection: "column",
          "& .rbc-calendar": { fontFamily: "inherit", height: "100%" },
          "& .rbc-header": { py: 0.75, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "text.secondary", bgcolor: "background.default", borderRight: "none" },
          "& .rbc-today": { bgcolor: "action.selected" },
          "& .rbc-off-range-bg": { bgcolor: "background.default" },
          "& .rbc-toolbar": { display: "none" },
          "& .rbc-month-view, & .rbc-week-view, & .rbc-day-view": { flex: 1 },
          "& .rbc-day-bg + .rbc-day-bg": { borderLeft: "1px solid divider" },
          "& .rbc-event": { fontSize: "0.7rem !important", padding: "2px 4px", margin: "1px 0", borderRadius: 1.5 },
          "& .rbc-time-content": { borderTop: "none" },
          "& .rbc-time-header": { borderRight: "none" },
          "& .rbc-time-gutter": { borderRight: "none" },
          "& .rbc-day-slot": { borderRight: "none" },
          "& .rbc-agenda-view, & .rbc-month-view, & .rbc-week-view": { overflowX: "hidden" }
        }}
      >
        <Box sx={{ height: "100%", minHeight: 320 }}>
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            culture="es"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            views={['month', 'week', 'day']}
            view={view}
            date={date}
            onNavigate={setDate}
            onView={setView}
            messages={{
              next: "›",
              previous: "‹",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              noEventsInRange: "Sin eventos en este período",
            }}
          />
        </Box>
      </Paper>

      {/* Leyenda */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", px: 0.5 }}>
        {[
          { color: "#2196f3", label: "Tarea pendiente" },
          { color: "#4caf50", label: "Tarea completada" },
          { color: "#e91e63", label: "Cierre proyectado" },
        ].map((l) => (
          <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: l.color }} />
            <Typography variant="caption" color="text.secondary">{l.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Modal de detalle */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="xs" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: selectedEvent.color, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>{selectedEvent.title}</Typography>
                <SafeChip
                  label={selectedEvent.type === "tarea" ? "Tarea" : "Cierre Proyectado"}
                  size="small"
                  sx={{ bgcolor: selectedEvent.color, color: "white", fontSize: "0.65rem", mt: 0.25 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2 }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Fecha</Typography>
                  <Typography variant="body2">{format(selectedEvent.start, "EEEE d 'de' MMMM, yyyy", { locale: es })}</Typography>
                </Box>
                {selectedEvent.desc && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{selectedEvent.desc}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsModalOpen(false)} size="small">Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
