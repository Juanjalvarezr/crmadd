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