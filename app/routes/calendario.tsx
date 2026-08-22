import { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Paper, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, TextField, ToggleButtonGroup, ToggleButton, Tooltip
} from "@mui/material";
import { FiCalendar, FiCreditCard, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCRMStore } from "../store/useCRMStore";
import { globalSnack } from "../components/GlobalSnackbar";
import { EmptyState } from "../components/EmptyState";
import { facturasService, pagosService, calendarEventsService, clientesService, oportunidadesService, tareasService } from "../services/supabase";

const locales = { es };

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
  type: "tarea" | "venta" | "factura";
  color: string;
  desc?: string;
  facturaId?: number;
}


function deriveEvents(persisted: CalEvent[], tareas: any[], oportunidades: any[], clientesList: any[]): CalEvent[] {
  const base = persisted.filter((e) => !String(e.id).startsWith("factura-vencimiento-"));
  const fromTareas: CalEvent[] = [];
  (tareas || []).forEach((t: any) => {
    if (!t.fecha) return;
    const d = new Date(t.fecha);
    const cliente = t.cliente_id ? (clientesList || []).find((c: any) => String(c.id) === String(t.cliente_id)) : null;
    const info = cliente ? ` (${cliente.nombre}${cliente.nicho ? ` - ${cliente.nicho}` : ""})` : "";
    fromTareas.push({
      id: `tarea-${t.id}`,
      title: `[Tarea] ${t.titulo}${info}`,
      start: d,
      end: d,
      allDay: true,
      type: "tarea",
      color: t.estado === "Completada" ? "#4caf50" : "#2196f3",
      desc: t.descripcion,
    });
  });
  const fromVentas: CalEvent[] = [];
  (oportunidades || []).forEach((v: any) => {
    const d = new Date(v.created_at);
    d.setDate(d.getDate() + 15);
    fromVentas.push({
      id: `venta-${v.id}`,
      title: `[Cierre] ${v.nombre}`,
      start: d,
      end: d,
      allDay: true,
      type: "venta",
      color: "#e91e63",
      desc: `Oportunidad: ${v.cliente_nombre || ""} - ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v.valor || 0)}`,
    });
  });
  const vencimientos = persisted.filter((e) => String(e.id).startsWith("factura-vencimiento-"));
  const all = [...base, ...fromTareas, ...fromVentas, ...vencimientos];
  const unique = new Map(all.map((e) => [e.id, e]));
  return Array.from(unique.values());
}

export default function Calendario() {
  const tareas = useCRMStore((s) => s.tareas);
  const oportunidades = useCRMStore((s) => s.oportunidades);
  const clientes = useCRMStore((s) => s.clientes);

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [view, setView] = useState<string>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", start: "", end: "", allDay: true, type: "tarea" as CalEvent["type"], color: "#2196f3", desc: "" });

  useEffect(() => {
    loadEvents();
  }, []);









  const filteredEvents = useMemo(() => {
    const merged = events.filter((e, idx) => events.indexOf(e) === idx);
    if (!filterType) return merged;
    return merged.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [tareas, oportunidades, clientesData, persisted] = await Promise.all([
        tareasService.getAll(),
        oportunidadesService.getAll(),
        clientesService.getAll(),
        calendarEventsService.getAll(),
      ]);
      const tareasList = tareas || [];
      const oppList = oportunidades || [];
      const clientesList = clientesData || [];
      const mapped = (persisted || []).map((e: any): CalEvent => ({
        id: String(e.id),
        title: e.title,
        start: new Date(e.start),
        end: e.end ? new Date(e.end) : new Date(e.start),
        allDay: e.all_day || false,
        type: e.type || "tarea",
        color: e.color || "#2196f3",
        desc: e.desc || "",
        facturaId: e.factura_id || undefined,
      }));
      // Derivar eventos desde datos reales del store
      const derived = deriveEvents(mapped, tareasList, oppList, clientesList);
      setEvents(derived);
    } catch (error: any) {
      globalSnack.show(error?.message || "Error al cargar eventos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const syncFacturas = async () => {
      try {
        const data = (await facturasService.getAll()) || [];
        const vencimientos = data
          .filter((f: any) => f.fecha_vencimiento)
          .map((f: any) => {
            const date = new Date(f.fecha_vencimiento);
            return {
              id: `factura-vencimiento-${f.id}`,
              title: `[Vencimiento] Factura #${f.numero_factura || f.id}`,
              start: date,
              end: date,
              allDay: true,
              type: "tarea",
              color: f.estado === "Pagada" ? "#4caf50" : f.estado === "Vencida" ? "#f44336" : "#ff9800",
              facturaId: f.id,
              desc: `Cliente: ${f.cliente?.nombre || `Cliente #${f.cliente_id}`} - Total: $${Number(f.total || 0).toFixed(0)} - Estado: ${f.estado || "Sin estado"}`,
            } as CalEvent;
          });
        if (cancelled) return;
        setEvents((prev) => {
          const manual = prev.filter((e) => !String(e.id).startsWith("factura-vencimiento-"));
          return [...manual, ...vencimientos];
        });
      } catch {}
    };
    syncFacturas();

    // Realtime: suscribirse a cambios en calendar_events
    let channel: any;
    const initRealtime = async () => {
      try {
        const { createClient } = await import("../services/supabase");
        const supa = createClient();
        channel = supa
          .channel("calendar-realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, () => {
            loadEvents();
          })
          .subscribe();
      } catch {}
    };
    initRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        try { channel.unsubscribe(); } catch {}
      }
    };
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
        globalSnack.show("Título y fecha requeridos", "warning");
        return;
      }
      // Validar solapamiento
      const newStart = new Date(eventForm.start);
      const newEnd = eventForm.end ? new Date(eventForm.end) : newStart;
      const overlap = filteredEvents.find((ev) => {
        if (ev.id === editingEvent?.id) return false;
        const evStart = new Date(ev.start);
        const evEnd = new Date(ev.end);
        return newStart < evEnd && newEnd > evStart;
      });
      if (overlap) {
        globalSnack.show(`Solapamiento con: ${overlap.title}`, "warning");
        return;
      }
      const start = new Date(eventForm.start);
      const end = eventForm.end ? new Date(eventForm.end) : start;
      const title = eventForm.type === "tarea" ? `[Tarea] ${eventForm.title}` : eventForm.type === "venta" ? `[Cierre] ${eventForm.title}` : eventForm.title;
      const color = eventForm.type === "tarea" ? "#2196f3" : eventForm.type === "venta" ? "#e91e63" : eventForm.color;
      const payload = {
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        all_day: eventForm.allDay,
        type: eventForm.type,
        color,
        desc: eventForm.desc,
        factura_id: editingEvent?.facturaId || null,
      };

      if (editingEvent) {
        await calendarEventsService.update(Number(editingEvent.id), payload);
        globalSnack.show("Evento actualizado", "success");
      } else {
        await calendarEventsService.create(payload as any);
        globalSnack.show("Evento creado", "success");
      }
      setEventModalOpen(false);
      loadEvents();
    } catch (err: any) {
      globalSnack.show(err.message || "Error guardando evento", "error");
    }
  };

  const handleDeleteEvent = async (evt: CalEvent) => {
    if (!confirm(`¿Eliminar evento "${evt.title}"?`)) return;
    try {
      if (String(evt.id).startsWith("factura-vencimiento-")) {
        globalSnack.show("Los vencimientos se sincronizan desde facturación.", "warning");
        return;
      }
      await calendarEventsService.remove(Number(evt.id));
      globalSnack.show("Evento eliminado", "success");
      setIsModalOpen(false);
      loadEvents();
    } catch (err: any) {
      globalSnack.show(err.message || "Error eliminando evento", "error");
    }
  };

  const eventStyleGetter = (event: CalEvent) => {
    const isToday = new Date().toDateString() === new Date(event.start).toDateString();
    return {
      style: {
        backgroundColor: event.color,
        color: "#fff",
        border: `2px solid ${event.color}`,
        borderRadius: "8px",
        padding: "2px 6px",
        fontSize: "12px",
        fontWeight: 600,
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        boxShadow: isToday ? "0 0 0 2px rgba(0,0,0,0.15)" : "none",
      },
    };
  };

  const handleQuickPay = async () => {
    try {
      if (!selectedEvent?.facturaId) return;
      const all = await facturasService.getAll();
      const factura = (all || []).find((x: any) => x.id === selectedEvent.facturaId);
      const total = Number(factura.total || 0);
      const saldo = Number(factura.saldo_pendiente ?? total);
      const telefono = factura.cliente?.telefono || "";
      const clienteNombre = factura.cliente?.nombre || `Cliente #${factura.cliente_id}`;
      const texto = encodeURIComponent(`Hola ${clienteNombre}, te compartimos tu factura #${factura.numero_factura || factura.id} por $${total.toFixed(0)}. Saldo pendiente: $${saldo.toFixed(0)}. Estado: ${factura.estado || "Borrador"}. Fecha vencimiento: ${factura.fecha_vencimiento || "Sin definir"}. Ante cualquier duda respondé este mensaje.`);
      if (telefono) {
        if (typeof window !== "undefined") window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
        globalSnack.show("Abriendo WhatsApp...", "info");
      } else {
        globalSnack.show("El cliente no tiene teléfono cargado", "warning");
      }
    } catch (err: any) { globalSnack.show(err.message || "Error", "error"); }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={60} sx={{ color: '#e91e63' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1, sm: 1.5, md: 2 },
      height: "100%",
      minHeight: { xs: 580, sm: 640 },
      display: "flex",
      flexDirection: "column",
      gap: { xs: 1, sm: 1.5 }
    }}>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        flexWrap: "wrap",
        justifyContent: "space-between"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <FiCalendar size={20} color="#1976d2" />
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>Calendario</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, next) => next && setView(next)}
          >
            <ToggleButton value={Views.MONTH}>Mes</ToggleButton>
            <ToggleButton value={Views.WEEK}>Semana</ToggleButton>
            <ToggleButton value={Views.DAY}>Día</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Chip label="Todos" onClick={() => setFilterType("")} color={filterType === "" ? "primary" : "default"} size="small" />
            <Chip label="Tareas" onClick={() => setFilterType("tarea")} color={filterType === "tarea" ? "info" : "default"} size="small" />
            <Chip label="Cierres" onClick={() => setFilterType("venta")} color={filterType === "venta" ? "error" : "default"} size="small" />
            <Chip label="Vencimientos" onClick={() => setFilterType("factura")} color={filterType === "factura" ? "warning" : "default"} size="small" />
          </Box>
          <Button size="small" variant="contained" startIcon={<FiPlus size={14} />} onClick={handleOpenCreateEvent}>Nuevo</Button>
        </Box>
      </Box>

      <Box sx={{
        p: { xs: 0.75, sm: 1 },
        flex: 1,
        borderRadius: 1.5,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        width: "100%",
        "& .rbc-calendar": {
          width: "100%"
        }
      }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", minHeight: { xs: 520, sm: 640 }, width: "100%" }}
          culture="es"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={(slotInfo: any) => {
            const start = new Date(slotInfo.start);
            const end = new Date(slotInfo.end || slotInfo.start);
            const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setEventForm({ title: "", start: toLocal(start), end: toLocal(end), allDay: slotInfo.allDay || false, type: "tarea", color: "#2196f3", desc: "" });
            setEditingEvent(null);
            setEventModalOpen(true);
          }}
          selectable
          eventPropGetter={eventStyleGetter}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          components={{ toolbar: () => null }}
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
        {!loading && !events?.length && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>Sin eventos aún</Typography>
            <Typography variant="caption" color="text.secondary">Creá el primer evento para comenzar.</Typography>
          </Box>
        )}
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: selectedEvent.color }} />
              <Tooltip title={selectedEvent.desc || selectedEvent.title} arrow>
                <Box sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "help" }}>{selectedEvent.title}</Box>
              </Tooltip>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 2 }}>
                {selectedEvent.desc || "Sin descripción."}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, color: "text.secondary", fontSize: "0.9rem" }}>
                <Typography variant="body2">
                  <strong>Fecha:</strong> {format(selectedEvent.start, "dd 'de' MMMM, yyyy", { locale: es })}
                </Typography>
                <Chip size="small" label={selectedEvent.type} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Tooltip title="Editar evento"><Button startIcon={<FiEdit2 size={14} />} onClick={() => handleOpenEditEvent(selectedEvent)}>Editar</Button></Tooltip>
              <Tooltip title="Eliminar evento"><Button startIcon={<FiTrash2 size={14} />} color="error" onClick={() => handleDeleteEvent(selectedEvent)}>Eliminar</Button></Tooltip>
              {selectedEvent.facturaId && <Button startIcon={<FiCreditCard size={14} />} onClick={handleQuickPay}>Cobrar por WhatsApp</Button>}
              <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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
