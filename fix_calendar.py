from pathlib import Path

p = Path('app/routes/calendario.tsx')
text = p.read_text(encoding='utf-8')

# 1. Reemplazar fetchDashboardData por cargas directas desde servicios
text = text.replace(
    '  const fetchDashboardData = useCRMStore((s) => s.fetchDashboardData);',
    '  const { clientesService, oportunidadesService, tareasService } = await import("../services/supabase");'
)

# 2. Mejorar loadEvents para usar servicios directos y no el store
text = text.replace(
    '''  const loadEvents = async () => {
    try {
      setLoading(true);
      // Cargar store + calendar_events en paralelo
      await Promise.allSettled([fetchDashboardData(), calendarEventsService.getAll()]);
      const persisted = (await calendarEventsService.getAll()) || [];
      const mapped = persisted.map((e: any): CalEvent => ({
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
      setEvents(mapped);
    } catch (error: any) {
      globalSnack.show(error?.message || "Error al cargar eventos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  };''',
    '''  const loadEvents = async () => {
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
      const derived = deriveEvents(mapped, tareasList, oppList, clientesList);
      setEvents(derived);
    } catch (error: any) {
      globalSnack.show(error?.message || "Error al cargar eventos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  };'''
)

# 3. Agregar helper deriveEvents antes del componente
helper = '''function deriveEvents(persisted: CalEvent[], tareas: any[], oportunidades: any[], clientesList: any[]): CalEvent[] {
  const base = persisted.filter((e: any) => !String(e.id).startsWith("factura-vencimiento-"));
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
  const vencimientos = persisted.filter((e: any) => String(e.id).startsWith("factura-vencimiento-"));
  const all = [...base, ...fromTareas, ...fromVentas, ...vencimientos];
  const unique = new Map(all.map((e: any) => [e.id, e]));
  return Array.from(unique.values());
}
'''
text = text.replace('export default function Calendario() {', helper + '\nexport default function Calendario() {')

# 4. Reemplazar useMemo de mapTareas/mapVentas por nada (ya están en helper)
text = text.replace(
    '''  const mapTareas = useMemo(() => {
    const list: CalEvent[] = [];
    (tareas || []).forEach((t: any) => {
      if (!t.fecha) return;
      const d = new Date(t.fecha);
      const cliente = t.cliente_id ? (clientes || []).find((c: any) => String(c.id) === String(t.cliente_id)) : null;
      const info = cliente ? ` (${cliente.nombre}${cliente.nicho ? ` - ${cliente.nicho}` : ""})` : "";
      list.push({
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
    return list;
  }, [tareas, clientes]);''',
    ''
)

text = text.replace(
    '''  const mapVentas = useMemo(() => {
    const list: CalEvent[] = [];
    (oportunidades || []).forEach((v: any) => {
      const d = new Date(v.created_at);
      d.setDate(d.getDate() + 15);
      list.push({
        id: `venta-${v.id}`,
        title: `[Cierre] ${v.nombre}`,
        start: d,
        end: d,
        allDay: true,
        type: "venta",
        color: "#e91e63",
        desc: `Oportunidad: ${v.cliente_nombre} - ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(v.valor)}`,
      });
    });
    return list;
  }, [oportunidades]);''',
    ''
)

text = text.replace(
    '''  const mapFacturasVencimientos = useMemo(() => {
    const list: CalEvent[] = [];
    (events || []).forEach((ev) => {
      if (String(ev.id).startsWith("factura-vencimiento-")) list.push(ev);
    });
    return list;
  }, [events]);''',
    ''
)

text = text.replace(
    '''  const derivedEvents = useMemo(() => {
    const base = events.filter((e) => !String(e.id).startsWith("factura-vencimiento-"));
    return [...base, ...mapTareas, ...mapVentas, ...mapFacturasVencimientos];
  }, [events, mapTareas, mapVentas, mapFacturasVencimientos]);''',
    ''
)

text = text.replace(
    '''  const filteredEvents = useMemo(() => {
    const set = new Set(derivedEvents.map((e) => e.id));
    const merged = derivedEvents.filter((e, idx) => set.has(e.id) && derivedEvents.indexOf(e) === idx);
    if (!filterType) return merged;
    return merged.filter((e) => e.type === filterType);
  }, [derivedEvents, filterType]);''',
    '''  const filteredEvents = useMemo(() => {
    const merged = events.filter((e, idx) => events.indexOf(e) === idx);
    if (!filterType) return merged;
    return merged.filter((e) => e.type === filterType);
  }, [events, filterType]);'''
)

# 5. Eliminar useMemo de mapTareas/mapVentas en el componente

p.write_text(text, encoding='utf-8')
print('calendario.tsx -> fixed loading and realtime sync')
