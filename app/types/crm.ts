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
  lead_score?: number; // Sistema de scoring de leads (0-100)
  lead_score_last_updated?: string; // Fecha última actualización del score
}

export interface Oportunidad {
  id: number;
  nombre: string;
  cliente_id: number | null;
  cliente_nombre: string;
  valor: number;
  etapa: "Prospección" | "Propuesta" | "Negociación" | "Cierre" | "Perdida";
  servicios_interes?: string[];
  probabilidad: number;
  estado: string;
  created_at: string;

  // Mejoras ejecutables
  agente_id?: string | null;
  agente_nombre?: string | null;
  motivo_perdida?: string | null;
  motivo_perdida_detalle?: string | null;
  seguimientos?: Array<{
    id: string;
    fecha: string;
    tipo: "Cita" | "Llamada" | "WhatsApp" | "Email" | "Nota";
    nota: string;
    usuario: string;
    created_at: string;
  }>;
  meta_id?: string | null;
  fecha_cierre_esperada?: string | null;
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

export interface Servicio {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio_base: number;
  duracion: string;
  incluye: string[];
  estado: "Activo" | "Inactivo";
  popularidad: number;
  tipo: 'paquete' | 'individual';
  paquete_dias?: 3 | 5 | 7;
  objetivo?: string[];
  incluye_paquete?: string[];
  precio_paquete?: number;
  created_at: string;
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
  cronograma: {
    paquete: '3_dias' | '5_dias' | '7_dias' | 'mensual';
    objetivos: string[];
    duracionDias: number;
    items: {
      dia: number;
      checklist: { texto: string; completada: boolean; responsable?: string }[];
      reels: { texto: string; gancho: string; estado: 'pendiente' | 'grabado' | 'editado' | 'publicado' }[];
      stories: { texto: string; estado: 'pendiente' | 'publicada' }[];
    }[];
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
  proyecto_id?: string | null;
  transaccion_id?: string | null;
  tipo: "servicio" | "producto" | "mixto";
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  estado: "borrador" | "enviada" | "pagada" | "anulada";
  estado_pago?: "pendiente" | "parcial" | "pagado" | "vencido" | null;
  metodo_pago?: "efectivo" | "transferencia" | "tarjeta" | "nequi" | "daviplata" | "otro" | null;
  abonos?: { monto: number; fecha: string; metodo?: string }[] | null;
  pdf_url?: string | null;
  enviada_por?: ("email" | "whatsapp")[] | null;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
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

  // Mejoras
  fecha_renovacion?: string | null;
  alerta_renovacion_dias?: number | null;
  firmado_en?: string | null;
  firma_datos?: {
    nombre: string;
    dni?: string;
    fecha: string;
    ip?: string;
    dispositivo?: string;
  } | null;
  bloqueado_post_firma?: boolean | null;
  version?: number | null;
  factura_id?: string | null;
  obligaciones?: {
    descripcion: string;
    fecha_vencimiento?: string | null;
    estado: "pendiente" | "cumplida" | "vencida" | string;
  }[] | null;
  vencimientos?: {
    descripcion: string;
    fecha: string;
    recordatorio_dias: number;
    cumplido: boolean;
  }[] | null;
}

export interface PlantillaContrato {
  id: string;
  nombre: string;
  tipo: Contrato["tipo"];
  contenido: string;
  variables_definicion: { nombre: string; label: string; tipo: "texto" | "fecha" | "numero" }[];
  activa: boolean;
}

export interface ContratoVersion {
  id: string;
  contrato_id: string;
  version: number;
  contenido: string;
  variables?: Record<string, any> | null;
  cambios?: Record<string, any> | null;
  usuario?: string | null;
  created_at: string;
}

export interface ContratoClausula {
  id: string;
  tipo: Contrato["tipo"];
  titulo: string;
  contenido: string;
  orden: number;
  activa: boolean;
  created_at: string;
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
