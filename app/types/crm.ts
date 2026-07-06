export interface Transaccion {
  id: string;
  tipo: "ingreso" | "egreso";
  categoria: "nomina" | "suscripcion" | "servicio" | "otro";
  monto: number;
  moneda: string;
  forma_pago: "efectivo" | "transferencia" | "tarjeta";
  descripcion?: string | null;
  comprobante_url?: string | null;
  fecha: string;
  created_at: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  nicho?: string;
  origen?: string;
  dolores?: string;
  necesidades?: string;
  intereses?: string;
  estado: "Activo" | "Inactivo";
  ultima_interaccion: string; // Corregido a snake_case para coincidir con DB
  createdAt: string;
  favorito?: boolean;
}

export interface Oportunidad {
  id: number;
  nombre: string;
  cliente_id: number | null;
  cliente_nombre: string;
  valor: number;
  etapa: "Prospección" | "Propuesta" | "Negociación" | "Cierre";
  servicios_interes?: string[];
  probabilidad: number;
  estado: string;
  created_at: string;
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: "Baja" | "Media" | "Alta";
  estado: "Pendiente" | "En progreso" | "Completada";
  tipo: "Tarea" | "Cita" | "Llamada" | "Seguimiento";
  cliente_id?: number | null;
  created_at: string;
}

export interface PlanItem {
  texto: string;
  completada: boolean;
  responsable?: string;
}

export interface TareaProyecto {
  id: string;
  nombre: string;
  completada: boolean;
  responsable: string;
  fechaLimite: string;
}

export interface RecursoProyecto {
  id: string;
  tipo: 'drive' | 'sheet' | 'calendar' | 'doc' | 'url';
  nombre: string;
  url: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  clienteId: number;
  clienteNombre: string;
  servicios: string[];
  oportunidadId?: number;
  estado: "planificacion" | "en_progreso" | "pausado" | "completado" | "cancelado";
  prioridad: "baja" | "media" | "alta" | "urgente";
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  presupuesto: number;
  costoActual: number;
  tareas: TareaProyecto[];
  recursos: RecursoProyecto[];
  montoPagado: number;
  estadoPago: "pendiente" | "parcial" | "pagado" | "vencido";
  metodoPago?: "nequi" | "daviplata" | "transferencia" | "efectivo";
  faseAdministrativa: "propuesta" | "contrato" | "onboarding" | "operacion" | "capacitacion" | "renovacion";
  onboardingChecklist: {
    [key: string]: boolean;
  };
  planContenido: {
    reels: (string | PlanItem)[];
    stories: (string | PlanItem)[];
    pauta: (string | PlanItem)[];
  };
  creadoEn: string;
  actualizadoEn: string;
}

export interface Cuota {
  id: string;
  transaccion_id: string;
  monto: number;
  fecha_vencimiento: string;
  fecha_pago?: string | null;
  estado: "pendiente" | "pagada" | "vencida" | "parcial";
  metodo_pago?: "efectivo" | "transferencia" | "tarjeta" | "nequi" | "daviplata" | "otro";
  comprobante_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: string;
  numero: string;
  cliente_id?: number | null;
  proyecto_id?: number | null;
  transaccion_id?: string | null;
  tipo: "servicio" | "producto" | "mixto";
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  estado: "borrador" | "enviada" | "pagada" | "anulada";
  fecha_emision: string;
  fecha_vencimiento?: string;
  notas?: string | null;
  json_data?: any;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: string;
  cliente_id?: number | null;
  proyecto_id?: number | null;
  tipo: "prestacion_servicios" | "acuerdo_confidencialidad" | "propiedad_intelectual" | "otro";
  titulo: string;
  contenido: string;
  variables?: Record<string, any>;
  numero?: string | null;
  estado: "borrador" | "firmado" | "activo" | "finalizado" | "cancelado";
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  valor?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PlantillaContrato {
  id: string;
  nombre: string;
  tipo: Contrato["tipo"];
  contenido: string;
  variables_definicion: { nombre: string; label: string; tipo: "texto" | "fecha" | "numero" }[];
  activa: boolean;
}

export interface Agente {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: "ventas" | "seguimiento" | "facturacion" | "soporte" | "custom";
  estado: "activo" | "pausado" | "borrador";
  prompts: string[];
  herramientas: string[];
  trigger: "manual" | "evento" | "cron" | "webhook";
  activo: boolean;
  ultima_ejecucion?: string | null;
  metricas?: {
    ejecuciones: number;
    exito: number;
    fallos: number;
  };
  created_at: string;
  updated_at: string;
}
